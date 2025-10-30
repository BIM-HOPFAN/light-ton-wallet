import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp, Lock, Unlock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StakePosition {
  id: string;
  amount: string;
  startDate: number;
  lockPeriod: number;
  apr: number;
  token: 'TON' | 'NGNB' | 'BIM';
}

export default function Staking() {
  const navigate = useNavigate();
  const { balance } = useWallet();
  const [positions, setPositions] = useState<StakePosition[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'TON' | 'NGNB' | 'BIM'>('TON');
  const [lockPeriod, setLockPeriod] = useState(30);

  const stakingPools = [
    { token: 'TON', apr: 8.5, minLock: 7 },
    { token: 'NGNB', apr: 12.0, minLock: 14 },
    { token: 'BIM', apr: 15.0, minLock: 30 },
  ];

  useEffect(() => {
    loadStakePositions();
  }, []);

  const loadStakePositions = () => {
    const stored = localStorage.getItem('stake_positions');
    if (stored) {
      setPositions(JSON.parse(stored));
    }
  };

  const savePositions = (newPositions: StakePosition[]) => {
    localStorage.setItem('stake_positions', JSON.stringify(newPositions));
    setPositions(newPositions);
  };

  const getCurrentAPR = () => {
    const pool = stakingPools.find((p) => p.token === selectedToken);
    return pool?.apr || 0;
  };

  const calculateRewards = (amount: number, days: number) => {
    const apr = getCurrentAPR();
    return (amount * apr * days) / (365 * 100);
  };

  const handleStake = () => {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const pool = stakingPools.find((p) => p.token === selectedToken);
    if (lockPeriod < (pool?.minLock || 7)) {
      toast.error(`Minimum lock period is ${pool?.minLock} days`);
      return;
    }

    const newPosition: StakePosition = {
      id: Date.now().toString(),
      amount: stakeAmount,
      startDate: Date.now(),
      lockPeriod,
      apr: getCurrentAPR(),
      token: selectedToken,
    };

    savePositions([...positions, newPosition]);
    setStakeAmount('');
    toast.success(`Staked ${amount} ${selectedToken}`, {
      description: `Earning ${getCurrentAPR()}% APR for ${lockPeriod} days`,
    });
  };

  const handleUnstake = (position: StakePosition) => {
    const now = Date.now();
    const lockEndDate = position.startDate + position.lockPeriod * 24 * 60 * 60 * 1000;
    
    if (now < lockEndDate) {
      const daysLeft = Math.ceil((lockEndDate - now) / (24 * 60 * 60 * 1000));
      toast.error(`Cannot unstake yet. ${daysLeft} days remaining in lock period`);
      return;
    }

    const daysStaked = Math.floor((now - position.startDate) / (24 * 60 * 60 * 1000));
    const rewards = calculateRewards(parseFloat(position.amount), daysStaked);
    
    savePositions(positions.filter((p) => p.id !== position.id));
    toast.success(`Unstaked ${position.amount} ${position.token}`, {
      description: `Earned ${rewards.toFixed(4)} ${position.token} in rewards`,
    });
  };

  const getTotalStaked = () => {
    return positions.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2);
  };

  const getTotalRewards = () => {
    const now = Date.now();
    return positions
      .reduce((sum, p) => {
        const daysStaked = Math.floor((now - p.startDate) / (24 * 60 * 60 * 1000));
        return sum + calculateRewards(parseFloat(p.amount), daysStaked);
      }, 0)
      .toFixed(4);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getDaysRemaining = (position: StakePosition) => {
    const now = Date.now();
    const lockEndDate = position.startDate + position.lockPeriod * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((lockEndDate - now) / (24 * 60 * 60 * 1000)));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Staking</h1>
              <p className="text-muted-foreground mt-1">
                Stake your tokens and earn passive rewards
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Staked</div>
                <div className="text-2xl font-bold mt-1">{getTotalStaked()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Rewards</div>
                <div className="text-2xl font-bold mt-1 text-green-600">
                  +{getTotalRewards()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Active Positions</div>
                <div className="text-2xl font-bold mt-1">{positions.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="stake" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
              <TabsTrigger value="positions">My Positions</TabsTrigger>
            </TabsList>

            <TabsContent value="stake" className="space-y-4">
              {/* Staking Pools */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stakingPools.map((pool) => (
                  <Card
                    key={pool.token}
                    className={`cursor-pointer transition-all ${
                      selectedToken === pool.token
                        ? 'border-primary shadow-lg'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedToken(pool.token as any)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{pool.token}</CardTitle>
                      <CardDescription>Min. {pool.minLock} days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {pool.apr}%
                      </div>
                      <div className="text-sm text-muted-foreground">APR</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Stake Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Stake {selectedToken}</CardTitle>
                  <CardDescription>
                    Lock your tokens for {lockPeriod} days and earn {getCurrentAPR()}% APR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount to Stake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                      />
                      <Button variant="outline" onClick={() => setStakeAmount(balance)}>
                        Max
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Lock Period (days)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={stakingPools.find((p) => p.token === selectedToken)?.minLock || 7}
                        value={lockPeriod}
                        onChange={(e) => setLockPeriod(parseInt(e.target.value) || 30)}
                        className="max-w-[120px]"
                      />
                      <div className="flex gap-2">
                        {[30, 60, 90, 180].map((days) => (
                          <Button
                            key={days}
                            variant={lockPeriod === days ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLockPeriod(days)}
                          >
                            {days}d
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Rewards</span>
                      <span className="font-medium">
                        ~{calculateRewards(parseFloat(stakeAmount) || 0, lockPeriod).toFixed(4)}{' '}
                        {selectedToken}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">APR</span>
                      <span className="font-medium text-green-600">{getCurrentAPR()}%</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleStake}
                    disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Stake {selectedToken}
                  </Button>

                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Your tokens will be locked for the selected period. Early withdrawal is not
                      possible. Rewards are calculated daily and distributed upon unstaking.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="positions" className="space-y-4">
              {positions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Lock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No active staking positions</p>
                  </CardContent>
                </Card>
              ) : (
                positions.map((position) => (
                  <Card key={position.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-2xl font-bold">
                            {position.amount} {position.token}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Started {formatDate(position.startDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {position.apr}% APR
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {position.lockPeriod} days lock
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Earned Rewards</span>
                          <span className="font-medium">
                            +
                            {calculateRewards(
                              parseFloat(position.amount),
                              Math.floor((Date.now() - position.startDate) / (24 * 60 * 60 * 1000))
                            ).toFixed(4)}{' '}
                            {position.token}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Days Remaining</span>
                          <span className="font-medium">{getDaysRemaining(position)} days</span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        variant={getDaysRemaining(position) === 0 ? 'default' : 'outline'}
                        onClick={() => handleUnstake(position)}
                        disabled={getDaysRemaining(position) > 0}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        {getDaysRemaining(position) === 0 ? 'Unstake Now' : 'Locked'}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
