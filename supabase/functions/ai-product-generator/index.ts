
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://digital-marketing-ecommercev2.vercel.app",
  "https://digital-marketing-app-v2-digitalmarketing5.vercel.app",
];

function getCorsHeaders(origin: string | null) {
  const isAllowed =
    origin !== null && allowedOrigins.includes(origin);

  return {
    ...(isAllowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle browser preflight requests.
  if (req.method === "OPTIONS") {
    if (!origin || !allowedOrigins.includes(origin)) {
      return new Response("Origin not allowed", {
        status: 403,
        headers: corsHeaders,
      });
    }

    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "POST request required." },
      405,
      corsHeaders,
    );
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return jsonResponse(
      { error: "Origin not allowed." },
      403,
      corsHeaders,
    );
  }

  try {
    // Read backend secrets.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey || !geminiKey) {
      console.error("Required backend secrets are missing.");

      return jsonResponse(
        {
          error:
            "Backend configuration is incomplete. Check the Supabase secrets.",
        },
        500,
        corsHeaders,
      );
    }

    // Require a signed-in user.
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Please sign in first." },
        401,
        corsHeaders,
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await userClient.auth.getUser();

    if (authError || !authData.user) {
      return jsonResponse(
        { error: "Invalid or expired session. Please sign in again." },
        401,
        corsHeaders,
      );
    }

    // Only admins can generate and save catalogue products.
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Admin profile verification failed:",
        profileError.message,
      );

      return jsonResponse(
        { error: "Unable to verify admin access." },
        500,
        corsHeaders,
      );
    }

    if (String(profile?.role ?? "").toLowerCase() !== "admin") {
      return jsonResponse(
        { error: "Admin access required." },
        403,
        corsHeaders,
      );
    }

    // Read and validate request JSON.
    let body: Record<string, unknown>;

    try {
      const parsedBody: unknown = await req.json();

      if (
        !parsedBody ||
        typeof parsedBody !== "object" ||
        Array.isArray(parsedBody)
      ) {
        return jsonResponse(
          { error: "Request body must be a JSON object." },
          400,
          corsHeaders,
        );
      }

      body = parsedBody as Record<string, unknown>;
    } catch {
      return jsonResponse(
        { error: "Request body must be valid JSON." },
        400,
        corsHeaders,
      );
    }

    const category = String(body.category ?? "").trim();

    if (!category || category.length > 100) {
      return jsonResponse(
        { error: "A valid category is required." },
        400,
        corsHeaders,
      );
    }

    // Service-role client stays inside this backend function only.
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Match the actual database column: category_name.
    const { data: categoryRow, error: categoryError } =
      await adminClient
        .from("product_categories")
        .select("category_name, target_products")
        .eq("category_name", category)
        .maybeSingle();

    if (categoryError) {
      console.error(
        "Category query failed:",
        JSON.stringify(categoryError),
      );

      return jsonResponse(
        { error: "Unable to load product category." },
        500,
        corsHeaders,
      );
    }

    if (!categoryRow) {
      return jsonResponse(
        {
          error: `Category "${category}" was not found in product_categories.`,
        },
        404,
        corsHeaders,
      );
    }

    // Never generate more than five products per category.
    const target = Math.min(
      5,
      Math.max(0, Number(categoryRow.target_products) || 0),
    );

    // Load existing premium products for this category.
    const { data: existing, error: existingError } = await adminClient
      .from("products")
      .select("name")
      .eq("category", category)
      .eq("is_premium_catalog", true);

    if (existingError) {
      console.error(
        "Existing product lookup failed:",
        existingError.message,
      );

      return jsonResponse(
        { error: "Unable to check existing products." },
        500,
        corsHeaders,
      );
    }

    const existingProducts = existing ?? [];

    const existingNames = new Set(
      existingProducts.map((product) =>
        String(product.name ?? "").trim().toLowerCase()
      ),
    );

    const remaining = Math.max(0, target - existingProducts.length);

    if (remaining === 0) {
      return jsonResponse(
        {
          success: true,
          category,
          inserted: 0,
          products: [],
          message: "This category already has its premium target.",
        },
        200,
        corsHeaders,
      );
    }

    // Ask Gemini for only the missing products.
    const prompt = `
Generate exactly ${remaining} distinct premium product suggestions
for the product category: "${category}".

Return a JSON array. Each array item must contain:
- "name": a specific product name
- "price": a positive estimated retail price in USD
- "image_url": an HTTPS URL for a relevant product image

Rules:
- Do not use any of these existing product names:
${Array.from(existingNames).join("\n")}
- Use different product names.
- Use realistic estimated prices.
- Do not claim products are in stock or officially verified.
- Return JSON only, without Markdown or explanations.
`;

    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    // Log the actual provider error in Supabase logs, not in the public response.
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();

      console.error("Gemini HTTP status:", aiResponse.status);
      console.error("Gemini error response:", errorText);

      return jsonResponse(
        {
          error: "Gemini request failed. Check the function logs.",
          status: aiResponse.status,
        },
        502,
        corsHeaders,
      );
    }

    const aiData = await aiResponse.json();

    const generatedText =
      aiData?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("");

    if (typeof generatedText !== "string" || !generatedText.trim()) {
      console.error(
        "Gemini returned no usable text:",
        JSON.stringify({
          promptFeedback: aiData?.promptFeedback,
          candidateFinishReason: aiData?.candidates?.[0]?.finishReason,
        }),
      );

      return jsonResponse(
        { error: "Gemini returned no product data." },
        502,
        corsHeaders,
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(generatedText);
    } catch {
      console.error("Gemini returned invalid JSON.");

      return jsonResponse(
        { error: "Gemini returned invalid JSON product data." },
        502,
        corsHeaders,
      );
    }

    if (!Array.isArray(parsed)) {
      return jsonResponse(
        { error: "Invalid AI response format." },
        502,
        corsHeaders,
      );
    }

    // Validate every generated product before inserting it.
    const inserts: Array<{
      name: string;
      store: string;
      price: number;
      image_url: string;
      category: string;
      is_premium_catalog: boolean;
    }> = [];

    for (const item of parsed) {
      if (inserts.length >= remaining) break;

      if (!item || typeof item !== "object" || Array.isArray(item)) {
        continue;
      }

      const product = item as Record<string, unknown>;
      const name = String(product.name ?? "").trim();
      const price = Number(product.price);
      const imageUrl = String(product.image_url ?? "").trim();

      let parsedUrl: URL;

      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        continue;
      }

      if (
        !name ||
        name.length > 180 ||
        !Number.isFinite(price) ||
        price <= 0 ||
        price > 1000000 ||
        parsedUrl.protocol !== "https:" ||
        !parsedUrl.hostname ||
        existingNames.has(name.toLowerCase())
      ) {
        continue;
      }

      existingNames.add(name.toLowerCase());

      inserts.push({
        name,
        store: "AI Generated Catalogue",
        price: Number(price.toFixed(2)),
        image_url: imageUrl,
        category,
        is_premium_catalog: true,
      });
    }

    if (inserts.length === 0) {
      console.error(
        "Gemini output contained no valid, unique products.",
      );

      return jsonResponse(
        {
          error:
            "No valid new products generated. Try again or check the AI response.",
        },
        422,
        corsHeaders,
      );
    }

    // Save products to Supabase.
    const { data: savedProducts, error: insertError } =
      await adminClient
        .from("products")
        .insert(inserts)
        .select(
          "id, name, category, price, image_url, is_premium_catalog",
        );

    if (insertError) {
      console.error(
        "Product insertion failed:",
        insertError.message,
      );

      return jsonResponse(
        { error: "Unable to save generated products." },
        500,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        success: true,
        category,
        inserted: savedProducts?.length ?? 0,
        products: savedProducts ?? [],
        message: "AI products generated and saved successfully.",
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("AI product generator error:", error);

    return jsonResponse(
      { error: "Server error while generating products." },
      500,
      corsHeaders,
    );
  }
});
