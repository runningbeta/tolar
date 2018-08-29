pragma solidity ^0.4.24;

import "./TokenConditionalEscrow.sol";


/**
 * @title TokenTimelockEscrow
 * @dev Escrow to only allow withdrawal only if the lock period
 * has expired. As only the owner can make deposits and withdrawals
 * this contract should be owned by the crowdsale, which can then
 * perform deposits and withdrawals for individual users.
 */
contract TokenTimelockEscrow is TokenConditionalEscrow {

  // timestamp when token release is enabled
  uint256 public releaseTime;

  constructor(uint256 _releaseTime) public {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp, "Release time should be in the future.");
    releaseTime = _releaseTime;
  }

  /**
   * @dev Returns whether an address is allowed to withdraw their tokens.
   * @param _payee The destination address of the tokens.
   */
  function withdrawalAllowed(address _payee) public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp >= releaseTime;
  }
}
