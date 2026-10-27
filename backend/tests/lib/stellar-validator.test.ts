import { describe, it, expect } from 'vitest';
import { isValidStellarPublicKey, crc16XModem } from '../../src/lib/stellar-validator';
import { mockValidStellarAddress, mockSecondStellarAddress, mockInvalidStellarAddress } from '../fixtures/mock-data';

describe('Stellar StrKey CRC16-XMODEM Validator', () => {
  it('Validates standard Ed25519 G-prefix Stellar public keys', () => {
    expect(isValidStellarPublicKey(mockValidStellarAddress)).toBe(true);
    expect(isValidStellarPublicKey(mockSecondStellarAddress)).toBe(true);
  });

  it('Rejects invalid addresses, wrong lengths, and invalid checksums', () => {
    expect(isValidStellarPublicKey(mockInvalidStellarAddress)).toBe(false);
    expect(isValidStellarPublicKey('')).toBe(false);
    expect(isValidStellarPublicKey('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA0')).toBe(false); // bad checksum
  });

  it('Computes valid CRC16-XMODEM checksum for arbitrary bytes', () => {
    const data = new Uint8Array([48, 1, 2, 3, 4, 5]);
    const crc = crc16XModem(data);
    expect(typeof crc).toBe('number');
    expect(crc).toBeGreaterThan(0);
  });
});
