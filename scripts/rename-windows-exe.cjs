#!/usr/bin/env node
const fs = require('fs');
const config = require('../src-tauri/tauri.conf.json');
const { version } = require('../package.json');

let arch = process.arch;

if (arch.startsWith('i')) {
  arch = 'x86';
} else if (arch === 'aarch64') {
  arch = 'arm64';
} else {
  arch = 'x64';
}

fs.rename(
  `src-tauri/target/release/${config.package.productName}.exe`,
  `src-tauri/target/release/${config.package.productName}_${version}_${arch}.exe`,
  (err) => {
    if (err) throw err;
    console.log('Rename complete!');
  });