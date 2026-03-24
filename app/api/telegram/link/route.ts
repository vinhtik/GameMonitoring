import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/current-user'

function createToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

export async function POST() {
  try {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME
    if (!botUsername) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_TELEGRAM_BOT_NAME is not set' },
        { status: 500 }
      )
    }

    const user = await requireCurrentUser()
    const token = createToken()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramLinkToken: token,
      },
    })

    const link = `https://t.me/${botUsername}?start=${token}`

    return NextResponse.json({
      link,
      token,
    })
  } catch (error) {
    console.error('POST /api/telegram/link error:', error)

    return NextResponse.json(
      { error: 'Failed to generate Telegram link' },
      { status: 500 }
    )
  }
}