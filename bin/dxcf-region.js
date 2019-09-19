#!/usr/bin/env node

'use strict';

const program = require('commander');
const os = require('os');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('dxcf:cli:region');
const chalk = require('chalk');

const util = require(path.join(__dirname, '..', 'lib', 'util'));
const defaults = require(path.join(__dirname, '..', 'lib', 'defaults'));
const config = require(path.join(__dirname, '..', 'lib', 'config'));

const errors = require(path.join(__dirname, '..', 'lib', 'errors'));
const CommandError = require(path.join(__dirname, '..', 'lib', 'errors')).CommandError;

const region = require(path.join(__dirname, '..', 'lib', 'commands', 'region'));

const parseBoolean = (value) => {
  const re=/^(t(rue)?|1|on|y(es)?)$/i;
  return re.test(value);
}

const parseInteger = (value) => {
  return parseInt(value, 10);
}

const parsePhase = (phase, phases) => {
  const re1=/^[^,]+(,[^,]+)*$/;
  if (! re1.test(phase)) {
    throw new CommandError(`--phase ${phase} invalid`, errors.OPTION_PHASE_INVALID);
  }
  for (const p of phase.split(',')) {
    const re2=/^[A-Z][A-Za-z0-9]*(-([A-Z][A-Za-z0-9]*|[0-9]+))*$/;
    if (! re2.test(p)) {
      throw new CommandError(`--phase ${phase} invalid`, errors.OPTION_PHASE_INVALID);
    }
    phases.push(p);
  }
  return phases;
}

const parseStep = (step, steps) => {
  const re1=/^[^,]+(,[^,]+)*$/;
  if (! re1.test(step)) {
    throw new CommandError(`--step ${step} invalid`, errors.OPTION_STEP_INVALID);
  }
  for (const s of step.split(',')) {
    const re2=/^[A-Z][A-Za-z0-9]*(-([A-Z][A-Za-z0-9]*|[0-9]+))*$/;
    if (! re2.test(s)) {
      throw new CommandError(`--step ${step} invalid`, errors.OPTION_STEP_INVALID);
    }
    steps.push(s);
  }
  return steps;
}

program.description('DXC Framework Region Sub-Commands');

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
       .description('DXC Framework List Regions command')
       .action(async (options) => {
          try {
            debug(`dxcf-region list()`);
            //util.debugOptions(options);

            // Program
            config.saveProgramOptions(options);
            //util.debugConfigProgram(config);

            // Command
            config.saveDescribeRegionsCommandOptions(options);
            //util.debugConfigCommand(config);

            await region.describeRegionsCommand(config);
          }
          catch (err) {
            console.error(chalk.red(err.message));
            if (err instanceof CommandError) process.exitCode = err.exitCode;
            else process.exitCode = errors.UNKNOWN;
          }
        });

program.command('create')
       .description('DXC Framework Create Region command')
       .option('    --phase <phase>', 'Phase to run, can be repeated', parsePhase, [])
       .option('    --step <step>', 'Step to run within Phase, can be repeated', parseStep, [])
       .option('-m, --monitor [false]', 'Monitor Stack build', parseBoolean, defaults.monitor)
       .option('-w, --wait [false]', 'Wait for Stack build', parseBoolean, defaults.wait)
       .option('    --prerequisite [false]', 'Check Prerequisites', parseBoolean, defaults.prerequisite)
       .option('    --lambda [false]', 'Check for Lambda Functions', parseBoolean, defaults.lambda)
       .option('    --policy [false]', 'Check for Stack Policy', parseBoolean, defaults.policy)
       .option('    --wait-interval <seconds>', 'Wait Interval', parseInteger, 15)
       .action(async (options) => {
          try {
            debug(`dxcf-region create()`);
            //util.debugOptions(options);

            // Program
            config.saveProgramOptions(options);
            //util.debugConfigProgram(config);

            // Command
            config.saveCreateRegionCommandOptions(options);
            //util.debugConfigCommand(config);

            await region.createRegionCommand(config);
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
