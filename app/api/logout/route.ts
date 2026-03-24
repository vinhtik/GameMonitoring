import { NextResponse } from 'next/server'
import { authCookieName } from '@/lib/current-user'

export async function POST() {
  try {
    const response = NextResponse.json({ ok: true })

    response.cookies.set({
      name: authCookieName,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('POST /api/logout error:', error)

    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}