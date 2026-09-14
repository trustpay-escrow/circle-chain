'use client';

import { useState, useEffect } from 'react';
import { WALLET_PROVIDERS, WalletProvider } from '../lib/stellar';
import { X, ExternalLink, CheckCircle2, AlertCircle, ArrowLeft, Smartphone } from 'lucide-react';
import { Button } from './ui/button';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string) => void;
}

export function WalletModal({ isOpen, onClose, onSelectAddress }: WalletModalProps) {
  const [installationStatus, setInstallationStatus] = useState<Record<string, boolean>>({});
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedMobileWallet, setSelectedMobileWallet] = useState<'lobstr' | 'ledger' | null>(null);
  const [inputAddress, setInputAddress] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedMobileWallet(null);
      setInputAddress('');
      setErrorMsg(null);
      return;
    }

    const checkStatuses = async () => {
      const statuses: Record<string, boolean> = {};
      for (const provider of WALLET_PROVIDERS) {
        try {
          statuses[provider.id] = await provider.isInstalled();
        } catch {
          statuses[provider.id] = false;
        }
      }
      setInstallationStatus(statuses);
    };

    checkStatuses();
    // Re-check after 1 second in case extension script injection was delayed
    const timer = setTimeout(checkStatuses, 1000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (provider: WalletProvider) => {
    if (provider.id === 'lobstr') {
      setSelectedMobileWallet('lobstr');
      setErrorMsg(null);
      return;
    }

    if (provider.id === 'ledger') {
      setSelectedMobileWallet('ledger');
      setErrorMsg(null);
      return;
    }

    setConnectingId(provider.id);
    setErrorMsg(null);
    try {
      const pubKey = await provider.connect();
      if (pubKey) {
        onSelectAddress(pubKey);
        onClose();
      } else {
        setErrorMsg(`Connection to ${provider.name} was cancelled or no public key returned.`);
      }
    } catch (err: any) {
      console.error(`Failed to connect ${provider.name}:`, err);
      setErrorMsg(`Failed to connect ${provider.name}. Please ensure the extension is enabled.`);
    } finally {
      setConnectingId(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddress = inputAddress.trim();
    if (!cleanAddress.startsWith('G') || cleanAddress.length !== 56) {
      setErrorMsg('Invalid Stellar public key format. Address must start with "G" and be 56 characters long.');
      return;
    }
    onSelectAddress(cleanAddress);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2">
            {selectedMobileWallet ? (
              <button
                onClick={() => {
                  setSelectedMobileWallet(null);
                  setErrorMsg(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {selectedMobileWallet === 'lobstr'
                  ? 'Connect LOBSTR Mobile'
                  : selectedMobileWallet === 'ledger'
                  ? 'Connect Ledger Hardware'
                  : 'Connect Stellar Wallet'}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedMobileWallet
                  ? 'Enter address or open LOBSTR mobile app'
                  : 'Select your preferred wallet to connect to CircleChain'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg ? (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {/* VIEW 1: LOBSTR Mobile Custom Form */}
        {selectedMobileWallet === 'lobstr' ? (
          <div className="p-6 space-y-5">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                🦞
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">LOBSTR Mobile App</h3>
                <p className="text-xs text-slate-400">
                  LOBSTR is a mobile wallet app for iOS & Android. Copy your public key from LOBSTR or open the app below.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href="https://lobstr.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Open LOBSTR Web/App</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                LOBSTR Public Key (Stellar Address):
              </label>
              <input
                type="text"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Button type="submit" variant="gradient" size="md" className="w-full">
                Connect LOBSTR Wallet
              </Button>
            </form>
          </div>
        ) : selectedMobileWallet === 'ledger' ? (
          /* VIEW 2: Ledger Custom Form */
          <div className="p-6 space-y-5">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                🛡️
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Ledger Hardware Wallet</h3>
                <p className="text-xs text-slate-400">
                  Connect your Ledger device via USB or enter your Ledger Stellar public address below.
                </p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Ledger Stellar Address:
              </label>
              <input
                type="text"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Button type="submit" variant="gradient" size="md" className="w-full">
                Connect Ledger Wallet
              </Button>
            </form>
          </div>
        ) : (
          /* VIEW 3: Main Provider List */
          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {WALLET_PROVIDERS.map((provider) => {
              const isInstalled = installationStatus[provider.id] ?? false;
              const isConnecting = connectingId === provider.id;

              return (
                <div
                  key={provider.id}
                  className="group relative flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 hover:border-emerald-500/50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                      {provider.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {provider.name}
                        </span>
                        {provider.type === 'web' ? (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                            Web Wallet
                          </span>
                        ) : isInstalled ? (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 inline" />
                            <span>Detected</span>
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {provider.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <Button
                      size="sm"
                      variant="gradient"
                      disabled={isConnecting}
                      onClick={() => handleConnect(provider)}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>

                    {!isInstalled && provider.downloadUrl ? (
                      <a
                        href={provider.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                        title={`Install ${provider.name}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-center">
          <p className="text-[11px] text-slate-500">
            Connecting a wallet lets you save, borrow, and vote on CircleChain smart contracts.
          </p>
        </div>
      </div>
    </div>
  );
}
