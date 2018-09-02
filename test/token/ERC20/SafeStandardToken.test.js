const { EVMRevert } = require('../../helpers/EVMRevert');
const { ether } = require('../../helpers/ether');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('SafeStandardTokenMock');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

contract('SafeStandardToken', function ([owner, alice, bob, ...other]) {
  const amount = ether(10.0);

  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
  });

  describe('transfer', function () {
    it('returns true on success', async function () {
      const transfered = await this.token.transfer.call(alice, amount, { from: owner });
      transfered.should.be.equal(true);

      await this.token.transfer(alice, amount, { from: owner });
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(amount);
    });

    it('fails to transfer tokens to 0x0', async function () {
      await (this.token.transfer(0x0, amount, { from: owner }))
        .should.be.rejectedWith(EVMRevert);

      (await this.token.balanceOf(0x0))
        .should.be.bignumber.equal(0);
    });

    it('fails to transfer tokens to token address', async function () {
      await (this.token.transfer(this.token.address, amount, { from: owner }))
        .should.be.rejectedWith(EVMRevert);

      (await this.token.balanceOf(this.token.address))
        .should.be.bignumber.equal(0);
    });
  });

  describe('transferFrom', function () {
    it('returns true on success', async function () {
      await this.token.approve(alice, amount, { from: owner });
      (await this.token.transferFrom.call(owner, bob, amount, { from: alice }))
        .should.be.equal(true);

      await this.token.transferFrom(owner, bob, amount, { from: alice });
      (await this.token.balanceOf(bob))
        .should.be.bignumber.equal(amount);
    });

    it('fails to transferFrom tokens to 0x0', async function () {
      await this.token.approve(alice, amount, { from: owner });
      await (this.token.transferFrom(owner, 0x0, amount, { from: alice }))
        .should.be.rejectedWith(EVMRevert);

      (await this.token.balanceOf(0x0))
        .should.be.bignumber.equal(0);
    });

    it('fails to transferFrom tokens to token address', async function () {
      await this.token.approve(alice, amount, { from: owner });
      await (this.token.transferFrom(owner, this.token.address, amount, { from: alice }))
        .should.be.rejectedWith(EVMRevert);

      (await this.token.balanceOf(this.token.address))
        .should.be.bignumber.equal(0);
    });
  });
});
