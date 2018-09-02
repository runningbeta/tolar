const { latestTime } = require('./helpers/latestTime');
const { duration } = require('./helpers/increaseTime');
const { advanceBlock } = require('./helpers/advanceToBlock');
const { ether } = require('./helpers/ether');
const { EVMRevert } = require('./helpers/EVMRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const Token = artifacts.require('TolarToken');
const TokenDistributor = artifacts.require('TokenDistributor');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');
const Crowdsale = artifacts.require('TokenCrowdsale');

contract('Token Generation Event', function ([
  benefactor,
  owner,
  founder1,
  founder2,
  devFund,

  nodeFund,
  developers,
  advisors,
  wallet,
  last,
]) {
  const rate = new BigNumber(6894);
  const cap = ether(45000.0);

  before(async function () {
    (await advanceBlock()); // get blocks in sync with now

    this.now = (await latestTime());
    this.openingTime = this.now + duration.days(10);
    this.closingTime = this.openingTime + duration.days(5);
    this.withdrawTime = this.closingTime + duration.days(5);

    this.bonusTime = this.closingTime + duration.days(30);

    this.sixMonthsTime = this.closingTime + duration.days(6 * 30);
    this.oneYearTime = this.closingTime + duration.years(1);
    this.twoYearTime = this.closingTime + duration.years(2);
    this.threeYearTime = this.closingTime + duration.years(3);
  });

  it('should create ERC20 token contract', async function () {
    this.token = await Token.new({ from: benefactor });
    this.totalSupply = await this.token.totalSupply();

    (await this.token.balanceOf(benefactor))
      .should.be.bignumber.equal(this.totalSupply);
  });

  it('should create distributor contract', async function () {
    this.distributor = await TokenDistributor.new(
      benefactor,
      rate,
      wallet,
      this.token.address,
      cap,
      this.openingTime,
      this.closingTime,
      this.withdrawTime,
      this.bonusTime,
      { from: owner }
    );
    await this.token.approve(this.distributor.address, this.totalSupply, { from: benefactor });
    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply);
  });

  it('should init TokenTimelockFactory', async function () {
    this.timelockFactory = await TokenTimelockFactory.new({ from: owner });
    await this.distributor.setTokenTimelockFactory(this.timelockFactory.address, { from: owner });
    (await this.distributor.timelockFactory())
      .should.be.equal(this.timelockFactory.address);
  });

  it('should distribute dev fund tokens (32%)', async function () {
    await this.distributor
      .depositAndLock(devFund, this.totalSupply.div(100).mul(5), this.oneYearTime, { from: owner });
    await this.distributor
      .depositAndLock(devFund, this.totalSupply.div(100).mul(5), this.twoYearTime, { from: owner });
    await this.distributor
      .depositAndLock(devFund, this.totalSupply.div(100).mul(22), this.threeYearTime, { from: owner });
    console.log('Dev fund - 1yr 5% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(devFund, 0));
    console.log('Dev fund - 2yr 5% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(devFund, 1));
    console.log('Dev fund - 3yr 22% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(devFund, 2));

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(100).mul(68));
  });

  it('should distribute founder tokens (2 * 10%)', async function () {
    await this.distributor.depositAndLock(founder1, this.totalSupply.div(10), this.twoYearTime, { from: owner });
    await this.distributor.depositAndLock(founder2, this.totalSupply.div(10), this.twoYearTime, { from: owner });
    console.log('Founder 1 - 2yr 10% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(founder1, 0));
    console.log('Founder 2 - 2yr 10% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(founder2, 0));

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(100).mul(48));
  });

  it('should distribute start node tokens (8%)', async function () {
    await this.distributor
      .depositAndLock(nodeFund, this.totalSupply.div(100).mul(8), this.sixMonthsTime, { from: owner });
    const instatiations = await this.timelockFactory.beneficiaryInstantiations(nodeFund, 0);
    console.log('Nodes - 6m 8% Timelock: ', instatiations);

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(100).mul(40));
  });

  it('should distribute developer tokens (2.5%)', async function () {
    await this.distributor
      .depositAndLock(developers, this.totalSupply.div(1000).mul(25), this.twoYearTime, { from: owner });
    const instatiations = await this.timelockFactory.beneficiaryInstantiations(developers, 0);
    console.log('Developers - 2yr 2.5% Timelock: ', instatiations);

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(1000).mul(375));
  });

  it('should distribute advisor tokens (2.5%)', async function () {
    await this.distributor
      .depositAndLock(advisors, this.totalSupply.div(1000).mul(25), this.twoYearTime, { from: owner });
    const instatiations = await this.timelockFactory.beneficiaryInstantiations(advisors, 0);
    console.log('Advisors - 2yr 2.5% Timelock: ', instatiations);

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(1000).mul(350));
  });

  it('should be able to finalize', async function () {
    await this.distributor.finalize({ from: owner });

    (await this.distributor.isFinalized())
      .should.be.equal(true);
  });

  describe('after Finalization', function () {
    it('should create crowdsale', async function () {
      const crowdsaleAddr = await this.distributor.crowdsale();
      this.crowdsale = await Crowdsale.at(crowdsaleAddr);

      (await this.token.allowance(this.distributor.address, this.crowdsale.address))
        .should.be.bignumber.equal(this.totalSupply.div(1000).mul(350));

      (await this.token.allowance(benefactor, this.distributor.address))
        .should.be.bignumber.equal(0);

      (await this.crowdsale.cap())
        .should.be.bignumber.equal(cap);

      (await this.crowdsale.tokenWallet())
        .should.be.bignumber.equal(this.distributor.address);
    });

    it('should disable deposits', async function () {
      await this.distributor
        .depositAndLock(advisors, this.totalSupply.div(1000).mul(25), this.twoYearTime, { from: owner })
        .should.be.rejectedWith(EVMRevert);
    });
  });
});
