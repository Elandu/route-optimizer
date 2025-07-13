import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getIdentifier } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const identifier = getIdentifier(req);
  if (rateLimit(identifier)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const data = await req.json();
    const email = (data.email || "").toLowerCase();
    const password = data.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 400 },
      );
    }

    return NextResponse.json({ name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
