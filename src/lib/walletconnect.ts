// Simplified WalletConnect session management using localStorage

const SESSIONS_KEY = 'wc_sessions';

export interface ConnectedSession {
  id: string;
  name: string;
  url: string;
  icon?: string;
  connectedAt: number;
}

export function parseWalletConnectUri(uri: string): { topic: string; version: string; metadata?: any } | null {
  if (!uri || typeof uri !== 'string') return null;
  
  // Support both wc: and https:// formats
  const cleanUri = uri.trim();
  if (!cleanUri.startsWith('wc:') && !cleanUri.includes('wc?uri=')) return null;
  
  try {
    // Extract the actual WC URI if it's URL encoded
    let wcUri = cleanUri;
    if (cleanUri.includes('wc?uri=')) {
      const urlParams = new URLSearchParams(cleanUri.split('?')[1]);
      wcUri = decodeURIComponent(urlParams.get('uri') || '');
    }
    
    const topic = wcUri.split('@')[0].replace('wc:', '');
    const version = wcUri.includes('@2') ? '2' : '1';
    
    // Extract metadata if present
    const metadataMatch = wcUri.match(/bridge=([^&]+)/);
    const metadata = metadataMatch ? { bridge: decodeURIComponent(metadataMatch[1]) } : undefined;
    
    return { topic, version, metadata };
  } catch (error) {
    console.error('Error parsing WalletConnect URI:', error);
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
