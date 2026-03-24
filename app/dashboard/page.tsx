import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/current-user'

export const dynamic = 'force-dynamic'

const games = [
  { id: 'warframe', name: 'Warframe', enabled: true },
  { id: 'cs2', name: 'CS2', enabled: false },
  { id: 'dota2', name: 'Dota 2', enabled: false },
]

function resolveGameLabel(gameParam?: string) {
  if (gameParam === 'warframe') return 'Warframe'
  if (gameParam === 'cs2') return 'CS2'
  if (gameParam === 'dota2') return 'Dota 2'
  return 'Warframe'
}

function resolveGameId(gameParam?: string) {
  if (gameParam === 'warframe') return 'warframe'
  if (gameParam === 'cs2') return 'cs2'
  if (gameParam === 'dota2') return 'dota2'
  return 'warframe'
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const user = await requireCurrentUser()

  const params = await searchParams
  const selectedGameId = resolveGameId(params.game)
  const selectedGameLabel = resolveGameLabel(params.game)

  const [itemsCount, subscriptionsCount, notificationsCount, latestNotifications] =
    await Promise.all([
      prisma.item.count({
        where: {
          game: selectedGameLabel,
        },
      }),
      prisma.subscription.count({
        where: {
          userId: user.id,
          isActive: true,
          item: {
            game: selectedGameLabel,
          },
        },
      }),
      prisma.notification.count({
        where: {
          userId: user.id,
          item: {
            game: selectedGameLabel,
          },
        },
      }),
      prisma.notification.findMany({
        where: {
          userId: user.id,
          item: {
            game: selectedGameLabel,
          },
        },
        include: {
          item: {
            select: {
              name: true,
              game: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: 5,
      }),
    ])

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
      <header className="mb-10 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Панель мониторинга
          </h1>
          <p className="mt-2 text-slate-300">
            Сводка по предметам, подпискам и уведомлениям для игры:{' '}
            <span className="font-medium text-white">{selectedGameLabel}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Главная
          </Link>
          <Link
            href={`/subscriptions?game=${selectedGameId}`}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            Подписки
          </Link>
        </div>
      </header>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-blue-300/80">
          Выбор игры
        </p>

        <div className="flex flex-wrap gap-3">
          {games.map((game) => {
            const isSelected = selectedGameId === game.id

            return game.enabled ? (
              <Link
                key={game.id}
                href={`/dashboard?game=${game.id}`}
                className={`rounded-2xl px-4 py-2 text-sm transition ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'border border-white/10 bg-slate-900/70 text-slate-200 hover:bg-white/10'
                }`}
              >
                {game.name}
              </Link>
            ) : (
              <button
                key={game.id}
                type="button"
                disabled
                className="cursor-not-allowed rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-2 text-sm text-slate-500"
              >
                {game.name} • скоро
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Предметы в базе</p>
          <p className="mt-2 text-3xl font-bold text-white">{itemsCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Ваши активные подписки</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {subscriptionsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Ваши уведомления по игре</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {notificationsCount}
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Последние уведомления
            </h2>
          </div>

          {latestNotifications.length === 0 ? (
            <p className="text-slate-400">
              Уведомлений для выбранной игры пока нет.
            </p>
          ) : (
            <div className="space-y-4">
              {latestNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <p className="font-medium text-white">
                    {notification.item?.name ?? notification.itemName}
                  </p>

                  <p className="mt-1 text-xs text-blue-300">
                    {notification.item?.game ?? selectedGameLabel}
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(notification.sentAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Быстрые действия</h2>

          <div className="mt-5 space-y-3">
            <Link
              href={`/subscriptions?game=${selectedGameId}`}
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
            >
              Перейти к управлению подписками
            </Link>

            <Link
              href="/profile"
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
            >
              Открыть профиль
            </Link>

            <Link
              href="/"
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}