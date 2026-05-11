// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Test stablecoin with 6 decimals (matches real USDC). Open faucet for testnet demo.
/// @dev Anyone can mint to themselves up to FAUCET_MAX_PER_CALL per call. Owner has no special role.
contract MockUSDC is ERC20 {
    uint256 public constant FAUCET_MAX_PER_CALL = 100_000 * 1e6; // 100,000 USDC

    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Free testnet faucet. Anyone can mint to any address.
    /// @dev DO NOT use this contract on mainnet. Demo only.
    function faucet(address to, uint256 amount) external {
        require(amount <= FAUCET_MAX_PER_CALL, "MockUSDC: faucet limit");
        _mint(to, amount);
    }
}
