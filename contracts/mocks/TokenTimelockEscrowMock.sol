pragma solidity ^0.4.24;

import "../payment/TokenTimelockEscrow.sol";


/**
 * @title TokenTimelockEscrowMock
 */
contract TokenTimelockEscrowMock is TokenTimelockEscrow {

  constructor(ERC20 _token, uint256 _releaseTime)
    public
    TokenEscrow(_token)
    TokenTimelockEscrow(_releaseTime)
  {
    // constructor
  }
}
