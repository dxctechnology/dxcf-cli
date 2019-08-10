# DXC Framework CLI
A command line utility for the DXC Framework.

This program is a management utility to build an architecture based on CloudFormation which may
include multiple Systems, running in multiple Accounts, associated with different Environments,
deployed to multiple Regions, with each Region running multiple Stacks, which must be built in a
specific order, broken down into Phases, with coordination across Account boundaries.

The Stacks are build based on a Hierarchical Directory Structure which contains data files
defining Objects such as the Systems, Accounts, Environments, Regions and Stacks mentioned above,
along with JSON-based Stack Parameter Files needed to customize each Stack into the Account and
Region where it is deployed. The CLI has an ability to consolidate and summarize Parameters which
are common across higher levels to reduce repetition and make updates simpler.


### Related Repositories
The DXC Framework consists of a set of related repositories, each containing a subset of the
overall functionality
- **DXCF Framework CLI ([dxcf-cli](https://github.com/dxctechnology/dxcf-cli))** - Contains the CLI
  program written in Node.js 10, that manages the build process, and which will provide various
  utility methods over time to simplify steps of the buid process.
- **DXCF Framework Templates ([dxcf-templates](https://github.com/dxctechnology/dxcf-templates))** -
  Contains the CloudFormation Templates which are built by the CLI. These templates are written in
  YAML, and use the AWS cfn-init method in combination with scripts, in a manner similar to AWS
  Quick Starts, to automate functionality on Instances which can not be accomplished by
  CloudFormation direct. Additionally, Lambda-backed CustomResources are used in many areas to
  extend CloudFormation functionality.
- **DXCF Framework Functions ([dxcf-functions](https://github.com/dxctechnology/dxcf-functions))** -
  Contains the Lambda Functions which are used to extend CloudFormation via CustomResources, or
  implement additional management functionality, such as logic triggered by CloudWatch Events.
- **DXCF Framework Scripts ([dxcf-scripts](https://github.com/dxctechnology/dxcf-scripts))** -
  Contains scripts written in bash or PowerShell to implement various aspects of complex cfn-init
  automation logic, in a manner similar to AWS QuickStarts.
- **DXCF Framework Configuration Example ([dxcf-config](https://github.com/dxctechnology/dxcf-config))** -
  *Because of the sensitive nature of the Configuration data, this is not yet Open Source, but we will
  have an example in place to show structure shortly.*

### Installation
The Installation instructions below for NPM are not yet ready for use, as this project is still in a
relatively early stage of development, at least from the perspective of the CLI program. Please use
the *From Source* variant until we get the CLI into more stable condition.

#### From NPM
```bash
npm install -g dxcf-cli
```

#### From Source
```bash
mkdir -p ~/src/dxctechnology
cd ~/src/dxctechnology
git clone git@github.com:dxctechnology/dxcf-cli.git
cd dxcf-cli
npm install -g .
npm link
```

### Usage (TBD)
```bash
dxcf <command> [sub-command] [options]
```
