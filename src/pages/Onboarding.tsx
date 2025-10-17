import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Lock, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bimlightLogo from '@/assets/bimlight-logo.png';

export default function Onboarding() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <img src={bimlightLogo} alt="Bimlight Bank" className="h-24 w-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Bimlight Bank
          </h1>
          <p className="text-muted-foreground">
            Your secure gateway to The Open Network
          </p>
        </div>
        
        <Card className="p-6 mb-6 gradient-card shadow-card">
          <div className="space-y-4">
            <Feature
              icon={<Shield className="h-5 w-5" />}
              title="Secure & Non-custodial"
              description="Your keys, your crypto. We never store your private keys."
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Lightning Fast"
              description="Experience instant transactions on TON blockchain."
            />
            <Feature
              icon={<Lock className="h-5 w-5" />}
              title="Military-grade Encryption"
              description="AES-256 encryption protects your wallet locally."
            />
          </div>
        </Card>
        
        <div className="space-y-3">
          <Button 
            className="w-full gradient-primary text-lg h-12 transition-smooth"
            onClick={() => navigate('/create')}
          >
            Create New Wallet
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-lg h-12 transition-smooth"
            onClick={() => navigate('/restore')}
          >
            Restore Existing Wallet
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
