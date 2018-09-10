const minimist = require('minimist');
const moment = require('moment');
const assert = require('assert');
const { utils } = require('web3');
const { promisify } = require('util');
const { allValid } = require('./util/addresses');
const { logger, logScript, logTx } = require('./util/logs');
const to = require('./util/to');

const config = require('./config');

const TokenDistributor = artifacts.require('TokenDistributor');
const Token = artifacts.require('ERC20');

const SCRIPT_NAME = '[TokenDistributor] Distribute team tokens';

module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const accounts = await promisify(web3.eth.getAccounts)();
    logger.data(`Using owner: ${accounts[0]}`);

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    logger.data(`Using distributor: ${args.distributor}`);
    if (!args.distributor) {
      logger.error('Error: unknown distributor');
      callback();
      return;
    }

    const ignoreChecksum = false;
    if (!allValid(config.escrow.map(p => p.address), ignoreChecksum)) {
      throw new Error('Some addresses not valid');
    }

    const [ error, distributor ] = await to(TokenDistributor.at(args.distributor));
    if (error) throw error;

    const tokenAddr = await distributor.token();
    const token = await Token.at(tokenAddr);

    logger.data('Locking tokens into escrow...\n');
    const totalSupply = await token.totalSupply();
    assert(totalSupply.toString(10) === config.totalSupply);

    for (let i = 0; i < config.escrow.length; i++) {
      const escrow = config.escrow[i];
      const escrowAmount = totalSupply.mul(escrow.percentage);
      // eslint-disable-next-line
      logger.data(`[TokenDistributor] Deposit ${escrow.percentage * 100}% for ${escrow.id} and lock until ${moment.unix(escrow.releaseTime)}`);
      const receipt = await distributor.depositAndLock(escrow.address, escrowAmount, escrow.releaseTime)
        .then(logTx);
      const timelockAddr = receipt.logs[0].args.instantiation;
      // eslint-disable-next-line
      logger.data(`Locked for ${escrow.address} total of ${utils.fromWei(escrowAmount.toString(10))} TOL tokens at: ${timelockAddr}\n`);
    }

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
