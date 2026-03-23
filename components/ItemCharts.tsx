'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
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

export default function ItemCharts({ chart }: ItemChartsProps) {
  if (!chart || chart.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400">
        Для этого предмета пока нет данных графика.
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">График цен</h2>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
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
                formatter={(value) => [`${value} plat`, 'Цена']}
              />
              <Line
                type="monotone"
                dataKey="avgPrice"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Объём продаж</h2>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
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
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}