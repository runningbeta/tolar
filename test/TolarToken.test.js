const { expectThrow } = require('./helpers/expectThrow');
const { EVMRevert } = require('./helpers/EVMRevert');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('TolarToken');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const TOTAL_SUPPLY = 1000000000 * (10 ** 18);
const INITIAL_SUPPLY = TOTAL_SUPPLY;

contract('TolarToken', function ([owner, alice, bob, ...other]) {
  const amount = ether(1000.0);

  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
  });

  it(`total suply is ${INITIAL_SUPPLY}`, async function () {
    (await this.token.totalSupply())
      .should.be.bignumber.equal(INITIAL_SUPPLY);
  });

  it('owner owns all the tokens', async function () {
    (await this.token.balanceOf(owner))
      .should.be.bignumber.equal(TOTAL_SUPPLY);
  });

  it('refuses ether', async function () {
    await (this.token.send(ether(1), { from: owner }))
      .should.be.rejectedWith(EVMRevert);
  });

  describe('as Finalizable Burnable Token', function () {
    beforeEach(async function () {
      await this.token.transfer(alice, amount, { from: owner });
    });

    const ownerCanBurn = async function () {
      const amount = ether(1000.0);
      await this.token.approve(owner, amount, { from: alice });
      const totalSupply = await this.token.totalSupply();

      await this.token.burnFrom(alice, amount, { from: owner });
      (await this.token.totalSupply())
        .should.be.bignumber.equal(totalSupply.sub(amount));
    };

    describe('when not finalized', function () {
      it('owner can burn tokens', ownerCanBurn);

      it('other fail to burn tokens', async function () {
        const amount = ether(1000.0);
        await this.token.approve(bob, amount, { from: alice });
        await expectThrow(() => this.token.burnFrom(alice, amount, { from: bob }), EVMRevert);
        await expectThrow(() => this.token.burn(amount, { from: alice }), EVMRevert);
      });
    });

    describe('when finalized', function () {
      beforeEach(async function () {
        await this.token.finalize({ from: owner });
      });

      it('should return unpaused', async function () {
        await this.token.isFinalized()
          .should.eventually.equal(true);
      });

      it('owner can burn tokens', ownerCanBurn);

      it('fails to burn tokens if not approved', async function () {
        await expectThrow(() => this.token.burnFrom(alice, amount, { from: owner }), EVMRevert);
      });

      it('can burn own tokens', async function () {
        const initialBalance = await this.token.balanceOf(owner);
        await this.token.approve(owner, amount, { from: owner });
        await this.token.burnFrom(owner, amount, { from: owner });

        (await this.token.balanceOf(owner))
          .should.be.bignumber.equal(initialBalance.sub(amount));
      });

      it('can burn all approved tokens', async function () {
        await this.token.approve(owner, amount, { from: alice });
        await this.token.burnFrom(alice, amount, { from: owner });

        (await this.token.balanceOf(alice))
          .should.be.bignumber.equal(0);
      });

      it('can burn some approved tokens', async function () {
        await this.token.approve(owner, amount, { from: alice });
        await this.token.burnFrom(alice, amount.div(2), { from: owner });

        (await this.token.allowance(alice, owner))
          .should.be.bignumber.equal(amount.div(2));
      });

      it('fails to burn more than approved amount', async function () {
        await this.token.approve(owner, amount, { from: alice });
        await expectThrow(() => this.token.burnFrom(alice, amount.mul(2), { from: owner }), EVMRevert);
      });
    });
  });
});
