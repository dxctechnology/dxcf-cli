'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('dxcf:cli:defaults');

const gitHubOrganization = process.env.DXCF_GITHUB_ORGANIZATION || 'dxctechnology';
const srcDefaultHome = path.join(os.homedir(), 'src', gitHubOrganization);
const workspacesDefaultHome = path.join(os.homedir(), 'Workspaces', gitHubOrganization);
const defaultHome = (fs.existsSync(srcDefaultHome)) ? srcDefaultHome : workspacesDefaultHome;

const home = (process.env.DXCF_HOME) ? process.env.DXCF_HOME : defaultHome;

const parseBoolean = (value) => {
  const re=/^(t(rue)?|1|on|y(es)?)$/i;
  return re.test(value);
}

// Repository options have a default value.
// But, they can be overridden via the environment or command line.
exports.config = process.env.DXCF_CONFIG || path.join(home, 'dxcf-configuration');
exports.templates = process.env.DXCF_TEMPLATES || path.join(home, 'dxcf-templates');
exports.functions = process.env.DXCF_FUNCTIONS || path.join(home, 'dxcf-functions');
exports.scripts = process.env.DXCF_SCRIPTS || path.join(home, 'dxcf-scripts');

// Selection options are set via merged data, which have default values that can vary on a system, account or region basis.
// But, they can be overridden globally via the environment or command line.
if (process.env.DXCF_SYSTEM) exports.system = process.env.DXCF_SYSTEM;
if (process.env.DXCF_ACCOUNT) exports.account = process.env.DXCF_ACCOUNT;
if (process.env.DXCF_ENVIRONMENT) exports.environment = process.env.DXCF_ENVIRONMENT;
if (process.env.DXCF_REGION) exports.region = process.env.DXCF_REGION;
if (process.env.DXCF_USER) exports.user = process.env.DXCF_USER;

// Switch options are set via merged switches, which have default values that can vary on a system, account, region or stack basis.
// But, they can be overridden globally via the environment or command line.
if (process.env.DXCF_VERBOSE) exports.verbose = parseBoolean(process.env.DXCF_VERBOSE);
if (process.env.DXCF_CONFIRM) exports.confirm = parseBoolean(process.env.DXCF_CONFIRM);
if (process.env.DXCF_PREREQUISITE) exports.prerequisite = parseBoolean(process.env.DXCF_PREREQUISITE);
if (process.env.DXCF_LAMBDA) exports.lambda = parseBoolean(process.env.DXCF_LAMBDA);
if (process.env.DXCF_POLICY) exports.policy = parseBoolean(process.env.DXCF_POLICY);
if (process.env.DXCF_MONITOR) exports.monitor = parseBoolean(process.env.DXCF_MONITOR);
if (process.env.DXCF_WAIT) exports.wait = parseBoolean(process.env.DXCF_WAIT);

// Only show defaults which have been defined
if (exports.config !== undefined) debug(`defaults.config = ${exports.config}`);
if (exports.templates !== undefined) debug(`defaults.templates = ${exports.templates}`);
if (exports.functions !== undefined) debug(`defaults.functions = ${exports.functions}`);
if (exports.scripts !== undefined) debug(`defaults.scripts = ${exports.scripts}`);

if (exports.system !== undefined) debug(`defaults.system = ${exports.system}`);
if (exports.account !== undefined) debug(`defaults.account = ${exports.account}`);
if (exports.environment !== undefined) debug(`defaults.environment = ${exports.environment}`);
if (exports.region !== undefined) debug(`defaults.region = ${exports.region}`);
if (exports.user !== undefined) debug(`defaults.user = ${exports.user}`);

if (exports.verbose !== undefined) debug(`defaults.verbose = ${exports.verbose}`);
if (exports.confirm !== undefined) debug(`defaults.confirm = ${exports.confirm}`);
if (exports.prerequisite !== undefined) debug(`defaults.prerequisite = ${exports.prerequisite}`);
if (exports.lambda !== undefined) debug(`defaults.lambda = ${exports.lambda}`);
if (exports.policy !== undefined) debug(`defaults.policy = ${exports.policy}`);
if (exports.monitor !== undefined) debug(`defaults.monitor = ${exports.monitor}`);
if (exports.wait !== undefined) debug(`defaults.wait = ${exports.wait}`);
