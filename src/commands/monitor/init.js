const fs = require('fs');
const path = require('path');

function run() {
  const dest = path.join(process.cwd(), 'config.yaml');

  if (fs.existsSync(dest)) {
    console.error(`config.yaml already exists at: ${dest}`);
    console.error('Remove it first or edit it directly.');
    process.exit(1);
  }

  const src = path.join(__dirname, '..', '..', '..', 'config.example.yaml');
  fs.copyFileSync(src, dest);
  console.log(`Created config.yaml at: ${dest}`);
  console.log('Edit the file to set your ports, intervals, and shutdown command.');
  console.log('Then run: sutils monitor enable && sutils monitor start');
}

module.exports = { run };
