import { GameProvider } from '@/lib/games/types'
import { WarframeProvider } from '@/lib/games/warframe-provider'
import { Cs2Provider } from '@/lib/games/cs2-provider'

const providers: GameProvider[] = [
  new WarframeProvider(),
  new Cs2Provider(),
]

export function getGameProvider(gameId: string) {
  return providers.find((provider) => provider.gameId === gameId) ?? null
}

export function getEnabledGameProvider(gameId: string) {
  const provider = getGameProvider(gameId)
  if (!provider?.enabled) return null
  return provider
}

export function getEnabledGameProviders() {
  return providers.filter((provider) => provider.enabled)
}