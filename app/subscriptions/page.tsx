'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Item = {
  id: string
  externalId: string
  name: string
  game: string
  currentPrice: number | null
  icon?: string | null
}

type Subscription = {
  id: string
  targetPrice: number
  condition: string
  isActive: boolean
  createdAt: string
  user: {
    id: string
    name: string | null
    telegramChatId: string | null
    telegramUsername: string | null
  }
  item: {
    id: string
    name: string
    game: string
    currentPrice: number | null
    icon?: string | null
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getImageUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `https://warframe.market/static/assets/${path}`
}

function ItemIcon({
  src,
  alt,
  size = 56,
}: {
  src?: string | null
  alt: string
  size?: number
}) {
  const imageUrl = getImageUrl(src)

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70"
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-contain"
          unoptimized
        />
      ) : (
        <div className="text-[10px] text-slate-500">Нет фото</div>
      )}
    </div>
  )
}

export default function SubscriptionsPage() {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [query, setQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [condition, setCondition] = useState('lte')
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function loadSubscriptions() {
    try {
      const res = await fetch('/api/subscriptions', { cache: 'no-store' })
      const data = await res.json()
      setSubscriptions(Array.isArray(data) ? data : [])
    } catch {
      setMessage('Не удалось загрузить подписки')
    }
  }

  useEffect(() => {
    if (!mounted) return
    loadSubscriptions()
  }, [mounted])

  async function searchItems() {
    setSearchLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/items?q=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setItems([])
        setMessage(data.error ?? 'Не удалось загрузить предметы')
        return
      }

      setItems(data.items ?? [])

      if (!data.items?.length) {
        setMessage('Ничего не найдено по этому запросу')
      }
    } catch {
      setItems([])
      setMessage('Не удалось загрузить предметы')
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleCreateSubscription(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: selectedItemId,
          targetPrice: Number(targetPrice),
          condition,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error ?? 'Не удалось создать подписку')
        return
      }

      setMessage(
        'Подписка успешно создана. Уведомление отправлено в Telegram, если он привязан.'
      )
      setTargetPrice('')
      setSelectedItemId('')
      await loadSubscriptions()
    } catch {
      setMessage('Ошибка при создании подписки')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteSubscription(subscriptionId: string) {
    setDeletingId(subscriptionId)
    setMessage('')

    try {
      const res = await fetch(`/api/subscriptions?id=${subscriptionId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error ?? 'Не удалось удалить подписку')
        return
      }

      setMessage(
        'Подписка удалена. Уведомление отправлено в Telegram, если он привязан.'
      )
      await loadSubscriptions()
    } catch {
      setMessage('Ошибка при удалении подписки')
    } finally {
      setDeletingId(null)
    }
  }

  if (!mounted) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Загрузка...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
      <header className="mb-10 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
            Subscriptions
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Управление подписками
          </h1>
          <p className="mt-2 text-slate-300">
            Ищи предметы, задавай порог цены и сохраняй подписки в профиль.
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
            href="/profile"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Профиль
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Найти предмет</h2>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: revenant prime"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={searchItems}
              disabled={searchLoading || !query.trim()}
              className="rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searchLoading ? 'Поиск...' : 'Искать'}
            </button>
          </div>

          {message ? (
            <p className="mt-4 text-sm text-slate-300">{message}</p>
          ) : null}

          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">
                После поиска здесь появятся предметы из Warframe Market API.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition ${
                    selectedItemId === item.id
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-white/10 bg-slate-900/70 hover:bg-white/5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className="flex w-full items-start gap-4 p-4 text-left"
                  >
                    <ItemIcon src={item.icon} alt={item.name} size={60} />

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.game} • currentPrice:{' '}
                        {item.currentPrice !== null ? item.currentPrice : '—'}
                      </p>
                    </div>
                  </button>

                  <div className="px-4 pb-4">
                    <Link
                      href={`/items/${item.externalId}`}
                      className="inline-block text-sm text-blue-300 hover:text-blue-200"
                    >
                      Открыть страницу предмета
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">
              Создать подписку
            </h2>

            <form onSubmit={handleCreateSubscription} className="mt-5 space-y-4">
              <input
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="Целевая цена"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />

              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
              >
                <option value="lte">Цена меньше или равна</option>
                <option value="gte">Цена больше или равна</option>
              </select>

              <button
                type="submit"
                disabled={loading || !selectedItemId || !targetPrice}
                className="w-full rounded-2xl bg-blue-500 px-5 py-3 font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Сохранение...' : 'Создать подписку'}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-400">
              Telegram привязывается отдельно на странице профиля.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Сохранённые подписки
              </h2>
              <button
                type="button"
                onClick={loadSubscriptions}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Обновить
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <p className="text-slate-400">Подписок пока нет.</p>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <ItemIcon
                          src={subscription.item.icon}
                          alt={subscription.item.name}
                          size={56}
                        />

                        <div>
                          <p className="font-medium text-white">
                            {subscription.item.name}
                          </p>
                          <p className="text-sm text-slate-400">
                            {subscription.user.name ?? 'Local User'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-sm text-slate-300">
                          <span className="font-medium text-blue-300">
                            {subscription.condition === 'lte' ? '≤' : '≥'}{' '}
                            {subscription.targetPrice}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          disabled={deletingId === subscription.id}
                          className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
                        >
                          {deletingId === subscription.id
                            ? 'Удаление...'
                            : 'Отписаться'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>
                        currentPrice:{' '}
                        {subscription.item.currentPrice !== null
                          ? subscription.item.currentPrice
                          : '—'}
                      </span>
                      <span>
                        telegram:{' '}
                        {subscription.user.telegramUsername
                          ? `@${subscription.user.telegramUsername}`
                          : subscription.user.telegramChatId ?? 'не привязан'}
                      </span>
                      <span>created: {formatDate(subscription.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}