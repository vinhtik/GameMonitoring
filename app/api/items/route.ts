import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const WFM_API_BASE = 'https://api.warframe.market/v2'

type WfmItem = {
  id?: string
  slug?: string
  i18n?: {
    en?: {
      name?: string
      icon?: string
      thumb?: string
    }
  }
}

type WfmOrder = {
  type?: string
  platinum?: number
  visible?: boolean
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function resolveGame(gameParam: string | null) {
  const game = (gameParam ?? 'warframe').trim().toLowerCase()

  return {
    gameId: game,
    gameLabel: game === 'warframe' ? 'Warframe' : null,
    isSupported: game === 'warframe',
  }
}

async function getCurrentPrice(slug: string): Promise<number | null> {
  try {
    const response = await fetch(`${WFM_API_BASE}/orders/item/${slug}`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`Orders request failed for ${slug}: ${response.status}`)
      return null
    }

    const raw = await response.json()
    const orders: WfmOrder[] = Array.isArray(raw?.data) ? raw.data : []

    const sellPrices = orders
      .filter((order) => {
        const isSell = order.type === 'sell'
        const isVisible = order.visible !== false
        return isSell && isVisible && typeof order.platinum === 'number'
      })
      .map((order) => Number(order.platinum))
      .filter((price) => Number.isFinite(price))

    if (!sellPrices.length) {
      return null
    }

    return Math.min(...sellPrices)
  } catch (error) {
    console.error(`Failed to fetch price for ${slug}:`, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    const gameParam = request.nextUrl.searchParams.get('game')

    const { gameLabel, isSupported } = resolveGame(gameParam)

    if (!query) {
      return NextResponse.json({
        items: [],
        total: 0,
      })
    }

    if (!isSupported || !gameLabel) {
      return NextResponse.json({
        items: [],
        total: 0,
      })
    }

    const response = await fetch(`${WFM_API_BASE}/items`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch items from Warframe Market' },
        { status: 502 }
      )
    }

    const raw = await response.json()
    const sourceItems: WfmItem[] = Array.isArray(raw?.data) ? raw.data : []

    const normalizedQuery = normalize(query)

    const filtered = sourceItems.filter((item) => {
      const name = item.i18n?.en?.name ?? ''
      const slug = item.slug ?? ''

      return (
        normalize(name).includes(normalizedQuery) ||
        normalize(slug).includes(normalizedQuery)
      )
    })

    const limited = filtered.slice(0, 10)

    const syncedItems = await Promise.all(
      limited.map(async (item) => {
        const externalId = item.slug ?? item.id ?? crypto.randomUUID()
        const name = item.i18n?.en?.name ?? item.slug ?? 'Unknown item'
        const icon = item.i18n?.en?.thumb ?? item.i18n?.en?.icon ?? null
        const currentPrice = item.slug ? await getCurrentPrice(item.slug) : null

        return prisma.item.upsert({
          where: { externalId },
          update: {
            name,
            game: gameLabel,
            currentPrice,
            icon,
          },
          create: {
            externalId,
            name,
            game: gameLabel,
            currentPrice,
            icon,
          },
        })
      })
    )

    return NextResponse.json({
      items: syncedItems,
      total: syncedItems.length,
    })
  } catch (error) {
    console.error('GET /api/items error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}