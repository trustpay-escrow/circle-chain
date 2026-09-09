import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } from '@stellar/wallet-kit';

export const walletKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
});

export const getConnectedPublicKey = async (): Promise<string | null> => {
  try {
    const { address } = await walletKit.getAddress();
    return address || null;
  } catch (error) {
    console.error('Failed to fetch wallet address:', error);
    return null;
  }
};
