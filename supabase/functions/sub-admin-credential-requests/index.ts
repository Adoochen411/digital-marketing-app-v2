import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function hashVerificationCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAIN_ADMIN_EMAIL = "adoochen64@gmail.com";

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

  if (req.method !== "POST") {
    return respond({ success: false, message: "Method not allowed" }, 405);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !anonKey || !serviceKey) {
      return respond(
        { success: false, message: "Server configuration missing" },
        500,
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return respond({ success: false, message: "Login required" }, 401);
    }

    const userClient = createClient(url, anonKey, {
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

    const caller = authData.user;

    if (authError || !caller) {
      return respond({ success: false, message: "Invalid login session" }, 401);
    }

    const db = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: actor, error: actorError } = await db
      .from("profiles")
      .select("id, email, role, is_subadmin")
      .eq("id", caller.id)
      .maybeSingle();

    if (actorError) throw actorError;

    if (!actor || actor.role !== "admin") {
      return respond({ success: false, message: "Admin access required" }, 403);
    }

    const isMainAdmin =
      actor.is_subadmin === false &&
      (caller.email ?? "").toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();

    const isSubAdmin = actor.is_subadmin === true;
console.log("Credential request admin check:", {
  callerId: caller.id,
  callerEmail: caller.email ?? null,
  actorEmail: actor.email ?? null,
  actorRole: actor.role,
  actorIsSubadmin: actor.is_subadmin,
  isMainAdmin,
  isSubAdmin,
});
    if (!isMainAdmin && !isSubAdmin) {
      return respond({ success: false, message: "Unauthorized account" }, 403);
    }

    const body = await req.json();
    const action = body.action;

    // --------------------------------------------------
    // 1. Sub-Admin submits an email or password request.
    // --------------------------------------------------
    if (action === "submit_request") {
      if (!isSubAdmin) {
        return respond(
          {
            success: false,
            message: "Only Sub-Admins can submit requests",
          },
          403,
        );
      }

      const requestType = body.request_type;

      const requestedEmail =
        typeof body.requested_email === "string"
          ? body.requested_email.trim().toLowerCase()
          : "";

      if (requestType !== "email" && requestType !== "password") {
        return respond(
          { success: false, message: "Invalid request type" },
          400,
        );
      }

      if (
        requestType === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)
      ) {
        return respond(
          { success: false, message: "Enter a valid new email" },
          400,
        );
      }

      const currentEmail = (caller.email ?? "").toLowerCase();

      const { data: subAdmin, error: subError } = await db
        .from("sub_admins")
        .select("id, email")
        .ilike("email", caller.email ?? "")
        .maybeSingle();

      if (subError) throw subError;

      if (!subAdmin) {
        return respond(
          { success: false, message: "Sub-Admin record not found" },
          403,
        );
      }

      if (requestType === "email" && requestedEmail === currentEmail) {
        return respond(
          {
            success: false,
            message: "New email matches current email",
          },
          400,
        );
      }

      const { data: existing, error: existingError } = await db
        .from("sub_admin_credential_requests")
        .select("id")
        .eq("sub_admin_id", subAdmin.id)
        .in("status", ["pending", "verified"])
        .limit(1);

      if (existingError) throw existingError;

      if (existing?.length) {
        return respond(
          {
            success: false,
            message: "You already have a pending or approved request",
          },
          409,
        );
      }

      const { data: request, error: insertError } = await db
        .from("sub_admin_credential_requests")
        .insert({
          sub_admin_id: subAdmin.id,
          request_type: requestType,
          requested_email: requestType === "email" ? requestedEmail : null,
          status: "pending",
          verification_code_hash: null,
          verified_at: null,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select(
          "id, request_type, requested_email, status, created_at, expires_at",
        )
        .single();

      if (insertError) throw insertError;

      const notificationMessage =
        "Credential change request: " +
        String(requestType) +
        " from " +
        String(caller.email ?? subAdmin.email) +
        ". Request ID: " +
        String(request.id);

      const { error: notificationError } = await db
        .from("admin_notifications")
        .insert({
          sub_admin_email: caller.email ?? subAdmin.email,
          message: notificationMessage,
        });

      if (notificationError) {
        console.error("Notification insert failed:", notificationError.message);
      }

      return respond({
        success: true,
        message: "Request sent to Main Admin for approval",
        request,
      });
    }

    // --------------------------------------------------
    // 2. Main Admin generates a one-time verification code.
    // The plaintext code is returned once and is not stored.
    // --------------------------------------------------
    if (action === "generate_verification_code") {
      if (!isMainAdmin) {
        return respond(
          {
            success: false,
            message: "Main Admin access required",
          },
          403,
        );
      }

      const requestId = String(body.request_id ?? "").trim();

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId,
        )
      ) {
        return respond(
          {
            success: false,
            message: "Valid request ID is required",
          },
          400,
        );
      }

      const { data: request, error: requestError } = await db
        .from("sub_admin_credential_requests")
        .select("id, status, expires_at")
        .eq("id", requestId)
        .maybeSingle();

      if (requestError) throw requestError;

      if (!request || request.status !== "pending") {
        return respond(
          {
            success: false,
            message: "Request is not pending",
          },
          400,
        );
      }

      if (
        request.expires_at &&
        new Date(request.expires_at).getTime() <= Date.now()
      ) {
        await db
          .from("sub_admin_credential_requests")
          .update({
            status: "expired",
            verification_code_hash: null,
          })
          .eq("id", requestId)
          .eq("status", "pending");

        return respond({ success: false, message: "Request has expired" }, 410);
      }

      // Generate a cryptographically random six-digit code.
      const random = crypto.getRandomValues(new Uint32Array(1))[0];

      const code = String(random % 1_000_000).padStart(6, "0");
      const codeHash = await hashVerificationCode(code);

      // The existing expires_at column is reused for the
      // 15-minute verification window.
      const { data: updated, error: updateError } = await db
        .from("sub_admin_credential_requests")
        .update({
          verification_code_hash: codeHash,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;

      if (!updated) {
        return respond(
          {
            success: false,
            message: "Request was already processed",
          },
          409,
        );
      }

      return respond({
        success: true,
        request_id: requestId,
        verification_code: code,
        message: "Code generated. It expires in 15 minutes.",
      });
    }

    // --------------------------------------------------
    // 3. Main Admin verifies the code and approves/rejects.
    // Approval cannot happen without the correct code.
    // Rejection does not require a code.
    // --------------------------------------------------
    if (action === "review_request") {
      if (!isMainAdmin) {
        return respond(
          {
            success: false,
            message: "Only Main Admin can review requests",
          },
          403,
        );
      }

      const requestId = body.request_id;
      const decision = body.decision;

      if (
        typeof requestId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId,
        ) ||
        !["approve", "reject"].includes(decision)
      ) {
        return respond(
          {
            success: false,
            message: "Invalid request ID or decision",
          },
          400,
        );
      }

      const { data: request, error: requestError } = await db
        .from("sub_admin_credential_requests")
        .select(
          "id, sub_admin_id, request_type, requested_email, status, expires_at, verification_code_hash",
        )
        .eq("id", requestId)
        .maybeSingle();

      if (requestError) throw requestError;

      if (!request || request.status !== "pending") {
        return respond(
          {
            success: false,
            message: "Request not found or already reviewed",
          },
          404,
        );
      }

      if (
        request.expires_at &&
        new Date(request.expires_at).getTime() <= Date.now()
      ) {
        await db
          .from("sub_admin_credential_requests")
          .update({
            status: "expired",
            verification_code_hash: null,
          })
          .eq("id", request.id)
          .eq("status", "pending");

        return respond({ success: false, message: "Request has expired" }, 410);
      }

      if (decision === "approve") {
        const verificationCode =
          typeof body.verification_code === "string"
            ? body.verification_code.trim()
            : "";

        if (!/^\d{6}$/.test(verificationCode)) {
          return respond(
            {
              success: false,
              message: "Enter the six-digit verification code before approval",
            },
            400,
          );
        }

        if (!request.verification_code_hash) {
          return respond(
            {
              success: false,
              message:
                "Generate a verification code before approving this request",
            },
            400,
          );
        }

        const suppliedHash = await hashVerificationCode(verificationCode);

        if (suppliedHash !== request.verification_code_hash) {
          return respond(
            {
              success: false,
              message: "Incorrect verification code",
            },
            400,
          );
        }
      }

      const newStatus = decision === "approve" ? "verified" : "rejected";

      const { data: updated, error: updateError } = await db
        .from("sub_admin_credential_requests")
        .update({
          status: newStatus,
          verified_at: decision === "approve" ? new Date().toISOString() : null,
          verification_code_hash: null,
        })
        .eq("id", request.id)
        .eq("status", "pending")
        .select("id, request_type, requested_email, status, sub_admin_id")
        .maybeSingle();

      if (updateError) throw updateError;

      if (!updated) {
        return respond(
          {
            success: false,
            message: "Request was already processed",
          },
          409,
        );
      }

      const { data: subAdmin } = await db
        .from("sub_admins")
        .select("email")
        .eq("id", request.sub_admin_id)
        .maybeSingle();

      const { error: notificationError } = await db
        .from("admin_notifications")
        .insert({
          sub_admin_email: subAdmin?.email ?? "",
          message:
            "Credential change request " +
            String(decision) +
            ". Request ID: " +
            String(request.id),
        });

      if (notificationError) {
        console.error("Notification insert failed:", notificationError.message);
      }

      return respond({
        success: true,
        message:
          decision === "approve"
            ? "Request approved. The credential change must now be completed."
            : "Request rejected.",
        request: updated,
      });
    }

    // --------------------------------------------------
    // 4. Sub-Admin completes an approved password change.
    // --------------------------------------------------
    if (action === "complete_password_change") {
      if (!isSubAdmin) {
        return respond(
          {
            success: false,
            message: "Only Sub-Admins can change their own password",
          },
          403,
        );
      }

      const requestId = body.request_id;
      const newPassword = body.new_password;

      if (
        typeof requestId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId,
        )
      ) {
        return respond({ success: false, message: "Invalid request ID" }, 400);
      }

      if (
        typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        newPassword.length > 72
      ) {
        return respond(
          {
            success: false,
            message: "Password must be 8–72 characters",
          },
          400,
        );
      }

      const { data: subAdmin, error: subError } = await db
        .from("sub_admins")
        .select("id")
        .ilike("email", caller.email ?? "")
        .maybeSingle();

      if (subError) throw subError;

      if (!subAdmin) {
        return respond(
          {
            success: false,
            message: "Sub-Admin record not found",
          },
          403,
        );
      }

      const { data: request, error: requestError } = await db
        .from("sub_admin_credential_requests")
        .select("id, status, expires_at")
        .eq("id", requestId)
        .eq("sub_admin_id", subAdmin.id)
        .eq("request_type", "password")
        .maybeSingle();

      if (requestError) throw requestError;

      if (!request || request.status !== "verified") {
        return respond(
          {
            success: false,
            message: "An approved password request is required",
          },
          403,
        );
      }

      if (
        request.expires_at &&
        new Date(request.expires_at).getTime() <= Date.now()
      ) {
        await db
          .from("sub_admin_credential_requests")
          .update({ status: "expired" })
          .eq("id", request.id)
          .eq("status", "verified");

        return respond(
          { success: false, message: "Approval has expired" },
          410,
        );
      }

      const { error: passwordError } = await db.auth.admin.updateUserById(
        caller.id,
        {
          password: newPassword,
        },
      );

      if (passwordError) throw passwordError;

      const { error: completeError } = await db
        .from("sub_admin_credential_requests")
        .update({ status: "completed" })
        .eq("id", request.id)
        .eq("status", "verified");

      if (completeError) throw completeError;

      return respond({
        success: true,
        message: "Password changed successfully",
      });
    }

    // --------------------------------------------------
    // 5. Sync an email after the Sub-Admin confirms the
    // email change through Supabase Auth.
    // --------------------------------------------------
    if (action === "sync_confirmed_email") {
      if (!isSubAdmin || !caller.email) {
        return respond(
          {
            success: false,
            message: "Sub-Admin session required",
          },
          403,
        );
      }

      const requestId = body.request_id;

      if (
        typeof requestId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId,
        )
      ) {
        return respond({ success: false, message: "Invalid request ID" }, 400);
      }

      const confirmedEmail = caller.email.trim().toLowerCase();

      const { data: request, error: requestError } = await db
        .from("sub_admin_credential_requests")
        .select("id, sub_admin_id, requested_email, status, expires_at")
        .eq("id", requestId)
        .eq("request_type", "email")
        .eq("status", "verified")
        .maybeSingle();

      if (requestError) throw requestError;

      if (
        !request ||
        !request.requested_email ||
        request.requested_email.toLowerCase() !== confirmedEmail
      ) {
        return respond(
          {
            success: false,
            message: "Confirmed email does not match the approved request",
          },
          403,
        );
      }

      if (
        request.expires_at &&
        new Date(request.expires_at).getTime() <= Date.now()
      ) {
        await db
          .from("sub_admin_credential_requests")
          .update({ status: "expired" })
          .eq("id", request.id)
          .eq("status", "verified");

        return respond(
          { success: false, message: "Approval has expired" },
          410,
        );
      }

      // Confirm the request belongs to the same Sub-Admin record.
      const { data: originalSubAdmin, error: originalError } = await db
        .from("sub_admins")
        .select("id")
        .eq("id", request.sub_admin_id)
        .maybeSingle();

      if (originalError) throw originalError;

      if (!originalSubAdmin) {
        return respond(
          { success: false, message: "Sub-Admin record not found" },
          404,
        );
      }

      // Keep the authenticated account ID linked to the profile.
      const { error: profileError } = await db
        .from("profiles")
        .update({ email: confirmedEmail })
        .eq("id", caller.id);

      if (profileError) throw profileError;

      const { error: subUpdateError } = await db
        .from("sub_admins")
        .update({ email: confirmedEmail })
        .eq("id", request.sub_admin_id);

      if (subUpdateError) throw subUpdateError;

      const { error: completeError } = await db
        .from("sub_admin_credential_requests")
        .update({ status: "completed" })
        .eq("id", request.id)
        .eq("status", "verified");

      if (completeError) throw completeError;

      return respond({
        success: true,
        message: "Confirmed email synced successfully",
      });
    }

    // Sub-Admin checks their own credential request status.
    if (action === "get_my_requests") {
      if (!isSubAdmin || !caller.email) {
        return respond(
          { success: false, message: "Sub-Admin access required" },
          403,
        );
      }

      const { data: subAdmin, error: subError } = await db
        .from("sub_admins")
        .select("id")
        .ilike("email", caller.email)
        .maybeSingle();

      if (subError) throw subError;

      if (!subAdmin) {
        return respond(
          { success: false, message: "Sub-Admin record not found" },
          404,
        );
      }

      const { data: request, error: requestError } = await db
        .from("sub_admin_credential_requests")
        .select("id, request_type, status, expires_at")
        .eq("sub_admin_id", subAdmin.id)
        .eq("request_type", "password")
        .in("status", ["pending", "verified"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError) throw requestError;

      if (
        request?.expires_at &&
        new Date(request.expires_at).getTime() <= Date.now()
      ) {
        await db
          .from("sub_admin_credential_requests")
          .update({
            status: "expired",
            verification_code_hash: null,
          })
          .eq("id", request.id)
          .in("status", ["pending", "verified"]);

        return respond({ success: true, request: null });
      }

      return respond({ success: true, request: request ?? null });
    }

    // --------------------------------------------------
    // 6. Main Admin lists credential change requests.
    // --------------------------------------------------

    if (action === "list_requests") {
      if (!isMainAdmin) {
        return respond(
          {
            success: false,
            message: "Main Admin access required",
          },
          403,
        );
      }

      const { data: requests, error: listError } = await db
        .from("sub_admin_credential_requests")
        .select(
          "id, sub_admin_id, request_type, requested_email, status, expires_at, verified_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (listError) throw listError;

      const enrichedRequests = await Promise.all(
        (requests ?? []).map(async (item) => {
          const { data: subAdmin, error: subAdminError } = await db
            .from("sub_admins")
            .select("email")
            .eq("id", item.sub_admin_id)
            .maybeSingle();

          if (subAdminError) throw subAdminError;

          return {
            ...item,
            sub_admin_email: subAdmin?.email ?? "Unknown Sub-Admin",
          };
        }),
      );

      return respond({
        success: true,
        requests: enrichedRequests,
      });
    }

    return respond(
      {
        success: false,
        message: "Unknown action",
      },
      400,
    );
  } catch (error) {
    console.error("Credential request function error:", error);

    return respond(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
});
