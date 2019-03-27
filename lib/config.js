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

exports.load = (options) => {
  debug(`config.load()`);

  // Get Flag Options
  if (options.parent.verbose) exports.verbose = true;
  if (options.parent.confirm) exports.confirm = true;
  if (options.prerequisite) exports.prerequisite = true;
  if (options.lambda) exports.lambda = true;
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
  const defaultUsers        = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf', 'Users.json')), schemas.Users);
  const commonUsers         = util.getData(util.getDataBody(path.join(exports.config.Path, 'Users.json')), schemas.Users);
  const userUsers           = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf', 'Users.json')), schemas.Users);
  exports.users             = util.mergeData(defaultUsers, commonUsers, [], [], [], [], userUsers);

  const defaultCompanies    = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf', 'Companies.json')), schemas.Companies);
  const commonCompanies     = util.getData(util.getDataBody(path.join(exports.config.Path, 'Companies.json')), schemas.Companies);
  const userCompanies       = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf', 'Companies.json')), schemas.Companies);
  exports.companies         = util.mergeData(defaultCompanies, commonCompanies, [], [], [], [], userCompanies);

  const defaultSystems      = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf', 'Systems.json')), schemas.Systems);
  const commonSystems       = util.getData(util.getDataBody(path.join(exports.config.Path, 'Systems.json')), schemas.Systems);
  const userSystems         = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf', 'Systems.json')), schemas.Systems);
  exports.systems           = util.mergeData(defaultSystems, commonSystems, [], [], [], [], userSystems);

  // Get then Validate Common Options against Common Configuration Data
  debug(`- Validate Common Configuration Options`);
  if (options.parent.owner) {
    const owners = exports.users.filter(u => u.Name == options.parent.owner);
    switch (owners.length) {
      case 1:
        exports.owner = owners[0];
        break;
      case 0:
        throw new Error(`Owner '${options.parent.owner}' not found in Users data array`);
      default:
        throw new Error(`Owner '${options.parent.owner}' duplicates found in Users data array`);
    }
  } /*
  else {
    const defaultOwners = exports.users.filter(u => u.Default == true);
    switch (defaultOwners.length) {
      case 1:
        exports.owner = defaultOwners[0];
        break;
      case 0:
        throw new Error(`Default owner not found in Users Data Array`);
      default:
        throw new Error(`Default owner duplicates found in Users Data Array`);
    }
  } */

  if (options.parent.company) {
    const companies = exports.companies.filter(c => c.Name == options.parent.company);
    switch (companies.length) {
      case 1:
        exports.company = companies[0];
        break;
      case 0:
        throw new Error(`Company '${options.parent.company}' not found in Companies data array`);
      default:
        throw new Error(`Company '${options.parent.company}' duplicates found in Companies data array`);
    }
  } /*
  else {
    const defaultCompanies = exports.companies.filter(c => c.Default == true);
    switch (defaultCompanies.length) {
      case 1:
        exports.company = defaultCompanies[0];
        break;
      case 0:
        throw new Error(`Default company not found in Companies data array`);
      default:
        throw new Error(`Default company duplicates found in Companies data array`);
    }
  } */

  if (options.parent.system) {
    const systems = exports.systems.filter(s => s.Name == options.parent.system);
    switch (systems.length) {
      case 1:
        exports.system = systems[0];
        break;
      case 0:
        throw new Error(`System '${options.parent.system}' not found in Systems data array`);
      default:
        throw new Error(`System '${options.parent.system}' duplicates found in Systems data array`);
    }
  }
  else {
    const defaultSystems = exports.systems.filter(s => s.Default == true);
    switch (defaultSystems.length) {
      case 1:
        exports.system = defaultSystems[0];
        break;
      case 0:
        throw new Error(`Default system not found in Systems data array`);
      default:
        throw new Error(`Default system duplicates found in Systems data array`);
    }
  }

  // Get System Configuration Data
  debug(`- Get System Configuration Data`);
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

  // Get then Validate System Options against System Configuration Data
  debug(`- Validate System Configuration Options`);
  const location = (options.parent.location) ? options.parent.location : options.parent.region;
  const locations = exports.locations.filter(l => l.Name == location);
  switch (locations.length) {
    case 1:
      exports.location = locations[0];
      break;
    case 0:
      throw new Error(`Location '${location}' not found in Locations data array`);
    default:
      throw new Error(`Location '${location}' duplicates found in Locations data array`);
  }

  const environments = exports.environments.filter(e => e.Name == options.parent.environment);
  switch (environments.length) {
    case 1:
      exports.environment = environments[0];
      break;
    case 0:
      throw new Error(`Environment '${options.parent.environment}' not found in Environments data array`);
    default:
      throw new Error(`Environment '${options.parent.environment}' duplicates found in Environments data array`);
  }

  const accounts = exports.accounts.filter(a => a.Name == options.parent.account);
  switch (accounts.length) {
    case 1:
      exports.account = accounts[0];
      break;
    case 0:
      throw new Error(`Account '${options.parent.account}' not found in Accounts data array`);
    default:
      throw new Error(`Account '${options.parent.account}' duplicates found in Accounts data array`);
  }

  // Validate AWS-Specific Options
  debug(`- Validate AWS Configuration Options`);
  const profile = `${exports.account.Alias}-${options.parent.user}`; // Enforce profile naming convention
  util.validateAWSProfile(profile);
  exports.profile = profile;

  util.validateAWSRegion(options.parent.region);
  exports.region = options.parent.region;

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

  if (options.waitInterval) {
    exports.waitInterval = options.waitInterval;
  }

  return;
}
