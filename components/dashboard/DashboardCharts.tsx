'use client'

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

interface CheckTrend {
  date: string
  verified: number
  discrepancy: number
  total: number
}

interface TurnaroundItem {
  day: string
  hours: number
}

interface StatusItem {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-xs" style={{ boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
      <div className="font-bold text-slate-700 mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-xs" style={{ boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
      <div className="font-bold text-slate-700 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-violet-500" />
        <span className="text-slate-500">Ø Zeit:</span>
        <span className="font-bold text-slate-800">{payload[0]?.value ?? 0} h</span>
      </div>
    </div>
  )
}

export function ActivityAreaChart({ data }: { data: CheckTrend[] }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradVerified" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDisc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            name="Geprüft"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#gradTotal)"
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="verified"
            name="Verifiziert"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#gradVerified)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const RADIAN = Math.PI / 180
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.08) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function StatusPieChart({ data }: { data: StatusItem[] }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
        <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-100 mb-3" />
        Noch keine Kandidaten
      </div>
    )
  }
  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data.filter(d => d.value > 0)}
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={CustomLabel}
            >
              {data.filter(d => d.value > 0).map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]
                return (
                  <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-xs" style={{ boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.payload.color }} />
                      <span className="font-semibold text-slate-700">{d.payload.name}</span>
                    </div>
                    <div className="mt-1 font-bold text-slate-900 text-sm">{d.value} Kandidaten</div>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[11px] text-slate-600 truncate">{d.name}</span>
            <span className="ml-auto text-[11px] font-bold text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TurnaroundBarChart({ data }: { data: TurnaroundItem[] }) {
  const max = Math.max(...data.map(d => d.hours), 1)
  return (
    <div className="w-full h-40">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={22}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            domain={[0, Math.ceil(max * 1.2) || 4]}
          />
          <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 6 }} />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <Bar dataKey="hours" name="Stunden" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
