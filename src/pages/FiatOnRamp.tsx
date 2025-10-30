import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Building, DollarSign, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const providers = [
  {
    id: 'moonpay',
    name: 'MoonPay',
    logo: '🌙',
    fees: '3.5%',
    methods: ['Card', 'Bank'],
    limits: { min: 20, max: 20000 },
  },
  {
    id: 'transak',
    name: 'Transak',
    logo: '⚡',
    fees: '2.99%',
    methods: ['Card', 'Bank', 'Apple Pay'],
    limits: { min: 30, max: 10000 },
  },
  {
    id: 'ramp',
    name: 'Ramp Network',
    logo: '🚀',
    fees: '2.9%',
    methods: ['Card', 'Bank', 'Open Banking'],
    limits: { min: 50, max: 15000 },
  },
];

export default function FiatOnRamp() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [cryptoAmount, setCryptoAmount] = useState('0.00');
  const [selectedProvider, setSelectedProvider] = useState(providers[0].id);
  const [paymentMethod, setPaymentMethod] = useState('Card');

  const TON_PRICE = 2.45; // Mock price

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const amt = parseFloat(value) || 0;
    setCryptoAmount((amt / TON_PRICE).toFixed(4));
  };

  const calculateFees = () => {
    const provider = providers.find((p) => p.id === selectedProvider);
    const amt = parseFloat(amount) || 0;
    const fee = (amt * parseFloat(provider?.fees || '0')) / 100;
    return fee.toFixed(2);
  };

  const getTotalCost = () => {
    const amt = parseFloat(amount) || 0;
    const fees = parseFloat(calculateFees());
    return (amt + fees).toFixed(2);
  };

  const handleBuy = () => {
    const amt = parseFloat(amount);
    const provider = providers.find((p) => p.id === selectedProvider);
    
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amt < (provider?.limits.min || 0)) {
      toast.error(`Minimum amount is $${provider?.limits.min}`);
      return;
    }

    if (amt > (provider?.limits.max || 0)) {
      toast.error(`Maximum amount is $${provider?.limits.max}`);
      return;
    }

    toast.success('Redirecting to payment provider...', {
      description: `Buying ${cryptoAmount} TON with ${provider?.name}`,
    });

    // In production, redirect to actual payment provider
    setTimeout(() => {
      toast.info('This would redirect to the payment provider in production');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Buy Crypto</h1>
              <p className="text-muted-foreground mt-1">
                Purchase TON with your credit card or bank account
              </p>
            </div>
          </div>

          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              {/* Amount Input */}
              <Card>
                <CardHeader>
                  <CardTitle>Enter Amount</CardTitle>
                  <CardDescription>How much do you want to spend?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">You pay</Label>
                    <div className="flex gap-2">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="text-lg"
                      />
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="NGN">NGN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">You receive</div>
                    <div className="text-2xl font-bold">{cryptoAmount} TON</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Rate: 1 TON = ${TON_PRICE}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {['Card', 'Bank', 'Apple Pay'].map((method) => (
                      <Button
                        key={method}
                        variant={paymentMethod === method ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod(method)}
                        className="justify-start"
                      >
                        {method === 'Card' && <CreditCard className="h-4 w-4 mr-2" />}
                        {method === 'Bank' && <Building className="h-4 w-4 mr-2" />}
                        {method}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Provider Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Provider</CardTitle>
                  <CardDescription>Choose your preferred provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedProvider === provider.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{provider.logo}</span>
                          <div>
                            <div className="font-semibold">{provider.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Fees: {provider.fees} • ${provider.limits.min} - $
                              {provider.limits.max.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {selectedProvider === provider.id && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {provider.methods.map((method) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {amount || '0.00'} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fees</span>
                    <span className="font-medium">
                      {calculateFees()} {currency}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">
                      {getTotalCost()} {currency}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Buy Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleBuy}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Continue to Payment
              </Button>

              {/* Info */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                      <p className="font-medium">Important Information</p>
                      <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                        <li>Payment is processed by third-party providers</li>
                        <li>Additional KYC verification may be required</li>
                        <li>Crypto will be sent to your wallet address</li>
                        <li>Processing time: 5-30 minutes</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <Card>
                <CardContent className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-2">Sell crypto coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    Convert your TON back to fiat currency
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
