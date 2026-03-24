import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('GET /api/profile error:', error)

    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : undefined

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(name !== undefined ? { name } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/profile error:', error)

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}