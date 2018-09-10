const minimist = require('minimist');
const fs = require('fs');
const csv = require('csvtojson');
const { promisify } = require('util');
const { utils } = require('web3');
const { logger, logScript } = require('./util/logs');
const to = require('./util/to');

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

    const accounts = await promisify(web3.eth.getAccounts)();
    logger.data(`Using owner: ${accounts[0]}`);

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    const fileName = args.data; // path to the CSV file
    const columnName = args.column || 'address'; // column name
    logger.data(`Reading csv data from: ${fileName}`);

    const csvFs = await fs.createReadStream(fileName);
    const data = await csv({ eol: '\n' }).fromStream(csvFs);

    const [ error, distributor ] = await to(TokenDistributor.at(distAddress));
    if (error) throw error;

    logger.data(`Whitelist accounts... [${data.length}]`);

    const addresses = [];
    for (let i = 0; i < data.length; i++) {
      const address = data[i][columnName];
      addresses.push(address);
    }

    const cap = utils.toWei('10', 'ether');
    await setGroupCap(distributor, addresses, cap);

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
