// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FeederFundToken} from "./FeederFundToken.sol";
import {NAVOracle} from "./NAVOracle.sol";
import {Treasury} from "./Treasury.sol";

/// @title RedemptionManager
/// @notice Burns tokens and pays USDC at the current NAV.
/// @dev Supports Path A (discountBps = 0) and Path B (discountBps > 0, e.g. 500 = 5% discount).
///      Discount represents the market-maker-funded buyback at exit when the Source Fund
///      keeps the underlying position rather than selling.
contract RedemptionManager is Ownable {
    uint256 private constant USDC_TO_18 = 1e12; // 6 → 18 decimal scaling
    uint256 private constant BPS_DENOM = 10_000;
    uint256 public constant MAX_DISCOUNT_BPS = 2_000; // 20% — safety cap

    IERC20 public immutable usdc;
    FeederFundToken public immutable token;
    NAVOracle public immutable oracle;
    Treasury public immutable treasury;

    bool public paused;
    uint256 public discountBps; // 0 = Path A (NAV redemption), >0 = Path B (NAV - discount)

    event Redeemed(
        address indexed redeemer,
        uint256 tokensIn,
        uint256 usdcOut,
        uint256 navAtRedemption,
        uint256 discountBpsAtRedemption
    );
    event PausedSet(bool paused);
    event DiscountBpsSet(uint256 newBps);

    error Paused();
    error ZeroAmount();
    error DiscountTooHigh(uint256 requested, uint256 max);

    constructor(
        address initialOwner,
        IERC20 usdc_,
        FeederFundToken token_,
        NAVOracle oracle_,
        Treasury treasury_,
        uint256 initialDiscountBps
    ) Ownable(initialOwner) {
        if (initialDiscountBps > MAX_DISCOUNT_BPS) {
            revert DiscountTooHigh(initialDiscountBps, MAX_DISCOUNT_BPS);
        }
        usdc = usdc_;
        token = token_;
        oracle = oracle_;
        treasury = treasury_;
        discountBps = initialDiscountBps;
    }

    /// @notice Redeem tokens for USDC at the current NAV (minus discount, if set).
    /// @param tokenAmount Tokens to redeem (18-decimal raw units).
    /// @return usdcOut USDC paid to caller (6-decimal raw units).
    function redeem(uint256 tokenAmount) external returns (uint256 usdcOut) {
        if (paused) revert Paused();
        if (tokenAmount == 0) revert ZeroAmount();

        uint256 nav = oracle.getNav();
        uint256 discount = discountBps;

        // usdcOut_18 = tokenAmount * nav / 1e18
        // usdcOut_18 = usdcOut_18 * (BPS_DENOM - discount) / BPS_DENOM
        // usdcOut_6  = usdcOut_18 / USDC_TO_18
        uint256 usdc18 = (tokenAmount * nav) / 1e18;
        if (discount > 0) {
            usdc18 = (usdc18 * (BPS_DENOM - discount)) / BPS_DENOM;
        }
        usdcOut = usdc18 / USDC_TO_18;

        // Burn tokens from redeemer (does not require KYC on the from address).
        token.burnFrom(msg.sender, tokenAmount);

        // Pay USDC out of the treasury.
        treasury.pay(msg.sender, usdcOut);

        emit Redeemed(msg.sender, tokenAmount, usdcOut, nav, discount);
    }

    /// @notice Preview USDC received for redeeming a given token amount at the current NAV.
    function previewRedeem(uint256 tokenAmount) external view returns (uint256) {
        uint256 nav = oracle.getNav();
        uint256 usdc18 = (tokenAmount * nav) / 1e18;
        if (discountBps > 0) {
            usdc18 = (usdc18 * (BPS_DENOM - discountBps)) / BPS_DENOM;
        }
        return usdc18 / USDC_TO_18;
    }

    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit PausedSet(paused_);
    }

    /// @notice Set the redemption discount in basis points (1 bp = 0.01%).
    /// @dev Used to switch between Path A (0) and Path B (e.g. 500 = 5%).
    function setDiscountBps(uint256 newBps) external onlyOwner {
        if (newBps > MAX_DISCOUNT_BPS) revert DiscountTooHigh(newBps, MAX_DISCOUNT_BPS);
        discountBps = newBps;
        emit DiscountBpsSet(newBps);
    }
}
