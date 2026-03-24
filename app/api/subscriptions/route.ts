import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/current-user'
import { sendTelegramMessage } from '@/lib/telegram'

function conditionLabel(condition: string, targetPrice: number) {
  return `${condition === 'lte' ? '≤' : '≥'} ${targetPrice}`
}

function resolveGameLabel(gameParam: string | null) {
  if (gameParam === 'warframe') return 'Warframe'
  if (gameParam === 'cs2') return 'CS2'
  if (gameParam === 'dota2') return 'Dota 2'
  return null
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser()

    const gameParam = request.nextUrl.searchParams.get('game')
    const game = resolveGameLabel(gameParam)

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: currentUser.id,
        ...(game
          ? {
              item: {
                game,
              },
            }
          : {}),
      },
      include: {
        user: true,
        item: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('GET /api/subscriptions error:', error)

    return NextResponse.json(
      { error: 'Failed to load subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const currentUser = await requireCurrentUser()

    const itemId = String(body.itemId ?? '').trim()
    const targetPrice = Number(body.targetPrice)
    const condition = String(body.condition ?? 'lte').trim()
    const gameParam =
      typeof body.game === 'string' ? body.game.trim().toLowerCase() : null
    const game = resolveGameLabel(gameParam)

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item is required' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(targetPrice) || targetPrice < 0) {
      return NextResponse.json(
        { error: 'Target price must be a valid non-negative number' },
        { status: 400 }
      )
    }

    if (!['lte', 'gte'].includes(condition)) {
      return NextResponse.json(
        { error: 'Condition must be either lte or gte' },
        { status: 400 }
      )
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Selected item was not found' },
        { status: 404 }
      )
    }

    if (game && item.game !== game) {
      return NextResponse.json(
        { error: 'Selected item does not belong to the chosen game' },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: currentUser.id,
        itemId: item.id,
        targetPrice,
        condition,
        isActive: true,
      },
      include: {
        user: true,
        item: true,
      },
    })

    const text =
      `Новая подписка добавлена\n\n` +
      `Игра: ${item.game}\n` +
      `Предмет: ${item.name}\n` +
      `Текущая цена: ${item.currentPrice ?? '—'}\n` +
      `Условие: ${conditionLabel(condition, targetPrice)}`

    await prisma.notification.create({
      data: {
        userId: currentUser.id,
        itemId: item.id,
        subscriptionId: subscription.id,
        itemName: item.name,
        message: text,
        type: 'created',
        priceSnapshot: item.currentPrice ?? null,
      },
    })

    if (currentUser.telegramChatId) {
      try {
        await sendTelegramMessage(currentUser.telegramChatId, text)
      } catch (error) {
        console.error(
          'Failed to send Telegram subscription-created message:',
          error
        )
      }
    }

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('POST /api/subscriptions error:', error)

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser()
    const subscriptionId = request.nextUrl.searchParams.get('id')?.trim() ?? ''

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription id is required' },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: currentUser.id,
      },
      include: {
        item: true,
        user: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    await prisma.subscription.delete({
      where: {
        id: subscription.id,
      },
    })

    const text =
      `Подписка удалена\n\n` +
      `Игра: ${subscription.item.game}\n` +
      `Предмет: ${subscription.item.name}\n` +
      `Последнее условие: ${conditionLabel(
        subscription.condition,
        subscription.targetPrice
      )}`

    await prisma.notification.create({
      data: {
        userId: currentUser.id,
        itemId: subscription.item.id,
        subscriptionId: subscription.id,
        itemName: subscription.item.name,
        message: text,
        type: 'deleted',
        priceSnapshot: subscription.item.currentPrice ?? null,
      },
    })

    if (currentUser.telegramChatId) {
      try {
        await sendTelegramMessage(currentUser.telegramChatId, text)
      } catch (error) {
        console.error(
          'Failed to send Telegram subscription-deleted message:',
          error
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/subscriptions error:', error)

    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}