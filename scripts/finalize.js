const minimist = require('minimist');
const inquirer = require('inquirer');
const { promisify } = require('util');
const { logger, logScript, logTx } = require('./util/logs');
const to = require('./util/to');

const Finalizable = artifacts.require('Finalizable');

const SCRIPT_NAME = '[Finalizable] Finalization script';

/**
 * Script that can be used to finalize Finalizable contracts
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/finalize.js --contract 0xbd2e0bd...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    logScript(SCRIPT_NAME);

    const accounts = await promisify(web3.eth.getAccounts)();
    logger.data(`Using owner: ${accounts[0]}`);

    const args = minimist(process.argv.slice(2), { string: 'contract' });
    const address = args.contract;
    logger.data(`Using contract: ${address}`);

    const [ error, contract ] = await to(Finalizable.at(address));
    if (error) throw error;

    const isFinalized = await contract.isFinalized();
    if (isFinalized) {
      logger.error('Finalization error!');
      logger.error('Contract already finalized. Exiting...');
      setTimeout(() => callback(), 1000);
      return;
    }

    const message = `Please confirm that you want to finalize ${address} contract. This action is irrevocable!`;
    const answers = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message }]);

    if (answers.confirmed) {
      logger.data('Finalizing contract...');
      await contract.finalize().then(logTx);
      logger.data('Finalization success!');
    }

    setTimeout(() => callback(), 1000);
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    setTimeout(() => callback(e), 1000);
  }
};
