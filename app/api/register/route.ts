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
    const name = (data.name || "").trim();
    const email = (data.email || "").toLowerCase();
    const password = data.password || "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, hashedPassword },
    });

    return NextResponse.json({ name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
