pragma solidity ^0.4.24;


import "openzeppelin-solidity/contracts/token/ERC20/TokenVesting.sol";
import "../lifecycle/Factory.sol";
import "./TokenVestingFactory.sol";


/// @title Token vesting wallet factory - Allows creation of TokenVesting wallet.
contract TokenVestingFactoryImpl is TokenVestingFactory, Factory {

  mapping(address => address[]) public beneficiaryInstantiations;

  /**
   * @dev Allows verified creation of token vesting wallet.
   * Creates a vesting contract that vests its balance of any ERC20 token to the
   * _beneficiary, gradually in a linear fashion until _start + _duration. By then all
   * of the balance will have vested.
   * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param _start the time (as Unix time) at which point vesting starts
   * @param _duration duration in seconds of the period in which the tokens will vest
   * @param _revocable whether the vesting is revocable or not
   * @return Returns wallet address.
   */
  function create(
    address _beneficiary,
    uint256 _start,
    uint256 _cliff,
    uint256 _duration,
    bool _revocable
  )
    public
    returns (address wallet)
  {
    wallet = new TokenVesting(_beneficiary, _start, _cliff, _duration, _revocable);
    TokenVesting(wallet).transferOwnership(msg.sender);
    beneficiaryInstantiations[_beneficiary].push(wallet);
    register(wallet);
  }
}
