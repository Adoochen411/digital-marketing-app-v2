
import { supabase } from "./supabase";
export async function testTrc20Scanner() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session error:", sessionError.message);
    return;
  }

  if (!session) {
    console.error("Main Admin login session nahi mila.");
    return;
  }
console.log("Logged-in user ID:", session.user.id);
  const { data, error } = await supabase.functions.invoke(
    "trc20-deposit-scanner",
    {
      method: "GET",
    }
  );

  if (error) {
    console.error("Scanner request failed:", error.message);
    console.error("Response details:", error);
    return;
  }

  console.log("Scanner response:", data);
}
