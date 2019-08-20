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
const schemas = require(path.join(__dirname, 'schemas'));
const errors = require(path.join(__dirname, 'errors'));
const CommandError = require(path.join(__dirname, 'errors')).CommandError;

exports.saveProgramOptions = (options) => {
  debug(`config.saveProgramOptions()`);

  debug(`- Save program options`);
  exports.program = {
    name:        options.parent._name.replace(/^[^-]*-/,''),
    config:      options.parent.config,
    templates:   options.parent.templates,
    functions:   options.parent.functions,
    scripts:     options.parent.scripts,
    system:      options.parent.system,
    account:     options.parent.account,
    environment: options.parent.environment,
    region:      options.parent.region,
    user:        options.parent.user,
    verbose:     options.parent.verbose,
    confirm:     options.parent.confirm
  };

  debug(`- Initialize merged configuration data`);
  exports.merged = {
    companies: [],
    locations: [],
    applications: [],
    components: [],
    systems: [],
    accounts: [],
    environments: [],
    regions: [],
    users: [],
    switches: [],
    parameters: [],
    tags: []
  };
}

exports.setCurrentRepositoryPaths = () => {
  debug(`config.setCurrentRepositoryPaths()`);

  // We can and must merge the repository options at this time, as the config repository is needed to lookup all further configuration
  debug(`- Initialize repositories`);
  exports.current = {
    config: { path: exports.program.config },
    templates: { path: exports.program.templates },
    functions: { path: exports.program.functions },
    scripts: { path: exports.program.scripts }
  };

  debug(`- Validate current program directory options`);
  util.validateConfigDir(exports.current.config.path, 'Common');
  util.validateTemplatesDir(exports.current.templates.path);
  util.validateFunctionsDir(exports.current.functions.path);
  util.validateScriptsDir(exports.current.scripts.path);
}

exports.saveDescribeStacksCommandOptions = (options) => {
  debug(`config.saveDescribeStacksCommandOptions()` + ((options.stackName) ? ` [Stack: ${options.stackName}]` : ''));

  debug(`- Save command options`);
  exports.command = {
    name:      options._name,
    stackName: options.stackName
  };
}

exports.saveCreateStackCommandOptions = (options) => {
  debug(`config.saveCreateStackCommandOptions() [Stack: ${options.stackName}], [Template: ${options.templateName}]`);

  debug(`- Save command options`);
  exports.command = {
    name:         options._name,
    stackName:    options.stackName,
    templateName: options.templateName,
    parameters:   options.parameter,
    tags:         options.tag,
    waitInterval: options.waitInterval,
    monitor:      options.monitor,
    wait:         options.wait,
    prerequisite: options.prerequisite,
    lambda:       options.lambda,
    policy:       options.policy
  };
}

// TODO: Not really much to do here initially.
//       - We may eventually want to provide some way to show summary or details
//       - If we show details, we may need to specify phases or steps to restrict what details are shown
//       - So, leaving this here as a placeholder, even though initially, all we collect is the command name
exports.saveDescribeRegionsCommandOptions = (options) => {
  debug(`config.saveDescribeRegionsCommandOptions()`);

  debug(`- Save command options`);
  exports.command = {
    name:      options._name
  };
}

exports.saveCreateRegionCommandOptions = (options) => {
  debug(`config.saveCreateRegionCommandOptions()` + ((options.phase) ? ` [Phase: ${options.phase}], ` : '') + ((options.step) ? ` [Step: ${options.step}], ` : ''));

  debug(`- Save command options`);
  exports.command = {
    name:         options._name,
    phases:       options.phase,
    steps:        options.step,
    waitInterval: options.waitInterval,
    monitor:      options.monitor,
    wait:         options.wait,
    prerequisite: options.prerequisite,
    lambda:       options.lambda,
    policy:       options.policy
  };
}

exports.loadDefaultData = () => {
  debug(`config.loadDefaultData()`);

  const configPath = path.join(__dirname, '..', 'conf');
  util.validateConfigDir(configPath, 'Default');

  exports.default = {
    companies:    util.getData(util.getDataBody(path.join(configPath, 'Companies.json')), schemas.companies),
    locations:    util.getData(util.getDataBody(path.join(configPath, 'Locations.json')), schemas.locations),
    applications: util.getData(util.getDataBody(path.join(configPath, 'Applications.json')), schemas.applications),
    components:   util.getData(util.getDataBody(path.join(configPath, 'Components.json')), schemas.components),
    systems:      util.getData(util.getDataBody(path.join(configPath, 'Systems.json')), schemas.systems),
    accounts:     util.getData(util.getDataBody(path.join(configPath, 'Accounts.json')), schemas.accounts),
    environments: util.getData(util.getDataBody(path.join(configPath, 'Environments.json')), schemas.environments),
    regions:      util.getData(util.getDataBody(path.join(configPath, 'Regions.json')), schemas.regions),
    users:        util.getData(util.getDataBody(path.join(configPath, 'Users.json')), schemas.users),
    flags:        util.getData(util.getDataBody(path.join(configPath, 'Flags.json')), schemas.flags),
    parameters:   util.getData(util.getDataBody(path.join(configPath, 'Parameters.json')), schemas.parameters),
    tags:         util.getData(util.getDataBody(path.join(configPath, 'Tags.json')), schemas.tags)
  };
}

exports.loadUserData = () => {
  debug(`config.loadUserData()`);

  const configPath = path.join(os.homedir(), '.dxcf');
  util.validateConfigDir(configPath, 'User');

  exports.user = {
    companies:    util.getData(util.getDataBody(path.join(configPath, 'Companies.json')), schemas.companies),
    locations:    util.getData(util.getDataBody(path.join(configPath, 'Locations.json')), schemas.locations),
    applications: util.getData(util.getDataBody(path.join(configPath, 'Applications.json')), schemas.applications),
    components:   util.getData(util.getDataBody(path.join(configPath, 'Components.json')), schemas.components),
    systems:      util.getData(util.getDataBody(path.join(configPath, 'Systems.json')), schemas.systems),
    accounts:     util.getData(util.getDataBody(path.join(configPath, 'Accounts.json')), schemas.accounts),
    environments: util.getData(util.getDataBody(path.join(configPath, 'Environments.json')), schemas.environments),
    regions:      util.getData(util.getDataBody(path.join(configPath, 'Regions.json')), schemas.regions),
    users:        util.getData(util.getDataBody(path.join(configPath, 'Users.json')), schemas.users),
    flags:        util.getData(util.getDataBody(path.join(configPath, 'Flags.json')), schemas.flags),
    parameters:   util.getData(util.getDataBody(path.join(configPath, 'Parameters.json')), schemas.parameters),
    tags:         util.getData(util.getDataBody(path.join(configPath, 'Tags.json')), schemas.tags)
  };

  // Currently these are stored in each user's ~/.dxcf directory, which is meant as a quick but temporary solution
  // Eventually, we should store and obtain these from the system parameter store in some way
  // This is likely a more complex process than pulling down the values and merging them. We are likely to need
  // modifications to the templates so the templates pull the values direct from the secure parameter store when in use.
  exports.secure = {
    parameters:   util.getData(util.getDataBody(path.join(configPath, 'Secure-Parameters.json')), schemas.parameters)
  };
}

exports.loadCommonData = () => {
  debug(`config.loadCommonData()`);

  const configPath = exports.current.config.path;
  util.validateConfigDir(configPath, 'Common');

  exports.common = {
    companies:    util.getData(util.getDataBody(path.join(configPath, 'Companies.json')), schemas.companies),
    locations:    util.getData(util.getDataBody(path.join(configPath, 'Locations.json')), schemas.locations),
    applications: util.getData(util.getDataBody(path.join(configPath, 'Applications.json')), schemas.applications),
    components:   util.getData(util.getDataBody(path.join(configPath, 'Components.json')), schemas.components),
    systems:      util.getData(util.getDataBody(path.join(configPath, 'Systems.json')), schemas.systems),
    accounts:     util.getData(util.getDataBody(path.join(configPath, 'Accounts.json')), schemas.accounts),
    environments: util.getData(util.getDataBody(path.join(configPath, 'Environments.json')), schemas.environments),
    regions:      util.getData(util.getDataBody(path.join(configPath, 'Regions.json')), schemas.regions),
    users:        util.getData(util.getDataBody(path.join(configPath, 'Users.json')), schemas.users),
    flags:        util.getData(util.getDataBody(path.join(configPath, 'Flags.json')), schemas.flags),
    parameters:   util.getData(util.getDataBody(path.join(configPath, 'Parameters.json')), schemas.parameters),
    tags:         util.getData(util.getDataBody(path.join(configPath, 'Tags.json')), schemas.tags)
  };
}

exports.mergeCommonData = () => {
  debug(`config.mergeCommonData()`);

  exports.merged.companies = util.mergeData(exports.default.companies, exports.common.companies,
                                            [], [], [], [], exports.user.companies);
  exports.merged.systems   = util.mergeData(exports.default.systems, exports.common.systems,
                                            [], [], [], [], exports.user.systems);
}

exports.setCurrentSystem = (systemName = '') => {
  debug(`config.setCurrentSystem(${systemName})`);

  if (systemName) {
    debug(`- Use system option: ${systemName}`);
  }
  else if (exports.program.system) {
    systemName = exports.program.system;
    debug(`- Found system option: ${systemName}`);
  }

  if (systemName) {
    debug(`- Validate system option`);
    const systems = exports.merged.systems.filter(s => s.Name == systemName);
    switch (systems.length) {
      case 1:
        debug(`  - Valid system: ${systems[0].Name}`);
        exports.current.system = systems[0];
        break;
      case 0:
        throw new CommandError(`System '${systemName}' not found in Systems data array`, errors.OPTION_SYSTEM_NOT_FOUND);
      default:
        throw new CommandError(`System '${systemName}' duplicates found in Systems data array`, errors.OPTION_SYSTEM_INVALID);
    }
  }
  else {
    debug(`- Get system default`);
    const defaultSystems = exports.merged.systems.filter(s => s.Default == true);
    switch (defaultSystems.length) {
      case 1:
        debug(`  - Default system: ${defaultSystems[0].Name}`);
        exports.current.system = defaultSystems[0];
        break;
      case 0:
        throw new CommandError(`Default system not found in Systems data array`, errors.DEFAULT_SYSTEM_NOT_FOUND);
      default:
        throw new CommandError(`Default system duplicates found in Systems data array`, errors.DEFAULT_SYSTEM_INVALID);
    }
  }
}

exports.loadSystemData = () => {
  debug(`config.loadSystemData()`);

  const configPath = path.join(exports.current.config.path,
                               'Systems', exports.current.system.Name);
  util.validateConfigDir(configPath, 'System');

  exports.system = {
    locations:    util.getData(util.getDataBody(path.join(configPath, 'Locations.json')), schemas.locations),
    applications: util.getData(util.getDataBody(path.join(configPath, 'Applications.json')), schemas.applications),
    components:   util.getData(util.getDataBody(path.join(configPath, 'Components.json')), schemas.components),
    accounts:     util.getData(util.getDataBody(path.join(configPath, 'Accounts.json')), schemas.accounts),
    environments: util.getData(util.getDataBody(path.join(configPath, 'Environments.json')), schemas.environments),
    regions:      util.getData(util.getDataBody(path.join(configPath, 'Regions.json')), schemas.regions),
    users:        util.getData(util.getDataBody(path.join(configPath, 'Users.json')), schemas.users),
    flags:        util.getData(util.getDataBody(path.join(configPath, 'Flags.json')), schemas.flags),
    parameters:   util.getData(util.getDataBody(path.join(configPath, 'Parameters.json')), schemas.parameters),
    tags:         util.getData(util.getDataBody(path.join(configPath, 'Tags.json')), schemas.tags)
  };
}

exports.mergeSystemData = () => {
  debug(`config.mergeSystemData()`);

  exports.merged.locations    = util.mergeData(exports.default.locations, exports.common.locations, exports.system.locations,
                                               [], [], [], exports.user.locations);
  exports.merged.applications = util.mergeData(exports.default.applications, exports.common.applications, exports.system.applications,
                                               [], [], [], exports.user.applications);
  exports.merged.components   = util.mergeData(exports.default.components, exports.common.components, exports.system.components,
                                               [], [], [], exports.user.components);
  exports.merged.accounts     = util.mergeData(exports.default.accounts, exports.common.accounts, exports.system.accounts,
                                               [], [], [], exports.user.accounts);
}

exports.setCurrentAccount = (accountValue = '') => {
  debug(`config.setCurrentAccount(${accountValue})`);

  if (accountValue) {
    debug(`- Use account option: ${accountValue}`);
  }
  else if (exports.program.account) {
    accountValue = exports.program.account;
    debug(`- Found account option: ${accountValue}`);
  }

  if (accountValue) {
    debug(`- Validate account option`);
    const accounts = exports.merged.accounts.filter(a => a.Id    == accountValue || // Unique and immutable, but hard to read
                                                         a.Alias == accountValue || // Unique but mutable
                                                         a.Name  == accountValue);  // Preferred, but may not be specific enough
    switch (accounts.length) {
      case 1:
        debug(`  - Valid account: ${accounts[0].Name}`);
        exports.current.account = accounts[0];
        break;
      case 0:
        throw new CommandError(`Account '${accountValue}' not found in Accounts data array`, errors.OPTION_ACCOUNT_NOT_FOUND);
      default:
        throw new CommandError(`Account '${accountValue}' duplicates found in Accounts data array`, errors.OPTION_ACCOUNT_INVALID);
    }
  }
  else {
    debug(`- Get account default`);
    const defaultAccounts = exports.merged.accounts.filter(a => a.Default == true);
    switch (defaultAccounts.length) {
      case 1:
        debug(`  - Default account: ${defaultAccounts[0].Name}`);
        exports.current.account = defaultAccounts[0];
        break;
      case 0:
        throw new CommandError(`Default account not found in Accounts data array`, errors.DEFAULT_ACCOUNT_NOT_FOUND);
      default:
        throw new CommandError(`Default account duplicates found in Accounts data array`, errors.DEFAULT_ACCOUNT_INVALID);
    }
  }
}

exports.loadAccountData = () => {
  debug(`config.loadAccountData()`);
  const configPath = path.join(exports.current.config.path,
                               'Systems', exports.current.system.Name,
                               'Accounts', exports.current.account.Name + '[' + exports.current.account.Id + ']');
  util.validateConfigDir(configPath, 'Account');

  exports.account = {
    environments: util.getData(util.getDataBody(path.join(configPath, 'Environments.json')), schemas.environments),
    regions:      util.getData(util.getDataBody(path.join(configPath, 'Regions.json')), schemas.regions),
    users:        util.getData(util.getDataBody(path.join(configPath, 'Users.json')), schemas.users),
    flags:        util.getData(util.getDataBody(path.join(configPath, 'Flags.json')), schemas.flags),
    parameters:   util.getData(util.getDataBody(path.join(configPath, 'Parameters.json')), schemas.parameters),
    tags:         util.getData(util.getDataBody(path.join(configPath, 'Tags.json')), schemas.tags)
  };
}

exports.mergeAccountData = () => {
  debug(`config.mergeAccountData()`);

  exports.merged.environments = util.mergeData(exports.default.environments, exports.common.environments, exports.system.environments,
                                               exports.account.environments, [], [], exports.user.environments);
  exports.merged.regions      = util.mergeData(exports.default.regions, exports.common.regions, exports.system.regions,
                                               exports.account.regions, [], [], exports.user.regions);
}

exports.setCurrentEnvironment = (environmentName = '') => {
  debug(`config.setCurrentEnvironment(${environmentName})`);

  if (environmentName) {
    debug(`- Use environment option: ${environmentName}`);
  }
  else if (exports.program.environment) {
    environmentName = exports.program.environment;
    debug(`- Found environment option: ${environmentName}`);
  }

  if (environmentName) {
    debug(`- Validate environment option`);
    const environments = exports.merged.environments.filter(e => e.Name   == environmentName &&
                                                                 e.Active == true);
    switch (environments.length) {
      case 1:
        debug(`  - Valid environment: ${environments[0].Name}`);
        exports.current.environment = environments[0];
        break;
      case 0:
        throw new CommandError(`Environment '${environmentName}' not active or not found in Environments data array`, errors.OPTION_ENVIRONMENT_NOT_FOUND);
      default:
        throw new CommandError(`Environment '${environmentName}' duplicates found in Environments data array`, errors.OPTION_ENVIRONMENT_INVALID);
    }
  }
  else {
    debug(`- Get environment default`);
    const defaultEnvironments = exports.merged.environments.filter(e => e.Default == true &&
                                                                        e.Active  == true);
    switch (defaultEnvironments.length) {
      case 1:
        debug(`  - Default environment: ${defaultEnvironments[0].Name}`);
        exports.current.environment = defaultEnvironments[0];
        break;
      case 0:
        throw new CommandError(`Default environment not active or not found in Environments data array`, errors.DEFAULT_ENVIRONMENT_NOT_FOUND);
      default:
        throw new CommandError(`Default environment duplicates found in Environments data array`, errors.DEFAULT_ENVIRONMENT_INVALID);
    }
  }
}

exports.setCurrentRegion = (regionName = '') => {
  debug(`config.setCurrentRegion(${regionName})`);

  if (regionName) {
    debug(`- Use region option: ${regionName}`);
  }
  else if (exports.program.region) {
    regionName = exports.program.region;
    debug(`- Found region option: ${regionName}`);
  }

  if (regionName) {
    debug(`- Validate region option`);
    const regions = exports.merged.regions.filter(r => r.Name   == regionName &&
                                                       r.Active == true);
    switch (regions.length) {
      case 1:
        debug(`  - Valid region: ${regions[0].Name}`);
        exports.current.region = regions[0];
        break;
      case 0:
        throw new CommandError(`Region '${regionName}' not active or not found in Regions data array`, errors.OPTION_REGION_NOT_FOUND);
      default:
        throw new CommandError(`Region '${regionName}' duplicates found in Regions data array`, errors.OPTION_REGION_INVALID);
    }
  }
  else {
    debug(`- Get region default`);
    const defaultRegions = exports.merged.regions.filter(r => r.Default == true &&
                                                              r.Active  == true);
    switch (defaultRegions.length) {
      case 1:
        debug(`  - Default region: ${defaultRegions[0].Name}`);
        exports.current.region = defaultRegions[0];
        break;
      case 0:
        throw new CommandError(`Default region not active or not found in Regions data array`, errors.DEFAULT_REGION_NOT_FOUND);
      default:
        throw new CommandError(`Default region duplicates found in Regions data array`, errors.DEFAULT_REGION_INVALID);
    }
  }
}

exports.setCurrentRepositoryBuckets = () => {
  debug(`config.setCurrentRepositoryBuckets()`);

  exports.current.config.bucket = `config-${exports.current.account.Alias}-${exports.current.region.Name}`;
  exports.current.templates.bucket = `templates-${exports.current.account.Alias}-${exports.current.region.Name}`;
  exports.current.functions.bucket = `functions-${exports.current.account.Alias}-${exports.current.region.Name}`;
  exports.current.scripts.bucket = `scripts-${exports.current.account.Alias}-${exports.current.region.Name}`;
}

exports.loadRegionData = () => {
  debug(`config.loadRegionData()`);
  const configPath = path.join(exports.current.config.path,
                               'Systems', exports.current.system.Name,
                               'Accounts', exports.current.account.Name + '[' + exports.current.account.Id + ']',
                               'Regions', exports.current.region.Name);
  util.validateConfigDir(configPath, 'Region');

  exports.region = {
    users:        util.getData(util.getDataBody(path.join(configPath, 'Users.json')), schemas.users),
    flags:        util.getData(util.getDataBody(path.join(configPath, 'Flags.json')), schemas.flags),
    parameters:   util.getData(util.getDataBody(path.join(configPath, 'Parameters.json')), schemas.parameters),
    tags:         util.getData(util.getDataBody(path.join(configPath, 'Tags.json')), schemas.tags),
    steps:        util.getSteps(util.getStepsBody(path.join(configPath, 'Steps.yaml')), schemas.steps)
  };
}

exports.mergeRegionData = () => {
  debug(`config.mergeRegionData()`);

  exports.merged.users = util.mergeData(exports.default.users, exports.common.users, exports.system.users,
                                        exports.account.users, exports.region.users, [], exports.user.users);
  exports.merged.flags = util.mergeFlags(exports.default.flags, exports.common.flags, exports.system.flags,
                                         exports.account.flags, exports.region.flags, [], exports.user.flags);
}

exports.setCurrentUser = (userName = '') => {
  debug(`config.setCurrentUser(${userName})`);

  if (userName) {
    debug(`- Use user option: ${userName}`);
  }
  else if (exports.program.user) {
    userName = exports.program.user;
    debug(`- Found user option: ${userName}`);
  }

  if (userName) {
    debug(`- Validate user option`);
    const users = exports.merged.users.filter(u => u.Name == userName);
    switch (users.length) {
      case 1:
        debug(`  - Valid user: ${users[0].Name}`);
        exports.current.user = users[0];
        break;
      case 0:
        throw new CommandError(`User '${userName}' not found in Users data array`, errors.OPTION_USER_NOT_FOUND);
      default:
        throw new CommandError(`User '${userName}' duplicates found in Users data array`, errors.OPTION_USER_INVALID);
    }
  }
  else {
    debug(`- Get user default`);
    const defaultUsers = exports.merged.users.filter(u => u.Default == true);
    switch (defaultUsers.length) {
      case 1:
        debug(`  - Default user: ${defaultUsers[0].Name}`);
        exports.current.user = defaultUsers[0];
        break;
      case 0:
        throw new CommandError(`Default user not found in Users data array`, errors.DEFAULT_USER_NOT_FOUND);
      default:
        throw new CommandError(`Default user duplicates found in Users data array`, errors.DEFAULT_USER_INVALID);
    }
  }
}

exports.setCurrentProfile = () => {
  debug(`config.setCurrentProfile()`);

  exports.current.profile = `${exports.current.account.Alias}-${exports.current.user.Name}`; // Enforce profile naming convention
  util.validateAWSProfile(exports.current.profile);
}

exports.setCurrentStack = (stackName = '') => {
  debug(`config.setCurrentStack(${stackName})`);

  if (stackName) {
    debug(`- Use stack-name option: ${stackName}`);
  }
  else if (exports.command.stackName) {
    stackName = exports.command.stackName;
    debug(`- Found stack-name option: ${stackName}`);
  }
  else {
    debug(`- No stack-name option`);
  }

  if (stackName) {
    debug(`- Validate stack-name option`);
    // Nothing to be done here, should already be validated against RegEx by Commander
    // We may eventually have a Stacks data file set, which contains default values about each Stack by name, such as it's Template and Tags
    // which would further reduce the need to specify these on a per-instance basis, since there's a lot of duplication there.
    // If we don't setup a separate Stacks data file set, may want to re-validate against a RegEx, since this value would not be validated
    // by Commander if specified explicitly when calling this function
    debug(`  - Valid stack-name: ${stackName}`);
    exports.current.stack = {
      name: stackName
    };
  }
  else {
    delete exports.current.stack;
  }
}

exports.setCurrentStackTemplate = (templateName = '') => {
  debug(`config.setCurrentStackTemplate(${templateName})`);

  if (templateName) {
    debug(`- Use template-name option: ${templateName}`);
  }
  else if (exports.command.templateName) {
    templateName = exports.command.templateName;
    debug(`- Found template-name option: ${templateName}`);
  }

  if (templateName) {
    debug(`- Validate template-name option`);
    // Nothing to be done here, should already be validated against RegEx by Commander
    // We may eventually have a Stacks data file set, which contains default values about each Stack by name, such as it's Template and Tags
    // which would further reduce the need to specify these on a per-instance basis, since there's a lot of duplication there.
    // If we don't setup a separate Stacks data file set, may want to re-validate against a RegEx, since this value would not be validated
    // by Commander if specified explicitly when calling this function
    debug(`  - Valid template-name: ${templateName}`);

    debug(`- Create stack template configuration`);
    const template = {
      name: templateName,
      path: path.join(exports.current.templates.path, templateName + '.yaml'),
      url: 'https://' + ((exports.current.region.Name == 'us-east-1') ? 's3' : 's3-' + exports.current.region.Name) + '.amazonaws.com/'
                      + exports.current.templates.bucket + '/' + templateName + '.yaml'
    };
    // Eventually may want logic here to obtain the Body from either the Path or the URL
    template.body = util.getTemplateBody(template.path);
    exports.current.stack.template = template;
  }
  else {
    throw new CommandError('--template-name <template> required', errors.OPTION_TEMPLATE_MISSING);
  }
}

exports.loadStackData = () => {
  debug(`config.loadStackData()`);

  if (exports.current.stack) {
    debug(`- Load stack configuration data`);
    exports.stack = {
      flags:        util.getData(util.getDataBody(path.join(exports.current.config.path,
                                                            'Systems', exports.current.system.Name,
                                                            'Accounts', exports.current.account.Name + '[' + exports.current.account.Id + ']',
                                                            'Regions', exports.current.region.Name,
                                                            'Stacks', exports.current.stack.name,
                                                            'Flags.json')), schemas.flags),
      parameters:   util.getParameters(util.getParametersBody(path.join(exports.current.config.path,
                                                                        'Systems', exports.current.system.Name,
                                                                        'Accounts', exports.current.account.Name + '[' + exports.current.account.Id + ']',
                                                                        'Regions', exports.current.region.Name,
                                                                        'Stacks', exports.current.stack.name,
                                                                        'Parameters.json')), schemas.parameters),
      tags:         util.getData(util.getDataBody(path.join(exports.current.config.path,
                                                            'Systems', exports.current.system.Name,
                                                            'Accounts', exports.current.account.Name + '[' + exports.current.account.Id + ']',
                                                            'Regions', exports.current.region.Name,
                                                            'Stacks', exports.current.stack.name,
                                                            'Tags.json')), schemas.tags)
    };
  }
  else {
    debug(`- Clear stack configuration data`);
    exports.stack = {
      flags:      [],
      parameters: [],
      tags:       []
    };
  }
}

exports.extractTemplateData = () => {
  debug(`config.extractTemplateData()`);

  if (exports.current.stack && exports.current.stack.template && exports.current.stack.template.body) {
    debug(`- Extract template configuration data`);
    // At some point, we may want to try extracting any notificationARNs, by adding:
    //  notifications: util.extractTemplateNotificationARNs(exports.current.stack.template.body)
    exports.template = {
      parameters:   util.extractTemplateParameters(exports.current.stack.template.body),
      capabilities: util.extractTemplateCapabilities(exports.current.stack.template.body)
    };
  }
  else {
    debug(`- Clear template configuration data`);
    exports.template = {
      parameters:   [],
      capabilities: []
    };
  }
}

exports.mergeStackFlags = () => {
  debug(`config.mergeStackFlags()`);

  exports.merged.flags      = util.mergeFlags(exports.default.flags, exports.common.flags, exports.system.flags,
                                              exports.account.flags, exports.region.flags, exports.stack.flags,
                                              exports.user.flags);
}

exports.mergeStackData = () => {
  debug(`config.mergeStackData()`);

  exports.merged.flags      = util.mergeFlags(exports.default.flags, exports.common.flags, exports.system.flags,
                                              exports.account.flags, exports.region.flags, exports.stack.flags,
                                              exports.user.flags);
  exports.merged.parameters = util.mergeParameters(exports.template.parameters,
                                                   exports.default.parameters, exports.common.parameters, exports.system.parameters,
                                                   exports.account.parameters, exports.region.parameters, exports.stack.parameters,
                                                   exports.user.parameters, exports.secure.parameters);
  exports.merged.tags       = util.mergeTags(exports.default.tags, exports.common.tags, exports.system.tags,
                                             exports.account.tags, exports.region.tags, exports.stack.tags,
                                             exports.user.tags);
}

exports.setCurrentFlags = (verbose, confirm, prerequisite, lambda, policy, monitor, wait) => {
  debug(`config.setCurrentFlags(${verbose}, ${confirm}, ${prerequisite}, ${lambda}, ${policy}, ${monitor}, ${wait})`);

  exports.current.flags = {};

  if (verbose === true || verbose === false) {
    debug(`- Use verbose flag: ${verbose}`);
  }
  else if (exports.program.verbose === true || exports.program.verbose === false) {
    verbose = exports.program.verbose;
    debug(`- Found verbose flag: ${verbose}`);
  }
  else if (exports.merged.flags.some(f => f.Name == 'verbose')) {
    verbose = exports.merged.flags.filter(f => f.Name == 'verbose')[0].Value;
    debug(`- Get verbose flag: ${verbose}`);
  }
  else {
    throw new CommandError(`Verbose flag not found in Default configuration`, errors.DEFAULT_CONFIGURATION_ERROR);
  }
  exports.current.flags.verbose = verbose;

  if (confirm === true || confirm === false) {
    debug(`- Use confirm flag: ${confirm}`);
  }
  else if (exports.program.confirm === true || exports.program.confirm === false) {
    confirm = exports.program.confirm;
    debug(`- Found confirm flag: ${confirm}`);
  }
  else if (exports.merged.flags.some(f => f.Name == 'confirm')) {
    confirm = exports.merged.flags.filter(f => f.Name == 'confirm')[0].Value;
    debug(`- Get confirm flag: ${confirm}`);
  }
  else {
    throw new CommandError(`Confirm flag not found in Default configuration`, errors.DEFAULT_CONFIGURATION_ERROR);
  }
  exports.current.flags.confirm = confirm;

  if (prerequisite === true || prerequisite === false) {
    debug(`- Use prerequisite flag: ${prerequisite}`);
  }
  else if (exports.command.prerequisite === true || exports.command.prerequisite === false) {
    prerequisite = exports.command.prerequisite;
    debug(`- Found prerequisite flag: ${prerequisite}`);
  }
  else if (exports.merged.flags.some(f => f.Name == 'prerequisite')) {
    prerequisite = exports.merged.flags.filter(f => f.Name == 'prerequisite')[0].Value;
    debug(`- Get prerequisite flag: ${prerequisite}`);
  }
  else {
    throw new CommandError(`Prerequisite flag not found in Default configuration`, errors.DEFAULT_CONFIGURATION_ERROR);
  }
  exports.current.flags.prerequisite = prerequisite;

  if (lambda === true || lambda === false) {
    debug(`- Use lambda flag: ${lambda}`);
  }
  else if (exports.command.lambda === true || exports.command.lambda === false) {
    prerequisite = exports.command.lambda;
    debug(`- Found lambda flag: ${lambda}`);
  }
  else if (exports.merged.flags.some(f => f.Name == 'lambda')) {
    lambda = exports.merged.flags.filter(f => f.Name == 'lambda')[0].Value;
    debug(`- Get lambda flag: ${lambda}`);
  }
  else {
    throw new CommandError(`Lambda flag not found in Default configuration`, errors.DEFAULT_CONFIGURATION_ERROR);
  }
  exports.current.flags.lambda = lambda;

  if (policy === true || policy === false) {
    debug(`- Use policy flag: ${policy}`);
  }
  else if (exports.command.policy === true || exports.command.policy === false) {
    policy = exports.command.policy;
    debug(`- Found policy flag: ${policy}`);
  }
  else if (exports.merged.flags.some(f => f.Name == 'policy')) {
    policy = exports.merged.flags.filter(f => f.Name == 'policy')[0].Value;
    debug(`- Get policy flag: ${policy}`);
  }
  else {
    throw new CommandError(`Policy flag not found in Default configuration`, errors.DEFAULT_CONFIGURATION_ERROR);
  }
  exports.current.flags.policy = policy;

  if (monitor === true || monitor === false) {
    debug(`- Use monitor flag: ${monitor}`);
  }
  else if (exports.command.monitor === true || exports.command.monitor === false) {
    monitor = exports.command.monitor;
    debug(`- Found monitor flag: ${monitor}`);
  }
  else if (exports.merged.flags.some(f => f.Name == 'monitor')) {
    monitor = exports.merged.flags.filter(f => f.Name == 'monitor')[0].Value;
    debug(`- Get monitor flag: ${monitor}`);
  }
  else {
    throw new CommandError(`Monitor flag not found in Default configuration`, errors.DEFAULT_CONFIGURATION_ERROR);
  }
  exports.current.flags.monitor = monitor;

  if (wait === true || wait === false) {
    debug(`- Use wait flag: ${wait}`);
  }
  else if (exports.command.wait === true || exports.command.wait === false) {
    wait = exports.command.wait;
    debug(`- Found wait flag: ${wait}`);
  }
  else if (exports.merged.flags.some(f => f.Name == 'wait')) {
    wait = exports.merged.flags.filter(f => f.Name == 'wait')[0].Value;
    debug(`- Get wait flag: ${wait}`);
  }
  else {
    throw new CommandError(`Wait flag not found in Default configuration`, errors.DEFAULT_CONFIGURATION_ERROR);
  }
  exports.current.flags.wait = wait;
}

exports.setCurrentStackPolicy = () => {
  debug(`config.setCurrentStackPolicy()`);

  if (exports.current.flags.policy) {
    debug(`- Create stack policy configuration`);
    const policy = {
      path: path.join(exports.current.templates.path, exports.current.stack.template.name + '-StackPolicy.json'),
      url: 'https://' + ((exports.current.region.Name == 'us-east-1') ? 's3' : 's3-' + exports.current.region.Name) + '.amazonaws.com/'
                      + exports.current.templates.bucket + '/' + exports.current.stack.template.name + '-StackPolicy.json'
    };
    // Eventually may want logic here to obtain the Body from either the Path or the URL
    policy.body = util.getStackPolicyBody(policy.path)
    exports.current.stack.policy = policy;
  }

  // TODO: If this is used for updates, may also need to set:
  //       - StackPolicyDuringUpdateURL
  //       - StackPolicyDuringUpdateBody
}

exports.setCurrentStackParameters = (parameters = []) => {
  debug(`config.setCurrentStackParameters()`);

  exports.current.stack.parameters = util.mergeCommandParameters(exports.merged.parameters,
                                                                 exports.command.parameters, parameters);
// TODO: Now have all but calculatedParameters, but those aren't known until after Lambda function packages are created and uploaded.
//       This last merge needs to be done inside the createStack command
}

exports.setCurrentStackTags = (tags = []) => {
  debug(`config.setCurrentStackTags()`);

  exports.current.stack.tags = util.mergeCommandTags(exports.merged.tags,
                                                     exports.command.tags, tags);
}

exports.setCurrentStackCapabilities = () => {
  debug(`config.setCurrentStackCapabilities()`);

  exports.current.stack.capabilities = exports.template.capabilities;
}

exports.setCurrentWaitInterval = (waitInterval) => {
  debug(`config.setCurrentWaitInterval(${waitInterval})`);

  if (waitInterval) {
    debug(`- Use wait-interval option: ${waitInterval}`);
  }
  else if (exports.command.waitInterval) {
    waitInterval = exports.command.waitInterval;
    debug(`- Found wait-interval option: ${waitInterval}`);
  }
  else {
    throw new CommandError(`WaitInterval option not found in Default configuration`, errors.DEFAULT_CONFIGURATION_ERROR);
  }
  exports.current.waitInterval = waitInterval;
}

exports.updateStackDetail = (calculatedParameters = []) => {
  debug(`config.updateStackDetail() [Stack: ${exports.current.stack.name}`);

// YOU ARE HERE: Above in initStack, we merged all Parameters from every level except those which must be calculated dynamically
//               This command merges such additional calculatedParameters with the prior merged set.
//               This can only be run within the createStack command itself.

  debug(`- Merge stack configuration parameters and tags`);
  exports.merged.stack.parameters = util.mergeCalculatedParameters(exports.merged.stack.parameters, calculatedParameters);
}

exports.setCurrentPhases = (phases) => {
  debug(`config.setCurrentPhases()`);

  if (phases) {
    debug(`- Use phase option: ${phases}`);
  }
  else if (exports.command.phases) {
    phases = exports.command.phases;
    debug(`- Found phase option: ${phases}`);
  }
  else {
    phases = [];
    debug(`- Default is to create all phases`);
  }
  exports.current.phases = phases;
}

exports.setCurrentSteps = (steps) => {
  debug(`config.setCurrentSteps()`);

  if (steps) {
    debug(`- Use step option: ${steps}`);
  }
  else if (exports.command.steps) {
    steps = exports.command.steps;
    debug(`- Found step option: ${steps}`);
  }
  else {
    steps = [];
    debug(`- Default is to create all steps`);
  }
  exports.current.steps = steps;
}
