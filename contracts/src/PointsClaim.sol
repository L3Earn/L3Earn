// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PointsClaim
 * @notice 极简 Merkle 领取合约：每个 epoch 一个 root，用户凭 proof 领取原生币（XPL）。
 *
 * 设计约束（与 docs/DEVELOPMENT.md 的积分模型一致）：
 * - 链下账本权威，链上只做「结算」：root 由后端在 epoch 结束时生成并上链。
 * - 领取由用户自己发交易（gas 自己付），合约不代付、不做重入外部调用。
 * - 每个 epoch 每人只能领一次；旧 epoch 不可再领（root 被替换）。
 *
 * 安全要点：
 * - 叶子用 double-hash（keccak256(keccak256(abi.encode(...)))）防第二原像攻击。
 * - 校验 proof 时用排序哈希对，兼容任意 proof 顺序。
 * - 提现用 call + 检查返回值；先改状态后转账（checks-effects-interactions）。
 * - owner 可暂停，但不可篡改已领取状态。
 *
 * 这不是生产级合约：没有升级机制、没有多签、没有审计。仅供测试与实验。
 */
contract PointsClaim {
    address public owner;
    bool public paused;

    /// 当前有效 epoch；领取必须匹配
    uint256 public currentEpoch;
    /// 当前 epoch 的 Merkle root
    bytes32 public merkleRoot;

    /// epoch => account => 是否已领取
    mapping(uint256 => mapping(address => bool)) public claimed;
    /// 累计已领取数量（wei）
    uint256 public totalClaimed;

    event RootUpdated(uint256 indexed epoch, bytes32 root);
    event Claimed(uint256 indexed epoch, address indexed account, uint256 amount);
    event PausedSet(bool paused);
    event OwnershipTransferred(address indexed from, address indexed to);

    error NotOwner();
    error IsPaused();
    error StaleEpoch();
    error AlreadyClaimed();
    error InvalidProof();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// 合约需要先被充值，才能给用户发币
    receive() external payable {}

    /**
     * @notice 设置新 epoch 的 root。允许同一 epoch 重设（例如发现账本错误后修正）。
     * @dev 只允许向前推进 epoch，防止回滚到旧 epoch 重复领取。
     */
    function setRoot(uint256 epoch, bytes32 root) external onlyOwner {
        if (epoch < currentEpoch) revert StaleEpoch();
        currentEpoch = epoch;
        merkleRoot = root;
        emit RootUpdated(epoch, root);
    }

    function setPaused(bool value) external onlyOwner {
        paused = value;
        emit PausedSet(value);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice 领取本 epoch 的积分。
     * @param epoch  必须等于 currentEpoch
     * @param amount 该用户应得数量（wei），由链下账本决定
     * @param proof  Merkle proof
     */
    function claim(
        uint256 epoch,
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        if (paused) revert IsPaused();
        if (epoch != currentEpoch) revert StaleEpoch();
        if (claimed[epoch][msg.sender]) revert AlreadyClaimed();

        bytes32 leaf = _leaf(msg.sender, epoch, amount);
        if (!_verify(proof, merkleRoot, leaf)) revert InvalidProof();

        // checks-effects-interactions：先落状态，再转账
        claimed[epoch][msg.sender] = true;
        totalClaimed += amount;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Claimed(epoch, msg.sender, amount);
    }

    /// @notice 对外暴露叶子计算：链下生成脚本与测试都以它为准，避免两处实现漂移
    function leafHash(
        address account,
        uint256 epoch,
        uint256 amount
    ) public pure returns (bytes32) {
        return _leaf(account, epoch, amount);
    }

    /// @notice 计算叶子哈希（与链下生成脚本必须完全一致）
    function _leaf(
        address account,
        uint256 epoch,
        uint256 amount
    ) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(account, epoch, amount))));
    }

    /// @notice 标准 Merkle 校验，proof 顺序无关（按大小排序合并）
    function _verify(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 p = proof[i];
            if (computed <= p) {
                computed = keccak256(bytes.concat(computed, p));
            } else {
                computed = keccak256(bytes.concat(p, computed));
            }
        }
        return computed == root;
    }

    /// @notice owner 可撤回未领取的资金（例如换代或终止活动）
    function sweep(address payable to) external onlyOwner {
        require(to != address(0), "zero address");
        (bool ok, ) = to.call{value: address(this).balance}("");
        if (!ok) revert TransferFailed();
    }
}
