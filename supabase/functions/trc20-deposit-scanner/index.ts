
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

const TRON_API = "https://api.trongrid.io";
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

function formatUsdt(raw: string): string {
  const value = BigInt(raw);
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      if (req.method !== "GET") {
        return Response.json(
          { ok: false, message: "Only GET is allowed." },
          { status: 405 }
        );
      }

      try {
        // Main Admin authorization
        const userId = ctx.userClaims?.id;

        if (!userId) {
          return Response.json(
            { ok: false, message: "Login required." },
            { status: 401 }
          );
        }

        const { data: adminProfile, error: adminError } =
          await ctx.supabaseAdmin
            .from("profiles")
            .select("role, is_subadmin")
            .eq("id", userId)
            .maybeSingle();

        if (adminError) throw adminError;

        if (
          !adminProfile ||
          adminProfile.role !== "admin" ||
          adminProfile.is_subadmin !== false
        ) {
          return Response.json(
            { ok: false, message: "Main Admin access only." },
            { status: 403 }
          );
        }

        // Get the current receiving wallet
        const { data: settings, error: settingsError } =
          await ctx.supabaseAdmin
            .from("system_settings")
            .select("deposit_trc20_address")
            .eq("id", 1)
            .maybeSingle();

        if (settingsError) throw settingsError;

        const wallet = settings?.deposit_trc20_address?.trim();

if (!wallet || !wallet.startsWith("T") || wallet.length !== 34) {
  return Response.json(
    {
      ok: false,
      message: "Receiving wallet address format is invalid."
    },
    { status: 400 }
  );
}

        if (!wallet) {
          return Response.json(
            {
              ok: false,
              message:
                "Receiving wallet is missing from system_settings."
            },
            { status: 400 }
          );
        }

        const apiKey = Deno.env.get("TRON_PRO_API_KEY");

        if (!apiKey) {
          return Response.json(
            {
              ok: false,
              message: "TRON_PRO_API_KEY secret is missing."
            },
            { status: 500 }
          );
        }

        // Fetch confirmed incoming USDT TRC20 transfers
        const params = new URLSearchParams({
          only_confirmed: "true",
          only_to: "true",
          limit: "50",
          order_by: "block_timestamp,desc",
          contract_address: USDT_CONTRACT
        });

        const url =
          `${TRON_API}/v1/accounts/${encodeURIComponent(wallet)}` +
          `/transactions/trc20?${params.toString()}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "TRON-PRO-API-KEY": apiKey,
            "Accept": "application/json"
          }
        });

      
if (!response.ok) {
  const upstreamError = await response.text();

  console.error("TRONGrid request failed:", {
    status: response.status,
    body: upstreamError.slice(0, 1000),
  });

  return Response.json(
    {
      ok: false,
      message: "TRONGrid request failed.",
      upstream_status: response.status,
      upstream_error: upstreamError.slice(0, 500),
    },
    { status: 502 }
  );
}


        const result = await response.json();
        const rows = Array.isArray(result.data) ? result.data : [];

        // Filter confirmed incoming USDT transfers
        const transfers = rows
          .filter((tx: any) => {
            const token = tx.token_info ?? {};

            return (
              tx.type === "Transfer" &&
              typeof tx.to === "string" &&
              tx.to === wallet &&
              typeof token.address === "string" &&
              token.address.toLowerCase() ===
                USDT_CONTRACT.toLowerCase() &&
              Number(token.decimals) === 6 &&
              typeof tx.transaction_id === "string" &&
              /^[0-9a-fA-F]{64}$/.test(tx.transaction_id) &&
              typeof tx.value === "string" &&
              /^\d+$/.test(tx.value) &&
              BigInt(tx.value) > 0n
            );
          })
          .map((tx: any) => ({
            txid: tx.transaction_id,
            from: tx.from,
            to: tx.to,
            amount_usdt: formatUsdt(tx.value),
            block_timestamp: tx.block_timestamp,
            review_status: "needs_admin_review"
          }));

        // Match deposits only by exact transaction hash
        const txids = transfers.map((tx: any) => tx.txid);
        let matchedDeposits: any[] = [];

        if (txids.length > 0) {
          const { data: deposits, error: depositsError } =
            await ctx.supabaseAdmin
              .from("deposits")
              .select("id, user_id, amount, status, txid")
              .in("txid", txids);

          if (depositsError) throw depositsError;

          const depositRows = deposits ?? [];
          const userIds = [
            ...new Set(
              depositRows
                .map((dep: any) => dep.user_id)
                .filter(Boolean)
            )
          ];

          let profiles: any[] = [];

          if (userIds.length > 0) {
            const { data: profileRows, error: profilesError } =
              await ctx.supabaseAdmin
                .from("profiles")
                .select("id, custom_id")
                .in("id", userIds);

            if (profilesError) throw profilesError;

            profiles = profileRows ?? [];
          }

          matchedDeposits = depositRows.map((dep: any) => {
            const customerProfile = profiles.find(
              (p: any) => p.id === dep.user_id
            );

            return {
              deposit_id: dep.id,
              customer_account_id: dep.user_id,
              customer_admin_id:
                customerProfile?.custom_id ?? null,
              deposit_amount: dep.amount,
              deposit_status: dep.status,
              txid: dep.txid
            };
          });
        }

        const enrichedTransfers = transfers.map((tx: any) => {
          const matches = matchedDeposits.filter(
            (dep: any) => dep.txid === tx.txid
          );

          return {
            ...tx,
            customer_matches: matches,
            match_status:
              matches.length === 0
                ? "no_exact_txid_match"
                : matches.length === 1
                  ? "matched_to_deposit"
                  : "multiple_deposit_matches"
          };
        });

        return Response.json({
          ok: true,
          mode: "read_only",
          confirmed_only: true,
          wallet_used: wallet,
          transfers_found: enrichedTransfers.length,
          message:
            "Confirmed USDT transfers retrieved. No deposits or balances changed.",
          transfers: enrichedTransfers
        });
      } catch (error) {
        console.error("Scanner error:", error);

        return Response.json(
          {
            ok: false,
            message: "Scanner failed. Check Edge Function logs."
          },
          { status: 500 }
        );
      }
    }
  )
};
