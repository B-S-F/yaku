# Evaluator Background Information

An evaluator to check the response returned by the "ado-work-items-fetcher", according to the rules defined in a custom .yaml file.

## Environment variables

The Ado evaluator uses the same environment variables as the Ado fetcher:

* {envvar}`ADO_WORK_ITEMS_JSON_NAME` - references the output file name of the Ado fetcher.

* {envvar}`ADO_CONFIG_FILE_PATH` - see below for more information about the config file.

## The evaluator's config file

A yaml file with the following structure should be created in the location referenced by the {envvar}`ADO_CONFIG_FILE_PATH` environment variable. Here, you can define the rules that are being considered for the evaluation of the fetched files. If all files pass all checks, a `GREEN` status will be returned. Otherwise, the status will be `RED` and you can find information on which file didn't match which condition in the report.

```{note}
This config files is used to configure the Azure work items fetcher and evaluator. For having a better understanding of the first part of the config, also check out: {doc}`ado-fetcher-reference`.
```

The file has the following structure:

```{literalinclude} resources/evaluator-config.yaml
---
language: yaml
---
```

## Condition types

There are three different validators (condition types) that you can use for your rules: _expected_, _illegal_ and _resolved_. Learn more on how they work:

**`expected:`**

* throw an error if any of the issues DOES NOT have one of the enumerated values
* Report:
  * OK: All work items have one of the expected values: [expected]
  * NOK:
    * "The following work items are invalid because they don't have one of the expected values ( [expected] ):"
    * list of all invalid work items.

**`illegal:`**

* throw an error if any of the issues DOES have one of the given values
* Report:
  * OK: None of the work items have one of these illegal values: [illegal]
  * NOK:
    * “The following work items are invalid because they have one of the illegal values ( [illegal] ):”
    * list of all invalid work items.

**`resolved:`**

* throw an error if any of the issues DOES NOT have one of the given values AND if the due date field's value, referenced by the property `dueDateFieldName`, is either in the past, or is not set.
* Report:
  * OK: “All work items have one of these resolved values: [resolved]” (In this case they can also be overdue.)
  * NOK:
    * "Some work items are invalid because they don't have one of the resolved values ( [resolved] )"
      * “The following work items are overdue:“
        * list invalid work items
      * The following work items don't have a due date:"
        * list invalid work items

To learn more about the query field of the yaml file, please check: {doc}`ado-fetcher-reference`.

## Default List

The `default fields list` is:

* Id
* Url
* State
* Title

Those properties can be used without specifying them in the needed fields attribute.

## Currently accepted tags

In the current implementation, there are a few tags that can be used:

* `workItems`
  * **query** - the WIQL query used by the fetcher
  * **neededFields** - the list of fields that will be added to `workitems.json` after the query
  * **evaluate** - the actual checks and additional information
* `workItems.evaluate`
  * **settings** - elements that can be used inside any check
  * **checks** - the actual checks that are going to be done
* `workItems.children`
  * **get** - if true, the children of the workitem will also be checked
  * **evaluate** - the actual checks and additional information
* `workItems.evaluate.settings`
  * **dueDateFieldName** - 'expiration' date of the work item
  * **closedStates** - some checks are done only if the workitems are not closed. This is a list of values a workitem can take to be considered closed. If it is not specified, the default list will contain the value 'Closed'.
* `workItems.evaluate.checks`
  * **dataExists** - if true, checks if any workitem has been returned
  * **cycleInDays** - an integer representing the number of days until a workitem becomes 'stale' (for example, a review could be done once every 30 days)
  * **fields** - a list of fields to be checked
* `workItems.evaluate.checks.fields.<fieldTag>`
  * **fieldName** - the name of the field. This must be one of the defined `neededFields` or one of the fields from the default fields list.
  * **closedAfterDate** - if specified, the check will only apply to workitems closed after this date
  * **conditions** - a list of [conditions](#condition-types), a workitem with this field will be checked against.

## Example Config

You can find a complete example configuration in {doc}`../tutorials/ado-fetcher-evaluator-tutorial` .
