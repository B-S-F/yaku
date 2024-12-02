.. SPDX-FileCopyrightText: 2024 grow platform GmbH
..
.. SPDX-License-Identifier: MIT

Python API
==========

This page describes some of the Python utility modules for writing your own
:doc:`custom autopilot app <../../autopilots/python-apps/index>` or a
:doc:`../../autopilots/papsr/index` with :term:`PAPSR`.

.. contents:: Table of Contents
   :depth: 1
   :local:
   :backlinks: none

yaku.autopilot_utils.cli_base
-----------------------------

.. automodule:: yaku.autopilot_utils.cli_base

Module contents
```````````````

.. autofunction:: yaku.autopilot_utils.cli_base.make_autopilot_app

.. autofunction:: yaku.autopilot_utils.cli_base.read_version_from_package

.. autofunction:: ClickUsageErrorHandlerDecorator

yaku.autopilot_utils.subprocess
-------------------------------

.. automodule:: yaku.autopilot_utils.subprocess

.. autofunction:: yaku.autopilot_utils.subprocess.run

.. autoclass:: ProcessResult

Utilities
`````````

.. autoexception:: AutopilotSubprocessFailure

.. autoclass:: OutputMap


yaku.autopilot_utils.results
----------------------------

.. automodule:: yaku.autopilot_utils.results

Module contents
```````````````

.. autodata::  RESULTS

.. autofunction:: DEFAULT_EVALUATOR

.. autoclass:: Output

.. autoclass:: Result

.. autoclass:: ResultsCollector

Test helpers
````````````

.. autofunction:: assert_no_result_status()
.. autofunction:: assert_result_status()

yaku.autopilot_utils.errors
---------------------------

The following classes are used to differentiate between different
error cases.


.. automodule:: yaku.autopilot_utils.errors


.. autoexception:: AutopilotException
.. autoexception:: AutopilotError

.. autoexception:: AutopilotFailure
.. autoexception:: AutopilotConfigurationError
.. autoexception:: EnvironmentVariableError
.. autoexception:: AutopilotFileNotFoundError
.. autoexception:: FileNotFoundError



yaku.autopilot_utils.environment
--------------------------------

.. automodule:: yaku.autopilot_utils.environment

.. autofunction:: require_environment_variable
