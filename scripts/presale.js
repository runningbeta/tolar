const fs = require('fs');
const csv = require('csvtojson');
const minimist = require('minimist');
const { promisify } = require('util');
const { utils } = require('web3');
const { allValid } = require('./util/addresses');
const { logger, logScript, logTx } = require('./util/logs');
const to = require('./util/to');

const TokenDistributor = artifacts.require('TokenDistributor');

const SCRIPT_NAME = '[TokenDistributor] Presale script';

/**
 * Run this script by passing additional arguments
 * truffle exec ./scripts/presale.js --distributor 0xbd2e0bd... --data ./scripts/presale-sample.csv
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const accounts = await promisify(web3.eth.getAccounts)();
    logger.data(`Using owner: ${accounts[0]}`);

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    const fileName = args.data; // path to the CSV file
    logger.data(`Using distributor contract: ${distAddress}`);
    logger.data(`Reading presale data from: ${fileName}`);

    const csvFs = await fs.createReadStream(fileName);
    const presale = await csv({ eol: '\n' }).fromStream(csvFs);

    const ignoreChecksum = false;
    if (!allValid(presale.map(p => p.address), ignoreChecksum)) {
      throw new Error('Some addresses not valid');
    }

    const [ error, distributor ] = await to(TokenDistributor.at(distAddress));
    if (error) throw error;

    logger.data(`Issue presale tokens... [${presale.length}]\n`);
    const options = { from: accounts[0] };
    for (let i = 0; i < presale.length; i++) {
      const address = presale[i].address;
      const invested = presale[i].invested;
      const mainTokens = presale[i]['main-tokens'];
      const bonusTokens = presale[i]['bonus-tokens'];
      const data = distributor.contract.depositPresaleWithBonus['address,uint256,uint256,uint256']
        .getData(address, utils.toWei(mainTokens), utils.toWei(invested), utils.toWei(bonusTokens), options);
      await distributor.sendTransaction({ from: accounts[0], value: 0, data })
        .then(logTx);

      // Log Presale invesment
      logger.data(`Presale #${i}/${presale.length - 1} | ${address}`);
      logger.data(`  - Invested: ${invested} ETH | Bought: ${mainTokens} TOL | Bonus: ${bonusTokens} TOL\n`);
    }

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
