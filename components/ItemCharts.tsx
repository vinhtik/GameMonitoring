'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartPoint = {
  datetime: string
  avgPrice: number
  volume: number
}

type ItemChartsProps = {
  chart: ChartPoint[]
}

function formatChartDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })
}

function formatTooltipDate(value: string) {
  return new Date(value).toLocaleString('ru-RU')
}

function ChartBox({
  height,
  children,
}: {
  height: number
  children: (size: { width: number; height: number }) => ReactNode
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateSize = () => {
      const nextWidth = Math.floor(element.getBoundingClientRect().width)
      setWidth((prev) => (prev !== nextWidth ? nextWidth : prev))
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      className="w-full min-w-0"
      style={{ height: `${height}px`, minHeight: `${height}px` }}
    >
      {width > 0 ? children({ width, height }) : null}
    </div>
  )
}

export default function ItemCharts({ chart }: ItemChartsProps) {
  if (!chart || chart.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400">
        Для этого предмета пока нет данных графика.
      </div>
    )
  }

  return (
    <div className="grid gap-6 min-w-0">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 min-w-0">
        <h2 className="mb-4 text-xl font-semibold text-white">График цен</h2>

        <ChartBox height={320}>
          {({ width, height }) => (
            <LineChart width={width} height={height} data={chart}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
              />
              <XAxis
                dataKey="datetime"
                tickFormatter={formatChartDate}
                stroke="#94a3b8"
                minTickGap={24}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                labelFormatter={(value) => formatTooltipDate(String(value))}
                formatter={(value) => [`${value}`, 'Цена']}
              />
              <Line
                type="monotone"
                dataKey="avgPrice"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ChartBox>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 min-w-0">
        <h2 className="mb-4 text-xl font-semibold text-white">Объём продаж</h2>

        <ChartBox height={260}>
          {({ width, height }) => (
            <AreaChart width={width} height={height} data={chart}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
              />
              <XAxis
                dataKey="datetime"
                tickFormatter={formatChartDate}
                stroke="#94a3b8"
                minTickGap={24}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                labelFormatter={(value) => formatTooltipDate(String(value))}
                formatter={(value) => [value, 'Объём']}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#34d399"
                fill="#34d399"
                fillOpacity={0.2}
              />
            </AreaChart>
          )}
        </ChartBox>
      </section>
    </div>
  )
}