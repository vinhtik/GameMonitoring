import { NextRequest, NextResponse } from 'next/server'
import { loadGameItemDetails } from '@/lib/games/load-game-item-details'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const game = request.nextUrl.searchParams.get('game') ?? 'warframe'

    const result = await loadGameItemDetails(game, slug)

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('GET /api/items/[slug] error:', error)

    return NextResponse.json(
      { error: 'Failed to load item details' },
      { status: 500 }
    )
  }
}