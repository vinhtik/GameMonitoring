import Link from 'next/link'
import Script from 'next/script'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const telegramBotName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ''

  const errorMap: Record<string, string> = {
    telegram_data_missing: 'Telegram не передал нужные данные для входа.',
    telegram_data_expired: 'Данные входа устарели. Попробуй снова.',
    telegram_invalid_hash: 'Не удалось проверить подпись Telegram.',
    server_error: 'Ошибка сервера при входе.',
    unauthorized: 'Сначала нужно войти в аккаунт.',
  }

  const errorText = params.error
    ? errorMap[params.error] ?? 'Ошибка входа.'
    : ''

  const authUrl = appUrl ? `${appUrl}/api/auth/telegram` : ''

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-8">
      <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
          Auth
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Вход через Telegram
        </h1>

        <p className="mt-3 text-slate-300">
          Войди через Telegram, чтобы твои подписки, профиль и уведомления были
          привязаны к твоему аккаунту.
        </p>

        {errorText ? (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {errorText}
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          {telegramBotName && authUrl ? (
            <>

              <div className="mt-4" id="telegram-login-widget" />

              <Script id="telegram-login-init" strategy="afterInteractive">
                {`
                  (function () {
                    const container = document.getElementById('telegram-login-widget');
                    if (!container || container.hasChildNodes()) return;

                    const script = document.createElement('script');
                    script.async = true;
                    script.src = 'https://telegram.org/js/telegram-widget.js?22';
                    script.setAttribute('data-telegram-login', '${telegramBotName}');
                    script.setAttribute('data-size', 'large');
                    script.setAttribute('data-auth-url', '${authUrl}');
                    script.setAttribute('data-request-access', 'write');

                    container.appendChild(script);
                  })();
                `}
              </Script>

            </>
          ) : (
            <p className="text-sm text-slate-300">
              Не настроены переменные окружения для Telegram Login Widget.
            </p>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  )
}