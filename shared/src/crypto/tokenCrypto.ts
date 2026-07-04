import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface EncryptedSecret {
    encrypted: string;
    iv: string;
    tag: string;
}

function decodeKey(keyBase64: string): Buffer {
    const key = Buffer.from(keyBase64, 'base64');

    if (key.length !== 32) {
        throw new Error('Encryption key must decode to 32 bytes');
    }
    return key;
}

export function encryptSecret(plainText: string, keyBase64: string): EncryptedSecret {
    const key = decodeKey(keyBase64);
    const iv = randomBytes(12);

    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encryptedBuffer = Buffer.concat([
        cipher.update(plainText, 'utf-8'),
        cipher.final(),
    ])

    const tag = cipher.getAuthTag();

    return {
        encrypted: encryptedBuffer.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
    }

}

export function decryptSecret(secret: EncryptedSecret, keyBase64: string): string {
    const key = decodeKey(keyBase64);
    
    const iv = Buffer.from(secret.iv, 'base64');
    const tag =  Buffer.from(secret.tag, 'base64');
    const encrypted = Buffer.from(secret.encrypted, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');

}
