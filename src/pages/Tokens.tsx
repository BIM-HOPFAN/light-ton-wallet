import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Coins } from 'lucide-react';
import { getTokens, Token } from '@/lib/tokens';

export default function Tokens() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    const allTokens = getTokens();
    setTokens(allTokens);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Wallet Tokens</h1>
          <p className="text-muted-foreground">
            Your supported TON network tokens
          </p>
        </div>

        <div className="space-y-3">
          {tokens.map((token) => (
            <Card key={token.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl overflow-hidden">
                  {typeof token.icon === 'string' && (token.icon.includes('/assets/') || token.icon.startsWith('data:') || token.icon.endsWith('.svg') || token.icon.endsWith('.png')) ? (
                    <img src={token.icon} alt={token.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <span>{token.icon || '🪙'}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    {token.name}
                    {token.isNative && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Native
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {token.network} Network
                  </p>
                </div>
                {token.balance && (
                  <div className="text-right">
                    <p className="font-semibold">{token.balance}</p>
                    <p className="text-xs text-muted-foreground">{token.symbol}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
