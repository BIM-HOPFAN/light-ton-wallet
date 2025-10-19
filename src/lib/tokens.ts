export type Network = 'TON' | 'Ethereum' | 'Binance Smart Chain' | 'Polygon' | 'Solana' | 'Bitcoin';

export interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  network: Network;
  contractAddress?: string;
  icon?: string;
  isNative?: boolean;
  balance?: string;
}

const TOKENS_KEY = 'wallet_tokens';

// Default tokens
export const DEFAULT_TOKENS: Token[] = [
  {
    id: 'ton',
    symbol: 'TON',
    name: 'Toncoin',
    decimals: 9,
    network: 'TON',
    isNative: true,
    icon: '💎',
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    network: 'TON',
    contractAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    icon: '₮',
  },
  {
    id: 'bimcoin',
    symbol: 'BIM',
    name: 'Bimcoin',
    decimals: 9,
    network: 'TON',
    contractAddress: 'EQB0ePLIUc02kwXNA7ulK-vlotIxIqrEfD0tBC53Bmz6DCRO',
    icon: '🪙',
  },
];

export const SUPPORTED_NETWORKS: Network[] = [
  'TON',
  'Ethereum',
  'Binance Smart Chain',
  'Polygon',
  'Solana',
  'Bitcoin',
];

export function getTokens(): Token[] {
  try {
    const stored = localStorage.getItem(TOKENS_KEY);
    if (stored) {
      let storedTokens = JSON.parse(stored);
      
      // Remove old incorrect Bimcoin token with placeholder address
      storedTokens = storedTokens.filter(
        (t: Token) => !(t.symbol === 'BIM' && t.contractAddress === 'EQBimcoin1234567890abcdefghijklmnopqrstuvwxyz_BIM')
      );
      
      // Remove duplicates based on symbol, network, and contract address
      const uniqueTokens = storedTokens.reduce((acc: Token[], current: Token) => {
        const duplicate = acc.find(
          t => t.symbol === current.symbol && 
               t.network === current.network &&
               (t.contractAddress === current.contractAddress || (!t.contractAddress && !current.contractAddress))
        );
        if (!duplicate) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Merge with default tokens - add any new defaults that aren't already present
      const merged = [...uniqueTokens];
      DEFAULT_TOKENS.forEach(defaultToken => {
        const exists = merged.find(
          t => t.symbol === defaultToken.symbol && 
               t.network === defaultToken.network &&
               (t.contractAddress === defaultToken.contractAddress || (!t.contractAddress && !defaultToken.contractAddress))
        );
        if (!exists) {
          merged.push(defaultToken);
        }
      });
      
      // Update localStorage with cleaned tokens
      localStorage.setItem(TOKENS_KEY, JSON.stringify(merged));
      return merged;
    }
    // Initialize with default tokens
    localStorage.setItem(TOKENS_KEY, JSON.stringify(DEFAULT_TOKENS));
    return DEFAULT_TOKENS;
  } catch {
    return DEFAULT_TOKENS;
  }
}

export function addToken(token: Omit<Token, 'id'>): Token {
  const tokens = getTokens();
  const newToken: Token = {
    ...token,
    id: `${token.symbol.toLowerCase()}-${Date.now()}`,
  };
  
  // Check if token already exists
  const exists = tokens.find(
    t => t.symbol === token.symbol && t.contractAddress === token.contractAddress
  );
  
  if (exists) {
    throw new Error('Token already added');
  }
  
  tokens.push(newToken);
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  return newToken;
}

export function removeToken(tokenId: string): void {
  const tokens = getTokens().filter(t => t.id !== tokenId && !t.isNative);
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function updateTokenBalance(tokenId: string, balance: string): void {
  const tokens = getTokens();
  const tokenIndex = tokens.findIndex(t => t.id === tokenId);
  
  if (tokenIndex !== -1) {
    tokens[tokenIndex].balance = balance;
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  }
}

export function getTokenById(tokenId: string): Token | undefined {
  return getTokens().find(t => t.id === tokenId);
}

export function resetToDefaultTokens(): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(DEFAULT_TOKENS));
}
