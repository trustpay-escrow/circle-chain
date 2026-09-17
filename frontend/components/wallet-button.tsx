'use client';

import { useState } from 'react';
import { connectFreighterWallet } from '../lib/stellar';
import { Button } from './ui/button';
import { WalletModal } from './wallet-modal';

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnect = () => {
    setIsModalOpen(true);
  };

  const truncate = (str: string) => `${str.slice(0, 4)}...${str.slice(-4)}`;

  return (
    <>
      <Button
        variant="gradient"
        size="md"
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : address ? truncate(address) : 'Connect Wallet'}
      </Button>

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAddress={(selected) => {
          setAddress(selected);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
