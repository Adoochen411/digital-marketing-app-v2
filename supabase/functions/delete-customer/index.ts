
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  try {
    if (req.method !== "POST") {
      return json({ success: false, message: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mainAdminEmail = (
      Deno.env.get("MAIN_ADMIN_EMAIL") || ""
    ).trim().toLowerCase();

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !mainAdminEmail) {
      return json({
        success: false,
        message: "Server configuration is incomplete",
      }, 500);
    }

    // Authenticated Supabase session verify karein.
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, message: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return json({ success: false, message: "Invalid session" }, 401);
    }

    const caller = authData.user;
    const callerEmail = (caller.email || "").trim().toLowerCase();

    // Sirf configured Main Admin allowed hai.
    if (callerEmail !== mainAdminEmail) {
      return json({ success: false, message: "Main Admin access required" }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Database mein Main Admin profile verify karein.
    const { data: adminProfile, error: adminProfileError } =
      await adminClient
        .from("profiles")
        .select("id, email, role, is_subadmin")
        .eq("id", caller.id)
        .maybeSingle();

    if (
      adminProfileError ||
      !adminProfile ||
      adminProfile.email?.trim().toLowerCase() !== mainAdminEmail ||
      adminProfile.role?.trim().toLowerCase() !== "admin" ||
      adminProfile.is_subadmin !== false
    ) {
      return json({ success: false, message: "Main Admin verification failed" }, 403);
    }

    const body = await req.json();
    const userId = body?.userId;

    // UUID validate karein.
    if (
      typeof userId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
    ) {
      return json({ success: false, message: "Valid customer ID required" }, 400);
    }

    if (userId === caller.id) {
      return json({ success: false, message: "You cannot delete your own account" }, 400);
    }

    // Sirf customer role delete ho; admin/sub-admin nahi.
    const { data: customer, error: customerError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (customerError || !customer) {
      return json({ success: false, message: "Customer not found" }, 404);
    }

    if (customer.role?.trim().toLowerCase() !== "user") {
      return json({
        success: false,
        message: "Only customer accounts can be deleted",
      }, 403);
    }

    // Database RPC: customer aur uske related records delete karein.
    const { data, error } = await adminClient.rpc(
      "delete_customer_completely",
      { p_user_id: userId }
    );

    if (error) {
      console.error("Customer deletion RPC failed:", error);
      return json({
        success: false,
        message: "Customer deletion failed",
      }, 500);
    }

    return json({
      success: true,
      message: "Customer and related records deleted successfully",
      result: data,
    });
  } catch (error) {
    console.error("Delete customer function error:", error);

    return json({
      success: false,
      message: "Unexpected server error",
    }, 500);
  }
});
