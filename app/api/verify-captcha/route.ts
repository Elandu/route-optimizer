import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIdentifier } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const identifier = getIdentifier(req);
  if (rateLimit(identifier)) {
    return NextResponse.json({ success: false }, { status: 429 });
  }
  const { token } = await req.json();
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json();
  if (!data.success || data.score < 0.5) {
    return NextResponse.json(
      { success: false, score: data.score },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true, score: data.score });
}
