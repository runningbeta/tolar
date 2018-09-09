const { utils } = require('web3');
const { logger } = require('./logs');

// filter and log any invalid addresses
const filterInvalid = (addresses, ignoreChecksum) => addresses
  .map(a => ignoreChecksum ? a.toLowerCase() : a)
  .filter(address => {
    const isValid = utils.isAddress(address);
    if (!isValid) logger.error(`Invalid address: ${address}`);
    return isValid;
  });

// check if all addresses are valid
const allValid = (addresses, ignoreChecksum) =>
  filterInvalid(addresses, ignoreChecksum).length === addresses.length;

module.exports = {
  filterInvalid,
  allValid,
};
