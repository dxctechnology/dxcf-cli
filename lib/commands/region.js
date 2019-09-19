'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const debug = require('debug')('dxcf:cli:region');
const table = require('table').table;
const chalk = require('chalk');
const prompt = require('async-prompt');

const AWS = require('aws-sdk');

const util = require(path.join(__dirname, '..', 'util'));
const config = require(path.join(__dirname, '..', 'config'));

const errors = require(path.join(__dirname, '..', 'errors'));
const CommandError = require(path.join(__dirname, '..', 'errors')).CommandError;

const stack = require(path.join(__dirname, 'stack'));

const configAWS = (config) => {
  debug(`region.configAWS()`);

  AWS.config.apiVersions = {
    cloudformation: '2010-05-15',
    s3: '2006-03-01'
  };

  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: config.current.profile });
  AWS.config.update({ region: config.current.region.Name });
}

const timer = (ms) => {
  debug(`region.timer(${ms})`);
  return new Promise(res => setTimeout(res, ms));
}

const formatRegionCommand = (config, params, detailed = false) => {
  debug(`region.formatRegionCommand()`);

  let formattedCommand = `dxcf ${config.program.name} ${config.command.name} `;

  const formattedSpacer = ' '.repeat(formattedCommand.length);

  // TODO: Simple formatting to start. Eventually, I'd like to color-code this, based on if
  //       an option is the default, set by environment variable, explicitly specified on the
  //       command line, or obtained via the configuration files.
  const formattedVerbose = (config.current.flags.verbose) ? '--verbose ' : '';
  const formattedConfirm = (config.current.flags.confirm) ? '--confirm ' : '';
  const formattedMonitor = (config.current.flags.monitor) ? '--monitor ' : '';
  const formattedWait = (config.current.flags.wait) ? '--wait ' : '';

  const formattedPrerequisite = (config.current.flags.prerequisite) ? '' : '--prerequisite false ';
  const formattedLambda = (config.current.flags.lambda) ? '' : '--lambda false ';
  const formattedPolicy = (config.current.flags.policy) ? '' : '--policy false ';

  const formattedConfig = `--config ${config.current.config.path} `;
  const formattedTemplates = `--templates ${config.current.templates.path} `;
  const formattedFunctions = `--functions ${config.current.functions.path} `;
  const formattedScripts = `--scripts ${config.current.scripts.path} `;

  const formattedSystem = (config.current.system) ? `--system ${config.current.system.Name} ` : '';
  const formattedAccount = (config.current.account) ? `--account ${config.current.account.Name} ` : '';
  const formattedEnvironment = (config.current.environment) ? `--environment ${config.current.environment.Name} ` : '';

  const formattedStack = (config.current.stack) ? `--stack-name ${config.current.stack.name} ` : '';
  const formattedTemplate = (config.current.stack && config.current.stack.template) ? `--template ${config.current.stack.template.name} ` : '';

  const formattedParameters = (params.Parameters) ? util.formatParameters(params.Parameters) : '';
  const formattedTags = (params.Tags) ? util.formatTags(params.Tags) : '';

  const formattedRegion = (config.current.region) ? `--region ${config.current.region.Name} ` : '';
  const formattedUser = (config.current.user) ? `--user ${config.current.user.Name} ` : '';

  // Construct the "effective" command line
  if (config.command.name == 'create') {
    if (formattedVerbose || formattedConfirm || formattedMonitor || formattedWait) {
      formattedCommand += `${formattedVerbose}${formattedConfirm}${formattedMonitor}${formattedWait}\\\n${formattedSpacer}`;
    }
    if (formattedPrerequisite || formattedLambda || formattedPolicy) {
      formattedCommand += `${formattedPrerequisite}${formattedLambda}${formattedPolicy}\\\n${formattedSpacer}`;
    }
  }
  else if (config.command.name == 'list') {
    if (formattedVerbose || formattedConfirm) {
      formattedCommand += `${formattedVerbose}${formattedConfirm}\\\n${formattedSpacer}`;
    }
  }
  if (detailed) {
    if (formattedConfig) {
      formattedCommand += `${formattedConfig}\\\n${formattedSpacer}`;
    }
    if (formattedTemplates) {
      formattedCommand += `${formattedTemplates}\\\n${formattedSpacer}`;
    }
    if (formattedFunctions) {
      formattedCommand += `${formattedFunctions}\\\n${formattedSpacer}`;
    }
    if (formattedScripts) {
      formattedCommand += `${formattedScripts}\\\n${formattedSpacer}`;
    }
  }
  if (formattedSystem || formattedAccount || formattedEnvironment) {
    formattedCommand += `${formattedSystem}${formattedAccount}${formattedEnvironment}\\\n${formattedSpacer}`;
  }
  if (formattedStack || formattedTemplate) {
    formattedCommand += `${formattedStack}${formattedTemplate}\\\n${formattedSpacer}`;
  }
  if (config.command.name == 'create') {
    if (formattedParameters) {
      formattedCommand += `${formattedParameters}`.replace(/\n/g, `\n${formattedSpacer}`);
    }
    if (formattedTags) {
      formattedCommand += `${formattedTags}`.replace(/\n/g, `\n${formattedSpacer}`);
    }
  }
  if (formattedRegion || formattedUser) {
    formattedCommand += `${formattedRegion}${formattedUser}\\\n${formattedSpacer}`;
  }

  return formattedCommand.replace(/\\\n *$/, '');
}

exports.describeRegions = async (config) => {
  debug(`region.describeRegions()`);

  console.log(`region.describeRegions() - WIP: Not yet implemented, code copied from stack.js to setup structure, but not yet modified.`);
  // YOU ARE HERE: Not yet implemented
  //               - First, we need to decide what this command should list and describe
  //               - Based on the behavior of the sequence script in single-account architecture, there needs to be some
  //                 way to show what dxcf region create will do - what phases exist, steps within a phase, with and without detail
  //               - This likely means we need to accept --phase and --step options, same as with create, but perhaps only when also
  //                 specified with a --detail flag to show additional detail
  return;

  configAWS(config);

  const cloudformation = new AWS.CloudFormation();

  const describeStacksParams = {};
  if (config.options.stack && config.options.stack.name) {
    describeStacksParams.StackName = config.options.stack.name;
  };

  if (config.options.verbose) {
    console.log(chalk.bold(formatStackCommand('list', config, describeStacksParams)));
  }
  else {
    debug(`Params: ${describeStacksParams}`);
  }

  let listStacks = true;
  if (config.options.confirm) {
    let question;
    if (config.options.verbose) {
      question = `\nRun? [Y/n]`;
    }
    else {
      question = `\nList Stacks${(config.options.stack) ? ` ${config.options.stack.name}` : ''}? [Y/n]`;
    }
    const answer = await prompt(question);
    if (/^(y|yes|1|true)?$/i.test(answer)) {
      listStacks = true;
    }
    else {
      listStacks = false;
      console.log(`Command cancelled`);
    }
  }

  if (listStacks) {
    const cloudformation = new AWS.CloudFormation();

    const data = await cloudformation.describeStacks(describeStacksParams).promise();

    const stacks = data.Stacks.map(s => ([s.StackName, s.StackStatus, new Date(s.CreationTime).toLocaleString()]));
    stacks.unshift([ 'Name', 'Status', 'Creation Time' ]);

    const config = {
      drawHorizontalLine: (index, size) => {
        return index === 0 || index === 1 || index === size;
      }
    };

    console.log(chalk.bold('\nStacks'));
    console.log(table(stacks, config));
  }
}

exports.describeRegionsCommand = async (config) => {
  debug(`region.describeRegionsCommand()`);

  try {
    // Program
    config.setCurrentRepositoryPaths();

    // Default
    config.loadDefaultData();

    // User
    config.loadUserData();

    // Common
    config.loadCommonData();
    config.mergeCommonData();
    config.setCurrentSystem();

    // System
    config.loadSystemData();
    config.mergeSystemData();
    config.setCurrentAccount();

    // Account
    config.loadAccountData();
    config.mergeAccountData();
    config.setCurrentEnvironment();
    config.setCurrentRegion();
    config.setCurrentRepositoryBuckets(); // Currently buckets are replicated per-region

    // Region
    config.loadRegionData();
    config.mergeRegionData();
    config.setCurrentUser();
    config.setCurrentProfile();
    config.setCurrentPhases(); // YOU ARE HERE - obtain phase(s) from Command data
    config.setCurrentSteps(); // TODO - obtain step(s) from Command data

    // YOU ARE HERE - logic to dump the phases and steps would go here
    //              - Not sure if it makes sense to run a separate describeRegions() function,
    //                as that's not what we're going to do for the createRegionCommand() function

    // Debug
    //util.debugConfigSourceData(config);
    //util.debugConfigMergedData(config);
    //util.debugConfigCurrent(config);

    configAWS(config);

    await exports.describeRegions(config);
  }
  catch (err) {
    debug(err);
    throw err;
  }
};

exports.createRegionCommand = async (config) => {
  debug(`region.createRegionCommand()`);

  try {
    // Program
    config.setCurrentRepositoryPaths();

    // Default
    config.loadDefaultData();

    // User
    config.loadUserData();

    // Common
    config.loadCommonData();
    config.mergeCommonData();
    config.setCurrentSystem();

    // System
    config.loadSystemData();
    config.mergeSystemData();
    config.setCurrentAccount();

    // Account
    config.loadAccountData();
    config.mergeAccountData();
    config.setCurrentEnvironment();
    config.setCurrentRegion();
    config.setCurrentRepositoryBuckets(); // Currently buckets are replicated per-region

    // Region
    config.loadRegionData();
    config.mergeRegionData();
    config.setCurrentUser();
    config.setCurrentProfile();
    config.setCurrentFlags();
    config.setCurrentPhases();
    config.setCurrentSteps();

    // Temp Debug
    //util.debugConfigSourceData(config);
    //util.debugConfigMergedData(config);
    //util.debugConfigCurrent(config);

    configAWS(config);

    const cloudformation = new AWS.CloudFormation();

    const data = await cloudformation.describeStacks().promise();

    const validStackStatus = [ 'CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE' ];
    let allStacks = [];
    let validStacks = [];

    if (data.Stacks.length > 0) {
      allStacks = data.Stacks.map(s => s.StackName);
      validStacks = data.Stacks.filter(s => validStackStatus.indexOf(s.StackStatus) > -1).map(s => s.StackName);
    }

    const regionPhases = config.region.steps.Region.Phases;
    let phases = [];

    if (config.current.phases && config.current.phases.length > 0) {
      debug('- Validating requested phases...');
      for (const phaseName of config.current.phases) {
        debug(`  - ${phaseName}`);
        const phase = regionPhases.filter(p => p.Name == phaseName)[0];
        if (phase) {
          phases.push(phase);
        }
        else {
          throw new CommandError(`Phase ${phaseName} does not exist in Region's Steps.yaml file`, errors.OPTION_PHASE_INVALID);
        }
      }
    }
    else {
      debug('- Running all phases...');
      phases = regionPhases;
    }

//// debug ////
//debug(`phases:\n${JSON.stringify(phases, null, 2)}`);
//// debug ////

    for (const phase of phases) {
      if (config.current.flags.verbose) {
        console.log(`Phase: ${phase.Name}, Type: ${phase.Type}`);
      }
      else {
        debug(`- Phase: ${phase.Name}, Type: ${phase.Type}`);
      }

      const phaseSteps = phase.Steps;
      let steps = [];

      if (config.current.steps && config.current.steps.length > 0) {
        debug('  - Validating requested steps...');
        for (const stepName of config.current.steps) {
          debug(`    - ${stepName}`);
          const step = phaseSteps.filter(s => s.Name == stepName)[0];
          if (step) {
            steps.push(step);
          }
          else {
            throw new CommandError(`Step ${stepName} is not a Step within Phase ${phase.Name} in Region's Steps.yaml file`, errors.OPTION_STEP_INVALID);
          }
        }
      }
      else {
        debug('  - Running all steps...');
        steps = phaseSteps;
      }

      let syncStacks = [];

      for (const step of steps) {
        if (config.current.flags.verbose) {
          console.log(`Step: ${step.Name}, Type: ${step.Type}, Verbose: ${step.Verbose}, Confirm: ${step.Confirm}, Monitor: ${step.Monitor}, Wait: ${step.Wait} `);
        }
        else {
          debug(`  - Step: ${step.Name}, Type: ${step.Type}, Verbose: ${step.Verbose}, Confirm: ${step.Confirm}, Monitor: ${step.Monitor}, Wait: ${step.Wait} `);
        }

        switch (step.Type) {
          case 'Stack':
            console.log(`- Stack:`);
            console.log(`  - Create Stack: ${step.Stack}, using Template: ${step.Template}`);
            config.setCurrentStack(step.Stack);
            config.setCurrentStackTemplate(step.Template);

            // Stack
            config.loadStackData();
            config.extractTemplateData();
            config.mergeStackData();
            config.setCurrentFlags();
            config.setCurrentStackPolicy();
            config.setCurrentStackParameters();
            config.setCurrentStackTags();
            config.setCurrentStackCapabilities();
            config.setCurrentWaitInterval();

// YOU ARE HERE - somewhere in here, test if the stack already exists, then if it is a valid stack
//                and skip if exists and is valid, terminate if exists and invalid
//              - To skip, we need some way to indicate what's being skipped. Think about a --dry-run
//                flag, which shows the statements to create, but doesn't run them. This may need to
//                disable the pre-requisite check so it can go past the first missing stack and show
//                further stacks that would be created based on pre-requisites.

      stackExists = allStacks.some(s => s == config.current.stack.name);



            if (step.Wait) {
              console.log(`  - Wait...`);
              console.log(`  - Create Stack: ${step.Stack}, using Template: ${step.Template}`);
              await timer(5 * 1000);
            }
            else {
              syncStacks.push(step.Stack);
            }
            break;

          case 'Sync':
            console.log(`- Sync:`);
            console.log(`  - Waiting on: ${syncStacks.join(',')}`);

            const completeStatus = [ 'CREATE_COMPLETE', 'CREATE_FAILED', 'ROLLBACK_COMPLETE' ];
            let status;
            do {
              await timer(5 * 1000);
              const data = await cloudformation.describeStacks().promise();
              status = data.Stacks[0].StackStatus;
              console.log(`Stack Status: ${status}`);
            } while (completeStatus.indexOf(status) == -1);
            console.log(`  - Wait complete`);
            syncStacks = [];
            break;

          case 'Script':
            console.log(`- Script:`);
            console.log(`  - Running Script: ${step.Script}`);
            await timer(5 * 1000);
            break;

          default:
            console.log(`- UNKNOWN TYPE`)
        }
      }
    }
debug('3');

    // YOU ARE HERE - the Debug logic needs to go here after the Stack has been selected and has had
    //                data loaded and merged via iterator logic
    // Debug
    //util.debugConfigSourceData(config);
    //util.debugConfigMergedData(config);
    //util.debugConfigCurrent(config);
process.exit(11);

    // YOU ARE HERE - the logic below is from createStackCommand, to obtain stacks, then confirm the
    //                stack doesn't exist before we try to create it.
    //              - The logic here needs to collect the stacks once before the iteration, and use that
    //                to skip over existing stacks when they exist.
    //              - As each stack is created, we can add it to the list if it succeeds, but this is
    //                complicated by wait/monitor flag logic, and sync steps. Not sure how often we may
    //                need to re-fetch the current list of stacks in a complete state to not get out of
    //                sync. It may make more sense to just do this every time we begin to create a stack
    //                and not worry about trying to figure it out.

    data = await cloudformation.describeStacks().promise();

    validStacks = [];
    stackExists = false;

    if (data.Stacks.length > 0) {
      validStacks = data.Stacks.filter(s => validStackStatus.indexOf(s.StackStatus) > -1).map(s => s.StackName);
      stackExists = data.Stacks.some(s => s.StackName == config.current.stack.name);
    }

    if (!stackExists) {
      debug(`- stack ${config.current.stack.name} does not exist`);

      await exports.createStack(config, validStacks);
    }
    else {
      throw new CommandError(`Stack ${config.current.stack.name} exists`, errors.STACK_EXISTS);
    }
  }
  catch (err) {
    debug(err);
    throw err;
  }
};
