# Yaku-cli

Yaku-cli is a command line tool to use Yaku service.

## Core concepts

### Environment

An environment is a set of configuration that is used to connect to a specific Yaku instance. It includes the following information:
- The URL of the Yaku instance
- The Yaku namespace to trigger runs in.
- The Keycloak realm that is used to authenticate the user

## Installation

Before you can start, you need to install the CLI client first. To do so, follow the steps below:

```bash
unzip yaku-cli-0.39.4.zip
npm install -g ./yaku-cli/grow-yaku-cli-0.39.4.tgz ./yaku-cli/grow-yaku-client-lib-0.39.4.tgz
# Check it works
yaku -V
```

When you have the client installed, you can follow the usage instructions below.

## Configuration

Yaku cli authenticates users using Keycloak. To be able to use the cli, you need to configure it first. You can do so by creating `.yaku-auth` file in your $HOME directory. The file should contain the following information:

```json
{
  "environments": {
      "<yaku instance url>": "<Keycloak realm used for authentication by the instance>"
  },
  "keycloak_server" : "<Keycloak server url>"
}
```

## Usage

### Admin Operations

#### Who can do this?

A user that have the role `ADMIN` of Keycloak client `GLOBAL` can perform admin operations.

#### Login as admin

If you run the followng command:
```bash
yaku login --admin 
```

You will be asked if you want to create a new environment.
 - If you answer `Y`, you will be asked to provide the new environment information:
    - Name of the environment
    - URL of the environment: this is your Yaku api instance URL. e.g. `https://yaku.growpat.com/api/v1`
    - The cli will provide you a device code. If you have the configured `.yaku-auth` file successfully in previous configuration step, a login page will be opened in your default browser. You will be asked to login to the Keycloak realm with the device code that the cli provides you. After successful login, you will be asked to login. Choose to login with the identity provide you have setup in keycloak. 
    - click `yes` to answer the prompt `Do you grant these access privileges?`in your browser.
    After successful login, the cli will save the environment information in the `$HOME/.yakurc` file.
 - If you answer `n`, you will be asked to choose an existing environment to login to.



#### Create namespace
    
```bash
yaku ns create <namespace name> <users>
```

You can't create an empty namespace. You have to add one user at least to be able to create a namespace. 

The user should be a valid user in the Keycloak realm.

### User operations

#### Login

If you run the following command:
```bash
yaku login
```

Then it is similar to the steps in [admin login](#login-as-admin). You will be asked to choose an environment to login to. After choosing an environment, you will be asked to provide your username and password to login to the Keycloak realm.

#### Create and manage configs/runs

To manage configs and runs, check the help of the command `yaku configs --help` and `yaku runs --help`.
You can also check [yaku user docs](https://docs.bswf.tech/cli/index.html)


