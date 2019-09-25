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

  // Only display options which have been defined, either as a default set by an environment variable,
  // or explicitly on the command line.
  debug(`- Program: ${options.parent._name.replace(/^[^-]*-/,'')}`);
  debug(`  Options:`);
  if (options.parent.verbose !== undefined) debug(`  --verbose ${(options.parent.verbose) ? '' : 'false'}`);
  if (options.parent.confirm !== undefined) debug(`  --confirm ${(options.parent.confirm) ? '' : 'false'}`);

  if (options.parent.config) debug(`  --config ${options.parent.config}`);
  if (options.parent.templates) debug(`  --templates ${options.parent.templates}`);
  if (options.parent.functions) debug(`  --functions ${options.parent.functions}`);
  if (options.parent.scripts) debug(`  --scripts ${options.parent.scripts}`);

  if (options.parent.system !== undefined) debug(`  --system ${options.parent.system}`);
  if (options.parent.account !== undefined) debug(`  --account ${options.parent.account}`);
  if (options.parent.environment !== undefined) debug(`  --environment ${options.parent.environment}`);
  if (options.parent.region !== undefined) debug(`  --region ${options.parent.region}`);
  if (options.parent.user !== undefined) debug(`  --user ${options.parent.user}`);

  debug(`- Command: ${options._name}`);
  debug(`  Options:`);
  if (options.prerequisite !== undefined) debug(`  --prerequisite ${(options.prerequisite) ? '' : 'false'}`);
  if (options.lambda !== undefined) debug(`  --lambda ${(options.lambda) ? '' : 'false'}`);
  if (options.policy !== undefined) debug(`  --policy ${(options.policy) ? '' : 'false'}`);
  if (options.monitor !== undefined) debug(`  --monitor ${(options.monitor) ? '' : 'false'}`);
  if (options.wait !== undefined) debug(`  --wait ${(options.wait) ? '' : 'false'}`);

  if (options.stackName !== undefined) debug(`  --stack-name ${options.stackName}`);
  if (options.templateName !== undefined) debug(`  --template-name ${options.templateName}`);
  if (options.parameter !== undefined && options.parameter.length > 0) debug(`  --parameter ${options.parameter.map(p => p.ParameterKey + '=' + p.ParameterValue).join(',')}`);
  if (options.tag !== undefined && options.tag.length > 0) debug(`  --tag ${options.tag.map(t => t.Key + '=' + t.Value).join(',')}`);

  if (options.phase !== undefined) debug(`  --phase ${options.phase.join(',')}`);
  if (options.step !== undefined) debug(`  --step ${options.step.join(',')}`);

  if (options.waitInterval !== undefined) debug(`  --wait-interval ${options.waitInterval}`);
}

exports.debugSchemas = (schemas) => {
  debug(`util.debugSchemas()`);

  const spacer = '\n                                        : ';
  debug(`schemas.companies                       : ${JSON.stringify(schemas.companies,    null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.locations                       : ${JSON.stringify(schemas.locations,    null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.applications                    : ${JSON.stringify(schemas.applications, null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.components                      : ${JSON.stringify(schemas.components,   null, 2).replace(/\n/g, spacer)}`);

  debug(`schemas.systems                         : ${JSON.stringify(schemas.systems,      null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.accounts                        : ${JSON.stringify(schemas.accounts,     null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.environments                    : ${JSON.stringify(schemas.environments, null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.regions                         : ${JSON.stringify(schemas.regions,      null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.users                           : ${JSON.stringify(schemas.users,        null, 2).replace(/\n/g, spacer)}`);

  debug(`schemas.flags                           : ${JSON.stringify(schemas.flags,        null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.parameters                      : ${JSON.stringify(schemas.parameters,   null, 2).replace(/\n/g, spacer)}`);
  debug(`schemas.tags                            : ${JSON.stringify(schemas.tags,         null, 2).replace(/\n/g, spacer)}`);

  debug(`schemas.steps                           : ${JSON.stringify(schemas.steps,        null, 2).replace(/\n/g, spacer)}`);
}

exports.debugConfigProgram = (config) => {
  debug(`util.debugConfigProgram()`);

  const spacer = '\n                                        : ';

  if (config.program) {
    debug(`config.program                          : ${JSON.stringify(config.program,    null, 2).replace(/\n/g, spacer)}`);
  }
}

exports.debugConfigCommand = (config) => {
  debug(`util.debugConfigCommand()`);

  const spacer = '\n                                        : ';

  if (config.command) {
    debug(`config.command                          : ${JSON.stringify(config.command,    null, 2).replace(/\n/g, spacer)}`);
  }
}

exports.debugConfigSourceData = (config) => {
  debug(`util.debugConfigSourceData()`);

  const spacer = '\n                                        : ';

  if (config.default) {
    if (config.default.companies && config.default.companies.length > 0) {
      debug(`config.default.companies                : ${JSON.stringify(config.default.companies,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.locations && config.default.locations.length > 0) {
      debug(`config.default.locations                : ${JSON.stringify(config.default.locations,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.applications && config.default.applications.length > 0) {
      debug(`config.default.applications             : ${JSON.stringify(config.default.applications, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.components && config.default.components.length > 0) {
      debug(`config.default.components               : ${JSON.stringify(config.default.components,   null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.default.systems && config.default.systems.length > 0) {
      debug(`config.default.systems                  : ${JSON.stringify(config.default.systems,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.accounts && config.default.accounts.length > 0) {
      debug(`config.default.accounts                 : ${JSON.stringify(config.default.accounts,     null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.environments && config.default.environments.length > 0) {
      debug(`config.default.environments             : ${JSON.stringify(config.default.environments, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.regions && config.default.regions.length > 0) {
      debug(`config.default.regions                  : ${JSON.stringify(config.default.regions,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.users && config.default.users.length > 0) {
      debug(`config.default.users                    : ${JSON.stringify(config.default.users,        null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.default.flags && config.default.flags.length > 0) {
      debug(`config.default.flags                    : ${JSON.stringify(config.default.flags,        null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.parameters && config.default.parameters.length > 0) {
      debug(`config.default.parameters               : ${JSON.stringify(config.default.parameters,   null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.default.tags && config.default.tags.length > 0) {
      debug(`config.default.tags                     : ${JSON.stringify(config.default.tags,         null, 2).replace(/\n/g, spacer)}`);
    }
  }

  if (config.user) {
    if (config.user.companies && config.user.companies.length > 0) {
      debug(`config.user.companies                   : ${JSON.stringify(config.user.companies,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.locations && config.user.locations.length > 0) {
      debug(`config.user.locations                   : ${JSON.stringify(config.user.locations,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.applications && config.user.applications.length > 0) {
      debug(`config.user.applications                : ${JSON.stringify(config.user.applications, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.components && config.user.components.length > 0) {
      debug(`config.user.components                  : ${JSON.stringify(config.user.components,   null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.user.systems && config.user.systems.length > 0) {
      debug(`config.user.systems                     : ${JSON.stringify(config.user.systems,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.accounts && config.user.accounts.length > 0) {
      debug(`config.user.accounts                    : ${JSON.stringify(config.user.accounts,     null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.environments && config.user.environments.length > 0) {
      debug(`config.user.environments                : ${JSON.stringify(config.user.environments, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.regions && config.user.regions.length > 0) {
      debug(`config.user.regions                     : ${JSON.stringify(config.user.regions,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.users && config.user.users.length > 0) {
      debug(`config.user.users                       : ${JSON.stringify(config.user.users,        null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.user.flags && config.user.flags.length > 0) {
      debug(`config.user.flags                       : ${JSON.stringify(config.user.flags,        null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.parameters && config.user.parameters.length > 0) {
      debug(`config.user.parameters                  : ${JSON.stringify(config.user.parameters,   null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.user.tags && config.user.tags.length > 0) {
      debug(`config.user.tags                        : ${JSON.stringify(config.user.tags,         null, 2).replace(/\n/g, spacer)}`);
    }
  }

  if (config.secure) {
    if (config.secure.parameters && config.secure.parameters.length > 0) {
      debug(`config.secure.parameters                : ${JSON.stringify(config.secure.parameters, null, 2).replace(/\n/g, spacer)}`);
    }
  }

  if (config.common) {
    if (config.common.companies && config.common.companies.length > 0) {
      debug(`config.common.companies                 : ${JSON.stringify(config.common.companies,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.locations && config.common.locations.length > 0) {
      debug(`config.common.locations                 : ${JSON.stringify(config.common.locations,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.applications && config.common.applications.length > 0) {
      debug(`config.common.applications              : ${JSON.stringify(config.common.applications, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.components && config.common.components.length > 0) {
      debug(`config.common.components                : ${JSON.stringify(config.common.components,   null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.common.systems && config.common.systems.length > 0) {
      debug(`config.common.systems                   : ${JSON.stringify(config.common.systems,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.accounts && config.common.accounts.length > 0) {
      debug(`config.common.accounts                  : ${JSON.stringify(config.common.accounts,     null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.environments && config.common.environments.length > 0) {
      debug(`config.common.environments              : ${JSON.stringify(config.common.environments, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.regions && config.common.regions.length > 0) {
      debug(`config.common.regions                   : ${JSON.stringify(config.common.regions,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.users && config.common.users.length > 0) {
      debug(`config.common.users                     : ${JSON.stringify(config.common.users,        null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.common.flags && config.common.flags.length > 0) {
      debug(`config.common.flags                     : ${JSON.stringify(config.common.flags,        null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.parameters && config.common.parameters.length > 0) {
      debug(`config.common.parameters                : ${JSON.stringify(config.common.parameters,   null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.common.tags && config.common.tags.length > 0) {
      debug(`config.common.tags                      : ${JSON.stringify(config.common.tags,         null, 2).replace(/\n/g, spacer)}`);
    }
  }

  if (config.system) {
    if (config.system.locations && config.system.locations.length > 0) {
      debug(`config.system.locations                 : ${JSON.stringify(config.system.locations,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.system.applications && config.system.applications.length > 0) {
      debug(`config.system.applications              : ${JSON.stringify(config.system.applications, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.system.components && config.system.components.length > 0) {
      debug(`config.system.components                : ${JSON.stringify(config.system.components,   null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.system.accounts && config.system.accounts.length > 0) {
      debug(`config.system.accounts                  : ${JSON.stringify(config.system.accounts,     null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.system.environments && config.system.environments.length > 0) {
      debug(`config.system.environments              : ${JSON.stringify(config.system.environments, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.system.regions && config.system.regions.length > 0) {
      debug(`config.system.regions                   : ${JSON.stringify(config.system.regions,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.system.users && config.system.users.length > 0) {
      debug(`config.system.users                     : ${JSON.stringify(config.system.users,        null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.system.flags && config.system.flags.length > 0) {
      debug(`config.system.flags                     : ${JSON.stringify(config.system.flags,        null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.system.parameters && config.system.parameters.length > 0) {
      debug(`config.system.parameters                : ${JSON.stringify(config.system.parameters,   null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.system.tags && config.system.tags.length > 0) {
      debug(`config.system.tags                      : ${JSON.stringify(config.system.tags,         null, 2).replace(/\n/g, spacer)}`);
    }
  }

  if (config.account) {
    if (config.account.environments && config.account.environments.length > 0) {
      debug(`config.account.environments             : ${JSON.stringify(config.account.environments, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.account.regions && config.account.regions.length > 0) {
      debug(`config.account.regions                  : ${JSON.stringify(config.account.regions,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.account.users && config.account.users.length > 0) {
      debug(`config.account.users                    : ${JSON.stringify(config.account.users,        null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.account.flags && config.account.flags.length > 0) {
      debug(`config.account.flags                    : ${JSON.stringify(config.account.flags,        null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.account.parameters && config.account.parameters.length > 0) {
      debug(`config.account.parameters               : ${JSON.stringify(config.account.parameters,   null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.account.tags && config.account.tags.length > 0) {
      debug(`config.account.tags                     : ${JSON.stringify(config.account.tags,         null, 2).replace(/\n/g, spacer)}`);
    }
  }

  if (config.region) {
    if (config.region.users && config.region.users.length > 0) {
      debug(`config.region.users                     : ${JSON.stringify(config.region.users,         null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.region.flags && config.region.flags.length > 0) {
      debug(`config.region.flags                     : ${JSON.stringify(config.region.flags,         null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.region.parameters && config.region.parameters.length > 0) {
      debug(`config.region.parameters                : ${JSON.stringify(config.region.parameters,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.region.tags && config.region.tags.length > 0) {
      debug(`config.region.tags                      : ${JSON.stringify(config.region.tags,          null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.region.steps) {
      debug(`config.region.steps                     : ${JSON.stringify(config.region.steps,         null, 2).replace(/\n/g, spacer)}`);
    }
  }

  if (config.stack) {
    if (config.stack.flags && config.stack.flags.length > 0) {
      debug(`config.stack.flags                      : ${JSON.stringify(config.stack.flags,          null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.stack.parameters && config.stack.parameters.length > 0) {
      debug(`config.stack.parameters                 : ${JSON.stringify(config.stack.parameters,     null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.stack.tags && config.stack.tags.length > 0) {
      debug(`config.stack.tags                       : ${JSON.stringify(config.stack.tags,           null, 2).replace(/\n/g, spacer)}`);
    }
  }

  if (config.template) {
    if (config.template.parameters && config.template.parameters.length > 0) {
      debug(`config.template.parameters              : ${JSON.stringify(config.template.parameters,  null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.template.capabilities && config.template.capabilities.length > 0) {
      debug(`config.template.capabilities            : ${JSON.stringify(config.template.capabilities, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.template.layerDependencies && config.template.layerDependencies.length > 0) {
      debug(`config.template.layerDependencies       : ${JSON.stringify(config.template.layerDependencies, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.template.functionDependencies && config.template.functionDependencies.length > 0) {
      debug(`config.template.functionDependencies    : ${JSON.stringify(config.template.functionDependencies, null, 2).replace(/\n/g, spacer)}`);
    }
  }
}

exports.debugConfigMergedData = (config) => {
  debug(`util.debugConfigMergedData()`);

  const spacer = '\n                                        : ';

  if (config.merged) {
    if (config.merged.companies && config.merged.companies.length > 0) {
      debug(`config.merged.companies                 : ${JSON.stringify(config.merged.companies,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.locations && config.merged.locations.length > 0) {
      debug(`config.merged.locations                 : ${JSON.stringify(config.merged.locations,    null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.applications && config.merged.applications.length > 0) {
      debug(`config.merged.applications              : ${JSON.stringify(config.merged.applications, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.components && config.merged.components.length > 0) {
      debug(`config.merged.components                : ${JSON.stringify(config.merged.components,   null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.merged.systems && config.merged.systems.length > 0) {
      debug(`config.merged.systems                   : ${JSON.stringify(config.merged.systems,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.accounts && config.merged.accounts.length > 0) {
      debug(`config.merged.accounts                  : ${JSON.stringify(config.merged.accounts,     null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.environments && config.merged.environments.length > 0) {
      debug(`config.merged.environments              : ${JSON.stringify(config.merged.environments, null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.regions && config.merged.regions.length > 0) {
      debug(`config.merged.regions                   : ${JSON.stringify(config.merged.regions,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.users && config.merged.users.length > 0) {
      debug(`config.merged.users                     : ${JSON.stringify(config.merged.users,        null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.merged.flags && config.merged.flags.length > 0) {
      debug(`config.merged.flags                     : ${JSON.stringify(config.merged.flags,        null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.parameters && config.merged.parameters.length > 0) {
      debug(`config.merged.parameters                : ${JSON.stringify(config.merged.parameters,   null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.merged.tags && config.merged.tags.length > 0) {
      debug(`config.merged.tags                      : ${JSON.stringify(config.merged.tags,         null, 2).replace(/\n/g, spacer)}`);
    }
  }
}

exports.debugConfigCurrent = (config) => {
  debug(`util.debugConfigCurrent()`);

  const spacer = '\n                                        : ';

  if (config.current) {
    debug(`config.current.config                   : ${JSON.stringify(config.current.config,       null, 2).replace(/\n/g, spacer)}`);
    debug(`config.current.templates                : ${JSON.stringify(config.current.templates,    null, 2).replace(/\n/g, spacer)}`);
    debug(`config.current.functions                : ${JSON.stringify(config.current.functions,    null, 2).replace(/\n/g, spacer)}`);
    debug(`config.current.scripts                  : ${JSON.stringify(config.current.scripts,      null, 2).replace(/\n/g, spacer)}`);

    if (config.current.system) {
      debug(`config.current.system                   : ${JSON.stringify(config.current.system,       null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.current.account) {
      debug(`config.current.account                  : ${JSON.stringify(config.current.account,      null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.current.environment) {
      debug(`config.current.environment              : ${JSON.stringify(config.current.environment,  null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.current.region) {
      debug(`config.current.region                   : ${JSON.stringify(config.current.region,       null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.current.user) {
      debug(`config.current.user                     : ${JSON.stringify(config.current.user,         null, 2).replace(/\n/g, spacer)}`);
    }
    if (config.current.profile) {
      debug(`config.current.profile                  : ${config.current.profile}`);
    }

    if (config.current.flags) {
      debug(`config.current.flags                    : ${JSON.stringify(config.current.flags,        null, 2).replace(/\n/g, spacer)}`);
    }

    if (config.current.stack) {
      const stackCopy = clone(config.current.stack);
      if (stackCopy.template && stackCopy.template.body) stackCopy.template.body = '...'; // Too long for display
      if (stackCopy.policy && stackCopy.policy.body) stackCopy.policy.body = '...';       // Too long for display
      debug(`config.current.stack                    : ${JSON.stringify(stackCopy,                   null, 2).replace(/\n/g, spacer)}`);
      /*
      YOU ARE HERE - the setStackDetail function still is not yet setting up Parameters, Tags and Capabilities, so this is a reminder

      if (config.current.stack.parameters) {
        debug(`config.current.stack.parameters         : ${JSON.stringify(config.current.stack.parameters, null, 2).replace(/\n/g, spacer)}`);
      }
      if (config.current.stack.tags) {
        debug(`config.current.stack.tags               : ${JSON.stringify(config.current.stack.tags, null, 2).replace(/\n/g, spacer)}`);
      }
      if (config.current.stack.capabilities) {
        debug(`config.current.stack.capabilities       : ${JSON.stringify(config.current.stack.capabilities, null, 2).replace(/\n/g, spacer)}`);
      }
      */
    }

    if (config.current.waitInterval)
      debug(`config.current.waitInterval             : ${config.current.waitInterval}`);

    if (config.current.phases) {
      debug(`config.current.phases                   : ${config.current.phases.join(',')}`);
    }
    if (config.current.steps) {
      debug(`config.current.steps                    : ${config.current.steps.join(',')}`);
    }
  }
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

  const configRegExp = new RegExp(`(?<=(^|\\n))\\[profile ${profile}\\]`);
  const credentialsRegExp = new RegExp(`(?<=(^|\\n))\\[${profile}\\]`);
  if (configRegExp.test(exports.getAWSConfigBody(path.join(os.homedir(), '.aws', 'config'))) &&
      credentialsRegExp.test(exports.getAWSCredentialsBody(path.join(os.homedir(), '.aws', 'credentials')))) {
    return true;
  }
  else {
    throw new CommandError(`AWS profile ${profile} does not exist in ~/.aws/config and/or ~/.aws/credentials`, errors.AWS_PROFILE_NOT_FOUND);
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

exports.validateConfigDir = (dirPath, level = 'Common') => {
  debug(`util.validateConfigDir(${dirPath}, level)`);

  try {
    fs.statSync(dirPath).isDirectory();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Configuration directory ${dirPath} does not exist`, errors.OPTION_CONFIG_NOT_FOUND);
  }

  let dirName;
  let dir2Name;
  let fileName;

  switch (level) {
    case 'Default':
      fileName = 'Systems.json'
      break;
    case 'User':
      break;
    case 'Common':
      dirName = 'Systems';
      fileName = 'Systems.json'
      break;
    case 'Common':
      dirName = 'Systems';
      fileName = 'Systems.json'
      break;
    case 'System':
      dirName = 'Accounts';
      dir2Name = 'Applications';
      fileName = 'Accounts.json'
      break;
    case 'Account':
      dirName = 'Regions';
      break;
    case 'Region':
      dirName = 'Stacks';
      fileName = 'Steps.yaml'
      break;
    default:
      throw new CommandError(`Configuration level ${level} does not exist`, errors.CODE_ERROR);
  }

  if (dirName) {
    const subDirPath = path.join(dirPath, dirName);

    try {
      fs.statSync(subDirPath).isDirectory();
    }
    catch (err) {
      debug(err);
      throw new CommandError(`Expected configuration directory ${subDirPath} does not exist`, errors.OPTION_CONFIG_INVALID);
    }
  }

  if (dir2Name) {
    const subDir2Path = path.join(dirPath, dir2Name);

    try {
      fs.statSync(subDir2Path).isDirectory();
    }
    catch (err) {
      debug(err);
      throw new CommandError(`Expected configuration directory ${subDir2Path} does not exist`, errors.OPTION_CONFIG_INVALID);
    }
  }

  if (fileName) {
    const filePath = path.join(dirPath, fileName);

    try {
      fs.statSync(filePath).isFile();
    }
    catch (err) {
      debug(err);
      throw new CommandError(`Expected configuration data file ${filePath} does not exist`, errors.OPTION_CONFIG_INVALID);
    }
  }

  return true;
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

  const fileName = 'Override-StackPolicy.json'; // This should be some file we always expect to be present, to serve as a sanity check
  const filePath = path.join(dirPath, fileName);

  try {
    fs.statSync(filePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Expected template file ${filePath} does not exist`, errors.OPTION_TEMPLATES_INVALID);
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

  const fileName = path.join('HostName', 'HostName.js'); // This should be some file we always expect to be present, to serve as a sanity check
  const filePath = path.join(dirPath, fileName);

  try {
    fs.statSync(filePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Expected function file ${filePath} does not exist`, errors.OPTION_FUNCTIONS_INVALID);
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

  const fileName = path.join('Linux', 'configure-hostname'); // This should be some file we always expect to be present, to serve as a sanity check
  const filePath = path.join(dirPath, fileName);

  try {
    fs.statSync(filePath).isFile();
  }
  catch (err) {
    debug(err);
    throw new CommandError(`Expected script file ${filePath} does not exist`, errors.OPTION_SCRIPTS_INVALID);
  }
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
      throw new CommandError(`Data JSON does not match schema (message: ${validate.errors[0].message}; enable DEBUG for more detail)`, errors.DATA_INVALID);
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

exports.upsertFlag = (flags, name, value) => {
  debug(`util.upsertFlag(${name})`);
  const i = flags.findIndex(s => s.Name == name);
  if (i >= 0) {
    debug(`- ${name} (replaced)`);
    flags[i] = { Name: name, Value: value };
  }
  else {
    debug(`- ${name} (added)`);
    flags.push({ Name: name, Value: value });
  }
}

exports.mergeFlags = (defaultFlags, commonFlags, systemFlags,
                      accountFlags, regionFlags, stackFlags,
                      userFlags) => {
  debug(`util.mergeFlags()`);

  let mergedFlags = [];

  debug('- Default');
  for (const flag of defaultFlags) {
    debug(`  - ${flag.Name}`);
    mergedFlags.push({ Name: flag.Name,
                       Value: flag.Value,
                       Source: 'Default' });
  }

  debug('- Common');
  for (const flag of commonFlags) {
    const i = mergedFlags.findIndex(f => f.Name == flag.Name);
    if (i >= 0) {
      debug(`  - ${flag.Name} (replaced)`);
      mergedFlags[i].Value  = flag.Value;
      mergedFlags[i].Source = 'Common';
    }
    else {
      debug(`  - ${flag.Name} (added)`);
      mergedFlags.push({ Name: flag.Name,
                         Value: flag.Value,
                         Source: 'Common' });
    }
  }

  debug('- System');
  for (const flag of systemFlags) {
    const i = mergedFlags.findIndex(f => f.Name == flag.Name);
    if (i >= 0) {
      debug(`  - ${flag.Name} (replaced)`);
      mergedFlags[i].Value  = flag.Value;
      mergedFlags[i].Source = 'System';
    }
    else {
      debug(`  - ${flag.Name} (added)`);
      mergedFlags.push({ Name: flag.Name,
                         Value: flag.Value,
                         Source: 'System' });
    }
  }

  debug('- Account');
  for (const flag of accountFlags) {
    const i = mergedFlags.findIndex(f => f.Name == flag.Name);
    if (i >= 0) {
      debug(`  - ${flag.Name} (replaced)`);
      mergedFlags[i].Value  = flag.Value;
      mergedFlags[i].Source = 'Account';
    }
    else {
      debug(`  - ${flag.Name} (added)`);
      mergedFlags.push({ Name: flag.Name,
                         Value: flag.Value,
                         Source: 'Account' });
    }
  }

  debug('- Region');
  for (const flag of regionFlags) {
    const i = mergedFlags.findIndex(f => f.Name == flag.Name);
    if (i >= 0) {
      debug(`  - ${flag.Name} (replaced)`);
      mergedFlags[i].Value  = flag.Value;
      mergedFlags[i].Source = 'Region';
    }
    else {
      debug(`  - ${flag.Name} (added)`);
      mergedFlags.push({ Name: flag.Name,
                         Value: flag.Value,
                         Source: 'Region' });
    }
  }

  debug('- Stack');
  for (const flag of stackFlags) {
    const i = mergedFlags.findIndex(f => f.Name == flag.Name);
    if (i >= 0) {
      debug(`  - ${flag.Name} (replaced)`);
      mergedFlags[i].Value  = flag.Value;
      mergedFlags[i].Source = 'Stack';
    }
    else {
      debug(`  - ${flag.Name} (added)`);
      mergedFlags.push({ Name: flag.Name,
                         Value: flag.Value,
                         Source: 'Stack' });
    }
  }

  debug('- User');
  for (const flag of userFlags) {
    const i = mergedFlags.findIndex(f => f.Name == flag.Name);
    if (i >= 0) {
      debug(`  - ${flag.Name} (replaced)`);
      mergedFlags[i].Value  = flag.Value;
      mergedFlags[i].Source = 'User';
    }
    else {
      debug(`  - ${flag.Name} (added)`);
      mergedFlags.push({ Name: flag.Name,
                         Value: flag.Value,
                         Source: 'User' });
    }
  }

  return mergedFlags;
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

exports.getTemplate = (templateBody) => {
  debug(`util.getTemplate()`);

  if (/^\s*{/.test(templateBody)) {
    debug(`- template appears to be in JSON format`);
    try {
      return JSON.parse(templateBody);
    }
    catch (err) {
      debug(err);
      throw new CommandError(`Template body could not be parsed as JSON (message: ${err.message})`, errors.TEMPLATE_INVALID, err.code);
    }
  }
  else {
    debug(`- template assumed to be in YAML format`);
    try {
      return yaml.safeLoad(templateBody, { schema: schema });
    }
    catch (err) {
      debug(err);
      throw new CommandError(`Template body could not be parsed as YAML (message: ${err.message})`, errors.SCHEMA_INVALID, err.code);
    }
  }
}

exports.extractTemplateParameters = (template) => {
  debug(`util.extractTemplateParameters()`);

  const templateParameters = template.Parameters;

  if (! templateParameters) {
    debug(`- Template body does not contain a Parameters section`); // Not an error
    return [];
  }

  const parameters = [];
  for (const parameterKey of Object.keys(templateParameters))
    parameters.push({ ParameterKey: parameterKey, ParameterValue: templateParameters[parameterKey].Default });

  return parameters;
}

exports.extractTemplateLambdaLayerDependencies = (template) => {
  debug(`util.extractTemplateLambdaLayerDependencies()`);

  const templateResources = template.Resources;

  if (! templateResources) {
    throw new CommandError(`Template does not contain a Resources section`, errors.INVALID_TEMPLATE);
  }

  let layerDependencies = [];
  for (const logicalId of Object.keys(templateResources)) {
    // This CLI currently does not handle the Serverless Pattern, but that is a likely future enhancement
    // This CLI assumes all Lambda LayerVersion resources conform to these conventions:
    //   - LayerName property must be the actual name, not a reference or import
    //   - LogicalId: ${LayerName}LayerVersion
    //   - Deployment package directory: $DXCF_FUNCTIONS/${LayerName}Layer/
    // - Exceptions will be thrown if these conventions are not followed.
    if (templateResources[logicalId].Type == 'AWS::Lambda::LayerVersion') {
      if (templateResources[logicalId].Properties &&
          templateResources[logicalId].Properties.LayerName &&
          templateResources[logicalId].Properties.Content &&
          templateResources[logicalId].Properties.Content.S3Bucket &&
          templateResources[logicalId].Properties.Content.S3Key) {
        const layerName = templateResources[logicalId].Properties.LayerName;
        const layerNameRegExp = new RegExp(`^[A-Z][a-zA-Z0-9]*$`);
        if (! layerNameRegExp.test(layerName)) {
          throw new CommandError(`Template Resource ${logicalId} has non-compliant LayerName property`, errors.INVALID_TEMPLATE);
        }
        const logicalIdRegExp = new RegExp(`^${layerName}LayerVersion$`);
        if (! logicalIdRegExp.test(logicalId)) {
          throw new CommandError(`Template Resource ${logicalId} invalid: must be ${layerName}LayerVersion`, errors.INVALID_TEMPLATE);
        }
        debug(`- LayerVersion: ${layerName}`);
        layerDependencies.push(layerName);
      }
      else {
        throw new CommandError(`Template Resource ${logicalId} has invalid structure`, errors.INVALID_TEMPLATE);
      }
    }
  }

  return layerDependencies;
}

exports.extractTemplateLambdaFunctionDependencies = (template) => {
  debug(`util.extractTemplateLambdaFunctionDependencies()`);

  const templateResources = template.Resources;

  if (! templateResources) {
    throw new CommandError(`Template does not contain a Resources section`, errors.INVALID_TEMPLATE);
  }

  let functionDependencies = [];
  for (const logicalId of Object.keys(templateResources)) {
    // This CLI currently does not handle the Serverless Pattern, but that is a likely future enhancement
    // This CLI assumes all Lambda Function resources (excluding ZipFile Code) conform to these conventions:
    //   - FunctionName property must be the actual name, not a reference or import
    //   - LogicalId: ${FunctionName}Function
    //   - Deployment package directory: $DXCF_FUNCTIONS/${FunctionName}/
    // - Exceptions will be thrown if these conventions are not followed.
    if (templateResources[logicalId].Type == 'AWS::Lambda::Function') {
      if (templateResources[logicalId].Properties &&
          templateResources[logicalId].Properties.FunctionName &&
          templateResources[logicalId].Properties.Code &&
          (templateResources[logicalId].Properties.Code.ZipFile ||
           (templateResources[logicalId].Properties.Code.S3Bucket &&
            templateResources[logicalId].Properties.Code.S3Key))) {
        if (!templateResources[logicalId].Properties.Code.ZipFile) {
          const functionName = templateResources[logicalId].Properties.FunctionName;
          const functionNameRegExp = new RegExp(`^[A-Z][a-zA-Z0-9]*$`);
          if (! functionNameRegExp.test(functionName)) {
            throw new CommandError(`Template Resource ${logicalId} has non-compliant FunctionName property`, errors.INVALID_TEMPLATE);
          }
          const logicalIdRegExp = new RegExp(`^${functionName}Function$`);
          if (! logicalIdRegExp.test(logicalId)) {
            throw new CommandError(`Template Resource ${logicalId} invalid: must be ${functionName}Function`, errors.INVALID_TEMPLATE);
          }
          debug(`- Function: ${functionName}`);
          functionDependencies.push(functionName);
        }
      }
      else {
        throw new CommandError(`Template Resource ${logicalId} has invalid structure`, errors.INVALID_TEMPLATE);
      }
    }
  }

  return functionDependencies;
}

exports.extractTemplateCapabilities = (template) => {
  debug(`util.extractTemplateCapabilities()`);

  const templateResources = template.Resources;

  if (! templateResources) {
    throw new CommandError(`Template does not contain a Resources section`, errors.INVALID_TEMPLATE);
  }

  let capabilities = [];
  for (const logicalId of Object.keys(templateResources)) {
    if (templateResources[logicalId].Type == 'AWS::IAM::ManagedPolicy' ||
        templateResources[logicalId].Type == 'AWS::IAM::Role' ||
        templateResources[logicalId].Type == 'AWS::IAM::Group' ||
        templateResources[logicalId].Type == 'AWS::IAM::User') {
      debug('- Found IAM resources');
      if (capabilities.length == 0) capabilities = [ 'CAPABILITY_IAM' ];

      if (templateResources[logicalId].Properties &&
          (templateResources[logicalId].Properties.ManagedPolicyName ||
           templateResources[logicalId].Properties.RoleName ||
           templateResources[logicalId].Properties.GroupName ||
           templateResources[logicalId].Properties.UserName)) {
        debug('  - Found IAM named resources');
        return [ 'CAPABILITY_NAMED_IAM' ];
      }
    }
  }

  return capabilities;
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
                           defaultParameters, commonParameters, systemParameters,
                           accountParameters, regionParameters, stackParameters,
                           userParameters, secureParameters) => {
  debug(`util.mergeParameters()`);

  let mergedParameters = [];

  if (templateParameters.length > 0) {
    debug('- Template');
    for (const parameter of templateParameters) {
      debug(`  - ${parameter.ParameterKey}`);
      mergedParameters.push({ ParameterKey: parameter.ParameterKey,
                              ParameterValue: parameter.ParameterValue,
                              ParameterSource: 'Template' });
    }

    debug('- Default');
    for (const parameter of defaultParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'Default';
      }
    }

    debug('- Common');
    for (const parameter of commonParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'Common';
      }
    }

    debug('- System');
    for (const parameter of systemParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'System';
      }
    }

    debug('- Account');
    for (const parameter of accountParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'Account';
      }
    }

    debug('- Region');
    for (const parameter of regionParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'Region';
      }
    }

    debug('- Stack');
    for (const parameter of stackParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'Stack';
      }
    }

    debug('- User');
    for (const parameter of userParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'User';
      }
    }

    debug('- Secure');
    for (const parameter of secureParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'Secure';
      }
    }
  }
  else {
    debug('- No Template Parameters');
  }

  return mergedParameters;
}

exports.mergeCommandParameters = (mergedParameters,
                                  commandParameters, overrideParameters) => {
  debug(`util.mergeCommandParameters()`);

  let mergedCommandParameters = [];

  if (mergedParameters.length > 0) {
    debug('- Merged');
    for (const parameter of mergedParameters) {
      debug(`  - ${parameter.ParameterKey}`);
      mergedCommandParameters.push({ ParameterKey: parameter.ParameterKey,
                                     ParameterValue: parameter.ParameterValue,
                                     ParameterSource: parameter.ParameterSource });
    }

    debug('- Command');
    for (const parameter of commandParameters) {
      const i = mergedCommandParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedCommandParameters[i].ParameterValue = parameter.ParameterValue;
        mergedCommandParameters[i].ParameterSource = 'Command';
      }
    }

    debug('- Override');
    for (const parameter of overrideParameters) {
      const i = mergedCommandParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedCommandParameters[i].ParameterValue = parameter.ParameterValue;
        mergedCommandParameters[i].ParameterSource = 'Override';
      }
    }
  }
  else {
    debug('- No Merged Parameters');
  }

  return mergedCommandParameters;
}

exports.replaceCalculatedParameters = (mergedParameters, calculatedParameters) => {
  debug(`util.replaceCalculatedParameters()`);

  if (mergedParameters.length > 0) {
    debug('- Calculated');
    for (const parameter of calculatedParameters) {
      const i = mergedParameters.findIndex(p => p.ParameterKey == parameter.ParameterKey);
      if (i >= 0) {
        debug(`  - ${parameter.ParameterKey} (replaced)`);
        mergedParameters[i].ParameterValue = parameter.ParameterValue;
        mergedParameters[i].ParameterSource = 'Calculated';
      }
    }
  }
  else {
    debug('- No Merged Parameters');
  }
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

exports.mergeTags = (defaultTags, commonTags, systemTags,
                     accountTags, regionTags, stackTags,
                     userTags) => {
  debug(`util.mergeTags()`);

  let mergedTags = [];

  debug('- Default');
  for (const tag of defaultTags) {
    debug(`  - ${tag.Key}`);
    mergedTags.push({ Key: tag.Key,
                      Value: tag.Value,
                      Source: 'Default' });
  }

  debug('- Common');
  for (const tag of commonTags) {
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      mergedTags[i].Value = tag.Value;
      mergedTags[i].Source = 'Common';
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push({ Key: tag.Key,
                        Value: tag.Value,
                        Source: 'Common' });
    }
  }

  debug('- System');
  for (const tag of systemTags) {
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      mergedTags[i].Value = tag.Value;
      mergedTags[i].Source = 'System';
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push({ Key: tag.Key,
                        Value: tag.Value,
                        Source: 'System' });
    }
  }

  debug('- Account');
  for (const tag of accountTags) {
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      mergedTags[i].Value = tag.Value;
      mergedTags[i].Source = 'Account';
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push({ Key: tag.Key,
                        Value: tag.Value,
                        Source: 'Account' });
    }
  }

  debug('- Region');
  for (const tag of regionTags) {
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      mergedTags[i].Value = tag.Value;
      mergedTags[i].Source = 'Region';
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push({ Key: tag.Key,
                        Value: tag.Value,
                        Source: 'Region' });
    }
  }

  debug('- Stack');
  for (const tag of stackTags) {
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      mergedTags[i].Value = tag.Value;
      mergedTags[i].Source = 'Stack';
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push({ Key: tag.Key,
                        Value: tag.Value,
                        Source: 'Stack' });
    }
  }

  debug('- User');
  for (const tag of userTags) {
    const i = mergedTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      mergedTags[i].Value = tag.Value;
      mergedTags[i].Source = 'User';
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedTags.push({ Key: tag.Key,
                        Value: tag.Value,
                        Source: 'User' });
    }
  }

  return mergedTags;
}

exports.mergeCommandTags = (mergedTags,
                            commandTags, overrideTags) => {
  debug(`util.mergeCommandTags()`);

  let mergedCommandTags = [];

  debug('- Merged');
  for (const tag of mergedTags) {
    debug(`  - ${tag.Key}`);
    mergedCommandTags.push({ Key: tag.Key,
                             Value: tag.Value,
                             Source: tag.Source });
  }

  debug('- Command');
  for (const tag of commandTags) {
    const i = mergedCommandTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      mergedCommandTags[i].Value = tag.Value;
      mergedCommandTags[i].Source = 'Command';
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedCommandTags.push({ Key: tag.Key,
                               Value: tag.Value,
                               Source: 'Command' });
    }
  }

  debug('- Override');
  for (const tag of overrideTags) {
    const i = mergedCommandTags.findIndex(t => t.Key == tag.Key);
    if (i >= 0) {
      debug(`  - ${tag.Key} (replaced)`);
      mergedCommandTags[i].Value = tag.Value;
      mergedCommandTags[i].Source = 'Override';
    }
    else {
      debug(`  - ${tag.Key} (added)`);
      mergedCommandTags.push({ Key: tag.Key,
                               Value: tag.Value,
                               Source: 'Override' });
    }
  }

  return mergedCommandTags;
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

exports.formatCapabilities = (capabilities) => {
  debug(`util.formatCapabilities()`);

  let formattedCapabilities = '';

  for (const capability of capabilities) {
    formattedCapabilities += `--capabilities ${capability} \\\n`;
  }

  return chalk.keyword('blue')(formattedCapabilities);
}

exports.createDeploymentPackage = (config, name) => {
  debug(`util.createDeploymentPackage(${name})`);

  const functionFolderPath = path.join(config.current.functions.path, name);
  const zipFilePath = path.join(config.current.functions.path, name + '.zip');

  debug(`- Folder: ${functionFolderPath}`);
  debug(`- Zip File: ${zipFilePath}`);

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
        throw new CommandError(`Deployment package file ${zipFilePath} exists but could not be deleted`, errors.FUNCTION_INVALID);
      throw new CommandError(`Deployment package file ${zipFilePath} deletion error (message: ${err.message})`, errors.FUNCTION_INVALID, err.code);
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
    throw new CommandError(`Deployment package file ${zipFilePath} creation error (message: ${err.message})`, errors.FUNCTION_INVALID, err.code);
  }

  try {
    return fs.readFileSync(zipFilePath); // Binary data, no encoding
  }
  catch (err) {
    debug(err);
    if (err.code == 'ENOENT')
      throw new CommandError(`Deployment package file ${zipFilePath} does not exist`, errors.FUNCTION_NOT_FOUND);
    if (err.code == 'EACCES')
      throw new CommandError(`Deployment package file ${zipFilePath} exists but could not be read`, errors.FUNCTION_INVALID);
    throw new CommandError(`Deployment package file ${zipFilePath} error (message: ${err.message})`, errors.FUNCTION_INVALID, err.code);
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
