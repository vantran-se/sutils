const initConfig = require('../../lib/initConfig');

function run() {
  initConfig('Edit the file to set your ports, intervals, and shutdown command, then run: sutils monitor enable && sutils monitor start');
}

module.exports = { run };
