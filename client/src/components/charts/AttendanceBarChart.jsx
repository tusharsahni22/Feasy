import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function AttendanceTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#1c2540',
        border: '1px solid #26304a',
        borderRadius: 10,
        padding: '8px 12px',
        fontSize: 13,
        boxShadow: '0 12px 28px -14px rgba(0,0,0,0.8)',
      }}
    >
      <div style={{ color: '#9aa6c2', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#10b981', fontFamily: 'Space Grotesk, sans-serif' }}>
        {payload[0].value} check-ins
      </div>
    </div>
  );
}

export default function AttendanceBarChart({ data = [] }) {
  return (
    <div style={{ width: '100%', height: 262 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 12, right: 10, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#26304a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="#6b7896"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            dy={4}
          />
          <YAxis
            stroke="#6b7896"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            allowDecimals={false}
          />
          <Tooltip content={<AttendanceTip />} />
          <Bar
            dataKey="count"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

