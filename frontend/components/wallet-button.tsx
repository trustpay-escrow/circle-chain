'use client';

import { useState } from 'react';
import { WalletModal } from './wallet-modal';
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const truncate = (str: string) => `${str.slice(0, 4)}...${str.slice(-4)}`;

  return (
    <>
      <Button
        variant={address ? "outline" : "gradient"}
        size="md"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-2"
      >
        <Wallet className="w-4 h-4" />
        <span>{address ? truncate(address) : 'Connect Wallet'}</span>
      </Button>

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAddress={(pubKey) => setAddress(pubKey)}
      />
    </>
  );
}
