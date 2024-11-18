# Installation

## Prerequisites

* [NodeJS](https://nodejs.org/en/) >= 18.0.0
* npm >= 8.0.0 (comes with NodeJS)
* Access to our Github packages npm registry: <https://npm.pkg.github.com>

## Login to github package registry

You need to log in to the Github packages npm registry:

```bash
npm login --registry https://npm.pkg.github.com --scope @bosch-grow-pat
```

(You will be prompted for your username and Github access token).

````{warning}
If you are using a npm version >= 9.0.0 you need to use the --auth-type legacy flag.
In order to get your npm version run `npm -v`.

```bash
npm login --registry https://npm.pkg.github.com --scope @bosch-grow-pat --auth-type legacy
```

````

## Install the CLI

The install the CLI globally, run

```bash
npm install -g @bosch-grow-pat/yaku-cli
```

## Verify installation

To check whether the CLI was installed correctly, run

```bash
yaku --version
```

This should print out the current version of the CLI, e.g. `0.18.0`.
