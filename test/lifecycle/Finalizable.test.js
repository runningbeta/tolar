const { inLogs } = require('../helpers/expectEvent');
const { EVMRevert } = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const Finalizable = artifacts.require('FinalizableMock');

contract('Finalizable', function ([_, owner, ...other]) {
  beforeEach(async function () {
    this.contract = await Finalizable.new({ from: owner });
  });

  it('can be finalized', async function () {
    await this.contract.finalize({ from: owner });
    (await this.contract.isFinalized())
      .should.be.equal(true);
  });

  it('can execute onlyNotFinalized', async function () {
    await this.contract.notFinalized();
  });

  it('fails to execute onlyFinalized', async function () {
    await (this.contract.finalized())
      .should.be.rejectedWith(EVMRevert);
  });

  describe('when finalized', function () {
    beforeEach(async function () {
      const tx = await this.contract.finalize({ from: owner });
      this.logs = tx.logs;
    });

    it('logs finalized', async function () {
      inLogs(this.logs, 'Finalized');
    });

    it('cannot be finalized twice', async function () {
      await (this.contract.finalize({ from: owner }))
        .should.be.rejectedWith(EVMRevert);
    });

    it('fails to execute onlyNotFinalized', async function () {
      await (this.contract.notFinalized())
        .should.be.rejectedWith(EVMRevert);
    });

    it('can execute onlyFinalized', async function () {
      await this.contract.finalized();
    });
  });
});
