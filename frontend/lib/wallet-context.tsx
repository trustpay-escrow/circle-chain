'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectFreighterWallet, WALLET_PROVIDERS, type WalletProvider as StellarWalletProvider } from './stellar';
import { WalletModal } from '../components/wallet-modal';

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connectWallet: () => Promise<string | null>;
  disconnect: () => void;
  setAddress: (address: string | null) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = 'circlechain_connected_wallet';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddressState] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Restore from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.startsWith('G') && saved.length === 56) {
      setAddressState(saved);
    }
  }, []);

  const setAddress = (addr: string | null) => {
    setAddressState(addr);
    if (addr) {
      localStorage.setItem(STORAGE_KEY, addr);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const connectWallet = async (): Promise<string | null> => {
    setIsConnecting(true);
    try {
      const pubKey = await connectFreighterWallet();
      if (pubKey) {
        setAddress(pubKey);
        return pubKey;
      }
      // If direct freighter wasn't available, open modal for other wallet choices
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
    setAddress(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnecting,
        isModalOpen,
        openModal,
        closeModal,
        connectWallet,
        disconnect,
        setAddress,
      }}
    >
      {children}
      <WalletModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSelectAddress={(selected) => {
          setAddress(selected);
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
