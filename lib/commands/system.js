'use strict';

///////////////////////////////////////////////////////////////////////////////////////////////////
/////  Under Current Development - cloned from stack, not fully designed/modified yet         /////
///////////////////////////////////////////////////////////////////////////////////////////////////

const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const debug = require('debug')('dxcf:cli:system');
const chalk = require('chalk');
const prompt = require('async-prompt');

const AWS = require('aws-sdk');

const util = require(path.join(__dirname, '..', 'util'));
const config = require(path.join(__dirname, '..', 'config'));

const errors = require(path.join(__dirname, '..', 'errors'));
const CommandError = require(path.join(__dirname, '..', 'errors')).CommandError;

const configAWS = (config) => {
  debug(`system.configAWS()`);

  AWS.config.apiVersions = {
    cloudformation: '2010-05-15',
    s3: '2006-03-01'
  };

  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: config.profile });
  AWS.config.update({ region: config.region.Name });
}

const timer = (ms) => {
  debug(`system.timer(${ms})`);
  return new Promise(res => setTimeout(res, ms));
}

const calculateETag = (body) => {
  debug(`system.calculateETag()`);
  return crypto.createHash('MD5').update(body, 'utf8').digest('hex');
}

const getMergedParameters = (config, calculatedParameters) => {
  debug(`stack.getMergedParameters()`);

  const templateParameters = util.getTemplateParameters(config.stack.template.Body);

  if (templateParameters.length > 0) {
    const defaultParameters = util.getParameters(util.getParametersBody(path.join(__dirname, '..', 'conf',
                                                                                  'Parameters.json')), config.schemas.Parameters);
    const commonParameters  = util.getParameters(util.getParametersBody(path.join(config.config.Path,
                                                                                  'Parameters.json')), config.schemas.Parameters);
    const systemParameters  = util.getParameters(util.getParametersBody(path.join(config.config.Path,
                                                                                  'Systems', config.system.Name,
                                                                                  'Parameters.json')), config.schemas.Parameters);
    const accountParameters = util.getParameters(util.getParametersBody(path.join(config.config.Path,
                                                                                  'Systems', config.system.Name,
                                                                                  'Accounts', config.account.Name + '[' + config.account.Id + ']',
                                                                                  'Parameters.json')), config.schemas.Parameters);
    const regionParameters  = util.getParameters(util.getParametersBody(path.join(config.config.Path,
                                                                                  'Systems', config.system.Name,
                                                                                  'Accounts', config.account.Name + '[' + config.account.Id + ']',
                                                                                  'Regions', config.region.Name,
                                                                                  'Parameters.json')), config.schemas.Parameters);
    const stackParameters   = util.getParameters(util.getParametersBody(path.join(config.config.Path,
                                                                                  'Systems', config.system.Name,
                                                                                  'Accounts', config.account.Name + '[' + config.account.Id + ']',
                                                                                  'Regions', config.region.Name,
                                                                                  'Stacks', config.stack.Name + '-Parameters.json')), config.schemas.Parameters);
    const userParameters    = util.getParameters(util.getParametersBody(path.join(os.homedir(), '.dxcf',
                                                                                  'Parameters.json')), config.schemas.Parameters);
    const secureParameters  = util.getParameters(util.getParametersBody(path.join(os.homedir(), '.dxcf',
                                                                                  'Secure-Parameters.json')), config.schemas.Parameters);

    // Note the initial merged result contains more information than what is needed or allowed in the API call.
    // We need this additional information in the calling function, but this must be pruned before the API is called.
    return util.mergeParameters(templateParameters, defaultParameters, commonParameters, systemParameters, accountParameters,
                                regionParameters, stackParameters, userParameters, secureParameters, calculatedParameters);
  }

  return [];
}

const getMergedTags = (config) => {
  debug(`stack.getMergedTags()`);
  const defaultTags = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                              'Tags.json')), config.schemas.Tags);
  const commonTags  = util.getData(util.getDataBody(path.join(config.config.Path,
                                                              'Tags.json')), config.schemas.Tags);
  const systemTags  = util.getData(util.getDataBody(path.join(config.config.Path,
                                                              'Systems', config.system.Name,
                                                              'Tags.json')), config.schemas.Tags);
  const accountTags = util.getData(util.getDataBody(path.join(config.config.Path,
                                                              'Systems', config.system.Name,
                                                              'Accounts', config.account.Name + '[' + config.account.Id + ']',
                                                              'Tags.json')), config.schemas.Tags);
  const regionTags  = util.getData(util.getDataBody(path.join(config.config.Path,
                                                              'Systems', config.system.Name,
                                                              'Accounts', config.account.Name + '[' + config.account.Id + ']',
                                                              'Regions', config.region.Name,
                                                              'Tags.json')), config.schemas.Tags);
  const stackTags   = util.getData(util.getDataBody(path.join(config.config.Path,
                                                              'Systems', config.system.Name,
                                                              'Accounts', config.account.Name + '[' + config.account.Id + ']',
                                                              'Regions', config.region.Name,
                                                              'Stacks', config.stack.Name + '-Tags.json')), config.schemas.Tags);
  const userTags    = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                              'Tags.json')), config.schemas.Tags);

  // Note the initial merged result contains more information than what is needed or allowed in the API call.
  // We need this additional information in the calling function, but this must be pruned before the API is called.
  return util.mergeTags(defaultTags, commonTags, systemTags, accountTags, regionTags, stackTags, userTags);
}

const getMergedNotificationARNs = (config) => {
  debug(`stack.getMergedNotificationARNs()`);
  // TBD: We may want to have logic here to use a <stack>-Notifications.json file to add notifications in a manner
  // similar to how we add Tags. What makes this harder is that we might want to have an ability to add and remove
  // Notifications. We may also just hard-code the Events Topic, but need to first ensure the Topic exists before
  // we can use it.

  return []; // NotificationARNs, once computed
}

const getCapabilities = (config) => {
  debug(`stack.getCapabilities()`);

  return util.getCapabilities(config.stack.template.Body);
}

const syncTemplate = async (config) => {
  debug(`stack.syncTemplate()`);

  const s3 = new AWS.S3();

  const localETag = calculateETag(config.stack.template.Body);
  debug(`- local template found (ETag: ${localETag})`);

  try {
    debug('- lookup remote template');
    const headObjectParams = {
      Bucket: config.templates.Bucket,
      Key: config.stack.template.Name + '.yaml'
    };
    const data = await s3.headObject(headObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    debug(`- remote template found (ETag: ${remoteETag})`);
    if (remoteETag == localETag) {
      debug(`- templates identical (VersionId: ${remoteVersionId})`);
      return;
    }
    else {
      debug('- local template modified');
    }
  }
  catch (err) {
    if (err.code && err.code == 'NotFound') {
      debug('- remote template not found');
    }
    else {
      debug(err);
      throw err;
    }
  }

  try {
    debug('- upload template');
    const putObjectParams = {
      Bucket: config.templates.Bucket,
      Key: config.stack.template.Name + '.yaml',
      Body: config.stack.template.Body
    };
    const data = await s3.putObject(putObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    if (remoteETag == localETag) {
      debug(`- template uploaded (VersionId: ${remoteVersionId})`);
      return;
    }
    else {
      throw new CommandError(`Template ${config.stack.template.Name}.yaml uploaded, but was corrupted in transit`, errors.TEMPLATE_INVALID);
    }
  }
  catch (err) {
    debug('- template could not be uploaded');
    throw err;
  }
}

const syncStackPolicy = async (config) => {
  debug(`stack.syncStackPolicy()`);

  const s3 = new AWS.S3();

  const localETag = calculateETag(config.stack.policy.Body);
  debug(`- local stack policy found (ETag: ${localETag})`);

  try {
    debug('- lookup remote stack policy');
    const headObjectParams = {
      Bucket: config.templates.Bucket,
      Key: config.stack.template.Name + '-StackPolicy.json'
    };
    const data = await s3.headObject(headObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    debug(`- remote stack policy found (ETag: ${remoteETag})`);
    if (remoteETag == localETag) {
      debug('- stack policies identical (VersionId: ${remoteVersionId})');
      return;
    }
    else {
      debug('- local stack policy modified');
    }
  }
  catch (err) {
    if (err.code && err.code == 'NotFound') {
      debug('- remote stack policy not found');
    }
    else {
      debug(err);
      throw err;
    }
  }

  try {
    debug('- upload stack policy');
    const putObjectParams = {
      Bucket: config.templates.Bucket,
      Key: config.stack.template.Name + '-StackPolicy.json',
      Body: config.stack.policy.Body
    };
    const data = await s3.putObject(putObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    if (remoteETag == localETag) {
      debug(`- stack policy uploaded (VersionId: ${remoteVersionId})`);
      return;
    }
    else {
      throw new CommandError(`StackPolicy ${config.stack.template.Name}-StackPolicy.json uploaded, but was corrupted in transit`, errors.POLICY_INVALID);
    }
  }
  catch (err) {
    debug('- stack policy could not be uploaded');
    throw err;
  }
}

const syncFunction = async (config, name) => {
  debug(`stack.syncFunction(${name})`);

  const s3 = new AWS.S3();

  const functionDeploymentPackage = util.createLambdaDeploymentPackage(config, name);
  const localETag = calculateETag(functionDeploymentPackage);
  debug(`- local function deployment package created (ETag: ${localETag})`);

  try {
    debug('- lookup remote function deployment package');
    const headObjectParams = {
      Bucket: config.functions.Bucket,
      Key: name + '.zip'
    };
    const data = await s3.headObject(headObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    debug(`- remote function deployment package found (ETag: ${remoteETag})`);
    if (remoteETag == localETag) {
      debug(`- function deployment packages identical (VersionId: ${remoteVersionId})`);
      return remoteVersionId;
    }
    else {
      debug('- local function deployment package modified');
    }
  }
  catch (err) {
    if (err.code && err.code == 'NotFound') {
      debug('- remote function deployment package not found');
    }
    else {
      debug(err);
      throw err;
    }
  }

  try {
    debug('- upload function deployment package');
    const putObjectParams = {
      Bucket: config.functions.Bucket,
      Key: name + '.zip',
      Body: functionDeploymentPackage
    };
    const data = await s3.putObject(putObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    if (remoteETag == localETag) {
      debug(`- function deployment package uploaded (VersionId: ${remoteVersionId})`);
      return remoteVersionId;
    }
    else {
      throw new CommandError(`Function deployment package ${name}.zip uploaded, but was corrupted in transit`, errors.FUNCTION_INVALID);
    }
  }
  catch (err) {
    debug('- function deployment package could not be uploaded');
    throw err;
  }
}

const formatSystemCommand = (subcommand, config, params) => {
  debug(`system.formatSystemCommand()`);

  let formattedCommand = `dxcf account ${subcommand} `;

  const formattedSpacer = ' '.repeat(formattedCommand.length);

  // TODO: Simple formatting to start. Eventually, I'd like to color-code this, based on if
  //       an option is the default, set by environment variable, explicitly specified on the
  //       command line, or obtained via the configuration files.
  const formattedVerbose = (config.verbose) ? '--verbose ' : '';
  const formattedConfirm = (config.confirm) ? '--confirm ' : '';
  const formattedMonitor = (config.monitor) ? '--monitor ' : '';
  const formattedWait = (config.wait) ? '--wait ' : '';

  const formattedPrerequisite = (config.prerequisite) ? '' : '--prerequisite false ';
  const formattedLambda = (config.lambda) ? '' : '--lambda false ';
  const formattedPolicy = (config.policy) ? '' : '--policy false ';

  const formattedTemplates = `--templates ${config.templates.Path} `;
  const formattedFunctions = `--functions ${config.functions.Path} `;
  const formattedScripts = `--scripts ${config.scripts.Path} `;
  const formattedConfig = `--config ${config.config.Path} `;

  const formattedSystem = (config.system) ? `--system ${config.system.Name} ` : '';
  const formattedAccount = (config.account) ? `--account ${config.account.Name} ` : '';
  const formattedEnvironment = (config.environment) ? `--environment ${config.environment.Name} ` : '';

  const formattedStack = (config.stack) ? `--stack-name ${config.stack.Name} ` : '';
  const formattedTemplate = (config.stack && config.stack.template) ? `--template ${config.stack.template.Name} ` : '';

  const formattedParameters = (params.Parameters) ? util.formatParameters(params.Parameters) : '';
  const formattedTags = (params.Tags) ? util.formatTags(params.Tags) : '';

  const formattedRegion = (config.region) ? `--region ${config.region.Name} ` : '';
  const formattedUser = (config.user) ? `--user ${config.user.Name} ` : '';

  // Construct the "effective" command line
  if (formattedVerbose || formattedConfirm || formattedMonitor || formattedWait) {
    formattedCommand += `${formattedVerbose}${formattedConfirm}${formattedMonitor}${formattedWait}\\\n${formattedSpacer}`;
  }
  if (subcommand == 'create') {
    if (formattedPrerequisite || formattedLambda || formattedPolicy) {
      formattedCommand += `${formattedPrerequisite}${formattedLambda}${formattedPolicy}\\\n${formattedSpacer}`;
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
    if (formattedConfig) {
      formattedCommand += `${formattedConfig}\\\n${formattedSpacer}`;
    }
  }
  if (formattedSystem || formattedAccount || formattedEnvironment) {
    formattedCommand += `${formattedSystem}${formattedAccount}${formattedEnvironment}\\\n${formattedSpacer}`;
  }
  if (formattedStack || formattedTemplate) {
    formattedCommand += `${formattedStack}${formattedTemplate}\\\n${formattedSpacer}`;
  }
  if (subcommand == 'create') {
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

exports.describeSystems = async (config) => {
  debug(`system.describeSystems()`);

  console.log(`system.describeSystems() - WIP: Not yet implemented, code copied from stack.js to setup structure, but not yet modified.`);
  return;

  try {
    configAWS(config);

    const cloudformation = new AWS.CloudFormation();

    const describeStacksParams = {};
    if (config.stack && config.stack.Name) {
      describeStacksParams.StackName = config.stack.Name;
    };

    if (config.verbose) {
      console.log(chalk.bold(formatStackCommand('list', config, describeStacksParams)));
    }
    else {
      debug(`Params: ${describeStacksParams}`);
    }

    let listStacks = true;
    if (config.confirm) {
      let question;
      if (config.verbose) {
        question = `\nRun? [Y/n]`;
      }
      else {
        question = `\nList Stacks${(config.stack) ? ` ${config.stack.Name}` : ''}? [Y/n]`;
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
      debug(`- Call cloudformation.describeStacks ${Date.now()}`);
      const data = await cloudformation.describeStacks(describeStacksParams).promise();
      debug(`- Rtrn cloudformation.describeStacks ${Date.now()}`);

      console.log(chalk.bold('\nStacks'));
      console.log(chalk.green(data.Stacks.map(s => s.StackName).join('\n')));
    }
  }
  catch (err) {
    debug(err);
    throw err;
  }
};

exports.createSystem = async (config) => {
  debug(`system.createSystem()`);

  console.log(`system.createSystem() - WIP: Not yet implemented, code copied from stack.js to setup structure, but not yet modified.`);
  return;

  try {
    configAWS(config);

    const cloudformation = new AWS.CloudFormation();
    const s3 = new AWS.S3();

    let data = await cloudformation.describeStacks().promise();

    const validStackStatus = [ 'CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE' ];
    let validStacks = [];
    let stackExists = false;

    if (data.Stacks.length > 0) {
      validStacks = data.Stacks.filter(s => validStackStatus.indexOf(s.StackStatus) > -1).map(s => s.StackName);
      stackExists = data.Stacks.some(s => s.StackName == config.stack.Name);
    }

    if (!stackExists) {
      debug(`- stack ${config.stack.Name} does not exist`);

      const calculatedParameters = [];
      if (config.lambda) {
        debug('- searching for Lambda functions');
        const lrs = util.getTemplateLambdaResourcesSummary(config.stack.template.Body);

        if (lrs.some(s => s.CodeLocation == 'S3Bucket')) {
          debug('- Lambda functions stored in S3');

          debug('- checking functions bucket');
          try {
            const headBucketParams = {
              Bucket: config.functions.Bucket
            };
            await s3.headBucket(headBucketParams).promise();
            debug('- functions bucket found');

            debug('- creating and uploading lambda deployement packages');
            for (const l of lrs) {
              debug(`  - ${l.Name}`);
              const remoteVersionId = await syncFunction(config, l.Name);
              const parameter = {
                ParameterKey: `${l.Name}FunctionObjectVersion`,
                ParameterValue: remoteVersionId
              };
              calculatedParameters.push(parameter);
            }
          }
          catch (err) {
            if (err.code && err.code == 'NotFound') {
              debug('- functions bucket not found');
            }
            else {
              throw err;
            }
          }
        }
      }

      const mergedParameters = getMergedParameters(config, calculatedParameters);
      const mergedTags = getMergedTags(config);
      //const mergedNotificationARNs = getMergedNotificationARNs(config);
      const capabilities = getCapabilities(config);

      if (config.prerequisite) {
        const requiredStacks = mergedParameters.filter(p => p.ParameterKey.endsWith('StackName')).map(p => p.ParameterValue);

        debug('- Checking Stack pre-requisites...');
        for (const s of requiredStacks.slice().reverse()) {
          debug(`  - ${s}`);
          if (! validStacks.includes(s)) {
            throw new CommandError(`Prerequisite Stack ${s} does not exist`, errors.STACK_NOT_FOUND);
            break;
          }
        }
      }

      const createStackParams = {};
      createStackParams.StackName = config.stack.Name;

      debug('- checking templates bucket');
      try {
        const headBucketParams = {
          Bucket: config.templates.Bucket
        };
        await s3.headBucket(headBucketParams).promise();
        debug('- templates bucket found');

        await syncTemplate(config);
        createStackParams.TemplateURL = config.stack.template.URL;

        if (config.policy) {
          await syncStackPolicy(config);
          createStackParams.StackPolicyURL = config.stack.policy.URL;
        }
      }
      catch (err) {
        if (err.code && err.code == 'NotFound') {
          debug('- templates bucket not found');
          createStackParams.TemplateBody = config.stack.template.Body;
          if (config.policy) {
            createStackParams.StackPolicyBody = config.stack.policy.Body;
          }
        }
        else {
          debug(err);
          throw err;
        }
      }

      createStackParams.Parameters = mergedParameters.filter(p => p.ParameterSource != 'Template' )
                                                     .map(p => ({ ParameterKey: p.ParameterKey, ParameterValue: p.ParameterValue})); // Reduce to minimum needed
      createStackParams.Tags = mergedTags.map(t => ({ Key: t.Key, Value: t.Value})); // Reduce to minimum needed
      //createStackParams.NotificationARNs = mergedNotificationARNs.map(n => n.ARN); // Reduce to minimum needed
      createStackParams.Capabilities = capabilities;
      createStackParams.DisableRollback = true;
      //createStackParams.EnableTerminationProtection = false;
      //createStackParams.TimeoutInMinutes = 0;

      if (config.verbose) {
        console.log(chalk.bold(formatStackCommand('create', config, createStackParams)));
      }
      else {
        debug(`Params: ${createStackParams}`);
        debug(`Merged Parameters: ${util.formatMergedParameters(mergedParameters)}`);
        debug(`Merged Tags: ${util.formatMergedTags(mergedTags)}`);
        //debug(`Capabilities: ${util.formatCapabilities(capabilities)}`);
      }

      let createStack = true;
      if (config.confirm) {
        let question;
        if (config.verbose) {
          question = `\nRun? [Y/n]`;
        }
        else {
          question = `\nCreate Stack '${config.stack.Name}'? [Y/n]`;
        }
        const answer = await prompt(question);
        if (/^(y|yes|1|true)?$/i.test(answer)) {
          createStack = true;
        }
        else {
          createStack = false;
          console.log(`Command cancelled`);
        }
      }

      if (createStack) {
        debug(`- Call cloudformation.createStack ${Date.now()}`);
        const data = await cloudformation.createStack(createStackParams).promise();
        debug(`- Rtrn cloudformation.createStack ${Date.now()}`);

        console.log(data.StackId);

        if (config.wait || config.monitor) {
          const completeStatus = [ 'CREATE_COMPLETE', 'CREATE_FAILED', 'ROLLBACK_COMPLETE' ];
          const describeStackEventsParams = {
            StackName: config.stack.Name
          };
          const describeStacksParams = {
            StackName: config.stack.Name
         };
          let status;
          do {
            if (config.monitor) {
              const data = await cloudformation.describeStackEvents(describeStackEventsParams).promise();
              console.log(`Stack Events:`);
              for (const se of data.StackEvents.slice(0,5)) {
                console.log(`${se.LogicalResourceId}  ${se.ResourceStatus}  ${se.Timestamp}`);
              }
            }
            await timer(config.waitInterval * 1000);
            const data = await cloudformation.describeStacks(describeStacksParams).promise();
            status = data.Stacks[0].StackStatus;
            console.log(`Stack Status: ${status}`);
          } while (completeStatus.indexOf(status) == -1);

          if (status != 'CREATE_COMPLETE') {
            throw new CommandError(`Stack ${config.stack.Name} creation failed (status: ${status})`, errors.STACK_FAILED);
          }
        }
      }
    }
    else {
      if (! config.verbose) {
        debug(`- stack ${config.stack.Name} exists`);
      }
      throw new CommandError(`Stack ${config.stack.Name} exists`, errors.STACK_EXISTS);
    }
  }
  catch (err) {
    debug(err);
    throw err;
  }
};
