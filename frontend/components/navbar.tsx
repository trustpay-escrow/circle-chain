'use client';

import Link from 'next/link';
import { WalletButton } from './wallet-button';

export function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-purple-600 flex items-center justify-center font-bold text-white">
              ⭕
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              CircleChain
            </span>
          </Link>
          <div className="hidden md:flex space-x-6">
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
        </div>
        <WalletButton />
      </div>
    </nav>
  );
}
