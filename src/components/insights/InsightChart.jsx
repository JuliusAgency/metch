import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const InsightChart = ({ data, percentage }) => (
  <Card className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
    <div className="text-center font-bold text-blue-600 mb-2">{percentage}%</div>
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #ccc',
            borderRadius: '10px'
          }}
          itemStyle={{ color: '#333' }}
        />
        <Area type="monotone" dataKey="uv" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);

export default InsightChart;