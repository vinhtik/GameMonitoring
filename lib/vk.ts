const VK_API_BASE = 'https://api.vk.com/method'

type VkApiResponse<T> = {
  response?: T
  error?: {
    error_code: number
    error_msg: string
  }
}

export async function sendVkMessage(peerId: string, text: string) {
  const token = process.env.VK_GROUP_TOKEN
  const apiVersion = process.env.VK_API_VERSION || '5.199'

  if (!token) {
    throw new Error('VK_GROUP_TOKEN is not set')
  }

  const params = new URLSearchParams({
    access_token: token,
    v: apiVersion,
    peer_id: peerId,
    message: text,
    random_id: String(Date.now()),
  })

  const response = await fetch(`${VK_API_BASE}/messages.send`, {
    method: 'POST',
    body: params,
  })

  const data = (await response.json()) as VkApiResponse<number>

  if (!response.ok || data.error) {
    throw new Error(
      `VK messages.send failed: ${JSON.stringify(data.error ?? data)}`
    )
  }

  return data.response
}

