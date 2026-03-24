import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function resolveGameLabel(gameParam: string | null) {
  if (gameParam === 'warframe') return 'Warframe'
  if (gameParam === 'cs2') return 'CS2'
  if (gameParam === 'dota2') return 'Dota 2'
  return null
}

export async function GET(request: NextRequest) {
  try {
    const gameParam = request.nextUrl.searchParams.get('game')
    const gameLabel = resolveGameLabel(gameParam)

    let notifications

    if (gameLabel) {
      const items = await prisma.item.findMany({
        where: {
          game: gameLabel,
        },
        select: {
          name: true,
        },
      })

      const itemNames = items.map((item) => item.name)

      notifications =
        itemNames.length > 0
          ? await prisma.notification.findMany({
              where: {
                itemName: {
                  in: itemNames,
                },
              },
              include: {
                user: true,
              },
              orderBy: {
                sentAt: 'desc',
              },
              take: 50,
            })
          : []
    } else {
      notifications = await prisma.notification.findMany({
        include: {
          user: true,
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: 50,
      })
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('GET /api/notifications error:', error)

    return NextResponse.json(
      { error: 'Failed to load notifications' },
      { status: 500 }
    )
  }
}