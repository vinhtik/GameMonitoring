import {
  GameItemDetails,
  GameProvider,
  ItemChartPoint,
  ItemOrder,
  NormalizedItem,
} from '@/lib/games/types'


const STEAM_COMMUNITY_BASE = 'https://steamcommunity.com'
const STEAM_IMAGE_CDN =
  'https://community.fastly.steamstatic.com/economy/image'
const CS2_APP_ID = 730
const USD_CURRENCY = 1


type SteamMarketTag = {
  category?: string
  internal_name?: string
  localized_category_name?: string
  localized_tag_name?: string
  name?: string
}


type SteamMarketDescription = {
  value?: string
}


type SteamMarketAssetDescription = {
  market_hash_name?: string
  name?: string
  type?: string
  icon_url?: string
  icon_url_large?: string
  marketable?: number
  tradable?: number
  commodity?: number
  descriptions?: SteamMarketDescription[]
  tags?: SteamMarketTag[]
}


type SteamMarketSearchResult = {
  hash_name?: string
  name?: string
  sell_price?: number
  sell_price_text?: string
  sale_price_text?: string
  asset_description?: SteamMarketAssetDescription
}


type SteamMarketSearchResponse = {
  success?: boolean
  start?: number
  pagesize?: number
  total_count?: number
  results?: SteamMarketSearchResult[]
}


type SteamPriceOverviewResponse = {
  success?: boolean
  lowest_price?: string
  median_price?: string
  volume?: string
  lowest_sell_order?: string | number
  highest_buy_order?: string | number
}


type SteamItemOrdersHistogramResponse = {
  success?: boolean
  highest_buy_order?: string | number
  lowest_sell_order?: string | number
  buy_order_summary?: string
  sell_order_summary?: string
  buy_order_graph?: Array<[string | number, string | number, string]>
  sell_order_graph?: Array<[string | number, string | number, string]>
}


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}


function normalize(value: string) {
  return value.trim().toLowerCase()
}


function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}


function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message.includes('aborted'))
  )
}


function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }


  if (typeof value !== 'string') {
    return null
  }


  let cleaned = value.replace(/\u00A0/g, ' ').trim()
  if (!cleaned) return null


  cleaned = cleaned.replace(/[^\d,.\-]/g, '')
  if (!cleaned) return null


  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')


  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (lastComma !== -1) {
    if (/,\d{1,2}$/.test(cleaned)) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (lastDot !== -1) {
    const dotCount = (cleaned.match(/\./g) ?? []).length


    if (dotCount > 1) {
      cleaned = cleaned.replace(/\./g, '')
    }
  }


  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}


function parseMinorUnits(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value / 100
  }


  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed / 100 : null
  }


  return null
}


function parseSummaryCount(value: string | undefined): number {
  if (!value) return 0


  const text = value.replace(/<[^>]*>/g, ' ')
  const match = text.match(/([\d,.]+)/)
  if (!match) return 0


  const normalized = match[1].replace(/,/g, '')
  const parsed = Number(normalized)


  return Number.isFinite(parsed) ? parsed : 0
}


function buildUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined>
) {
  const url = new URL(path, STEAM_COMMUNITY_BASE)


  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }


  return url.toString()
}


function buildListingUrl(marketHashName: string) {
  return `${STEAM_COMMUNITY_BASE}/market/listings/${CS2_APP_ID}/${encodeURIComponent(
    marketHashName
  )}`
}


async function fetchJsonWithRetry<T>(
  url: string,
  options?: {
    retries?: number
    timeoutMs?: number
    headers?: Record<string, string>
    silentStatuses?: number[]
  }
): Promise<T | null> {
  const retries = options?.retries ?? 1
  const timeoutMs = options?.timeoutMs ?? 8000
  const silentStatuses = options?.silentStatuses ?? []


  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)


    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'GameMonitoring/1.0',
          'X-Requested-With': 'XMLHttpRequest',
          ...(options?.headers ?? {}),
        },
      })


      clearTimeout(timeout)


      if (!response.ok) {
        if (!silentStatuses.includes(response.status)) {
          console.warn(
            `Steam Market request failed: ${url}, status=${response.status}`
          )
        }


        if ([400, 401, 403, 404].includes(response.status)) {
          return null
        }


        if (attempt === retries) {
          return null
        }


        await sleep(
          response.status === 429 ? 1200 * (attempt + 1) : 500 * (attempt + 1)
        )


        continue
      }


      const text = await response.text()


      if (text.trim().startsWith('<')) {
        console.warn(`Steam returned HTML instead of JSON: ${url}`)
        return null
      }


      try {
        return JSON.parse(text) as T
      } catch {
        console.warn(`Steam JSON parse failed: ${url}`)
        return null
      }
    } catch (error) {
      clearTimeout(timeout)


      if (isAbortError(error)) {
        console.warn(`Steam Market timeout after ${timeoutMs}ms: ${url}`)
      } else {
        console.warn(
          `Steam Market fetch failed (attempt ${attempt + 1}/${
            retries + 1
          }) for ${url}:`,
          error
        )
      }


      if (attempt === retries) {
        return null
      }


      await sleep(500 * (attempt + 1))
    }
  }


  return null
}


async function fetchTextWithRetry(
  url: string,
  options?: {
    retries?: number
    timeoutMs?: number
    headers?: Record<string, string>
  }
): Promise<string | null> {
  const retries = options?.retries ?? 0
  const timeoutMs = options?.timeoutMs ?? 2500


  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)


    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'GameMonitoring/1.0',
          ...(options?.headers ?? {}),
        },
      })


      clearTimeout(timeout)


      if (!response.ok) {
        console.warn(`Steam listing request failed: ${url}, status=${response.status}`)
        return null
      }


      return await response.text()
    } catch (error) {
      clearTimeout(timeout)


      if (isAbortError(error)) {
        console.warn(`Steam listing timeout after ${timeoutMs}ms: ${url}`)
      } else {
        console.warn(
          `Steam listing fetch failed (attempt ${attempt + 1}/${
            retries + 1
          }) for ${url}:`,
          error
        )
      }


      if (attempt === retries) {
        return null
      }


      await sleep(500 * (attempt + 1))
    }
  }


  return null
}


function getExternalId(item: SteamMarketSearchResult): string | null {
  const value =
    item.hash_name ??
    item.asset_description?.market_hash_name ??
    item.name ??
    item.asset_description?.name ??
    null


  if (!value || typeof value !== 'string') {
    return null
  }


  return safeDecode(value).trim()
}


function getItemName(item: SteamMarketSearchResult): string {
  return (
    item.name ??
    item.asset_description?.name ??
    item.hash_name ??
    item.asset_description?.market_hash_name ??
    'Unknown item'
  )
}


function getItemImage(item: SteamMarketSearchResult): string | null {
  const icon =
    item.asset_description?.icon_url_large ??
    item.asset_description?.icon_url ??
    null


  if (!icon || typeof icon !== 'string') {
    return null
  }


  return icon.trim()
}


function getSearchResultPrice(item: SteamMarketSearchResult): number | null {
  return (
    parseMinorUnits(item.sell_price) ??
    parseNumber(item.sell_price_text) ??
    parseNumber(item.sale_price_text) ??
    null
  )
}


function getPriceOverviewPrice(
  data: SteamPriceOverviewResponse | null
): number | null {
  if (!data?.success) return null


  return (
    parseNumber(data.lowest_price) ??
    parseMinorUnits(data.lowest_sell_order) ??
    parseNumber(data.median_price) ??
    null
  )
}


function getHighestBuyFromOverview(
  data: SteamPriceOverviewResponse | null
): number | null {
  if (!data?.success) return null


  return (
    parseMinorUnits(data.highest_buy_order) ??
    parseNumber(data.highest_buy_order)
  )
}


function getLowestSellFromHistogram(
  data: SteamItemOrdersHistogramResponse | null
): number | null {
  if (!data?.success) return null


  return (
    parseMinorUnits(data.lowest_sell_order) ??
    parseNumber(data.lowest_sell_order)
  )
}


function getHighestBuyFromHistogram(
  data: SteamItemOrdersHistogramResponse | null
): number | null {
  if (!data?.success) return null


  return (
    parseMinorUnits(data.highest_buy_order) ??
    parseNumber(data.highest_buy_order)
  )
}


function extractResults(
  raw: SteamMarketSearchResponse | null
): SteamMarketSearchResult[] {
  if (!raw?.results || !Array.isArray(raw.results)) {
    return []
  }


  return raw.results
}


function findBestMatch(
  items: SteamMarketSearchResult[],
  marketHashName: string
): SteamMarketSearchResult | null {
  const target = normalize(marketHashName)


  return (
    items.find((item) => normalize(getExternalId(item) ?? '') === target) ??
    items.find((item) => normalize(getItemName(item)) === target) ??
    items.find((item) => normalize(getExternalId(item) ?? '').includes(target)) ??
    items.find((item) => normalize(getItemName(item)).includes(target)) ??
    null
  )
}


function getTags(item: SteamMarketSearchResult): string[] {
  const tags = item.asset_description?.tags ?? []


  return tags
    .map((tag) => tag.localized_tag_name ?? tag.name ?? '')
    .filter((value): value is string => Boolean(value && value.trim()))
}


function getRarity(item: SteamMarketSearchResult): string | undefined {
  const tags = item.asset_description?.tags ?? []


  const rarityTag = tags.find((tag) => {
    const category =
      tag.category?.toLowerCase() ??
      tag.localized_category_name?.toLowerCase() ??
      ''


    return category.includes('rarity')
  })


  return rarityTag?.localized_tag_name ?? rarityTag?.name ?? undefined
}


function getDescription(item: SteamMarketSearchResult): string | undefined {
  const desc =
    item.asset_description?.descriptions
      ?.map((part) => part.value?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
      .trim() ?? ''


  if (desc) return desc


  const type = item.asset_description?.type?.trim()
  return type || undefined
}


function extractItemNameId(html: string): string | null {
  const match =
    html.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/) ??
    html.match(/ItemActivityTicker\.Start\(\s*(\d+)\s*\)/)


  return match?.[1] ?? null
}


function extractLine1ChartFromHtml(html: string): ItemChartPoint[] {
  const match = html.match(/var\s+line1\s*=\s*(\[[\s\S]*?\]);/)


  if (!match?.[1]) {
    return []
  }


  try {
    const rows = JSON.parse(match[1]) as Array<
      [string, string | number, string | number]
    >


    return rows
      .map((row) => {
        const [dateValue, priceValue, volumeValue] = row
        const avgPrice = parseNumber(priceValue) ?? 0
        const volume = parseNumber(volumeValue) ?? 0
        const parsedDate = new Date(dateValue)


        return {
          datetime: Number.isNaN(parsedDate.getTime())
            ? ''
            : parsedDate.toISOString(),
          avgPrice,
          volume,
        }
      })
      .filter((point) => point.datetime && point.avgPrice > 0)
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      )
  } catch {
    return []
  }
}


function createSteamMarketUser() {
  return {
    id: 'steam-market',
    ingameName: 'Steam Market',
    slug: 'steam-market',
    reputation: 0,
    status: 'market',
    locale: 'en',
    platform: 'steam',
    crossplay: false,
  }
}


function histogramRowToOrder(
  row: [string | number, string | number, string],
  type: 'sell' | 'buy',
  index: number
): ItemOrder | null {
  const price = parseNumber(row[0])
  const quantity = parseNumber(row[1])


  if (price === null || quantity === null) {
    return null
  }


  const now = new Date().toISOString()


  return {
    id: `${type}-${index}-${price}-${quantity}`,
    type,
    platinum: price,
    quantity,
    perTrade: 1,
    rank: 0,
    visible: true,
    createdAt: now,
    updatedAt: now,
    user: createSteamMarketUser(),
  }
}


function extractOrdersFromHistogram(
  histogram: SteamItemOrdersHistogramResponse | null
): {
  sellOrders: ItemOrder[]
  buyOrders: ItemOrder[]
} {
  if (!histogram?.success) {
    return {
      sellOrders: [],
      buyOrders: [],
    }
  }


  const rawSell = Array.isArray(histogram.sell_order_graph)
    ? histogram.sell_order_graph
    : []


  const rawBuy = Array.isArray(histogram.buy_order_graph)
    ? histogram.buy_order_graph
    : []


  const sellOrders = rawSell
    .map((row, index) => histogramRowToOrder(row, 'sell', index))
    .filter((order): order is ItemOrder => order !== null)
    .sort((a, b) => a.platinum - b.platinum)
    .slice(0, 20)


  const buyOrders = rawBuy
    .map((row, index) => histogramRowToOrder(row, 'buy', index))
    .filter((order): order is ItemOrder => order !== null)
    .sort((a, b) => b.platinum - a.platinum)
    .slice(0, 20)


  return { sellOrders, buyOrders }
}


async function fetchSearch(query: string, count = 20) {
  return fetchJsonWithRetry<SteamMarketSearchResponse>(
    buildUrl('/market/search/render/', {
      query,
      appid: CS2_APP_ID,
      norender: 1,
      start: 0,
      count,
      search_descriptions: 0,
      sort_column: 'name',
      sort_dir: 'asc',
    }),
    {
      retries: 1,
      timeoutMs: 8000,
    }
  )
}


async function fetchPriceOverview(marketHashName: string) {
  return fetchJsonWithRetry<SteamPriceOverviewResponse>(
    buildUrl('/market/priceoverview/', {
      appid: CS2_APP_ID,
      currency: USD_CURRENCY,
      market_hash_name: marketHashName,
    }),
    {
      retries: 1,
      timeoutMs: 8000,
    }
  )
}


async function fetchListingPage(marketHashName: string) {
  return fetchTextWithRetry(buildListingUrl(marketHashName), {
    retries: 0,
    timeoutMs: 2500,
    headers: {
      Referer: 'https://steamcommunity.com/market/',
    },
  })
}


async function fetchItemOrdersHistogram(
  itemNameId: string,
  marketHashName: string
) {
  return fetchJsonWithRetry<SteamItemOrdersHistogramResponse>(
    buildUrl('/market/itemordershistogram', {
      country: 'US',
      language: 'english',
      currency: USD_CURRENCY,
      item_nameid: itemNameId,
      two_factor: 0,
    }),
    {
      retries: 1,
      timeoutMs: 8000,
      headers: {
        Referer: buildListingUrl(marketHashName),
      },
    }
  )
}


export class Cs2Provider implements GameProvider {
  readonly gameId = 'cs2' as const
  readonly gameLabel = 'CS2'
  readonly enabled = true


  getImageUrl(icon?: string | null): string | null {
    if (!icon) return null


    if (icon.startsWith('http://') || icon.startsWith('https://')) {
      return icon
    }


    const clean = icon.replace(/^\/+/, '')
    return `${STEAM_IMAGE_CDN}/${clean}`
  }


  async getCurrentPrice(externalId: string): Promise<number | null> {
    const marketHashName = safeDecode(externalId).trim()


    if (!marketHashName) {
      return null
    }


    const overview = await fetchPriceOverview(marketHashName)


    return getPriceOverviewPrice(overview)
  }


  async normalizeItem(raw: unknown): Promise<NormalizedItem | null> {
    if (!raw || typeof raw !== 'object') return null


    const item = raw as SteamMarketSearchResult
    const externalId = getExternalId(item)


    if (!externalId) {
      return null
    }


    return {
      externalId,
      name: getItemName(item),
      game: this.gameLabel,
      currentPrice: getSearchResultPrice(item),
      icon: getItemImage(item),
    }
  }


  async searchItems(query: string): Promise<NormalizedItem[]> {
    const normalizedQuery = normalize(query)


    if (!normalizedQuery || normalizedQuery.length < 2) {
      return []
    }


    const searchResponse = await fetchSearch(query, 20)
    const sourceItems = extractResults(searchResponse)


    const filtered = sourceItems.filter((item) => {
      const name = getItemName(item)
      const externalId = getExternalId(item) ?? ''


      return (
        normalize(name).includes(normalizedQuery) ||
        normalize(externalId).includes(normalizedQuery)
      )
    })


    const limited = filtered.slice(0, 8)


    const normalized = await Promise.all(
      limited.map(async (item) => {
        const base = await this.normalizeItem(item)


        if (!base) {
          return null
        }


        if (base.currentPrice !== null) {
          return base
        }


        const currentPrice = await this.getCurrentPrice(base.externalId)


        return {
          ...base,
          currentPrice,
        }
      })
    )


    return normalized.filter((item): item is NormalizedItem => item !== null)
  }


  async getItem(externalId: string): Promise<GameItemDetails | null> {
    const marketHashName = safeDecode(externalId).trim()


    if (!marketHashName) {
      return null
    }


    const [searchResponse, overview, listingHtml] = await Promise.all([
      fetchSearch(marketHashName, 10),
      fetchPriceOverview(marketHashName),
      fetchListingPage(marketHashName),
    ])


    const matched = findBestMatch(extractResults(searchResponse), marketHashName)


    const itemNameId = listingHtml ? extractItemNameId(listingHtml) : null


    const histogram = itemNameId
      ? await fetchItemOrdersHistogram(itemNameId, marketHashName)
      : null


    const { sellOrders, buyOrders } = extractOrdersFromHistogram(histogram)


    const currentPrice =
      getLowestSellFromHistogram(histogram) ??
      getPriceOverviewPrice(overview) ??
      (matched ? getSearchResultPrice(matched) : null)


    const highestBuy =
      getHighestBuyFromHistogram(histogram) ??
      getHighestBuyFromOverview(overview)


    const chart = listingHtml ? extractLine1ChartFromHtml(listingHtml) : []


    const sellCount =
      parseSummaryCount(histogram?.sell_order_summary) || sellOrders.length


    const buyCount =
      parseSummaryCount(histogram?.buy_order_summary) || buyOrders.length


    return {
      item: {
        id: marketHashName,
        slug: marketHashName,
        tags: matched ? getTags(matched) : [],
        rarity: matched ? getRarity(matched) : undefined,
        tradable: matched ? matched.asset_description?.tradable !== 0 : true,
        i18n: {
          en: {
            name: matched ? getItemName(matched) : marketHashName,
            description: matched ? getDescription(matched) : undefined,
            icon: matched ? getItemImage(matched) ?? undefined : undefined,
            thumb: matched ? getItemImage(matched) ?? undefined : undefined,
            wikiLink: undefined,
          },
        },
      },
      chart,
      orders: {
        sellOrders,
        buyOrders,
        lowestSell: currentPrice,
        highestBuy,
      },
      totals: {
        sellCount,
        buyCount,
      },
    }
  }
}

