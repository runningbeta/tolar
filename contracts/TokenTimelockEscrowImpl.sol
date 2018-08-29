pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "./payment/TokenTimelockEscrow.sol";


/**
 * @title TokenTimelockEscrowImpl
 */
contract TokenTimelockEscrowImpl is HasNoEther, HasNoContracts, TokenTimelockEscrow {

  constructor(ERC20 _token, uint256 _releaseTime)
    public
    TokenEscrow(_token)
    TokenTimelockEscrow(_releaseTime)
  {
    // constructor
  }
}
