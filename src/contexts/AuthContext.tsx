import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { migrateTransactionsToSupabase } from '@/lib/transactions';
import { getActiveWallet } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MIGRATION_FLAG_KEY = 'bimlight_transactions_migrated';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Migrate transactions on first login
        if (event === 'SIGNED_IN' && session?.user) {
          await handleTransactionMigration(session.user.id);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Migrate transactions if user is already logged in
      if (session?.user) {
        await handleTransactionMigration(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTransactionMigration = async (userId: string) => {
    const migrationCompleted = localStorage.getItem(MIGRATION_FLAG_KEY);
    
    if (!migrationCompleted) {
      const activeWallet = getActiveWallet();
      
      if (activeWallet) {
        try {
          console.log('Migrating legacy transactions to database...');
          const migratedCount = await migrateTransactionsToSupabase(userId, activeWallet.address);
          
          if (migratedCount > 0) {
            console.log(`Successfully migrated ${migratedCount} transactions`);
          }
          
          // Set flag to prevent future migrations
          localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
        } catch (error) {
          console.error('Failed to migrate transactions:', error);
        }
      } else {
        // No wallet yet, mark as migrated to avoid checking again
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
