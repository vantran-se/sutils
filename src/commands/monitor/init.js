const fs = require('fs');
const path = require('path');
const { SUTILS_DIR, DEFAULT_CONFIG } = require('../../paths');

function run() {
  if (fs.existsSync(DEFAULT_CONFIG)) {
    console.error(`config.yaml already exists at: ${DEFAULT_CONFIG}`);
    console.error('Remove it first or edit it directly.');
    process.exit(1);
  }

  fs.mkdirSync(SUTILS_DIR, { recursive: true });

  const src = path.join(__dirname, '..', '..', '..', 'config.example.yaml');
  fs.copyFileSync(src, DEFAULT_CONFIG);
  console.log(`Created config.yaml at: ${DEFAULT_CONFIG}`);
  console.log('Edit the file to set your ports, intervals, and shutdown command.');
  console.log('Then run: sutils monitor enable && sutils monitor start');
}

module.exports = { run };
