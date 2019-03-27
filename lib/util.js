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

exports.debugOptions = (options) => {
  debug(`util.debugOptions()`);

  if (options.parent.verbose) debug('--verbose');
  if (options.parent.confirm) debug('--confirm');
  if (options.prerequisite) debug('--prerequisite');
  if (options.lambda) debug('--lambda');
  if (options.monitor) debug('--monitor');
  if (options.wait) debug('--wait');

  if (options.parent.home) debug(`--home ${options.parent.home}`);
  if (options.parent.templates) debug(`--templates ${options.parent.templates}`);
  if (options.parent.functions) debug(`--functions ${options.parent.functions}`);
  if (options.parent.scripts) debug(`--scripts ${options.parent.scripts}`);
  if (options.parent.confign) debug(`--config ${options.parent.config}`);

  if (options.parent.owner) debug(`--owner ${options.parent.owner}`);
  if (options.parent.company) debug(`--company ${options.parent.company}`);
  if (options.parent.system) debug(`--system ${options.parent.system}`);
  if (options.parent.environment) debug(`--environment ${options.parent.environment}`);
  if (options.parent.region) debug(`--region ${options.parent.region}`);
  if (options.parent.account) debug(`--account ${options.parent.account}`);
  if (options.parent.user) debug(`--user ${options.parent.user}`);

  if (options.stackName) debug(`--stack-name ${options.stackName}`);
  if (options.templateName) debug(`--template-name ${options.templateName}`);

  if (options.waitInterval) debug(`--wait-interval ${options.waitInterval}`);
}

exports.getAWSConfigBody = (filePath) => {
  debug(`util.getAWSConfigBody(${filePath})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (/^ENOENT:/.test(err.message))
      throw new Error(`AWS config file ${filePath} does not exist`);
    if (/^EACCES:/.test(err.message))
      throw new Error(`AWS config file ${filePath} exists but could not be read`);
    throw new Error(`AWS config file ${filePath} error (message: ${err.message})`);
  }
}

exports.getAWSCredentialsBody = (filePath) => {
  debug(`util.getAWSCredentialsBody(${filePath})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (/^ENOENT:/.test(err.message))
      throw new Error(`AWS credentials file ${filePath} does not exist`);
    if (/^EACCES:/.test(err.message))
      throw new Error(`AWS credentials file ${filePath} exists but could not be read`);
    throw new Error(`AWS credentials file ${filePath} error (message: ${err.message})`);
  }
}

exports.validateAWSProfile = (profile) => {
  debug(`util.validateAWSProfile(${profile})`);

  const re = new RegExp(`(?<=(^|\\n))\\[profile ${profile}\\]`);
  if (re.test(exports.getAWSConfigBody(path.join(os.homedir(), '.aws', 'config')))) {
    return true;
  }
  else {
    throw new Error(`AWS profile ${profile} does not exist`);
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
    throw new Error(`Region ${region} is invalid`);
  }
}

exports.validateTemplatesDir = (dirPath) => {
  debug(`util.validateTemplatesDir(${dirPath})`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new Error(`Templates directory ${dirPath} does not exist`);
  }

  const expectedFilePath = path.join(dirPath, 'Environment-VPC.yaml');

  try {
    fs.statSync(expectedFilePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new Error(`Templates expected file ${expectedFilePath} does not exist`);
  }
}

exports.validateFunctionsDir = (dirPath) => {
  debug(`util.validateFunctionsDir(${dirPath})`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new Error(`Functions directory ${dirPath} does not exist`);
  }

  const expectedFilePath = path.join(dirPath, 'HostName', 'HostName.js');

  try {
    fs.statSync(expectedFilePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new Error(`Functions expected file ${expectedFilePath} does not exist`);
  }
}

exports.validateScriptsDir = (dirPath) => {
  debug(`util.validateScriptsDir(${dirPath})`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new Error(`Scripts directory ${dirPath} does not exist`);
  }

  const expectedFilePath = path.join(dirPath, 'Linux', 'configure-hostname');

  try {
    fs.statSync(expectedFilePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new Error(`Scripts expected file ${expectedFilePath} does not exist`);
  }
}

exports.validateConfigDir = (dirPath) => {
  debug(`util.validateConfigDir(${dirPath})`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new Error(`Configuration directory ${dirPath} does not exist`);
  }

  const systemsDirPath = path.join(dirPath, 'Systems');

  try {
    fs.statSync(systemsDirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new Error(`Configuration Systems directory ${systemsDirPath} does not exist`);
  }

  const systemsFilePath = path.join(dirPath, 'Systems.json');

  try {
    fs.statSync(systemsFilePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new Error(`Configuration Systems data file ${systemsFilePath} does not exist`);
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
    if (/^ENOENT:/.test(err.message))
      throw new Error(`Schema file ${filePath} does not exist`);
    if (/^EACCES:/.test(err.message))
      throw new Error(`Schema file ${filePath} exists but could not be read`);
    throw new Error(`Schema file ${filePath} error (message: ${err.message})`);
  }
}

exports.getSchema = (schemaBody) => {
  debug(`util.getSchema()`);

  try {
    return JSON.parse(schemaBody);
  }
  catch (err) {
    debug(err);
    throw new Error(`Schema body could not be parsed as JSON (message: ${err.message})`);
  }
}

exports.getDataBody = (filePath) => {
  debug(`util.getDataBody(${path.parse(filePath).base})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    if (/^ENOENT:/.test(err.message))
      return ''; // Missing file treated as empty String
    debug(err);
    if (/^EACCES:/.test(err.message))
      throw new Error(`Data file ${filePath} exists but could not be read`);
    throw new Error(`Data file ${filePath} error (message: ${err.message})`);
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
      throw new Error(`Data body could not be parsed as JSON (message: ${err.message})`);
    }

    const ajv = new Ajv();

    const validate = ajv.compile(schema);
    if (validate(data)) {
      return data;
    }
    else {
      debug(validate.errors);
      throw new Error(`Data JSON does not match schema (message: ${validate.errors[0].message}; enable DEBUG for more detail)`);
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
    if (/^ENOENT:/.test(err.message))
      throw new Error(`Template file ${filePath} does not exist`);
    if (/^EACCES:/.test(err.message))
      throw new Error(`Template file ${filePath} exists but could not be read`);
    throw new Error(`Template file ${filePath} error (message: ${err.message})`);
  }
}

exports.getStackPolicyBody = (filePath) => {
  debug(`util.getStackPolicyBody(${path.parse(filePath).base})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (/^ENOENT:/.test(err.message))
      throw new Error(`Stack policy file ${filePath} does not exist`);
    if (/^EACCES:/.test(err.message))
      throw new Error(`Stack policy file ${filePath} exists but could not be read`);
    throw new Error(`Stack policy file ${filePath} error (message: ${err.message})`);
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
    debug('Template body does not contain Parameters section'); // Not an error
    return templateParameters;
  }

  const templateParametersBody = templateBody.match(/(?<=(^|\n)Parameters:\s*?\n)(\s*.*\n)*?(?=($|\S.*\n))/g)[0];

  if (templateParametersBody.length <= 0) {
    throw new Error('Template Parameters section could not be extracted from template body');
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
    throw new Error('Template body does not contain Resources section!'); // This is a serious error
  }

  const templateResourcesBody = templateBody.match(/(?<=(^|\n)Resources:\s*?\n)(\s*.*\n)*?(?=($|\S.*\n))/g)[0];

  if (templateResourcesBody.length <= 0) {
    throw new Error('Template Resources section could not be extracted from template body');
  }

  const templateResources = yaml.safeLoad(templateResourcesBody, { schema: schema });

  for (const templateResourceKey of Object.keys(templateResources)) {
    if (templateResources[templateResourceKey].Type == 'AWS::Lambda::Function') {
      // Attempt to detect failure to conform to Lambda Function Naming Convention expected by this CLI
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
    if (/^ENOENT:/.test(err.message))
      return ''; // Missing file treated as empty String
    debug(err);
    if (/^EACCES:/.test(err.message))
      throw new Error(`Parameters file ${filePath} exists but could not be read`);
    throw new Error(`Parameters file ${filePath} error (message: ${err.message})`);
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
      throw new Error(`Parameters body could not be parsed as JSON (message: ${err.message})`);
    }

    const ajv = new Ajv();

    const validate = ajv.compile(schema);
    if (validate(parameters)) {
      return parameters;
    }
    else {
      debug(validate.errors);
      throw new Error(`Parameters JSON does not match schema (message: ${validate.errors[0].message}; enable DEBUG for more detail)`);
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
  const maxParameterKeyLength = parameters.reduce((l,s) => l > s.ParameterKey.length ? l : s.ParameterKey.length, 0);
  const maxParameterValueLength = Math.min(parameters.reduce((l,s) => l > s.ParameterValue.toString().length ? l : s.ParameterValue.toString().length, 0), maxValueLength);

  let formattedParameters = '['
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
  const maxTagKeyLength = tags.reduce((l,s) => l > s.Key.length ? l : s.Key.length, 0);
  const maxTagValueLength = Math.min(tags.reduce((l,s) => l > s.Value.toString().length ? l : s.Value.toString().length, 0), maxValueLength);

  let formattedTags = '['
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
    if (/^ENOENT:/.test(err.message)) {
      ; // Missing file not an error
    }
    else {
      debug(err);
      if (/^EACCES:/.test(err.message))
        throw new Error(`Lambda deployment package file ${zipFilePath} exists but could not be deleted`);
      throw new Error(`Lambda deployment package file ${zipFilePath} deletion error (message: ${err.message})`);
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
    throw new Error(`Lambda deployment package file ${zipFilePath} creation error (message: ${err.message})`);
  }

  try {
    return fs.readFileSync(zipFilePath); // Binary data, no encoding
  }
  catch (err) {
    debug(err);
    if (/^ENOENT:/.test(err.message))
      throw new Error(`Lambda deployment package file ${zipFilePath} does not exist`);
    if (/^EACCES:/.test(err.message))
      throw new Error(`Lambda deployment package file ${zipFilePath} exists but could not be read`);
    throw new Error(`Lambda deployment package file ${zipFilePath} error (message: ${err.message})`);
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
