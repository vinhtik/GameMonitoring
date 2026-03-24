import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ItemCharts from '@/components/ItemCharts'

type ChartPoint = {
  datetime: string
  avgPrice: number
  volume: number
}

type OrderUser = {
  id: string
  ingameName: string
  slug: string
  reputation: number
  status: string
  locale?: string
  platform?: string
  crossplay?: boolean
}

type Order = {
  id: string
  type: 'buy' | 'sell'
  platinum: number
  quantity: number
  perTrade: number
  rank?: number
  visible: boolean
  createdAt: string
  updatedAt: string
  user: OrderUser
}

type ItemPayload = {
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
  chart?: ChartPoint[]
  orders?: {
    sellOrders?: Order[]
    buyOrders?: Order[]
    lowestSell?: number | null
    highestBuy?: number | null
  }
  totals?: {
    sellCount?: number
    buyCount?: number
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU')
}

function getImageUrl(path?: string) {
  if (!path) return null
  return `https://warframe.market/static/assets/${path}`
}

async function getItem(
  slug: string,
  game: string = 'warframe'
): Promise<ItemPayload | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'

  try {
    const response = await fetch(
      `${baseUrl}/api/items/${encodeURIComponent(slug)}?game=${encodeURIComponent(game)}`,
      {
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as ItemPayload
    return data
  } catch {
    return null
  }
}

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ game?: string }>
}) {
  const { slug } = await params
  const { game = 'warframe' } = await searchParams
  const data = await getItem(slug, game)

  if (!data || !data.item) {
    notFound()
  }

  const item = data.item
  const chart = data.chart ?? []
  const sellOrders = (data.orders?.sellOrders ?? []).slice(0, 20)
  const buyOrders = (data.orders?.buyOrders ?? []).slice(0, 20)

  const itemName = item.i18n?.en?.name ?? item.slug ?? 'Unknown item'
  const itemDescription = item.i18n?.en?.description ?? 'Описание отсутствует'
  const itemImage = getImageUrl(item.i18n?.en?.thumb || item.i18n?.en?.icon)
  const wikiLink = item.i18n?.en?.wikiLink

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
      <header className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Главная
          </Link>

          <Link
            href="/subscriptions?game=warframe"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Подписки
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-[120px_1fr] md:items-start">
          <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
            {itemImage ? (
              <Image
                src={itemImage}
                alt={itemName}
                width={120}
                height={120}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="text-sm text-slate-500">Нет изображения</div>
            )}
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
              Item
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">{itemName}</h1>

            <p className="mt-3 max-w-3xl whitespace-pre-line text-slate-300">
              {itemDescription}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {item.rarity ? (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                  Редкость: {item.rarity}
                </span>
              ) : null}

              {typeof item.maxRank === 'number' ? (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                  Макс. ранг: {item.maxRank}
                </span>
              ) : null}

              {typeof item.tradingTax === 'number' ? (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                  Налог: {item.tradingTax}
                </span>
              ) : null}

              <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                Можно торговать: {item.tradable ? 'да' : 'нет'}
              </span>
            </div>

            {item.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {wikiLink ? (
              <div className="mt-4">
                <a
                  href={wikiLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-300 transition hover:text-blue-200"
                >
                  Открыть в Wiki
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Лучшая цена продажи</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.orders?.lowestSell ?? '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Лучшая цена покупки</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.orders?.highestBuy ?? '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Sell ордеров</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.totals?.sellCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Buy ордеров</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.totals?.buyCount ?? 0}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <ItemCharts chart={chart} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Sell ордера</h2>
            <span className="text-sm text-slate-400">
              Показано: {sellOrders.length}
            </span>
          </div>

          {sellOrders.length === 0 ? (
            <p className="text-slate-400">Нет sell ордеров.</p>
          ) : (
            <div className="space-y-3">
              {sellOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">
                        {order.user.ingameName}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Репутация: {order.user.reputation} • Статус:{' '}
                        {order.user.status}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-300">
                        {order.platinum} plat
                      </p>
                      <p className="text-sm text-slate-400">
                        Кол-во: {order.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>rank: {order.rank ?? 0}</span>
                    <span>updated: {formatDate(order.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Buy ордера</h2>
            <span className="text-sm text-slate-400">
              Показано: {buyOrders.length}
            </span>
          </div>

          {buyOrders.length === 0 ? (
            <p className="text-slate-400">Нет buy ордеров.</p>
          ) : (
            <div className="space-y-3">
              {buyOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">
                        {order.user.ingameName}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Репутация: {order.user.reputation} • Статус:{' '}
                        {order.user.status}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-300">
                        {order.platinum} plat
                      </p>
                      <p className="text-sm text-slate-400">
                        Кол-во: {order.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>rank: {order.rank ?? 0}</span>
                    <span>updated: {formatDate(order.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}