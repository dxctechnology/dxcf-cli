#!/usr/bin/env node

'use strict';

const program = require('commander');
const path = require('path');

const dxcf = require(path.join(__dirname, '..', 'package.json'));

const errors = require(path.join(__dirname, '..', 'lib', 'errors'));

program
  .version(dxcf.version, '-v, --version')
  .description('DXC Framework CLI')
//  .command('bootstrap [cmd]', 'Bootstrap the DXC Framework')
  .command('system [cmd]', 'Manage DXC Framework Systems')
  .command('account [cmd]', 'Manage DXC Framework Accounts')
  .command('region [cmd]', 'Manage DXC Framework Regions')
  .command('stack [cmd]', 'Manage DXC Framework Stacks');
//  .command('bucket [cmd]', 'Manage DXC Framework S3 Buckets')
//  .command('manage [cmd]', 'Manage DXC Framework Resources');

program.parse(process.argv);

if (!program.commands.map(cmd => cmd._name).includes(program.args[0])) {
  program.outputHelp();
  process.exit(errors.COMMAND_INVALID);
}
