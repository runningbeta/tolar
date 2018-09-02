const { inLogs } = require('../helpers/expectEvent');
const { EVMRevert } = require('../helpers/EVMRevert');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const shouldBehaveLikeTokenEscrow = (owner, [alice, bob]) => {
  const amount = ether(42.0);

  describe('as a TokenEscrow', function () {
    describe('deposits', function () {
      beforeEach(async function () {
        await this.token.approve(this.escrow.address, amount, { from: owner });
      });

      it('can accept a single deposit', async function () {
        await this.escrow.deposit(alice, amount, { from: owner });

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(amount);
        (await this.escrow.depositsOf(alice))
          .should.be.bignumber.equal(amount);
      });

      it('can not accept an deposit for itself', async function () {
        await (this.escrow.deposit(this.escrow.address, amount, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('can accept an empty deposit', async function () {
        await this.escrow.deposit(alice, 0, { from: owner });

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(0);
        (await this.escrow.depositsOf(alice))
          .should.be.bignumber.equal(0);
      });

      it('only the owner can deposit', async function () {
        await (this.escrow.deposit(alice, 1, { from: bob }))
          .should.be.rejectedWith(EVMRevert);

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(0);
        (await this.escrow.depositsOf(alice))
          .should.be.bignumber.equal(0);
      });

      it('fails to deposit more than escrow allowance', async function () {
        await (this.escrow.deposit(alice, amount.mul(2), { from: owner }))
          .should.be.rejectedWith(EVMRevert);

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(0);
        (await this.escrow.depositsOf(alice))
          .should.be.bignumber.equal(0);
      });

      it('can increase escrow allowance', async function () {
        await this.token.increaseApproval(this.escrow.address, amount, { from: owner });
        const doubleAmount = amount.mul(2);
        await this.escrow.deposit(alice, doubleAmount, { from: owner });

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(doubleAmount);
        (await this.escrow.depositsOf(alice))
          .should.be.bignumber.equal(doubleAmount);
      });

      it('fails to deposit to 0x0', async function () {
        await (this.escrow.deposit(0x0, amount, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to deposit to escrow address', async function () {
        await (this.escrow.deposit(this.escrow.address, amount, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('emits a deposited event', async function () {
        const { logs } = await this.escrow.deposit(alice, amount, { from: owner });

        const event = inLogs(logs, 'Deposited', { payee: alice });
        event.args.amount.should.be.bignumber.equal(amount);
      });

      it('can add multiple deposits on a single account', async function () {
        await this.escrow.deposit(alice, amount.div(3), { from: owner });
        await this.escrow.deposit(alice, amount.div(3).mul(2), { from: owner });

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(amount);

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(amount);
        (await this.escrow.depositsOf(alice))
          .should.be.bignumber.equal(amount);
      });

      it('can track deposits to multiple accounts', async function () {
        await this.escrow.deposit(alice, amount.div(3), { from: owner });
        await this.escrow.deposit(bob, amount.div(3).mul(2), { from: owner });

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(amount);

        (await this.escrow.depositsOf(alice))
          .should.be.bignumber.equal(amount.div(3));
        (await this.escrow.depositsOf(bob))
          .should.be.bignumber.equal(amount.div(3).mul(2));
      });
    });

    describe('withdrawals', async function () {
      it('can withdraw payments', async function () {
        const payeeInitialBalance = await this.token.balanceOf(alice);

        await this.token.approve(this.escrow.address, amount, { from: owner });
        await this.escrow.deposit(alice, amount, { from: owner });
        await this.escrow.withdraw(alice, { from: owner });

        (await this.token.balanceOf(this.escrow.address))
          .should.be.bignumber.equal(0);
        (await this.escrow.depositsOf(alice))
          .should.be.bignumber.equal(0);

        (await this.token.balanceOf(alice))
          .sub(payeeInitialBalance)
          .should.be.bignumber.equal(amount);
      });

      it('can do an empty withdrawal', async function () {
        await this.escrow.withdraw(alice, { from: owner });
      });

      it('only the owner can withdraw', async function () {
        await (this.escrow.withdraw(alice, { from: alice }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('emits a withdrawn event', async function () {
        await this.token.approve(this.escrow.address, amount, { from: owner });
        await this.escrow.deposit(alice, amount, { from: owner });
        const { logs } = await this.escrow.withdraw(alice, { from: owner });

        const event = inLogs(logs, 'Withdrawn', { payee: alice });
        event.args.amount
          .should.be.bignumber.equal(amount);
      });
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenEscrow,
};
