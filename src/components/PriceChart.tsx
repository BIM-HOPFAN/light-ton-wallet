import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { usePriceUpdates } from '@/hooks/usePriceUpdates';
import { Currency } from '@/lib/currency';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChartProps {
  currency?: Currency;
}

export function PriceChart({ currency = 'USD' }: PriceChartProps) {
  const { price, isLoading } = usePriceUpdates(currency);

  // Mock historical data - in production, fetch real historical prices
  const mockData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}h`,
    price: parseFloat(price) * (0.95 + Math.random() * 0.1),
  }));

  const priceChange = mockData.length > 1 
    ? ((mockData[mockData.length - 1].price - mockData[0].price) / mockData[0].price * 100)
    : 0;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">TON Price</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">
                {isLoading ? '...' : `$${price}`}
              </h3>
              <span className={`text-sm flex items-center gap-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(priceChange).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mockData}>
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
