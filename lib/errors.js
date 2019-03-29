'use strict';

exports.CommandError = class CommandError extends Error {
  constructor (obj, exitCode = 1, code) {
    if (obj instanceof Error) { // Error sent as first parameter
      super(obj.message);
      this.code = obj.code;
      if (code) this.code = code; // Only override if set
    }
    else if (typeof obj == "string") { // Error message sent as first parameter
      super(obj);
      this.code = code;
    }
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    this.exitCode = exitCode;
  }
};

exports.UNKNOWN = 1;

exports.STACK_EXISTS = 2;
exports.STACK_FAILED = 3;

exports.OPTION_STACK_MISSING = 10;
exports.OPTION_TEMPLATE_MISSING = 12;

exports.OPTION_SYSTEM_MISSING = 40; // Can lookup via Default in Systems data file
exports.OPTION_ACCOUNT_MISSING = 42; // Can lookup via Default in Accounts data file
exports.OPTION_ENVIRONMENT_MISSING = 44; // Can lookup via Default in Environments data file
exports.OPTION_REGION_MISSING = 46;
exports.OPTION_USER_MISSING = 48;

exports.OPTION_SYSTEM_NOT_FOUND = 50;
exports.OPTION_SYSTEM_INVALID = 51;
exports.OPTION_ACCOUNT_NOT_FOUND = 52;
exports.OPTION_ACCOUNT_INVALID = 53;
exports.OPTION_ENVIRONMENT_NOT_FOUND = 54;
exports.OPTION_ENVIRONMENT_INVALID = 55;
exports.OPTION_REGION_NOT_FOUND = 56;
exports.OPTION_REGION_INVALID = 57;
exports.OPTION_USER_NOT_FOUND = 58;
exports.OPTION_USER_INVALID = 59;

exports.OPTION_TEMPLATES_NOT_FOUND = 100;
exports.OPTION_TEMPLATES_INVALID = 101;
exports.OPTION_FUNCTIONS_NOT_FOUND = 102;
exports.OPTION_FUNCTIONS_INVALID = 103;
exports.OPTION_SCRIPTS_NOT_FOUND = 104;
exports.OPTION_SCRIPTS_INVALID = 105;
exports.OPTION_CONFIG_NOT_FOUND = 106;
exports.OPTION_CONFIG_INVALID = 107;

exports.SCHEMA_NOT_FOUND = 120;
exports.SCHEMA_INVALID = 121;
exports.DATA_NOT_FOUND = 122;
exports.DATA_INVALID = 123;

exports.STACK_NOT_FOUND = 130;
exports.STACK_INVALID = 131;
exports.TEMPLATE_NOT_FOUND = 132;
exports.TEMPLATE_INVALID = 133;
exports.POLICY_NOT_FOUND = 134;
exports.POLICY_INVALID = 135;
exports.FUNCTION_NOT_FOUND = 136;
exports.FUNCTION_INVALID = 137;

exports.PARAMETERS_NOT_FOUND = 140;
exports.PARAMETERS_INVALID = 141;
exports.TAGS_NOT_FOUND = 142;
exports.TAGS_INVALID = 143;

exports.DEFAULT_SYSTEM_NOT_FOUND = 150;
exports.DEFAULT_SYSTEM_INVALID = 151;
exports.DEFAULT_ACCOUNT_NOT_FOUND = 152;
exports.DEFAULT_ACCOUNT_INVALID = 153;
exports.DEFAULT_ENVIRONMENT_NOT_FOUND = 154;
exports.DEFAULT_ENVIRONMENT_INVALID = 155;
exports.DEFAULT_REGION_NOT_FOUND = 156;
exports.DEFAULT_REGION_INVALID = 157;
exports.DEFAULT_USER_NOT_FOUND = 158;
exports.DEFAULT_USER_INVALID = 159;

exports.AWS_CONFIG_NOT_FOUND = 200;
exports.AWS_CONFIG_INVALID = 201;
exports.AWS_CREDENTIALS_NOT_FOUND = 202;
exports.AWS_CREDENTIALS_INVALID = 203;
exports.AWS_PROFILE_NOT_FOUND = 204;
exports.AWS_PROFILE_INVALID = 205;
exports.AWS_REGION_NOT_FOUND = 206;
exports.AWS_REGION_INVALID = 207;

exports.COMMAND_INVALID = 240;
