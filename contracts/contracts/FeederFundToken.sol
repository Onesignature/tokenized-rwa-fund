// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {KYCRegistry} from "./KYCRegistry.sol";

/// @title FeederFundToken
/// @notice The tokenized feeder fund unit. Transfers gated by KYC; mint/burn gated by authorized minters.
/// @dev Token has 18 decimals. NAV is denominated in USDC with 18-decimal precision (see NAVOracle).
contract FeederFundToken is ERC20, Ownable {
    KYCRegistry public immutable kycRegistry;
    mapping(address => bool) public isMinter;

    event MinterSet(address indexed account, bool isMinter);

    error NotMinter();
    error SenderNotKycd(address account);
    error ReceiverNotKycd(address account);

    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner,
        KYCRegistry kycRegistry_
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        kycRegistry = kycRegistry_;
    }

    function setMinter(address account, bool minter) external onlyOwner {
        isMinter[account] = minter;
        emit MinterSet(account, minter);
    }

    /// @notice Mint tokens to a KYC'd address. Restricted to authorized minters (e.g. SubscriptionManager).
    function mint(address to, uint256 amount) external {
        if (!isMinter[msg.sender]) revert NotMinter();
        _mint(to, amount);
    }

    /// @notice Burn tokens from a holder. Restricted to authorized minters (e.g. RedemptionManager).
    /// @dev Burning does NOT require the holder to be KYC'd, so investors whose KYC has lapsed
    ///      can still exit through redemption.
    function burnFrom(address from, uint256 amount) external {
        if (!isMinter[msg.sender]) revert NotMinter();
        _burn(from, amount);
    }

    /// @dev Transfer hook. Enforces KYC on both sides for regular transfers and on the
    ///      receiver for mints. Burns are exempt so investors can always redeem.
    function _update(address from, address to, uint256 value) internal override {
        bool isMint = from == address(0);
        bool isBurn = to == address(0);

        if (!isMint && !isBurn) {
            if (!kycRegistry.isKycd(from)) revert SenderNotKycd(from);
            if (!kycRegistry.isKycd(to)) revert ReceiverNotKycd(to);
        } else if (isMint) {
            if (!kycRegistry.isKycd(to)) revert ReceiverNotKycd(to);
        }

        super._update(from, to, value);
    }
}
