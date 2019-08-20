'use strict';

const path = require('path');
const debug = require('debug')('dxcf:cli:schemas');

const util = require(path.join(__dirname, 'util'));

exports.companies    = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Companies.schema.json')));
exports.locations    = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Locations.schema.json')));
exports.applications = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Applications.schema.json')));
exports.components   = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Components.schema.json')));

exports.systems      = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Systems.schema.json')));
exports.accounts     = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Accounts.schema.json')));
exports.environments = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Environments.schema.json')));
exports.regions      = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Regions.schema.json')));
exports.users        = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Users.schema.json')));

exports.flags        = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Flags.schema.json')));
exports.parameters   = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Parameters.schema.json')));
exports.tags         = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Tags.schema.json')));

exports.steps        = util.getSchema(util.getSchemaBody(path.join(__dirname, '..', 'conf', 'Steps.schema.json')));
