// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MiniTest} from "./MiniTest.sol";
import {CredentialSBT} from "../src/CredentialSBT.sol";

/**
 * CredentialSBT 的行为测试：铸造权限、灵魂绑定（不可转移）、元数据读取。
 */
contract CredentialSBTTest is MiniTest {
    CredentialSBT internal sbt;

    address internal learner = address(0x1EA9);
    address internal issuer = address(0x1550E);
    address internal attacker = address(0xBAD);

    function setUp() public {
        sbt = new CredentialSBT();
        sbt.setMinter(issuer, true);
    }

    function testOwnerCanMint() public {
        uint256 tokenId = sbt.mint(learner, "ar://course-1");
        assertEq(tokenId, 1, "first token id");
        assertEq(sbt.ownerOf(1), learner, "owner");
        assertEq(sbt.balanceOf(learner), 1, "balance");
        assertEq(sbt.tokenURI(1), "ar://course-1", "token uri");
        assertEq(sbt.totalSupply(), 1, "total supply");
    }

    function testAuthorizedMinterCanMint() public {
        vm.prank(issuer);
        sbt.mint(learner, "ar://course-2");
        assertEq(sbt.balanceOf(learner), 1, "minted by minter");
    }

    function testNonMinterCannotMint() public {
        vm.expectRevert(abi.encodeWithSignature("NotMinter()"));
        vm.prank(attacker);
        sbt.mint(attacker, "ar://fake");
    }

    function testMintToZeroAddressReverts() public {
        vm.expectRevert(bytes("zero address"));
        sbt.mint(address(0), "ar://course-1");
    }

    function testTransferIsRejected() public {
        sbt.mint(learner, "ar://course-1");

        vm.expectRevert(abi.encodeWithSignature("Soulbound()"));
        vm.prank(learner);
        sbt.transferFrom(learner, attacker, 1);

        vm.expectRevert(abi.encodeWithSignature("Soulbound()"));
        vm.prank(learner);
        sbt.safeTransferFrom(learner, attacker, 1);
    }

    function testApprovalsAreRejected() public {
        sbt.mint(learner, "ar://course-1");

        vm.expectRevert(abi.encodeWithSignature("Soulbound()"));
        vm.prank(learner);
        sbt.approve(attacker, 1);

        vm.expectRevert(abi.encodeWithSignature("Soulbound()"));
        vm.prank(learner);
        sbt.setApprovalForAll(attacker, true);

        assertEq(sbt.getApproved(1), address(0), "no approval");
        assertFalse(sbt.isApprovedForAll(learner, attacker), "no operator");
    }

    function testTokenURIRevertsForUnknownToken() public {
        vm.expectRevert(abi.encodeWithSignature("NonexistentToken()"));
        sbt.tokenURI(999);
    }

    function testSupportsERC721Interface() public view {
        assertTrue(sbt.supportsInterface(0x80ac58cd), "erc721");
        assertTrue(sbt.supportsInterface(0x01ffc9a7), "erc165");
        assertFalse(sbt.supportsInterface(0xffffffff), "invalid");
    }

    function testOwnerCanAddAndRemoveMinter() public {
        sbt.setMinter(issuer, false);

        vm.expectRevert(abi.encodeWithSignature("NotMinter()"));
        vm.prank(issuer);
        sbt.mint(learner, "ar://course-3");
    }

    function testOnlyOwnerCanSetMinter() public {
        vm.expectRevert(abi.encodeWithSignature("NotOwner()"));
        vm.prank(attacker);
        sbt.setMinter(attacker, true);
    }
}
