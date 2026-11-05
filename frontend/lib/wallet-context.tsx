'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectFreighterWallet, WALLET_PROVIDERS, type WalletProvider as StellarWalletProvider } from './stellar';
import { WalletModal } from '../components/wallet-modal';
import { submitSignedTx, NETWORK_PASSPHRASE } from './soroban';

export interface WalletContextType {
  address: string | null;
  walletId: string | null;
  isConnecting: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connectWallet: () => Promise<string | null>;
  disconnect: () => void;
  setAddress: (address: string | null, walletId?: string | null) => void;
  signTransaction: (xdr: string) => Promise<string>;
  signAndSubmitTx: (xdr: string) => Promise<{ hash: string; status: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = 'circlechain_connected_wallet';
const WALLET_ID_KEY = 'circlechain_connected_wallet_id';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddressState] = useState<string | null>(null);
  const [walletId, setWalletIdState] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Restore from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedWallet = localStorage.getItem(WALLET_ID_KEY);
    if (saved && saved.startsWith('G') && saved.length === 56) {
      setAddressState(saved);
      if (savedWallet) setWalletIdState(savedWallet);
    }
  }, []);

  const setAddress = (addr: string | null, providerId?: string | null) => {
    setAddressState(addr);
    const resolvedId = providerId || walletId || 'freighter';
    if (addr) {
      setWalletIdState(resolvedId);
      localStorage.setItem(STORAGE_KEY, addr);
      localStorage.setItem(WALLET_ID_KEY, resolvedId);
    } else {
      setWalletIdState(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(WALLET_ID_KEY);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const connectWallet = async (): Promise<string | null> => {
    setIsConnecting(true);
    try {
      const pubKey = await connectFreighterWallet();
      if (pubKey) {
        setAddress(pubKey, 'freighter');
        return pubKey;
      }
      openModal();
      return null;
    } catch (err) {
      console.warn('Wallet connection error, opening wallet modal:', err);
      openModal();
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null, null);
  };

  /**
   * Signs a transaction XDR with the currently connected wallet
   * Supports Freighter, xBull, and Albedo web wallet
   */
  const signTransaction = async (xdr: string): Promise<string> => {
    const activeProvider = WALLET_PROVIDERS.find((p) => p.id === (walletId || 'freighter'));

    if (activeProvider && typeof activeProvider.sign === 'function') {
      return await activeProvider.sign(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        accountToSign: address || undefined
      });
    }

    // Fallback: search for first available signing provider (Freighter or Albedo)
    for (const provider of WALLET_PROVIDERS) {
      if (typeof provider.sign === 'function') {
        const isInstalled = await provider.isInstalled();
        if (isInstalled || provider.type === 'web') {
          return await provider.sign(xdr, {
            networkPassphrase: NETWORK_PASSPHRASE,
            accountToSign: address || undefined
          });
        }
      }
    }

    throw new Error('No compatible wallet extension or web signer available to sign this transaction');
  };

  /**
   * Signs and submits transaction to Soroban RPC, waiting for confirmed inclusion
   */
  const signAndSubmitTx = async (xdr: string): Promise<{ hash: string; status: string }> => {
    const signedXdr = await signTransaction(xdr);
    const res = await submitSignedTx(signedXdr);
    return { hash: res.hash, status: 'SUCCESS' };
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        walletId,
        isConnecting,
        isModalOpen,
        openModal,
        closeModal,
        connectWallet,
        disconnect,
        setAddress,
        signTransaction,
        signAndSubmitTx
      }}
    >
      {children}
      <WalletModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSelectAddress={(selected, providerId) => {
          setAddress(selected, providerId);
          closeModal();
        }}
      />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
