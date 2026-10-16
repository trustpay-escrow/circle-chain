/**
 * Stellar StrKey CRC16-XMODEM Validator
 * Validates Stellar public keys (Ed25519 Public Key: Version byte 6 << 3 = 48 -> 'G')
 * with full RFC 4648 Base32 decoding and CRC16 checksum calculation.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/=+$/, '');
  const length = cleaned.length;
  const output = new Uint8Array(Math.floor((length * 5) / 8));

  let buffer = 0;
  let bitsLeft = 0;
  let count = 0;

  for (let i = 0; i < length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) {
      throw new Error(`Invalid Base32 character: ${cleaned[i]}`);
    }

    buffer = (buffer << 5) | val;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      output[count++] = (buffer >> (bitsLeft - 8)) & 255;
      bitsLeft -= 8;
    }
  }

  return output;
}

/**
 * Calculates CRC16-XMODEM checksum (polynomial 0x1021)
 */
export function crc16XModem(data: Uint8Array): number {
  let crc = 0x0000;
  for (let i = 0; i < data.length; i++) {
    let byte = data[i];
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }
  return crc & 0xffff;
}

/**
 * Validates whether a given string is a valid Stellar Ed25519 Public Key
 * @param address Stellar public key (starts with 'G', 56 chars)
 */
export function isValidStellarPublicKey(address: string): boolean {
  if (typeof address !== 'string' || address.length !== 56 || !address.startsWith('G')) {
    return false;
  }

  try {
    const decoded = base32Decode(address);
    if (decoded.length !== 35) {
      // 1 version byte + 32 public key bytes + 2 checksum bytes = 35 bytes
      return false;
    }

    // Version byte for Ed25519 Public Key is 6 << 3 = 48 ('G')
    const versionByte = decoded[0];
    if (versionByte !== (6 << 3)) {
      return false;
    }

    // Payload is version byte + 32-byte key
    const payload = decoded.slice(0, 33);
    const expectedChecksum = decoded[33] | (decoded[34] << 8);

    const calculatedChecksum = crc16XModem(payload);
    return calculatedChecksum === expectedChecksum;
  } catch {
    return false;
  }
}
