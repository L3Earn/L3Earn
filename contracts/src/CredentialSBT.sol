// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialSBT
 * @notice 极简灵魂绑定凭证（non-transferable ERC-721 子集）。
 *
 * 用途：用户通过课程测验后，mint 一枚不可转移的凭证；metadata 指向链下图谱/内容哈希。
 *
 * 刻意保持最小：
 * - 只实现 ERC-721 的必需读接口与 Transfer 事件语义
 * - 所有转移类调用直接 revert（soulbound）
 * - mint 权限由 owner 控制（后端签名授权或批量 mint）
 *
 * 不是生产级实现（无 Enumerable、无 safeTransferFrom、无 tokenURI 解析）。仅供实验。
 */
contract CredentialSBT {
    string public name = "L3Earn Credential";
    string public symbol = "L3CRED";

    address public owner;
    uint256 public totalSupply;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => string) private _tokenURIs;
    mapping(address => bool) public minters;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Minted(address indexed to, uint256 indexed tokenId, string uri);
    event MinterSet(address indexed minter, bool allowed);
    event OwnershipTransferred(address indexed from, address indexed to);

    error NotOwner();
    error NotMinter();
    error Soulbound();
    error NonexistentToken();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyMinter() {
        if (msg.sender != owner && !minters[msg.sender]) revert NotMinter();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function setMinter(address minter, bool allowed) external onlyOwner {
        minters[minter] = allowed;
        emit MinterSet(minter, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice 铸造一枚不可转移凭证。
     * @param to  接收者
     * @param uri 元数据（建议 ar:// 或 https:// 的 JSON，含课程 ID、成绩、时间）
     */
    function mint(address to, string calldata uri) external onlyMinter returns (uint256 tokenId) {
        require(to != address(0), "zero address");
        tokenId = ++totalSupply;
        ownerOf[tokenId] = to;
        balanceOf[to] += 1;
        _tokenURIs[tokenId] = uri;
        emit Transfer(address(0), to, tokenId);
        emit Minted(to, tokenId, uri);
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (ownerOf[tokenId] == address(0)) revert NonexistentToken();
        return _tokenURIs[tokenId];
    }

    // ---------------------------------------------------------------------
    // Soulbound：以下接口一律拒绝，保持与 ERC-721 的方法签名兼容
    // ---------------------------------------------------------------------

    function approve(address, uint256) external pure {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert Soulbound();
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        // ERC-165 + ERC-721
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd;
    }
}
