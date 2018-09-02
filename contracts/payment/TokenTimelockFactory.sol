pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


/**
 * @title TokenTimelockFactory
 * @dev Allows creation of timelock wallet.
 */
contract TokenTimelockFactory {

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
    returns (address wallet);
}
