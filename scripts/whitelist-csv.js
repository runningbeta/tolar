const minimist = require('minimist');
const fs = require('fs');
const csv = require('csvtojson');
const { utils } = require('web3');
const { logger, logScript } = require('./util/logs');
const setGroupCap = require('./setGroupCap');

const TokenDistributor = artifacts.require('TokenDistributor');

const SCRIPT_NAME = '[TokenDistributor] Whitelist csv script';

/**
 * Run this script by passing additional arguments
 * truffle exec ./scripts/whitelist-csv.js --distributor ... --data ./scripts/presale-sample.csv --column ...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    const fileName = args.data; // path to the CSV file
    const columnName = args.column || 'address'; // column name
    logger.data(`Reading csv data from: ${fileName}`);

    const csvFs = await fs.createReadStream(fileName);
    const data = await csv({ eol: '\n' }).fromStream(csvFs);

    const distributor = await TokenDistributor.at(distAddress);

    if (distributor) {
      logger.data(`Whitelist accounts... [${data.length}]`);

      const addresses = [];
      for (let j = 0; j < data.length; j++) {
        const address = data[j][columnName];
        addresses.push(address);
      }

      const cap = utils.toWei('10', 'ether');
      await setGroupCap(distributor, addresses, cap);
    }

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
