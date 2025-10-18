import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProtectedFeatureProps {
  children: React.ReactNode;
  featureName: string;
}

export function ProtectedFeature({ children, featureName }: ProtectedFeatureProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      toast.error(`Please sign in to access ${featureName}`);
      navigate('/auth', { state: { returnUrl: window.location.pathname } });
    }
  }, [user, loading, navigate, featureName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
