pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";


/**
 * @title Escrow
 * @dev Base escrow contract, holds funds destinated to a payee until they
 * withdraw them. The contract that uses the escrow as its payment method
 * should be its owner, and provide public methods redirecting to the escrow's
 * deposit and withdraw.
 */
contract TokenEscrow is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  event Deposited(address indexed payee, uint256 amount);
  event Withdrawn(address indexed payee, uint256 amount);

  // deposits of the beneficiaries of tokens
  mapping(address => uint256) private deposits;

  // total sum of current deposits
  uint256 private totalDeposits;

  // ERC20 token contract being held
  ERC20 public token;

  constructor(ERC20 _token) public {
    token = _token;
  }

  /**
   * @dev Returns the token accumulated balance for a payee.
   * @param _payee The destination address of the tokens.
   */
  function depositsOf(address _payee) public view returns (uint256) {
    return deposits[_payee];
  }

  /**
   * @dev Stores the token amount as credit to be withdrawn.
   * @param _payee The destination address of the tokens.
   * @param _amount The amount of tokens that can be pulled.
   */
  function deposit(address _payee, uint256 _amount) public onlyOwner {
    require(_payee != address(0), "Destination address should not be 0x0.");
    token.safeTransferFrom(owner, this, _amount);
    deposits[_payee] = deposits[_payee].add(_amount);
    totalDeposits = totalDeposits.add(_amount);

    emit Deposited(_payee, _amount);
  }

  /**
   * @dev Withdraw accumulated balance for a payee.
   * @param _payee The address whose tokens will be withdrawn and transferred to.
   */
  function withdraw(address _payee) public onlyOwner {
    uint256 payment = deposits[_payee];

    deposits[_payee] = 0;
    token.safeTransfer(_payee, payment);
    totalDeposits = totalDeposits.sub(payment);

    emit Withdrawn(_payee, payment);
  }
}
