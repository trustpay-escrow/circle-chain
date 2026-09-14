import { isConnected as isFreighterConnected, requestAccess as requestFreighterAccess, getPublicKey as getFreighterPublicKey } from '@stellar/freighter-api';

export interface WalletProvider {
  id: string;
  name: string;
  type: 'extension' | 'web' | 'mobile' | 'hardware';
  icon: string;
  description: string;
  downloadUrl?: string;
  isInstalled: () => boolean | Promise<boolean>;
  connect: () => Promise<string | null>;
}

// Connect via Albedo web popup (works on all browsers without any extension)
const connectAlbedo = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const width = 450;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      'https://albedo.link/intent/public_key',
      'albedo_login',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      alert('Pop-up was blocked. Please allow pop-ups for Albedo web wallet.');
      resolve(null);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://albedo.link') {
        window.removeEventListener('message', handleMessage);
        if (event.data && event.data.pubkey) {
          resolve(event.data.pubkey);
        } else {
          resolve(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener('message', handleMessage);
        resolve(null);
      }
    }, 1000);
  });
};

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    id: 'freighter',
    name: 'Freighter',
    type: 'extension',
    icon: '🚀',
    description: 'Official browser extension by Stellar Development Foundation (SDF)',
    downloadUrl: 'https://freighter.app',
    isInstalled: async () => {
      if (typeof window === 'undefined') return false;
      try {
        const res = await isFreighterConnected();
        if (res) return true;
      } catch {}
      return !!((window as any).freighter || (window as any).freighterApi);
    },
    connect: async () => {
      try {
        const key = await requestFreighterAccess();
        if (key && typeof key === 'string' && key.startsWith('G')) {
          return key;
        }
        const pk = await getFreighterPublicKey();
        return pk || (typeof key === 'string' && key.length === 56 ? key : null);
      } catch (err) {
        console.error('Freighter connect error:', err);
        return null;
      }
    }
  },
  {
    id: 'xbull',
    name: 'xBull Wallet',
    type: 'extension',
    icon: '🐂',
    description: 'Feature-rich browser extension & PWA wallet for Stellar & Soroban',
    downloadUrl: 'https://xbull.app',
    isInstalled: () =>
      typeof window !== 'undefined' &&
      !!((window as any).xBullWallet || (window as any).xBull),
    connect: async () => {
      if (typeof window === 'undefined') return null;
      const xbull = (window as any).xBullWallet || (window as any).xBull;
      if (!xbull) {
        window.open('https://xbull.app', '_blank');
        return null;
      }
      try {
        const res = await xbull.getPublicKey();
        return res || null;
      } catch (err) {
        console.error('xBull connect error:', err);
        return null;
      }
    }
  },
  {
    id: 'albedo',
    name: 'Albedo',
    type: 'web',
    icon: '⚡',
    description: 'Secure pop-up web wallet — works on any browser without an extension',
    isInstalled: () => true,
    connect: connectAlbedo
  },
  {
    id: 'rabet',
    name: 'Rabet',
    type: 'extension',
    icon: '🐰',
    description: 'Lightweight & intuitive browser extension wallet for Stellar',
    downloadUrl: 'https://rabet.io',
    isInstalled: () =>
      typeof window !== 'undefined' &&
      !!((window as any).rabet || (window as any).rabetStellar),
    connect: async () => {
      if (typeof window === 'undefined') return null;
      const rabet = (window as any).rabet || (window as any).rabetStellar;
      if (!rabet) {
        window.open('https://rabet.io', '_blank');
        return null;
      }
      try {
        const res = await rabet.connect();
        return res?.publicKey || null;
      } catch (err) {
        console.error('Rabet connect error:', err);
        return null;
      }
    }
  },
  {
    id: 'hana',
    name: 'Hana Wallet',
    type: 'extension',
    icon: '🌸',
    description: 'Multi-chain extension wallet with full Soroban smart contract support',
    downloadUrl: 'https://hanawallet.io',
    isInstalled: () =>
      typeof window !== 'undefined' &&
      !!((window as any).hanaWallet || (window as any).hana),
    connect: async () => {
      if (typeof window === 'undefined') return null;
      const hana = (window as any).hanaWallet || (window as any).hana;
      if (!hana) {
        window.open('https://hanawallet.io', '_blank');
        return null;
      }
      try {
        const res = await hana.stellar?.getPublicKey();
        return res || null;
      } catch (err) {
        console.error('Hana connect error:', err);
        return null;
      }
    }
  },
  {
    id: 'lobstr',
    name: 'LOBSTR / Mobile',
    type: 'mobile',
    icon: '🦞',
    description: 'Widely used Stellar mobile wallet (Connect via address or QR)',
    downloadUrl: 'https://lobstr.co',
    isInstalled: () => true,
    connect: async () => {
      const address = prompt('Enter your LOBSTR / Stellar public key (G...):');
      return address && address.startsWith('G') && address.length === 56 ? address : null;
    }
  },
  {
    id: 'ledger',
    name: 'Ledger Hardware',
    type: 'hardware',
    icon: '🛡️',
    description: 'Connect hardware cold storage wallet securely',
    isInstalled: () => true,
    connect: async () => {
      const address = prompt('Enter your Ledger Stellar public address (G...):');
      return address && address.startsWith('G') && address.length === 56 ? address : null;
    }
  }
];

// Backwards compatibility helper for freighter
export const connectFreighterWallet = async (): Promise<string | null> => {
  const freighter = WALLET_PROVIDERS.find(p => p.id === 'freighter');
  return freighter ? freighter.connect() : null;
};
