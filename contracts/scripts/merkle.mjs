/**
 * Merkle 领取表生成器（零依赖，复用 gen-wallet.mjs 里的 keccak256）。
 *
 * 必须与合约保持一致：
 *   leaf = keccak256(bytes.concat(keccak256(abi.encode(account, epoch, amount))))
 *   pair = keccak256(bytes.concat(min(a,b), max(a,b)))
 *
 * 用法：
 *   node contracts/scripts/merkle.mjs --epoch 1 \
 *        --claims 0xAbC...=1000000000000000000,0xDef...=2000000000000000000
 *
 *   node contracts/scripts/merkle.mjs --epoch 1 --demo      # 用测试私钥生成本地演示领取表
 *   node contracts/scripts/merkle.mjs --epoch 1 --file claims.json --out out/epoch-1.json
 *
 * claims.json 格式：{ "claims": [{ "account": "0x...", "amount": "1000000000000000000" }] }
 * 输出（stdout 或 --out）：{ epoch, root, total, leaves: [{ index, account, amount, proof }] }
 *
 * 安全：本脚本只做数学，不碰私钥、不发交易。
 */

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { keccak256, walletFromPrivateKey } from './gen-wallet.mjs';

const hex = (buf) => '0x' + buf.toString('hex');

/** address + uint256 + uint256 的 abi.encode（三个 32 字节槽） */
function encodeLeafArgs(account, epoch, amount) {
  const addr = account.replace(/^0x/, '').toLowerCase().padStart(64, '0');
  const epochHex = BigInt(epoch).toString(16).padStart(64, '0');
  const amountHex = BigInt(amount).toString(16).padStart(64, '0');
  return Buffer.from(addr + epochHex + amountHex, 'hex');
}

/** leaf = keccak256(keccak256(abi.encode(...))) —— 双哈希防第二原像 */
export function leafHash(account, epoch, amount) {
  const inner = keccak256(encodeLeafArgs(account, epoch, amount));
  return hex(keccak256(inner));
}

const toBig = (bytes32Hex) => BigInt(bytes32Hex);

/** 排序后哈希，与 Solidity 的 hashPair 一致 */
export function hashPair(a, b) {
  const [left, right] = toBig(a) <= toBig(b) ? [a, b] : [b, a];
  return hex(keccak256(Buffer.concat([
    Buffer.from(left.replace(/^0x/, ''), 'hex'),
    Buffer.from(right.replace(/^0x/, ''), 'hex'),
  ])));
}

/** 构建树：奇数长度时最后一个元素直接上提（与 Merkle.sol 一致） */
export function buildTree(leaves) {
  const levels = [leaves.slice()];
  let current = leaves.slice();
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      next.push(i + 1 < current.length ? hashPair(current[i], current[i + 1]) : current[i]);
    }
    levels.push(next);
    current = next;
  }
  return levels;
}

export function merkleRoot(leaves) {
  const levels = buildTree(leaves);
  return levels[levels.length - 1][0];
}

/** 取某个叶子的 proof（同位兄弟依次上提） */
export function merkleProof(leaves, index) {
  const levels = buildTree(leaves);
  const proof = [];
  let idx = index;
  for (let depth = 0; depth < levels.length - 1; depth++) {
    const level = levels[depth];
    const sibling = idx % 2 === 0 ? idx + 1 : idx - 1;
    if (sibling < level.length) proof.push(level[sibling]);
    idx = Math.floor(idx / 2);
  }
  return proof;
}

/** 组装一份完整的 epoch 领取表 */
export function buildClaimSet(epoch, claims) {
  const leaves = claims.map((c) => leafHash(c.account, epoch, c.amount));
  const root = merkleRoot(leaves);
  const total = claims.reduce((sum, c) => sum + BigInt(c.amount), 0n);
  return {
    epoch: Number(epoch),
    root,
    total: total.toString(),
    leaves: claims.map((c, i) => ({
      index: i,
      account: c.account,
      amount: BigInt(c.amount).toString(),
      proof: merkleProof(leaves, i),
    })),
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

function parseArgs(argv) {
  const args = { epoch: 1, claims: null, file: null, out: null, demo: false };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--epoch') { args.epoch = Number(value); i++; }
    else if (key === '--claims') { args.claims = value; i++; }
    else if (key === '--file') { args.file = value; i++; }
    else if (key === '--out') { args.out = value; i++; }
    else if (key === '--demo') args.demo = true;
  }
  return args;
}

/** 本地演示用：anvil 默认的 3 个账户（私钥公开，绝不能用于真实资金） */
const ANVIL_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
];

function demoClaims() {
  return ANVIL_KEYS.map((pk, i) => ({
    account: walletFromPrivateKey(pk).address,
    amount: (BigInt(i + 1) * 10n ** 18n).toString(), // 1 / 2 / 3 个代币
  }));
}

if (isMain) {
  const args = parseArgs(process.argv.slice(2));

  let claims;
  if (args.demo) {
    claims = demoClaims();
  } else if (args.file) {
    claims = JSON.parse(readFileSync(args.file, 'utf8')).claims;
  } else if (args.claims) {
    claims = args.claims.split(',').map((pair) => {
      const [account, amount] = pair.split('=');
      if (!account || !amount) throw new Error(`无法解析 claim: ${pair}`);
      return { account: account.trim(), amount: amount.trim() };
    });
  } else {
    console.error('用法: node merkle.mjs --epoch 1 --claims 0xabc=1000,0xdef=2000');
    console.error('      node merkle.mjs --epoch 1 --demo');
    process.exit(1);
  }

  const set = buildClaimSet(args.epoch, claims);
  const json = JSON.stringify(set, null, 2);

  if (args.out) {
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(args.out, json + '\n');
    console.log(`✓ 已写入 ${args.out}`);
    console.log(`  epoch=${set.epoch} root=${set.root}`);
    console.log(`  accounts=${set.leaves.length} total=${set.total}`);
  } else {
    console.log(json);
  }
}
