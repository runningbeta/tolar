const minimist = require('minimist');
const moment = require('moment');
const { promisify } = require('util');
const { logger, logScript, logTx } = require('./util/logs');
const config = require('./config');

const TokenDistributor = artifacts.require('TokenDistributor');
const Token = artifacts.require('ERC20');

const SCRIPT_NAME = '[TokenDistributor] Distribute team tokens';

module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const accounts = await promisify(web3.eth.getAccounts)();
    logger.data(`Using account: ${accounts[0]}`);

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    logger.data(`Using distributor: ${args.distributor}`);
    if (!args.distributor) {
      console.error('Error: unknown distributor');
      return;
    }

    const distributor = await TokenDistributor.at(args.distributor);
    const tokenAddr = await distributor.token();
    const token = await Token.at(tokenAddr);

    logger.data('Locking tokens into escrow...\n');
    const totalSupply = await token.totalSupply();
    for (let i = 0; i < config.escrow.length; i++) {
      const escrow = config.escrow[i];
      const escrowAmount = totalSupply.mul(escrow.amount);
      // eslint-disable-next-line
      logger.data(`[TokenDistributor] Deposit ${escrow.amount * 100}% for ${escrow.id} and lock until ${moment.unix(escrow.duration)}`);
      const receipt = await distributor.depositAndLock(escrow.address, escrowAmount, escrow.duration)
        .then(logTx);
      const timelockAddr = receipt.logs[0].args.instantiation;
      logger.data(`Locked ${escrowAmount.div(1e+18).toFormat()} TOL tokens at: ${timelockAddr}\n`);
    }

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
