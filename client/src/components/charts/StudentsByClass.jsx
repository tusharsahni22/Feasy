import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function CountTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
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
      <div style={{ color: '#9aa6c2', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>
        {payload[0].value} {payload[0].value === 1 ? 'student' : 'students'}
      </div>
    </div>
  );
}

export default function StudentsByClass({ data = [] }) {
  return (
    <div style={{ width: '100%', height: Math.max(220, data.length * 40) }}>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 18, left: 6, bottom: 0 }}>
          <CartesianGrid stroke="#26304a" horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            stroke="#6b7896"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9aa6c2"
            width={84}
            tickLine={false}
            axisLine={false}
            fontSize={12.5}
          />
          <Tooltip cursor={{ fill: 'rgba(155,140,255,0.08)' }} content={<CountTip />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#9b8cff" barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
