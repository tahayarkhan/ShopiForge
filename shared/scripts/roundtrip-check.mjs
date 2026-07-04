import { encryptSecret, decryptSecret} from '../dist/index.js';

const keyA = "Uv+eEVB54JZ5HTXOrGSkTZHgPzh/YUhBxz7/5PRCGto=";
const keyB = "urmom";

const fakeToken = 'shpat_fake_test_token_for_roundtrip';

const secret = encryptSecret(fakeToken, keyA);

if (secret.encrypted === fakeToken) process.exit(1);

if (decryptSecret(secret, keyA) !== fakeToken) process.exit(1);

try {
    decryptSecret(secret, keyB);
} catch {
    console.log('Round-trip OK');
    process.exit(0);
}
  process.exit(1);