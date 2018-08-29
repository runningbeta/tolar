pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "./crowdsale/distribution/PostDeliveryCrowdsale.sol";


/**
 * @title TokenCrowdsale
 * @dev This is a ERC20 token crowdsale that will sell tokens util
 * the cap is reached, time expired or the allowance is spent.
 */
// solium-disable-next-line
contract TokenCrowdsale
  is
    HasNoTokens,
    HasNoContracts,
    TimedCrowdsale,
    CappedCrowdsale,
    IndividuallyCappedCrowdsale,
    PostDeliveryCrowdsale,
    AllowanceCrowdsale
{

  // When withdrawals open
  uint256 public withdrawTime;

  // Amount of tokens sold
  uint256 public tokensSold;

  // Amount of tokens delivered
  uint256 public tokensDelivered;

  constructor(
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    address _tokenWallet,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _withdrawTime
  )
    public
    Crowdsale(_rate, _wallet, _token)
    TimedCrowdsale(_openingTime, _closingTime)
    CappedCrowdsale(_cap)
    AllowanceCrowdsale(_tokenWallet)
  {
    require(_withdrawTime >= _closingTime, "Withdrawals should open after crowdsale closes.");
    withdrawTime = _withdrawTime;
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open
   * has already elapsed or cap was reached.
   * @return Whether crowdsale has ended
   */
  function hasEnded() public view returns (bool) {
    return hasClosed() || capReached();
  }

  /**
   * @dev Withdraw tokens only after crowdsale ends.
   * @param _beneficiary Token purchaser
   */
  function withdrawTokens(address _beneficiary) public {
    _withdrawTokens(_beneficiary);
  }

  /**
   * @dev Withdraw tokens only after crowdsale ends.
   * @param _beneficiaries List of token purchasers
   */
  function withdrawTokens(address[] _beneficiaries) public {
    for (uint32 i = 0; i < _beneficiaries.length; i ++) {
      _withdrawTokens(_beneficiaries[i]);
    }
  }

  /**
   * @dev We use this function to store the total amount of tokens sold
   * @param _beneficiary Token purchaser
   * @param _tokenAmount Amount of tokens purchased
   */
  function _processPurchase(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    super._processPurchase(_beneficiary, _tokenAmount);
    tokensSold = tokensSold.add(_tokenAmount);
  }

  /**
   * @dev We use this function to store the total amount of tokens delivered
   * @param _beneficiary Address performing the token purchase
   * @param _tokenAmount Number of tokens to be emitted
   */
  function _deliverTokens(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    super._deliverTokens(_beneficiary, _tokenAmount);
    tokensDelivered = tokensDelivered.add(_tokenAmount);
  }

  /**
   * @dev Withdraw tokens only after crowdsale ends.
   * @param _beneficiary Token purchaser
   */
  function _withdrawTokens(address _beneficiary) internal {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp > withdrawTime, "Withdrawals not open.");
    super._withdrawTokens(_beneficiary);
  }

}
