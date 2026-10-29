import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

function getEncryptionKey() {
  const secret = process.env.SELLER_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SELLER_JWT_SECRET must be configured with at least 32 characters to protect payout details');
  }
  return createHmac('sha256', secret).update('seller-payout-methods:v1').digest();
}

export function encryptPayoutDetails(details: { account_holder: string; identifier: string; identifier_kind: 'mobile' | 'bank_account' }) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(details), 'utf8'),
    cipher.final(),
  ]);
  return `v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptPayoutDetails(value: string) {
  const [version, ivHex, tagHex, encryptedHex] = value.split(':');
  if (version !== 'v1' || !ivHex || !tagHex || !encryptedHex) {
    throw new Error('Unsupported or invalid encrypted payout details');
  }
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(decrypted) as {
    account_holder: string;
    identifier: string;
    identifier_kind: 'mobile' | 'bank_account';
  };
}

export function maskPayoutIdentifier(identifier: string) {
  return `•••• ${identifier.slice(-4)}`;
}
