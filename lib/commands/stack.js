'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const debug = require('debug')('dxcf:cli:stack');
//const table = require('table').table;
const table = require('text-table');
const chalk = require('chalk');
const prompt = require('async-prompt');

const AWS = require('aws-sdk');

const util = require(path.join(__dirname, '..', 'util'));
const config = require(path.join(__dirname, '..', 'config'));

const errors = require(path.join(__dirname, '..', 'errors'));
const CommandError = require(path.join(__dirname, '..', 'errors')).CommandError;

const configAWS = (config) => {
  debug(`stack.configAWS()`);

  AWS.config.apiVersions = {
    cloudformation: '2010-05-15',
    s3: '2006-03-01'
  };

  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: config.options.profile });
  AWS.config.update({ region: config.options.region.Name });
}

const timer = (ms) => {
  debug(`stack.timer(${ms})`);
  return new Promise(res => setTimeout(res, ms));
}

const calculateETag = (body) => {
  debug(`stack.calculateETag()`);
  return crypto.createHash('MD5').update(body, 'utf8').digest('hex');
}

const getMergedParameters = (config, calculatedParameters) => {
  debug(`stack.getMergedParameters()`);

//  const templateParameters = util.getTemplateParameters(config.options.stack.template.Body);
//
//  if (templateParameters.length > 0) {
//    const defaultParameters = util.getParameters(util.getParametersBody(path.join(__dirname, '..', 'conf',
//                                                                                  'Parameters.json')), config.schemas.Parameters);
//    const commonParameters  = util.getParameters(util.getParametersBody(path.join(config.config.Path,
//                                                                                  'Parameters.json')), config.schemas.Parameters);
//    const systemParameters  = util.getParameters(util.getParametersBody(path.join(config.config.Path,
//                                                                                  'Systems', config.system.Name,
//                                                                                  'Parameters.json')), config.schemas.Parameters);
//    const accountParameters = util.getParameters(util.getParametersBody(path.join(config.config.Path,
//                                                                                  'Systems', config.system.Name,
//                                                                                  'Accounts', config.account.Name + '[' + config.account.Id + ']',
//                                                                                  'Parameters.json')), config.schemas.Parameters);
//    const regionParameters  = util.getParameters(util.getParametersBody(path.join(config.config.Path,
//                                                                                  'Systems', config.system.Name,
//                                                                                  'Accounts', config.account.Name + '[' + config.account.Id + ']',
//                                                                                  'Regions', config.region.Name,
//                                                                                  'Parameters.json')), config.schemas.Parameters);
//    const stackParameters   = util.getParameters(util.getParametersBody(path.join(config.config.Path,
//                                                                                  'Systems', config.system.Name,
//                                                                                  'Accounts', config.account.Name + '[' + config.account.Id + ']',
//                                                                                  'Regions', config.region.Name,
//                                                                                  'Stacks', config.stack.Name + '-Parameters.json')), config.schemas.Parameters);
//    const userParameters    = util.getParameters(util.getParametersBody(path.join(os.homedir(), '.dxcf',
//                                                                                  'Parameters.json')), config.schemas.Parameters);
//    const secureParameters  = util.getParameters(util.getParametersBody(path.join(os.homedir(), '.dxcf',
//                                                                                  'Secure-Parameters.json')), config.schemas.Parameters);
//
//    // Note the initial merged result contains more information than what is needed or allowed in the API call.
//    // We need this additional information in the calling function, but this must be pruned before the API is called.
//    return util.mergeParameters(templateParameters, defaultParameters, commonParameters, systemParameters, accountParameters,
//                                regionParameters, stackParameters, userParameters, secureParameters, calculatedParameters);
//  }

  return [];
}

const getMergedTags = (config) => {
  debug(`stack.getMergedTags()`);
//  const defaultTags = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
//                                                              'Tags.json')), config.schemas.Tags);
//  const commonTags  = util.getData(util.getDataBody(path.join(config.config.Path,
//                                                              'Tags.json')), config.schemas.Tags);
//  const systemTags  = util.getData(util.getDataBody(path.join(config.config.Path,
//                                                              'Systems', config.system.Name,
//                                                              'Tags.json')), config.schemas.Tags);
//  const accountTags = util.getData(util.getDataBody(path.join(config.config.Path,
//                                                              'Systems', config.system.Name,
//                                                              'Accounts', config.account.Name + '[' + config.account.Id + ']',
//                                                              'Tags.json')), config.schemas.Tags);
//  const regionTags  = util.getData(util.getDataBody(path.join(config.config.Path,
//                                                              'Systems', config.system.Name,
//                                                              'Accounts', config.account.Name + '[' + config.account.Id + ']',
//                                                              'Regions', config.region.Name,
//                                                              'Tags.json')), config.schemas.Tags);
//  const stackTags   = util.getData(util.getDataBody(path.join(config.config.Path,
//                                                              'Systems', config.system.Name,
//                                                              'Accounts', config.account.Name + '[' + config.account.Id + ']',
//                                                              'Regions', config.region.Name,
//                                                              'Stacks', config.stack.Name + '-Tags.json')), config.schemas.Tags);
//  const userTags    = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
//                                                              'Tags.json')), config.schemas.Tags);
//
//  // Note the initial merged result contains more information than what is needed or allowed in the API call.
//  // We need this additional information in the calling function, but this must be pruned before the API is called.
//  return util.mergeTags(defaultTags, commonTags, systemTags, accountTags, regionTags, stackTags, userTags);
return [];
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

  return util.getCapabilities(config.options.stack.template.body);
}

const syncTemplate = async (config) => {
  debug(`stack.syncTemplate()`);

  const s3 = new AWS.S3();

  const localETag = calculateETag(config.options.stack.template.body);
  debug(`- local template found (ETag: ${localETag})`);

  try {
    debug('- lookup remote template');
    const headObjectParams = {
      Bucket: config.options.templates.bucket,
      Key: config.options.stack.template.name + '.yaml'
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
      Bucket: config.options.templates.bucket,
      Key: config.options.stack.template.name + '.yaml',
      Body: config.options.stack.template.body
    };
    const data = await s3.putObject(putObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    if (remoteETag == localETag) {
      debug(`- template uploaded (VersionId: ${remoteVersionId})`);
      return;
    }
    else {
      throw new CommandError(`Template ${config.options.stack.template.name}.yaml uploaded, but was corrupted in transit`, errors.TEMPLATE_INVALID);
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

  const localETag = calculateETag(config.options.stack.policy.body);
  debug(`- local stack policy found (ETag: ${localETag})`);

  try {
    debug('- lookup remote stack policy');
    const headObjectParams = {
      Bucket: config.options.templates.bucket,
      Key: config.options.stack.template.name + '-StackPolicy.json'
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
      Bucket: config.options.templates.bucket,
      Key: config.options.stack.template.name + '-StackPolicy.json',
      Body: config.options.stack.policy.body
    };
    const data = await s3.putObject(putObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    if (remoteETag == localETag) {
      debug(`- stack policy uploaded (VersionId: ${remoteVersionId})`);
      return;
    }
    else {
      throw new CommandError(`StackPolicy ${config.options.stack.template.name}-StackPolicy.json uploaded, but was corrupted in transit`, errors.POLICY_INVALID);
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
      Bucket: config.options.functions.bucket,
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
      Bucket: config.options.functions.bucket,
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

const formatStackCommand = (subcommand, config, params) => {
  debug(`stack.formatStackCommand()`);

  let formattedCommand = `dxcf stack ${subcommand} `;

  const formattedSpacer = ' '.repeat(formattedCommand.length);

  // TODO: Simple formatting to start. Eventually, I'd like to color-code this, based on if
  //       an option is the default, set by environment variable, explicitly specified on the
  //       command line, or obtained via the configuration files.
  const formattedVerbose = (config.options.verbose) ? '--verbose ' : '';
  const formattedConfirm = (config.options.confirm) ? '--confirm ' : '';
  const formattedMonitor = (config.options.monitor) ? '--monitor ' : '';
  const formattedWait = (config.options.wait) ? '--wait ' : '';

  const formattedPrerequisite = (config.options.prerequisite) ? '' : '--prerequisite false ';
  const formattedLambda = (config.options.lambda) ? '' : '--lambda false ';
  const formattedPolicy = (config.options.policy) ? '' : '--policy false ';

  const formattedTemplates = `--templates ${config.options.templates.path} `;
  const formattedFunctions = `--functions ${config.options.functions.path} `;
  const formattedScripts = `--scripts ${config.options.scripts.path} `;
  const formattedConfig = `--config ${config.options.config.path} `;

  const formattedSystem = (config.options.system) ? `--system ${config.options.system.Name} ` : '';
  const formattedAccount = (config.options.account) ? `--account ${config.options.account.Name} ` : '';
  const formattedEnvironment = (config.options.environment) ? `--environment ${config.options.environment.Name} ` : '';

  const formattedStack = (config.options.stack) ? `--stack-name ${config.options.stack.name} ` : '';
  const formattedTemplate = (config.options.stack && config.options.stack.template) ? `--template ${config.options.stack.template.name} ` : '';

  const formattedParameters = (params.Parameters) ? util.formatParameters(params.Parameters) : '';
  const formattedTags = (params.Tags) ? util.formatTags(params.Tags) : '';

  const formattedRegion = (config.options.region) ? `--region ${config.options.region.Name} ` : '';
  const formattedUser = (config.options.user) ? `--user ${config.options.user.Name} ` : '';

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

exports.describeStacks = async (config) => {
  debug(`stack.describeStacks()`);

  try {
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
      debug(`- Call cloudformation.describeStacks ${Date.now()}`);
      const data = await cloudformation.describeStacks(describeStacksParams).promise();
      debug(`- Rtrn cloudformation.describeStacks ${Date.now()}`);

      console.log(chalk.bold('\nStacks'));
      console.log(table(data.Stacks.map(s => [ s.StackName, s.StackStatus])));
    }
  }
  catch (err) {
    debug(err);
    throw err;
  }
};

exports.createStack = async (config) => {
  debug(`stack.createStack()`);

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
      stackExists = data.Stacks.some(s => s.StackName == config.options.stack.name);
    }

    if (!stackExists) {
      debug(`- stack ${config.options.stack.name} does not exist`);

      const calculatedParameters = [];
      if (config.options.lambda) {
        debug('- searching for Lambda functions');
        const lrs = util.getTemplateLambdaResourcesSummary(config.options.stack.template.body);

        if (lrs.some(s => s.CodeLocation == 'S3Bucket')) {
          debug('- Lambda functions stored in S3');

          debug('- checking functions bucket');
          try {
            const headBucketParams = {
              Bucket: config.options.functions.bucket
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

      const calculatedCapabilities = getCapabilities(config);
      //const mergedNotificationARNs = getMergedNotificationARNs(config);

      config.initStackConfig(calculatedParameters, calculatedCapabilities);

      // This logic does not yet handle prerequisite stacks which may exist in another account
      // - We would use the same filter on Parameters which end with 'StackName' to find these
      // - However, we'd need more complex logic to check them, including
      //   - Look for a corresponding Parameter ending with 'StackAccountId', if not found, logic for single account below is used
      //   - However, if both a *StackName and *StackAccountId is found, an additional query must be setup and run. This may need
      //     to be a Lambda function. We may want it to be within the template and just fail if not found, instead of a pre-req
      //     search, as these are likely to be rare special cases.
      if (config.options.prerequisite) {
        const requiredStacks = config.data.merged.parameters.filter(p => p.ParameterKey.endsWith('StackName')).map(p => p.ParameterValue);

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
      createStackParams.StackName = config.options.stack.name;

      debug('- checking templates bucket');
      try {
        const headBucketParams = {
          Bucket: config.options.templates.bucket
        };
        await s3.headBucket(headBucketParams).promise();
        debug('- templates bucket found');

        await syncTemplate(config);
        createStackParams.TemplateURL = config.options.stack.template.url;

        if (config.options.policy) {
          await syncStackPolicy(config);
          createStackParams.StackPolicyURL = config.options.stack.policy.url;
        }
      }
      catch (err) {
        if (err.code && err.code == 'NotFound') {
          debug('- templates bucket not found');
          createStackParams.TemplateBody = config.options.stack.template.body;
          if (config.options.policy) {
            createStackParams.StackPolicyBody = config.options.stack.policy.body;
          }
        }
        else {
          debug(err);
          throw err;
        }
      }

      createStackParams.Parameters = config.data.merged.parameters.filter(p => p.ParameterSource != 'Template' )
                                                                  .map(p => ({ ParameterKey: p.ParameterKey, ParameterValue: p.ParameterValue})); // Reduce to minimum needed
      createStackParams.Tags = config.data.merged.tags.map(t => ({ Key: t.Key, Value: t.Value})); // Reduce to minimum needed
      //createStackParams.NotificationARNs = mergedNotificationARNs.map(n => n.ARN); // Reduce to minimum needed
      createStackParams.Capabilities = config.data.calculated.capabilities;
      createStackParams.DisableRollback = true;
      //createStackParams.EnableTerminationProtection = false;
      //createStackParams.TimeoutInMinutes = 0;

      if (config.options.verbose) {
        console.log(chalk.bold(formatStackCommand('create', config, createStackParams)));
      }
      else {
        debug(`Params: ${createStackParams}`);
        debug(`Merged Parameters: ${util.formatMergedParameters(mergedParameters)}`);
        debug(`Merged Tags: ${util.formatMergedTags(mergedTags)}`);
        //debug(`Capabilities: ${util.formatCapabilities(capabilities)}`);
      }

      let createStack = true;
      if (config.options.confirm) {
        let question;
        if (config.options.verbose) {
          question = `\nRun? [Y/n]`;
        }
        else {
          question = `\nCreate Stack '${config.options.stack.name}'? [Y/n]`;
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

        if (config.options.wait || config.options.monitor) {
          const completeStatus = [ 'CREATE_COMPLETE', 'CREATE_FAILED', 'ROLLBACK_COMPLETE' ];
          const describeStackEventsParams = {
            StackName: config.options.stack.name
          };
          const describeStacksParams = {
            StackName: config.options.stack.name
         };
          let status;
          do {
            if (config.options.monitor) {
              const data = await cloudformation.describeStackEvents(describeStackEventsParams).promise();
              console.log(`Stack Events:`);
              for (const se of data.StackEvents.slice(0,5)) {
                console.log(`${se.LogicalResourceId}  ${se.ResourceStatus}  ${se.Timestamp}`);
              }
            }
            await timer(config.options.waitInterval * 1000);
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
      if (! config.options.verbose) {
        debug(`- stack ${config.options.stack.name} exists`);
      }
      throw new CommandError(`Stack ${config.options.stack.name} exists`, errors.STACK_EXISTS);
    }
  }
  catch (err) {
    debug(err);
    throw err;
  }
};
