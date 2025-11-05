import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ScanLine, Link2, Upload, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import QrScanner from 'react-qr-scanner';
import { connectWithUri } from '@/lib/walletconnect';

export default function ScanConnect() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [manualUri, setManualUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Request camera permissions on mount
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        // Stop the stream immediately, we just wanted to trigger permission
        stream.getTracks().forEach(track => track.stop());
        setCameraReady(true);
      } catch (err) {
        console.error('Camera permission error:', err);
        setCameraReady(false);
      }
    };
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      requestCameraPermission();
    } else {
      setCameraError('Camera is not supported on this device');
    }
  }, []);

  const handleScan = async (data: any) => {
    if (data && !isConnecting) {
      try {
        const scannedText = typeof data === 'string' ? data : data?.text || data;
        console.log('QR Scanned:', scannedText);
        
        if (scannedText && typeof scannedText === 'string') {
          closeCamera();
          await handleConnect(scannedText);
        }
      } catch (error) {
        console.error('Error processing scan:', error);
      }
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner Error:', err);
    
    let errorMessage = 'Camera error. Please check permissions.';
    
    if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
      errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
    } else if (err?.name === 'NotFoundError') {
      errorMessage = 'No camera found on this device.';
    } else if (err?.name === 'NotReadableError') {
      errorMessage = 'Camera is already in use by another application.';
    }
    
    setCameraError(errorMessage);
    toast.error(errorMessage);
    setShowScanner(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Create file reader to read QR from image
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result;
        if (imageData) {
          // You can use a library like jsQR here or the html5-qrcode
          toast.info('Processing image...');
          // For now, ask user to use camera
          toast.error('Image upload QR reading coming soon. Please use camera for now.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to read QR from file:', err);
      toast.error('Could not read QR code from image');
    }
  };

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

  const openCamera = async () => {
    setCameraError('');
    
    try {
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      // Now show the scanner
      setShowScanner(true);
      toast.success('Camera ready');
    } catch (err: any) {
      console.error('Camera open error:', err);
      
      let errorMessage = 'Could not open camera';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const closeCamera = () => {
    setShowScanner(false);
    setCameraError('');
  };

  return (
    <div className="min-h-screen bg-background">
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
                  onClick={openCamera}
                  className="w-full gradient-primary"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Open Camera
                </Button>
                {cameraError && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {cameraError}
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Make sure to allow camera permissions when prompted
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border-2 border-primary bg-black aspect-square">
                  <QrScanner
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    style={{ width: '100%', height: '100%' }}
                    constraints={{
                      audio: false,
                      video: { 
                        facingMode: { ideal: 'environment' },
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 }
                      }
                    }}
                    legacyMode={false}
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-primary/50" style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 25%, 75% 25%, 75% 75%, 25% 75%, 25% 25%, 0 25%)'
                    }} />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-primary rounded-xl" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={closeCamera}
                  className="w-full"
                  size="lg"
                >
                  <X className="mr-2 h-5 w-5" />
                  Close Camera
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Position the QR code within the frame
                </p>
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
                className="font-mono text-sm"
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
