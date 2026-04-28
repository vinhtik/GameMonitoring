import { scryptSync, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { authCookieName } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'

function verifyPassword(password: string, storedHash: string) {
  const [method, salt, hash] = storedHash.split(':')

  if (method !== 'scrypt' || !salt || !hash) {
    return false
  }

  const hashBuffer = Buffer.from(hash, 'hex')
  const passwordBuffer = scryptSync(password, salt, 64)

  if (hashBuffer.length !== passwordBuffer.length) {
    return false
  }

  return timingSafeEqual(hashBuffer, passwordBuffer)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const email = typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : ''

    const password = typeof body.password === 'string'
      ? body.password
      : ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Введите email и пароль.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
      },
    })

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Неверный email или пароль.' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ ok: true })

    response.cookies.set({
      name: authCookieName,
      value: user.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    console.error('POST /api/auth/login error:', error)

    return NextResponse.json(
      { error: 'Ошибка сервера при входе.' },
      { status: 500 }
    )
  }
}

