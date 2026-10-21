#!/usr/bin/env bash
# 本地端到端验证：anvil 起链 → 部署 → 发布 epoch root → 用户领取 → 铸造 SBT → 验证灵魂绑定。
#
# 零成本、可重复执行：每次都在全新的 anvil 链上跑。
# 用途：在碰真实链之前，证明「合约 + 链下 Merkle 表 + 领取流程」三者完全一致。
#
# 用法： bash contracts/scripts/e2e-local.sh
set -euo pipefail

export PATH="${HOME}/.foundry/bin:${PATH}"
ROOT="$(cd "$(dirname "${0}")/.." && pwd)"
cd "${ROOT}"   # forge create 的相对路径以 contracts/ 为根
RPC="http://127.0.0.1:8545"
PORT=8545

# anvil 默认账户（公开私钥，仅本地用）
K0=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # owner/deployer
K1=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d # 用户 A
OWNER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
USER=0x70997970C51812dc3A010C7d01b50e0d17dc79C8

say() { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()  { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }

cleanup() {
  if [[ -n "${ANVIL_PID:-}" ]] && kill -0 "${ANVIL_PID}" 2>/dev/null; then
    kill "${ANVIL_PID}" 2>/dev/null || true
    wait "${ANVIL_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
say "1/7 启动 anvil（端口 ${PORT}）"
anvil --port "${PORT}" --silent --gas-limit 30000000 >/dev/null 2>&1 &
ANVIL_PID=$!

for _ in $(seq 1 40); do
  if cast block-number --rpc-url "${RPC}" >/dev/null 2>&1; then break; fi
  sleep 0.25
done
cast block-number --rpc-url "${RPC}" >/dev/null
ok "anvil 就绪（chainId $(cast chain-id --rpc-url "${RPC}")）"

# ---------------------------------------------------------------------------
say "2/7 部署合约"
CLAIM=$(forge create src/PointsClaim.sol:PointsClaim \
  --rpc-url "${RPC}" --private-key "${K0}" --broadcast --json | python3 -c 'import json,sys;print(json.load(sys.stdin)["deployedTo"])')
SBT=$(forge create src/CredentialSBT.sol:CredentialSBT \
  --rpc-url "${RPC}" --private-key "${K0}" --broadcast --json | python3 -c 'import json,sys;print(json.load(sys.stdin)["deployedTo"])')
ok "PointsClaim = ${CLAIM}"
ok "CredentialSBT = ${SBT}"

# ---------------------------------------------------------------------------
say "3/7 给领取合约注资（模拟链下账本已备好资金）"
cast send "${CLAIM}" --value 10ether --private-key "${K0}" --rpc-url "${RPC}" >/dev/null
ok "合约余额 = $(cast balance "${CLAIM}" --rpc-url "${RPC}") wei"

# ---------------------------------------------------------------------------
say "4/7 生成链下 Merkle 领取表（epoch 1，3 个账户）"
CLAIMS=$(node "${ROOT}/scripts/merkle.mjs" --epoch 1 --demo)
ROOT_HASH=$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['root'])" "${CLAIMS}")
TOTAL=$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['total'])" "${CLAIMS}")
ok "root   = ${ROOT_HASH}"
ok "total  = ${TOTAL} wei（3 个账户 1+2+3）"

# ---------------------------------------------------------------------------
say "5/7 发布 epoch root"
cast send "${CLAIM}" "setRoot(uint256,bytes32)" 1 "${ROOT_HASH}" \
  --private-key "${K0}" --rpc-url "${RPC}" >/dev/null
ok "currentEpoch = $(cast call "${CLAIM}" 'currentEpoch()(uint256)' --rpc-url "${RPC}")"

# ---------------------------------------------------------------------------
say "6/7 用户 A 领取 2 ether（凭 proof）"
read -r AMOUNT PROOF < <(python3 - "${CLAIMS}" 1 <<'PY'
import json, sys
claims = json.loads(sys.argv[1])
leaf = claims["leaves"][int(sys.argv[2])]
print(leaf["amount"], "[" + ",".join(leaf["proof"]) + "]")
PY
)
BEFORE_USER=$(cast balance "${USER}" --rpc-url "${RPC}")
BEFORE_POOL=$(cast balance "${CLAIM}" --rpc-url "${RPC}")
cast send "${CLAIM}" "claim(uint256,uint256,bytes32[])" 1 "${AMOUNT}" "${PROOF}" \
  --private-key "${K1}" --rpc-url "${RPC}" >/dev/null
AFTER_USER=$(cast balance "${USER}" --rpc-url "${RPC}")
AFTER_POOL=$(cast balance "${CLAIM}" --rpc-url "${RPC}")
# 用户余额要扣掉自己付的 gas，所以用「合约池减少量」校验发放金额
PAID_OUT=$((BEFORE_POOL - AFTER_POOL))
ok "合约池支出 = ${PAID_OUT} wei（期望 ${AMOUNT}）"
[[ "${PAID_OUT}" == "${AMOUNT}" ]] || { echo "发放金额不符"; exit 1; }
[[ "${AFTER_USER}" -gt "${BEFORE_USER}" ]] || { echo "用户余额没有增加"; exit 1; }
ok "用户余额 +$((AFTER_USER - BEFORE_USER)) wei（已扣除 gas）"
ok "claimed 标记 = $(cast call "${CLAIM}" 'claimed(uint256,address)(bool)' 1 "${USER}" --rpc-url "${RPC}")"

# 重复领取必须失败
if cast send "${CLAIM}" "claim(uint256,uint256,bytes32[])" 1 "${AMOUNT}" "${PROOF}" \
  --private-key "${K1}" --rpc-url "${RPC}" >/dev/null 2>&1; then
  echo "重复领取竟然成功了"; exit 1
fi
ok "重复领取被拒绝（AlreadyClaimed）"

# ---------------------------------------------------------------------------
say "7/7 铸造凭证并验证灵魂绑定"
cast send "${SBT}" "mint(address,string)" "${USER}" "ar://demo-course-1" \
  --private-key "${K0}" --rpc-url "${RPC}" >/dev/null
TOKEN_OWNER=$(cast call "${SBT}" 'ownerOf(uint256)(address)' 1 --rpc-url "${RPC}")
ok "tokenId 1 的持有者 = ${TOKEN_OWNER}"
[[ "${TOKEN_OWNER,,}" == "${USER,,}" ]] || { echo "SBT 持有者不符"; exit 1; }
ok "tokenURI = $(cast call "${SBT}" 'tokenURI(uint256)(string)' 1 --rpc-url "${RPC}")"

if cast send "${SBT}" "transferFrom(address,address,uint256)" "${USER}" "${OWNER}" 1 \
  --private-key "${K1}" --rpc-url "${RPC}" >/dev/null 2>&1; then
  echo "SBT 竟然可转移"; exit 1
fi
ok "SBT 不可转移（Soulbound）"

printf '\n\033[1;32m全部通过\033[0m：部署 → 发布 root → 凭 proof 领取 → 拒绝重复领取 → 凭证不可转移。\n'
printf '合约地址（本地链，重启即失效）：PointsClaim=%s CredentialSBT=%s\n\n' "${CLAIM}" "${SBT}"
