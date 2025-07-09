import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const run = await prisma.routeRun.findUnique({
    where: { slug },
    include: { addresses: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(run)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const data = await req.json()
  if (!Array.isArray(data.addresses)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await Promise.all(
    data.addresses.map((a: any) =>
      prisma.address.update({
        where: { id: a.id },
        data: {
          order: a.order,
          eta: a.eta ? new Date(a.eta) : null,
          etd: a.etd ? new Date(a.etd) : null,
          duration: a.duration ?? null,
        },
      })
    )
  )

  const run = await prisma.routeRun.findUnique({
    where: { slug },
    include: { addresses: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(run)
}
