const { shouldBehaveLikeTokenEscrow } = require('./TokenEscrow.behaviour');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { advanceBlock } = require('../helpers/advanceToBlock');
const { latestTime } = require('../helpers/latestTime');
const { EVMRevert } = require('../helpers/EVMRevert');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const Token = artifacts.require('TolarToken');
const TokenTimelockEscrowMock = artifacts.require('TokenTimelockEscrowMock');

contract('TokenTimelockEscrow', function ([owner, ...otherAccounts]) {
  let now;
  let releaseTime;

  beforeEach(async function () {
    await advanceBlock();
    now = await latestTime();
    releaseTime = now + duration.days(2);
    this.token = await Token.new({ from: owner });
    this.escrow = await TokenTimelockEscrowMock.new(
      this.token.address,
      releaseTime,
      { from: owner }
    );
  });

  it('fails if benefactor is zero address', async function () {
    await (TokenTimelockEscrowMock.new(this.token.address, now, { from: owner }))
      .should.be.rejectedWith(EVMRevert);
  });

  context('before release time', function () {
    const amount = ether(23.0);
    const payee = otherAccounts[1];

    it('reverts on withdrawals', async function () {
      await this.token.approve(this.escrow.address, amount, { from: owner });
      await this.escrow.deposit(payee, amount, { from: owner });

      await (this.escrow.withdraw(payee, { from: owner })).should.be.rejectedWith(EVMRevert);
    });
  });

  context('after release time', function () {
    beforeEach(async function () {
      await increaseTimeTo(releaseTime + 1);
    });

    shouldBehaveLikeTokenEscrow(owner, otherAccounts);
  });
});
