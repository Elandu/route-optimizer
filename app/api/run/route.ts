import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIdentifier } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const identifier = getIdentifier(req);
  if (rateLimit(identifier)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const data = await req.json();
  const run = await prisma.routeRun.create({
    data: {
      slug: data.slug,
      startTime: data.startTime ? new Date(data.startTime) : null,
      endTime: data.endTime ? new Date(data.endTime) : null,
      overnight: data.overnight ?? false,
      inspectionMins: data.inspectionMins ?? null,
      addresses: {
        create: (data.addresses || []).map((a: any, i: number) => ({
          label: a.label,
          address: a.address,
          order: i,
        })),
      },
    },
    include: { addresses: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(run, { status: 201 });
}
