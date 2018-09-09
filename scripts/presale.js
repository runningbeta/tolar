const fs = require('fs');
const csv = require('csvtojson');
const minimist = require('minimist');
const { promisify } = require('util');
const { utils } = require('web3');
const { allValid } = require('./util/addresses');
const { logger, logScript, logTx } = require('./util/logs');

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

    const distributor = await TokenDistributor.at(distAddress);

    if (distributor) {
      logger.data(`Issue presale tokens... [${presale.length}]\n`);

      const options = { from: accounts[0] };
      for (let i = 0; i < presale.length; i++) {
        const sale = presale[i];
        const data = distributor.contract.depositPresaleWithBonus['address,uint256,uint256,uint256']
          .getData(sale.address, sale.tokens, sale.wei, sale.bonus, options);
        await distributor.sendTransaction({ from: accounts[0], value: 0, data })
          .then(logTx);

        // Log Presale invesment
        logger.data(`Presale #${i} | ${sale.address}`);
        const totalETH = `${utils.fromWei(sale.wei)} ETH`;
        const totalTOL = `${utils.fromWei(sale.tokens)} TOL`;
        const totalBonus = `${utils.fromWei(sale.bonus)} TOL`;
        logger.data(`  - Invested: ${totalETH} | Bought: ${totalTOL} | Bonus: ${totalBonus}\n`);
      }
    }
    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
