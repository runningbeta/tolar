pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "../token/ERC20/SafeStandardToken.sol";


/**
 * @title SafeStandardToken
 * @dev ERC20 Example Token (TOK)
 *
 * TOK Tokens are divisible by 1e18 (1 000 000 000 000 000 000) base.
 *
 * TOK are displayed using 18 decimal places of precision.
 *
 * 1 TOK is equivalent to:
 *   1 000 000 000 000 000 000 == 1 * 10**18 == 1e18
 *
 * 1 Billion TOK (total supply) is equivalent to:
 *   1000000000 * 10**18 == 1e27
 *
 * @notice All tokens are pre-assigned to the creator. Note they can later distribute these
 * tokens as they wish using `transfer` and other `StandardToken` functions.
 */
contract SafeStandardTokenMock is DetailedERC20, SafeStandardToken {
  string public constant NAME = "Example Token";
  string public constant SYMBOL = "TOK";
  uint8 public constant DECIMALS = 18;

  uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(DECIMALS));

  /// @dev Constructor that gives msg.sender all of existing tokens.
  constructor() public DetailedERC20(NAME, SYMBOL, DECIMALS) {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(address(0), msg.sender, INITIAL_SUPPLY);
  }
}
