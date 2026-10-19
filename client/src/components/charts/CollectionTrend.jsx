import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useSettings } from '../../context/SettingsContext.jsx';

function MoneyTip({ active, payload, label, money }) {
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
      <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
        {money(payload[0].value)}
      </div>
    </div>
  );
}

export default function CollectionTrend({ data = [] }) {
  const { money, moneyShort } = useSettings();
  return (
    <div style={{ width: '100%', height: 262 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id="gCollect" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6a93b" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#f6a93b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#26304a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#6b7896"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            dy={4}
          />
          <YAxis
            tickFormatter={(v) => moneyShort(v)}
            stroke="#6b7896"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={54}
          />
          <Tooltip content={<MoneyTip money={money} />} cursor={{ stroke: '#f6a93b', strokeOpacity: 0.35 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#f6a93b"
            strokeWidth={2.5}
            fill="url(#gCollect)"
            dot={{ r: 3, fill: '#f6a93b', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
