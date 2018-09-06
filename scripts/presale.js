const fs = require('fs');
const csv = require('csvtojson');
const minimist = require('minimist');
const { promisify } = require('util');
const { utils } = require('web3');
const { logScript, logTx } = require('./util/logs');

const TokenDistributor = artifacts.require('TokenDistributor');

/**
 * Run this script by passing additional arguments
 * truffle exec ./scripts/presale.js --distributor 0xbd2e0bd... --data ./scripts/presale-sample.csv
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript('Presale script');

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    const fileName = args.data; // path to the CSV file
    console.log(`Using distributor contract: ${distAddress}`);
    console.log(`Reading presale data from: ${fileName}`);

    const csvFs = await fs.createReadStream(fileName);
    const presale = await csv({ eol: '\n' }).fromStream(csvFs);

    const distributor = await TokenDistributor.at(distAddress);

    if (distributor) {
      console.log(`Issue presale tokens... [${presale.length}]\n`);

      const accounts = await promisify(web3.eth.getAccounts)();
      const options = { from: accounts[0] };

      for (let j = 0; j < presale.length; j++) {
        const sale = presale[j];

        const data = distributor.contract.depositPresale['address,uint256,uint256']
          .getData(sale.address, sale.tokens, sale.wei, options);
        await distributor.sendTransaction({ from: accounts[0], value: 0, data })
          .then(logTx);
        await distributor.depositBonus(sale.address, sale.bonus)
          .then(logTx);

        // Log Presale invesment
        console.log(`Presale #${j} | ${sale.address}`);
        const totalETH = `${utils.fromWei(sale.wei)} ETH`;
        const totalTOL = `${utils.fromWei(sale.tokens)} TOL`;
        const totalBonus = `${utils.fromWei(sale.bonus)} TOL`;
        console.log(`  - Invested: ${totalETH} | Bought: ${totalTOL} | Bonus: ${totalBonus}\n`);
      }
    }
    callback();
  } catch (e) {
    callback(e);
  }
};
