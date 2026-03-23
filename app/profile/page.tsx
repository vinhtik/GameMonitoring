'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Profile = {
  id: string
  name: string | null
  telegramChatId: string | null
  telegramUsername: string | null
  telegramLinkedAt: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [telegramLink, setTelegramLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadProfile() {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/profile', { cache: 'no-store' })
      const data = await res.json()

      setProfile(data)
      setName(data?.name ?? '')
    } catch {
      setMessage('Не удалось загрузить профиль')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error ?? 'Не удалось сохранить профиль')
        return
      }

      setProfile(data)
      setMessage('Профиль сохранён')
    } catch {
      setMessage('Ошибка сохранения профиля')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateTelegramLink() {
    setMessage('')

    try {
      const res = await fetch('/api/telegram/link', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error ?? 'Не удалось создать ссылку')
        return
      }

      setTelegramLink(data.link)
      setMessage('Ссылка для привязки создана')
    } catch {
      setMessage('Ошибка генерации Telegram-ссылки')
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Загрузка...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Профиль</h1>
          <p className="mt-2 text-slate-300">
            Здесь настраивается имя и привязка Telegram для уведомлений.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/subscriptions"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Подписки
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Основные данные</h2>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white transition hover:bg-blue-400 disabled:opacity-60"
            >
              {saving ? 'Сохранение...' : 'Сохранить профиль'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Telegram</h2>

          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>
              Статус:{' '}
              {profile?.telegramChatId ? 'привязан' : 'не привязан'}
            </p>

            <p>
              Username:{' '}
              {profile?.telegramUsername ? `@${profile.telegramUsername}` : '—'}
            </p>

            <p>
              Chat ID: {profile?.telegramChatId ?? '—'}
            </p>

            <p>
              Привязан:{' '}
              {profile?.telegramLinkedAt
                ? formatDate(profile.telegramLinkedAt)
                : '—'}
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleGenerateTelegramLink}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 transition hover:bg-white/10"
            >
              Создать ссылку для привязки Telegram
            </button>

            {telegramLink ? (
              <a
                href={telegramLink}
                target="_blank"
                rel="noreferrer"
                className="block break-all rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200"
              >
                {telegramLink}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {message ? (
        <p className="mt-6 text-sm text-slate-300">{message}</p>
      ) : null}
    </main>
  )
}