import { NextRequest, NextResponse } from 'next/server'
import { runMonitor } from '@/lib/monitor'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startedAt = Date.now()

  try {
    await runMonitor()

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    console.error('Cron monitor error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Monitor failed',
      },
      { status: 500 }
    )
  }
}

