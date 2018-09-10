// to.js
module.exports = (promise) => promise.then(data => ([null, data])).catch(err => [err]);
