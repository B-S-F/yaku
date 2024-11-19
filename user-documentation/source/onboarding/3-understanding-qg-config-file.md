<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# The qg-config.yaml File

```{todo}
This file should be written in the form of an Explanation/Tutorial.

Here, we ask the users to open up the qg-config.yaml file from the use case we defined/utilized in the second step and roughly explain, which parts it consists of and which purpose it solves. Also, it's being clarified, how it is related to other files that {{ PRODUCTNAME }} uses.

Evaluate, how some kind of meaningful outcome/result/success could be provided to the user after having reached the bottom of this file.
```

## Creating an initial qg-config.yaml file

The {{ PRODUCTNAME }} service provides two means to generate an initial config file:

- Creating the config out of a generic questionnaire format
- Creating the config out of a specially structured Excel file

### Creating an initial qg-config.yaml file from a generic questionnaire

The following example gives you the basic structure of a generic questionnaire format, that can be used to generate an initial config file:

```yaml
project: Sample Project
version: '1.0'
chapters:
  '1':
    title: Chapter 1
    requirements:
      '1':
        title: Requirement 1.1
        text: Description for requirement 1.1
        checks:
          '1':
            title: Check title 1.1.1
      '2':
        title: >-
          Requirement 1.2
        text: |-
          Description for requirement 1.2
        checks:
          '1':
            title: Check title 1.2.1
          '2':
            title: Check title 1.2.2
  '2':
    title: Chapter 2
    requirements:
      '1':
        title: Requirement 2.1
```

The format requires a structure of chapters with at least one requirement contained in each chapter. Checks are optional.
The idea of this format is, that you can create a transformation for any form of qg question management that creates this
intermediate format and create an initial config to start your automation adventure.

The generator is available in the rest api using the endpoint `/api/v1/namespaces/{namespaceId}/configs/{configId}/initial-config`.
In addition, the `yaku cli` offers the command `make-config` or short `mc` to call the generator with a locally available questionnaire file.

The created config file will have a sample autopilot and a standard finalize section. Each check is implemented by a
manual answer with the status `UNANSWERED`, i.e., you have a complete config with all relevant questions provided. The config
is executable right from the start and the result will show you the degree of automation, which is in the initial case 0%.
Afterwards, you can step by step enhance the config by automating checks. The results allow you to monitor the progress of
the automation by providing you with the information on the automation degree reached.

### Creating an initial qg-config.yaml file from structured Excel sheet

Another way of creating an initial config is the creation from a structured Excel sheet. The requirements on the Excel sheet are:

- Each requirement is defined in one row of the sheet.
- There is a column that identifies for each row, to which chapter it belongs. If the content starts with a number,
  this number is considered as chapter id. If it starts with text, an automated numerical id will be associated to the chapter.
- There is a column that identifies the id of the requirement in the row. This id is used to generate the requirement id in the
  corresponding chapter.
- There is a column which contains the title of the requirement which is used as such
- An optional column may contain some additional descriptions for the requirement. If given, the content will be used for the `text`
  property of the requirement
- If the excel sheet contains a superset of questions with some columns identifying the questions relevant for a certain milestone,
  one of these columns can be given as filter, only rows which contain, e.g., an `x` in this column will be used for generating requirements

To control the generation of the initial config file, the generator needs an additional config that specifies the relevant columns but also
define the rows containing requirements (e.g., such excel sheets typically contain headlines which need to be omitted for the generator) and
the name of the sheet that contains the data. An example config file looks like this:

```yaml
sheet: Sample Criteria
startRow: 2
endRow: 8
columns:
  chapter: A
  id: B
  title: C
  text: H
  filter: K
```

The generator is available using the rest api endpoint `/api/v1/namespaces/{namespaceId}/configs/{configId}/config-from-excel`.
In addition, the `yaku cli` offers the command `excel-config` or short `ec` to call the generator with a locally available excel and config file.
The {{ PRODUCTNAME }} ui offers a nice dialog that allows to upload an excel file and define the described configuration visually.

The generated config file has the same properties as described in the previous section. Because the generator does not identify check
information from the excel file, all requirements will have one generated check with the properties described above.
