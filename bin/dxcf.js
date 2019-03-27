#!/usr/bin/env node

'use strict';

const program = require('commander');
const path = require('path');

const dxcf = require(path.join(__dirname, '..', 'package.json'));

program
  .version(dxcf.version, '-v, --version')
  .description('DXC Framework CLI')
//  .command('bootstrap [cmd]', 'Bootstrap the DXC Framework')
  .command('stack [cmd]', 'Manage DXC Framework CloudFormation Stacks');
//  .command('bucket [cmd]', 'Manage DXC Framework S3 Buckets')
//  .command('manage [cmd]', 'Manage DXC Framework Resources');

program.parse(process.argv);

if (!program.commands.map(cmd => cmd._name).includes(program.args[0])) {
  program.outputHelp();
  process.exit(1);
}
