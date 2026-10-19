import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = { active: '#34d39a', expiring: '#f6a93b', expired: '#ff6b6b' };

function DonutTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div
      style={{
        background: '#1c2540',
        border: '1px solid #26304a',
        borderRadius: 10,
        padding: '8px 12px',
        fontSize: 13,
      }}
    >
      <span style={{ color: '#9aa6c2' }}>{p.name}: </span>
      <b>{p.value}</b>
    </div>
  );
}

export default function SubscriptionDonut({ data = [] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ width: 176, height: 176, position: 'relative', flexShrink: 0 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 3 : 0}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.key} fill={COLORS[d.key] || '#9aa6c2'} />
              ))}
            </Pie>
            <Tooltip content={<DonutTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
              {total}
            </div>
            <div style={{ fontSize: 11, color: '#6b7896', letterSpacing: '0.05em' }}>STUDENTS</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 120 }}>
        {data.map((d) => (
          <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: COLORS[d.key] || '#9aa6c2',
              }}
            />
            <span style={{ color: 'var(--text-dim)', fontSize: 13.5, flex: 1 }}>{d.name}</span>
            <span style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
