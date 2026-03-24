import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEnabledGameProvider } from '@/lib/games/game-registry'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    const gameParam = request.nextUrl.searchParams.get('game')

    if (!query) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const provider = getEnabledGameProvider(gameParam)

    if (!provider) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const items = await provider.searchItems(query)

    const syncedItems = await Promise.all(
      items.map((item) =>
        prisma.item.upsert({
          where: { externalId: item.externalId },
          update: {
            name: item.name,
            game: item.game,
            currentPrice: item.currentPrice,
            icon: item.icon,
          },
          create: {
            externalId: item.externalId,
            name: item.name,
            game: item.game,
            currentPrice: item.currentPrice,
            icon: item.icon,
          },
        })
      )
    )

    return NextResponse.json({
      items: syncedItems,
      total: syncedItems.length,
    })
  } catch (error) {
    console.error('GET /api/items error:', error)

    return NextResponse.json(
      {
        items: [],
        total: 0,
        error: 'Failed to fetch items from external API',
      },
      { status: 200 }
    )
  }
}