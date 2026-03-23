import { NextRequest, NextResponse } from 'next/server'

const WFM_API_V2 = 'https://api.warframe.market/v2'
const WFM_API_V1 = 'https://api.warframe.market/v1'

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

type WfmOrder = {
  id?: string
  type?: string
  platinum?: number
  quantity?: number
  perTrade?: number
  modRank?: number | null
  rank?: number | null
  visible?: boolean
  createdAt?: string
  updatedAt?: string
  user?: {
    id?: string
    ingameName?: string
    slug?: string
    reputation?: number
    status?: string
    locale?: string
    platform?: string
    crossplay?: boolean
  }
}

type LegacyStatisticsDay = {
  datetime?: string
  volume?: number
  min_price?: number
  max_price?: number
  avg_price?: number
  median?: number
  mod_rank?: number
}

function groupOrders(orders: WfmOrder[]) {
  const normalizedOrders = orders.map((order) => ({
    id: order.id ?? crypto.randomUUID(),
    type: order.type === 'buy' ? 'buy' : 'sell',
    platinum: typeof order.platinum === 'number' ? order.platinum : 0,
    quantity: typeof order.quantity === 'number' ? order.quantity : 1,
    perTrade: typeof order.perTrade === 'number' ? order.perTrade : 1,
    rank:
      typeof order.rank === 'number'
        ? order.rank
        : typeof order.modRank === 'number'
          ? order.modRank
          : 0,
    visible: order.visible !== false,
    createdAt: order.createdAt ?? new Date().toISOString(),
    updatedAt: order.updatedAt ?? order.createdAt ?? new Date().toISOString(),
    user: {
      id: order.user?.id ?? '',
      ingameName: order.user?.ingameName ?? 'Unknown',
      slug: order.user?.slug ?? '',
      reputation: typeof order.user?.reputation === 'number' ? order.user.reputation : 0,
      status: order.user?.status ?? 'unknown',
      locale: order.user?.locale,
      platform: order.user?.platform,
      crossplay: order.user?.crossplay,
    },
  }))

  const sellOrders = normalizedOrders
    .filter((order) => order.type === 'sell' && order.visible)
    .sort((a, b) => a.platinum - b.platinum)

  const buyOrders = normalizedOrders
    .filter((order) => order.type === 'buy' && order.visible)
    .sort((a, b) => b.platinum - a.platinum)

  return {
    sellOrders,
    buyOrders,
    lowestSell: sellOrders[0]?.platinum ?? null,
    highestBuy: buyOrders[0]?.platinum ?? null,
  }
}

function normalizeStatsArray(value: unknown): LegacyStatisticsDay[] {
  if (Array.isArray(value)) {
    return value as LegacyStatisticsDay[]
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const preferredKeys = ['90days', '48hours', '1days', 'today']

    for (const key of preferredKeys) {
      if (Array.isArray(obj[key])) {
        return obj[key] as LegacyStatisticsDay[]
      }
    }

    for (const nestedValue of Object.values(obj)) {
      if (Array.isArray(nestedValue)) {
        return nestedValue as LegacyStatisticsDay[]
      }
    }
  }

  return []
}

function extractChartPointsFromV1(raw: unknown) {
  if (!raw || typeof raw !== 'object') return []

  const obj = raw as Record<string, unknown>
  const payload = obj.payload

  if (!payload || typeof payload !== 'object') return []

  const payloadObj = payload as Record<string, unknown>

  const candidates = [
    payloadObj.statistics_closed,
    payloadObj.statistics_live,
  ]

  for (const candidate of candidates) {
    const rows = normalizeStatsArray(candidate)

    if (!rows.length) continue

    const points = rows
      .map((row) => {
        const datetime = row.datetime ?? ''
        const avgPrice =
          typeof row.avg_price === 'number'
            ? row.avg_price
            : typeof row.median === 'number'
              ? row.median
              : 0

        const volume = typeof row.volume === 'number' ? row.volume : 0

        return {
          datetime,
          avgPrice,
          volume,
        }
      })
      .filter((point) => point.datetime && point.avgPrice > 0)
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      )

    if (points.length) {
      return points
    }
  }

  return []
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params

    const [itemRes, ordersRes, statsRes] = await Promise.all([
      fetch(`${WFM_API_V2}/items/${slug}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${WFM_API_V2}/orders/item/${slug}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${WFM_API_V1}/items/${slug}/statistics`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
    ])

    if (!itemRes.ok) {
      return NextResponse.json(
        { error: `Failed to load item: ${itemRes.status}` },
        { status: 502 }
      )
    }

    const itemRaw = await itemRes.json()
    const ordersRaw = ordersRes.ok ? await ordersRes.json() : { data: [] }

    let statsRaw: unknown = {}
    if (statsRes.ok) {
      statsRaw = await statsRes.json()
    }

    const item = itemRaw?.data ?? null
    const orders: WfmOrder[] = Array.isArray(ordersRaw?.data) ? ordersRaw.data : []
    const chart = extractChartPointsFromV1(statsRaw)
    const grouped = groupOrders(orders)

    return NextResponse.json({
      item,
      chart,
      orders: {
        sellOrders: grouped.sellOrders,
        buyOrders: grouped.buyOrders,
        lowestSell: grouped.lowestSell,
        highestBuy: grouped.highestBuy,
      },
      totals: {
        sellCount: grouped.sellOrders.length,
        buyCount: grouped.buyOrders.length,
      },
      debug: {
        statsUrl: `${WFM_API_V1}/items/${slug}/statistics`,
        statsOk: statsRes.ok,
        statsStatus: statsRes.status,
        statsTopLevelKeys:
          statsRaw && typeof statsRaw === 'object'
            ? Object.keys(statsRaw as object)
            : [],
        payloadKeys:
          statsRaw &&
          typeof statsRaw === 'object' &&
          'payload' in (statsRaw as Record<string, unknown>) &&
          typeof (statsRaw as Record<string, unknown>).payload === 'object'
            ? Object.keys((statsRaw as Record<string, unknown>).payload as object)
            : [],
        statisticsClosedType:
          statsRaw &&
          typeof statsRaw === 'object' &&
          'payload' in (statsRaw as Record<string, unknown>) &&
          typeof (statsRaw as Record<string, unknown>).payload === 'object'
            ? Array.isArray(
                ((statsRaw as Record<string, unknown>).payload as Record<string, unknown>).statistics_closed
              )
              ? 'array'
              : typeof ((statsRaw as Record<string, unknown>).payload as Record<string, unknown>).statistics_closed
            : null,
        statisticsClosedKeys:
          statsRaw &&
          typeof statsRaw === 'object' &&
          'payload' in (statsRaw as Record<string, unknown>) &&
          typeof (statsRaw as Record<string, unknown>).payload === 'object' &&
          ((statsRaw as Record<string, unknown>).payload as Record<string, unknown>).statistics_closed &&
          typeof ((statsRaw as Record<string, unknown>).payload as Record<string, unknown>).statistics_closed === 'object' &&
          !Array.isArray(((statsRaw as Record<string, unknown>).payload as Record<string, unknown>).statistics_closed)
            ? Object.keys(
                ((statsRaw as Record<string, unknown>).payload as Record<string, unknown>).statistics_closed as object
              )
            : [],
        chartCount: chart.length,
        firstChartPoint: chart[0] ?? null,
      },
    })
  } catch (error) {
    console.error('GET /api/items/[slug] error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}