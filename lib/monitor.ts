import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'

const WFM_API_BASE = 'https://api.warframe.market/v2'

type WfmOrder = {
  type?: string
  platinum?: number
  visible?: boolean
  user?: {
    status?: string
  }
}

function checkCondition(
  currentPrice: number,
  targetPrice: number,
  condition: string
) {
  if (condition === 'lte') {
    return currentPrice <= targetPrice
  }

  if (condition === 'gte') {
    return currentPrice >= targetPrice
  }

  return false
}

async function fetchCurrentPriceBySlug(slug: string): Promise<number | null> {
  try {
    const response = await fetch(`${WFM_API_BASE}/orders/item/${slug}`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`Orders request failed for ${slug}: ${response.status}`)
      return null
    }

    const raw = await response.json()
    const orders: WfmOrder[] = Array.isArray(raw?.data) ? raw.data : []

    const sellPrices = orders
      .filter((order) => {
        const isSell = order.type === 'sell'
        const isVisible = order.visible !== false
        return isSell && isVisible && typeof order.platinum === 'number'
      })
      .map((order) => Number(order.platinum))
      .filter((price) => Number.isFinite(price))

    if (!sellPrices.length) {
      return null
    }

    return Math.min(...sellPrices)
  } catch (error) {
    console.error(`Failed to fetch current price for slug "${slug}":`, error)
    return null
  }
}

export async function runMonitor() {
  const subscriptions = await prisma.subscription.findMany({
    where: { isActive: true },
    include: {
      user: true,
      item: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  console.log(`Subscriptions loaded: ${subscriptions.length}`)

  for (const subscription of subscriptions) {
    const slug = subscription.item.externalId

    let currentPrice = subscription.item.currentPrice

    if (slug) {
      const freshPrice = await fetchCurrentPriceBySlug(slug)

      if (freshPrice !== null) {
        currentPrice = freshPrice

        await prisma.item.update({
          where: { id: subscription.item.id },
          data: {
            currentPrice: freshPrice,
          },
        })
      }
    }

    console.log(
      `Checking subscription ${subscription.id}: item="${subscription.item.name}", slug="${slug}", currentPrice=${currentPrice}, target=${subscription.targetPrice}, condition=${subscription.condition}, telegramChatId=${subscription.user.telegramChatId}`
    )

    if (currentPrice === null || currentPrice === undefined) {
      console.log(`Skip ${subscription.id}: currentPrice is null`)
      continue
    }

    const matched = checkCondition(
      currentPrice,
      subscription.targetPrice,
      subscription.condition
    )

    if (!matched) {
      console.log(`Skip ${subscription.id}: condition not matched`)
      continue
    }

    if (!subscription.user.telegramChatId) {
      console.log(`Skip ${subscription.id}: Telegram is not linked`)
      continue
    }

    const lastTrigger = await prisma.notification.findFirst({
      where: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        type: 'triggered',
      },
      orderBy: {
        sentAt: 'desc',
      },
    })

    if (
      lastTrigger &&
      lastTrigger.priceSnapshot !== null &&
      lastTrigger.priceSnapshot === currentPrice
    ) {
      console.log(`Skip ${subscription.id}: same price already notified`)
      continue
    }

    const triggerMessage =
      `Сработала подписка\n\n` +
      `Предмет: ${subscription.item.name}\n` +
      `Текущая цена: ${currentPrice}\n` +
      `Условие: ${subscription.condition === 'lte' ? '≤' : '≥'} ${subscription.targetPrice}`

    try {
      await sendTelegramMessage(subscription.user.telegramChatId, triggerMessage)
      console.log(`Telegram message sent for subscription ${subscription.id}`)
    } catch (error) {
      console.error(
        `Failed to send Telegram message for subscription ${subscription.id}:`,
        error
      )
      continue
    }

    await prisma.notification.create({
      data: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        itemName: subscription.item.name,
        message: triggerMessage,
        type: 'triggered',
        priceSnapshot: currentPrice,
      },
    })

    console.log(`Notification saved for subscription ${subscription.id}`)
  }
}