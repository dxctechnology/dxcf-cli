'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const debug = require('debug')('dxcf:cli:stack');
const table = require('table').table;
const chalk = require('chalk');
const prompt = require('async-prompt');

const AWS = require('aws-sdk');
AWS.config.apiVersions = {
  cloudformation: '2010-05-15',
  s3: '2006-03-01'
};

const util = require(path.join(__dirname, '..', 'util'));
const config = require(path.join(__dirname, '..', 'config'));

const errors = require(path.join(__dirname, '..', 'errors'));
const CommandError = require(path.join(__dirname, '..', 'errors')).CommandError;

const configAWS = (config) => {
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: config.current.profile });
  AWS.config.update({ region: config.current.region.Name });
}

const timer = (ms) => {
  return new Promise(res => setTimeout(res, ms));
}

const calculateETag = (body) => {
  return crypto.createHash('MD5').update(body, 'utf8').digest('hex');
}

const syncTemplate = async (config) => {
  debug(`stack.syncTemplate()`);

  const s3 = new AWS.S3();

  const localETag = calculateETag(config.current.stack.template.body);
  debug(`- local template found (ETag: ${localETag})`);

  try {
    debug('- lookup remote template');
    const headObjectParams = {
      Bucket: config.current.templates.bucket,
      Key: config.current.stack.template.name + '.yaml'
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
      Bucket: config.current.templates.bucket,
      Key: config.current.stack.template.name + '.yaml',
      Body: config.current.stack.template.body
    };
    const data = await s3.putObject(putObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    if (remoteETag == localETag) {
      debug(`- template uploaded (VersionId: ${remoteVersionId})`);
      return;
    }
    else {
      throw new CommandError(`Template ${config.current.stack.template.name}.yaml uploaded, but was corrupted in transit`, errors.TEMPLATE_INVALID);
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

  const localETag = calculateETag(config.current.stack.policy.body);
  debug(`- local stack policy found (ETag: ${localETag})`);

  try {
    debug('- lookup remote stack policy');
    const headObjectParams = {
      Bucket: config.current.templates.bucket,
      Key: config.current.stack.template.name + '-StackPolicy.json'
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
      Bucket: config.current.templates.bucket,
      Key: config.current.stack.template.name + '-StackPolicy.json',
      Body: config.current.stack.policy.body
    };
    const data = await s3.putObject(putObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    if (remoteETag == localETag) {
      debug(`- stack policy uploaded (VersionId: ${remoteVersionId})`);
      return;
    }
    else {
      throw new CommandError(`StackPolicy ${config.current.stack.template.name}-StackPolicy.json uploaded, but was corrupted in transit`, errors.POLICY_INVALID);
    }
  }
  catch (err) {
    debug('- stack policy could not be uploaded');
    throw err;
  }
}

const syncDeploymentPackage = async (config, name) => {
  debug(`stack.syncDeploymentPackage(${name})`);

  const s3 = new AWS.S3();

  const deploymentPackage = util.createDeploymentPackage(config, name);
  const localETag = calculateETag(deploymentPackage);
  debug(`- local deployment package created (ETag: ${localETag})`);

  try {
    debug('- lookup remote deployment package');
    const headObjectParams = {
      Bucket: config.current.functions.bucket,
      Key: name + '.zip'
    };
    const data = await s3.headObject(headObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    debug(`- remote deployment package found (ETag: ${remoteETag})`);
    if (remoteETag == localETag) {
      debug(`- deployment packages identical (VersionId: ${remoteVersionId})`);
      return remoteVersionId;
    }
    else {
      debug('- local deployment package modified');
    }
  }
  catch (err) {
    if (err.code && err.code == 'NotFound') {
      debug('- remote deployment package not found');
    }
    else {
      debug(err);
      throw err;
    }
  }

  try {
    debug('- upload deployment package');
    const putObjectParams = {
      Bucket: config.current.functions.bucket,
      Key: name + '.zip',
      Body: deploymentPackage
    };
    const data = await s3.putObject(putObjectParams).promise();
    const remoteETag = data.ETag.replace(/\"/g, '');
    const remoteVersionId = data.VersionId;
    if (remoteETag == localETag) {
      debug(`- deployment package uploaded (VersionId: ${remoteVersionId})`);
      return remoteVersionId;
    }
    else {
      throw new CommandError(`Deployment package ${name}.zip uploaded, but was corrupted in transit`, errors.FUNCTION_INVALID);
    }
  }
  catch (err) {
    debug('- deployment package could not be uploaded');
    throw err;
  }
}

const formatStackCommand = (config, params, detailed = false) => {
  debug(`stack.formatStackCommand(${config.command.name})`);

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
  const formattedCapabilities = (params.Capabilities) ? util.formatCapabilities(params.Capabilities) : '';

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
    if (formattedCapabilities) {
      formattedCommand += `${formattedCapabilities}`.replace(/\n/g, `\n${formattedSpacer}`);
    }
  }
  if (formattedRegion || formattedUser) {
    formattedCommand += `${formattedRegion}${formattedUser}\\\n${formattedSpacer}`;
  }

  return formattedCommand.replace(/\\\n *$/, '');
}

exports.describeStacks = async (config) => {
  debug(`stack.describeStacks()`);

  const describeStacksParams = {};
  if (config.current.stack && config.current.stack.name) {
    describeStacksParams.StackName = config.current.stack.name;
  };

  if (config.current.flags.verbose) {
    console.log(chalk.bold(formatStackCommand(config, describeStacksParams)));
  }
  else {
    debug(`Params: ${JSON.stringify(describeStacksParams)}`);
  }

  let listStacks = true;
  if (config.current.flags.confirm) {
    let question;
    if (config.current.flags.verbose) {
      question = `\nRun? [Y/n]`;
    }
    else {
      question = `\nList Stacks${(config.current.stack) ? ` ${config.current.stack.name}` : ''}? [Y/n]`;
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
};

exports.describeStacksCommand = async (config) => {
  debug(`stack.describeStacksCommand()`);

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
    config.setCurrentStack();

    // Stack
    config.loadStackData();
    config.mergeStackFlags();
    config.setCurrentFlags();

    // Debug
    //util.debugConfigSourceData(config);
    //util.debugConfigMergedData(config);
    //util.debugConfigCurrent(config);

    configAWS(config);

    await exports.describeStacks(config);
  }
  catch (err) {
    debug(err);
    throw err;
  }
};

const validateTemplate = async (templateBody) => {
  debug(`stack.validateTemplate()`);

  const cloudformation = new AWS.CloudFormation();

  const params = {
    TemplateBody: templateBody
  };
  const data = await cloudformation.validateTemplate(params).promise();
};

const getStackStatus = async (stackName) => {
  debug(`stack.getStackStatus(${stackName})`);

  const cloudformation = new AWS.CloudFormation();

  const params = {
    StackName: stackName
  };
  try {
    const data = await cloudformation.describeStacks(params).promise();
    return data.Stacks[0].StackStatus;
  }
  catch (err) {
    if (err.code == 'ValidationError' && err.statusCode == 400) {
      return 'NOT_FOUND';
    }
    else {
      throw(err);
    }
  }
};

const getStackResourceStatusTable = async (stackName, limit = 10) => {
  debug(`stack.getStackResourceStatusTable(${stackName}, ${limit})`);

  const cloudformation = new AWS.CloudFormation();

  const params = {
    StackName: stackName
  };
  const data = await cloudformation.describeStackResources(params).promise();

  const resources = [];
  for (const sr of data.StackResources.sort((x, y) => y.Timestamp - x.Timestamp).slice(0, limit)) {
    resources.push([ sr.LogicalResourceId, sr.ResourceStatus, sr.Timestamp.toLocaleTimeString()]);
  }
  resources.unshift([ 'Logical Resource ID', 'Status', 'Time' ]);

  const config = {
    columns: { 0: { alignment: 'right' }},
    drawHorizontalLine: (index, size) => {
      return index === 0 || index === 1 || index === size;
    }
  };

  return table(resources, config).replace(/\n$/, '');
};

const checkStackPrerequisites = async (config) => {
  debug(`stack.checkStackPrerequisites()`);

  // This logic does not yet handle prerequisite stacks which may exist in another account
  // - We would use the same filter on Parameters which end with 'StackName' to find these
  // - However, we'd need more complex logic to check them, including
  //   - Look for a corresponding Parameter ending with 'StackAccountId'
  //     - If not found, logic for single account below is used
  //     - Else (<NAME>StackName and <NAME>StackAccountId both found), an additional query must be setup and run.
  //       This may need to be a Lambda function due to cross-account access.
  // - We may want it to be within the template and just fail if not found, instead of a pre-req search, as these are
  //   likely to be rare special cases.
  if (config.current.stack.parameters && config.current.stack.parameters.length > 0) {
    const requiredStacks = config.current.stack.parameters.filter(p => p.ParameterKey.endsWith('StackName'))
                                                          .map(p => p.ParameterValue);
    if (requiredStacks.length > 0) {
      debug(`- Checking Stack pre-requisites...`);

      const cloudformation = new AWS.CloudFormation();

      const data = await cloudformation.describeStacks().promise();

      const validStackStatus = [ 'CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE' ];
      let validStacks = [];

      if (data.Stacks.length > 0) {
        validStacks = data.Stacks.filter(s => validStackStatus.indexOf(s.StackStatus) > -1).map(s => s.StackName);
      }

      for (const s of requiredStacks.slice().reverse()) {
        debug(`  - ${s}`);
        if (! validStacks.includes(s)) {
          throw new CommandError(`Prerequisite Stack ${s} does not exist`, errors.STACK_NOT_FOUND);
        }
      }
    }
    else {
      debug(`- No Stack pre-requisites found`);
    }
  }
  else {
    debug(`- No Stack Parameters found`);
  }
};

const uploadLambdaDeploymentPackages = async (config) => {
  debug(`stack.uploadLambdaDeploymentPackages()`);

  const s3 = new AWS.S3()

  debug('- checking functions bucket');
  try {
    const headBucketParams = {
      Bucket: config.current.functions.bucket
    };
    await s3.headBucket(headBucketParams).promise();
    debug('- functions bucket found');

    const calculatedParameters = [];

    if (config.current.stack.layerDependencies && config.current.stack.layerDependencies.length > 0) {
      debug('- creating and uploading lambda layer deployment packages');
      for (const layerName of config.current.stack.layerDependencies) {
        const deploymentPackageName = `${layerName}Layer`;
        debug(`  - ${deploymentPackageName}`);
        const remoteVersionId = await syncDeploymentPackage(config, deploymentPackageName);
        const parameter = {
          ParameterKey: `${layerName}LayerObjectVersion`,
          ParameterValue: remoteVersionId
        };
        calculatedParameters.push(parameter);
      }
    }

    if (config.current.stack.functionDependencies && config.current.stack.functionDependencies.length > 0) {
      debug('- creating and uploading lambda function deployment packages');
      for (const functionName of config.current.stack.functionDependencies) {
        const deploymentPackageName = functionName;
        debug(`  - ${deploymentPackageName}`);
        const remoteVersionId = await syncDeploymentPackage(config, deploymentPackageName);
        const parameter = {
          ParameterKey: `${functionName}FunctionObjectVersion`,
          ParameterValue: remoteVersionId
        };
        calculatedParameters.push(parameter);
      }
    }

    debug('- merging deployment package version parameters');
    config.updateCurrentStackParameters(calculatedParameters);
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

exports.createStack = async (config) => {
  debug(`stack.createStack()`);

  const s3 = new AWS.S3();

  if (config.current.flags.prerequisite) {
    await checkStackPrerequisites(config);
  }

  if (config.current.flags.lambda &&
      ((config.current.stack.layerDependencies && config.current.stack.layerDependencies.length > 0) ||
       (config.current.stack.functionDependencies && config.current.stack.functionDependencies.length > 0))) {
    await uploadLambdaDeploymentPackages(config);
  }

  const createStackParams = {};
  createStackParams.StackName = config.current.stack.name;

  debug('- checking templates bucket');
  try {
    const headBucketParams = {
      Bucket: config.current.templates.bucket
    };
    await s3.headBucket(headBucketParams).promise();
    debug('- templates bucket found');

    await syncTemplate(config);
    createStackParams.TemplateURL = config.current.stack.template.url;

    if (config.current.flags.policy) {
      await syncStackPolicy(config);
      createStackParams.StackPolicyURL = config.current.stack.policy.url;
      // ToDo: With Update, don't forget StackPolicyDuringUpdate logic
    }
  }
  catch (err) {
    if (err.code && err.code == 'NotFound') {
      debug('- templates bucket not found');
      createStackParams.TemplateBody = config.current.stack.template.body;
      if (config.current.flags.policy) {
        createStackParams.StackPolicyBody = config.current.stack.policy.body;
      }
    }
    else {
      debug(err);
      throw err;
    }
  }

  if (config.current.stack.parameters && config.current.stack.parameters.length > 0) {
    createStackParams.Parameters = config.current.stack.parameters.filter(p => p.ParameterSource != 'Template' )
                                                                  .map(p => ({ ParameterKey: p.ParameterKey, ParameterValue: p.ParameterValue})); // Reduce to minimum needed
  }
  if (config.current.stack.tags && config.current.stack.tags.length > 0) {
    createStackParams.Tags = config.current.stack.tags.map(t => ({ Key: t.Key, Value: t.Value})); // Reduce to minimum needed
  }
  //if (config.current.stack.notifications && config.current.stack.notifications.length > 0) {
  //  createStackParams.NotificationARNs = mergedNotifications.map(n => n.ARN); // Reduce to minimum needed
  //}
  if (config.current.stack.capabilities && config.current.stack.capabilities.length > 0) {
    createStackParams.Capabilities = config.current.stack.capabilities;
  }
  createStackParams.DisableRollback = true;
  //createStackParams.EnableTerminationProtection = false;
  //createStackParams.TimeoutInMinutes = 0;

  //debug(createStackParams);

  if (config.current.flags.verbose) {
    console.log(chalk.bold(formatStackCommand(config, createStackParams)));
  }
  else {
    debug(`Params: ${createStackParams}`);
    debug(`Merged Parameters: ${util.formatMergedParameters(mergedParameters)}`);
    debug(`Merged Tags: ${util.formatMergedTags(mergedTags)}`);
    //debug(`Capabilities: ${util.formatCapabilities(capabilities)}`);
  }

  let createStack = true;
  if (config.current.flags.confirm) {
    let question;
    if (config.current.flags.verbose) {
      question = `\nRun? [Y/n]`;
    }
    else {
      question = `\nCreate Stack '${config.current.stack.name}'? [Y/n]`;
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
    const cloudformation = new AWS.CloudFormation();

    const data = await cloudformation.createStack(createStackParams).promise();
    console.log(chalk.bold(data.StackId));

    if (config.current.flags.wait || config.current.flags.monitor) {
      process.stdout.write(`Waiting...\r`);

      const completeStatus = [ 'CREATE_COMPLETE', 'CREATE_FAILED', 'ROLLBACK_COMPLETE' ];
      let status;
      do {
        await timer(config.current.waitInterval * 1000);
        status = await getStackStatus(config.current.stack.name);

        if (status != 'CREATE_COMPLETE') {
          if (config.current.flags.monitor) {
            console.info(chalk.bold(`Status: ${status}`));
            const output = await getStackResourceStatusTable(config.current.stack.name);
            console.info(output);
          }
          else {
            process.stdout.write(`Status: ${status}, Waiting...\r`);
          }
        }
      } while (completeStatus.indexOf(status) == -1);

      if (status != 'CREATE_COMPLETE') {
        throw new CommandError(`Stack ${config.current.stack.name} creation failed (status: ${status})`, errors.STACK_FAILED);
      }
    }
  }
}

exports.createStackCommand = async (config) => {
  debug(`stack.createStackCommand()`);

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
    config.setCurrentStack();
    config.setCurrentStackTemplate();

    // Stack
    config.loadStackData();
    config.loadTemplateData();
    config.mergeStackData();
    config.setCurrentFlags();
    config.setCurrentStackPolicy();
    config.setCurrentStackParameters();
    config.setCurrentStackTags();
    config.setCurrentStackCapabilities();
    config.setCurrentStackDependencies();
    config.setCurrentWaitInterval();

    // Debug
    //util.debugConfigSourceData(config);
    //util.debugConfigMergedData(config);
    //util.debugConfigCurrent(config);

    configAWS(config);

    const stackExists = (await getStackStatus(config.current.stack.name) != 'NOT_FOUND') ? true : false;

    if (!stackExists) {
      debug(`- stack ${config.current.stack.name} does not exist`);

      await exports.createStack(config);
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
