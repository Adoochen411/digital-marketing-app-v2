
import { createClient } from "npm:@supabase/supabase-js@2";

const TRON_API = "https://api.trongrid.io";
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

function formatUsdt(raw: string): string {
  const n = BigInt(raw);
  const whole = n / 1_000_000n;
  const fraction = (n % 1_000_000n)
    .toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function toMicros(value: string | number): bigint {
  const s = String(value);
  if (!/^\d+(\.\d{1,6})?$/.test(s)) {
    throw new Error("Invalid USDT amount");
  }
  const [whole, fraction = ""] = s.split(".");
  return BigInt(whole) * 1_000_000n +
    BigInt((fraction + "000000").slice(0, 6));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST required" }, { status: 405 });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret ||
      req.headers.get("x-cron-secret") !== cronSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const tronKey = Deno.env.get("TRON_PRO_API_KEY");

  if (!supabaseUrl || !serviceKey || !tronKey) {
    return Response.json({ error: "Server secrets missing" }, { status: 500 });
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data: settings, error: settingsError } = await db
      .from("system_settings")
      .select("deposit_trc20_address")
      .eq("id", 1)
      .maybeSingle();

    if (settingsError) throw settingsError;

    const wallet = settings?.deposit_trc20_address?.trim();
    if (!wallet || !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(wallet)) {
      throw new Error("Configured deposit wallet is invalid");
    }

    const { data: deposits, error: depositError } = await db
      .from("deposits")
      .select("id, user_id, amount, txid, status, payment_method")
      .eq("status", "pending")
      .eq("payment_method", "trc20")
      .not("txid", "is", null)
      .neq("txid", "");

    if (depositError) throw depositError;

    const params = new URLSearchParams({
      only_confirmed: "true",
      only_to: "true",
      limit: "200",
      order_by: "block_timestamp,desc",
      contract_address: USDT_CONTRACT
    });

    const response = await fetch(
      `${TRON_API}/v1/accounts/${encodeURIComponent(wallet)}/transactions/trc20?${params}`,
      { headers: { "TRON-PRO-API-KEY": tronKey, "Accept": "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`TRONGrid returned HTTP ${response.status}`);
    }

    const result = await response.json();
    const transfers = Array.isArray(result.data) ? result.data : [];
    let released = 0;
    let skipped = 0;
console.log("TRONGrid diagnostic:", JSON.stringify({
  success: result.success,
  error: result.error,
  statusCode: result.statusCode,
  dataCount: Array.isArray(result.data) ? result.data.length : null,
  hasData: Array.isArray(result.data),
}));
    for (const dep of deposits ?? []) {
      const submittedTxid = String(dep.txid ?? "").trim();

      if (!/^[0-9a-fA-F]{64}$/.test(submittedTxid) ||
          !dep.user_id || Number(dep.amount) <= 0) {
        skipped++;
        continue;
      }

      const matches = transfers.filter((tx: any) =>
        tx.type === "Transfer" &&
        typeof tx.transaction_id === "string" &&
        tx.transaction_id.toLowerCase() === submittedTxid.toLowerCase() &&
        tx.to === wallet &&
        String(tx.token_info?.address ?? "").toLowerCase() ===
          USDT_CONTRACT.toLowerCase() &&
        Number(tx.token_info?.decimals) === 6 &&
        typeof tx.value === "string" &&
        /^\d+$/.test(tx.value) &&
        BigInt(tx.value) > 0n
      );

      if (matches.length !== 1) {
        skipped++;
        continue;
      }

      const transfer = matches[0];
      if (toMicros(dep.amount) !== BigInt(transfer.value)) {
        skipped++;
        continue;
      }

      const { error: releaseError } = await db.rpc(
        "release_verified_trc20_deposit",
        {
          p_deposit_id: dep.id,
          p_txid: submittedTxid,
          p_verified_amount: formatUsdt(transfer.value)
        }
      );

      if (releaseError) {
        console.error("Release failed for deposit", dep.id, releaseError.message);
        skipped++;
      } else {
        released++;
      }
    }

    return Response.json({
      ok: true,
      transfers_checked: transfers.length,
      pending_deposits_checked: deposits?.length ?? 0,
      released,
      skipped
    });
  } catch (error) {
    console.error("TRC20 auto-check failed:", error);
    return Response.json(
      { error: "Automatic check failed; see function logs" },
      { status: 500 }
    );
  }
});
