import { GameProvider, GameId } from '@/lib/games/types'
import { WarframeProvider } from '@/lib/games/warframe-provider'

const providers: Record<GameId, GameProvider | null> = {
  warframe: new WarframeProvider(),
  cs2: null,
  dota2: null,
}

export function resolveGameId(value: string | null | undefined): GameId {
  const normalized = (value ?? 'warframe').trim().toLowerCase()

  if (normalized === 'warframe') return 'warframe'
  if (normalized === 'cs2') return 'cs2'
  if (normalized === 'dota2') return 'dota2'

  return 'warframe'
}

export function getGameProvider(
  gameId: string | null | undefined
): GameProvider | null {
  const resolved = resolveGameId(gameId)
  return providers[resolved]
}

export function getEnabledGameProvider(
  gameId: string | null | undefined
): GameProvider | null {
  const provider = getGameProvider(gameId)
  if (!provider || !provider.enabled) return null
  return provider
}

export function getGameLabel(gameId: string | null | undefined): string | null {
  const provider = getGameProvider(gameId)
  return provider?.gameLabel ?? null
}