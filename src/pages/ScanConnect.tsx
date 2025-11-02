import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ScanLine, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { connectWithUri } from '@/lib/walletconnect';

export default function ScanConnect() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [manualUri, setManualUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Success callback
          isScanningRef.current = false;
          await scanner.stop();
          setShowScanner(false);
          await handleConnect(decodedText);
        },
        (errorMessage) => {
          // Error callback (ongoing scanning errors, can be ignored)
          console.debug('QR scan error:', errorMessage);
        }
      );
      
      isScanningRef.current = true;
    } catch (err) {
      console.error('Failed to start scanner:', err);
      toast.error('Unable to access camera. Please check permissions.');
      setShowScanner(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        isScanningRef.current = false;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setShowScanner(false);
  };

  useEffect(() => {
    if (showScanner) {
      startScanning();
    }
  }, [showScanner]);

  const handleConnect = async (uri: string) => {
    if (!uri.startsWith('wc:')) {
      toast.error('Invalid WalletConnect URI');
      return;
    }

    setIsConnecting(true);
    try {
      // Extract app info from URI or use defaults
      const urlParams = new URLSearchParams(uri.split('?')[1] || '');
      const name = urlParams.get('name') || 'Unknown dApp';
      const url = urlParams.get('url') || 'Unknown URL';
      
      await connectWithUri(uri, { name, url });
      toast.success('App connected successfully');
      navigate('/connected-apps');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualConnect = () => {
    handleConnect(manualUri);
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
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
            <ScanLine className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Connect to App</h1>
          <p className="text-muted-foreground">
            Scan a QR code or paste a WalletConnect URI
          </p>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Scan QR Code</h3>
            {!showScanner ? (
              <Button
                onClick={() => setShowScanner(true)}
                className="w-full"
                size="lg"
              >
                <ScanLine className="mr-2 h-5 w-5" />
                Open Camera
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border bg-background">
                  <div 
                    id="qr-reader" 
                    className="w-full"
                    style={{ minHeight: '400px' }}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={stopScanning}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Paste URI</h3>
            <div className="space-y-4">
              <Input
                placeholder="wc:..."
                value={manualUri}
                onChange={(e) => setManualUri(e.target.value)}
              />
              <Button
                onClick={handleManualConnect}
                disabled={!manualUri || isConnecting}
                className="w-full"
                size="lg"
              >
                <Link2 className="mr-2 h-5 w-5" />
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
