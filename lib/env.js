'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('dxcf:cli:env');

const gitHubOrganization = process.env.DXCF_GITHUB_ORGANIZATION || 'dxctechnology';

exports.VERBOSE = (process.env.DXCF_VERBOSE && (process.env.DXCF_VERBOSE == 'true' || process.env.DXCF_VERBOSE == '1')) ? true : false;
exports.CONFIRM = (process.env.DXCF_CONFIRM && (process.env.DXCF_CONFIRM == 'true' || process.env.DXCF_CONFIRM == '1')) ? true : false;
exports.PREREQUISITE = (process.env.DXCF_NOPREREQUISITE && (process.env.DXCF_NOPREREQUISITE == 'true' || process.env.DXCF_NOPREREQUISITE == '1')) ? false : true;
exports.LAMBDA = (process.env.DXCF_NOLAMBDA && (process.env.DXCF_NOLAMBDA == 'true' || process.env.DXCF_NOLAMBDA == '1')) ? false : true;
exports.MONITOR = (process.env.DXCF_MONITOR && (process.env.DXCF_MONITOR == 'true' || process.env.DXCF_MONITOR == '1')) ? true : false;
exports.WAIT = (process.env.DXCF_WAIT && (process.env.DXCF_WAIT == 'true' || process.env.DXCF_WAIT == '1')) ? true : false;

if (process.env.DXCF_HOME) {
  exports.HOME = process.env.DXCF_HOME;
}
else if (fs.existsSync(path.join(os.homedir(), 'Workspaces', gitHubOrganization))) {
  exports.HOME = path.join(os.homedir(), 'Workspaces', gitHubOrganization);
}
else {
  exports.HOME = path.join(os.homedir(), 'src', gitHubOrganization);
}

exports.TEMPLATES = process.env.DXCF_TEMPLATES || path.join(exports.HOME, 'dxcf-templates');
exports.FUNCTIONS = process.env.DXCF_FUNCTIONS || path.join(exports.HOME, 'dxcf-functions');
exports.SCRIPTS = process.env.DXCF_SCRIPTS || path.join(exports.HOME, 'dxcf-scripts');
exports.CONFIG = process.env.DXCF_CONFIG || path.join(exports.HOME, 'dxcf-configuration');

exports.OWNER = process.env.DXCF_OWNER; // Fallback to DXCF_USER when not specified
exports.COMPANY = process.env.DXCF_COMPANY;
exports.SYSTEM = process.env.DXCF_SYSTEM; // Highly recommended this be set in the environment
exports.LOCATION = process.env.DXCF_LOCATION; // Fallback to DXCF_REGION when not specified
exports.ENVIRONMENT = process.env.DXCF_ENVIRONMENT || 'Production';
exports.REGION = process.env.DXCF_REGION;
exports.ACCOUNT = process.env.DXCF_ACCOUNT;
exports.USER = process.env.DXCF_USER;

debug(`env.VERBOSE = ${exports.VERBOSE}`);
debug(`env.CONFIRM = ${exports.CONFIRM}`);
debug(`env.PREREQUISITE = ${exports.PREREQUISITE}`);
debug(`env.LAMBDA = ${exports.LAMBDA}`);
debug(`env.MONITOR = ${exports.MONITOR}`);
debug(`env.WAIT = ${exports.WAIT}`);

debug(`env.HOME = ${exports.HOME}`);
debug(`env.TEMPLATES = ${exports.TEMPLATES}`);
debug(`env.FUNCTIONS = ${exports.FUNCTIONS}`);
debug(`env.SCRIPTS = ${exports.SCRIPTS}`);
debug(`env.CONFIG = ${exports.CONFIG}`);

debug(`env.OWNER = ${exports.OWNER}`);
debug(`env.COMPANY = ${exports.COMPANY}`);
debug(`env.SYSTEM = ${exports.SYSTEM}`);
debug(`env.LOCATION = ${exports.LOCATION}`);
debug(`env.ENVIRONMENT = ${exports.ENVIRONMENT}`);
debug(`env.REGION = ${exports.REGION}`);
debug(`env.ACCOUNT = ${exports.ACCOUNT}`);
debug(`env.USER = ${exports.USER}`);
