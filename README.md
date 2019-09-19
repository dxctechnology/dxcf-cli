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
- **DXCF Framework Configuration Example ([dxcf-configuration](https://github.com/dxctechnology/dxcf-configuration))** -
  Contains the configuration of the DXC Framework as used by an example Prototype System. This data
  uses fake Account Numbers and non-existent email addresses.

### Getting Started
As we're still in the middle of writing this software and testing it, minimal documentation has
been created to date, as we're still not sure how the design may change over time. So, please
pardon the current condition of this documentation. I'll try to give a brief overview of what
we're attempting to build with this framework, meant to be reusable across multiple enterprise
class clients building multi-account AWS implementations.

If you've found this collection of repos and find them interesting, I suggest you review the
code on the latest feature branches until we get the develop branch into a more stable state.
Look in the example dxcf-configuration for the **STEPS.yaml** files under each Account's
Region directory, which shows the order in which the stacks are built, so you can understand
the sequence and dependencies.

This CLI program creates the JSON Parameters file used to create each Stack by walking through
the following levels of configuration files, where the same ParameterKey specified at a more
specific level will override a less specific level - for example, the Production Account SNS
Topic subscriptions are specific to the Production Account, so they might be defined in a
Parameters.json file at the Account level, while the global subscriptions might be defined at
the higher System level, and apply to all other Accounts where these parameters are not overridden.
If that's not clear, please look at the example configuration, as I've tried to show how it works
there.

Last, if you really like this project and want to discuss it, I can be reached at *mike_ AT_mjcsb_com*
(once you fix that email address!)

#### Configuration Objects
Various types of data objects are configured. These are defined as objects in JSON files at various
levels of the configuration. Some of these objects include:

- **Companies**: The Companies which own the Systems.
- **Locations**: The Locations where the Systems are located. This can include AWS Regions or Cities.
- **Applications**: The Applications which together implement the Systems.
- **Components**: The Components which together implement the Applications. Not all Applications
  require this breakdown.
- **Systems**: Systems are the top-most level of configuration, and Consist of Applications deployed
  into one or more AWS Accounts, using one or more AWS Regions, via multiple CloudFormation Stacks.
- **Accounts**: Accounts are used to split up various environments of a System for blast radius
  protection, security boundaries and/or cost allocation.
- **Environments**: Environments define the purpose of an Account, VPC or Application. All Templates
  are generic from the perspective of an Environment, but can be customized to an Environment's
  requirements via Stack Parameters. An Environment is not a specific configuration level, more
  like an overlay. Although the example data has a 1:1 relationship between Accounts and
  Environments, it's possible to configure multiple Environments within a single Account, or use
  multiple Accounts for Applications associated with a single Environment.
- **Regions**: AWS Regions used to deploy Stacks.
- **Users**: AWS IAM Users used to deploy Infrastructure via AWS SDK or AWS CLI commands.
- **Flags**: Binary flags that can change build behavior, such as **verbose** or **confirm**. These
  can be set or overridden at multiple levels, so for example, verbose + confirm is limited to only
  Stacks under development.
- **Parameters**: The Parameters which are used to customize CloudFormation Templates as they are
  built as Stacks within Accounts, Environments and Regions.
- **Tags**: The Tags applied to the Stack, which are then propagated to any Resources created by
  the Stack. CloudFormation Stacks also add per-Resource specific Tags as appropriate.

#### Configuration Levels
As one goal of this framework is to allow for large systems that may consist of many Accounts
working together, deploying into multiple Regions, where Systems are built up of many CloudFormation
Layers to separate functionality by lifecycle, ownership, and security concerns, it attempts to
address the problem of duplicate parameters across dozens, hundreds or thousands of Stacks. It
does this by reading the data objects listed above in a hierarchical order, where an object
defined at higher levels would be used when creating a Stack when that parameter is referenced,
unless the Parameter is re-defined at a lower level. Common parameters can then be summarized
to remove duplication unless needed, so changes are easier to make.

1. **Default**: Initial Defaults for all Objects are contained within the ./conf directory of the
  CLI. The JSON Schemas of each object are also located in this directory.
2. **Common**: Common data appears at the root of of the configuration directory, and applies to
  all Systems.
3. **System**: System data is specific to a single System. This System can be specified via
  the **DXCF_SYSTEM** environment variable, the **--system** CLI parameter, or it can be defined as
  a default within the **Systems.json** data file at the Common configuration level.
4. **Account**: Account data is specific to a single AWS Account. This Account can be specified via
  the **DXCF_ACCOUNT** environment variable, the **--account** CLI parameter, or it can be defined as
  a default within the **Accounts.json** data file at the Common or System configuration levels.
5. **Region**: Region data is specific to a single AWS Region. This Region can be specified via
  the **DXCF_REGION** environment variable, the **--region** CLI parameter, or it can be defined as
  a default within the **Regions.json** data file at the Common, System or Account configuration levels.
6. **Stack**: Stack data is specific to a single CloudFormation Stack. This Stack can only be specified
  via **--stack-name** CLI parameter.
7. **Template**: Template Parameters are contained within the Template itself used to build the Stack,
  and provide the set of Parameters which can be overridden at each of the levels shown above.

Note there is not an **Environment** configuration level - as mentioned above, this is better
thought of as an overlay, where Environment-specific configuration can be defined at multiple
levels as Environments may span multiple Accounts, or multiple may exist within one Account.

#### Environment Variables
As noted above, this Framework consists of multiple repos working together. The CLI has some
built-in defaults for where it will attempt to find the other repos, but these defaults can be
overridden with the following environment variables.

##### Repository Location Variables
Repository Location Variables define the location where the various DXC Framework repos, or
their modified clones, exist on your filesystem.

- **DXCF_HOME**: All repos would normally share the same parent directory, so setting this one
  value is often enough. This defaults to **~/src/dxctechnology** or **~/Workspaces/dxctechnology**.
  If you follow either convention for the parent directory where you clone from GitHub, you do
  not need to set this variable.
- **DXCF_CONFIG**: This variable is usually the only directory environment variable which needs
  to be set. It should point at the root of the directory hierarchy. This defaults to
  **$DXCF_HOME/dxcf-configuration**, which is the example configuration repo. This example repo
  is not usable as-is, and must be cloned and modified to your specific needs.
- **DXCF_TEMPLATES**: This variable does not usually need to be set. This defaults to
  **$DXCF_HOME/dxcf-templates**.
- **DXCF_FUNCTIONS**: This variable does not usually need to be set. This defaults to
  **$DXCF_HOME/dxcf-functions**.
- **DXCF_SCRIPTS**: This variable does not usually need to be set. This defaults to
  **$DXCF_HOME/dxcf-scripts**.

##### Configuration Object Selection Variables
Configuration Object Selection Variables select the Core objects which define the full path
from the root of the configuration hierarchy through each level of configuration where there's
a branch to the configuration needed to create each CloudFormation Stack. As described above,
it's not always necessary to specify these values via the environment or explicitly on the
command-line, as each level can define a default to be used within that level. For example,
the **Systems.json** data file at the Common level could define the *Prototype* System as
the default, then within that System's configuration, the **Accounts.json** data file could
define the **Production** Account as the default, and so on. Therefore, only when not wanting
the default, is it necessary to override.

- **DXCF_SYSTEM**: Explicitly specify the System. Can be overridden by the **--system** option.
- **DXCF_ACCOUNT**: Explicitly specify the Account. Can be overridden by the **--account** option.
- **DXCF_ENVIRONMENT**: Explicitly specify the Environment. Can be overridden by the **--environment** option.
- **DXCF_REGION**: Explicitly specify the Region. Can be overridden by the **--region** option.
- **DXCF_USER**: Explicitly specify the User. Can be overridden by the **--user** option.

##### Option Flags
Option Flags specified on the command-line override options which may be set and overridden at various levels within the configuration hierarchy. Normally, it's better to set flags via a JSON File at the appropriate level, so it only affects that leve and subordinate levels. But, these allow for global override.

- **DXCF_VERBOSE**: Explicitly set the verbose flag. Can be overridden by the **--verbose** option.
  The verbose flag displays commands with all parameters and tags resolved before execution.
- **DXCF_CONFIRM**: Explicitly set the confirm flag. Can be overridden by the **--confirm** option.
  The confirm flag confirms all commands prior to execution.
- **DXCF_PREREQUISITE**: Explicitly set the prerequisite flag. Can be overridden by the
  **--prerequisite** option. The prerequisite flag confirms all Stacks (currently only within the
  same Account) needed for successful creation of the requested Stack exist.
- **DXCF_LAMBDA**: Explicitly set the lambda flag. Can be overridden by the **--lambda** option.
  The lambda flag searches for Lambda functions within the Stack and packages, then uploads
  Lambda Zip Files prior to Stack execution.
- **DXCF_POLICY**: Explicitly set the policy flag. Can be overridden by the **--policy** option.
  The policy flag indicates the Stack contains a Stack Policy which should be supplied at create time.
- **DXCF_MONITOR**: Explicitly set the monitor flag. Can be overridden by the **--monitor** option.
  The monitor flag shows events and resources periodically while waiting for the stack build to complete.
- **DXCF_WAIT**: Explicitly set the wait flag. Can be overridden by the **--wait** option.
  The wait flag waits for the completion of the Stack build. Otherwise, the cli will not wait, allowing
  multiple Stacks to be built in parallel.

#### Phases and Steps
This part is still under active development, and has required a significant amount of changes, which
is why the code may appear a bit stale at the moment. The goal is to provide a way to build complex
Systems consisting of many Stacks which must be built in a particular order, often in Phases to allow
for coordination across Account boundaries, often deployed into multiple Regions. See the **Steps.yaml**
files within each region to see the order in which we plan to build Stacks, and how these sequences
are broken down into phases. More detail here once I get it working.

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

### License

DXCF CLI is [MIT licensed](./LICENSE).
