#!/usr/bin/env node

'use strict';

const program = require('commander');
const os = require('os');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('dxcf:cli:stack');
const chalk = require('chalk');

const env = require(path.join(__dirname, '..', 'lib', 'env'));
const util = require(path.join(__dirname, '..', 'lib', 'util'));
const config = require(path.join(__dirname, '..', 'lib', 'config'));
const stack = require(path.join(__dirname, '..', 'lib', 'commands', 'stack'));

const parseBool = (bool) => {
  const re=/^(true|1|on)$/i;
  return re.test(bool);
}

program.description('DXC Framework Stack Sub-Commands');

program.option('-v --verbose [false]', 'Verbose', parseBool, env.VERBOSE)
       .option('-c --confirm [false]', 'Confirm', parseBool, env.CONFIRM)
       .option('--home <path>', 'DXC Framework Home Directory', env.HOME)
       .option('--templates <path>', 'DXC Framework Templates Directory', env.TEMPLATES)
       .option('--functions <path>', 'DXC Framework Functions Directory', env.FUNCTIONS)
       .option('--scripts <path>', 'DXC Framework Scripts Directory', env.SCRIPTS)
       .option('--config <path>', 'DXC Framework Configuration Directory', env.CONFIG)
       .option('--owner <OWNER>', 'DXC Framework Owner Name', env.OWNER)
       .option('--company <COMPANY>', 'DXC Framework Company Name', env.COMPANY)
       .option('--system <SYSTEM>', 'DXC Framework System Name', env.SYSTEM)
       .option('--location <LOCATION>', 'DXC Framework Location Name', env.LOCATION)
       .option('--environment <ENVIRONMENT>', 'DXC Framework Environment Name', env.ENVIRONMENT)
       .option('--region <REGION>', 'DXC Framework Region Name', env.REGION)
       .option('--account <ACCOUNT>', 'DXC Framework Account Name', env.ACCOUNT)
       .option('--user <USER>', 'DXC Framework User Name', env.USER)

program.command('list')
       .description('DXC Framework List Stacks command')
       .option('-s, --stack-name <stack>', 'Stack name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .action(async (options) => {
          try {
            debug(`dxcf-stack list()`);
            util.debugOptions(options);
            config.load(options);
            process.exitCode = await stack.describeStacks(config);
          }
          catch (err) {
            console.error(chalk.red(err.message));
            process.exitCode = 999;
          }
        });

program.command('create')
       .description('DXC Framework Create Stack command')
       .option('-p --prerequisite [false]', 'Check Prerequisites', parseBool, env.PREREQUISITE)
       .option('-l --lambda [false]', 'Check for Lambda Functions', parseBool, env.LAMBDA)
       .option('-m --monitor [false]', 'Monitor Stack build', parseBool, env.MONITOR)
       .option('-w --wait [false]', 'Wait for Stack build', parseBool, env.WAIT)
       .option('-s --stack-name <stack>', 'Stack name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .option('-t --template-name <template>', 'Template name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .option('   --wait-interval <seconds>', 'Wait Interval', parseInt, 15)
       .action(async (options) => {
          try {
            debug(`dxcf-stack create()`);
            if (!options.stackName)
              throw new Error('--stack-name <stack> required');
            if (!options.templateName)
              throw new Error('--template-name <template> required');
            util.debugOptions(options);
            config.load(options);
            process.exitCode = await stack.createStack(config);
          }
          catch (err) {
            console.error(chalk.red(err.message));
            process.exitCode = 999;
          }
        });

program.parse(process.argv);

if (!program.commands.map(cmd => cmd._name).includes((program.args[0]) ? program.args[0]._name : undefined)) {
  program.outputHelp();
  process.exit(1);
}
