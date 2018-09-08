const { utils } = require('web3');
const { chalk } = require('./logs');

// filter and log any invalid addresses
const filterInvalid = (addresses, ignoreChecksum) => addresses
  .map(a => ignoreChecksum ? a.toLowerCase() : a)
  .filter(address => {
    const isValid = utils.isAddress(address);
    if (!isValid) console.error(chalk.red(`Invalid address: ${address}`));
    return isValid;
  });

module.exports = {
  filterInvalid,
};
