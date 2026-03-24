import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function verifyTelegramAuth(searchParams: URLSearchParams, botToken: string) {
  const hash = searchParams.get('hash')
  const authDateRaw = searchParams.get('auth_date')

  if (!hash || !authDateRaw) {
    return { ok: false as const, error: 'telegram_data_missing' }
  }

  const authDate = Number(authDateRaw)
  if (!Number.isFinite(authDate)) {
    return { ok: false as const, error: 'telegram_data_missing' }
  }

  const now = Math.floor(Date.now() / 1000)
  const maxAgeSeconds = 60 * 60 * 24

  if (now - authDate > maxAgeSeconds) {
    return { ok: false as const, error: 'telegram_data_expired' }
  }

  const data: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    if (key === 'hash') continue
    data[key] = value
  }

  const checkString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n')

  const secret = createHash('sha256').update(botToken).digest()

  const computedHash = createHmac('sha256', secret)
    .update(checkString)
    .digest('hex')

  const hashBuffer = Buffer.from(hash, 'hex')
  const computedBuffer = Buffer.from(computedHash, 'hex')

  if (
    hashBuffer.length !== computedBuffer.length ||
    !timingSafeEqual(hashBuffer, computedBuffer)
  ) {
    return { ok: false as const, error: 'telegram_invalid_hash' }
  }

  return {
    ok: true as const,
    data: {
      telegramId: searchParams.get('id') ?? '',
      firstName: searchParams.get('first_name') ?? '',
      lastName: searchParams.get('last_name') ?? '',
      username: searchParams.get('username') ?? '',
      photoUrl: searchParams.get('photo_url') ?? '',
      authDate,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const appUrl = process.env.APP_URL || request.nextUrl.origin

    const makeRedirect = (path: string) =>
      NextResponse.redirect(new URL(path, appUrl))

    if (!botToken) {
      return makeRedirect('/login?error=server_error')
    }

    const result = verifyTelegramAuth(request.nextUrl.searchParams, botToken)

    if (!result.ok) {
      return makeRedirect(`/login?error=${result.error}`)
    }

    const { telegramId, firstName, lastName, username } = result.data

    if (!telegramId) {
      return makeRedirect('/login?error=telegram_data_missing')
    }

    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim()

    const user = await prisma.user.upsert({
      where: {
        telegramId,
      },
      update: {
        name: displayName || username || 'Telegram User',
        telegramUsername: username || null,
      },
      create: {
        name: displayName || username || 'Telegram User',
        telegramId,
        telegramUsername: username || null,
      },
      select: {
        id: true,
      },
    })

    const response = makeRedirect('/profile')

    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: appUrl.startsWith('https://'),
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    console.error('GET /api/auth/telegram error:', error)

    const appUrl = process.env.APP_URL || request.nextUrl.origin

    return NextResponse.redirect(
      new URL('/login?error=server_error', appUrl)
    )
  }
}