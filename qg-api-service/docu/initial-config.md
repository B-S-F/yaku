# Architecture of the initial config creation

See below architecture document for the involved components and their relationship.

![architecture diagram](initial-config.png)

## Provided features

The initial config creation provides two features that allow to populate an existing Config entity with an initial `qg-config.yaml` file that represents the chapter structure that is provided by the client. Both features are available as endpoints in the `Configs Controller`of the core api service.

1. Endpoint: `initial-config`

   This endpoint provides the functionality to generate an initial config file from a generic
   questionnaire format. The basic structure of the questionnaire is described in this
   [example config](../qg-api-service/src/namespace/configs/testdata/SampleQuestionnaire.yaml).

2. Endpoint: `config-from-excel`

   This endpoint provides the ability to create an initial config out of a standardized excel sheet,
   typically used to manage qg questions in many organizations. Together with the excel sheet, the
   endpoint requires a configuration that maps the relevant columns in the excel sheet to the
   corresponding properties of the chapter structure.

## Basic workflow

See below sequence diagram for the basic workflow of the initial
config file creation for both endpoints. Basic design decision was to provide two services, one
(`Generator Service`) for the creation of the initial config file out of the generic questionnaire
format, the second service (`Excel Transformer Service`) for the transformation of the excel sheet
into the generic questionnaire format. The `Configs Service` orchestrates the creation and stores
the created config file in the existing config, ensuring that nothing is overwritten.

![sequence diagram](initial-config-sequence.png)

## Properties of the initial config file

The initial config file is created for format version `v1` of the `qg-config.yaml` file.
The generic questionnaire format is required to provide the information on chapters and
requirements associated to these chapters. An optional information are a short check
description. Based on this structure the chapters sequence of the config file is created.
If checks are provided, they will be added with the description of the check, if no checks
are available, the generator creates for each requirement exactly one check with a generic
title.

To make the config consistent, each check gets a manual answer section which defines that
the check is an initial check and currently in state `UNANSWERED`. With this addition, the
config is immediately executable and provides in the result the information on the
automation degree of the config. This is 0% in the initial config file.

In addition, the initial config file contains a template `autopilot` and a template `finalize`
section, the `header` and `metadata` section is defined as required by the format.
