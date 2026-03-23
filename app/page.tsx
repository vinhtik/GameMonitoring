import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="mb-12 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
            Game Monitoring
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Monitoring Platform
          </h1>
        </div>

        <nav className="hidden gap-3 md:flex">
          <a
            href="#features"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Возможности
          </a>
          <a
            href="#stats"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Статистика
          </a>
          <a
            href="#start"
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            Начать
          </a>
        </nav>
      </header>

      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm text-blue-200">
            Веб-приложение + Telegram уведомления
          </span>

          <h2 className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
            Мониторинг предметов, цен и подписок в одном интерфейсе
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Платформа отслеживает данные из внешнего API, сохраняет их в базе,
            сравнивает с условиями подписок и отправляет уведомления в Telegram
            при достижении нужного значения.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-blue-500 px-6 py-3 font-medium text-white transition hover:bg-blue-400"
            >
              Открыть панель
            </Link>
            <Link
              href="/subscriptions"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-200 transition hover:bg-white/10"
            >
              Посмотреть подписки
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3" id="stats">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Активные подписки</p>
              <p className="mt-2 text-2xl font-bold text-white">24</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Предметы в базе</p>
              <p className="mt-2 text-2xl font-bold text-white">318</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Уведомления сегодня</p>
              <p className="mt-2 text-2xl font-bold text-white">12</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Последняя проверка</p>
                <p className="text-lg font-semibold text-white">23.03.2026 18:40</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
                online
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Prime Item A</p>
                    <p className="text-sm text-slate-400">Warframe Market</p>
                  </div>
                  <p className="text-right text-sm text-slate-300">
                    Текущая цена
                    <span className="block text-lg font-semibold text-white">72 plat</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Prime Item B</p>
                    <p className="text-sm text-slate-400">Подписка активна</p>
                  </div>
                  <p className="text-right text-sm text-slate-300">
                    Порог
                    <span className="block text-lg font-semibold text-blue-300">≤ 50 plat</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                <p className="text-sm text-blue-200">Последнее событие</p>
                <p className="mt-1 font-medium text-white">
                  Уведомление отправлено в Telegram по условию “цена ниже целевого значения”
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16" id="features">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Мониторинг API</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Фоновый worker регулярно опрашивает внешний API и обновляет данные в базе.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Гибкие подписки</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Пользователь может сохранять условия отслеживания и управлять уведомлениями через веб-интерфейс.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6" id="start">
            <h3 className="text-lg font-semibold text-white">Telegram-уведомления</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Telegram используется только как канал доставки уведомлений при наступлении нужного события.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}