'use client'


import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'


type Profile = {
  id: string
  name: string | null
  email: string | null
  vkId: string | null
  vkPeerId: string | null
  vkUsername: string | null
  vkLinkedAt: string | null
}


type VkLinkResponse = {
  code?: string
  groupUrl?: string | null
  message?: string
  error?: string
}


function formatDate(value: string | null) {
  if (!value) {
    return '—'
  }


  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}


export default function ProfilePage() {
  const router = useRouter()


  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [vkLinkCode, setVkLinkCode] = useState('')
  const [vkGroupUrl, setVkGroupUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingVkCode, setCreatingVkCode] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)


  async function loadProfile() {
    setLoading(true)
    setMessage('')


    try {
      const res = await fetch('/api/profile', { cache: 'no-store' })
      const data = await res.json()


      if (res.status === 401) {
        window.location.href = '/login?error=unauthorized'
        return
      }


      if (!res.ok) {
        setMessage(data.error ?? 'Не удалось загрузить профиль')
        return
      }


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


      if (res.status === 401) {
        window.location.href = '/login?error=unauthorized'
        return
      }


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


  async function handleGenerateVkCode() {
    setCreatingVkCode(true)
    setMessage('')
    setVkLinkCode('')
    setVkGroupUrl('')


    try {
      const res = await fetch('/api/vk/link', {
        method: 'POST',
      })


      const data = (await res.json()) as VkLinkResponse


      if (res.status === 401) {
        window.location.href = '/login?error=unauthorized'
        return
      }


      if (!res.ok) {
        setMessage(data.error ?? 'Не удалось создать код привязки')
        return
      }


      setVkLinkCode(data.code ?? '')
      setVkGroupUrl(data.groupUrl ?? '')
      setMessage(data.message ?? 'Код для привязки создан')
    } catch {
      setMessage('Ошибка генерации VK-кода')
    } finally {
      setCreatingVkCode(false)
    }
  }


  async function handleCopyCode() {
    if (!vkLinkCode) {
      return
    }


    try {
      await navigator.clipboard.writeText(vkLinkCode)
      setMessage('Код скопирован')
    } catch {
      setMessage('Не удалось скопировать код')
    }
  }


  async function handleLogout() {
    setLoggingOut(true)
    setMessage('')


    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
      })


      if (!res.ok) {
        setMessage('Не удалось выйти из аккаунта')
        return
      }


      window.location.href = '/login'
    } catch {
      setMessage('Ошибка выхода из аккаунта')
    } finally {
      setLoggingOut(false)
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
            Здесь настраивается имя и привязка vk для уведомлений.
          </p>
        </div>


        <div className="flex gap-3">
          <Link
            href="/subscriptions?game=warframe"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Подписки
          </Link>


          <Link
            href="/dashboard?game=warframe"
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            Dashboard
          </Link>


          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
          >
            {loggingOut ? 'Выход...' : 'Выйти'}
          </button>
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
          <h2 className="text-xl font-semibold text-white">vk</h2>


          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>
              Статус: {profile?.vkPeerId ? 'привязан' : 'не авторизован'}
            </p>


            <p>
              Username:{' '}
              {profile?.vkUsername ? `@${profile.vkUsername}` : '—'}
            </p>


            <p>VK ID: {profile?.vkId ?? '—'}</p>


            <p>Chat ID: {profile?.vkPeerId ?? '—'}</p>


            <p>
              Привязан: {formatDate(profile?.vkLinkedAt ?? null)}
            </p>
          </div>


          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleGenerateVkCode}
              disabled={creatingVkCode}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
            >
              {creatingVkCode
                ? 'Создание...'
                : 'Создать код для привязки vk-бота'}
            </button>


            {vkLinkCode ? (
              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                <p className="mb-2 text-slate-200">Код для привязки:</p>


                <div className="mb-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-lg font-bold tracking-widest text-white">
                  {vkLinkCode}
                </div>


                <p className="mb-3 text-slate-300">
                  Отправьте этот код в сообщения сообщества VK.
                </p>


                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    Скопировать код
                  </button>


                  {vkGroupUrl ? (
                    <a
                      href={vkGroupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
                    >
                      Открыть сообщения VK
                    </a>
                  ) : null}
                </div>
              </div>
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

