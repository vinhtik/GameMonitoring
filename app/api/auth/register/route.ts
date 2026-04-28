import { randomBytes, scryptSync } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { authCookieName } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')

  return `scrypt:${salt}:${hash}`
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const name = typeof body.name === 'string'
      ? body.name.trim()
      : ''

    const email = typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : ''

    const password = typeof body.password === 'string'
      ? body.password
      : ''

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Введите корректный email.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов.' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует.' },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
      },
    })

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
    console.error('POST /api/auth/register error:', error)

    return NextResponse.json(
      { error: 'Ошибка сервера при регистрации.' },
      { status: 500 }
    )
  }
}

