#!/usr/bin/env node

'use strict';

const program = require('commander');
const os = require('os');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('dxcf:cli:stack');
const chalk = require('chalk');

const util = require(path.join(__dirname, '..', 'lib', 'util'));
const defaults = require(path.join(__dirname, '..', 'lib', 'defaults'));
const config = require(path.join(__dirname, '..', 'lib', 'config'));

const errors = require(path.join(__dirname, '..', 'lib', 'errors'));
const CommandError = require(path.join(__dirname, '..', 'lib', 'errors')).CommandError;

const stack = require(path.join(__dirname, '..', 'lib', 'commands', 'stack'));

const parseBoolean = (value) => {
  const re=/^(t(rue)?|1|on|y(es)?)$/i;
  return re.test(value);
}

const parseInteger = (value) => {
  return parseInt(value, 10);
}

const parseParameter = (keyValue, parameters) => {
  const re=/^([A-Z][a-z0-9]*)+=[^=]*$/;
  if (! re.test(keyValue)) {
    throw new CommandError(`--parameter ${keyValue} invalid`, errors.OPTION_PARAMETER_INVALID);
  }
  const key = keyValue.substring(0,keyValue.indexOf('='));
  const value = keyValue.substring(keyValue.indexOf('=') + 1);
  parameters.push({ ParameterKey: key, ParameterValue: value });
  return parameters;
}

const parseTag = (keyValue, tags) => {
  const re=/^([A-Z][a-z0-9]*)+=[^=]*$/;
  if (! re.test(keyValue)) {
    throw new CommandError(`--tag ${keyValue} invalid`, errors.OPTION_TAG_INVALID);
  }
  const key = keyValue.substring(0,keyValue.indexOf('='));
  const value = keyValue.substring(keyValue.indexOf('=') + 1);
  tags.push({ Key: key, Value: value });
  return tags;
}

program.description('DXC Framework Stack Sub-Commands');

program.option('    --config <path>', 'DXC Framework Configuration Repository', defaults.config)
       .option('    --templates <path>', 'DXC Framework Templates Repository', defaults.templates)
       .option('    --functions <path>', 'DXC Framework Functions Repository', defaults.functions)
       .option('    --scripts <path>', 'DXC Framework Scripts Repository', defaults.scripts)
       .option('    --system <system>', 'DXC Framework System Name', defaults.system)
       .option('    --account <account>', 'DXC Framework Account Name (or Alias, or Number)', defaults.account)
       .option('    --environment <environment>', 'DXC Framework Environment Name', defaults.environment)
       .option('    --region <region>', 'DXC Framework Region Name', defaults.region)
       .option('    --user <user>', 'DXC Framework User Name', defaults.user)
       .option('-v, --verbose [false]', 'Verbose', parseBoolean, defaults.verbose)
       .option('-c, --confirm [false]', 'Confirm', parseBoolean, defaults.confirm)

program.command('list')
       .description('DXC Framework List Stacks command')
       .option('-s, --stack-name <stack>', 'Stack name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .action(async (options) => {
          try {
            debug(`dxcf-stack list()`);
            //util.debugOptions(options);

            // Program
            config.saveProgramOptions(options);
            //util.debugConfigProgram(config);

            // Command
            config.saveDescribeStacksCommandOptions(options);
            //util.debugConfigCommand(config);

            await stack.describeStacksCommand(config);
          }
          catch (err) {
            console.error(chalk.red(err.message));
            if (err instanceof CommandError) process.exitCode = err.exitCode;
            else process.exitCode = errors.UNKNOWN;
          }
        });

program.command('create')
       .description('DXC Framework Create Stack command')
       .option('-s, --stack-name <stack>', 'Stack name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .option('-t, --template-name <template>', 'Template name', /^[A-Z][-A-Za-z0-9]{3,63}$/)
       .option('    --parameter <key=value>', 'Override parameter', parseParameter, [])
       .option('    --tag <key=value>', 'Override tag', parseTag, [])
       .option('-m, --monitor [false]', 'Monitor Stack build', parseBoolean, defaults.monitor)
       .option('-w, --wait [false]', 'Wait for Stack build', parseBoolean, defaults.wait)
       .option('    --prerequisite [false]', 'Check Prerequisites', parseBoolean, defaults.prerequisite)
       .option('    --lambda [false]', 'Check for Lambda Functions', parseBoolean, defaults.lambda)
       .option('    --policy [false]', 'Check for Stack Policy', parseBoolean, defaults.policy)
       .option('    --wait-interval <seconds>', 'Wait Interval', parseInteger, 15)
       .action(async (options) => {
          try {
            debug(`dxcf-stack create()`);
            //util.debugOptions(options);
            if (!options.stackName)
              throw new CommandError('--stack-name <stack> required', errors.OPTION_STACK_MISSING);
            if (!options.templateName)
              throw new CommandError('--template-name <template> required', errors.OPTION_TEMPLATE_MISSING);

            // Program
            config.saveProgramOptions(options);
            //util.debugConfigProgram(config);

            // Command
            config.saveCreateStackCommandOptions(options);
            //util.debugConfigCommand(config);

            await stack.createStackCommand(config);
          }
          catch (err) {
            console.error(chalk.red(err.message));
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
