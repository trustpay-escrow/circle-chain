'use client';

import Link from 'next/link';
import { useWallet } from '../lib/wallet-context';
import { Button } from './ui/button';
import { LogOut, User, PlusCircle, Compass } from 'lucide-react';

export function Navbar() {
  const { address, isConnecting, openModal, disconnect } = useWallet();

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

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/circles" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center space-x-1.5">
            <Compass className="w-4 h-4" />
            <span>Explore Circles</span>
          </Link>
          <Link href="/circles/create" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center space-x-1.5">
            <PlusCircle className="w-4 h-4" />
            <span>Start Circle</span>
          </Link>
          <Link href="/profile" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center space-x-1.5">
            <User className="w-4 h-4" />
            <span>Reputation & Profile</span>
          </Link>
        </div>

        {/* Connect / Disconnect Wallet Buttons */}
        <div className="flex items-center space-x-2">
          {address ? (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Link href="/profile" className="font-mono text-emerald-400 hover:underline">
                {truncate(address)}
              </Link>
              <button
                onClick={disconnect}
                title="Disconnect wallet"
                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="gradient"
              size="md"
              onClick={openModal}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
