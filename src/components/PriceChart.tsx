import { useState, useEffect } from 'react';
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
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([]);

  // Generate realistic fluctuating historical data
  useEffect(() => {
    const basePrice = parseFloat(price) || 2.5;
    const now = Date.now();
    
    const data = Array.from({ length: 24 }, (_, i) => {
      // Create more realistic price movements with trend and volatility
      const hourlyChange = (Math.random() - 0.5) * 0.08; // ±4% per hour
      const trendFactor = Math.sin((i / 24) * Math.PI * 2) * 0.05; // Slight daily trend
      const variation = basePrice * (1 + hourlyChange + trendFactor);
      
      return {
        time: `${i}h`,
        price: variation,
      };
    });
    
    setChartData(data);
  }, [price]);

  const priceChange = chartData.length > 1 
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price * 100)
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
          <LineChart data={chartData}>
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
