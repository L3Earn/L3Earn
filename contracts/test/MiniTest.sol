// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MiniTest
 * @notice 最小测试垫片：只声明本仓库用到的 cheatcode，避免引入 forge-std 依赖。
 *
 * 为什么不用 forge-std：
 * 这个项目刻意保持「零外部依赖」——合约不引 OpenZeppelin，测试就不引 forge-std，
 * `git clone` 后不需要 submodule / 包管理器即可 `forge test`。
 *
 * 代价：没有 `vm.assert*` 系列，断言用 require + 描述性错误信息。
 */

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function prank(address msgSender) external;
    function startPrank(address msgSender) external;
    function stopPrank() external;
    function expectRevert() external;
    function expectRevert(bytes calldata revertData) external;
    function roll(uint256 newHeight) external;
    function warp(uint256 newTimestamp) external;
    function addr(uint256 privateKey) external returns (address);
}

abstract contract MiniTest {
    /// forge 的 cheatcode 地址常量
    Vm internal constant vm =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertTrue(bool value, string memory reason) internal pure {
        require(value, reason);
    }

    function assertFalse(bool value, string memory reason) internal pure {
        require(!value, reason);
    }

    function assertEq(uint256 a, uint256 b, string memory reason) internal pure {
        require(a == b, reason);
    }

    function assertEq(address a, address b, string memory reason) internal pure {
        require(a == b, reason);
    }

    function assertEq(bytes32 a, bytes32 b, string memory reason) internal pure {
        require(a == b, reason);
    }

    function assertEq(
        string memory a,
        string memory b,
        string memory reason
    ) internal pure {
        require(
            keccak256(bytes(a)) == keccak256(bytes(b)),
            reason
        );
    }
}
