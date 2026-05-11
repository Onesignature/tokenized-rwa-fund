// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title NAVOracle
/// @notice Stores the current NAV per token. Read by SubscriptionManager and RedemptionManager.
/// @dev NAV is denominated in USDC with 18 decimals of precision (NAV_DECIMALS).
///      Example: NAV of $1.75 → store as 1.75e18 (1_750_000_000_000_000_000).
///      A sanity bound caps each update at ±MAX_UPDATE_BPS of the current value.
contract NAVOracle is Ownable {
    uint256 public constant NAV_DECIMALS = 18;
    uint256 public constant MAX_UPDATE_BPS = 5000; // 50% — sanity bound per update
    uint256 public constant BPS_DENOM = 10_000;

    uint256 private _nav;
    address public updater;
    uint256 public lastUpdatedAt;

    event NavUpdated(uint256 oldNav, uint256 newNav, address indexed updater, uint256 timestamp);
    event UpdaterChanged(address indexed oldUpdater, address indexed newUpdater);

    error NotUpdater();
    error InvalidNav();
    error UpdateExceedsSanityBound(uint256 oldNav, uint256 newNav, uint256 maxBps);

    constructor(address initialOwner, address initialUpdater, uint256 initialNav) Ownable(initialOwner) {
        if (initialNav == 0) revert InvalidNav();
        updater = initialUpdater;
        _nav = initialNav;
        lastUpdatedAt = block.timestamp;
        emit NavUpdated(0, initialNav, initialUpdater, block.timestamp);
        emit UpdaterChanged(address(0), initialUpdater);
    }

    modifier onlyUpdater() {
        if (msg.sender != updater) revert NotUpdater();
        _;
    }

    /// @notice The current NAV per token, scaled to NAV_DECIMALS.
    function getNav() external view returns (uint256) {
        return _nav;
    }

    /// @notice Update the NAV. Reverts if the change exceeds the sanity bound.
    /// @dev In production, a separate emergency path with timelock + multisig is needed
    ///      for updates that exceed the bound (e.g. realized exit at a much higher price).
    function setNav(uint256 newNav) external onlyUpdater {
        if (newNav == 0) revert InvalidNav();
        uint256 oldNav = _nav;

        // Sanity bound: |newNav - oldNav| / oldNav <= MAX_UPDATE_BPS / BPS_DENOM
        uint256 diff = newNav > oldNav ? newNav - oldNav : oldNav - newNav;
        uint256 maxDiff = (oldNav * MAX_UPDATE_BPS) / BPS_DENOM;
        if (diff > maxDiff) revert UpdateExceedsSanityBound(oldNav, newNav, MAX_UPDATE_BPS);

        _nav = newNav;
        lastUpdatedAt = block.timestamp;
        emit NavUpdated(oldNav, newNav, msg.sender, block.timestamp);
    }

    function setUpdater(address newUpdater) external onlyOwner {
        emit UpdaterChanged(updater, newUpdater);
        updater = newUpdater;
    }
}
