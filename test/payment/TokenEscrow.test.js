const { EVMRevert } = require('../helpers/EVMRevert');

const { shouldBehaveLikeTokenEscrow } = require('./TokenEscrow.behaviour');

const Token = artifacts.require('TolarToken');
const TokenEscrow = artifacts.require('TokenEscrow');

contract('TokenEscrow', function ([_, owner, ...other]) {
  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
    this.escrow = await TokenEscrow.new(this.token.address, { from: owner });
  });

  it('fails if benefactor is zero address', async function () {
    await (TokenEscrow.new(0x0, { from: owner }))
      .should.be.rejectedWith(EVMRevert);
  });

  shouldBehaveLikeTokenEscrow(owner, other);
});
