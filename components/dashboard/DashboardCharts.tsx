'use client'

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'

interface CheckTrend {
  date: string
  verified: number
  discrepancy: number
  total: number
}

const TOOLTIP_STYLE = {
  background: 'white',
  border: '1px solid rgba(15,23,42,0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  fontSize: '12px',
  padding: '10px 12px',
}

export function ActivityAreaChart({ data }: { data: CheckTrend[] }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="total" name="Geprüft" stroke="#6366f1" strokeWidth={2} fill="url(#aGrad)" />
          <Area type="monotone" dataKey="verified" name="Verifiziert" stroke="#10b981" strokeWidth={2} fill="url(#bGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatusPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.every((d) => d.value === 0)) {
    return (
      <div className="w-full h-56 flex items-center justify-center text-sm text-text-muted">
        Noch keine Daten — legen Sie Kandidaten an, um die Verteilung zu sehen.
      </div>
    )
  }
  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TurnaroundBarChart({ data }: { data: { day: string; hours: number }[] }) {
  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v} h`, 'Durchlaufzeit']} />
          <Bar dataKey="hours" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
