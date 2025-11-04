import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ScanLine, Link2, Upload, Flashlight } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { connectWithUri } from '@/lib/walletconnect';

export default function ScanConnect() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [manualUri, setManualUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No cameras found. Please ensure your device has a camera and permissions are granted.');
      }

      // Try to find back camera, otherwise use first available
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      const cameraId = backCamera?.id || devices[0].id;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Success callback
          isScanningRef.current = false;
          await scanner.stop();
          setShowScanner(false);
          setIsFlashlightOn(false);
          await handleConnect(decodedText);
        },
        (errorMessage) => {
          // Error callback (ongoing scanning errors, can be ignored)
          console.debug('QR scan error:', errorMessage);
        }
      );
      
      isScanningRef.current = true;
      toast.success('Camera started successfully');
    } catch (err) {
      console.error('Failed to start scanner:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Camera access denied or unavailable. Please check browser permissions.`);
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
    setIsFlashlightOn(false);
  };

  const toggleFlashlight = async () => {
    if (!scannerRef.current || !isScanningRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashlightOn } as any]
        });
        setIsFlashlightOn(!isFlashlightOn);
        toast.success(isFlashlightOn ? 'Flashlight off' : 'Flashlight on');
      } else {
        toast.error('Flashlight not supported on this device');
      }
    } catch (err) {
      console.error('Flashlight error:', err);
      toast.error('Could not toggle flashlight');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      const result = await scanner.scanFile(file, true);
      await handleConnect(result);
      toast.success('QR code read from image');
    } catch (err) {
      console.error('Failed to read QR from file:', err);
      toast.error('Could not read QR code from image');
    }
  };

  useEffect(() => {
    if (showScanner) {
      startScanning();
    }
  }, [showScanner]);

  const handleConnect = async (uri: string) => {
    if (!uri || (!uri.startsWith('wc:') && !uri.includes('wc?uri='))) {
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
              <div className="space-y-3">
                <Button
                  onClick={() => setShowScanner(true)}
                  className="w-full"
                  size="lg"
                >
                  <ScanLine className="mr-2 h-5 w-5" />
                  Open Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  size="lg"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload QR Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border bg-background">
                  <div 
                    id="qr-reader" 
                    className="w-full"
                    style={{ minHeight: '400px' }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={toggleFlashlight}
                    className="flex-1"
                  >
                    <Flashlight className={`mr-2 h-5 w-5 ${isFlashlightOn ? 'text-yellow-500' : ''}`} />
                    {isFlashlightOn ? 'Light Off' : 'Light On'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopScanning}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
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
