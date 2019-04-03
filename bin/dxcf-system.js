#!/usr/bin/env node

'use strict';

///////////////////////////////////////////////////////////////////////////////////////////////////
/////  Under Current Development - cloned from dxcf-stack, not fully designed/modified yet    /////
///////////////////////////////////////////////////////////////////////////////////////////////////

const program = require('commander');
const os = require('os');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('dxcf:cli:system');
const chalk = require('chalk');

const util = require(path.join(__dirname, '..', 'lib', 'util'));
const defaults = require(path.join(__dirname, '..', 'lib', 'defaults'));
const config = require(path.join(__dirname, '..', 'lib', 'config'));

const errors = require(path.join(__dirname, '..', 'lib', 'errors'));
const CommandError = require(path.join(__dirname, '..', 'lib', 'errors')).CommandError;

const system = require(path.join(__dirname, '..', 'lib', 'commands', 'system'));

const parseBool = (bool) => {
  const re=/^(true|1|on)$/i;
  return re.test(bool);
}

program.description('DXC Framework System Sub-Commands');

program.option('-v, --verbose [false]', 'Verbose', parseBool, defaults.verbose)
       .option('-c, --confirm [false]', 'Confirm', parseBool, defaults.confirm)
       .option('    --templates <path>', 'DXC Framework Templates Directory', defaults.templates)
       .option('    --functions <path>', 'DXC Framework Functions Directory', defaults.functions)
       .option('    --scripts <path>', 'DXC Framework Scripts Directory', defaults.scripts)
       .option('    --config <path>', 'DXC Framework Configuration Directory', defaults.config)
       .option('    --system <system>', 'DXC Framework System Name', defaults.system)
       .option('    --account <account>', 'DXC Framework Account Name (or Alias)', defaults.account)
       .option('    --environment <environment>', 'DXC Framework Environment Name', defaults.environment)
       .option('    --region <region>', 'DXC Framework Region Name', defaults.region)
       .option('    --user <user>', 'DXC Framework User Name', defaults.user)

program.command('status')
       .description('DXC Framework List Systems command')
       .option('-s, --stack-name <stack>', 'Stack name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .action(async (options) => {
          try {
            debug(`dxcf-system list()`);
            util.debugOptions(options);
            //if (!options.parent.region)
            //  throw new CommandError('--region <region> required', errors.OPTION_REGION_MISSING);
            //if (!options.parent.user)
            //  throw new CommandError('--user <user> required', errors.OPTION_USER_MISSING);
            config.load(options);
            util.debugConfig(config);
            await stack.describeSystems(config);
          }
          catch (err) {
            if (options.parent.verbose) console.error(chalk.red(err.message));
            if (err instanceof CommandError) process.exitCode = err.exitCode;
            else process.exitCode = errors.UNKNOWN;
          }
        });

program.command('create')
       .description('DXC Framework Create System command')
       .option('    --prerequisite [false]', 'Check Prerequisites', parseBool, defaults.prerequisite)
       .option('    --lambda [false]', 'Check for Lambda Functions', parseBool, defaults.lambda)
       .option('    --policy [false]', 'Check for Stack Policy', parseBool, defaults.policy)
       .option('-m, --monitor [false]', 'Monitor Stack build', parseBool, defaults.monitor)
       .option('-w, --wait [false]', 'Wait for Stack build', parseBool, defaults.wait)
       .option('-s, --stack-name <stack>', 'Stack name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .option('-t, --template-name <template>', 'Template name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .option('    --wait-interval <seconds>', 'Wait Interval', parseInt, 15)
       .action(async (options) => {
          try {
            debug(`dxcf-system create()`);
            util.debugOptions(options);
            //if (!options.stackName)
            //  throw new CommandError('--stack-name <stack> required', errors.OPTION_STACK_MISSING);
            //if (!options.templateName)
            //  throw new CommandError('--template-name <template> required', errors.OPTION_TEMPLATE_MISSING);
            //if (!options.parent.region)
            //  throw new CommandError('--region <region> required', errors.OPTION_REGION_MISSING);
            //if (!options.parent.user)
            //  throw new CommandError('--user <user> required', errors.OPTION_USER_MISSING);
            config.load(options);
            util.debugConfig(config);
            await stack.createSystem(config);
          }
          catch (err) {
            if (options.parent.verbose) console.error(chalk.red(err.message));
            if (err instanceof CommandError) {
              process.exitCode = err.exitCode;
            }
            else {
              process.exitCode = errors.UNKNOWN;
            }
          }
        });

program.parse(process.argv);

if (!program.commands.map(cmd => cmd._name).includes((program.args[0]) ? program.args[0]._name : undefined)) {
  program.outputHelp();
  process.exit(errors.COMMAND_INVALID);
}
