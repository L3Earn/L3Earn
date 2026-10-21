#!/usr/bin/env bash
# BSC 测试网（chainId 97）端到端：部署 → 发布 root → 领取 → 铸造 SBT → 验证灵魂绑定。
#
# 前置：
#   1) node contracts/scripts/gen-wallet.mjs        # 生成一次性测试钱包
#   2) 给该地址领测试网 tBNB（见脚本输出或 README）
#
# 用法： bash contracts/scripts/bsc-testnet-e2e.sh
set -euo pipefail

export PATH="${HOME}/.foundry/bin:${PATH}"
ROOT="$(cd "$(dirname "${0}")/.." && pwd)"
cd "${ROOT}"

ENV_FILE="${ROOT}/.env.local"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "缺少 ${ENV_FILE}；先运行：node contracts/scripts/gen-wallet.mjs"
  exit 1
fi
# shellcheck disable=SC1090
set -a; source "${ENV_FILE}"; set +a

RPC="${BSC_TESTNET_RPC:-https://data-seed-prebsc-1-s1.binance.org:8545}"
CHAIN_ID_EXPECTED=97
MIN_BALANCE=5000000000000000 # 0.005 tBNB：足够部署 + 领取 + 铸造

say() { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()  { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }
warn(){ printf '  \033[1;33m!\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
say "0/7 检查网络与余额"
CHAIN_ID=$(cast chain-id --rpc-url "${RPC}")
[[ "${CHAIN_ID}" == "${CHAIN_ID_EXPECTED}" ]] || { echo "RPC 不是 BSC 测试网（chainId=${CHAIN_ID}）"; exit 1; }
ok "RPC 正常，chainId=${CHAIN_ID}"

BALANCE=$(cast balance "${DEPLOYER_ADDRESS}" --rpc-url "${RPC}")
ok "部署地址 ${DEPLOYER_ADDRESS} 余额 = ${BALANCE} wei"
if (( BALANCE < MIN_BALANCE )); then
  warn "余额不足（需要 ≥ ${MIN_BALANCE} wei ≈ 0.005 tBNB）"
  cat <<EOF

请先给这个地址领测试网 tBNB（任选其一）：
  • 官方 faucet：https://www.bnbchain.org/en/testnet-faucet
  • QuickNode ：https://faucet.quicknode.com/binance-smart-chain/bnb-testnet
  • Chainstack：https://faucet.chainstack.com/bnb-testnet-faucet

地址：${DEPLOYER_ADDRESS}

领到后重新执行本脚本即可。
EOF
  exit 2
fi

# ---------------------------------------------------------------------------
say "1/7 部署合约"
CLAIM=$(forge create src/PointsClaim.sol:PointsClaim \
  --rpc-url "${RPC}" --private-key "${PRIVATE_KEY}" --broadcast --json \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["deployedTo"])')
SBT=$(forge create src/CredentialSBT.sol:CredentialSBT \
  --rpc-url "${RPC}" --private-key "${PRIVATE_KEY}" --broadcast --json \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["deployedTo"])')
ok "PointsClaim = ${CLAIM}"
ok "CredentialSBT = ${SBT}"
ok "浏览器：https://testnet.bscscan.com/address/${CLAIM}"

# ---------------------------------------------------------------------------
say "2/7 给领取合约注资 0.01 tBNB（模拟已备好的奖励池）"
cast send "${CLAIM}" --value 0.01ether --private-key "${PRIVATE_KEY}" --rpc-url "${RPC}" >/dev/null
ok "合约余额 = $(cast balance "${CLAIM}" --rpc-url "${RPC}") wei"

# ---------------------------------------------------------------------------
say "3/7 生成 Merkle 领取表（epoch 1；用 anvil 公开账户作为演示领奖人）"
CLAIMS=$(node "${ROOT}/scripts/merkle.mjs" --epoch 1 --demo)
ROOT_HASH=$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['root'])" "${CLAIMS}")
ok "root = ${ROOT_HASH}"

# ---------------------------------------------------------------------------
say "4/7 发布 epoch root"
cast send "${CLAIM}" "setRoot(uint256,bytes32)" 1 "${ROOT_HASH}" \
  --private-key "${PRIVATE_KEY}" --rpc-url "${RPC}" >/dev/null
ok "currentEpoch = $(cast call "${CLAIM}" 'currentEpoch()(uint256)' --rpc-url "${RPC}")"

# ---------------------------------------------------------------------------
say "5/7 演示用户领取 2 tBNB（anvil 公开私钥，仅测试网可用）"
USER_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
USER=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
read -r AMOUNT PROOF < <(python3 - "${CLAIMS}" 1 <<'PY'
import json, sys
leaf = json.loads(sys.argv[1])["leaves"][int(sys.argv[2])]
print(leaf["amount"], "[" + ",".join(leaf["proof"]) + "]")
PY
)
BEFORE_POOL=$(cast balance "${CLAIM}" --rpc-url "${RPC}")
cast send "${CLAIM}" "claim(uint256,uint256,bytes32[])" 1 "${AMOUNT}" "${PROOF}" \
  --private-key "${USER_KEY}" --rpc-url "${RPC}" >/dev/null
AFTER_POOL=$(cast balance "${CLAIM}" --rpc-url "${RPC}")
PAID_OUT=$((BEFORE_POOL - AFTER_POOL))
ok "领取金额 = ${PAID_OUT} wei（期望 ${AMOUNT}）"
[[ "${PAID_OUT}" == "${AMOUNT}" ]] || { echo "发放金额不符"; exit 1; }
ok "claimed 标记 = $(cast call "${CLAIM}" 'claimed(uint256,address)(bool)' 1 "${USER}" --rpc-url "${RPC}")"

if cast send "${CLAIM}" "claim(uint256,uint256,bytes32[])" 1 "${AMOUNT}" "${PROOF}" \
  --private-key "${USER_KEY}" --rpc-url "${RPC}" >/dev/null 2>&1; then
  echo "重复领取竟然成功"; exit 1
fi
ok "重复领取被拒绝"

# ---------------------------------------------------------------------------
say "6/7 铸造凭证"
cast send "${SBT}" "mint(address,string)" "${USER}" "ar://bsc-testnet-demo-1" \
  --private-key "${PRIVATE_KEY}" --rpc-url "${RPC}" >/dev/null
OWNER_OF=$(cast call "${SBT}" 'ownerOf(uint256)(address)' 1 --rpc-url "${RPC}")
ok "tokenId 1 持有者 = ${OWNER_OF}"

# ---------------------------------------------------------------------------
say "7/7 验证灵魂绑定"
if cast send "${SBT}" "transferFrom(address,address,uint256)" "${USER}" "${DEPLOYER_ADDRESS}" 1 \
  --private-key "${USER_KEY}" --rpc-url "${RPC}" >/dev/null 2>&1; then
  echo "SBT 竟然可转移"; exit 1
fi
ok "SBT 不可转移"

printf '\n\033[1;32mBSC 测试网全流程通过\033[0m\n'
printf '  PointsClaim  : %s\n' "${CLAIM}"
printf '  CredentialSBT: %s\n' "${SBT}"
printf '  浏览器       : https://testnet.bscscan.com/address/%s\n\n' "${CLAIM}"
