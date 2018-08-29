const { inLogs } = require('../helpers/expectEvent');
const { EVMRevert } = require('../helpers/EVMRevert');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeTokenEscrow (owner, [payee1, payee2]) {
  const amount = ether(42.0);

  describe('as a TokenEscrow', function () {
    describe('deposits', function () {
      it('can accept a single deposit', async function () {
        await this.token.approve(this.escrow.address, amount, { from: owner });
        await this.escrow.deposit(payee1, amount, { from: owner });

        (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(amount);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount);
      });

      it('can accept an empty deposit', async function () {
        await this.escrow.deposit(payee1, 0, { from: owner });
        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(0);
      });

      it('only the owner can deposit', async function () {
        await (this.escrow.deposit(payee1, 1, { from: payee2 })).should.be.rejectedWith(EVMRevert);
      });

      it('fails to deposit if escrow balance is too low', async function () {
        await (this.escrow.deposit(payee1, amount, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to deposit to 0x0', async function () {
        await this.token.approve(this.escrow.address, amount, { from: owner });
        await (this.escrow.deposit(0x0, amount, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('emits a deposited event', async function () {
        await this.token.approve(this.escrow.address, amount, { from: owner });
        const { logs } = await this.escrow.deposit(payee1, amount, { from: owner });

        const event = inLogs(logs, 'Deposited', { payee: payee1 });
        event.args.amount.should.be.bignumber.equal(amount);
      });

      it('can add multiple deposits on a single account', async function () {
        await this.token.approve(this.escrow.address, amount * 3, { from: owner });
        await this.escrow.deposit(payee1, amount, { from: owner });
        await this.escrow.deposit(payee1, amount * 2, { from: owner });

        (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(amount * 3);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount * 3);
      });

      it('can track deposits to multiple accounts', async function () {
        await this.token.approve(this.escrow.address, amount * 3, { from: owner });
        await this.escrow.deposit(payee1, amount, { from: owner });
        await this.escrow.deposit(payee2, amount * 2, { from: owner });

        (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(amount * 3);

        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(amount);
        (await this.escrow.depositsOf(payee2)).should.be.bignumber.equal(amount * 2);
      });
    });

    describe('withdrawals', async function () {
      it('can withdraw payments', async function () {
        const payeeInitialBalance = await this.token.balanceOf(payee1);

        await this.token.approve(this.escrow.address, amount, { from: owner });
        await this.escrow.deposit(payee1, amount, { from: owner });
        await this.escrow.withdraw(payee1, { from: owner });

        (await this.token.balanceOf(this.escrow.address)).should.be.bignumber.equal(0);
        (await this.escrow.depositsOf(payee1)).should.be.bignumber.equal(0);

        const payeeFinalBalance = await this.token.balanceOf(payee1);
        payeeFinalBalance.sub(payeeInitialBalance).should.be.bignumber.equal(amount);
      });

      it('can do an empty withdrawal', async function () {
        await this.escrow.withdraw(payee1, { from: owner });
      });

      it('only the owner can withdraw', async function () {
        await (this.escrow.withdraw(payee1, { from: payee1 })).should.be.rejectedWith(EVMRevert);
      });

      it('emits a withdrawn event', async function () {
        await this.token.approve(this.escrow.address, amount, { from: owner });
        await this.escrow.deposit(payee1, amount, { from: owner });
        const { logs } = await this.escrow.withdraw(payee1, { from: owner });

        const event = inLogs(logs, 'Withdrawn', { payee: payee1 });
        event.args.amount.should.be.bignumber.equal(amount);
      });
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenEscrow,
};
