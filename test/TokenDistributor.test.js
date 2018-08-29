const { inLogs, notInLogs } = require('./helpers/expectEvent');
const { expectThrow } = require('./helpers/expectThrow');
const { duration, increaseTimeTo } = require('./helpers/increaseTime');
const { advanceBlock } = require('./helpers/advanceToBlock');
const { latestTime } = require('./helpers/latestTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const Token = artifacts.require('TolarToken');
const TokenDistributor = artifacts.require('TokenDistributor');

const TokenTimelock = artifacts.require('TokenTimelock');
const TokenVesting = artifacts.require('TokenVesting');

const TokenVestingFactory = artifacts.require('TokenVestingFactoryImpl');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');

contract('TokenDistributor', function ([_, benefactor, owner, customer, wallet, ...otherAccounts]) {
  const amount = ether(500.0);
  const weiAmount = ether(42.0);
  const rate = new BigNumber(1000);
  const cap = ether(42.0 * 6);

  beforeEach(async function () {
    (await advanceBlock()); // get blocks in sync with now
    this.now = (await latestTime());
    this.openingTime = this.now + duration.days(1);
    this.closingTime = this.openingTime + duration.days(2);
    this.withdrawTime = this.closingTime + duration.days(2);

    this.releaseTime = this.closingTime + duration.days(5);
    this.bonusTime = this.closingTime + duration.days(10);

    this.cliffTime = duration.days(2);
    this.durationTime = duration.days(10);

    this.token = await Token.new({ from: benefactor });
    this.distributor = await TokenDistributor.new(
      benefactor,
      rate,
      wallet,
      this.token.address,
      cap,
      this.openingTime,
      this.closingTime,
      this.withdrawTime,
      this.bonusTime,
      { from: owner }
    );
  });

  describe('when creating', function () {
    it('fails if benefactor address is 0x0', async function () {
      await (TokenDistributor.new(
        0x0,
        rate,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.withdrawTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if rate is zero', async function () {
      await (TokenDistributor.new(
        benefactor,
        0,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.withdrawTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if wallet address is 0x0', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        0x0,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.withdrawTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if token contract address is 0x0', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        0x0,
        cap,
        this.openingTime,
        this.closingTime,
        this.withdrawTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if cap is 0', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        0,
        this.openingTime,
        this.closingTime,
        this.withdrawTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if opening time has passed', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        cap,
        this.now,
        this.closingTime,
        this.withdrawTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if opening time if after closing time', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.now,
        this.withdrawTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if withdraw time if before closing time', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.now,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if bonus time if before closing time', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.withdrawTime,
        this.now,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('as a Crowdsale Factory', function () {
    describe('as a Presale Escrow', function () {
      it('can deposit presale tokens LoE to cap', async function () {
        await this.token.approve(this.distributor.address, amount, { from: benefactor });
        await this.distributor.contract
          .depositPresale['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });
      });

      it('fail to deposit bonus tokens above allowance', async function () {
        await this.token.approve(this.distributor.address, amount, { from: benefactor });
        const options = { from: owner, gas: 500000 };
        await expectThrow(() => this.distributor.contract
          .depositPresale['address,uint256,uint256'](customer, amount.mul(2), weiAmount, options), EVMRevert);
      });

      it('fail to deposit presale tokens above cap', async function () {
        await this.token.approve(this.distributor.address, amount.mul(10), { from: benefactor });
        const options = { from: owner, gas: 500000 };
        await expectThrow(() => this.distributor.contract
          .depositPresale['address,uint256,uint256'](customer, amount.mul(7), weiAmount.mul(7), options), EVMRevert);
      });

      describe('after Finalization', function () {
        beforeEach(async function () {
          await this.token.approve(this.distributor.address, amount, { from: benefactor });
          await this.distributor.contract.depositPresale['address,uint256,uint256'](
            customer,
            amount.div(2),
            weiAmount.div(2),
            { from: owner, gas: 500000 }
          );
          await this.distributor.finalize({ from: owner });
        });

        it('fails to deposit more presale tokens', async function () {
          const options = { from: owner, gas: 500000 };
          await expectThrow(() => this.distributor.contract
            .depositPresale['address,uint256,uint256'](customer, amount.div(2), weiAmount.div(2), options), EVMRevert);
        });

        describe('after withdraw time', function () {
          beforeEach(async function () {
            (await increaseTimeTo(this.withdrawTime + 1));
          });

          it('can withdraw presale tokens for himself', async function () {
            await this.distributor.contract.withdrawPresale['']({ from: customer, gas: 500000 });
            (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount.div(2));
          });

          it('can withdraw presale tokens for others', async function () {
            // eslint-disable-next-line dot-notation
            await this.distributor.contract.withdrawPresale['address'](customer, { from: owner, gas: 500000 });
            (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount.div(2));
          });

          it('can withdraw presale tokens for others', async function () {
            await this.distributor.contract.withdrawPresale['address[]']([customer], { from: owner, gas: 500000 });
            (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount.div(2));
          });
        });
      });
    });

    describe('as a Bonus Escrow', function () {
      it('can deposit bonus tokens LoE to cap', async function () {
        await this.token.approve(this.distributor.address, amount, { from: benefactor });
        await this.distributor.depositBonus(customer, amount, { from: owner });
      });

      it('fail to deposit bonus tokens above allowance', async function () {
        await this.token.approve(this.distributor.address, amount, { from: benefactor });
        await (this.distributor.depositBonus(customer, amount.mul(2), { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      describe('after Finalization', function () {
        beforeEach(async function () {
          await this.token.approve(this.distributor.address, amount, { from: benefactor });
          await this.distributor.depositBonus(customer, amount.div(2), { from: owner });
          await this.distributor.finalize({ from: owner });
        });

        it('fails to deposit more bonus tokens', async function () {
          await (this.distributor.depositBonus(customer, amount.div(2), { from: owner }))
            .should.be.rejectedWith(EVMRevert);
        });

        describe('after withdraw time', function () {
          beforeEach(async function () {
            (await increaseTimeTo(this.bonusTime + 1));
          });

          it('can withdraw bonus tokens for himself', async function () {
            await this.distributor.contract.withdrawBonus['']({ from: customer, gas: 500000 });
            (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount.div(2));
          });

          it('can withdraw bonus tokens for others', async function () {
            // eslint-disable-next-line dot-notation
            await this.distributor.contract.withdrawBonus['address'](customer, { from: owner, gas: 500000 });
            (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount.div(2));
          });

          it('can withdraw bonus tokens for multiple others', async function () {
            await this.distributor.contract.withdrawBonus['address[]']([customer], { from: owner, gas: 500000 });
            (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount.div(2));
          });
        });
      });
    });
  });

  describe('as an IndividuallyCappedCrowdsale proxy', function () {
    it('fails to whitelist a user', async function () {
      await expectThrow(() => this.distributor.setUserCap(customer, weiAmount, { from: owner }), EVMRevert);
    });

    it('fails to whitelist a group', async function () {
      await expectThrow(() => this.distributor.setGroupCap(otherAccounts, weiAmount, { from: owner }), EVMRevert);
    });

    describe('after Finalization', function () {
      beforeEach(async function () {
        await this.token.approve(this.distributor.address, amount.mul(4), { from: benefactor });
        await this.distributor.finalize({ from: owner });
      });

      it('can whitelist users', async function () {
        await this.distributor.setUserCap(customer, weiAmount, { from: owner });
        (await this.distributor.getUserCap(customer)).should.bignumber.equal(weiAmount);
      });

      it('can whitelist groups', async function () {
        await this.distributor.setGroupCap(otherAccounts, weiAmount, { from: owner });
        (await this.distributor.getUserCap(otherAccounts[0])).should.bignumber.equal(weiAmount);
      });

      describe('before Crowdsale', function () {
        it('fails to claim leftover tokens', async function () {
          await expectThrow(() => this.distributor.claimUnsold(benefactor, { from: owner }), EVMRevert);
        });
      });

      describe('during Crowdsale', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.openingTime + 1);
        });

        it('fails to claim leftover tokens', async function () {
          await expectThrow(() => this.distributor.claimUnsold(benefactor, { from: owner }), EVMRevert);
        });
      });

      describe('after Crowdsale', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.closingTime + 1);
        });

        it('can claim leftover tokens', async function () {
          const initialBalance = await this.token.balanceOf(benefactor);
          await this.distributor.claimUnsold(benefactor, { from: owner });

          const finalBalance = await this.token.balanceOf(benefactor);
          // we had only no issuances after giving allowance (amount * 4)
          await (finalBalance.should.be.bignumber.equal(amount.mul(4).plus(initialBalance)));
        });

        it('can claim leftover tokens twice', async function () {
          await this.distributor.claimUnsold(benefactor, { from: owner });
          // token balance is zero, can be called again
          await this.distributor.claimUnsold(benefactor, { from: owner });
        });
      });
    });
  });

  describe('as a TokenTimelockFactory proxy', function () {
    it('can set Token Timelock Factory', async function () {
      const timelockFactory = await TokenTimelockFactory.new({ from: owner });
      await this.distributor.setTokenTimelockFactory(timelockFactory.address, { from: owner });
    });

    describe('when TimelockFactory set', function () {
      beforeEach(async function () {
        const timelockFactory = await TokenTimelockFactory.new({ from: owner });
        await this.distributor.setTokenTimelockFactory(timelockFactory.address, { from: owner });
        await this.token.approve(this.distributor.address, amount.div(10), { from: benefactor });
      });

      it('fails to reset Token Timelock Factory to another address', async function () {
        const timelockFactory = await TokenTimelockFactory.new({ from: owner });
        await (this.distributor.setTokenTimelockFactory(timelockFactory.address, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to reset Token Timelock Factory to 0x0', async function () {
        await (this.distributor.setTokenTimelockFactory(0x0, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('can deposit and lock tokens', async function () {
        const { logs } = await this.distributor
          .depositAndLock(customer, amount.div(10), this.releaseTime, { from: owner });
        const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
        const walletAddr = event.args.instantiation;

        (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(10));
        (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);
      });

      it('fails to deposit more than approved', async function () {
        await (this.distributor.depositAndLock(customer, amount.div(5), this.releaseTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to deposit to 0x0', async function () {
        await (this.distributor.depositAndLock(0x0, amount.div(10), this.releaseTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to deposit with release time before withdraw time', async function () {
        await (this.distributor.depositAndLock(customer, amount.div(10), this.now, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('can deposit twice to same user', async function () {
        // First deposit
        const resp1 = await this.distributor
          .depositAndLock(customer, amount.div(100), this.releaseTime, { from: owner });
        let event = inLogs(resp1.logs, 'ContractInstantiation', { sender: this.distributor.address });
        let walletAddr = event.args.instantiation;

        (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(100));
        (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);

        // Second deposit
        const resp2 = await this.distributor
          .depositAndLock(customer, amount.div(200), this.releaseTime + duration.days(10), { from: owner });
        event = inLogs(resp2.logs, 'ContractInstantiation', { sender: this.distributor.address });
        walletAddr = event.args.instantiation;

        (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(200));
        (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);
      });

      it('fails to withdraw', async function () {
        const { logs } = await this.distributor
          .depositAndLock(customer, amount.div(10), this.releaseTime, { from: owner });
        const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
        const walletAddr = event.args.instantiation;

        (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(10));
        (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);
        await (TokenTimelock.at(walletAddr).release({ from: customer })).should.be.rejectedWith(EVMRevert);
      });

      describe('after release time', async function () {
        beforeEach(async function () {
          const { logs } = await this.distributor
            .depositAndLock(customer, amount.div(20), this.releaseTime, { from: owner });
          const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
          this.walletAddr = event.args.instantiation;

          (await increaseTimeTo(this.releaseTime + 1));
        });

        it('can withdraw', async function () {
          (await TokenTimelock.at(this.walletAddr).beneficiary()).should.be.equal(customer);

          await TokenTimelock.at(this.walletAddr).release({ from: customer });

          (await this.token.balanceOf(this.walletAddr)).should.bignumber.equal(0);
          (await this.token.balanceOf(customer)).should.bignumber.equal(amount.div(20));
        });
      });

      describe('after Finalization', function () {
        beforeEach(async function () {
          await this.distributor.finalize({ from: owner });
          await this.token.approve(this.distributor.address, amount.div(10), { from: benefactor });
        });

        it('fails to deposit and lock tokens', async function () {
          await (this.distributor.depositAndLock(customer, amount.div(10), this.releaseTime, { from: owner }))
            .should.be.rejectedWith(EVMRevert);
        });
      });
    });
  });

  describe('as a TokenVestingFactory proxy', function () {
    it('can set Token Vesting Factory', async function () {
      const vestingFactory = await TokenVestingFactory.new({ from: owner });
      await this.distributor.setTokenVestingFactory(vestingFactory.address, { from: owner });
    });

    describe('when VestingFactory set', function () {
      beforeEach(async function () {
        const vestingFactory = await TokenVestingFactory.new({ from: owner });
        await this.distributor.setTokenVestingFactory(vestingFactory.address, { from: owner });
        await this.token.approve(this.distributor.address, amount.div(10), { from: benefactor });
      });

      it('fails to reset Token Vesting Factory to another address', async function () {
        const vestingFactory = await TokenVestingFactory.new({ from: owner });
        await (this.distributor.setTokenVestingFactory(vestingFactory.address, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to reset Token Vesting Factory to 0x0', async function () {
        await (this.distributor.setTokenVestingFactory(0x0, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('can deposit and vest tokens', async function () {
        const { logs } = await this.distributor.depositAndVest(
          customer,
          amount.div(10),
          this.releaseTime,
          this.cliffTime,
          this.durationTime,
          { from: owner }
        );
        const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
        const walletAddr = event.args.instantiation;

        (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(10));
        (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);
      });

      it('fails to deposit to 0x0', async function () {
        await (this.distributor.depositAndVest(
          0x0,
          amount.div(10),
          this.releaseTime,
          this.cliffTime,
          this.durationTime,
          { from: owner }
        )).should.be.rejectedWith(EVMRevert);
      });

      it('fails to deposit with release time before withdraw time', async function () {
        await (this.distributor.depositAndVest(
          customer,
          amount.div(10),
          this.closingTime,
          0,
          0,
          { from: owner }
        )).should.be.rejectedWith(EVMRevert);
      });

      it('fails to deposit more than approved', async function () {
        await (this.distributor.depositAndVest(
          customer,
          amount.div(5),
          this.releaseTime,
          this.cliffTime,
          this.durationTime,
          { from: owner }
        )).should.be.rejectedWith(EVMRevert);
      });

      it('can deposit twice to same user', async function () {
        // First deposit
        const resp1 = await this.distributor.depositAndVest(
          customer,
          amount.div(100),
          this.releaseTime,
          this.cliffTime,
          this.durationTime,
          { from: owner }
        );
        let event = inLogs(resp1.logs, 'ContractInstantiation', { sender: this.distributor.address });
        let walletAddr = event.args.instantiation;

        (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(100));
        (await TokenVesting.at(walletAddr).beneficiary()).should.be.equal(customer);

        // Second deposit
        const resp2 = await this.distributor.depositAndVest(
          customer,
          amount.div(200),
          this.releaseTime,
          this.cliffTime,
          this.durationTime,
          { from: owner }
        );
        event = inLogs(resp2.logs, 'ContractInstantiation', { sender: this.distributor.address });
        walletAddr = event.args.instantiation;

        (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(200));
        (await TokenVesting.at(walletAddr).beneficiary()).should.be.equal(customer);
      });

      it('fails to withdraw', async function () {
        const { logs } = await this.distributor.depositAndVest(
          customer,
          amount.div(10),
          this.releaseTime,
          this.cliffTime,
          this.durationTime,
          { from: owner }
        );
        const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
        const walletAddr = event.args.instantiation;

        (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(10));
        (await TokenVesting.at(walletAddr).beneficiary()).should.be.equal(customer);
        await (TokenVesting.at(walletAddr).release(this.token.address, { from: customer }))
          .should.be.rejectedWith(EVMRevert);
      });

      describe('after duration time', async function () {
        beforeEach(async function () {
          const { logs } = await this.distributor.depositAndVest(
            customer,
            amount.div(20),
            this.releaseTime,
            this.cliffTime,
            this.durationTime,
            { from: owner }
          );
          const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
          this.walletAddr = event.args.instantiation;

          (await increaseTimeTo(this.releaseTime + this.durationTime + 1));
        });

        it('can withdraw', async function () {
          (await TokenVesting.at(this.walletAddr).beneficiary()).should.be.equal(customer);
          (await this.token.balanceOf(this.walletAddr)).should.bignumber.equal(amount.div(20));

          await TokenVesting.at(this.walletAddr).release(this.token.address, { from: customer });

          (await this.token.balanceOf(this.walletAddr)).should.bignumber.equal(0);
          (await this.token.balanceOf(customer)).should.bignumber.equal(amount.div(20));
        });
      });

      describe('after Finalization', function () {
        beforeEach(async function () {
          await this.distributor.finalize({ from: owner });
          await this.token.approve(this.distributor.address, amount.div(10), { from: benefactor });
        });

        it('fails to deposit and vest tokens', async function () {
          await (this.distributor.depositAndVest(
            customer,
            amount.div(10),
            this.releaseTime,
            this.cliffTime,
            this.durationTime,
            { from: owner }
          )).should.be.rejectedWith(EVMRevert);
        });
      });
    });
  });

  describe('as a Crowdsale Instatiator', function () {
    describe('after finalization', function () {
      beforeEach(async function () {
        await this.token.approve(this.distributor.address, amount.mul(4), { from: benefactor });
        await this.distributor.contract
          .depositPresale['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });
      });

      describe('if cap reached', function () {
        beforeEach(async function () {
          await this.distributor.contract
            .depositPresale['address,uint256,uint256'](
              otherAccounts[0],
              amount.mul(3),
              weiAmount.mul(5),
              { from: owner, gas: 500000 }
            );
          this.finalizationReceipt = await this.distributor.finalize({ from: owner });
        });

        it('there is no CrowdsaleInstantiated event', async function () {
          notInLogs(this.finalizationReceipt.logs, 'CrowdsaleInstantiated');
        });

        it('crowdsale address is 0x0', async function () {
          (await this.distributor.crowdsale()).should.equal('0x0000000000000000000000000000000000000000');
        });

        it('fails to whitelist a user', async function () {
          await expectThrow(() => this.distributor.setUserCap(customer, weiAmount, { from: owner }), EVMRevert);
        });
      });

      describe('if cap not reached', function () {
        beforeEach(async function () {
          this.finalizationReceipt = await this.distributor.finalize({ from: owner });
        });

        it('emits a CrowdsaleInstantiated event', async function () {
          inLogs(this.finalizationReceipt.logs, 'CrowdsaleInstantiated', { sender: owner });
        });

        it('instantiates the Crowdsale with correct allowance', async function () {
          const event = inLogs(this.finalizationReceipt.logs, 'CrowdsaleInstantiated', { sender: owner });
          event.args.allowance.should.be.bignumber.equal(amount.mul(3));
        });
      });
    });
  });
});
