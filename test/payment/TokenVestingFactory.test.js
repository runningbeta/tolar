const { shouldBehaveLikeTokenVestingFactory } = require('./TokenVestingFactory.behaviour');

const TokenVestingFactory = artifacts.require('TokenVestingFactoryImpl');

contract('TokenVestingFactory', function ([_, owner, beneficiary, ...otherAccounts]) {
  beforeEach(async function () {
    this.factory = await TokenVestingFactory.new({ from: owner });
  });

  shouldBehaveLikeTokenVestingFactory(owner, beneficiary, otherAccounts);
});
