// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Treasury
/// @notice Holds the feeder fund's USDC reserves. Subscriptions credit it; redemptions debit it.
/// @dev In production, ownership transfers to a multisig. Authorized payers (the RedemptionManager)
///      are the only addresses that can move funds out via pay(). Sweeps require the owner.
contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    mapping(address => bool) public isPayer;

    event PayerSet(address indexed account, bool isPayer);
    event Paid(address indexed to, uint256 amount, address indexed by);
    event Swept(address indexed token, address indexed to, uint256 amount);

    error NotPayer();

    constructor(address initialOwner, IERC20 usdc_) Ownable(initialOwner) {
        usdc = usdc_;
    }

    /// @notice Authorize an address to call pay(). The RedemptionManager is the canonical payer.
    function setPayer(address account, bool payer) external onlyOwner {
        isPayer[account] = payer;
        emit PayerSet(account, payer);
    }

    /// @notice Transfer USDC from the treasury to a recipient. Only authorized payers.
    function pay(address to, uint256 amount) external {
        if (!isPayer[msg.sender]) revert NotPayer();
        usdc.safeTransfer(to, amount);
        emit Paid(to, amount, msg.sender);
    }

    /// @notice Emergency / admin function — owner can sweep any token (including USDC).
    /// @dev In production this should be timelocked.
    function sweep(IERC20 token, address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
        emit Swept(address(token), to, amount);
    }

    function usdcBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
