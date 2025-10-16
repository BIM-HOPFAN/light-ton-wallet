import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Globe, TrendingUp, Gamepad2, ShoppingBag, Wallet } from 'lucide-react';

interface DApp {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: any;
  category: string;
}

const dapps: DApp[] = [
  {
    id: '1',
    name: 'TON Swap',
    description: 'Decentralized exchange for swapping tokens',
    url: 'https://tonswap.io',
    icon: TrendingUp,
    category: 'DeFi',
  },
  {
    id: '2',
    name: 'TON Games',
    description: 'Play blockchain games and earn rewards',
    url: 'https://tongames.io',
    icon: Gamepad2,
    category: 'Gaming',
  },
  {
    id: '3',
    name: 'TON Market',
    description: 'Buy and sell NFTs on the TON blockchain',
    url: 'https://tonmarket.io',
    icon: ShoppingBag,
    category: 'NFT',
  },
  {
    id: '4',
    name: 'TON Staking',
    description: 'Stake your TON and earn passive income',
    url: 'https://tonstaking.io',
    icon: Wallet,
    category: 'DeFi',
  },
];

export default function DAppBrowser() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDApps = dapps.filter(
    (dapp) =>
      dapp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dapp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDApp = (url: string) => {
    window.open(url, '_blank');
  };

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">DApp Browser</h1>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search DApps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDApps.map((dapp) => {
            const Icon = dapp.icon;
            return (
              <Card
                key={dapp.id}
                className="p-6 hover:shadow-glow transition-smooth cursor-pointer"
                onClick={() => openDApp(dapp.url)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{dapp.name}</h3>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {dapp.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{dapp.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredDApps.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No DApps found matching your search</p>
          </Card>
        )}
      </main>
    </div>
  );
}
