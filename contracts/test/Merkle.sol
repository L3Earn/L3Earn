// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Merkle
 * @notice 测试与脚本共用的 Merkle 工具。
 *
 * 约定（必须与 PointsClaim.leafHash 及 scripts/merkle.mjs 完全一致）：
 *   leaf = keccak256(bytes.concat(keccak256(abi.encode(account, epoch, amount))))
 *   pair = keccak256(bytes.concat(min(a,b), max(a,b)))   // 排序后哈希，proof 顺序无关
 */
library Merkle {
    function hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a <= b
            ? keccak256(bytes.concat(a, b))
            : keccak256(bytes.concat(b, a));
    }

    /// @notice 由叶子数组构建 root（长度不必是 2 的幂：奇数时最后一个与自身配对）
    function root(bytes32[] memory leaves) internal pure returns (bytes32) {
        require(leaves.length > 0, "empty leaves");
        bytes32[] memory level = leaves;
        while (level.length > 1) {
            uint256 nextLength = (level.length + 1) / 2;
            bytes32[] memory next = new bytes32[](nextLength);
            for (uint256 i = 0; i < nextLength; i++) {
                uint256 left = i * 2;
                uint256 right = left + 1;
                if (right < level.length) {
                    next[i] = hashPair(level[left], level[right]);
                } else {
                    next[i] = level[left];
                }
            }
            level = next;
        }
        return level[0];
    }

    /// @notice 生成某个叶子的 proof（与上面对「奇数长度」的处理保持一致）
    function proof(
        bytes32[] memory leaves,
        uint256 index
    ) internal pure returns (bytes32[] memory) {
        require(index < leaves.length, "index out of range");
        bytes32[] memory current = leaves;
        uint256 currentIndex = index;
        bytes32[] memory tmp = new bytes32[](16);
        uint256 proofLength = 0;

        while (current.length > 1) {
            uint256 siblingIndex = currentIndex % 2 == 0
                ? currentIndex + 1
                : currentIndex - 1;
            if (siblingIndex < current.length) {
                tmp[proofLength] = current[siblingIndex];
                proofLength++;
            }
            uint256 nextLength = (current.length + 1) / 2;
            bytes32[] memory next = new bytes32[](nextLength);
            for (uint256 i = 0; i < nextLength; i++) {
                uint256 left = i * 2;
                uint256 right = left + 1;
                if (right < current.length) {
                    next[i] = hashPair(current[left], current[right]);
                } else {
                    next[i] = current[left];
                }
            }
            current = next;
            currentIndex = currentIndex / 2;
        }

        bytes32[] memory result = new bytes32[](proofLength);
        for (uint256 i = 0; i < proofLength; i++) result[i] = tmp[i];
        return result;
    }
}
