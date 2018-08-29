pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";
import "../lifecycle/Factory.sol";
import "./TokenTimelockFactory.sol";


/// @title Token timelock wallet factory - Allows creation of timelock wallet.
contract TokenTimelockFactoryImpl is TokenTimelockFactory, Factory {

  mapping(address => address[]) public beneficiaryInstantiations;

  /**
   * @dev Allows verified creation of token timelock wallet.
   * @param _token Address of the token being locked.
   * @param _beneficiary address of the beneficiary to whom vested tokens are transferred.
   * @param _releaseTime The release times after which the tokens can be withdrawn.
   * @return Returns wallet address.
   */
  function create(
    ERC20 _token,
    address _beneficiary,
    uint256 _releaseTime
  )
    public
    returns (address wallet)
  {
    wallet = new TokenTimelock(_token, _beneficiary, _releaseTime);
    beneficiaryInstantiations[_beneficiary].push(wallet);
    register(wallet);
  }
}
