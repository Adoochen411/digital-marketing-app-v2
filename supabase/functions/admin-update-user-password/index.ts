
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

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  try {
    if (req.method !== "POST") {
      return respond({ success: false, message: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceKey) {
      throw new Error("Server-side service role secret is not configured.");
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
      return respond({ success: false, message: "Invalid login session" }, 401);
    }

    const body = await req.json();
    const targetUserId = body.target_user_id;
    const newPassword = body.new_password;

    if (
      typeof targetUserId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)
    ) {
      return respond({ success: false, message: "Invalid customer ID" }, 400);
    }

    if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 72) {
      return respond({
        success: false,
        message: "Password must be between 6 and 72 characters.",
      }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify the logged-in operator's database role.
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

    // Sub-admins need customer-management permission and assignment.
    if (!isMainAdmin) {
      const { data: subAdmin, error: subError } = await adminClient
        .from("sub_admins")
        .select("id, permissions")
        .ilike("email", actor.email ?? "")
        .maybeSingle();

      if (subError) throw subError;

      if (
        !subAdmin ||
        subAdmin.permissions?.users !== true
      ) {
        return respond({
          success: false,
          message: "Customer management permission required",
        }, 403);
      }

      const { data: target, error: targetError } = await adminClient
        .from("profiles")
        .select("id, sub_admin_id")
        .eq("id", targetUserId)
        .maybeSingle();

      if (targetError) throw targetError;

      if (!target || target.sub_admin_id !== subAdmin.id) {
        return respond({
          success: false,
          message: "Customer is not assigned to this Sub-Admin",
        }, 403);
      }
    }

    // Update the actual Supabase Auth password, not a profiles column.
    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      });

    if (updateError) {
      return respond({ success: false, message: updateError.message }, 400);
    }

    return respond({ success: true, message: "Login password updated successfully" });
  } catch (error) {
    console.error("Admin password update failed:", error);

    return respond({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Could not update login password",
    }, 500);
  }
});
