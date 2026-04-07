import { getEnabledGameProvider } from '@/lib/games/game-registry'
import { GameItemDetails, GameProvider } from '@/lib/games/types'

type LoadGameItemDetailsResult =
  | {
      ok: true
      provider: GameProvider
      data: GameItemDetails
    }
  | {
      ok: false
      status: number
      error?: string
    }

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function loadGameItemDetails(
  game: string,
  slug: string
): Promise<LoadGameItemDetailsResult> {
  const provider = getEnabledGameProvider(game)

  if (!provider) {
    return {
      ok: false,
      status: 404,
      error: 'Provider not found',
    }
  }

  const normalizedSlug = safeDecode(slug).trim()
  const data = await provider.getItem(normalizedSlug)

  if (!data) {
    return {
      ok: false,
      status: 404,
      error: 'Item not found',
    }
  }

  return {
    ok: true,
    provider,
    data,
  }
}