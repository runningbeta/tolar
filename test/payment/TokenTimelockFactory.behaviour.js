const { increaseTimeTo } = require('../helpers/increaseTime');
const { inLogs } = require('../helpers/expectEvent');
const { duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { EVMRevert } = require('../helpers/EVMRevert');
const { EVMThrow } = require('../helpers/EVMThrow');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const TokenTimelock = artifacts.require('TokenTimelock');

const shouldBehaveLikeTokenTimelockFactory = (owner, beneficiary, other) => {
  const amount = ether(17.0);

  describe('as a TokenTimelockFactory', function () {
    beforeEach(async function () {
      this.releaseTime = (await latestTime()) + duration.days(2);
      this.factoryReceipt = await this.factory
        .create(this.token.address, beneficiary, this.releaseTime, { from: owner });
    });

    it('can count istantiatinos', async function () {
      (await this.factory.getInstantiationCount(owner))
        .should.be.bignumber.equal(1);
    });

    it('emits ContractInstantiation event', async function () {
      inLogs(this.factoryReceipt.logs, 'ContractInstantiation', { sender: owner });
    });

    it('should track instantiations', async function () {
      const event = inLogs(this.factoryReceipt.logs, 'ContractInstantiation', { sender: owner });
      (await this.factory.beneficiaryInstantiations(beneficiary, 0))
        .should.be.equal(event.args.instantiation);
    });

    it('should have only one instantiation', async function () {
      await (this.factory.beneficiaryInstantiations(beneficiary, 1))
        .should.be.rejectedWith(EVMThrow);
    });

    describe('when child contract exists as TokenTimelock', function () {
      beforeEach(async function () {
        const event = inLogs(this.factoryReceipt.logs, 'ContractInstantiation', { sender: owner });
        this.timelock = await TokenTimelock.at(event.args.instantiation);
        await this.token.transfer(this.timelock.address, amount, { from: owner });
      });

      it('cannot be released before time limit', async function () {
        await (this.timelock.release())
          .should.be.rejectedWith(EVMRevert);
        (await this.token.balanceOf(beneficiary))
          .should.be.bignumber.equal(0);
      });

      it('cannot be released just before time limit', async function () {
        await increaseTimeTo(this.releaseTime - duration.seconds(3));

        await (this.timelock.release())
          .should.be.rejectedWith(EVMRevert);
        (await this.token.balanceOf(beneficiary))
          .should.be.bignumber.equal(0);
      });

      it('can be released just after limit', async function () {
        await increaseTimeTo(this.releaseTime + duration.seconds(1));

        await this.timelock.release();
        (await this.token.balanceOf(beneficiary))
          .should.be.bignumber.equal(amount);
      });

      it('can be released after time limit', async function () {
        await increaseTimeTo(this.releaseTime + duration.years(1));

        await this.timelock.release();
        (await this.token.balanceOf(beneficiary))
          .should.be.bignumber.equal(amount);
      });

      it('cannot be released twice', async function () {
        await increaseTimeTo(this.releaseTime + duration.years(1));

        await this.timelock.release();
        (await this.token.balanceOf(beneficiary))
          .should.be.bignumber.equal(amount);

        await (this.timelock.release())
          .should.be.rejectedWith(EVMRevert);
        (await this.token.balanceOf(beneficiary))
          .should.be.bignumber.equal(amount);
      });
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenTimelockFactory,
};
