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

exports.verbose = (process.env.DXCF_VERBOSE && (process.env.DXCF_VERBOSE == 'true' || process.env.DXCF_VERBOSE == '1')) ? true : false;
exports.confirm = (process.env.DXCF_CONFIRM && (process.env.DXCF_CONFIRM == 'true' || process.env.DXCF_CONFIRM == '1')) ? true : false;
exports.prerequisite = (process.env.DXCF_NOPREREQUISITE && (process.env.DXCF_NOPREREQUISITE == 'true' || process.env.DXCF_NOPREREQUISITE == '1')) ? false : true;
exports.lambda = (process.env.DXCF_NOLAMBDA && (process.env.DXCF_NOLAMBDA == 'true' || process.env.DXCF_NOLAMBDA == '1')) ? false : true;
exports.policy = (process.env.DXCF_NOPOLICY && (process.env.DXCF_NOPOLICY == 'true' || process.env.DXCF_NOPOLICY == '1')) ? false : true;
exports.monitor = (process.env.DXCF_MONITOR && (process.env.DXCF_MONITOR == 'true' || process.env.DXCF_MONITOR == '1')) ? true : false;
exports.wait = (process.env.DXCF_WAIT && (process.env.DXCF_WAIT == 'true' || process.env.DXCF_WAIT == '1')) ? true : false;

exports.templates = process.env.DXCF_TEMPLATES || path.join(home, 'dxcf-templates');
exports.functions = process.env.DXCF_FUNCTIONS || path.join(home, 'dxcf-functions');
exports.scripts = process.env.DXCF_SCRIPTS || path.join(home, 'dxcf-scripts');
exports.config = process.env.DXCF_CONFIG || path.join(home, 'dxcf-configuration');

exports.system = process.env.DXCF_SYSTEM; // Will search for a default in the Systems data file if not set, but better to set via Environment
exports.account = process.env.DXCF_ACCOUNT; // Will search for a default in the Accounts data file if not set, but better to set via Environment
exports.environment = process.env.DXCF_ENVIRONMENT; // Will search for a default in the Accounts data file if not set, but better to set via Environment
exports.region = (process.env.DXCF_REGION) ? process.env.DXCF_REGION : process.env.AWS_DEFAULT_REGION;
exports.user = process.env.DXCF_USER;

debug(`defaults.verbose = ${exports.verbose}`);
debug(`defaults.confirm = ${exports.confirm}`);
debug(`defaults.prerequisite = ${exports.prerequisite}`);
debug(`defaults.lambda = ${exports.lambda}`);
debug(`defaults.policy = ${exports.policy}`);
debug(`defaults.monitor = ${exports.monitor}`);
debug(`defaults.wait = ${exports.wait}`);

debug(`defaults.templates = ${exports.templates}`);
debug(`defaults.functions = ${exports.functions}`);
debug(`defaults.scripts = ${exports.scripts}`);
debug(`defaults.config = ${exports.config}`);

debug(`defaults.system = ${exports.system}`);
debug(`defaults.account = ${exports.account}`);
debug(`defaults.environment = ${exports.environment}`);
debug(`defaults.region = ${exports.region}`);
debug(`defaults.user = ${exports.user}`);
