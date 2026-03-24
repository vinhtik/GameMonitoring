import {
  GameItemDetails,
  GameProvider,
  ItemChartPoint,
  ItemOrder,
  NormalizedItem,
} from '@/lib/games/types'

const WFM_API_V2 = 'https://api.warframe.market/v2'
const WFM_API_V1 = 'https://api.warframe.market/v1'
const WFM_ASSETS = 'https://warframe.market/static/assets'

type WfmItem = {
  id?: string
  slug?: string
  i18n?: {
    en?: {
      name?: string
      description?: string
      icon?: string
      thumb?: string
      wikiLink?: string
    }
  }
  tags?: string[]
  rarity?: string
  maxRank?: number
  tradingTax?: number
  tradable?: boolean
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

function normalize(value: string) {
  return value.trim().toLowerCase()
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

function extractChartPointsFromV1(raw: unknown): ItemChartPoint[] {
  if (!raw || typeof raw !== 'object') return []

  const obj = raw as Record<string, unknown>
  const payload = obj.payload
  if (!payload || typeof payload !== 'object') return []

  const payloadObj = payload as Record<string, unknown>
  const candidates = [payloadObj.statistics_closed, payloadObj.statistics_live]

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

    if (points.length) return points
  }

  return []
}

function groupOrders(orders: WfmOrder[]) {
  const normalizedOrders: ItemOrder[] = orders.map((order) => ({
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
      reputation:
        typeof order.user?.reputation === 'number' ? order.user.reputation : 0,
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

export class WarframeProvider implements GameProvider {
  readonly gameId = 'warframe' as const
  readonly gameLabel = 'Warframe'
  readonly enabled = true

  getImageUrl(icon?: string | null): string | null {
    if (!icon) return null
    if (icon.startsWith('http://') || icon.startsWith('https://')) return icon
    return `${WFM_ASSETS}/${icon}`
  }

  async getCurrentPrice(externalId: string): Promise<number | null> {
  const raw = await fetchJsonWithRetry<{ data?: WfmOrder[] }>(
    `${WFM_API_V2}/orders/item/${externalId}`,
    undefined,
    { retries: 2, timeoutMs: 8000 }
  )

  if (!raw) return null

  const orders: WfmOrder[] = Array.isArray(raw?.data) ? raw.data : []

  const sellPrices = orders
    .filter((order) => {
      const isSell = order.type === 'sell'
      const isVisible = order.visible !== false
      return isSell && isVisible && typeof order.platinum === 'number'
    })
    .map((order) => Number(order.platinum))
    .filter((price) => Number.isFinite(price))

  if (!sellPrices.length) return null
  return Math.min(...sellPrices)
}

  async normalizeItem(raw: unknown): Promise<NormalizedItem | null> {
    if (!raw || typeof raw !== 'object') return null

    const item = raw as WfmItem
    const externalId = item.slug ?? item.id ?? null
    if (!externalId) return null

    const name = item.i18n?.en?.name ?? item.slug ?? 'Unknown item'
    const icon = item.i18n?.en?.thumb ?? item.i18n?.en?.icon ?? null
    const currentPrice = item.slug
      ? await this.getCurrentPrice(item.slug)
      : null

    return {
      externalId,
      name,
      game: this.gameLabel,
      currentPrice,
      icon,
    }
  }

async searchItems(query: string): Promise<NormalizedItem[]> {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return []

  const raw = await fetchJsonWithRetry<{ data?: WfmItem[] }>(
    `${WFM_API_V2}/items`,
    undefined,
    { retries: 2, timeoutMs: 10000 }
  )

  if (!raw) {
    return []
  }

  const sourceItems: WfmItem[] = Array.isArray(raw?.data) ? raw.data : []

  const filtered = sourceItems.filter((item) => {
    const name = item.i18n?.en?.name ?? ''
    const slug = item.slug ?? ''

    return (
      normalize(name).includes(normalizedQuery) ||
      normalize(slug).includes(normalizedQuery)
    )
  })

  const limited = filtered.slice(0, 10)

  const normalized = await Promise.all(
    limited.map((item) => this.normalizeItem(item))
  )

  return normalized.filter((item): item is NormalizedItem => item !== null)
}

async getItem(slug: string): Promise<GameItemDetails | null> {
  const [itemRaw, ordersRaw, statsRaw] = await Promise.all([
    fetchJsonWithRetry<{ data?: WfmItem }>(
      `${WFM_API_V2}/items/${slug}`,
      undefined,
      { retries: 2, timeoutMs: 8000 }
    ),
    fetchJsonWithRetry<{ data?: WfmOrder[] }>(
      `${WFM_API_V2}/orders/item/${slug}`,
      undefined,
      { retries: 2, timeoutMs: 8000 }
    ),
    fetchJsonWithRetry(
      `${WFM_API_V1}/items/${slug}/statistics`,
      undefined,
      { retries: 2, timeoutMs: 8000 }
    ),
  ])

  if (!itemRaw?.data) {
    return null
  }

  const rawItem = itemRaw.data

  const item = {
    id: rawItem.id ?? rawItem.slug ?? slug,
    slug: rawItem.slug ?? slug,
    tags: rawItem.tags,
    rarity: rawItem.rarity,
    maxRank: rawItem.maxRank,
    tradingTax: rawItem.tradingTax,
    tradable: rawItem.tradable,
    i18n: rawItem.i18n,
  }

  const orders: WfmOrder[] = Array.isArray(ordersRaw?.data) ? ordersRaw.data : []
  const chart = extractChartPointsFromV1(statsRaw)
  const grouped = groupOrders(orders)

  return {
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
  }
}
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJsonWithRetry<T>(
  url: string,
  init?: RequestInit,
  options?: {
    retries?: number
    timeoutMs?: number
  }
): Promise<T | null> {
  const retries = options?.retries ?? 2
  const timeoutMs = options?.timeoutMs ?? 8000

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GameMonitoring/1.0',
          ...(init?.headers ?? {}),
        },
      })

      clearTimeout(timeout)

      if (!response.ok) {
        console.error(
          `Warframe API request failed: ${url}, status=${response.status}`
        )

        if (attempt === retries) {
          return null
        }

        await sleep(500 * (attempt + 1))
        continue
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timeout)

      console.error(
        `Warframe API fetch error (attempt ${attempt + 1}/${retries + 1}) for ${url}:`,
        error
      )

      if (attempt === retries) {
        return null
      }

      await sleep(500 * (attempt + 1))
    }
  }

  return null
}