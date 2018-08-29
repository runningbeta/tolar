const { shouldBehaveLikeTokenTimelockFactory } = require('./TokenTimelockFactory.behaviour');

const Token = artifacts.require('TolarToken');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');

contract('TokenTimelockFactory', function ([_, owner, beneficiary, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
    this.factory = await TokenTimelockFactory.new({ from: owner });
  });

  shouldBehaveLikeTokenTimelockFactory(owner, beneficiary, otherAccounts);
});
