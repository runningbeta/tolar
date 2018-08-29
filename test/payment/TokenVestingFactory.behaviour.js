const { duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeTokenVestingFactory (owner, beneficiary, otherAccounts) {
  describe('as a TokenVestingFactory', function () {
    let vestingStart;
    let vestingClif;
    let vestingDuration;

    beforeEach(async function () {
      vestingStart = (await latestTime());
      vestingClif = vestingStart + duration.days(2);
      vestingDuration = vestingClif + duration.days(4);
    });

    it('can create TokenVesting contracts', async function () {
      await this.factory.create(beneficiary, vestingStart, vestingClif, vestingDuration, false, { from: owner });
    });

    it('can count istantiatinos', async function () {
      await this.factory.create(beneficiary, vestingStart, vestingClif, vestingDuration, false, { from: owner });
      (await this.factory.getInstantiationCount(owner)).should.be.bignumber.equal(1);
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenVestingFactory,
};
