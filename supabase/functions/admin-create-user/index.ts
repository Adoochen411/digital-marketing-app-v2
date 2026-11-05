
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return respond({ success: false, message: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceKey) {
      throw new Error("Service role key is not configured.");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return respond({ success: false, message: "Authentication required" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user: caller },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !caller) {
      return respond({ success: false, message: "Invalid admin session" }, 401);
    }

    const body = await req.json();

    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;
    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";
    const invitationCode =
      typeof body.invitation_code === "string"
        ? body.invitation_code.trim()
        : "";

    if (!username || username.length > 100) {
      return respond({ success: false, message: "Valid username is required." }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respond({ success: false, message: "Valid email is required." }, 400);
    }

    if (
      typeof password !== "string" ||
      password.length < 6 ||
      password.length > 72
    ) {
      return respond({
        success: false,
        message: "Password must be between 6 and 72 characters.",
      }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: actor, error: actorError } = await adminClient
      .from("profiles")
      .select("id, email, role, is_subadmin")
      .eq("id", caller.id)
      .maybeSingle();

    if (actorError) throw actorError;

    if (!actor || actor.role !== "admin") {
      return respond({ success: false, message: "Admin authorization required" }, 403);
    }

    const isMainAdmin = actor.is_subadmin === false;
    let assignedSubAdminId: string | null = null;

    if (!isMainAdmin) {
      const { data: subAdmin, error: subError } = await adminClient
        .from("sub_admins")
        .select("id, permissions")
        .ilike("email", actor.email ?? "")
        .maybeSingle();

      if (subError) throw subError;

      if (!subAdmin || subAdmin.permissions?.users !== true) {
        return respond({
          success: false,
          message: "Customer management permission required",
        }, 403);
      }

      assignedSubAdminId = subAdmin.id;
    }

    // Create Auth account without changing the current admin session.
    const { data: authData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          phone: phone || null,
        },
      });

    if (createError || !authData.user) {
      return respond({
        success: false,
        message: createError?.message || "Could not create Auth account",
      }, 400);
    }

    const newUserId = authData.user.id;

    const profileData: Record<string, unknown> = {
      id: newUserId,
      email,
      username,
      full_name: username,
      phone: phone || null,
      invitation_code: invitationCode || null,
      role: "user",
      is_subadmin: false,
    };

    if (assignedSubAdminId) {
      profileData.sub_admin_id = assignedSubAdminId;
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .insert(profileData)
      .select("id, custom_id, username, email, phone")
      .single();

    if (profileError) {
      // Roll back Auth account if profile creation fails.
      await adminClient.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    return respond({
      success: true,
      message: "Customer created successfully.",
      user: profile,
    });

  } catch (error) {
    console.error("Admin create user failed:", error);

    return respond({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Could not create customer.",
    }, 500);
  }
});
