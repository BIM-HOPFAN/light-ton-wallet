import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { usePriceUpdates } from '@/hooks/usePriceUpdates';
import { Currency } from '@/lib/currency';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PriceChartProps {
  currency?: Currency;
}

interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

export function PriceChart({ currency = 'USD' }: PriceChartProps) {
  const { price, isLoading } = usePriceUpdates(currency);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  // Fetch real historical price data from CoinGecko
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setIsLoadingChart(true);
        const currencyMap: Record<Currency, string> = {
          USD: 'usd',
          EUR: 'eur',
          GBP: 'gbp',
          JPY: 'jpy',
          RUB: 'rub',
          NGN: 'ngn',
        };
        
        const vs_currency = currencyMap[currency];
        
        // Fetch last 24 hours of price data
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/toncoin/market_chart?vs_currency=${vs_currency}&days=1&interval=hourly`
        );
        
        if (!response.ok) throw new Error('Failed to fetch historical data');
        
        const data = await response.json();
        
        // Format data for the chart
        const formattedData: ChartDataPoint[] = data.prices.map((item: [number, number]) => {
          const timestamp = item[0];
          const price = item[1];
          const date = new Date(timestamp);
          const hours = date.getHours();
          
          return {
            time: `${hours}:00`,
            price: parseFloat(price.toFixed(4)),
            timestamp,
          };
        });
        
        setChartData(formattedData);
      } catch (error) {
        console.error('Failed to fetch historical price data:', error);
        // Fallback to current price point only
        const currentPrice = parseFloat(price) || 0;
        setChartData([{
          time: 'Now',
          price: currentPrice,
          timestamp: Date.now(),
        }]);
      } finally {
        setIsLoadingChart(false);
      }
    };

    if (price && parseFloat(price) > 0) {
      fetchHistoricalData();
    }
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchHistoricalData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [price, currency]);

  const priceChange = chartData.length > 1 
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price * 100)
    : 0;

  if (isLoadingChart) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
          <Skeleton className="h-[200px] w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">TON Price (24h)</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">
                {isLoading ? '...' : `$${price}`}
              </h3>
              <span className={`text-sm flex items-center gap-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(priceChange).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Live data from CoinGecko</p>
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
              domain={['dataMin - 0.01', 'dataMax + 0.01']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
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
