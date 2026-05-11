// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title KYCRegistry
/// @notice Owner-controlled allowlist of KYC-approved addresses.
/// @dev In production, ownership transfers to a multisig governed by the KYC operator.
contract KYCRegistry is Ownable {
    mapping(address => bool) private _kycd;

    event KycStatusChanged(address indexed account, bool kycd);

    error ArrayLengthMismatch();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Add or remove an address from the KYC allowlist.
    function setKycStatus(address account, bool kycd) external onlyOwner {
        _setKycStatus(account, kycd);
    }

    /// @notice Batch version of setKycStatus.
    function setKycStatusBatch(address[] calldata accounts, bool[] calldata statuses) external onlyOwner {
        if (accounts.length != statuses.length) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < accounts.length; i++) {
            _setKycStatus(accounts[i], statuses[i]);
        }
    }

    function isKycd(address account) external view returns (bool) {
        return _kycd[account];
    }

    function _setKycStatus(address account, bool kycd) internal {
        if (_kycd[account] != kycd) {
            _kycd[account] = kycd;
            emit KycStatusChanged(account, kycd);
        }
    }
}
