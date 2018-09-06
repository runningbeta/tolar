const minimist = require('minimist');
const moment = require('moment');
const { utils } = require('web3');
const { promisify } = require('util');
const { logScript, logContract, logTx } = require('./util/logs');
const config = require('./config');

const TokenDistributor = artifacts.require('TokenDistributor');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');

module.exports = async function (callback) {
  try {
    logScript('Deploy script');

    const accounts = await promisify(web3.eth.getAccounts)();
    const owner = accounts[0];
    console.log(`Using owner: ${owner}`);

    const args = minimist(process.argv.slice(2), { string: 'wallet' });
    console.log(`Using wallet: ${args.wallet}`);
    if (!args.wallet) {
      console.error('Error: unknown wallet');
      return;
    }

    const BigNumber = web3.BigNumber;

    const Token = artifacts.require(config.token);
    if (Token) {
      // Deploy token contract
      console.log();
      console.log(`[${config.token}] Deploying...`);
      const token = await Token.new()
        .then(logContract);

      console.log();
      console.log('[TokenTimelockFactory] Deploying...');
      const timelockFactory = await TokenTimelockFactory.new()
        .then(logContract);

      console.log();
      console.log('[TokenDistributor] Deploying with params:');
      console.log(` - _benefactor: ${owner}`);
      console.log(` - _rate: ${config.rate}`);
      console.log(` - _wallet: ${args.wallet}`);
      console.log(` - _token: ${token.address}`);
      console.log(` - _cap: ${config.cap} or ${utils.fromWei(config.cap)}`);
      console.log(` - _openingTime: ${config.openingTime} or ${moment.unix(config.openingTime)}`);
      console.log(` - _closingTime: ${config.closingTime} or ${moment.unix(config.closingTime)}`);
      console.log(` - _withdrawTime: ${config.withdrawTime} or ${moment.unix(config.withdrawTime)}`);
      console.log(` - _bonusTime: ${config.bonusTime} or ${moment.unix(config.bonusTime)}`);

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

      console.log();
      console.log('[TokenDistributor] Setting TokenTimelockFactory...');
      await distributor.setTokenTimelockFactory(timelockFactory.address)
        .then(logTx);
      console.log('Timelock factory set.');

      console.log();
      console.log(`[${config.token}] Approving distributor for 100% funds...`);
      const balanceOfBenefactor = await token.balanceOf(owner);
      await token.approve(distributor.address, balanceOfBenefactor)
        .then(logTx);
      console.log(`[${config.token}] Distributor ${distributor.address} approved for ${balanceOfBenefactor} TOL.\n`);
    }

    callback();
  } catch (e) {
    callback(e);
  }
};
