'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const errorMap: Record<string, string> = {
  invalid_credentials: 'Неверный email или пароль.',
  server_error: 'Ошибка сервера при входе.',
  unauthorized: 'Сначала нужно войти в аккаунт.',
  registered: 'Аккаунт создан. Теперь можно войти.',
}

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const info = params.get('info')

    if (error) {
      setMessage(errorMap[error] ?? 'Ошибка входа.')
    }

    if (info) {
      setMessage(errorMap[info] ?? '')
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error ?? 'Не удалось войти в аккаунт.')
        return
      }

      router.push('/profile')
      router.refresh()
    } catch {
      setMessage('Ошибка соединения с сервером.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">

          <h1 className="mb-4 text-3xl font-bold">Вход в аккаунт</h1>

          <p className="mb-6 text-sm leading-6 text-slate-300">
            Войдите в аккаунт, чтобы управлять подписками и получать уведомления через VK.
          </p>

          {message ? (
            <div className="mb-5 rounded-2xl border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-sm text-blue-100">
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
                placeholder="user@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
                placeholder="Введите пароль"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white-950 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
            <Link href="/" className="hover:text-white">
              На главную
            </Link>

            <Link href="/register" className="text-blue-300 hover:text-blue-200">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

