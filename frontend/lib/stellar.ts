import { isConnected, getPublicKey } from '@stellar/freighter-api';

export const connectFreighterWallet = async (): Promise<string | null> => {
  try {
    const connected = await isConnected();
    if (!connected) {
      alert('Freighter wallet extension is not installed.');
      return null;
    }
    const publicKey = await getPublicKey();
    return publicKey || null;
  } catch (error) {
    console.error('Failed to connect Freighter wallet:', error);
    return null;
  }
};
