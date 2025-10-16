import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { txHash } = useParams();

  // Mock transaction data - in production, fetch from blockchain
  const transaction = {
    hash: txHash || '',
    type: 'send',
    amount: '10.5',
    token: 'TON',
    status: 'completed',
    from: 'EQD...abc123',
    to: 'EQB...xyz789',
    fee: '0.01',
    timestamp: new Date(),
    blockNumber: 12345678,
    memo: 'Payment for services',
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-success" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <Clock className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return 'text-success';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              {getStatusIcon()}
            </div>
            <h2 className={`text-2xl font-bold capitalize ${getStatusColor()}`}>
              {transaction.status}
            </h2>
            <p className="text-3xl font-bold mt-2">
              {transaction.type === 'send' ? '-' : '+'}{transaction.amount} {transaction.token}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono">
                  {transaction.hash.slice(0, 8)}...{transaction.hash.slice(-8)}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(transaction.hash)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">From</span>
              <code className="text-sm font-mono">{transaction.from}</code>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">To</span>
              <code className="text-sm font-mono">{transaction.to}</code>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Network Fee</span>
              <span>{transaction.fee} TON</span>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Block Number</span>
              <span>{transaction.blockNumber.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Timestamp</span>
              <span>{transaction.timestamp.toLocaleString()}</span>
            </div>

            {transaction.memo && (
              <div className="flex justify-between py-3 border-b">
                <span className="text-muted-foreground">Memo</span>
                <span>{transaction.memo}</span>
              </div>
            )}
          </div>

          <Button
            className="w-full mt-6"
            variant="outline"
            onClick={() => window.open(`https://tonscan.org/tx/${transaction.hash}`, '_blank')}
          >
            View on TONScan
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      </main>
    </div>
  );
}
