const { duration, increaseTimeTo } = require('./helpers/increaseTime');
const { advanceBlock } = require('./helpers/advanceToBlock');
const { latestTime } = require('./helpers/latestTime');
const { expectThrow } = require('./helpers/expectThrow');
const { EVMRevert } = require('./helpers/EVMRevert');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('TolarToken');
const TokenCrowdsale = artifacts.require('TokenCrowdsale');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

contract('TokenCrowdsale', function ([
  owner,
  wallet,
  alice,
  bob,
  charlie,
  ...other
]) {
  before(async function () {
    (await advanceBlock());
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.withdrawTime = this.closingTime + duration.weeks(2);

    this.token = await Token.new({ from: owner });
    this.crowdsale = await TokenCrowdsale.new(
      new BigNumber(6894),
      wallet,
      this.token.address,
      owner,
      ether(15),
      this.openingTime,
      this.closingTime,
      this.withdrawTime,
      { from: owner }
    );
    const totalSupply = await this.token.totalSupply();
    this.token.approve(this.crowdsale.address, totalSupply, { from: owner });
  });

  it('fails to create if withdraw time is before closing time', async function () {
    await (TokenCrowdsale.new(
      new BigNumber(6894),
      wallet,
      this.token.address,
      owner,
      ether(15),
      this.openingTime,
      this.closingTime,
      this.openingTime,
      { from: owner }
    )).should.be.rejectedWith(EVMRevert);
  });

  describe('after opening', function () {
    beforeEach(async function () {
      await this.crowdsale.setUserCap(alice, ether(10), { from: owner });
      await this.crowdsale.setUserCap(bob, ether(10), { from: owner });
      await increaseTimeTo(this.openingTime + 1);
    });

    it('can buy tokens', async function () {
      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(1) });
      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(ether(1).mul(6894));
    });

    it('fails to withdraw', async function () {
      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(1) });
      await expectThrow(() => this.crowdsale.contract.withdrawTokens['']({ from: alice, gas: 500000 }), EVMRevert);

      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
    });

    it('fails to withdraw for address', async function () {
      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(1) });

      const options = { from: alice, gas: 500000 };
      // eslint-disable-next-line dot-notation
      await expectThrow(() => this.crowdsale.contract.withdrawTokens['address'](alice, options), EVMRevert);

      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
    });

    it('fails to withdraw for multiple address', async function () {
      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(1) });
      await this.crowdsale.buyTokens(bob, { from: bob, value: ether(1) });

      const options = { from: alice, gas: 500000 };
      await expectThrow(() => this.crowdsale.contract.withdrawTokens['address[]']([alice, bob], options), EVMRevert);

      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
      (await this.token.balanceOf(bob))
        .should.be.bignumber.equal(0);
    });

    it('fails to sell more than cap', async function () {
      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(10) });
      await (this.crowdsale.buyTokens(bob, { from: bob, value: ether(10) }))
        .should.be.rejectedWith(EVMRevert);

      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(ether(10).mul(6894));
      (await this.crowdsale.balances(bob))
        .should.be.bignumber.equal(0);
    });

    it('can sell exactly until cap', async function () {
      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(10) });
      await this.crowdsale.buyTokens(bob, { from: bob, value: ether(5) });

      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(ether(10).mul(6894));
      (await this.crowdsale.balances(bob))
        .should.be.bignumber.equal(ether(5).mul(6894));
    });
  });

  describe('after closing', function () {
    beforeEach(async function () {
      await this.crowdsale.setUserCap(alice, ether(10), { from: owner });
      await this.crowdsale.setUserCap(bob, ether(10), { from: owner });
      await increaseTimeTo(this.openingTime + 1);

      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(1) });
      await this.crowdsale.buyTokens(bob, { from: bob, value: ether(1) });
      await increaseTimeTo(this.closingTime + 1);
    });

    it('report as closed', async function () {
      (await this.crowdsale.hasEnded())
        .should.be.equal(true);
    });

    it('fails to withdraw', async function () {
      await expectThrow(() => this.crowdsale.contract.withdrawTokens['']({ from: alice, gas: 500000 }), EVMRevert);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
    });

    it('fails to withdraw for address', async function () {
      const options = { from: alice, gas: 500000 };
      // eslint-disable-next-line dot-notation
      await expectThrow(() => this.crowdsale.contract.withdrawTokens['address'](alice, options), EVMRevert);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
    });

    it('fails to withdraw for multiple address', async function () {
      const options = { from: alice, gas: 500000 };
      await expectThrow(() => this.crowdsale.contract.withdrawTokens['address[]']([alice, bob], options), EVMRevert);

      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
      (await this.token.balanceOf(bob))
        .should.be.bignumber.equal(0);
    });
  });

  describe('after withdrawal', function () {
    beforeEach(async function () {
      await this.crowdsale.setUserCap(alice, ether(10), { from: owner });
      await this.crowdsale.setUserCap(bob, ether(10), { from: owner });
      await increaseTimeTo(this.openingTime + 1);

      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(1) });
      await this.crowdsale.buyTokens(bob, { from: bob, value: ether(2) });
      await increaseTimeTo(this.withdrawTime + 1);
    });

    it('can withdraw', async function () {
      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(ether(1).mul(6894));
      await this.crowdsale.contract.withdrawTokens['']({ from: alice, gas: 500000 });

      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(0);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(ether(1).mul(6894));
    });

    it('fails to withdraw if not bought', async function () {
      (await this.crowdsale.balances(charlie))
        .should.be.bignumber.equal(0);
      await expectThrow(() => this.crowdsale.contract.withdrawTokens['']({ from: charlie, gas: 500000 }), EVMRevert);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
    });

    it('can withdraw for address', async function () {
      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(ether(1).mul(6894));
      // eslint-disable-next-line dot-notation
      await this.crowdsale.contract.withdrawTokens['address'](alice, { from: alice, gas: 500000 });

      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(0);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(ether(1).mul(6894));
    });

    it('can withdraw for multiple addresses', async function () {
      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(ether(1).mul(6894));
      (await this.crowdsale.balances(bob))
        .should.be.bignumber.equal(ether(2).mul(6894));

      await this.crowdsale.contract.withdrawTokens['address[]']([alice, bob], { from: owner, gas: 500000 });

      (await this.crowdsale.balances(alice))
        .should.be.bignumber.equal(0);
      (await this.crowdsale.balances(bob))
        .should.be.bignumber.equal(0);

      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(ether(1).mul(6894));
      (await this.token.balanceOf(bob))
        .should.be.bignumber.equal(ether(2).mul(6894));
    });
  });
});
