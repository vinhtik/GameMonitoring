import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'
import { getGameProvider } from '@/lib/games/game-registry'

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
    const provider = getGameProvider(subscription.item.game.toLowerCase())

    if (!provider) {
      console.log(
        `Skip ${subscription.id}: no provider for game "${subscription.item.game}"`
      )
      continue
    }

    const externalId = subscription.item.externalId
    let currentPrice = subscription.item.currentPrice

    if (externalId) {
      const freshPrice = await provider.getCurrentPrice(externalId)

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
      `Checking subscription ${subscription.id}: game="${subscription.item.game}", item="${subscription.item.name}", externalId="${externalId}", currentPrice=${currentPrice}, target=${subscription.targetPrice}, condition=${subscription.condition}, telegramChatId=${subscription.user.telegramChatId}`
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
      `Игра: ${subscription.item.game}\n` +
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
        itemId: subscription.item.id,
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