const { duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { EVMRevert } = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const shouldBehaveLikeTokenVestingFactory = (owner, beneficiary, other) => {
  describe('as a TokenVestingFactory', function () {
    let vestingStart;
    let vestingClif;
    let vestingDuration;

    beforeEach(async function () {
      vestingStart = (await latestTime());
      vestingClif = vestingStart + duration.days(2);
      vestingDuration = vestingClif + duration.days(4);
    });

    it('should not allow beneficiary 0x0', async function () {
      this.releaseTime = (await latestTime()) + duration.days(2);
      await (this.factory.create('0x0', vestingStart, vestingClif, vestingDuration, false, { from: owner }))
        .should.be.rejectedWith(EVMRevert);
    });

    it('should not allow beneficiary factory', async function () {
      this.releaseTime = (await latestTime()) + duration.days(2);
      const illegal = this.factory.address;
      await (this.factory.create(illegal, vestingStart, vestingClif, vestingDuration, false, { from: owner }))
        .should.be.rejectedWith(EVMRevert);
    });

    it('can create TokenVesting contracts', async function () {
      await this.factory.create(beneficiary, vestingStart, vestingClif, vestingDuration, false, { from: owner });
    });

    it('can count istantiatinos', async function () {
      await this.factory.create(beneficiary, vestingStart, vestingClif, vestingDuration, false, { from: owner });
      (await this.factory.getInstantiationCount(owner))
        .should.be.bignumber.equal(1);
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenVestingFactory,
};
