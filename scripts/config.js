const moment = require('moment');
const { utils } = require('web3');

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};

const openingTime = moment('2018-09-15T14:00:00+00:00').unix();
const closingTime = moment('2018-09-20T14:00:00+00:00').unix();
const withdrawTime = moment('2018-09-30T14:00:00+00:00').unix();

const totalSupply = utils.toWei('1000000000', 'ether');

module.exports = {
  token: 'TolarToken',
  totalSupply,
  rate: 6894,
  cap: utils.toWei('45000', 'ether'),

  openingTime,
  closingTime,

  withdrawTime,
  bonusTime: withdrawTime + duration.days(90),

  escrow: [
    // founders 20%
    // 10% available after 2yr
    // 10% available after 2yr
    {
      id: 'founder_1',
      address: '0x03C3A6aa06d2130d67Ba62AcFdf6B0a311fee659',
      percentage: 0.1,
      releaseTime: closingTime + duration.years(2),
    },
    {
      id: 'founder_2',
      address: '0x3c9F55570fb4c3bb8e056AF064914f037E2a46D0',
      percentage: 0.1,
      releaseTime: closingTime + duration.years(2),
    },
    // development fund 32%
    //  2,5% available at withdraw time
    //  2,5% available after 1yr
    //  5% available after 2yr
    // 22% available after 3yr
    {
      id: 'dev_fund_unlocked',
      address: '0xCd5fb5D52eAd04Eb8349bEfA27cc935D931350B2',
      percentage: 0.025,
      releaseTime: withdrawTime,
    },
    {
      id: 'dev_fund_first_year',
      address: '0xCd5fb5D52eAd04Eb8349bEfA27cc935D931350B2',
      percentage: 0.025,
      releaseTime: closingTime + duration.years(1),
    },
    {
      id: 'dev_fund_second_year',
      address: '0xCd5fb5D52eAd04Eb8349bEfA27cc935D931350B2',
      percentage: 0.05,
      releaseTime: closingTime + duration.years(2),
    },
    {
      id: 'dev_fund_third_year',
      address: '0xCd5fb5D52eAd04Eb8349bEfA27cc935D931350B2',
      percentage: 0.22,
      releaseTime: closingTime + duration.years(3),
    },
    // node start fund 8%
    {
      id: 'nodes',
      address: '0x8D5A18803f7Ffc4c2905088FE701fBa489cFa2fb',
      percentage: 0.08,
      releaseTime: closingTime + duration.days(180),
    },
    // developers fund 2.5%
    {
      id: 'developers',
      address: '0xaA8e4669CB3bC17AFe6cD2DC36035CF01024b0B1',
      percentage: 0.025,
      releaseTime: closingTime + duration.years(2),
    },
    // developers fund 2.5%
    {
      id: 'advisors',
      address: '0x910270aCFb5B1b3c786168e4699B489B4097F6b2',
      percentage: 0.025,
      releaseTime: closingTime + duration.years(1),
    },
    // r8 fee
    {
      id: 'runningbeta',
      address: '0xdc89d568019aDe8fDAf8c2a052C730a02Eb6ADd0',
      percentage: 0.00189585,
      releaseTime: closingTime + duration.days(180),
    },
  ],
};
