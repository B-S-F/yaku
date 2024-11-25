<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Writing a simple fetcher app

You can easily write a custom app for fetching data from some URL.
A first example was already given on the [overview page](../index).

In this tutorial, you will learn how to implement a custom fetcher app
and how to add this app to a {term}`configuration`.

## Prerequisites

Before we can develop a new custom autopilot, we need a playground first so
that we can test the app while it is still under development.

1. Create a new {term}`configuration` in your {term}`namespace`.
2. Delete the existing content and use the following code as content for the
   {file}`qg-config.yaml` file:

   ```{code-block} yaml
   metadata:
     version: v1
   header:
     name: 'My demo'
     version: '0.1'
   autopilots:
     papsr-demo:
       run: |
         papsr my_fetcher.py
         echo '{"status": "YELLOW", "reason": "No evaluation configured yet!"}'
         echo '{"result": {"criterion": "crit", "justification": "just"}}'

   chapters:
     '1':
       title: Dummy title
       requirements:
         '1':
           title: Dummy title
           text: Dummy text
           checks:
             '1':
               title: Run papsr demo autopilot
               automation:
                 autopilot: papsr-demo
   ```

3. Now create a new empty file inside your config. Call it {file}`my_fetcher.py`.
  Copy the following code into the empty file:

   ```{code-block} python
   import click
   from loguru import logger

   class CLI:
       click_help_text = "Fetch data from a URL"
       version = "0.1"
       click_name = "url-fetcher"

       def click_command():
           logger.info(f"Should do something useful!")
   ```

4. Save and run the configuration.
5. The workflow should run through in a few seconds. Open the run's result page.
6. The single check that was configured in our configuration should have a 'yellow'
   status, as we do not have any evaluation configured here. That's fine for now!
7. If you open the autopilot's log panel, you should see the logger line with
   the text "Should do something useful!".

Now you are ready to go!

## Adding a command line argument

You want your fetcher be configurable so that it can fetch data from different
URLs. For this, we need a command line argument.  PAPSR is using [click][click]
for the command line interface setup, so we need to define the command line
argument first.

This is done by adding a `click_setup` attribute to the `CLI` class with a list
of [click][click] options or arguments.

1. Open the file {file}`my_fetcher.py` and modify the class' code by adding a
   line with the `click_setup` attribute:

   ```{code-block} python
   ---
   emphasize-lines: 6
   ---
   # ...
   class CLI:
       click_help_text = "Fetch data from a URL"
       version = "0.1"
       click_name = "url-fetcher"
       click_setup = [click.argument("url", required=True)]
   # ...
   ```

2. This new command line argument must also be added to the `click_command`
   function:

   ```{code-block} python
   ---
   emphasize-lines: 2
   ---
   # ...
       def click_command(url):
           logger.info(f"Should do something useful!")
   # ...
   ```

3. You can now show the passed URL in your logging statement:

   ```{code-block} python
   ---
   emphasize-lines: 3
   ---
   # ...
       def click_command(url):
           logger.info(f"Fetching data from {url}.")
   # ...
   ```

4. Now let's try out your new app. Don't forget to save the file and then run
   the config!

If you open the run log now, you will notice that a failure was
reported, with a reason that there is a _"Missing argument: URL"_.

Of course! We have forgotten to add the URL we want to fetch in our
autopilot script in the config file!

## Adapting the autopilot script

1. Open the {file}`qg-config.yaml` file in the editor again.
2. Modify the line in which our new fetcher is called and add a URL:

   ```{code-block} yaml
   ---
   emphasize-lines: 5
   ---
   # ...
   autopilots:
     papsr-demo:
       run: |
         papsr my_fetcher.py https://www.github.com
         echo '{"status": "FAILED", "reason": "No evaluation configured yet!"}'
   # ...
   ```

3. Run the config again. The log output should now contain the text:
   > INFO | Fetching data from <https://www.github.com>

## Adapting log messages

We don't want to read this log message about fetching data from that URL every
time. We have the URL in the config already, so there is no need to print it in
the normal output.

Let's change the log level of this message so that it is not
printed by default:

1. Open the {file}`my_fetcher.py` file in the editor.
2. Change the `logger.info(...)` command to `logger.debug(...)`.
3. Now run the config again and check if the log message is still printed?
4. It is not!
5. Open the {file}`qg-config.yaml` file in the editor.
6. Modify the line where you are calling the papsr fetcher app:

   ```{code-block} yaml
   # ...
   autopilots:
     papsr-demo:
       run: |
         papsr my_fetcher.py --debug https://www.github.com
   # ...
   ```

7. Run the config again. The log message should be printed again!
8. You can now decide if you want to see debug log messages by adding
   or removing the `--debug` flag to the call of your {file}`my_fetcher.py` app!

## Fetching data from the URL

Now that we have set up the command line interface and the command
function, we can implement the actual fetching part now.

We will be using the [requests][requests] library for accessing the URL.
As this is a third-party library, we need to check first, if this library
is contained in the {doc}`../reference/builtin-libraries`. Luckily, it is!

Let's implement the code:

1. Open the {file}`my_fetcher.py` file in the editor.
2. Add the import of the [requests][requests] library to the top of the file:

   ```{code-block} python
   ---
   emphasize-lines: 2
   ---
   import click
   import requests
   from loguru import logger
   # ...
   ```

3. Now scroll down to the `click_command` function and add the line for
   getting data from the URL and printing it:

   ```{code-block} python
   ---
   emphasize-lines: 4
   ---
   # ...
       def click_command(url):
           logger.debug(f"Fetching data from {url}.")
           print(requests.get(url).text)
   # ...
   ```

4. Run the config again!
5. If you open the logs now of your latest run, there should not only
   be the line with the log message about
   > DEBUG | Fetching data...

   but also a lot of other HTML code which was retrieved from the GitHub website.

## Conclusion

Congratulations! You've done it!

With just a few lines of Python code, you have implemented your first fetcher!
Currently, this fetcher only prints out some data to the console, but
of course you can also write the data to a file or process it first and
then write some aggregated or condensed data to a file.

Go ahead and play with the code. You can for example verify the HTTP response
code before you print out the HTML text. This can be done by accessing the
`status_code` attribute of the `response` object:

```{code-block} python
---
caption: Optional extension of the `click_command` method.
---
response = requests.get(url)
if response.status_code != 200:
  print(f"Something happened: got status code {response.status_code}")
else:
  print(response.text)
```

[click]: <https://click.palletsprojects.com/>
[requests]: <https://requests.readthedocs.io/>
