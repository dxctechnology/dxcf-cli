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

exports.initDefault = () => {
  debug(`config.initDefault()`);

  if (! exports.schemas) {
    debug(`- Load configuration schemas`);
    exports.schemas = {
      Systems:      util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Systems.schema.json'))),
      Accounts:     util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Accounts.schema.json'))),
      Environments: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Environments.schema.json'))),
      Regions:      util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Regions.schema.json'))),
      Users:        util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Users.schema.json'))),
      Parameters:   util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Parameters.schema.json'))),
      Tags:         util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Tags.schema.json'))),
      Companies:    util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Companies.schema.json'))),
      Locations:    util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Locations.schema.json'))),
      Applications: util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Applications.schema.json'))),
      Components:   util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Components.schema.json'))),
      Steps:        util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf',
                                                                'Steps.schema.json')))
    };
  }

  if (! exports.data) {
    exports.data = {};
  }

  if (! exports.data.default) {
    debug(`- Load default configuration data`);
    exports.data.default = {
      systems:      util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Systems.json')), exports.schemas.Systems),
      accounts:     util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Accounts.json')), exports.schemas.Accounts),
      environments: util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Environments.json')), exports.schemas.Environments),
      regions:      util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Regions.json')), exports.schemas.Regions),
      users:        util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Users.json')), exports.schemas.Users),
      parameters:   util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Parameters.json')), exports.schemas.Parameters),
      tags:         util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Tags.json')), exports.schemas.Tags),
      companies:    util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Companies.json')), exports.schemas.Companies),
      locations:    util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Locations.json')), exports.schemas.Locations),
      applications: util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Applications.json')), exports.schemas.Applications),
      components:   util.getData(util.getDataBody(path.join(__dirname, '..', 'conf',
                                                            'Components.json')), exports.schemas.Components)
    };
  }

  debug(`- Delete invalidated configuration data`);
  delete exports.data.user;
  delete exports.data.secure;
  delete exports.data.common;
  delete exports.data.system;
  delete exports.data.account;
  delete exports.data.region;
  delete exports.data.template;
  delete exports.data.stack;
  delete exports.data.calculated;
  delete exports.data.merged;
}

exports.initUser = () => {
  debug(`config.initUser()`);

  if (! exports.data.user) {
    debug(`- Load user configuration data`);
    exports.data.user = {
      systems:      util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Systems.json')), exports.schemas.Systems),
      accounts:     util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Accounts.json')), exports.schemas.Accounts),
      environments: util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Environments.json')), exports.schemas.Environments),
      regions:      util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Regions.json')), exports.schemas.Regions),
      users:        util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Users.json')), exports.schemas.Users),
      parameters:   util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Parameters.json')), exports.schemas.Parameters),
      tags:         util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Tags.json')), exports.schemas.Tags),
      companies:    util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Companies.json')), exports.schemas.Companies),
      locations:    util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Locations.json')), exports.schemas.Locations),
      applications: util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Applications.json')), exports.schemas.Applications),
      components:   util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Components.json')), exports.schemas.Components)
    };
  }

  // Currently these are stored in each user's ~/.dxcf directory, which is meant as a quick but temporary solution
  // Eventually, we should store and obtain these from the system parameter store in some way
  // This is likely a more complex process than pulling down the values and merging them. We are likely to need
  // modifications to the templates so the templates pull the values direct from the secure parameter store when in use.
  if (! exports.data.secure) {
    debug(`- Load user secure configuration data`);
    exports.data.secure = {
      parameters:   util.getData(util.getDataBody(path.join(os.homedir(), '.dxcf',
                                                            'Secure-Parameters.json')), exports.schemas.Parameters)
    };
  }

  debug(`- Delete invalidated configuration data`);
  delete exports.data.common;
  delete exports.data.system;
  delete exports.data.account;
  delete exports.data.region;
  delete exports.data.template;
  delete exports.data.stack;
  delete exports.data.calculated;
  delete exports.data.merged;
}

exports.initCommon = (options) => {
  debug(`config.initCommon()`);

  if (! exports.options) {
    exports.options = {};
  }

  debug(`- Get global boolean options`);
  exports.options.verbose      = options.parent.verbose;
  exports.options.confirm      = options.parent.confirm;

  debug(`- Validate directory options`);
  if (! exports.options.templates) {
    exports.options.templates = {
      path: options.parent.templates
    };
    util.validateTemplatesDir(exports.options.templates.path);
  }
  if (! exports.options.functions) {
    exports.options.functions = {
      path: options.parent.functions
    };
    util.validateFunctionsDir(exports.options.functions.path);
  }
  if (! exports.options.scripts) {
    exports.options.scripts = {
      path: options.parent.scripts
    };
    util.validateScriptsDir(exports.options.scripts.path);
  }
  if (! exports.options.config) {
    exports.options.config = {
      path: options.parent.config
    };
    util.validateConfigDir(exports.options.config.path);
  }

  if (! exports.data.common) {
    debug(`- Load common configuration data`);
    exports.data.common = {
      systems:      util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Systems.json')), exports.schemas.Systems),
      accounts:     util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Accounts.json')), exports.schemas.Accounts),
      environments: util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Environments.json')), exports.schemas.Environments),
      regions:      util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Regions.json')), exports.schemas.Regions),
      users:        util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Users.json')), exports.schemas.Users),
      parameters:   util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Parameters.json')), exports.schemas.Parameters),
      tags:         util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Tags.json')), exports.schemas.Tags),
      companies:    util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Companies.json')), exports.schemas.Companies),
      locations:    util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Locations.json')), exports.schemas.Locations),
      applications: util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Applications.json')), exports.schemas.Applications),
      components:   util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                            'Components.json')), exports.schemas.Components)
    };
  }

  debug(`- Merge common configuration data`);
  exports.data.merged = {}; // This also clears all other merged data
  exports.data.merged.systems   = util.mergeData(exports.data.default.systems, exports.data.common.systems,
                                                 [], [], [], [], exports.data.user.systems);
  exports.data.merged.companies = util.mergeData(exports.data.default.companies, exports.data.common.companies,
                                                 [], [], [], [], exports.data.user.companies);

  debug(`- Delete invalidated options`);
  delete exports.options.system;
  delete exports.options.account;
  delete exports.options.environment;
  delete exports.options.region;
  delete exports.options.user;
  delete exports.options.profile;
  delete exports.options.stack;

  debug(`- Delete invalidated configuration data`);
  delete exports.data.system;
  delete exports.data.account;
  delete exports.data.region;
  delete exports.data.template;
  delete exports.data.stack;
  delete exports.data.calculated;
}

exports.initSystem = (options) => {
  debug(`config.initSystem() [System: ${options.parent.system}]`);

  if (options.parent.system) {
    debug(`- Validate system option`);
    const systems = exports.data.merged.systems.filter(s => s.Name == options.parent.system);
    switch (systems.length) {
      case 1:
        debug(`  - Valid system: ${systems[0].Name}`);
        exports.options.system = systems[0];
        break;
      case 0:
        throw new CommandError(`System '${options.parent.system}' not found in Systems data array`, errors.OPTION_SYSTEM_NOT_FOUND);
      default:
        throw new CommandError(`System '${options.parent.system}' duplicates found in Systems data array`, errors.OPTION_SYSTEM_INVALID);
    }
  }
  else {
    debug(`- Get system default`);
    const defaultSystems = exports.data.merged.systems.filter(s => s.Default == true);
    switch (defaultSystems.length) {
      case 1:
        debug(`  - Default system: ${defaultSystems[0].Name}`);
        exports.options.system = defaultSystems[0];
        break;
      case 0:
        throw new CommandError(`Default system not found in Systems data array`, errors.DEFAULT_SYSTEM_NOT_FOUND);
      default:
        throw new CommandError(`Default system duplicates found in Systems data array`, errors.DEFAULT_SYSTEM_INVALID);
    }
  }

  debug(`- Load system configuration data`);
  exports.data.system = {
    accounts:     util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts.json')), exports.schemas.Accounts),
    environments: util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Environments.json')), exports.schemas.Environments),
    regions:      util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Regions.json')), exports.schemas.Regions),
    users:        util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Users.json')), exports.schemas.Users),
    parameters:   util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Parameters.json')), exports.schemas.Parameters),
    tags:        util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Tags.json')), exports.schemas.Tags),
    locations:    util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Locations.json')), exports.schemas.Locations),
    applications: util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Applications.json')), exports.schemas.Applications),
    components:   util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Components.json')), exports.schemas.Components)
  };

  debug(`- Merge system configuration data`);
  exports.data.merged.accounts     = util.mergeData(exports.data.default.accounts, exports.data.common.accounts, exports.data.system.accounts,
                                                    [], [], [], exports.data.user.accounts);
  exports.data.merged.locations    = util.mergeData(exports.data.default.locations, exports.data.common.locations, exports.data.system.locations,
                                                    [], [], [], exports.data.user.locations);
  exports.data.merged.applications = util.mergeData(exports.data.default.applications, exports.data.common.applications, exports.data.system.applications,
                                                    [], [], [], exports.data.user.applications);
  exports.data.merged.components   = util.mergeData(exports.data.default.components, exports.data.common.components, exports.data.system.components,
                                                    [], [], [], exports.data.user.components);

  debug(`- Delete invalidated options`);
  delete exports.options.account;
  delete exports.options.environment;
  delete exports.options.region;
  delete exports.options.user;
  delete exports.options.profile;
  delete exports.options.stack;

  debug(`- Delete invalidated configuration data`);
  delete exports.data.account;
  delete exports.data.region;
  delete exports.data.template;
  delete exports.data.stack;
  delete exports.data.calculated;
  delete exports.data.merged.environments;
  delete exports.data.merged.regions;
  delete exports.data.merged.users;
  delete exports.data.merged.parameters;
  delete exports.data.merged.tags;
}

exports.initAccount = (options) => {
  debug(`config.initAccount() [Account: ${options.parent.account}]`);

  if (options.parent.account) {
    debug(`- Validate account option`);
    const accounts = exports.data.merged.accounts.filter(a => a.Id    == options.parent.account || // Unique and immutable, but hard to read
                                                              a.Alias == options.parent.account || // Unique, but can change over time
                                                              a.Name  == options.parent.account);  // Preferred, but may not be specific enough
    switch (accounts.length) {
      case 1:
        debug(`  - Valid account: ${accounts[0].Name}`);
        exports.options.account = accounts[0];
        break;
      case 0:
        throw new CommandError(`Account '${options.parent.account}' not found in Accounts data array`, errors.OPTION_ACCOUNT_NOT_FOUND);
      default:
        throw new CommandError(`Account '${options.parent.account}' duplicates found in Accounts data array`, errors.OPTION_ACCOUNT_INVALID);
    }
  }
  else {
    debug(`- Get account default`);
    const defaultAccounts = exports.data.merged.accounts.filter(a => a.Default == true);
    switch (defaultAccounts.length) {
      case 1:
        debug(`  - Default account: ${defaultAccounts[0].Name}`);
        exports.options.account = defaultAccounts[0];
        break;
      case 0:
        throw new CommandError(`Default account not found in Accounts data array`, errors.DEFAULT_ACCOUNT_NOT_FOUND);
      default:
        throw new CommandError(`Default account duplicates found in Accounts data array`, errors.DEFAULT_ACCOUNT_INVALID);
    }
  }

  debug(`- Load account configuration data`);
  exports.data.account = {
    environments: util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Environments.json')), exports.schemas.Environments),
    regions:      util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Regions.json')), exports.schemas.Regions),
    users:        util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Users.json')), exports.schemas.Users),
    parameters:   util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Parameters.json')), exports.schemas.Parameters),
    tags:         util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Tags.json')), exports.schemas.Tags)
  };

  debug(`- Merge account configuration data`);
  exports.data.merged.environments = util.mergeData(exports.data.default.environments, exports.data.common.environments, exports.data.system.environments,
                                                    exports.data.account.environments, [], [], exports.data.user.environments);
  exports.data.merged.regions      = util.mergeData(exports.data.default.regions, exports.data.common.regions, exports.data.system.regions,
                                                    exports.data.account.regions, [], [], exports.data.user.regions);

  debug(`- Delete invalidated options`);
  delete exports.options.environment;
  delete exports.options.region;
  delete exports.options.user;
  delete exports.options.profile;
  delete exports.options.stack;

  debug(`- Delete invalidated configuration data`);
  delete exports.data.region;
  delete exports.data.template;
  delete exports.data.stack;
  delete exports.data.calculated;
  delete exports.data.merged.users;
  delete exports.data.merged.parameters;
  delete exports.data.merged.tags;
}

exports.initRegion = (options) => {
  debug(`config.initRegion() [Region: ${options.parent.region}]`);

  if (options.parent.environment) {
    debug(`- Validate environment option`);
    const environments = exports.data.merged.environments.filter(e => e.Name   == options.parent.environment &&
                                                                      e.Active == true);
    switch (environments.length) {
      case 1:
        debug(`  - Valid environment: ${environments[0].Name}`);
        exports.options.environment = environments[0];
        break;
      case 0:
        throw new CommandError(`Environment '${options.parent.environment}' not active or not found in Environments data array`, errors.OPTION_ENVIRONMENT_NOT_FOUND);
      default:
        throw new CommandError(`Environment '${options.parent.environment}' duplicates found in Environments data array`, errors.OPTION_ENVIRONMENT_INVALID);
    }
  }
  else {
    debug(`- Get environment default`);
    const defaultEnvironments = exports.data.merged.environments.filter(e => e.Default == true &&
                                                                             e.Active  == true);
    switch (defaultEnvironments.length) {
      case 1:
        debug(`  - Default environment: ${defaultEnvironments[0].Name}`);
        exports.options.environment = defaultEnvironments[0];
        break;
      case 0:
        throw new CommandError(`Default environment not active or not found in Environments data array`, errors.DEFAULT_ENVIRONMENT_NOT_FOUND);
      default:
        throw new CommandError(`Default environment duplicates found in Environments data array`, errors.DEFAULT_ENVIRONMENT_INVALID);
    }
  }

  if (options.parent.region) {
    debug(`- Validate region option`);
    const regions = exports.data.merged.regions.filter(r => r.Name   == options.parent.region &&
                                                            r.Active == true);
    switch (regions.length) {
      case 1:
        debug(`  - Valid region: ${regions[0].Name}`);
        exports.options.region = regions[0];
        break;
      case 0:
        throw new CommandError(`Region '${options.parent.region}' not active or not found in Regions data array`, errors.OPTION_REGION_NOT_FOUND);
      default:
        throw new CommandError(`Region '${options.parent.region}' duplicates found in Regions data array`, errors.OPTION_REGION_INVALID);
    }
  }
  else {
    debug(`- Get region default`);
    const defaultRegions = exports.data.merged.regions.filter(r => r.Default == true &&
                                                                   r.Active  == true);
    switch (defaultRegions.length) {
      case 1:
        debug(`  - Default region: ${defaultRegions[0].Name}`);
        exports.options.region = defaultRegions[0];
        break;
      case 0:
        throw new CommandError(`Default region not active or not found in Regions data array`, errors.DEFAULT_REGION_NOT_FOUND);
      default:
        throw new CommandError(`Default region duplicates found in Regions data array`, errors.DEFAULT_REGION_INVALID);
    }
  }

  debug(`- Calculate bucket options`);
  exports.options.templates.bucket = `templates-${exports.options.account.Alias}-${exports.options.region.Name}`;
  exports.options.functions.bucket = `functions-${exports.options.account.Alias}-${exports.options.region.Name}`;
  exports.options.scripts.bucket = `scripts-${exports.options.account.Alias}-${exports.options.region.Name}`;
  exports.options.config.bucket = `config-${exports.options.account.Alias}-${exports.options.region.Name}`;

  debug(`- Load region configuration data`);
  exports.data.region = {
    users:        util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Regions', exports.options.region.Name,
                                                          'Users.json')), exports.schemas.Users),
    parameters:   util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Regions', exports.options.region.Name,
                                                          'Parameters.json')), exports.schemas.Parameters),
    tags:         util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Regions', exports.options.region.Name,
                                                          'Tags.json')), exports.schemas.Tags)
  };

  debug(`- Merge region configuration data`);
  exports.data.merged.users = util.mergeData(exports.data.default.users, exports.data.common.users, exports.data.system.users,
                                             exports.data.account.users, exports.data.region.users, [], exports.data.user.users);

  debug(`- Delete invalidated options`);
  delete exports.options.user;
  delete exports.options.profile;
  delete exports.options.stack;

  debug(`- Delete invalidated configuration data`);
  delete exports.data.template;
  delete exports.data.stack;
  delete exports.data.calculated;
  delete exports.data.merged.parameters;
  delete exports.data.merged.tags;
}

exports.initProfile = (options) => {
  debug(`config.initProfile() [Account: ${exports.options.account.Alias}, User: ${options.parent.user}]`);

  if (options.parent.user) {
    debug(`- Validate user option`);
    const users = exports.data.merged.users.filter(u => u.Name == options.parent.user);
    switch (users.length) {
      case 1:
        debug(`  - Valid user: ${users[0].Name}`);
        exports.options.user = users[0];
        break;
      case 0:
        throw new CommandError(`User '${options.parent.user}' not found in Users data array`, errors.OPTION_USER_NOT_FOUND);
      default:
        throw new CommandError(`User '${options.parent.user}' duplicates found in Users data array`, errors.OPTION_USER_INVALID);
    }
  }
  else {
    debug(`- Get user default`);
    const defaultUsers = exports.data.merged.users.filter(u => u.Default == true);
    switch (defaultUsers.length) {
      case 1:
        debug(`  - Default user: ${defaultUsers[0].Name}`);
        exports.options.user = defaultUsers[0];
        break;
      case 0:
        throw new CommandError(`Default user not found in Users data array`, errors.DEFAULT_USER_NOT_FOUND);
      default:
        throw new CommandError(`Default user duplicates found in Users data array`, errors.DEFAULT_USER_INVALID);
    }
  }

  debug(`- Validate profile`);
  const profile = `${exports.options.account.Alias}-${exports.options.user.Name}`; // Enforce profile naming convention
  util.validateAWSProfile(profile);
  exports.options.profile = profile;
}

exports.initStack = (options) => {
  debug(`config.initStack()` + ((options.stackName) ? ` [Stack: ${options.stackName}]` : ''));

  debug(`- Get global boolean options (again, as these may be overridden)`);
  exports.options.verbose      = options.parent.verbose;
  exports.options.confirm      = options.parent.confirm;

  debug(`- Get stack boolean options`);
  exports.options.prerequisite = options.prerequisite;
  exports.options.lambda       = options.lambda;
  exports.options.policy       = options.policy;
  exports.options.monitor      = options.monitor;
  exports.options.wait         = options.wait;

  if (options.stackName) {
    debug(`- Get stack option`);
    const stack = {
      name: options.stackName
    };
    exports.options.stack = stack;

    if (options.templateName) {
      debug(`- Get stack template option`);
      const template = {
        name: options.templateName,
        path: path.join(exports.options.templates.path, options.templateName + '.yaml'),
        url: 'https://' + ((exports.options.region.Name == 'us-east-1') ? 's3' : 's3-' + exports.options.region.Name) + '.amazonaws.com/'
                        + exports.options.templates.bucket + '/' + options.templateName + '.yaml'
      };
      // Eventually may want logic here to obtain the Body from either the Path or the URL
      template.body = util.getTemplateBody(template.path);
      exports.options.stack.template = template;

      if (options.policy) {
        const policy = {
          path: path.join(exports.options.templates.path, options.templateName + '-StackPolicy.json'),
          url: 'https://' + ((exports.options.region.Name == 'us-east-1') ? 's3' : 's3-' + exports.options.region.Name) + '.amazonaws.com/'
                          + exports.options.templates.bucket + '/' + options.templateName + '-StackPolicy.json'
        };
        // Eventually may want logic here to obtain the Body from either the Path or the URL
        policy.body = util.getStackPolicyBody(policy.path)
        exports.options.stack.policy = policy;
      }

      debug(`- Get stack wait interval option`);
      if (options.waitInterval) {
        exports.options.waitInterval = options.waitInterval;
      }
    }
  }
}

exports.initStackConfig = (calculatedParameters = [], calculatedCapabilities = []) => {
  debug(`config.initStackConfig() [Stack: ${exports.options.stack.name}`);

  debug(`- Save calculated configuration parameters and capabilities`);
  exports.data.calculated = {
    parameters: calculatedParameters,
    capabilities: calculatedCapabilities
  };

  debug(`- Load template configuration parameters`);
  exports.data.template = {
    parameters: util.getTemplateParameters(exports.options.stack.template.body)
  };

  debug(`- Load stack configuration parameters and tags`);
  exports.data.stack = {
    parameters:   util.getParameters(util.getParametersBody(path.join(exports.options.config.path,
                                                                      'Systems', exports.options.system.Name,
                                                                      'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                                      'Regions', exports.options.region.Name,
                                                                      'Stacks', exports.options.stack.Name + '-Parameters.json')), exports.schemas.Parameters),
    tags:         util.getData(util.getDataBody(path.join(exports.options.config.path,
                                                          'Systems', exports.options.system.Name,
                                                          'Accounts', exports.options.account.Name + '[' + exports.options.account.Id + ']',
                                                          'Regions', exports.options.region.Name,
                                                          'Stacks', exports.options.stack.Name + '-Tags.json')), exports.schemas.Tags)
  };

  debug(`- Merge stack configuration parameters and tags`);
  if (exports.data.template.parameters.length > 0) {
    exports.data.merged.parameters = util.mergeParameters(exports.data.template.parameters,
                                                          exports.data.default.parameters, exports.data.common.parameters, exports.data.system.parameters,
                                                          exports.data.account.parameters, exports.data.region.parameters, exports.data.stack.parameters,
                                                          exports.data.user.parameters, exports.data.secure.parameters, exports.data.calculated.parameters);
  }
  else {
    exports.data.merged.parameters = [];
  }
  exports.data.merged.tags = util.mergeTags(exports.data.default.tags, exports.data.common.tags, exports.data.system.tags,
                                            exports.data.account.tags, exports.data.region.tags, exports.data.stack.tags, exports.data.user.tags);
}

exports.init = (options) => {
  debug(`config.init()`);

  exports.initDefault();
  exports.initUser();
  exports.initCommon(options);
  exports.initSystem(options);
  exports.initAccount(options);
  exports.initRegion(options);
  exports.initProfile(options);
}
