# Writing a simple evaluator app

In contrast to the [fetcher app from the tutorial](./write-a-simple-fetcher), an
evaluator needs to generate a proper status and provide results.  These
evaluation results must be provided in a {doc}`special output format
<../../../reference/interfaces/json-lines>`.
The {term}`PAPSR` app provides some useful utility methods which deal with the
correct formatting.

Let's look into the details how we can create a custom evaluator which
verifies the HTTP status code of a web page.

## Prerequisites

Before we can start, we need a playground configuration first, so that we can
test the app while it is still under development.

1. Create a new {term}`configuration` in your {term}`namespace`.
2. Delete the existing content and use the following code as content for the
   {file}`qg-config.yaml` file:

   ```{code-block} yaml
   ---
   caption: qg-config.yaml
   ---
   metadata:
     version: v1
   header:
     name: 'My demo'
     version: '0.1'
   autopilots:
     url-check:
       run: |
         papsr check_url.py

   chapters:
     '1':
       title: Dummy title
       requirements:
         '1':
           title: Dummy title
           text: Dummy text
           checks:
             '1':
               title: Check HTTP status code
               automation:
                 autopilot: url-check
   ```

3. Now create a new empty file inside your config. Call it {file}`check_url.py`.
  Copy the following code into the empty file:

   ```{code-block} python
   ---
   caption: check_url.py
   ---
   import click
   from loguru import logger

   class CLI:
       click_help_text = "Evaluate HTTP status code of a URL"
       version = "0.1"
       click_name = "check_url"

       def click_command():
           logger.info(f"Should do something useful here!")
   ```

4. Save and run the configuration. The workflow should only take a few seconds to run.
5. Open the run result page. The result of the workflow should show a failure, because
   our evaluator did not provide a status of the evaluation.
   That's fine for now! We will implement the actual evaluation in the next steps.
6. If you open the autopilot's log panel, you should see the logger line with
   the text:
   > INFO | Should do something useful here!

Now you are ready to go!

## Adding command line arguments

First we need to define two command line arguments:

1. The URL which we want to check.
2. The expected HTTP status code.

This is done with the help of the [click][click] library for creating command
line applications.

1. Open the file {file}`check_url.py` and modify the class' code by adding a
   `click_setup` attribute with a mandatory argument for the URL and an option
   for the expected status code:

   ```{code-block} python
   ---
   emphasize-lines: 6-9
   ---
   # ...
   class CLI:
       click_help_text = "Fetch data from a URL and verify status code"
       version = "0.1"
       click_name = "url-fetcher"
       click_setup = [
           click.argument("url", required=True),
           click.option("--status", default=200, help="Expected status code"),
       ]
   # ...
   ```

   The first line with the `click.argument("url", ...)` call creates a mandatory
   command line argument for the URL of the website.

   The second line with the `--status` option creates an optional command line
   parameter which can be used to specify the expected HTTP status code. If this
   option is not provided, a default value of 200 will be used.

2. These new command line arguments must also be added to the `click_command`
   method:

   ```{code-block} python
   ---
   emphasize-lines: 2
   ---
   # ...
       def click_command(url, status):
           logger.info(f"Should do something useful!")
   # ...
   ```

3. You can now show the passed URL in your logging statement:

   ```{code-block} python
   ---
   emphasize-lines: 3
   ---
   # ...
       def click_command(url, status):
           logger.info(f"Checking HTTP status for {url}.")
   # ...
   ```

4. Now let's try out your new app. Don't forget to save the file and then run
   the config!

If you open the run log now, you will notice that a failure was
reported, with a reason that there is a _"Missing parameter: url"_.

Of course! We have forgotten to add the URL we want to fetch in our
autopilot script in the config file!

## Adapting the autopilot script

1. Open the {file}`qg-config.yaml` file in the editor again.
2. Modify the line in which our new evaluator is called and add a URL:

   ```{code-block} yaml
   ---
   emphasize-lines: 5
   ---
   # ...
   autopilots:
     url-check:
       run: |
         papsr check_url.py https://www.github.com
   # ...
   ```

3. Run the config again. The check will still fail as it doesn't produce a
   result status yet, but the log output should now contain the text:
   > INFO | Checking HTTP status for <https://www.github.com>

(hint-about-env-var-parameters)=

````{hint}
For the sake of simplicity, we are using a hard-coded URL here. But it is often
useful to put parameters like the URL into environment variables. Those
environment variables can then be defined somewhere else, e.g. in the check from
which the autopilot is called.

```{code-block} yaml
autopilots:
  url-check:
    run: |
      papsr check_url.py ${{ env.URL }}
  #                      ^^^^^^^^^^^^^^ no hard-coded URL here!
# ...
chapters:
  # ...
  checks:
    '1':
      title: Check HTTP code of www.github.com
      automation:
        autopilot: url-check
        env:
          URL: https://www.github.com
    '2':
      title: Check HTTP code of status.github.com
      automation:
        autopilot: url-check
        env:
          URL: https://status.github.com
```

````

## Reading the status code of the website

Although it is not common that an evaluator (in contrast to a fetcher) also fetches
some data, it sometimes makes sense not to fetch data first in one app, and then
evaluate the fetched data in another app.

In our case, we simply want to check the HTTP status code of a website. It doesn't
make much sense to first fetch the status code, store it in a text file, and then
run a second app to check the contents of the text file.

We will do everything together in our evaluator app!

1. Open the {file}`check_url.py` file in the editor.
2. Now add the import of the [requests][requests] library to the top of the file:

   ```{code-block} python
   ---
   emphasize-lines: 2
   ---
   import click
   import requests
   from loguru import logger
   # ...
   ```

3. Jump down to the `click_command` method and add the code for fetching the
   web page and checking the HTTP status code:

   ```{code-block} python
   # ...
       def click_command(url, status):
           logger.info(f"Checking HTTP status for {url}.")
           response = requests.get(url)
           logger.info(f"Got HTTP status code: {response.status_code}")
   # ...
   ```

4. Save your changes and run your config.
5. Check the log output of your autopilot. It should contain a log line with:
   > INFO | Got HTTP status code: 200

## Implementing the check

We have now the status code of the website available in our code. Let's add the
actual check for the _correct_ status code by comparing the received status code
with the expected status code.

We also have to provide the comparison result as an {term}`autopilot result`,
so that {{ PNAME }} can process it correctly.

1. Open the {file}`check_url.py` file in the editor.
2. Add the following import to the top of the file:

   ```{code-block} python
   ---
   emphasize-lines: 4
   ---
   import click
   import requests
   from loguru import logger
   from grow.autopilot_utils.results import DEFAULT_EVALUATOR, RESULTS, Result
   # ...
   ```

3. In the `click_command` method, you can now add the comparison of the received
   HTTP status code with the expected status code:

   ```{code-block} python
   ---
   emphasize-lines: 7-13
   ---
   # ...
       def click_command(url, status):
           logger.info(f"Checking HTTP status for {url}.")
           response = requests.get(url)
           logger.info(f"Got HTTP status code: {response.status_code}")

           criterion = f"URL {url} must respond with status code {status}."
           info = f"Received HTTP status code is: {response.status_code}."
           RESULTS.append(Result(
               criterion=criterion,
               fulfilled=response.status_code == status,
               justification=info,
           ))
   ```

   Take a close look at the line with the `fulfilled` argument: it will be
   `True` if the received status code equals the expected status code, else
   `False`.

   We have now implemented the _collection_ of results, by adding `Result` objects
   to the `RESULTS` list.
4. As next step, we need to add the actual _evaluation_ of results. This means that
   we provide a GREEN, YELLOW, or RED status based on the collected results.
   Luckily, there is a default evaluator available which provides a GREEN status
   if all criteria are fulfilled, and a RED status if any criterion is not fulfilled.

   Add the following line to the `CLI` class:

   ```{code-block} python
   ---
   emphasize-lines: 7
   ---
   # ...
   class CLI:
       # ...
       def click_command(url, status):
           # ...

       click_evaluator_callback = DEFAULT_EVALUATOR
   ```

5. That's it! Now save your changes and run your configuration.
6. Open the result page of your run. The run result should be GREEN now.
   As reason, there should be given:
   > Received HTTP status code is: 200.

Congratulations! You have now implemented a fully functional evaluator
for HTTP status codes of your websites.

## Next steps

If you want, you can now extend your workflow a bit:

* You could create a second check for a second website. Then, try to apply the
  [idea described above](hint-about-env-var-parameters).
* Add the `--status` option to the command line and see what happens, e.g.,
  change the autopilot script to:

  ```bash
  papsr check_url.py --status 201 https://www.github.com
  ```

[click]: <https://click.palletsprojects.com/>
[requests]: <https://requests.readthedocs.io/>
