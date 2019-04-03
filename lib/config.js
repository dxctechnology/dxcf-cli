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

  debug(`- Get flag options`);
  exports.verbose = (options.parent.verbose) ? true : false;
  exports.confirm = (options.parent.confirm) ? true : false;
  exports.prerequisite = (options.prerequisite) ? true : false;
  exports.lambda = (options.lambda) ? true : false;
  exports.policy = (options.policy) ? true : false;
  exports.monitor = (options.monitor) ? true : false;
  exports.wait = (options.wait) ? true : false;

  debug(`- Get directory options`);
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

  debug(`- Get configuration file schemas`);
  const schemas = {
    Systems: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Systems.schema.json'))),
    Accounts: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Accounts.schema.json'))),
    Environments: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Environments.schema.json'))),
    Regions: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Regions.schema.json'))),
    Users: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Users.schema.json'))),

    Companies: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Companies.schema.json'))),
    Locations: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Locations.schema.json'))),
    Applications: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Applications.schema.json'))),
    Components: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Components.schema.json'))),

    Parameters: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Parameters.schema.json'))),
    Tags: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Tags.schema.json')))
  };
  exports.schemas = schemas;

  debug(`- Get system configuration data`);
  const defaultSystems      = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Systems.json')), schemas.Systems);
  const commonSystems       = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems.json')), schemas.Systems);
  const userSystems         = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Systems.json')), schemas.Systems);
  exports.systems           = util.mergeData(defaultSystems, commonSystems, [], [], [], [], userSystems);

  debug(`- Validate system option`);
  if (options.parent.system) {
    const systems = exports.systems.filter(s => s.Name == options.parent.system);
    switch (systems.length) {
      case 1:
        debug(`  - Valid system: ${systems[0].Name}`);
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
        debug(`  - Default system: ${defaultSystems[0].Name}`);
        exports.system = defaultSystems[0];
        break;
      case 0:
        throw new CommandError(`Default system not found in Systems data array`, errors.DEFAULT_SYSTEM_NOT_FOUND);
      default:
        throw new CommandError(`Default system duplicates found in Systems data array`, errors.DEFAULT_SYSTEM_INVALID);
    }
  }

  debug(`- Get account configuration data`);
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

  debug(`- Validate account option`);
  if (options.parent.account) {
    const accounts = exports.accounts.filter(a => a.Name == options.parent.account);
    switch (accounts.length) {
      case 1:
        debug(`  - Valid account: ${accounts[0].Name}`);
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
        debug(`  - Default account: ${defaultAccounts[0].Name}`);
        exports.account = defaultAccounts[0];
        break;
      case 0:
        throw new CommandError(`Default account not found in Accounts data array`, errors.DEFAULT_ACCOUNT_NOT_FOUND);
      default:
        throw new CommandError(`Default account duplicates found in Accounts data array`, errors.DEFAULT_ACCOUNT_INVALID);
    }
  }

  debug(`- Get environment configuration data`);
  const defaultEnvironments = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Environments.json')), schemas.Environments);
  const commonEnvironments  = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Environments.json')), schemas.Environments);
  const systemEnvironments  = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Environments.json')), schemas.Environments);
  const accountEnvironments = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Accounts', exports.account.Name + '[' + exports.account.Id + ']',
                                                                      'Environments.json')), schemas.Environments);
  const userEnvironments    = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Environments.json')), schemas.Environments);
  exports.environments      = util.mergeData(defaultEnvironments, commonEnvironments, systemEnvironments, accountEnvironments, [], [], userEnvironments);

  debug(`- Validate environment option`);
  if (options.parent.environment) {
    const environments = exports.environments.filter(e => e.Name == options.parent.environment && e.Active == true);
    switch (environments.length) {
      case 1:
        debug(`  - Valid environment: ${environments[0].Name}`);
        exports.environment = environments[0];
        break;
      case 0:
        throw new CommandError(`Environment '${options.parent.environment}' not active or not found in Environments data array`, errors.OPTION_ENVIRONMENT_NOT_FOUND);
      default:
        throw new CommandError(`Environment '${options.parent.environment}' duplicates found in Environments data array`, errors.OPTION_ENVIRONMENT_INVALID);
    }
  }
  else {
    const defaultEnvironments = exports.environments.filter(e => e.Default == true && e.Active == true);
    switch (defaultEnvironments.length) {
      case 1:
        debug(`  - Default environment: ${defaultEnvironments[0].Name}`);
        exports.environment = defaultEnvironments[0];
        break;
      case 0:
        throw new CommandError(`Default environment not active or not found in Environments data array`, errors.DEFAULT_ENVIRONMENT_NOT_FOUND);
      default:
        throw new CommandError(`Default environment duplicates found in Environments data array`, errors.DEFAULT_ENVIRONMENT_INVALID);
    }
  }

  debug(`- Get region configuration data`);
  const defaultRegions      = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Regions.json')), schemas.Regions);
  const commonRegions       = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Regions.json')), schemas.Regions);
  const systemRegions       = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Regions.json')), schemas.Regions);
  const accountRegions      = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Accounts', exports.account.Name + '[' + exports.account.Id + ']',
                                                                      'Regions.json')), schemas.Regions);
  const userRegions         = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Regions.json')), schemas.Regions);
  exports.regions           = util.mergeData(defaultRegions, commonRegions, systemRegions, accountRegions, [], [], userAccounts);

  debug(`- Validate region option`);
  if (options.parent.region) {
    const regions = exports.regions.filter(r => r.Name == options.parent.region && r.Active == true);
    switch (regions.length) {
      case 1:
        debug(`  - Valid region: ${regions[0].Name}`);
        exports.region = regions[0];
        break;
      case 0:
        throw new CommandError(`Region '${options.parent.region}' not active or not found in Regions data array`, errors.OPTION_REGION_NOT_FOUND);
      default:
        throw new CommandError(`Region '${options.parent.region}' duplicates found in Regions data array`, errors.OPTION_REGION_INVALID);
    }
  }
  else {
    const defaultRegions = exports.regions.filter(r => r.Default == true && r.Active == true);
    switch (defaultRegions.length) {
      case 1:
        debug(`  - Default region: ${defaultRegions[0].Name}`);
        exports.region = defaultRegions[0];
        break;
      case 0:
        throw new CommandError(`Default region not active or not found in Regions data array`, errors.DEFAULT_REGION_NOT_FOUND);
      default:
        throw new CommandError(`Default region duplicates found in Regions data array`, errors.DEFAULT_REGION_INVALID);
    }
  }

  debug(`- Get user configuration data`);
  const defaultUsers        = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Users.json')), schemas.Users);
  const commonUsers         = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Users.json')), schemas.Users);
  const systemUsers         = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Users.json')), schemas.Users);
  const accountUsers        = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Systems', exports.system.Name,
                                                                      'Accounts', exports.account.Name + '[' + exports.account.Id + ']',
                                                                      'Users.json')), schemas.Users);
  const userUsers           = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Users.json')), schemas.Users);
  exports.users             = util.mergeData(defaultUsers, commonUsers, systemUsers, accountUsers, [], [], userUsers);

  debug(`- Validate user option`);
  if (options.parent.user) {
    const users = exports.users.filter(u => u.Name == options.parent.user);
    switch (users.length) {
      case 1:
        debug(`  - Valid user: ${users[0].Name}`);
        exports.user = users[0];
        break;
      case 0:
        throw new CommandError(`User '${options.parent.user}' not found in Users data array`, errors.OPTION_USER_NOT_FOUND);
      default:
        throw new CommandError(`User '${options.parent.user}' duplicates found in Users data array`, errors.OPTION_USER_INVALID);
    }
  }
  else {
    const defaultUsers = exports.users.filter(u => u.Default == true);
    switch (defaultUsers.length) {
      case 1:
        debug(`  - Default user: ${defaultUsers[0].Name}`);
        exports.user = defaultUsers[0];
        break;
      case 0:
        throw new CommandError(`Default user not found in Users data array`, errors.DEFAULT_USER_NOT_FOUND);
      default:
        throw new CommandError(`Default user duplicates found in Users data array`, errors.DEFAULT_USER_INVALID);
    }
  }

  debug(`- Get company configuration data`);
  const defaultCompanies    = util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                                      'Companies.json')), schemas.Companies);
  const commonCompanies     = util.getData(util.getDataBody(path.join(exports.config.Path,
                                                                      'Companies.json')), schemas.Companies);
  const userCompanies       = util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                                      'Companies.json')), schemas.Companies);
  exports.companies         = util.mergeData(defaultCompanies, commonCompanies, [], [], [], [], userCompanies);

  debug(`- Get location configuration data`);
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

  debug(`- Get application configuration data`);
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

  debug(`- Get component configuration data`);
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

  debug(`- Validate profile`);
  const profile = `${exports.account.Alias}-${exports.user.Name}`; // Enforce profile naming convention
  util.validateAWSProfile(profile);
  exports.profile = profile;

  debug(`- Calculate bucket names`);
  exports.templates.Bucket = `templates-${exports.account.Alias}-${exports.region.Name}`;
  exports.functions.Bucket = `functions-${exports.account.Alias}-${exports.region.Name}`;
  exports.scripts.Bucket = `scripts-${exports.account.Alias}-${exports.region.Name}`;
  exports.config.Bucket = `config-${exports.account.Alias}-${exports.region.Name}`;

  if (options.stackName) {
    debug(`- Get stack name option`);
    const stack = {
      Name: options.stackName
    };
    exports.stack = stack;

    if (options.templateName) {
      debug(`- Get template name option`);
      const template = {
        Name: options.templateName,
        Path: path.join(exports.templates.Path, options.templateName + '.yaml'),
        URL: 'https://' + ((exports.region.Name == 'us-east-1') ? 's3' : 's3-' + exports.region.Name) + '.amazonaws.com/'
                        + exports.templates.Bucket + '/' + options.templateName + '.yaml'
      };
      // Eventually may want logic here to obtain the Body from either the Path or the URL
      template.Body = util.getTemplateBody(template.Path);
      exports.stack.template = template;

      if (options.policy) {
        const policy = {
          Path: path.join(exports.templates.Path, options.templateName + '-StackPolicy.json'),
          URL: 'https://' + ((exports.region.Name == 'us-east-1') ? 's3' : 's3-' + exports.region.Name) + '.amazonaws.com/'
                          + exports.templates.Bucket + '/' + options.templateName + '-StackPolicy.json'
        };
        // Eventually may want logic here to obtain the Body from either the Path or the URL
        policy.Body = util.getStackPolicyBody(policy.Path)
        exports.stack.policy = policy;
      }
    }
  }

  debug(`- Get wait interval option`);
  if (options.waitInterval) {
    exports.waitInterval = options.waitInterval;
  }

  return;
}
