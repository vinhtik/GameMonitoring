import Link from 'next/link'

const games = [
  { id: 'warframe', name: 'Warframe', enabled: true },
  { id: 'cs2', name: 'CS2', enabled: false },
  { id: 'dota2', name: 'Dota 2', enabled: false },
]

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="mb-12 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
            Game Monitoring
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Monitoring Platform
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Единая платформа для отслеживания предметов, цен, подписок и уведомлений.
          </p>
        </div>

        <nav className="flex flex-wrap gap-3">
          <a
            href="#games"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Игры
          </a>
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

      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm text-blue-200">
            Веб-приложение + Telegram уведомления
          </span>

          <h2 className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
            Мониторинг игровых предметов и цен в одном интерфейсе
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Платформа получает данные из внешних API, сохраняет их в базе,
            сравнивает с условиями подписок и отправляет уведомления в Telegram,
            когда цена достигает нужного значения.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-blue-500 px-6 py-3 font-medium text-white transition hover:bg-blue-400"
            >
              Открыть панель
            </Link>

            <Link
              href="/subscriptions?game=warframe"
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
                <p className="text-sm text-slate-400">Текущий статус системы</p>
                <p className="text-lg font-semibold text-white">Мониторинг активен</p>
              </div>

              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
                online
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">Warframe Market API</p>
                    <p className="text-sm text-slate-400">
                      Источник данных для текущей интеграции
                    </p>
                  </div>

                  <p className="text-right text-sm text-slate-300">
                    Статус
                    <span className="block text-lg font-semibold text-white">
                      подключён
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">Подписки на цены</p>
                    <p className="text-sm text-slate-400">
                      Условия “меньше/больше нужного значения”
                    </p>
                  </div>

                  <p className="text-right text-sm text-slate-300">
                    Пример
                    <span className="block text-lg font-semibold text-blue-300">
                      ≤ 50 plat
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                <p className="text-sm text-blue-200">Последнее событие</p>
                <p className="mt-1 font-medium text-white">
                  Telegram-уведомление отправляется автоматически, когда цена достигает заданного порога
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16" id="games">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
                Games
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                Поддерживаемые игры
              </h3>
              <p className="mt-2 max-w-2xl text-slate-300">
                Архитектура платформы рассчитана на несколько игр. Сейчас активна интеграция с Warframe, позже можно подключить другие игровые API.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {games.map((game) => (
              <div
                key={game.id}
                className={`rounded-2xl border p-5 ${
                  game.enabled
                    ? 'border-blue-400/30 bg-blue-500/10'
                    : 'border-white/10 bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{game.name}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {game.enabled
                        ? 'Интеграция активна и доступна для мониторинга.'
                        : 'Подготовлено место для будущего подключения API.'}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      game.enabled
                        ? 'bg-emerald-400/15 text-emerald-300'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {game.enabled ? 'active' : 'soon'}
                  </span>
                </div>

                <div className="mt-5">
                  {game.enabled ? (
                    <Link
                      href={`/subscriptions?game=${game.id}`}
                      className="inline-flex rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
                    >
                      Открыть {game.name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-500"
                    >
                      Скоро доступно
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16" id="features">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Мониторинг API</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Сервис получает данные из внешнего API, обновляет цены и сохраняет изменения в базе данных.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Гибкие подписки</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Пользователь может сохранять условия отслеживания, управлять подписками и контролировать важные ценовые пороги.
            </p>
          </div>

          <div
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
            id="start"
          >
            <h3 className="text-lg font-semibold text-white">
              Telegram-уведомления
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Telegram используется как канал доставки уведомлений, когда система фиксирует нужное рыночное событие.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}