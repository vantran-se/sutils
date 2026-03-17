const os = require('os');
const path = require('path');

const SUTILS_DIR = path.join(os.homedir(), '.sutils');
const DEFAULT_CONFIG = path.join(SUTILS_DIR, 'config.yaml');

module.exports = { SUTILS_DIR, DEFAULT_CONFIG };
