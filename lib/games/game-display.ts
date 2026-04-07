import { ItemOrder } from '@/lib/games/types'

type OrderSide = 'sell' | 'buy'

export type GameDisplayConfig = {
  itemLabel: string
  lowestSellLabel: string
  highestBuyLabel: string
  sellOrdersLabel: string
  buyOrdersLabel: string
  sellEmptyText: string
  buyEmptyText: string
  sourceLabel?: string

  formatPrice: (value: number | null | undefined) => string

  getMarketUrl?: (itemName: string) => string | null

  getOrderTitle: (order: ItemOrder, side: OrderSide) => string
  getOrderSubtitle: (order: ItemOrder, side: OrderSide) => string
  getOrderQuantityLabel: (order: ItemOrder, side: OrderSide) => string
  getOrderMeta: (order: ItemOrder, side: OrderSide) => string[]
}

const warframeDisplay: GameDisplayConfig = {
  itemLabel: 'Item',
  lowestSellLabel: 'Лучшая цена продажи',
  highestBuyLabel: 'Лучшая цена покупки',
  sellOrdersLabel: 'Sell ордера',
  buyOrdersLabel: 'Buy ордера',
  sellEmptyText: 'Нет sell ордеров.',
  buyEmptyText: 'Нет buy ордеров.',

  formatPrice(value) {
    if (value == null || Number.isNaN(value)) return '—'
    return `${value} plat`
  },

  getOrderTitle(order) {
    return order.user.ingameName
  },

  getOrderSubtitle(order) {
    return `Репутация: ${order.user.reputation} • Статус: ${order.user.status}`
  },

  getOrderQuantityLabel(order) {
    return `Кол-во: ${order.quantity}`
  },

  getOrderMeta(order) {
    return [
      `rank: ${order.rank ?? 0}`,
      `updated: ${new Date(order.updatedAt).toLocaleString('ru-RU')}`,
    ]
  },
}

const cs2Display: GameDisplayConfig = {
  itemLabel: 'CS2 Item',
  lowestSellLabel: 'Лучшая цена продажи',
  highestBuyLabel: 'Лучшая цена покупки',
  sellOrdersLabel: 'Заявки на продажу',
  buyOrdersLabel: 'Заявки на покупку',
  sellEmptyText: 'Нет заявок на продажу.',
  buyEmptyText: 'Нет заявок на покупку.',
  sourceLabel: 'Источник: Steam Community Market',

  formatPrice(value) {
    if (value == null || Number.isNaN(value)) return '—'

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  },

  getMarketUrl(itemName) {
    return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(itemName)}`
  },

  getOrderTitle() {
    return 'Steam Community Market'
  },

  getOrderSubtitle(_, side) {
    return side === 'sell' ? 'Тип: продажа' : 'Тип: покупка'
  },

  getOrderQuantityLabel(order) {
    return `Объём: ${order.quantity}`
  },

  getOrderMeta(order) {
    return [`Обновлено: ${new Date(order.updatedAt).toLocaleString('ru-RU')}`]
  },
}

export function getGameDisplayConfig(game: string): GameDisplayConfig {
  if (game === 'cs2') return cs2Display
  return warframeDisplay
}