pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "./lifecycle/Finalizable.sol";
import "./payment/TokenTimelockEscrow.sol";
import "./payment/TokenTimelockFactory.sol";
import "./payment/TokenVestingFactory.sol";
import "./TokenTimelockEscrowImpl.sol";
import "./TokenCrowdsale.sol";


/**
 * @title TokenDistributor
 * @dev This is a token distribution contract used to distribute tokens and create a public Crowdsale.
 */
contract TokenDistributor is HasNoEther, Finalizable {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  // We also declare Factory.ContractInstantiation here to read it in truffle logs
  // https://github.com/trufflesuite/truffle/issues/555
  event ContractInstantiation(address sender, address instantiation);
  event CrowdsaleInstantiated(address sender, address instantiation, uint256 allowance);

  /// Party (team multisig) who is in the control of the token pool.
  /// @notice this will be different from the owner address (scripted) that calls this contract.
  address public benefactor;

  // How many token units a buyer gets per wei.
  // The rate is the conversion between wei and the smallest and indivisible token unit.
  // So, if you are using a rate of 1 with a DetailedERC20 token with 3 decimals called TOL
  // 1 wei will give you 1 unit, or 0.001 TOL.
  uint256 public rate;

   // Address where funds are collected
  address public wallet;

  // The token being sold
  ERC20 public token;

  // Max cap for presale + crowdsale
  uint256 public cap;

  // Crowdsale is open in this period
  uint256 public openingTime;
  uint256 public closingTime;

  // When withdrawals open
  uint256 public withdrawTime;

  // Amount of wei raised
  uint256 public weiRaised;

  // Allowance that is given to crowdsale contract after it is created
  uint256 public crowdsaleAllowance;

  // Crowdsale that is created after the presale distribution is finalized
  TokenCrowdsale public crowdsale;

  // Escrow contract used to lock team tokens until crowdsale ends
  TokenTimelockEscrow public presaleEscrow;

  // Escrow contract used to lock bonus tokens
  TokenTimelockEscrow public bonusEscrow;

  // Factory used to create individual time locked token contracts
  TokenTimelockFactory public timelockFactory;

  // Factory used to create individual vesting token contracts
  TokenVestingFactory public vestingFactory;

  /// @dev Throws if called before the crowdsale is created.
  modifier onlyIfCrowdsale() {
    require(isFinalized, "Contract not finalized.");
    require(crowdsale != address(0), "Crowdsale not started.");
    _;
  }

  constructor(
    address _benefactor,
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _withdrawTime,
    uint256 _bonusTime
  )
    public
  {
    require(address(_benefactor) != address(0), "Benefactor address should not be 0x0.");
    require(_rate > 0, "Rate should not be > 0.");
    require(_wallet != address(0), "Wallet address should not be 0x0.");
    require(address(_token) != address(0), "Token address should not be 0x0.");
    require(_cap > 0, "Cap should be > 0.");
    // solium-disable-next-line security/no-block-members
    require(_openingTime > block.timestamp, "Opening time should be in the future.");
    require(_closingTime > _openingTime, "Closing time should be after opening.");
    require(_withdrawTime >= _closingTime, "Withdrawals should open after crowdsale closes.");
    require(_bonusTime > _withdrawTime, "Bonus time should be set after withdrawals open.");

    benefactor = _benefactor;
    rate = _rate;
    wallet = _wallet;
    token = _token;
    cap = _cap;
    openingTime = _openingTime;
    closingTime = _closingTime;
    withdrawTime = _withdrawTime;

    presaleEscrow = new TokenTimelockEscrowImpl(_token, _withdrawTime);
    bonusEscrow = new TokenTimelockEscrowImpl(_token, _bonusTime);
  }

  /**
   * @dev Sets a specific user's maximum contribution.
   * @param _beneficiary Address to be capped
   * @param _cap Wei limit for individual contribution
   */
  function setUserCap(address _beneficiary, uint256 _cap) external onlyOwner onlyIfCrowdsale {
    crowdsale.setUserCap(_beneficiary, _cap);
  }

  /**
   * @dev Sets a group of users' maximum contribution.
   * @param _beneficiaries List of addresses to be capped
   * @param _cap Wei limit for individual contribution
   */
  function setGroupCap(address[] _beneficiaries, uint256 _cap) external onlyOwner onlyIfCrowdsale {
    crowdsale.setGroupCap(_beneficiaries, _cap);
  }

  /**
   * @dev Returns the cap of a specific user.
   * @param _beneficiary Address whose cap is to be checked
   * @return Current cap for individual user
   */
  function getUserCap(address _beneficiary) public view onlyIfCrowdsale returns (uint256) {
    return crowdsale.getUserCap(_beneficiary);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled when withdrawals open.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   */
  function depositPresale(address _dest, uint256 _amount) public onlyOwner onlyNotFinalized {
    require(token.allowance(benefactor, this) >= _amount, "Not enough allowance.");
    token.transferFrom(benefactor, this, _amount);
    token.approve(presaleEscrow, _amount);
    presaleEscrow.deposit(_dest, _amount);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled when withdrawals open.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   * @param _weiAmount The amount of wei exchanged for the tokens.
   */
  function depositPresale(address _dest, uint256 _amount, uint256 _weiAmount) public {
    require(cap >= weiRaised.add(_weiAmount), "Cap reached.");
    depositPresale(_dest, _amount);
    weiRaised = weiRaised.add(_weiAmount);
  }

  /// @dev Withdraw accumulated balance, called by beneficiary.
  function withdrawPresale() public {
    presaleEscrow.withdraw(msg.sender);
  }

  /**
   * @dev Withdraw accumulated balance for beneficiary.
   * @param _beneficiary Address of beneficiary
   */
  function withdrawPresale(address _beneficiary) public {
    presaleEscrow.withdraw(_beneficiary);
  }

  /**
   * @dev Withdraw accumulated balances for beneficiaries.
   * @param _beneficiaries List of addresses of beneficiaries
   */
  function withdrawPresale(address[] _beneficiaries) public {
    for (uint32 i = 0; i < _beneficiaries.length; i ++) {
      presaleEscrow.withdraw(_beneficiaries[i]);
    }
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled from token timelock contract.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   */
  function depositBonus(address _dest, uint256 _amount) public onlyOwner onlyNotFinalized {
    require(token.allowance(benefactor, this) >= _amount, "Not enough allowance.");
    token.transferFrom(benefactor, this, _amount);
    token.approve(bonusEscrow, _amount);
    bonusEscrow.deposit(_dest, _amount);
  }

  /// @dev Withdraw accumulated balance, called by beneficiary.
  function withdrawBonus() public {
    bonusEscrow.withdraw(msg.sender);
  }

  /**
   * @dev Withdraw accumulated balance for beneficiary.
   * @param _beneficiary Address of beneficiary
   */
  function withdrawBonus(address _beneficiary) public {
    bonusEscrow.withdraw(_beneficiary);
  }

  /**
   * @dev Withdraw accumulated balances for beneficiaries.
   * @param _beneficiaries List of addresses of beneficiaries
   */
  function withdrawBonus(address[] _beneficiaries) public {
    for (uint32 i = 0; i < _beneficiaries.length; i ++) {
      bonusEscrow.withdraw(_beneficiaries[i]);
    }
  }

  /**
   * @dev Setter for TokenTimelockFactory because of gas limits
   * @param _timelockFactory Address of the TokenTimelockFactory contract
   */
  function setTokenTimelockFactory(address _timelockFactory) public onlyOwner {
    require(timelockFactory == address(0), "TokenTimelockFactory should not be initalizied.");
    timelockFactory = TokenTimelockFactory(_timelockFactory);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled
   * from token timelock contract.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   * @param _releaseTime The release times after which the tokens can be withdrawn.
   * @return Returns wallet address.
   */
  function depositAndLock(
    address _dest,
    uint256 _amount,
    uint256 _releaseTime
  )
    public
    onlyOwner
    onlyNotFinalized
    returns (address tokenWallet)
  {
    require(token.allowance(benefactor, this) >= _amount, "Not enough allowance.");
    require(_dest != address(0), "Destination address should not be 0x0.");
    require(_releaseTime >= withdrawTime, "Tokens should unlock after withdrawals open.");
    tokenWallet = timelockFactory.create(
      token,
      _dest,
      _releaseTime
    );
    token.transferFrom(benefactor, tokenWallet, _amount);
  }

  /**
   * @dev Setter for TokenVestingFactory because of gas limits
   * @param _vestingFactory Address of the TokenVestingFactory contract
   */
  function setTokenVestingFactory(address _vestingFactory) public onlyOwner {
    require(vestingFactory == address(0), "TokenVestingFactory should not be initalizied.");
    vestingFactory = TokenVestingFactory(_vestingFactory);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled
   * from token vesting contract.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param _start the time (as Unix time) at which point vesting starts
   * @param _duration duration in seconds of the period in which the tokens will vest
   * @return Returns wallet address.
   */
  function depositAndVest(
    address _dest,
    uint256 _amount,
    uint256 _start,
    uint256 _cliff,
    uint256 _duration
  )
    public
    onlyOwner
    onlyNotFinalized
    returns (address tokenWallet)
  {
    require(token.allowance(benefactor, this) >= _amount, "Not enough allowance.");
    require(_dest != address(0), "Destination address should not be 0x0.");
    require(_start.add(_cliff) >= withdrawTime, "Tokens should unlock after withdrawals open.");
    bool revocable = false;
    tokenWallet = vestingFactory.create(
      _dest,
      _start,
      _cliff,
      _duration,
      revocable
    );
    token.transferFrom(benefactor, tokenWallet, _amount);
  }

  /**
   * @dev In case there are any unsold tokens, they are claimed by the owner
   * @param _beneficiary Address where claimable tokens are going to be transfered
   */
  function claimUnsold(address _beneficiary) public onlyIfCrowdsale onlyOwner {
    require(crowdsale.hasEnded(), "Crowdsale still running.");
    uint256 sold = crowdsale.tokensSold();
    uint256 delivered = crowdsale.tokensDelivered();
    uint256 toDeliver = sold.sub(delivered);

    uint256 balance = token.balanceOf(this);
    uint256 claimable = balance.sub(toDeliver);

    if (claimable > 0) {
      token.safeTransfer(_beneficiary, claimable);
    }
  }

  /**
   * @dev Finalization logic that will create a Crowdsale with provided parameters
   * and calculated cap depending on the amount raised in presale.
   */
  function finalization() internal {
    super.finalization();
    uint256 crowdsaleCap = cap.sub(weiRaised);
    if (crowdsaleCap == 0) {
      // Cap reached in presale, no crowdsale necessary
      return;
    }

    address tokenWallet = this;
    crowdsale = new TokenCrowdsale(
      rate,
      wallet,
      token,
      tokenWallet,
      crowdsaleCap,
      openingTime,
      closingTime,
      withdrawTime
    );
    crowdsaleAllowance = token.allowance(benefactor, this);
    token.transferFrom(benefactor, this, crowdsaleAllowance);
    token.approve(crowdsale, crowdsaleAllowance);
    emit CrowdsaleInstantiated(msg.sender, crowdsale, crowdsaleAllowance);
  }

}
