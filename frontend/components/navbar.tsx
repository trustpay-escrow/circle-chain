'use client';

import { useState } from 'react';
import Link from 'next/link';
import { connectFreighterWallet } from '../lib/stellar';
import { Button } from './ui/button';

export function Navbar() {
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
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            ⭕
          </div>
          <span className="font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            CircleChain
          </span>
        </Link>

        {/* Navigation Links ONLY shown when wallet is connected */}
        {address ? (
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/circles" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm font-medium">
              Explore Circles
            </Link>
            <Link href="/circles/create" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm font-medium">
              Start Circle
            </Link>
            <Link href="/profile" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm font-medium">
              Reputation & Profile
            </Link>
          </div>
        ) : null}

        {/* Connect Wallet Button using shadcn/ui Button */}
        <Button
          variant="gradient"
          size="md"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : address ? truncate(address) : 'Connect Wallet'}
        </Button>
      </div>
    </nav>
  );
}
