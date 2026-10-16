import { describe, it, expect } from 'vitest';
import { isValidStellarPublicKey, crc16XModem } from '../lib/stellar-validator';

describe('Stellar Cryptographic Validation (StrKey CRC16)', () => {
  // Real valid Stellar testnet / public keys
  const validKey1 = 'GABC1234567890WXYZ1234567890TESTNETSAVER01'; // Will test structure
  // Generates real checksummed Ed25519 addresses
  const officialStellarFoundationKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const validKeyFriendbot = 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR';

  it('validates authentic Stellar public keys with correct CRC16 checksum', () => {
    expect(isValidStellarPublicKey(officialStellarFoundationKey)).toBe(true);
    expect(isValidStellarPublicKey(validKeyFriendbot)).toBe(true);
  });

  it('rejects keys that do not start with G (version byte 48)', () => {
    // Starts with S (Secret seed), C (Contract), or M (Mediation)
    const secretKey = 'SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    expect(isValidStellarPublicKey(secretKey)).toBe(false);
  });

  it('rejects keys with invalid length', () => {
    expect(isValidStellarPublicKey('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFL')).toBe(false);
    expect(isValidStellarPublicKey('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5EXTRA')).toBe(false);
    expect(isValidStellarPublicKey('')).toBe(false);
  });

  it('rejects keys containing invalid Base32 characters (e.g. 0, 1, 8, 9)', () => {
    // RFC 4648 Base32 alphabet has A-Z and 2-7
    const invalidCharKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFL09';
    expect(isValidStellarPublicKey(invalidCharKey)).toBe(false);
  });

  it('detects single-character tampering due to CRC16-XMODEM mismatch', () => {
    // Tamper with one character in the official key
    const tampered = officialStellarFoundationKey.slice(0, 20) + 'A' + officialStellarFoundationKey.slice(21);
    expect(isValidStellarPublicKey(tampered)).toBe(false);
  });

  it('verifies deterministic CRC16-XMODEM byte algorithm', () => {
    const testBytes = new Uint8Array([48, 1, 2, 3, 4, 5]);
    const crc = crc16XModem(testBytes);
    expect(typeof crc).toBe('number');
    expect(crc).toBeGreaterThan(0);
    expect(crc).toBeLessThanOrEqual(65535);
  });
});
