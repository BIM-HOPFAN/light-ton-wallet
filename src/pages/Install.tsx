import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          {isInstalled ? (
            <Check className="h-10 w-10 text-primary" />
          ) : (
            <Smartphone className="h-10 w-10 text-primary" />
          )}
        </div>

        {isInstalled ? (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-2">App Installed!</h1>
              <p className="text-muted-foreground">
                Light Wallet is now installed on your device. You can access it from your home screen.
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              Open Wallet
            </Button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-2">Install Light Wallet</h1>
              <p className="text-muted-foreground">
                Install our app to get quick access from your home screen and use it offline.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Works Offline</h3>
                  <p className="text-sm text-muted-foreground">Access your wallet even without internet</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Fast Loading</h3>
                  <p className="text-sm text-muted-foreground">Opens instantly from your home screen</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">No App Store</h3>
                  <p className="text-sm text-muted-foreground">Install directly from your browser</p>
                </div>
              </div>
            </div>

            {deferredPrompt ? (
              <Button onClick={handleInstall} className="w-full gradient-primary">
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">To install on mobile:</p>
                <ul className="text-left space-y-1 list-disc list-inside">
                  <li><strong>iPhone:</strong> Tap Share → Add to Home Screen</li>
                  <li><strong>Android:</strong> Tap Menu → Install App</li>
                </ul>
              </div>
            )}

            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Skip for Now
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
