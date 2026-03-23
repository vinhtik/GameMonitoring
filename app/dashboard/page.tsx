import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [itemsCount, subscriptionsCount, notificationsCount, latestNotifications] =
    await Promise.all([
      prisma.item.count(),
      prisma.subscription.count({
        where: { isActive: true },
      }),
      prisma.notification.count(),
      prisma.notification.findMany({
        orderBy: { sentAt: 'desc' },
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
            Сводка по предметам, подпискам и отправленным уведомлениям.
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
            href="/subscriptions"
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            Подписки
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Предметы в базе</p>
          <p className="mt-2 text-3xl font-bold text-white">{itemsCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Активные подписки</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {subscriptionsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Всего уведомлений</p>
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
            <Link
              href="/api/notifications"
              className="text-sm text-blue-300 hover:text-blue-200"
            >
              Открыть API
            </Link>
          </div>

          {latestNotifications.length === 0 ? (
            <p className="text-slate-400">Уведомлений пока нет.</p>
          ) : (
            <div className="space-y-4">
              {latestNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <p className="font-medium text-white">
                    {notification.itemName}
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
              href="/subscriptions"
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
            >
              Перейти к управлению подписками
            </Link>

            <a
              href="/api/items"
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
            >
              Посмотреть предметы через API
            </a>

            <a
              href="/api/notifications"
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
            >
              Посмотреть уведомления через API
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}