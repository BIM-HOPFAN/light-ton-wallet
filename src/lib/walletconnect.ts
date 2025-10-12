// Simplified WalletConnect session management using localStorage

const SESSIONS_KEY = 'wc_sessions';

export interface ConnectedSession {
  id: string;
  name: string;
  url: string;
  icon?: string;
  connectedAt: number;
}

export function parseWalletConnectUri(uri: string): { topic: string; version: string } | null {
  if (!uri.startsWith('wc:')) return null;
  
  try {
    const topic = uri.split('@')[0].replace('wc:', '');
    const version = uri.includes('@2') ? '2' : '1';
    return { topic, version };
  } catch {
    return null;
  }
}

export async function connectWithUri(uri: string, sessionInfo: Omit<ConnectedSession, 'id' | 'connectedAt'>): Promise<ConnectedSession> {
  const parsed = parseWalletConnectUri(uri);
  if (!parsed) throw new Error('Invalid WalletConnect URI');
  
  const session: ConnectedSession = {
    id: parsed.topic,
    ...sessionInfo,
    connectedAt: Date.now(),
  };
  
  const sessions = getActiveSessions();
  sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  
  return session;
}

export function getActiveSessions(): ConnectedSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function disconnectSession(id: string): void {
  const sessions = getActiveSessions().filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function disconnectAllSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}
