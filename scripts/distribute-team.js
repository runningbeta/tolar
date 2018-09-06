const minimist = require('minimist');
const moment = require('moment');
const { promisify } = require('util');
const { logScript, logTx } = require('./util/logs');
const config = require('./config');

const TokenDistributor = artifacts.require('TokenDistributor');
const Token = artifacts.require('ERC20');

module.exports = async function (callback) {
  try {
    logScript('Distribute team tokens');

    const accounts = await promisify(web3.eth.getAccounts)();
    console.log(`Using account: ${accounts[0]}`);

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    console.log(`Using distributor: ${args.distributor}`);
    if (!args.distributor) {
      console.error('Error: unknown distributor');
      return;
    }

    const distributor = await TokenDistributor.at(args.distributor);
    const tokenAddr = await distributor.token();
    const token = await Token.at(tokenAddr);

    console.log('Locking tokens into escrow...\n');
    const totalSupply = await token.totalSupply();
    for (let i = 0; i < config.escrow.length; i++) {
      const escrow = config.escrow[i];
      const escrowAmount = totalSupply.mul(escrow.amount);
      // eslint-disable-next-line
      console.log(`[TokenDistributor] Deposit ${escrow.amount}% for ${escrow.id} and lock until ${moment.unix(escrow.duration)}`);
      const receipt = await distributor.depositAndLock(escrow.address, escrowAmount, escrow.duration)
        .then(logTx);
      const timelockAddr = receipt.logs[0].args.instantiation;
      console.log(`Locked ${escrowAmount.div(1e+18).toFormat()} TOL tokens at: ${timelockAddr}\n`);
    }

    callback();
  } catch (e) {
    callback(e);
  }
};
