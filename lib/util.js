'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const schema = require('yaml-cfn').schema;
const clone = require('clone');
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

exports.debugConfigSchemas = (config) => {
  debug(`util.debugConfigSchemas()`);

  const spacer = '\n                           : ';
  if (config.schemas) {
    debug(`config.schemas.Systems     : ${JSON.stringify(config.schemas.Systems, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Accounts    : ${JSON.stringify(config.schemas.Accounts, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Environments: ${JSON.stringify(config.schemas.Environments, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Regions     : ${JSON.stringify(config.schemas.Regions, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Users       : ${JSON.stringify(config.schemas.Users, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Parameters  : ${JSON.stringify(config.schemas.Parameters, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Tags        : ${JSON.stringify(config.schemas.Tags, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Companies   : ${JSON.stringify(config.schemas.Companies, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Locations   : ${JSON.stringify(config.schemas.Locations, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Applications: ${JSON.stringify(config.schemas.Applications, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Components  : ${JSON.stringify(config.schemas.Components, null, 2).replace(/\n/g, spacer)}`);
    debug(`config.schemas.Steps       : ${JSON.stringify(config.schemas.Steps, null, 2).replace(/\n/g, spacer)}`);
  }
}

exports.debugConfigData = (config) => {
  debug(`util.debugConfigData()`);

  const spacer = '\n                                 : ';
  if (config.data) {
    if (config.data.default) {
      debug(`config.data.default.systems      : ${JSON.stringify(config.data.default.systems, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.accounts     : ${JSON.stringify(config.data.default.accounts, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.environments : ${JSON.stringify(config.data.default.environments, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.regions      : ${JSON.stringify(config.data.default.regions, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.users        : ${JSON.stringify(config.data.default.users, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.parameters   : ${JSON.stringify(config.data.default.parameters, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.tags         : ${JSON.stringify(config.data.default.tags, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.companies    : ${JSON.stringify(config.data.default.companies, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.locations    : ${JSON.stringify(config.data.default.locations, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.applications : ${JSON.stringify(config.data.default.applications, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.default.components   : ${JSON.stringify(config.data.default.components, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.user) {
      debug(`config.data.user.systems         : ${JSON.stringify(config.data.user.systems, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.accounts        : ${JSON.stringify(config.data.user.accounts, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.environments    : ${JSON.stringify(config.data.user.environments, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.regions         : ${JSON.stringify(config.data.user.regions, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.users           : ${JSON.stringify(config.data.user.users, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.parameters      : ${JSON.stringify(config.data.user.parameters, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.tags            : ${JSON.stringify(config.data.user.tags, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.companies       : ${JSON.stringify(config.data.user.companies, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.locations       : ${JSON.stringify(config.data.user.locations, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.applications    : ${JSON.stringify(config.data.user.applications, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.user.components      : ${JSON.stringify(config.data.user.components, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.secure) {
      debug(`config.data.secure.parameters    : ${JSON.stringify(config.data.secure.parameters, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.common) {
      debug(`config.data.common.systems       : ${JSON.stringify(config.data.common.systems, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.accounts      : ${JSON.stringify(config.data.common.accounts, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.environments  : ${JSON.stringify(config.data.common.environments, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.regions       : ${JSON.stringify(config.data.common.regions, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.users         : ${JSON.stringify(config.data.common.users, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.parameters    : ${JSON.stringify(config.data.common.parameters, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.tags          : ${JSON.stringify(config.data.common.tags, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.companies     : ${JSON.stringify(config.data.common.companies, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.locations     : ${JSON.stringify(config.data.common.locations, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.applications  : ${JSON.stringify(config.data.common.applications, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.common.components    : ${JSON.stringify(config.data.common.components, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.system) {
      debug(`config.data.system.accounts      : ${JSON.stringify(config.data.system.accounts, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.system.environments  : ${JSON.stringify(config.data.system.environments, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.system.regions       : ${JSON.stringify(config.data.system.regions, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.system.users         : ${JSON.stringify(config.data.system.users, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.system.parameters    : ${JSON.stringify(config.data.system.parameters, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.system.tags          : ${JSON.stringify(config.data.system.tags, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.system.locations     : ${JSON.stringify(config.data.system.locations, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.system.applications  : ${JSON.stringify(config.data.system.applications, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.system.components    : ${JSON.stringify(config.data.system.components, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.account) {
      debug(`config.data.account.environments : ${JSON.stringify(config.data.account.environments, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.account.regions      : ${JSON.stringify(config.data.account.regions, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.account.users        : ${JSON.stringify(config.data.account.users, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.account.parameters   : ${JSON.stringify(config.data.account.parameters, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.account.tags         : ${JSON.stringify(config.data.account.tags, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.region) {
      debug(`config.data.region.users         : ${JSON.stringify(config.data.region.users, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.region.parameters    : ${JSON.stringify(config.data.region.parameters, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.region.tags          : ${JSON.stringify(config.data.region.tags, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.template) {
      debug(`config.data.template.parameters  : ${JSON.stringify(config.data.template.parameters, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.stack) {
      debug(`config.data.stack.parameters     : ${JSON.stringify(config.data.stack.parameters, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.stack.tags           : ${JSON.stringify(config.data.stack.tags, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.calculated) {
      debug(`config.data.calculated.parameters: ${JSON.stringify(config.data.calculated.parameters, null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.data.merged) {
      debug(`config.data.merged.systems       : ${JSON.stringify(config.data.merged.systems, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.merged.accounts      : ${JSON.stringify(config.data.merged.accounts, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.merged.environments  : ${JSON.stringify(config.data.merged.environments, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.merged.regions       : ${JSON.stringify(config.data.merged.regions, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.merged.users         : ${JSON.stringify(config.data.merged.users, null, 2).replace(/\n/g, spacer)}`);
      if (config.data.merged.parameters) {
        debug(`config.data.merged.parameters    : ${JSON.stringify(config.data.merged.parameters, null, 2).replace(/\n/g, spacer)}`);
      }
      if (config.data.merged.tags) {
        debug(`config.data.merged.tags          : ${JSON.stringify(config.data.merged.tags, null, 2).replace(/\n/g, spacer)}`);
      }
      debug(`config.data.merged.companies     : ${JSON.stringify(config.data.merged.companies, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.merged.locations     : ${JSON.stringify(config.data.merged.locations, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.merged.applications  : ${JSON.stringify(config.data.merged.applications, null, 2).replace(/\n/g, spacer)}`);
      debug(`config.data.merged.components    : ${JSON.stringify(config.data.merged.components, null, 2).replace(/\n/g, spacer)}`);
    }
  }
}

exports.debugConfigOptions = (config) => {
  debug(`util.debugConfigOptions()`);

  debug(`config.options.verbose            : ${config.options.verbose}`);
  debug(`config.options.confirm            : ${config.options.confirm}`);
  debug(`config.options.prerequisite       : ${config.options.prerequisite}`);
  debug(`config.options.lambda             : ${config.options.lambda}`);
  debug(`config.options.policy             : ${config.options.policy}`);
  debug(`config.options.monitor            : ${config.options.monitor}`);
  debug(`config.options.wait               : ${config.options.wait}`);

  if (config.options.templates) {
    debug(`config.options.templates.path     : ${config.options.templates.path}`);
    debug(`config.options.templates.bucket   : ${config.options.templates.bucket}`);
  }
  if (config.options.functions) {
    debug(`config.options.functions.path     : ${config.options.functions.path}`);
    debug(`config.options.functions.bucket   : ${config.options.functions.bucket}`);
  }
  if (config.options.scripts) {
    debug(`config.options.scripts.path       : ${config.options.scripts.path}`);
    debug(`config.options.scripts.bucket     : ${config.options.scripts.bucket}`);
  }
  if (config.options.config) {
    debug(`config.options.config.path        : ${config.options.config.path}`);
    debug(`config.options.config.bucket      : ${config.options.config.bucket}`);
  }

  if (config.options.system) {
    debug(`config.options.system.Name        : ${config.options.system.Name}`);
    debug(`config.options.system.Code        : ${config.options.system.Code}`);
    debug(`config.options.system.Default     : ${config.options.system.Default}`);
    debug(`config.options.system.Source      : ${config.options.system.Source}`);
  }
  if (config.options.account) {
    debug(`config.options.account.Name       : ${config.options.account.Name}`);
    debug(`config.options.account.LongName   : ${config.options.account.LongName}`);
    debug(`config.options.account.Alias      : ${config.options.account.Alias}`);
    debug(`config.options.account.Id         : ${config.options.account.Id}`);
    debug(`config.options.account.Default    : ${config.options.account.Default}`);
    debug(`config.options.account.Source     : ${config.options.account.Source}`);
  }
  if (config.options.environment) {
    debug(`config.options.environment.Name   : ${config.options.environment.Name}`);
    debug(`config.options.environment.Code   : ${config.options.environment.Code}`);
    debug(`config.options.environment.Active : ${config.options.environment.Active}`);
    debug(`config.options.environment.Default: ${config.options.environment.Default}`);
    debug(`config.options.environment.Source : ${config.options.environment.Source}`);
  }
  if (config.options.region) {
    debug(`config.options.region.Name        : ${config.options.region.Name}`);
    debug(`config.options.region.LongName    : ${config.options.region.LongName}`);
    debug(`config.options.region.Code        : ${config.options.region.Code}`);
    debug(`config.options.region.Active      : ${config.options.region.Active}`);
    debug(`config.options.region.Default     : ${config.options.region.Default}`);
    debug(`config.options.region.Source      : ${config.options.region.Source}`);
  }
  if (config.options.user) {
    debug(`config.options.user.Name          : ${config.options.user.Name}`);
    debug(`config.options.user.FullName      : ${config.options.user.FullName}`);
    debug(`config.options.user.Email         : ${config.options.user.Email}`);
    debug(`config.options.user.Phone         : ${config.options.user.Phone}`);
    debug(`config.options.user.Default       : ${config.options.user.Default}`);
    debug(`config.options.user.Source        : ${config.options.user.Source}`);
  }
  if (config.options.profile) {
    debug(`config.options.profile            : ${config.options.profile}`);
  }
  if (config.options.stack) {
    debug(`config.options.stack.name         : ${config.options.stack.name}`);
    if (config.options.stack.template) {
      debug(`config.options.stack.template.name: ${config.options.stack.template.name}`);
      debug(`config.options.stack.template.path: ${config.options.stack.template.path}`);
      debug(`config.options.stack.template.url : ${config.options.stack.template.url}`);
    }
    if (config.options.stack.policy) {
      debug(`config.options.stack.policy.path  : ${config.options.stack.policy.path}`);
      debug(`config.options.stack.policy.url   : ${config.options.stack.policy.url}`);
    }
  }
  if (config.options.waitInterval)
    debug(`config.options.waitInterval         : ${config.options.waitInterval}`);
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
    const copy = clone(object);
    copy.Source = 'Default';
    debug(`  - ${copy.Name}`);
    mergedData.push(copy);
  }

  debug('- Common');
  for (const object of commonData) {
    const copy = clone(object);
    copy.Source = 'Common';

    if (copy.Default && copy.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == copy.Name);

    if (i >= 0) {
      debug(`  - ${copy.Name} (replaced)`);
      for (const objectKey of Object.keys(copy)) {
        mergedData[i][objectKey] = copy[objectKey];
      }
    }
    else {
      debug(`  - ${copy.Name} (added)`);
      mergedData.push(copy);
    }
  }

  debug('- System');
  for (const object of systemData) {
    const copy = clone(object);
    copy.Source = 'System';

    if (copy.Default && copy.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == copy.Name);

    if (i >= 0) {
      debug(`  - ${copy.Name} (replaced)`);
      for (const objectKey of Object.keys(copy)) {
        mergedData[i][objectKey] = copy[objectKey];
      }
    }
    else {
      debug(`  - ${copy.Name} (added)`);
      mergedData.push(copy);
    }
  }

  debug('- Account');
  for (const object of accountData) {
    const copy = clone(object);
    copy.Source = 'Account';

    if (copy.Default && copy.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == copy.Name);

    if (i >= 0) {
      debug(`  - ${copy.Name} (replaced)`);
      for (const objectKey of Object.keys(copy)) {
        mergedData[i][objectKey] = copy[objectKey];
      }
    }
    else {
      debug(`  - ${copy.Name} (added)`);
      mergedData.push(copy);
    }
  }

  debug('- Region');
  for (const object of regionData) {
    const copy = clone(object);
    copy.Source = 'Region';

    if (copy.Default && copy.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == copy.Name);

    if (i >= 0) {
      debug(`  - ${copy.Name} (replaced)`);
      for (const objectKey of Object.keys(copy)) {
        mergedData[i][objectKey] = copy[objectKey];
      }
    }
    else {
      debug(`  - ${copy.Name} (added)`);
      mergedData.push(copy);
    }
  }

  debug('- Stack');
  for (const object of stackData) {
    const copy = clone(object);
    copy.Source = 'Stack';

    if (copy.Default && copy.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == copy.Name);

    if (i >= 0) {
      debug(`  - ${copy.Name} (replaced)`);
      for (const objectKey of Object.keys(copy)) {
        mergedData[i][objectKey] = copy[objectKey];
      }
    }
    else {
      debug(`  - ${copy.Name} (added)`);
      mergedData.push(copy);
    }
  }

  debug('- User');
  for (const object of userData) {
    const copy = clone(object);
    copy.Source = 'User';

    if (copy.Default && copy.Default == true) {
      mergedData.forEach(d => d.Default = false);
    }

    const i = mergedData.findIndex(o => o.Name == copy.Name);

    if (i >= 0) {
      debug(`  - ${copy.Name} (replaced)`);
      for (const objectKey of Object.keys(copy)) {
        mergedData[i][objectKey] = copy[objectKey];
      }
    }
    else {
      debug(`  - ${copy.Name} (added)`);
      mergedData.push(copy);
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
    const copy = clone(tag);
    copy.Source = 'Default';
    debug(`  - ${copy.Key}`);
    mergedTags.push(copy);
  }

  debug('- Common');
  for (const tag of commonTags) {
    const copy = clone(tag);
    copy.Source = 'Common';
    const i = mergedTags.findIndex(t => t.Key == copy.Key);
    if (i >= 0) {
      debug(`  - ${copy.Key} (replaced)`);
      for (const key of Object.keys(copy)) {
        mergedTags[i][key] = copy[key];
      }
    }
    else {
      debug(`  - ${copy.Key} (added)`);
      mergedTags.push(copy);
    }
  }

  debug('- System');
  for (const tag of systemTags) {
    const copy = clone(tag);
    copy.Source = 'System';
    const i = mergedTags.findIndex(t => t.Key == copy.Key);
    if (i >= 0) {
      debug(`  - ${copy.Key} (replaced)`);
      for (const key of Object.keys(copy)) {
        mergedTags[i][key] = copy[key];
      }
    }
    else {
      debug(`  - ${copy.Key} (added)`);
      mergedTags.push(copy);
    }
  }

  debug('- Account');
  for (const tag of accountTags) {
    const copy = clone(tag);
    copy.Source = 'Account';
    const i = mergedTags.findIndex(t => t.Key == copy.Key);
    if (i >= 0) {
      debug(`  - ${copy.Key} (replaced)`);
      for (const key of Object.keys(copy)) {
        mergedTags[i][key] = copy[key];
      }
    }
    else {
      debug(`  - ${copy.Key} (added)`);
      mergedTags.push(copy);
    }
  }

  debug('- Region');
  for (const tag of regionTags) {
    const copy = clone(tag);
    copy.Source = 'Region';
    const i = mergedTags.findIndex(t => t.Key == copy.Key);
    if (i >= 0) {
      debug(`  - ${copy.Key} (replaced)`);
      for (const key of Object.keys(copy)) {
        mergedTags[i][key] = copy[key];
      }
    }
    else {
      debug(`  - ${copy.Key} (added)`);
      mergedTags.push(copy);
    }
  }

  debug('- Stack');
  for (const tag of stackTags) {
    const copy = clone(tag);
    copy.Source = 'Stack';
    const i = mergedTags.findIndex(t => t.Key == copy.Key);
    if (i >= 0) {
      debug(`  - ${copy.Key} (replaced)`);
      for (const key of Object.keys(copy)) {
        mergedTags[i][key] = copy[key];
      }
    }
    else {
      debug(`  - ${copy.Key} (added)`);
      mergedTags.push(copy);
    }
  }

  debug('- User');
  for (const tag of userTags) {
    const copy = clone(tag);
    copy.Source = 'User';
    const i = mergedTags.findIndex(t => t.Key == copy.Key);
    if (i >= 0) {
      debug(`  - ${copy.Key} (replaced)`);
      for (const key of Object.keys(copy)) {
        mergedTags[i][key] = copy[key];
      }
    }
    else {
      debug(`  - ${copy.Key} (added)`);
      mergedTags.push(copy);
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

  const functionFolderPath = path.join(config.options.functions.path, name);
  const zipFilePath = path.join(config.options.functions.path, name + '.zip');

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

exports.getStepsBody = (filePath) => {
  debug(`util.getStepsBody(${path.parse(filePath).base})`);

  try {
    return fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    debug(err);
    if (err.code == 'ENOENT')
      throw new CommandError(`Steps file ${zipFilePath} does not exist`, errors.STEPS_NOT_FOUND);
    if (err.code == 'EACCES')
      throw new CommandError(`Steps file ${filePath} exists but could not be read`, errors.STEPS_INVALID);
    throw new CommandError(`Steps file ${filePath} error (message: ${err.message})`, errors.STEPS_INVALID, err.code);
  }
}

exports.getSteps = (stepsBody, schema) => {
  debug(`util.getSteps()`);

  if (stepsBody.length > 0) {
    let steps = {};

    try {
      steps = yaml.safeLoad(stepsBody);
    }
    catch (err) {
      debug(err);
      throw new CommandError(`Steps body could not be parsed as YAML (message: ${err.message})`, errors.STEPS_INVALID, err.code);
    }

    const ajv = new Ajv();

//    const validate = ajv.compile(schema);
//    if (validate(steps)) {
      return steps;
//    }
//    else {
//      debug(validate.errors);
//      throw new CommandError(`Steps JSON (after conversion from YAML) does not match schema (message: ${validate.errors[0].message}; enable DEBUG for more detail)`, errors.STEPS_INVALID, err.code);
//    }
  }
  else {
    throw new CommandError(`Steps body does not exist`, errors.STEPS_NOT_FOUND);
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
