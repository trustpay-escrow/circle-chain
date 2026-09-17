'use client';

import { useState } from 'react';
import { connectFreighterWallet } from '../lib/stellar';
import { Button } from './ui/button';

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
