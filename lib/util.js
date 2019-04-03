'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const schema = require('yaml-cfn').schema;
const execSync = require('child_process').execSync;
const debug = require('debug')('dxcf:cli:util');
const chalk = require('chalk');
const jmsepath = require('jmespath');
const Ajv = require('ajv');

const defaults = require(path.join(__dirname, 'defaults'));

const errors = require(path.join(__dirname, 'errors'));
const CommandError = require(path.join(__dirname, 'errors')).CommandError;

exports.debugOptions = (options) => {
  debug(`util.debugOptions()`);

  if (options.parent.verbose) debug('--verbose');
  if (options.parent.confirm) debug('--confirm');
  if (options.prerequisite) debug('--prerequisite');
  if (options.lambda) debug('--lambda');
  if (options.policy) debug('--policy');
  if (options.monitor) debug('--monitor');
  if (options.wait) debug('--wait');

  if (options.parent.templates) debug(`--templates ${options.parent.templates}`);
  if (options.parent.functions) debug(`--functions ${options.parent.functions}`);
  if (options.parent.scripts) debug(`--scripts ${options.parent.scripts}`);
  if (options.parent.config) debug(`--config ${options.parent.config}`);

  if (options.parent.system) debug(`--system ${options.parent.system}`);
  if (options.parent.account) debug(`--account ${options.parent.account}`);
  if (options.parent.environment) debug(`--environment ${options.parent.environment}`);
  if (options.parent.region) debug(`--region ${options.parent.region}`);
  if (options.parent.user) debug(`--user ${options.parent.user}`);

  if (options.stackName) debug(`--stack-name ${options.stackName}`);
  if (options.templateName) debug(`--template-name ${options.templateName}`);

  if (options.waitInterval) debug(`--wait-interval ${options.waitInterval}`);
}

exports.debugConfig = (config) => {
  debug(`util.debugConfig()`);

  debug(`config.verbose            : ${(config.verbose) ? 'true' : 'false'}`);
  debug(`config.confirm            : ${(config.confirm) ? 'true' : 'false'}`);
  debug(`config.prerequisite       : ${(config.prerequisite) ? 'true' : 'false'}`);
  debug(`config.lambda             : ${(config.lambda) ? 'true' : 'false'}`);
  debug(`config.policy             : ${(config.policy) ? 'true' : 'false'}`);
  debug(`config.monitor            : ${(config.monitor) ? 'true' : 'false'}`);
  debug(`config.wait               : ${(config.wait) ? 'true' : 'false'}`);

  if (config.templates) {
    debug(`config.templates.Path     : ${config.templates.Path}`);
    debug(`config.templates.Bucket   : ${config.templates.Bucket}`);
  }
  if (config.functions) {
    debug(`config.functions.Path     : ${config.functions.Path}`);
    debug(`config.functions.Bucket   : ${config.functions.Bucket}`);
  }
  if (config.scripts) {
    debug(`config.scripts.Path       : ${config.scripts.Path}`);
    debug(`config.scripts.Bucket     : ${config.scripts.Bucket}`);
  }
  if (config.config) {
    debug(`config.config.Path        : ${config.config.Path}`);
    debug(`config.config.Bucket      : ${config.config.Bucket}`);
  }

  if (config.system) {
    debug(`config.system.Name        : ${config.system.Name}`);
    debug(`config.system.Code        : ${config.system.Code}`);
    debug(`config.system.Default     : ${config.system.Default}`);
    debug(`config.system.Source      : ${config.system.Source}`);
  }
  if (config.account) {
    debug(`config.account.Name       : ${config.account.Name}`);
    debug(`config.account.LongName   : ${config.account.LongName}`);
    debug(`config.account.Alias      : ${config.account.Alias}`);
    debug(`config.account.Id         : ${config.account.Id}`);
    debug(`config.account.Default    : ${config.account.Default}`);
    debug(`config.account.Source     : ${config.account.Source}`);
  }
  if (config.environment) {
    debug(`config.environment.Name   : ${config.environment.Name}`);
    debug(`config.environment.Code   : ${config.environment.Code}`);
    debug(`config.environment.Active : ${config.environment.Active}`);
    debug(`config.environment.Default: ${config.environment.Default}`);
    debug(`config.environment.Source : ${config.environment.Source}`);
  }
  if (config.region) {
    debug(`config.region.Name        : ${config.region.Name}`);
    debug(`config.region.LongName    : ${config.region.LongName}`);
    debug(`config.region.Code        : ${config.region.Code}`);
    debug(`config.region.Active      : ${config.region.Active}`);
    debug(`config.region.Default     : ${config.region.Default}`);
    debug(`config.region.Source      : ${config.region.Source}`);
  }
  if (config.user) {
    debug(`config.user.Name          : ${config.user.Name}`);
    debug(`config.user.FullName      : ${config.user.FullName}`);
    debug(`config.user.Email         : ${config.user.Email}`);
    debug(`config.user.Phone         : ${config.user.Phone}`);
    debug(`config.user.Default       : ${config.user.Default}`);
    debug(`config.user.Source        : ${config.user.Source}`);
  }
  if (config.profile) {
    debug(`config.profile            : ${config.profile}`);
  }
  if (config.stack) {
    debug(`config.stack.Name         : ${config.stack.Name}`);
    if (config.stack.template) {
      debug(`config.stack.template.Name: ${config.stack.template.Name}`);
      debug(`config.stack.template.Path: ${config.stack.template.Path}`);
      debug(`config.stack.template.URL : ${config.stack.template.URL}`);
    }
    if (config.stack.policy) {
      debug(`config.stack.policy.Path  : ${config.stack.policy.Path}`);
      debug(`config.stack.policy.URL   : ${config.stack.policy.URL}`);
    }
  }
  if (config.waitInterval)
    debug(`config.waitInterval         : ${config.waitInterval}`);
}

exports.getAWSConfigBody = (filePath) => {
  debug(`util.getAWSConfigBody(${filePath})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (err.code == 'ENOENT')
      throw new CommandError(`AWS config file ${filePath} does not exist`, errors.AWS_CONFIG_NOT_FOUND);
    if (err.code == 'EACCES')
      throw new CommandError(`AWS config file ${filePath} exists but could not be read`, errors.AWS_CONFIG_INVALID);
    throw new CommandError(`AWS config file ${filePath} error (message: ${err.message})`, errors.AWS_CONFIG_INVALID, err.code);
  }
}

exports.getAWSCredentialsBody = (filePath) => {
  debug(`util.getAWSCredentialsBody(${filePath})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (err.code == 'ENOENT')
      throw new CommandError(`AWS credentials file ${filePath} does not exist`, errors.AWS_CREDENTIALS_NOT_FOUND);
    if (err.code == 'EACCES')
      throw new CommandError(`AWS credentials file ${filePath} exists but could not be read`, errors.AWS_CREDENTIALS_INVALID);
    throw new CommandError(`AWS credentials file ${filePath} error (message: ${err.message})`, errors.AWS_CREDENTIALS_INVALID, err.code);
  }
}

exports.validateAWSProfile = (profile) => {
  debug(`util.validateAWSProfile(${profile})`);

  const re = new RegExp(`(?<=(^|\\n))\\[profile ${profile}\\]`);
  if (re.test(exports.getAWSConfigBody(path.join(os.homedir(), '.aws', 'config')))) {
    return true;
  }
  else {
    throw new CommandError(`AWS profile ${profile} does not exist`, errors.AWS_PROFILE_NOT_FOUND);
  }
}

exports.validateAWSRegion = (region) => {
  debug(`util.validateAWSRegion(${region})`);

  // Regions as of 3/7/19
  const regions = new RegExp('^(us-east-1|us-east-2|us-west-1|us-west-2|ca-central-1|eu-west-1|eu-central-1|eu-west-2|eu-west-3|ap-southeast-1|ap-southeast-2|ap-northeast-2|ap-northeast-1|ap-south-1|sa-east-1)$');
  if (regions.test(region)) {
    return true;
  }
  else {
    throw new CommandError(`Region ${region} is invalid`, errors.AWS_REGION_INVALID);
  }
}

exports.validateTemplatesDir = (dirPath) => {
  debug(`util.validateTemplatesDir(${dirPath})`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Templates directory ${dirPath} does not exist`, errors.OPTION_TEMPLATES_NOT_FOUND);
  }

  const expectedFilePath = path.join(dirPath, 'Environment-VPC.yaml');

  try {
    fs.statSync(expectedFilePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Expected template file ${expectedFilePath} does not exist`, errors.OPTION_TEMPLATES_INVALID);
  }
}

exports.validateFunctionsDir = (dirPath) => {
  debug(`util.validateFunctionsDir(${dirPath})`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Functions directory ${dirPath} does not exist`, errors.OPTION_FUNCTIONS_NOT_FOUND);
  }

  const expectedFilePath = path.join(dirPath, 'HostName', 'HostName.js');

  try {
    fs.statSync(expectedFilePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Expected function file ${expectedFilePath} does not exist`, errors.OPTION_FUNCTIONS_INVALID);
  }
}

exports.validateScriptsDir = (dirPath) => {
  debug(`util.validateScriptsDir(${dirPath})`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Scripts directory ${dirPath} does not exist`, errors.OPTION_SCRIPTS_NOT_FOUND);
  }

  const expectedFilePath = path.join(dirPath, 'Linux', 'configure-hostname');

  try {
    fs.statSync(expectedFilePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Expected script file ${expectedFilePath} does not exist`, errors.OPTION_SCRIPTS_INVALID);
  }
}

exports.validateConfigDir = (dirPath) => {
  debug(`util.validateConfigDir(${dirPath})`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Configuration directory ${dirPath} does not exist`, errors.OPTION_CONFIG_NOT_FOUND);
  }

  const systemsDirPath = path.join(dirPath, 'Systems');

  try {
    fs.statSync(systemsDirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Expected configuration Systems directory ${systemsDirPath} does not exist`, errors.OPTION_CONFIG_INVALID);
  }

  const systemsFilePath = path.join(dirPath, 'Systems.json');

  try {
    fs.statSync(systemsFilePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Expected configuration data file ${systemsFilePath} does not exist`, errors.OPTION_CONFIG_INVALID);
  }

  return true;
}

exports.getSchemaBody = (filePath) => {
  debug(`util.getSchemaBody(${path.parse(filePath).base})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (err.code == 'ENOENT')
      throw new CommandError(`Schema file ${filePath} does not exist`, errors.SCHEMA_NOT_FOUND);
    if (err.code == 'EACCES')
      throw new CommandError(`Schema file ${filePath} exists but could not be read`, errors.SCHEMA_INVALID);
    throw new CommandError(`Schema file ${filePath} error (message: ${err.message})`, errors.SCHEMA_INVALID, err.code);
  }
}

exports.getSchema = (schemaBody) => {
  debug(`util.getSchema()`);

  try {
    return JSON.parse(schemaBody);
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Schema body could not be parsed as JSON (message: ${err.message})`, errors.SCHEMA_INVALID, err.code);
  }
}

exports.getDataBody = (filePath) => {
  debug(`util.getDataBody(${path.parse(filePath).base})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    if (err.code == 'ENOENT')
      return ''; // Missing file treated as empty String
    debug(err);
    if (err.code == 'EACCES')
      throw new CommandError(`Data file ${filePath} exists but could not be read`, errors.DATA_INVALID);
    throw new CommandError(`Data file ${filePath} error (message: ${err.message})`, errors.DATA_INVALID, err.code);
  }
}

exports.getData = (dataBody, schema) => {
  debug(`util.getData()`);

  if (dataBody.length > 0) {
    let data = [];

    try {
      data = JSON.parse(dataBody);
    }
    catch (err) {
      debug(err);
      throw new CommandError(`Data body could not be parsed as JSON (message: ${err.message})`, errors.DATA_INVALID, err.code);
    }

    const ajv = new Ajv();

    const validate = ajv.compile(schema);
    if (validate(data)) {
      return data;
    }
    else {
      debug(validate.errors);
      throw new CommandError(`Data JSON does not match schema (message: ${validate.errors[0].message}; enable DEBUG for more detail)`, errors.DATA_INVALID, err.code);
    }
  }
  else {
    return []; // Missing file treated as empty Array
  }
}

// This is a generic function to merge data which consists of arrays of objects.
// It is used unless there is a need for a more specialized data merge function, such as with Parameters
exports.mergeData = (defaultData, commonData, systemData, accountData, regionData, stackData, userData) => {
  debug(`util.mergeData()`);

  let mergedData = [];

  debug('- Default');
  for (const object of defaultData) {
    object.Source = 'Default';
    debug(`  - ${object.Name}`);
    mergedData.push(object);
  }

  debug('- Common');
  for (const object of commonData) {
    object.Source = 'Common';

    if (object.Default && object.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == object.Name);

    if (i >= 0) {
      debug(`  - ${object.Name} (replaced)`);
      for (const objectKey of Object.keys(object)) {
        mergedData[i][objectKey] = object[objectKey];
      }
    }
    else {
      debug(`  - ${object.Name} (added)`);
      mergedData.push(object);
    }
  }

  debug('- System');
  for (const object of systemData) {
    object.Source = 'System';

    if (object.Default && object.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == object.Name);

    if (i >= 0) {
      debug(`  - ${object.Name} (replaced)`);
      for (const objectKey of Object.keys(object)) {
        mergedData[i][objectKey] = object[objectKey];
      }
    }
    else {
      debug(`  - ${object.Name} (added)`);
      mergedData.push(object);
    }
  }

  debug('- Account');
  for (const object of accountData) {
    object.Source = 'Account';

    if (object.Default && object.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == object.Name);

    if (i >= 0) {
      debug(`  - ${object.Name} (replaced)`);
      for (const objectKey of Object.keys(object)) {
        mergedData[i][objectKey] = object[objectKey];
      }
    }
    else {
      debug(`  - ${object.Name} (added)`);
      mergedData.push(object);
    }
  }

  debug('- Region');
  for (const object of regionData) {
    object.Source = 'Region';

    if (object.Default && object.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == object.Name);

    if (i >= 0) {
      debug(`  - ${object.Name} (replaced)`);
      for (const objectKey of Object.keys(object)) {
        mergedData[i][objectKey] = object[objectKey];
      }
    }
    else {
      debug(`  - ${object.Name} (added)`);
      mergedData.push(object);
    }
  }

  debug('- Stack');
  for (const object of stackData) {
    object.Source = 'Stack';

    if (object.Default && object.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == object.Name);

    if (i >= 0) {
      debug(`  - ${object.Name} (replaced)`);
      for (const objectKey of Object.keys(object)) {
        mergedData[i][objectKey] = object[objectKey];
      }
    }
    else {
      debug(`  - ${object.Name} (added)`);
      mergedData.push(object);
    }
  }

  debug('- User');
  for (const object of userData) {
    object.Source = 'User';

    if (object.Default && object.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == object.Name);

    if (i >= 0) {
      debug(`  - ${object.Name} (replaced)`);
      for (const objectKey of Object.keys(object)) {
        mergedData[i][objectKey] = object[objectKey];
      }
    }
    else {
      debug(`  - ${object.Name} (added)`);
      mergedData.push(object);
    }
  }

  return mergedData;
}

exports.getTemplateBody = (filePath) => {
  debug(`util.getTemplateBody(${path.parse(filePath).base})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (err.code == 'ENOENT')
      throw new CommandError(`Template file ${filePath} does not exist`, errors.TEMPLATE_NOT_FOUND);
    if (err.code == 'EACCES')
      throw new CommandError(`Template file ${filePath} exists but could not be read`, errors.TEMPLATE_INVALID);
    throw new CommandError(`Template file ${filePath} error (message: ${err.message})`, errors.TEMPLATE_INVALID, err.code);
  }
}

exports.getStackPolicyBody = (filePath) => {
  debug(`util.getStackPolicyBody(${path.parse(filePath).base})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (err.code == 'ENOENT')
      throw new CommandError(`Stack policy file ${filePath} does not exist`, errors.POLICY_NOT_FOUND);
    if (err.code == 'EACCES')
      throw new CommandError(`Stack policy file ${filePath} exists but could not be read`, errors.POLICY_INVALID);
    throw new CommandError(`Stack policy file ${filePath} error (message: ${err.message})`, errors.POLICY_INVALID, err.code);
  }
}

exports.getTemplateSections = (templateBody) => {
  debug(`util.getTemplateSections()`);

  return templateBody.match(/(?<=^|\n)((AWSTemplateFormatVersion|Description|Metadata|Parameters|Mappings|Conditions|Transform|Resources|Outputs))(:\s*?\n|:\s*?.*\n)/g).map(s => s.replace(/:.*\n/, ''));
}

exports.getTemplateParameters = (templateBody) => {
  debug(`util.getTemplateParameters()`);

  const templateParameters = [];

  if (! /(?<=^|\n)Parameters:(?=\s*?\n)/.test(templateBody)) {
    debug('- Template body does not contain Parameters section'); // Not an error
    return templateParameters;
  }

  const templateParametersBody = templateBody.match(/(?<=(^|\n)Parameters:\s*?\n)(\s*.*\n)*?(?=($|\S.*\n))/g)[0];

  if (templateParametersBody.length <= 0) {
    throw new CommandError('Template Parameters section could not be extracted from template body', errors.TEMPLATE_INVALID);
  }

  const templateParametersSection = yaml.safeLoad(templateParametersBody);

  for (const templateParameterKey of Object.keys(templateParametersSection))
    templateParameters.push({ ParameterKey: templateParameterKey, ParameterValue: templateParametersSection[templateParameterKey].Default});

  return templateParameters;
}

// The logic to search for and modify Lambda functions is tightly coupled to the naming conventions used. Changes to how functions are named, how parameters
// related to Functions are named, or the directory and file path naming convention will break this logic, so don't do that!
exports.getTemplateLambdaResourcesSummary = (templateBody) => {
  debug(`util.getTemplateLambdaResourcesSummary()`);

  const templateLambdaResourcesSummary = [];

  if (! /(?<=^|\n)Resources:(?=\s*?\n)/.test(templateBody)) {
    throw new CommandError('Template body does not contain Resources section!', errors.TEMPLATE_INVALID); // This is a serious error
  }

  const templateResourcesBody = templateBody.match(/(?<=(^|\n)Resources:\s*?\n)(\s*.*\n)*?(?=($|\S.*\n))/g)[0];

  if (templateResourcesBody.length <= 0) {
    throw new CommandError('Template Resources section could not be extracted from template body', errors.TEMPLATE_INVALID);
  }

  const templateResources = yaml.safeLoad(templateResourcesBody, { schema: schema });

  for (const templateResourceKey of Object.keys(templateResources)) {
    if (templateResources[templateResourceKey].Type == 'AWS::Lambda::Function') {
      // TODO: Attempt to detect failure to conform to Lambda Function Naming Convention expected by this CLI
      // This CLI currently does not handle the Serverless Pattern, but that is a likely future enhancement
      // Until this CLI handles other Lambda Function Formats, the logic to detect and upload Lambda Function
      // Packages stored in S3 requires adherence to certain rules, which this section will attempt to validate
      //if (/(?<=^|\n)Resources:(?=\s*?\n)/.test(templateResourceKey)) {
      //}
      //else {
      //  throw new Error('Template body does not contain Resources section!'); // By definition, this is an invalid template!
      //}

      debug(`- Function: ${templateResourceKey.replace(/Function$/, '')}`);
      const functionName = templateResourceKey.replace(/Function$/, '');
      const functionRuntime = templateResources[templateResourceKey].Properties.Runtime;
      const functionCodeLocation = (templateResources[templateResourceKey].Properties.Code.ZipFile) ? 'ZipFile' : 'S3Bucket';
      const functionCodeVersioned = (functionCodeLocation == 'S3Bucket' &&
                                     templateResources[templateResourceKey].Properties.Code.S3ObjectVersion) ? true : false;
      templateLambdaResourcesSummary.push({ Name: functionName,
                                            Runtime: functionRuntime,
                                            CodeLocation: functionCodeLocation,
                                            CodeVersioned: functionCodeVersioned });
    }
  }

  return templateLambdaResourcesSummary;
}

exports.getParametersBody = (filePath) => {
  debug(`util.getParametersBody(${path.parse(filePath).base})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    if (err.code == 'ENOENT')
      return ''; // Missing file treated as empty String
    debug(err);
    if (err.code == 'EACCES')
      throw new CommandError(`Parameters file ${filePath} exists but could not be read`, errors.PARAMETERS_INVALID);
    throw new CommandError(`Parameters file ${filePath} error (message: ${err.message})`, errors.PARAMETERS_INVALID, err.code);
  }
}

exports.getParameters = (parametersBody, schema) => {
  debug(`util.getParameters()`);

  if (parametersBody.length > 0) {
    let parameters = [];

    try {
      parameters = JSON.parse(parametersBody);
    }
    catch (err) {
      debug(err);
      throw new CommandError(`Parameters body could not be parsed as JSON (message: ${err.message})`, errors.PARAMETERS_INVALID);
    }

    const ajv = new Ajv();

    const validate = ajv.compile(schema);
    if (validate(parameters)) {
      return parameters;
    }
    else {
      debug(validate.errors);
      throw new CommandError(`Parameters JSON does not match schema (message: ${validate.errors[0].message}; enable DEBUG for more detail)`, errors.PARAMETERS_INVALID);
    }
  }
  else {
    return []; // Missing file treated as empty Array
  }
}

exports.mergeParameters = (templateParameters,
                           defaultParameters,
                           commonParameters,
                           systemParameters,
                           accountParameters,
                           regionParameters,
                           stackParameters,
                           userParameters,
                           secureParameters,
                           calculatedParameters) => {
  debug(`util.mergeParameters()`);

  let mergedParameters = [];

  for (const templateParameter of templateParameters) {
    const parameterKey = templateParameter.ParameterKey;
    let parameterValue = templateParameter.ParameterValue;
    let parameterSource = 'Template';

    debug(`- ${parameterKey}: ${parameterValue} (${parameterSource})`);

    if (defaultParameters) {
      const defaultParameter = defaultParameters.find(p => p.ParameterKey == parameterKey);
      if (defaultParameter) {
        parameterSource = 'Default';
        parameterValue = defaultParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    if (commonParameters) {
      const commonParameter = commonParameters.find(p => p.ParameterKey == parameterKey);
      if (commonParameter) {
        parameterSource = 'Common';
        parameterValue = commonParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    if (systemParameters) {
      const systemParameter = systemParameters.find(p => p.ParameterKey == parameterKey);
      if (systemParameter) {
        parameterSource = 'System';
        parameterValue = systemParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    if (accountParameters) {
      const accountParameter = accountParameters.find(p => p.ParameterKey == parameterKey);
      if (accountParameter) {
        parameterSource = 'Account';
        parameterValue = accountParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    if (regionParameters) {
      const regionParameter = regionParameters.find(p => p.ParameterKey == parameterKey);
      if (regionParameter) {
        parameterSource = 'Region';
        parameterValue = regionParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    if (stackParameters) {
      let stackParameter = stackParameters.find(p => p.ParameterKey == parameterKey);
      if (stackParameter) {
        parameterSource = 'Stack';
        parameterValue = stackParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    if (userParameters) {
      let userParameter = userParameters.find(p => p.ParameterKey == parameterKey);
      if (userParameter) {
        parameterSource = 'User';
        parameterValue = userParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    if (secureParameters) {
      let secureParameter = secureParameters.find(p => p.ParameterKey == parameterKey);
      if (secureParameter) {
        parameterSource = 'Secure';
        parameterValue = secureParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    if (calculatedParameters) {
      let calculatedParameter = calculatedParameters.find(p => p.ParameterKey == parameterKey);
      if (calculatedParameter) {
        parameterSource = 'Calculated';
        parameterValue = calculatedParameter.ParameterValue;
        debug(`  ${' '.repeat(parameterKey.length)}: ${parameterValue} (${parameterSource})`);
      }
    }

    mergedParameters.push({ ParameterKey: parameterKey,
                            ParameterValue: parameterValue,
                            ParameterSource: parameterSource });
  }

  return mergedParameters;
}

exports.formatParameters = (parameters, maxValueLength = 80) => {
  debug(`util.formatParameters()`);

  if (maxValueLength <= 0) maxValueLength = 4000;

  let formattedParameters = '';
  if (parameters.length > 0) {
    for (const parameter of parameters) {
      let key = parameter.ParameterKey;
      let value = parameter.ParameterValue;

      if (value.length > maxValueLength) {
        value = value.toString().slice(0, maxValueLength - 3) + '...';
      }
      if (! /^\S*$/.test(value)) {
        value = `"${value}"`;
      }
      formattedParameters += `--parameter ${key}=${value} \\\n`;
    }
  }

  return chalk.keyword('blue')(formattedParameters);
}

exports.formatMergedParameters = (parameters, maxValueLength = 80) => {
  debug(`util.formatParameters()`);

  if (maxValueLength <= 0) maxValueLength = 4000;
  const maxParameterKeyLength = parameters.reduce((l,s) => l > s.ParameterKey.length ? l : s.ParameterKey.length, 0);
  const maxParameterValueLength = Math.min(parameters.reduce((l,s) => l > s.ParameterValue.toString().length ? l : s.ParameterValue.toString().length, 0), maxValueLength);

  let formattedParameters = '[';
  if (parameters.length > 0) {
    for (const parameter of parameters) {
      let parameterKey = parameter.ParameterKey;
      let parameterValue = parameter.ParameterValue;
      let parameterSource = parameter.ParameterSource;

      if (parameterValue.length > maxValueLength) {
        parameterValue = parameterValue.toString().slice(0, maxValueLength - 3) + '...';
      }
      formattedParameters += '\n  { '
                          +  '"ParameterKey": '
                          +  '"' + parameterKey + '", '
                          +  ' '.repeat(maxParameterKeyLength - parameterKey.length)
                          +  '"ParameterValue": '
                          +  '"' + parameterValue + '"'
                          +  ' },';
      if (parameterSource) {
        formattedParameters += ' '.repeat(maxParameterValueLength - parameterValue.toString().length)
                            +  ' (' + parameterSource + ')'
      }
    }
    formattedParameters = formattedParameters.replace(/},(.*)$/, '} $1');
  }
  formattedParameters += '\n]';

  return formattedParameters;
}

exports.mergeTags = (defaultTags, commonTags, systemTags, accountTags, regionTags, stackTags, userTags) => {
  debug(`util.mergeTags()`);

  let mergedTags = [];

  debug('- Default');
  for (const tag of defaultTags) {
    tag.Source = 'Default';
    debug(`  - ${tag.Key}`);
    mergedTags.push(tag);
  }

  debug('- Common');
  for (const tag of commonTags) {
    tag.Source = 'Common';
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      for (const key of Object.keys(tag)) {
        mergedTags[i][key] = tag[key];
      }
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push(tag);
    }
  }

  debug('- System');
  for (const tag of systemTags) {
    tag.Source = 'System';
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      for (const key of Object.keys(tag)) {
        mergedTags[i][key] = tag[key];
      }
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push(tag);
    }
  }

  debug('- Account');
  for (const tag of accountTags) {
    tag.Source = 'Account';
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      for (const key of Object.keys(tag)) {
        mergedTags[i][key] = tag[key];
      }
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push(tag);
    }
  }

  debug('- Region');
  for (const tag of regionTags) {
    tag.Source = 'Region';
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      for (const key of Object.keys(tag)) {
        mergedTags[i][key] = tag[key];
      }
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push(tag);
    }
  }

  debug('- Stack');
  for (const tag of stackTags) {
    tag.Source = 'Stack';
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      for (const key of Object.keys(tag)) {
        mergedTags[i][key] = tag[key];
      }
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push(tag);
    }
  }

  debug('- User');
  for (const tag of userTags) {
    tag.Source = 'User';
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      for (const key of Object.keys(tag)) {
        mergedTags[i][key] = tag[key];
      }
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push(tag);
    }
  }

  return mergedTags;
}

exports.formatTags = (tags, maxValueLength = 80) => {
  debug(`util.formatTags()`);

  if (maxValueLength <= 0) maxValueLength = 4000;

  let formattedTags = '';
  if (tags.length > 0) {
    for (const tag of tags) {
      let key = tag.Key;
      let value = tag.Value;

      if (value.length > maxValueLength) {
        value = value.toString().slice(0, maxValueLength - 3) + '...';
      }
      if (! /^\S*$/.test(value)) {
        value = `"${value}"`;
      }
      formattedTags += `--tag ${key}=${value} \\\n`;
    }
  }

  return chalk.keyword('blue')(formattedTags);
}

exports.formatMergedTags = (tags, maxValueLength = 80) => {
  debug(`util.formatMergedTags()`);

  if (maxValueLength <= 0) maxValueLength = 4000;
  const maxTagKeyLength = tags.reduce((l,s) => l > s.Key.length ? l : s.Key.length, 0);
  const maxTagValueLength = Math.min(tags.reduce((l,s) => l > s.Value.toString().length ? l : s.Value.toString().length, 0), maxValueLength);

  let formattedTags = '[';
  if (tags.length > 0) {
    for (const tag of tags) {
      let key = tag.Key;
      let value = tag.Value;
      let source = tag.Source;

      if (value.length > maxValueLength) {
        value = value.toString().slice(0, maxValueLength - 3) + '...';
      }
      formattedTags += '\n  { '
                    +  '"Key": '
                    +  '"' + key + '", '
                    +  ' '.repeat(maxTagKeyLength - key.length)
                    +  '"Value": '
                    +  '"' + value + '"'
                    +  ' },';
      if (source) {
        formattedTags += ' '.repeat(maxTagValueLength - value.toString().length)
                      +  ' (' + source + ')'
      }
    }
    formattedTags = formattedTags.replace(/},(.*)$/, '} $1');
  }
  formattedTags += '\n]';

  return formattedTags;
}

exports.getCapabilities = (templateBody) => {
  debug(`util.getCapabilities()`);

  if (/AWS::IAM::(Group|Role|User)/.test(templateBody)) {
    debug('- Found IAM resources');
    if (/\n *(Group|Role|User)Name:/.test(templateBody)) {
      debug('  - Found IAM named resources');
      return [ 'CAPABILITY_NAMED_IAM' ];
    }
    else {
      return [ 'CAPABILITY_IAM' ];
    }
  }
  else {
    return [];
  }
}

exports.createLambdaDeploymentPackage = (config, name) => {
  debug(`util.createLambdaDeploymentPackage(${name})`);

  const functionFolderPath = path.join(config.functions.Path, name);
  const zipFilePath = path.join(config.functions.Path, name + '.zip');

  debug(`- Function Folder: ${functionFolderPath}`);
  debug(`- Function Zip File: ${zipFilePath}`);

  try {
    fs.unlinkSync(zipFilePath);
  }
  catch (err) {
    if (err.code == 'ENOENT') {
      ; // Missing file not an error
    }
    else {
      debug(err);
      if (err.code == 'EACCES')
        throw new CommandError(`Lambda deployment package file ${zipFilePath} exists but could not be deleted`, errors.FUNCTION_INVALID);
      throw new CommandError(`Lambda deployment package file ${zipFilePath} deletion error (message: ${err.message})`, errors.FUNCTION_INVALID, err.code);
    }
  }

  try {
    if (process.platform !== 'win32') {
      execSync(`cd ${functionFolderPath}; zip -X -r ${zipFilePath} .`);
    }
    else {
      execSync(`powershell.exe -nologo -noprofile -command "Add-Type -A System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory('${functionFolderPath}', '${zipFilePath}')"`);
    }
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Lambda deployment package file ${zipFilePath} creation error (message: ${err.message})`, errors.FUNCTION_INVALID, err.code);
  }

  try {
    return fs.readFileSync(zipFilePath); // Binary data, no encoding
  }
  catch (err) {
    debug(err);
    if (err.code == 'ENOENT')
      throw new CommandError(`Lambda deployment package file ${zipFilePath} does not exist`, errors.FUNCTION_NOT_FOUND);
    if (err.code == 'EACCES')
      throw new CommandError(`Lambda deployment package file ${zipFilePath} exists but could not be read`, errors.FUNCTION_INVALID);
    throw new CommandError(`Lambda deployment package file ${zipFilePath} error (message: ${err.message})`, errors.FUNCTION_INVALID, err.code);
  }
}

exports.filterObject = (obj, options) => {
  debug(`util.filterObject()`);
  if (options.query) {
    debug('- filtering results with query: ' + options.query);
    return jmsepath.search(obj, options.query);
  }
  return obj;
}
