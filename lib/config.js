'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const schema = require('yaml-cfn').schema;
const debug = require('debug')('dxcf:cli:config');
const chalk = require('chalk');
const Ajv = require('ajv');
const ajv = new Ajv();

const util = require(path.join(__dirname, 'util'));

const errors = require(path.join(__dirname, 'errors'));
const CommandError = require(path.join(__dirname, 'errors')).CommandError;

exports.load = (options) => {
  debug(`config.load()`);

  // Get Flag Options
  if (options.parent.verbose) exports.verbose = true;
  if (options.parent.confirm) exports.confirm = true;
  if (options.prerequisite) exports.prerequisite = true;
  if (options.lambda) exports.lambda = true;
  if (options.policy) exports.policy = true;
  if (options.monitor) exports.monitor = true;
  if (options.wait) exports.wait = true;

  // Get and Validate Directory Options
  debug(`- Get Directories`);
  util.validateTemplatesDir(options.parent.templates);
  const templates = {
    Path: options.parent.templates
  };
  exports.templates = templates;

  util.validateFunctionsDir(options.parent.functions);
  const functions = {
    Path: options.parent.functions
  };
  exports.functions = functions;

  util.validateScriptsDir(options.parent.scripts);
  const scripts = {
    Path: options.parent.scripts
  };
  exports.scripts = scripts;

  util.validateConfigDir(options.parent.config);
  const config = {
    Path: options.parent.config
  };
  exports.config = config;

  // Get Configuration Schema Objects
  debug(`- Get Configuration File Schemas`);
  const schemas = {
    Users: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Users.schema.json'))),
    Companies: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Companies.schema.json'))),
    Systems: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Systems.schema.json'))),
    Locations: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Locations.schema.json'))),
    Environments: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Environments.schema.json'))),
    Applications: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Applications.schema.json'))),
    Components: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Components.schema.json'))),
    Accounts: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Accounts.schema.json'))),
    Parameters: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Parameters.schema.json'))),
    Tags: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Tags.schema.json')))
  };
  exports.schemas = schemas;

  // Get Common Configuration Data
  debug(`- Get Common Configuration Data`);
  const defaultSystems      = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf', 'Systems.json')), schemas.Systems);
  const commonSystems       = util.getData(util.getDataBody(path.join(exports.config.Path, 'Systems.json')), schemas.Systems);
  const userSystems         = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf', 'Systems.json')), schemas.Systems);
  exports.systems           = util.mergeData(defaultSystems, commonSystems, [], [], [], [], userSystems);

  const defaultCompanies    = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf', 'Companies.json')), schemas.Companies);
  const commonCompanies     = util.getData(util.getDataBody(path.join(exports.config.Path, 'Companies.json')), schemas.Companies);
  const userCompanies       = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf', 'Companies.json')), schemas.Companies);
  exports.companies         = util.mergeData(defaultCompanies, commonCompanies, [], [], [], [], userCompanies);

  const defaultUsers        = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf', 'Users.json')), schemas.Users);
  const commonUsers         = util.getData(util.getDataBody(path.join(exports.config.Path, 'Users.json')), schemas.Users);
  const userUsers           = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf', 'Users.json')), schemas.Users);
  exports.users             = util.mergeData(defaultUsers, commonUsers, [], [], [], [], userUsers);

  // Get then Validate Common Options against Common Configuration Data
  debug(`- Validate Common Configuration Options`);
  if (options.parent.system) {
    const systems = exports.systems.filter(s => s.Name == options.parent.system);
    switch (systems.length) {
      case 1:
        exports.system = systems[0];
        break;
      case 0:
        throw new CommandError(`System '${options.parent.system}' not found in Systems data array`, errors.OPTION_SYSTEM_NOT_FOUND);
      default:
        throw new CommandError(`System '${options.parent.system}' duplicates found in Systems data array`, errors.OPTION_SYSTEM_INVALID);
    }
  }
  else {
    const defaultSystems = exports.systems.filter(s => s.Default == true);
    switch (defaultSystems.length) {
      case 1:
        exports.system = defaultSystems[0];
        break;
      case 0:
        throw new CommandError(`Default system not found in Systems data array`, errors.DEFAULT_SYSTEM_NOT_FOUND);
      default:
        throw new CommandError(`Default system duplicates found in Systems data array`, errors.DEFAULT_SYSTEM_INVALID);
    }
  }

  // Get System Configuration Data
  debug(`- Get System Configuration Data`);
  const defaultAccounts     = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Accounts.json')), schemas.Accounts);
  const commonAccounts      = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Accounts.json')), schemas.Accounts);
  const systemAccounts      = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Accounts.json')), schemas.Accounts);
  const userAccounts        = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Accounts.json')), schemas.Accounts);
  exports.accounts          = util.mergeData(defaultAccounts, commonAccounts, systemAccounts, [], [], [], userAccounts);

  const defaultEnvironments = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Environments.json')), schemas.Environments);
  const commonEnvironments  = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Environments.json')), schemas.Environments);
  const systemEnvironments  = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Environments.json')), schemas.Environments);
  const userEnvironments    = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Environments.json')), schemas.Environments);
  exports.environments      = util.mergeData(defaultEnvironments, commonEnvironments, systemEnvironments, [], [], [], userEnvironments);

  const defaultLocations    = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Locations.json')), schemas.Locations);
  const commonLocations     = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Locations.json')), schemas.Locations);
  const systemLocations     = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Locations.json')), schemas.Locations);
  const userLocations       = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Locations.json')), schemas.Locations);
  exports.locations         = util.mergeData(defaultLocations, commonLocations, systemLocations, [], [], [], userLocations);

  const defaultApplications = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Applications.json')), schemas.Applications);
  const commonApplications  = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Applications.json')), schemas.Applications);
  const systemApplications  = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Applications.json')), schemas.Applications);
  const userApplications    = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Applications.json')), schemas.Applications);
  exports.applications      = util.mergeData(defaultApplications, commonApplications, systemApplications, [], [], [], userApplications);

  const defaultComponents   = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Components.json')), schemas.Components);
  const commonComponents    = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Components.json')), schemas.Components);
  const systemComponents    = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Components.json')), schemas.Components);
  const userComponents      = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Components.json')), schemas.Components);
  exports.components        = util.mergeData(defaultComponents, commonComponents, systemComponents, [], [], [], userComponents);

  // Get then Validate System Options against System Configuration Data
  debug(`- Validate System Configuration Options`);
  if (options.parent.account) {
    const accounts = exports.accounts.filter(a => a.Name == options.parent.account);
    switch (accounts.length) {
      case 1:
        exports.account = accounts[0];
        break;
      case 0:
        throw new CommandError(`Account '${options.parent.account}' not found in Accounts data array`, errors.OPTION_ACCOUNT_NOT_FOUND);
      default:
        throw new CommandError(`Account '${options.parent.account}' duplicates found in Accounts data array`, errors.OPTION_ACCOUNT_INVALID);
    }
  }
  else {
    const defaultAccounts = exports.accounts.filter(a => a.Default == true);
    switch (defaultAccounts.length) {
      case 1:
        exports.account = defaultAccounts[0];
        break;
      case 0:
        throw new CommandError(`Default account not found in Accounts data array`, errors.DEFAULT_ACCOUNT_NOT_FOUND);
      default:
        throw new CommandError(`Default account duplicates found in Accounts data array`, errors.DEFAULT_ACCOUNT_INVALID);
    }
  }

  if (options.parent.environment) {
    const environments = exports.environments.filter(e => e.Name == options.parent.environment);
    switch (environments.length) {
      case 1:
        exports.environment = environments[0];
        break;
      case 0:
        throw new CommandError(`Environment '${options.parent.environment}' not found in Environments data array`, errors.OPTION_ENVIRONMENT_NOT_FOUND);
      default:
        throw new CommandError(`Environment '${options.parent.environment}' duplicates found in Environments data array`, errors.OPTION_ENVIRONMENT_INVALID);
    }
  }
  else {
    const defaultEnvironments = exports.environments.filter(e => e.Default == true);
    switch (defaultEnvironments.length) {
      case 1:
        exports.environment = defaultEnvironments[0];
        break;
      case 0:
        throw new CommandError(`Default environment not found in Environments data array`, errors.DEFAULT_ENVIRONMENT_NOT_FOUND);
      default:
        throw new CommandError(`Default environment duplicates found in Environments data array`, errors.DEFAULT_ENVIRONMENT_INVALID);
    }
  }

  // Validate AWS-Specific Options
  debug(`- Validate AWS Configuration Options`);
  if (options.parent.region) {
    util.validateAWSRegion(options.parent.region);
    exports.region = options.parent.region;
  }
  else {
    throw new CommandError('--region <region> required', errors.OPTION_REGION_MISSING);
  }

  if (options.parent.user) {
    const profile = `${exports.account.Alias}-${options.parent.user}`; // Enforce profile naming convention
    util.validateAWSProfile(profile);
    exports.user = options.parent.user;
    exports.profile = profile;
  }
  else {
    throw new CommandError('--user <user> required', errors.OPTION_USER_MISSING);
  }

  // Create Bucket Options
  debug(`- Calculate Buckets`);
  exports.templates.Bucket = `templates-${exports.account.Alias}-${exports.region}`;
  exports.functions.Bucket = `functions-${exports.account.Alias}-${exports.region}`;
  exports.scripts.Bucket = `scripts-${exports.account.Alias}-${exports.region}`;
  exports.config.Bucket = `config-${exports.account.Alias}-${exports.region}`;

  // Set variable options on config object
  if (options.stackName) {
    const stack = {
      Name: options.stackName
    };
    exports.stack = stack;

    if (options.templateName) {
      const template = {
        Name: options.templateName,
        Path: path.join(exports.templates.Path, options.templateName + '.yaml'),
        URL: 'https://' + ((exports.region == 'us-east-1') ? 's3' : 's3-' + exports.region) + '.amazonaws.com/'
                        + exports.templates.Bucket + '/' + options.templateName + '.yaml'
      };
      // Eventually may want logic here to obtain the Body from either the Path or the URL
      template.Body = util.getTemplateBody(template.Path);
      exports.stack.template = template;

      if (options.policy) {
        const policy = {
          Path: path.join(exports.templates.Path, options.templateName + '-StackPolicy.json'),
          URL: 'https://' + ((exports.region == 'us-east-1') ? 's3' : 's3-' + exports.region) + '.amazonaws.com/'
                          + exports.templates.Bucket + '/' + options.templateName + '-StackPolicy.json'
        };
        // Eventually may want logic here to obtain the Body from either the Path or the URL
        policy.Body = util.getStackPolicyBody(policy.Path)
        exports.stack.policy = policy;
      }
    }
  }

  if (options.waitInterval) {
    exports.waitInterval = options.waitInterval;
  }

  return;
}
