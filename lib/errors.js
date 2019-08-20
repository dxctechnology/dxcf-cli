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
exports.OPTION_PARAMETER_INVALID = 15;
exports.OPTION_TAG_INVALID = 17;

exports.OPTION_PHASE_MISSING = 20;
exports.OPTION_PHASE_INVALID = 21;
exports.OPTION_STEP_MISSING = 22;
exports.OPTION_STEP_INVALID = 23;

exports.OPTION_SYSTEM_MISSING = 40; // Can lookup via Default in merged Systems data
exports.OPTION_ACCOUNT_MISSING = 42; // Can lookup via Default in merged Accounts data
exports.OPTION_ENVIRONMENT_MISSING = 44; // Can lookup via Default in merged Environments data
exports.OPTION_REGION_MISSING = 46; // Can lookup via Default in merged Regions data
exports.OPTION_USER_MISSING = 48; // Can lookup via Default in merged Users data

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

exports.OPTION_CONFIG_NOT_FOUND = 90;
exports.OPTION_CONFIG_INVALID = 91;
exports.OPTION_TEMPLATES_NOT_FOUND = 92;
exports.OPTION_TEMPLATES_INVALID = 93;
exports.OPTION_FUNCTIONS_NOT_FOUND = 94;
exports.OPTION_FUNCTIONS_INVALID = 95;
exports.OPTION_SCRIPTS_NOT_FOUND = 96;
exports.OPTION_SCRIPTS_INVALID = 97;

exports.DIRECTORY_NOT_FOUND = 100;
exports.DIRECTORY_INVALID = 101;
exports.FILE_NOT_FOUND = 102;
exports.FILE_INVALID = 103;

exports.SCHEMA_NOT_FOUND = 110;
exports.SCHEMA_INVALID = 111;
exports.DATA_NOT_FOUND = 112;
exports.DATA_INVALID = 113;
exports.PARAMETERS_NOT_FOUND = 114;
exports.PARAMETERS_INVALID = 115;
exports.TAGS_NOT_FOUND = 116;
exports.TAGS_INVALID = 117;

exports.STEPS_NOT_FOUND = 120;
exports.STEPS_INVALID = 121;
exports.PHASES_NOT_FOUND = 122;
exports.PHASES_INVALID = 123;

exports.STACK_NOT_FOUND = 130;
exports.STACK_INVALID = 131;
exports.TEMPLATE_NOT_FOUND = 132;
exports.TEMPLATE_INVALID = 133;
exports.POLICY_NOT_FOUND = 134;
exports.POLICY_INVALID = 135;
exports.FUNCTION_NOT_FOUND = 136;
exports.FUNCTION_INVALID = 137;

exports.DEFAULT_SYSTEM_NOT_FOUND = 180;
exports.DEFAULT_SYSTEM_INVALID = 181;
exports.DEFAULT_ACCOUNT_NOT_FOUND = 182;
exports.DEFAULT_ACCOUNT_INVALID = 183;
exports.DEFAULT_ENVIRONMENT_NOT_FOUND = 184;
exports.DEFAULT_ENVIRONMENT_INVALID = 185;
exports.DEFAULT_REGION_NOT_FOUND = 186;
exports.DEFAULT_REGION_INVALID = 187;
exports.DEFAULT_USER_NOT_FOUND = 188;
exports.DEFAULT_USER_INVALID = 189;

exports.AWS_CONFIG_NOT_FOUND = 200;
exports.AWS_CONFIG_INVALID = 201;
exports.AWS_CREDENTIALS_NOT_FOUND = 202;
exports.AWS_CREDENTIALS_INVALID = 203;
exports.AWS_PROFILE_NOT_FOUND = 204;
exports.AWS_PROFILE_INVALID = 205;
exports.AWS_REGION_NOT_FOUND = 206;
exports.AWS_REGION_INVALID = 207;

exports.COMMAND_INVALID = 240;
exports.DEFAULT_CONFIGURATION_ERROR = 241;

exports.CODE_ERROR = 250;
