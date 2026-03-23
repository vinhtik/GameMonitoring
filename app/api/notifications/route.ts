import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      include: {
        user: true,
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('GET /api/notifications error:', error)

    return NextResponse.json(
      { error: 'Failed to load notifications' },
      { status: 500 }
    )
  }
}