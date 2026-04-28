import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVkMessage } from '@/lib/vk'


type VkCallbackEvent = {
  type?: string
  group_id?: number
  secret?: string
  object?: {
    message?: {
      id?: number
      from_id?: number
      peer_id?: number
      text?: string
    }
  }
}


function ok() {
  return new NextResponse('ok', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}


export async function POST(request: NextRequest) {
  try {
    const event = (await request.json()) as VkCallbackEvent


    const secretKey = process.env.VK_SECRET_KEY


    if (secretKey && event.secret !== secretKey) {
      return new NextResponse('Invalid secret', { status: 403 })
    }


    if (event.type === 'confirmation') {
      const confirmationCode = process.env.VK_CONFIRMATION_CODE


      if (!confirmationCode) {
        return new NextResponse('VK_CONFIRMATION_CODE is not set', {
          status: 500,
        })
      }


      return new NextResponse(confirmationCode, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }


    if (event.type !== 'message_new') {
      return ok()
    }


    const message = event.object?.message


    if (!message?.peer_id || !message.from_id) {
      return ok()
    }


    const peerId = String(message.peer_id)
    const vkId = String(message.from_id)
    const text = message.text?.trim().toUpperCase() ?? ''


    if (!text) {
      await sendVkMessage(
        peerId,
        'Для привязки VK отправьте код из профиля приложения.'
      )


      return ok()
    }


    const alreadyLinkedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { vkId },
          { vkPeerId: peerId },
        ],
      },
      select: {
        id: true,
        vkLinkedAt: true,
      },
    })


    if (alreadyLinkedUser) {
      return ok()
    }


    const user = await prisma.user.findFirst({
      where: {
        vkLinkCode: text,
      },
    })


    if (!user) {
      await sendVkMessage(
        peerId,
        'Код привязки не найден или уже недействителен. Создайте новый код в профиле приложения.'
      )


      return ok()
    }


    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        vkId,
        vkPeerId: peerId,
        vkUsername: `id${vkId}`,
        vkLinkedAt: new Date(),
        vkLinkCode: null,
      },
    })


    await sendVkMessage(
      peerId,
      'VK успешно привязан к вашему профилю. Теперь сюда будут приходить уведомления.'
    )


    return ok()
  } catch (error) {
    console.error('POST /api/vk/webhook error:', error)


    return new NextResponse('ok', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }
}

