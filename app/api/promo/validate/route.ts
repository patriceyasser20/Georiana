// app/api/promo/validate/route.ts
//
// POST /api/promo/validate
// Body: { code: string }
//
// Returns:
//   200 { valid: true,  discount: 10, message: "10% off applied!" }
//   200 { valid: false, discount: 0,  message: "<reason>" }
//   401 if not logged in

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// ── Config ────────────────────────────────────────────────────────────────────
const FIRST_ORDER_CODE = "FIRST10";   // the code users type in
const FIRST_ORDER_PCT  = 10;          // percent off

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Auth guard
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { valid: false, discount: 0, message: "Please log in to use a promo code." },
      { status: 401 }
    );
  }

  // 2. Parse body
  const body = await req.json().catch(() => ({}));
  const code: string = (body.code ?? "").trim().toUpperCase();

  // 3. Only the first-order promo is supported for now
  if (code !== FIRST_ORDER_CODE) {
    return NextResponse.json({
      valid: false,
      discount: 0,
      message: "Invalid promo code.",
    });
  }

  // 4. Check if the user already used this code
  const { data: existing, error } = await supabase
    .from("promo_usage")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("promo_code", FIRST_ORDER_CODE)
    .maybeSingle();

  if (error) {
    console.error("[promo/validate]", error);
    return NextResponse.json(
      { valid: false, discount: 0, message: "Could not verify promo code. Try again." },
      { status: 500 }
    );
  }

  if (existing) {
    return NextResponse.json({
      valid: false,
      discount: 0,
      message: "This promo has already been used on a previous order.",
    });
  }

  // 5. All good!
  return NextResponse.json({
    valid: true,
    discount: FIRST_ORDER_PCT,
    message: `${FIRST_ORDER_PCT}% off applied to your first order! 🎉`,
  });
}