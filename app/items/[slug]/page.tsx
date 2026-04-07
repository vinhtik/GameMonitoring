import Image from 'next/image'
import Link from 'next/link'
import ItemCharts from '@/components/ItemCharts'
import { loadGameItemDetails } from '@/lib/games/load-game-item-details'
import { getGameDisplayConfig } from '@/lib/games/game-display'
import { GameItemDetails, ItemOrder } from '@/lib/games/types'

type ItemDetailsWithItem = GameItemDetails & {
  item: NonNullable<GameItemDetails['item']>
}

type OrderSide = 'sell' | 'buy'

function ItemErrorState({
  game,
  title,
  description,
}: {
  game: string
  title: string
  description: string
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8 lg:px-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
          Item
        </p>

        <h1 className="mt-2 text-2xl font-bold text-white">{title}</h1>

        <p className="mt-3 text-slate-300">{description}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/subscriptions?game=${game}`}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Назад к подпискам
          </Link>

          <Link
            href={`/dashboard?game=${game}`}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}

function OrderCard({
  order,
  side,
  priceColorClass,
  game,
  itemName,
}: {
  order: ItemOrder
  side: OrderSide
  priceColorClass: string
  game: string
  itemName: string
}) {
  const display = getGameDisplayConfig(game)
  const marketUrl = display.getMarketUrl?.(itemName) ?? null
  const meta = display.getOrderMeta(order, side)

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-white">
            {display.getOrderTitle(order, side)}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {display.getOrderSubtitle(order, side)}
          </p>
        </div>

        <div className="text-right">
          <p className={`text-lg font-bold ${priceColorClass}`}>
            {display.formatPrice(order.platinum)}
          </p>
          <p className="text-sm text-slate-400">
            {display.getOrderQuantityLabel(order, side)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {meta.map((value) => (
          <span key={value}>{value}</span>
        ))}

        {marketUrl ? (
          <a
            href={marketUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-300 transition hover:text-blue-200"
          >
            Открыть в маркете
          </a>
        ) : null}
      </div>
    </div>
  )
}

function ItemContent({
  game,
  data,
  imageUrl,
}: {
  game: string
  data: ItemDetailsWithItem
  imageUrl: string | null
}) {
  const display = getGameDisplayConfig(game)

  const item = data.item
  const chart = data.chart ?? []
  const sellOrders = (data.orders?.sellOrders ?? []).slice(0, 20)
  const buyOrders = (data.orders?.buyOrders ?? []).slice(0, 20)

  const itemName =
    item.i18n?.en?.name ??
    ('slug' in item && typeof item.slug === 'string' ? item.slug : 'Unknown item')

  const itemDescription = item.i18n?.en?.description ?? 'Описание отсутствует'
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
            href={`/subscriptions?game=${game}`}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Подписки
          </Link>

          <Link
            href={`/dashboard?game=${game}`}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-[120px_1fr] md:items-start">
          <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={itemName}
                width={120}
                height={120}
                className="h-full w-full object-contain"
                unoptimized
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div className="text-sm text-slate-500">Нет изображения</div>
            )}
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
              {display.itemLabel}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">{itemName}</h1>

            <p className="mt-3 max-w-3xl whitespace-pre-line text-slate-300">
              {itemDescription}
            </p>

            {display.sourceLabel ? (
              <p className="mt-3 text-sm text-slate-400">{display.sourceLabel}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {'rarity' in item && item.rarity ? (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                  Редкость: {item.rarity}
                </span>
              ) : null}

              {'maxRank' in item && typeof item.maxRank === 'number' ? (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                  Макс. ранг: {item.maxRank}
                </span>
              ) : null}

              {'tradingTax' in item && typeof item.tradingTax === 'number' ? (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                  Налог на торговлю: {item.tradingTax}
                </span>
              ) : null}

              {'tradable' in item && typeof item.tradable === 'boolean' ? (
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                  Можно торговать: {item.tradable ? 'да' : 'нет'}
                </span>
              ) : null}
            </div>

            {'tags' in item && Array.isArray(item.tags) && item.tags.length ? (
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
          <p className="text-sm text-slate-400">{display.lowestSellLabel}</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {display.formatPrice(data.orders?.lowestSell)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">{display.highestBuyLabel}</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {display.formatPrice(data.orders?.highestBuy)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">{display.sellOrdersLabel}</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.totals?.sellCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">{display.buyOrdersLabel}</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.totals?.buyCount ?? 0}
          </p>
        </div>
      </section>

      <section className="mb-8 min-w-0">
        <ItemCharts chart={chart} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {display.sellOrdersLabel}
            </h2>
            <span className="text-sm text-slate-400">
              Показано: {sellOrders.length}
            </span>
          </div>

          {sellOrders.length === 0 ? (
            <p className="text-slate-400">{display.sellEmptyText}</p>
          ) : (
            <div className="space-y-3">
              {sellOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  side="sell"
                  priceColorClass="text-blue-300"
                  game={game}
                  itemName={itemName}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {display.buyOrdersLabel}
            </h2>
            <span className="text-sm text-slate-400">
              Показано: {buyOrders.length}
            </span>
          </div>

          {buyOrders.length === 0 ? (
            <p className="text-slate-400">{display.buyEmptyText}</p>
          ) : (
            <div className="space-y-3">
              {buyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  side="buy"
                  priceColorClass="text-emerald-300"
                  game={game}
                  itemName={itemName}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
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

  const result = await loadGameItemDetails(game, slug)

  if (!result.ok) {
    if (result.status === 404) {
      return (
        <ItemErrorState
          game={game}
          title="Предмет не найден"
          description="По этому slug предмет не найден или провайдер игры недоступен."
        />
      )
    }

    return (
      <ItemErrorState
        game={game}
        title="Не удалось загрузить предмет"
        description="Внешний API временно недоступен или вернул ошибку."
      />
    )
  }

  if (!result.data.item) {
    return (
      <ItemErrorState
        game={game}
        title="Предмет не найден"
        description="Провайдер вернул ответ без item."
      />
    )
  }

  const data: ItemDetailsWithItem = {
    ...result.data,
    item: result.data.item,
  }

  const iconPath = data.item.i18n?.en?.thumb || data.item.i18n?.en?.icon || null
  const imageUrl = result.provider.getImageUrl(iconPath)

  return <ItemContent game={game} data={data} imageUrl={imageUrl} />
}