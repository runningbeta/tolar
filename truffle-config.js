// trufle.js
// required for running ES6 tests
require('babel-register');
require('babel-polyfill');
require('dotenv').config();

const Web3 = require('web3');
const web3 = new Web3();

const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) => new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraEndpoint = network => `https://${network}.infura.io/${process.env.INFURA_API_KEY}`;

const infuraProvider = network =>
  providerWithMnemonic(process.env.MNEMONIC || '', infuraEndpoint(network));

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  migrations_directory: './migrations', // eslint-disable-line camelcase
  networks: {
    development: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8545,
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555, // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01, // <-- Use this low gas price
    },
    ganache: {
      host: '127.0.0.1',
      network_id: 5777, // eslint-disable-line camelcase
      port: 7545,
    },
    rinkeby: {
      provider: () => infuraProvider('rinkeby'),
      network_id: 4, // eslint-disable-line camelcase
      gas: 4700000,
      gasPrice: web3.utils.toWei('50', 'gwei'),
    },
    ropsten: {
      provider: () => infuraProvider('ropsten'),
      network_id: 3, // eslint-disable-line camelcase
      gas: 4700000,
      gasPrice: web3.utils.toWei('20', 'gwei'),
    },
    mainnet: {
      provider: () => infuraProvider('mainnet'),
      network_id: 1, // eslint-disable-line camelcase
      gas: 4712388,
      gasPrice: web3.utils.toWei('10', 'gwei'),
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 500,
    },
  },
};
