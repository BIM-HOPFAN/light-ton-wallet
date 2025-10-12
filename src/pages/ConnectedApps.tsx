import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Link2Off, ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  initializeWalletConnect,
  getActiveSessions,
  disconnectSession,
  disconnectAllSessions,
  ConnectedSession,
} from '@/lib/walletconnect';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ConnectedApps() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ConnectedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnectingTopic, setDisconnectingTopic] = useState<string | null>(null);
  const [showDisconnectAll, setShowDisconnectAll] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      await initializeWalletConnect();
      const activeSessions = await getActiveSessions();
      setSessions(activeSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load connected apps');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (topic: string) => {
    try {
      await disconnectSession(topic);
      setSessions(sessions.filter((s) => s.topic !== topic));
      toast.success('Disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    } finally {
      setDisconnectingTopic(null);
    }
  };

  const handleDisconnectAll = async () => {
    try {
      await disconnectAllSessions();
      setSessions([]);
      toast.success('All apps disconnected');
    } catch (error) {
      console.error('Disconnect all error:', error);
      toast.error('Failed to disconnect all apps');
    } finally {
      setShowDisconnectAll(false);
    }
  };

  const formatExpiry = (expiry: number) => {
    const date = new Date(expiry * 1000);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {sessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDisconnectAll(true)}
            >
              Disconnect All
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Connected Apps</h1>
            <p className="text-muted-foreground mt-1">
              Manage your WalletConnect sessions
            </p>
          </div>
          <Button onClick={() => navigate('/scan-connect')}>
            <Plus className="mr-2 h-4 w-4" />
            New Connection
          </Button>
        </div>

        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="inline-flex p-4 bg-muted rounded-full mb-4">
              <Link2Off className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Connected Apps</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect to dApps using WalletConnect
            </p>
            <Button onClick={() => navigate('/scan-connect')}>
              <Plus className="mr-2 h-4 w-4" />
              Connect App
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.topic} className="p-4">
                <div className="flex items-center gap-4">
                  {session.icons[0] && (
                    <img
                      src={session.icons[0]}
                      alt={session.name}
                      className="w-12 h-12 rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{session.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {session.url}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {formatExpiry(session.expiry)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(session.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDisconnectingTopic(session.topic)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog
          open={!!disconnectingTopic}
          onOpenChange={() => setDisconnectingTopic(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect App?</AlertDialogTitle>
              <AlertDialogDescription>
                This will disconnect the app from your wallet. You can reconnect anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => disconnectingTopic && handleDisconnect(disconnectingTopic)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDisconnectAll} onOpenChange={setShowDisconnectAll}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect All Apps?</AlertDialogTitle>
              <AlertDialogDescription>
                This will disconnect all connected apps from your wallet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnectAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
