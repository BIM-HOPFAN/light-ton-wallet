import { Card } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Wallet, Activity } from 'lucide-react';

interface AnalyticsDashboardProps {
  transactions: any[];
  balance: string;
}

export function AnalyticsDashboard({ transactions, balance }: AnalyticsDashboardProps) {
  // Calculate analytics
  const sent = transactions.filter(tx => tx.type === 'send').length;
  const received = transactions.filter(tx => tx.type === 'receive').length;
  const totalSent = transactions
    .filter(tx => tx.type === 'send')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
  const totalReceived = transactions
    .filter(tx => tx.type === 'receive')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);

  // Transaction volume by day (last 7 days)
  const volumeData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayTxs = transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate.toDateString() === date.toDateString();
    });
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: dayTxs.length,
    };
  });

  // Transaction types distribution
  const pieData = [
    { name: 'Sent', value: sent, color: 'hsl(var(--destructive))' },
    { name: 'Received', value: received, color: 'hsl(var(--primary))' },
  ];

  const stats = [
    {
      label: 'Total Balance',
      value: `${balance} TON`,
      icon: Wallet,
      trend: '+0%',
      trendUp: true,
    },
    {
      label: 'Transactions',
      value: transactions.length.toString(),
      icon: Activity,
      trend: `${volumeData[volumeData.length - 1]?.count || 0} today`,
      trendUp: true,
    },
    {
      label: 'Total Sent',
      value: `${totalSent.toFixed(2)} TON`,
      icon: ArrowUpRight,
      trend: `${sent} txs`,
      trendUp: false,
    },
    {
      label: 'Total Received',
      value: `${totalReceived.toFixed(2)} TON`,
      icon: ArrowDownLeft,
      trend: `${received} txs`,
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                <p className={`text-xs mt-1 ${stat.trendUp ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {stat.trend}
                </p>
              </div>
              <stat.icon className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transaction Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={volumeData}>
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transaction Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
