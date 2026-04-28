import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'

function createVkLinkCode() {
  return `VK-${randomBytes(3).toString('hex').toUpperCase()}`
}

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const code = createVkLinkCode()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        vkLinkCode: code,
      },
    })

    return NextResponse.json({
      code,
      groupUrl: process.env.NEXT_PUBLIC_VK_GROUP_URL ?? null,
      message: 'Отправьте этот код в сообщения сообщества VK.',
    })
  } catch (error) {
    console.error('POST /api/vk/link error:', error)

    return NextResponse.json(
      { error: 'Не удалось создать код привязки VK.' },
      { status: 500 }
    )
  }
}

