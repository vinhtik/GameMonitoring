export type GameId = 'warframe' | 'cs2' | 'dota2'

export type NormalizedItem = {
  externalId: string
  name: string
  game: string
  currentPrice: number | null
  icon: string | null
}

export type ItemChartPoint = {
  datetime: string
  avgPrice: number
  volume: number
}

export type ItemOrderUser = {
  id: string
  ingameName: string
  slug: string
  reputation: number
  status: string
  locale?: string
  platform?: string
  crossplay?: boolean
}

export type ItemOrder = {
  id: string
  type: 'buy' | 'sell'
  platinum: number
  quantity: number
  perTrade: number
  rank?: number
  visible: boolean
  createdAt: string
  updatedAt: string
  user: ItemOrderUser
}

export type GameItemDetails = {
  item?: {
    id: string
    slug: string
    tags?: string[]
    rarity?: string
    maxRank?: number
    tradingTax?: number
    tradable?: boolean
    i18n?: {
      en?: {
        name?: string
        description?: string
        icon?: string
        thumb?: string
        wikiLink?: string
      }
    }
  }
  chart?: ItemChartPoint[]
  orders?: {
    sellOrders?: ItemOrder[]
    buyOrders?: ItemOrder[]
    lowestSell?: number | null
    highestBuy?: number | null
  }
  totals?: {
    sellCount?: number
    buyCount?: number
  }
}

export interface GameProvider {
  readonly gameId: GameId
  readonly gameLabel: string
  readonly enabled: boolean

  searchItems(query: string): Promise<NormalizedItem[]>
  getItem(slug: string): Promise<GameItemDetails | null>
  getCurrentPrice(externalId: string): Promise<number | null>
  getImageUrl(icon?: string | null): string | null
  normalizeItem(raw: unknown): Promise<NormalizedItem | null>
}