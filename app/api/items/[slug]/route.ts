import { NextRequest, NextResponse } from 'next/server'
import { getEnabledGameProvider } from '@/lib/games/game-registry'

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const gameParam = request.nextUrl.searchParams.get('game')
    const provider = getEnabledGameProvider(gameParam)

    if (!provider) {
      return NextResponse.json(
        { error: 'Game provider is not available' },
        { status: 404 }
      )
    }

    const data = await provider.getItem(slug)

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to load item' },
        { status: 502 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/items/[slug] error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}