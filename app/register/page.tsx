'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    if (password !== passwordRepeat) {
      setMessage('Пароли не совпадают.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error ?? 'Не удалось создать аккаунт.')
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

          <h1 className="mb-4 text-3xl font-bold">Регистрация</h1>

          <p className="mb-6 text-sm leading-6 text-slate-300">
            Создайте аккаунт, чтобы сохранять подписки и подключить VK для уведомлений.
          </p>

          {message ? (
            <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Имя</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
                placeholder="Ваше имя"
              />
            </label>

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
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
                placeholder="Минимум 6 символов"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                Повторите пароль
              </span>
              <input
                type="password"
                value={passwordRepeat}
                onChange={(event) => setPasswordRepeat(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
                placeholder="Повторите пароль"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white-950 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
            <Link href="/" className="hover:text-white">
              На главную
            </Link>

            <Link href="/login" className="text-blue-300 hover:text-blue-200">
              Уже есть аккаунт
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

