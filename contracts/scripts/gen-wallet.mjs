/**
 * 零依赖钱包生成器（只用 Node 内置模块）。
 *
 * 为什么要自己写 keccak：
 * 生成以太坊地址需要 keccak256，而 Node 的 crypto 只有 NIST SHA3-256（两者填充不同）。
 * 为了「本机不安装任何东西」，这里内联一份 Keccak-256 实现，并用已知测试向量自检。
 *
 * 用法：
 *   node contracts/scripts/gen-wallet.mjs            # 生成并写入 contracts/.env.local
 *   node contracts/scripts/gen-wallet.mjs --print    # 只打印地址，不写文件
 *   node contracts/scripts/gen-wallet.mjs --selftest # 只跑内置测试向量
 */

import { createHash, createECDH, generateKeyPairSync, randomBytes } from 'node:crypto';

const MASK = (1n << 64n) - 1n;

// Keccak-f[1600] round constants
const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

// 旋转偏移 [x][y]
const R = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

const rotl = (v, n) =>
  n === 0 ? v : ((v << BigInt(n)) | (v >> BigInt(64 - n))) & MASK;

function keccakF(A) {
  for (let round = 0; round < 24; round++) {
    // θ
    const C = new Array(5);
    for (let x = 0; x < 5; x++) {
      C[x] = A[x][0] ^ A[x][1] ^ A[x][2] ^ A[x][3] ^ A[x][4];
    }
    for (let x = 0; x < 5; x++) {
      const d = C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1);
      for (let y = 0; y < 5; y++) A[x][y] ^= d;
    }
    // ρ + π
    const B = Array.from({ length: 5 }, () => new Array(5).fill(0n));
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        B[y][(2 * x + 3 * y) % 5] = rotl(A[x][y], R[x][y]);
      }
    }
    // χ
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        A[x][y] = B[x][y] ^ (~B[(x + 1) % 5][y] & MASK & B[(x + 2) % 5][y]);
      }
    }
    // ι
    A[0][0] ^= RC[round];
  }
  return A;
}

/** Keccak-256（注意：不是 NIST SHA3-256，填充字节是 0x01 而非 0x06） */
export function keccak256(input) {
  const rate = 136;
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const padded = Buffer.alloc(Math.ceil((bytes.length + 1) / rate) * rate, 0);
  bytes.copy(padded);
  padded[bytes.length] ^= 0x01;
  padded[padded.length - 1] ^= 0x80;

  const A = Array.from({ length: 5 }, () => new Array(5).fill(0n));
  for (let off = 0; off < padded.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) {
      const lane = padded.readBigUInt64LE(off + i * 8);
      const x = i % 5;
      const y = Math.floor(i / 5);
      A[x][y] ^= lane;
    }
    keccakF(A);
  }

  const out = Buffer.alloc(32);
  for (let i = 0; i < 4; i++) {
    out.writeBigUInt64LE(A[i % 5][Math.floor(i / 5)], i * 8);
  }
  return out;
}

/** 从 secp256k1 公钥（未压缩 65 字节，0x04 开头）推导以太坊地址 */
export function addressFromPublicKey(uncompressed) {
  if (uncompressed.length !== 65 || uncompressed[0] !== 0x04) {
    throw new Error(`unexpected public key: ${uncompressed.length} bytes`);
  }
  const hash = keccak256(uncompressed.subarray(1));
  return '0x' + hash.subarray(12).toString('hex');
}

/** 从私钥（32 字节 hex）生成钱包地址 —— 用 Node 原生 secp256k1 ECDH，避免 DER 兼容问题 */
export function walletFromPrivateKey(privateKeyHex) {
  const key = privateKeyHex.replace(/^0x/, '');
  if (!/^[0-9a-fA-F]{64}$/.test(key)) throw new Error('private key must be 32 bytes hex');
  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(Buffer.from(key, 'hex'));
  const uncompressed = ecdh.getPublicKey(); // 65 字节，0x04 开头
  return { address: addressFromPublicKey(uncompressed), privateKey: '0x' + key.toLowerCase() };
}

// 延迟引入，保持顶部 import 精简
import { createPrivateKey as cryptoCreatePrivateKey } from 'node:crypto';

function generateWallet() {
  // 用 ECDH 生成密钥对：不经过 DER 序列化，跨 Node 版本行为一致
  const ecdh = createECDH('secp256k1');
  ecdh.generateKeys();
  const raw = ecdh.getPrivateKey().toString('hex');
  return walletFromPrivateKey(raw);
}

function selfTest() {
  const cases = [
    ['', 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'],
    ['abc', '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45'],
    ['hello world', '47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad'],
  ];
  for (const [input, expected] of cases) {
    const got = keccak256(Buffer.from(input)).toString('hex');
    if (got !== expected) throw new Error(`keccak mismatch for "${input}": ${got}`);
  }
  // 已知测试向量：私钥 0x…01 对应地址 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf
  const { address } = walletFromPrivateKey('0'.repeat(63) + '1');
  if (address.toLowerCase() !== '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf') {
    throw new Error(`address derivation mismatch: ${address}`);
  }
  console.log('✓ keccak256 与地址推导自检通过');
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  selfTest();
  const args = process.argv.slice(2);
  if (!args.includes('--selftest')) {
    const wallet = generateWallet();
    console.log(`地址: ${wallet.address}`);
    if (!args.includes('--print')) {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const file = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '.env.local');
      const body = `# 一次性部署钱包（测试用）。切勿提交，切勿重复使用。\nPRIVATE_KEY=${wallet.privateKey}\nDEPLOYER_ADDRESS=${wallet.address}\n`;
      fs.writeFileSync(file, body, { mode: 0o600 });
      console.log(`私钥已写入: contracts/.env.local （权限 600，已 gitignore）`);
    }
  }
}
