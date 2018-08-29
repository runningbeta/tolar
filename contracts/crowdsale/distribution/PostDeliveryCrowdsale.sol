pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title PostDeliveryCrowdsale
 * @dev Crowdsale that locks tokens from withdrawal until it ends.
 */
contract PostDeliveryCrowdsale is TimedCrowdsale {
  using SafeMath for uint256;

  mapping(address => uint256) public balances;

  /// @dev Withdraw tokens only after crowdsale ends.
  function withdrawTokens() public {
    _withdrawTokens(msg.sender);
  }

  /**
   * @dev Withdraw tokens only after crowdsale ends.
   * @param _beneficiary Token purchaser
   */
  function _withdrawTokens(address _beneficiary) internal {
    require(hasClosed(), "Crowdsale not closed.");
    uint256 amount = balances[_beneficiary];
    require(amount > 0, "Beneficiary has zero balance.");
    balances[_beneficiary] = 0;
    _deliverTokens(_beneficiary, amount);
  }

  /**
   * @dev Overrides parent by storing balances instead of issuing tokens right away.
   * @param _beneficiary Token purchaser
   * @param _tokenAmount Amount of tokens purchased
   */
  function _processPurchase(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    balances[_beneficiary] = balances[_beneficiary].add(_tokenAmount);
  }

}
