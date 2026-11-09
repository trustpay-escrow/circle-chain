import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanRpc } from '@stellar/stellar-sdk';

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET';
export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID && process.env.NEXT_PUBLIC_CONTRACT_ID.startsWith('C') && process.env.NEXT_PUBLIC_CONTRACT_ID.length === 56
    ? process.env.NEXT_PUBLIC_CONTRACT_ID
    : 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK.toUpperCase() === 'PUBLIC'
    ? StellarSdk.Networks.PUBLIC
    : STELLAR_NETWORK.toUpperCase() === 'FUTURENET'
    ? StellarSdk.Networks.FUTURENET
    : StellarSdk.Networks.TESTNET;

export const BASE_FEE = '10000';

export interface SorobanSigner {
  signTransaction?: (xdr: string) => Promise<string>;
  sign?: (xdr: string) => Promise<string>;
  signAndSubmitTx?: (xdr: string) => Promise<{ hash: string; status: string }>;
}

export function getSorobanServer(): SorobanRpc.Server {
  return new SorobanRpc.Server(SOROBAN_RPC_URL, {
    allowHttp: SOROBAN_RPC_URL.startsWith('http://')
  });
}

/**
 * Funds an account on Stellar Testnet using Friendbot if not already funded
 */
export async function fundWithFriendbot(address: string): Promise<boolean> {
  if (STELLAR_NETWORK.toUpperCase() === 'PUBLIC') return false;
  try {
    const friendbotUrl =
      STELLAR_NETWORK.toUpperCase() === 'FUTURENET'
        ? 'https://friendbot-futurenet.stellar.org'
        : 'https://friendbot.stellar.org';
    const res = await fetch(`${friendbotUrl}?addr=${encodeURIComponent(address)}`);
    return res.ok;
  } catch (err) {
    console.warn('[Soroban] Friendbot funding error:', err);
    return false;
  }
}

/**
 * Fetches the Account object from Soroban RPC, auto-funding test accounts if needed
 */
export async function getAccount(address: string, autoFund: boolean = true): Promise<StellarSdk.Account> {
  const server = getSorobanServer();
  try {
    return await server.getAccount(address);
  } catch (err: any) {
    if (autoFund && STELLAR_NETWORK.toUpperCase() !== 'PUBLIC') {
      console.log(`[Soroban] Account ${address} not funded. Calling Friendbot...`);
      await fundWithFriendbot(address);
      await new Promise((r) => setTimeout(r, 2000));
      return await server.getAccount(address);
    }
    throw new Error(
      `Stellar account ${address} is not active or funded on ${STELLAR_NETWORK}. Please fund it with testnet XLM.`
    );
  }
}

/**
 * Polls Soroban RPC until the submitted transaction reaches finality
 */
export async function pollTransaction(
  server: SorobanRpc.Server,
  txHash: string,
  maxAttempts: number = 30
): Promise<SorobanRpc.Api.GetTransactionResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await server.getTransaction(txHash);
    if (res.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return res;
    }
    if (res.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Soroban transaction failed on ledger: ${JSON.stringify(res.resultXdr)}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Transaction ${txHash} confirmation timed out after ${maxAttempts} attempts`);
}

/**
 * Submits a signed transaction XDR to Soroban RPC and waits for confirmation
 */
export async function submitSignedTx(signedXdr: string): Promise<{ hash: string; result: any }> {
  const server = getSorobanServer();
  const tx = new StellarSdk.Transaction(signedXdr, NETWORK_PASSPHRASE);
  const sendRes = await server.sendTransaction(tx);

  if (sendRes.status === 'ERROR') {
    throw new Error(
      `Transaction rejected by Soroban RPC: ${sendRes.errorResult?.toXDR('base64') || JSON.stringify(sendRes)}`
    );
  }

  const result = await pollTransaction(server, sendRes.hash);
  return { hash: sendRes.hash, result };
}

/**
 * Helper to dispatch signing and submission through the provided signer or fallback
 */
async function signAndSubmit(preparedXdr: string, signer?: SorobanSigner): Promise<string> {
  if (signer && typeof signer.signAndSubmitTx === 'function') {
    const res = await signer.signAndSubmitTx(preparedXdr);
    return res.hash;
  }

  let signedXdr = preparedXdr;
  if (signer && typeof signer.signTransaction === 'function') {
    signedXdr = await signer.signTransaction(preparedXdr);
  } else if (signer && typeof signer.sign === 'function') {
    signedXdr = await signer.sign(preparedXdr);
  } else if (typeof signer === 'function') {
    signedXdr = await (signer as any)(preparedXdr);
  }

  const res = await submitSignedTx(signedXdr);
  return res.hash;
}

/**
 * Invokes join_circle on the Soroban smart contract
 * Transfers collateral into contract escrow and registers the member
 */
export async function invokeJoinCircle(
  circleId: number,
  memberAddress: string,
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(memberAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call(
        'join_circle',
        StellarSdk.nativeToScVal(BigInt(circleId), { type: 'u64' }),
        new StellarSdk.Address(memberAddress).toScVal()
      )
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

/**
 * Invokes contribute on the Soroban smart contract
 * Deposits cycle contribution into contract vault
 */
export async function invokeContribute(
  circleId: number,
  memberAddress: string,
  amount: bigint | number,
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(memberAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  // 1 token unit = 10^7 stroops
  const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(Math.floor(amount * 10_000_000));

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call(
        'contribute',
        StellarSdk.nativeToScVal(BigInt(circleId), { type: 'u64' }),
        new StellarSdk.Address(memberAddress).toScVal(),
        StellarSdk.nativeToScVal(amountBigInt, { type: 'i128' })
      )
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

/**
 * Invokes check_and_release_payout on the Soroban smart contract
 * Distributes accumulated pot to scheduled recipient once round deposits are confirmed
 */
export async function invokeReleasePayout(
  circleId: number,
  callerAddress: string,
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(callerAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call('check_and_release_payout', StellarSdk.nativeToScVal(BigInt(circleId), { type: 'u64' }))
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

/**
 * Invokes emergency_unwind on the Soroban smart contract
 * Transitions defaulted or stalled circle to Terminated state
 */
export async function invokeEmergencyUnwind(
  circleId: number,
  callerAddress: string,
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(callerAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call('emergency_unwind', StellarSdk.nativeToScVal(BigInt(circleId), { type: 'u64' }))
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

/**
 * Invokes withdraw_collateral on the Soroban smart contract
 * Returns staked collateral + unreleased contributions to member
 */
export async function invokeWithdrawCollateral(
  circleId: number,
  memberAddress: string,
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(memberAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call(
        'withdraw_collateral',
        StellarSdk.nativeToScVal(BigInt(circleId), { type: 'u64' }),
        new StellarSdk.Address(memberAddress).toScVal()
      )
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

/**
 * Invokes leave_circle on the Soroban smart contract
 * Allows member to exit an unfilled forming circle and refunds collateral
 */
export async function invokeLeaveCircle(
  circleId: number,
  memberAddress: string,
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(memberAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call(
        'leave_circle',
        StellarSdk.nativeToScVal(BigInt(circleId), { type: 'u64' }),
        new StellarSdk.Address(memberAddress).toScVal()
      )
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

/**
 * Invokes cancel_circle on the Soroban smart contract
 * Allows creator (or joined member after 7-day inactivity) to cancel circle and refund all deposits
 */
export async function invokeCancelCircle(
  circleId: number,
  callerAddress: string,
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(callerAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call(
        'cancel_circle',
        StellarSdk.nativeToScVal(BigInt(circleId), { type: 'u64' }),
        new StellarSdk.Address(callerAddress).toScVal()
      )
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

/**
 * Submits an auction bid for the cycle communal pot in BidBased mode
 */
export async function invokeSubmitBid(
  circleId: number,
  cycleIndex: number,
  bidderAddress: string,
  discountAmount: number | bigint,
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(bidderAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const discountStroops =
    typeof discountAmount === 'bigint'
      ? discountAmount
      : BigInt(Math.floor(Number(discountAmount) * 10_000_000));

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call(
        'submit_bid',
        StellarSdk.nativeToScVal(BigInt(circleId), { type: 'u64' }),
        StellarSdk.nativeToScVal(cycleIndex, { type: 'u32' }),
        new StellarSdk.Address(bidderAddress).toScVal(),
        StellarSdk.nativeToScVal(discountStroops, { type: 'i128' })
      )
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

/**
 * Invokes create_circle on the Soroban smart contract
 */
export async function invokeCreateCircle(
  params: {
    creator: string;
    tokenAddress: string;
    contributionAmount: number | bigint;
    intervalDays: number;
    memberCount: number;
    collateralRequired: number | bigint;
    payoutSchedule?: string[];
    payoutMode?: string;
  },
  signer?: SorobanSigner
): Promise<{ success: boolean; txHash: string }> {
  const server = getSorobanServer();
  const account = await getAccount(params.creator);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const contribStroops =
    typeof params.contributionAmount === 'bigint'
      ? params.contributionAmount
      : BigInt(Math.floor(Number(params.contributionAmount) * 10_000_000));

  const collateralStroops =
    typeof params.collateralRequired === 'bigint'
      ? params.collateralRequired
      : BigInt(Math.floor(Number(params.collateralRequired) * 10_000_000));

  const intervalSeconds = BigInt(params.intervalDays * 86400);

  // Default schedule: creator as first turn recipient
  const scheduleAddresses =
    params.payoutSchedule && params.payoutSchedule.length > 0
      ? params.payoutSchedule
      : [params.creator];

  const scheduleScVals = scheduleAddresses.map((addr) => new StellarSdk.Address(addr).toScVal());

  const modeName =
    params.payoutMode === 'Randomized'
      ? 'Randomized'
      : params.payoutMode === 'BidBased'
      ? 'BidBased'
      : 'Fixed';
  const modeScVal = StellarSdk.xdr.ScVal.scvVec([StellarSdk.xdr.ScVal.scvSymbol(modeName)]);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call(
        'create_circle',
        new StellarSdk.Address(params.creator).toScVal(),
        new StellarSdk.Address(params.tokenAddress).toScVal(),
        StellarSdk.nativeToScVal(contribStroops, { type: 'i128' }),
        StellarSdk.nativeToScVal(intervalSeconds, { type: 'u64' }),
        StellarSdk.nativeToScVal(params.memberCount, { type: 'u32' }),
        StellarSdk.nativeToScVal(collateralStroops, { type: 'i128' }),
        StellarSdk.xdr.ScVal.scvVec(scheduleScVals),
        modeScVal
      )
    )
    .setTimeout(60)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txHash = await signAndSubmit(preparedTx.toXDR(), signer);
  return { success: true, txHash };
}

