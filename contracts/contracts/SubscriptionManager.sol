// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FeederFundToken} from "./FeederFundToken.sol";
import {NAVOracle} from "./NAVOracle.sol";
import {KYCRegistry} from "./KYCRegistry.sol";
import {Treasury} from "./Treasury.sol";

/// @title SubscriptionManager
/// @notice Accepts USDC subscriptions and mints fund tokens at the current NAV.
/// @dev USDC has 6 decimals, the token has 18 decimals, NAV has 18 decimals.
///      tokensOut = usdcIn * 1e12 * 1e18 / nav
///                = usdcIn * 1e30 / nav
contract SubscriptionManager is Ownable {
    using SafeERC20 for IERC20;

    uint256 private constant USDC_TO_18 = 1e12; // 6 → 18 decimal scaling

    IERC20 public immutable usdc;
    FeederFundToken public immutable token;
    NAVOracle public immutable oracle;
    KYCRegistry public immutable kycRegistry;
    Treasury public immutable treasury;

    bool public paused;
    uint256 public minSubscription; // in USDC raw units (6 decimals)

    event Subscribed(
        address indexed subscriber,
        uint256 usdcIn,
        uint256 tokensOut,
        uint256 navAtSubscription
    );
    event PausedSet(bool paused);
    event MinSubscriptionSet(uint256 newMin);

    error Paused();
    error NotKycd(address account);
    error BelowMinSubscription(uint256 amount, uint256 min);
    error ZeroAmount();

    constructor(
        address initialOwner,
        IERC20 usdc_,
        FeederFundToken token_,
        NAVOracle oracle_,
        KYCRegistry kycRegistry_,
        Treasury treasury_,
        uint256 minSubscription_
    ) Ownable(initialOwner) {
        usdc = usdc_;
        token = token_;
        oracle = oracle_;
        kycRegistry = kycRegistry_;
        treasury = treasury_;
        minSubscription = minSubscription_;
    }

    /// @notice Subscribe to the fund. Caller must have approved USDC and be on the KYC allowlist.
    /// @param usdcAmount USDC to subscribe, in USDC's 6-decimal raw units.
    /// @return tokensOut Tokens minted to caller (18-decimal raw units).
    function subscribe(uint256 usdcAmount) external returns (uint256 tokensOut) {
        if (paused) revert Paused();
        if (usdcAmount == 0) revert ZeroAmount();
        if (usdcAmount < minSubscription) revert BelowMinSubscription(usdcAmount, minSubscription);
        if (!kycRegistry.isKycd(msg.sender)) revert NotKycd(msg.sender);

        uint256 nav = oracle.getNav();
        tokensOut = (usdcAmount * USDC_TO_18 * 1e18) / nav;

        // Pull USDC from subscriber straight into the treasury.
        usdc.safeTransferFrom(msg.sender, address(treasury), usdcAmount);

        // Mint tokens to subscriber.
        token.mint(msg.sender, tokensOut);

        emit Subscribed(msg.sender, usdcAmount, tokensOut, nav);
    }

    /// @notice Preview tokens received for a given USDC amount at the current NAV.
    function previewSubscribe(uint256 usdcAmount) external view returns (uint256) {
        uint256 nav = oracle.getNav();
        return (usdcAmount * USDC_TO_18 * 1e18) / nav;
    }

    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit PausedSet(paused_);
    }

    function setMinSubscription(uint256 newMin) external onlyOwner {
        minSubscription = newMin;
        emit MinSubscriptionSet(newMin);
    }
}
