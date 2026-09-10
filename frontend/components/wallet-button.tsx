'use client';

import { useState } from 'react';
import { connectFreighterWallet } from '../lib/stellar';
import { Button } from './ui/button';

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const pubKey = await connectFreighterWallet();
      if (pubKey) {
        setAddress(pubKey);
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const truncate = (str: string) => `${str.slice(0, 4)}...${str.slice(-4)}`;

  return (
    <Button
      variant="gradient"
      size="md"
      onClick={handleConnect}
      disabled={connecting}
    >
      {connecting ? 'Connecting...' : address ? truncate(address) : 'Connect Wallet'}
    </Button>
  );
}
