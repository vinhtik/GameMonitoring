export type GameOption = {
  id: string
  name: string
  enabled: boolean
}

export const GAMES: GameOption[] = [
  {
    id: 'warframe',
    name: 'Warframe',
    enabled: true,
  },
  {
    id: 'cs2',
    name: 'CS2',
    enabled: false,
  },
  {
    id: 'dota2',
    name: 'Dota 2',
    enabled: false,
  },
]