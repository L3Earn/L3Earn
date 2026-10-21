# contracts/ — 积分结算与凭证

链上只做两件事：**按 epoch 结算积分**、**颁发不可转移凭证**。
账本的权威在链下（后端），链上只保存 Merkle root 与领取状态。

```
src/
  PointsClaim.sol     Merkle 领取：每个 epoch 一个 root，用户凭 proof 领原生币
  CredentialSBT.sol   灵魂绑定凭证：通过测验后 mint，不可转移
test/
  MiniTest.sol        最小 cheatcode 垫片（不依赖 forge-std）
  Merkle.sol          与链下脚本一致的 Merkle 实现
  PointsClaim.t.sol   14 个用例
  CredentialSBT.t.sol 10 个用例
scripts/
  gen-wallet.mjs      零依赖生成一次性测试钱包（手写 keccak256）
  merkle.mjs          生成 epoch 领取表（root + 每个账户的 proof）
  e2e-local.sh        本地 anvil 全流程（部署→发布 root→领取→铸造→验证不可转移）
  bsc-testnet-e2e.sh  BSC 测试网（97）同一套全流程
```

## 设计要点

| 决策 | 原因 |
|---|---|
| 零外部依赖（不引 OpenZeppelin / forge-std） | `git clone` 后直接 `forge test`，没有 submodule 与包管理器 |
| 叶子 = `keccak256(keccak256(abi.encode(account, epoch, amount)))` | 双哈希防第二原像；`epoch` 入叶防止跨轮次重放 |
| 排序哈希对 | proof 与顺序无关；链下生成更简单 |
| epoch 只能前进（`epoch < currentEpoch` 拒绝） | 防止回滚到旧 root 重复领取 |
| 先改状态再转账（CEI） | 防重入 |
| 领取由用户自己发交易 | 平台不代付 gas，也不托管资金流 |
| SBT 只 mint、转移一律 revert | 凭证代表"已完成"，不应可转让 |

## 常用命令

```bash
# 合约测试（零依赖，24 个用例）
forge test -vv

# 本地端到端（自动起 anvil，跑完自动清理）
bash contracts/scripts/e2e-local.sh

# 生成一次性测试钱包（写入 contracts/.env.local，已 gitignore）
node contracts/scripts/gen-wallet.mjs

# BSC 测试网端到端（需要地址里有 tBNB）
bash contracts/scripts/bsc-testnet-e2e.sh
```

## 领取表的生成

```bash
node contracts/scripts/merkle.mjs --epoch 1 --demo
node contracts/scripts/merkle.mjs --epoch 1 \
     --claims 0xAbC...=1000000000000000000,0xDef...=2000000000000000000
node contracts/scripts/merkle.mjs --epoch 1 --file claims.json --out out/epoch-1.json
```

输出 `{ epoch, root, total, leaves[{account, amount, proof}] }`：
- `root` → `PointsClaim.setRoot(epoch, root)`
- 每个用户的 `proof` → 前端/后端拼进 `claim(epoch, amount, proof)`

## 还没做（生产前）

- 无升级机制、无多签、无审计；owner 是部署私钥
- `CredentialSBT` 没有版税/课程 ID 去重，只有 `tokenURI`
- 领取额度上限未做（依赖链下账本保证 `amount` 总和 ≤ 合约余额）
- 未接入 KYC/合规门禁，也没有跨链
