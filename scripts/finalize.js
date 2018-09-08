const minimist = require('minimist');
const inquirer = require('inquirer');
const { logger, logScript, logTx } = require('./util/logs');

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

    const args = minimist(process.argv.slice(2), { string: 'contract' });
    const address = args.contract;
    logger.data(`Using contract: ${address}`);

    const contract = await Finalizable.at(address);
    const isFinalized = await contract.isFinalized();
    if (isFinalized) {
      console.error('Finalization error!');
      console.error('Contract already finalized. Exiting...');
      return;
    }

    const message = `Please confirm that you want to finalize ${address} contract. This action is irrevocable!`;
    const answers = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message }]);

    if (answers.confirmed) {
      logger.data('Finalizing contract...');
      await contract.finalize().then(logTx);
      logger.data('Finalization success!');
    }

    callback();
  } catch (e) {
    logger.error(`${SCRIPT_NAME} error:`);
    callback(e);
  }
};
