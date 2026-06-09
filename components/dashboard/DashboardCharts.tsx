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
  // Empty-State: Wenn alle Datenpunkte total=0 sind, zeige hilfreichen CTA
  const isEmpty = data.every((d) => d.total === 0 && d.verified === 0 && d.discrepancy === 0)
  if (isEmpty) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-violet/20 border border-brand-200 flex items-center justify-center text-brand-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <p className="text-sm font-semibold text-text-primary mb-1">Noch keine Aktivität</p>
        <p className="text-xs text-text-secondary max-w-sm mb-3">
          Sobald die ersten Referenzprüfungen abgeschlossen werden, sehen Sie hier Ihren Verlauf der letzten 14 Tage.
        </p>
        <a href="/candidates/new" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
          Ersten Kandidaten anlegen →
        </a>
      </div>
    )
  }
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
