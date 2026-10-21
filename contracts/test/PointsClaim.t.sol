// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MiniTest} from "./MiniTest.sol";
import {Merkle} from "./Merkle.sol";
import {PointsClaim} from "../src/PointsClaim.sol";

/**
 * PointsClaim 的行为测试：领取成功 / 重复领取 / 错误 proof / 过期 epoch /
 * 权限 / 暂停 / 资金不足 / sweep。
 *
 * 注意：`vm.prank` 与 `vm.expectRevert` 都只作用于「下一次外部调用」，
 * 因此所有会触发外部调用（leafHash）的辅助函数都必须在 prank 之前求值完毕。
 */
contract PointsClaimTest is MiniTest {
    PointsClaim internal pointsClaim;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA201);
    address payable internal sink = payable(address(0xBEEF));

    uint256 internal constant EPOCH = 1;
    uint256 internal constant FUND = 10 ether;

    function setUp() public {
        pointsClaim = new PointsClaim();
        vm.deal(address(pointsClaim), FUND);
    }

    // ---------------------------------------------------------------------
    // 辅助（全部在 prank 之前调用）
    // ---------------------------------------------------------------------

    function _amounts() internal pure returns (uint256[3] memory) {
        return [uint256(1 ether), 2 ether, 3 ether];
    }

    function _accounts() internal view returns (address[3] memory) {
        return [alice, bob, carol];
    }

    function _leaves() internal view returns (bytes32[] memory leaves) {
        address[3] memory accounts = _accounts();
        uint256[3] memory amounts = _amounts();
        leaves = new bytes32[](3);
        for (uint256 i = 0; i < 3; i++) {
            leaves[i] = pointsClaim.leafHash(accounts[i], EPOCH, amounts[i]);
        }
    }

    function _proofFor(uint256 index) internal view returns (bytes32[] memory) {
        return Merkle.proof(_leaves(), index);
    }

    function _root() internal view returns (bytes32) {
        return Merkle.root(_leaves());
    }

    // ---------------------------------------------------------------------
    // 正常路径
    // ---------------------------------------------------------------------

    function testRootCanBePublished() public {
        bytes32 expected = _root();
        pointsClaim.setRoot(EPOCH, expected);

        assertEq(pointsClaim.currentEpoch(), EPOCH, "epoch");
        assertEq(pointsClaim.merkleRoot(), expected, "root");
    }

    function testEachUserCanClaimOnce() public {
        pointsClaim.setRoot(EPOCH, _root());
        address[3] memory accounts = _accounts();
        uint256[3] memory amounts = _amounts();

        for (uint256 i = 0; i < 3; i++) {
            bytes32[] memory proof = _proofFor(i); // 先算，避免消耗 prank
            vm.prank(accounts[i]);
            pointsClaim.claim(EPOCH, amounts[i], proof);
            assertEq(accounts[i].balance, amounts[i], "user balance");
        }

        assertEq(pointsClaim.totalClaimed(), 6 ether, "totalClaimed");
    }

    // ---------------------------------------------------------------------
    // 失败路径
    // ---------------------------------------------------------------------

    function testDoubleClaimReverts() public {
        pointsClaim.setRoot(EPOCH, _root());
        bytes32[] memory proof = _proofFor(0);

        vm.prank(alice);
        pointsClaim.claim(EPOCH, 1 ether, proof);

        vm.expectRevert(abi.encodeWithSignature("AlreadyClaimed()"));
        vm.prank(alice);
        pointsClaim.claim(EPOCH, 1 ether, proof);
    }

    function testWrongAmountReverts() public {
        pointsClaim.setRoot(EPOCH, _root());
        bytes32[] memory proof = _proofFor(0);

        // alice 实际应领 1 ether，这里谎报 5 ether → leaf 不匹配
        vm.expectRevert(abi.encodeWithSignature("InvalidProof()"));
        vm.prank(alice);
        pointsClaim.claim(EPOCH, 5 ether, proof);
    }

    function testStaleEpochReverts() public {
        pointsClaim.setRoot(EPOCH, _root());
        bytes32[] memory proof = _proofFor(0);

        vm.expectRevert(abi.encodeWithSignature("StaleEpoch()"));
        vm.prank(alice);
        pointsClaim.claim(EPOCH + 1, 1 ether, proof);
    }

    function testCannotRollBackEpoch() public {
        bytes32 rootHash = _root();
        pointsClaim.setRoot(2, rootHash);

        vm.expectRevert(abi.encodeWithSignature("StaleEpoch()"));
        pointsClaim.setRoot(1, rootHash);
    }

    function testOnlyOwnerCanPublishRoot() public {
        vm.expectRevert(abi.encodeWithSignature("NotOwner()"));
        vm.prank(alice);
        pointsClaim.setRoot(EPOCH, bytes32(0));
    }

    function testPausedBlocksClaim() public {
        pointsClaim.setRoot(EPOCH, _root());
        pointsClaim.setPaused(true);
        bytes32[] memory proof = _proofFor(0);

        vm.expectRevert(abi.encodeWithSignature("IsPaused()"));
        vm.prank(alice);
        pointsClaim.claim(EPOCH, 1 ether, proof);
    }

    function testUnderfundedClaimReverts() public {
        pointsClaim.setRoot(EPOCH, _root());
        bytes32[] memory proof = _proofFor(0);
        // 抽干合约余额，模拟「链上资金没到位」
        vm.deal(address(pointsClaim), 0);

        vm.expectRevert(abi.encodeWithSignature("TransferFailed()"));
        vm.prank(alice);
        pointsClaim.claim(EPOCH, 1 ether, proof);
    }

    // ---------------------------------------------------------------------
    // 运维操作
    // ---------------------------------------------------------------------

    function testSweepReturnsRemainingBalance() public {
        assertEq(address(pointsClaim).balance, FUND, "precondition");
        pointsClaim.sweep(sink);
        assertEq(address(pointsClaim).balance, 0, "contract emptied");
        assertEq(sink.balance, FUND, "sink received");
    }

    function testOnlyOwnerCanSweep() public {
        vm.expectRevert(abi.encodeWithSignature("NotOwner()"));
        vm.prank(alice);
        pointsClaim.sweep(payable(alice));
    }

    function testOnlyOwnerCanPause() public {
        vm.expectRevert(abi.encodeWithSignature("NotOwner()"));
        vm.prank(alice);
        pointsClaim.setPaused(true);
    }

    function testOnlyOwnerCanTransferOwnership() public {
        vm.expectRevert(abi.encodeWithSignature("NotOwner()"));
        vm.prank(alice);
        pointsClaim.transferOwnership(alice);

        pointsClaim.transferOwnership(bob);
        assertEq(pointsClaim.owner(), bob, "owner transferred");
    }

    // ---------------------------------------------------------------------
    // proof 完整性
    // ---------------------------------------------------------------------

    function testProofValidForEveryLeaf() public view {
        bytes32 rootHash = _root();
        bytes32[] memory leaves = _leaves();
        for (uint256 i = 0; i < 3; i++) {
            assertTrue(
                _verify(rootHash, _proofFor(i), leaves[i]),
                "proof must verify for every leaf"
            );
        }
    }

    function _verify(
        bytes32 rootHash,
        bytes32[] memory proof,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            computed = Merkle.hashPair(computed, proof[i]);
        }
        return computed == rootHash;
    }
}
