import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type TelegramUpdate = {
  message?: {
    text?: string
    chat?: {
      id: number
      username?: string
      type?: string
    }
    from?: {
      username?: string
    }
  }
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set')
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  })

  if (!response.ok) {
    const raw = await response.text()
    throw new Error(`Telegram sendMessage failed: ${raw}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const update = (await request.json()) as TelegramUpdate
    console.log('Telegram update:', JSON.stringify(update, null, 2))

    const message = update.message

    if (!message?.chat || message.chat.type !== 'private') {
      return NextResponse.json({ ok: true })
    }

    const text = message.text?.trim() ?? ''
    const chatId = String(message.chat.id)
    const username = message.from?.username ?? message.chat.username ?? null

    if (text.startsWith('/start')) {
      const token = text.replace('/start', '').trim()

      if (!token) {
        await sendTelegramMessage(
          chatId,
          'Бот запущен. Для привязки Telegram открой ссылку из профиля приложения.'
        )
        return NextResponse.json({ ok: true })
      }

      const user = await prisma.user.findFirst({
        where: { telegramLinkToken: token },
      })

      if (!user) {
        await sendTelegramMessage(
          chatId,
          'Токен привязки не найден или уже недействителен.'
        )
        return NextResponse.json({ ok: true })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramUsername: username,
          telegramLinkedAt: new Date(),
          telegramLinkToken: null,
        },
      })

      await sendTelegramMessage(
        chatId,
        'Telegram успешно привязан к вашему профилю.'
      )

      return NextResponse.json({ ok: true })
    }

    await sendTelegramMessage(
      chatId,
      'Чтобы привязать Telegram, открой ссылку из профиля приложения.'
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/telegram/webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}