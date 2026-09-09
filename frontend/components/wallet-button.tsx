'use client';

import { useState } from 'react';
import { walletKit } from '../lib/stellar';

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      await walletKit.openModal({
        onWalletSelected: async (option) => {
          walletKit.setWallet(option.id);
          const { address } = await walletKit.getAddress();
          setAddress(address);
        },
      });
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setConnecting(false);
    }
  };

  const truncate = (str: string) => `${str.slice(0, 4)}...${str.slice(-4)}`;

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
    >
      {connecting ? 'Connecting...' : address ? truncate(address) : 'Connect Freighter'}
    </button>
  );
}
