const minimist = require('minimist');
const moment = require('moment');
const { utils } = require('web3');
const { promisify } = require('util');
const { logger, logScript, logContract, logTx } = require('./util/logs');
const config = require('./config');

const TokenDistributor = artifacts.require('TokenDistributor');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');

const SCRIPT_NAME = 'Deploy script';

module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const accounts = await promisify(web3.eth.getAccounts)();
    const owner = accounts[0];
    logger.data(`Using owner: ${owner}`);

    const args = minimist(process.argv.slice(2), { string: 'wallet' });
    logger.data(`Using wallet: ${args.wallet}`);
    if (!args.wallet) {
      logger.error('Error: unknown wallet');
      callback();
      return;
    }

    const BigNumber = web3.BigNumber;

    const Token = artifacts.require(config.token);
    if (Token) {
      // Deploy token contract
      logger.data('\n');
      logger.data(`[${config.token}] Deploying...`);
      const token = await Token.new()
        .then(logContract);

      logger.data('\n');
      logger.data('[TokenDistributor] Deploying with params:');
      logger.data(` - _benefactor: ${owner}`);
      logger.data(` - _rate: ${config.rate}`);
      logger.data(` - _wallet: ${args.wallet}`);
      logger.data(` - _token: ${token.address}`);
      logger.data(` - _cap: ${config.cap} [${utils.fromWei(config.cap)} ETH]`);
      logger.data(` - _openingTime: ${config.openingTime} [${moment.unix(config.openingTime)}]`);
      logger.data(` - _closingTime: ${config.closingTime} [${moment.unix(config.closingTime)}]`);
      logger.data(` - _withdrawTime: ${config.withdrawTime} [${moment.unix(config.withdrawTime)}]`);
      logger.data(` - _bonusTime: ${config.bonusTime} [${moment.unix(config.bonusTime)}]`);

      const params = [
        owner, // benefactor
        new BigNumber(config.rate),
        args.wallet,
        token.address,
        new BigNumber(config.cap),
        config.openingTime,
        config.closingTime,
        config.withdrawTime,
        config.bonusTime,
      ];

      const distributor = await TokenDistributor.new(...params)
        .then(logContract);

      logger.data('\n');
      logger.data('[TokenTimelockFactory] Deploying...');
      const timelockFactory = await TokenTimelockFactory.new()
        .then(logContract);

      logger.data('\n');
      logger.data('[TokenDistributor] Setting TokenTimelockFactory...');
      await distributor.setTokenTimelockFactory(timelockFactory.address)
        .then(logTx);
      logger.data('Timelock factory set.');

      logger.data('\n');
      logger.data(`[${config.token}] Approving distributor for 100% funds...`);
      const balanceOfBenefactor = await token.balanceOf(owner);
      await token.approve(distributor.address, balanceOfBenefactor)
        .then(logTx);
      logger.data(`[${config.token}] Distributor ${distributor.address} approved for ${balanceOfBenefactor} TOL.\n`);
    }

    setTimeout(() => callback(), 1000);
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    setTimeout(() => callback(e), 1000);
  }
};
