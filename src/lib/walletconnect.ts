import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import { getSdkError } from '@walletconnect/utils';
import { SessionTypes } from '@walletconnect/types';

const PROJECT_ID = 'YOUR_PROJECT_ID'; // Users can get this from walletconnect.com

let web3wallet: IWeb3Wallet | null = null;

export interface ConnectedSession {
  topic: string;
  name: string;
  url: string;
  icons: string[];
  expiry: number;
}

export async function initializeWalletConnect() {
  if (web3wallet) return web3wallet;

  const core = new Core({
    projectId: PROJECT_ID,
  });

  web3wallet = await Web3Wallet.init({
    core,
    metadata: {
      name: 'Light TON Wallet',
      description: 'A lightweight TON wallet',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.ico`],
    },
  });

  return web3wallet;
}

export async function connectWithUri(uri: string) {
  if (!web3wallet) {
    await initializeWalletConnect();
  }
  
  if (!web3wallet) throw new Error('WalletConnect not initialized');
  
  await web3wallet.pair({ uri });
}

export async function getActiveSessions(): Promise<ConnectedSession[]> {
  if (!web3wallet) return [];
  
  const sessions = web3wallet.getActiveSessions();
  return Object.values(sessions).map((session: SessionTypes.Struct) => ({
    topic: session.topic,
    name: session.peer.metadata.name,
    url: session.peer.metadata.url,
    icons: session.peer.metadata.icons,
    expiry: session.expiry,
  }));
}

export async function disconnectSession(topic: string) {
  if (!web3wallet) return;
  
  await web3wallet.disconnectSession({
    topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
}

export async function disconnectAllSessions() {
  if (!web3wallet) return;
  
  const sessions = web3wallet.getActiveSessions();
  const disconnectPromises = Object.keys(sessions).map((topic) =>
    web3wallet!.disconnectSession({
      topic,
      reason: getSdkError('USER_DISCONNECTED'),
    })
  );
  
  await Promise.all(disconnectPromises);
}

export function onSessionProposal(callback: (proposal: any) => void) {
  if (!web3wallet) return;
  
  web3wallet.on('session_proposal', callback);
}

export function onSessionRequest(callback: (request: any) => void) {
  if (!web3wallet) return;
  
  web3wallet.on('session_request', callback);
}

export async function approveSession(proposal: any, address: string) {
  if (!web3wallet) throw new Error('WalletConnect not initialized');
  
  const { id, params } = proposal;
  const { requiredNamespaces } = params;
  
  const namespaces: Record<string, any> = {};
  Object.keys(requiredNamespaces).forEach((key) => {
    namespaces[key] = {
      accounts: [`${key}:${address}`],
      methods: requiredNamespaces[key].methods,
      events: requiredNamespaces[key].events,
    };
  });
  
  const session = await web3wallet.approveSession({
    id,
    namespaces,
  });
  
  return session;
}

export async function rejectSession(proposal: any) {
  if (!web3wallet) throw new Error('WalletConnect not initialized');
  
  await web3wallet.rejectSession({
    id: proposal.id,
    reason: getSdkError('USER_REJECTED'),
  });
}
