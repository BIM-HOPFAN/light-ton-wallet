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
      const storedTokens = JSON.parse(stored);
      
      // Merge with default tokens - add any new defaults that aren't already present
      const merged = [...storedTokens];
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
      
      // Update localStorage with merged tokens
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
