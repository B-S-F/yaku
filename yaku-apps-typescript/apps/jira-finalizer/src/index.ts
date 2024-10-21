#!/usr/bin/env node

import { Command } from 'commander'

import addComment from './commands/addComment.js'
import addAttachment from './commands/addAttachment.js'
import updateIssues from './commands/updateIssues.js'

const cli = new Command()

cli.description('API client for JIRA').version('0.0.1')
cli.name('jira')
cli.usage('<arguemnt1> <argument2> ...')

cli
  .command('add-comment')
  .argument('<issueId>', 'Id of the jira issue')
  .argument('<comment>', 'Comment to add to the jira issue')
  .action((issueId, comment) => addComment(issueId, comment))

cli
  .command('add-attachment')
  .argument('<issueId>', 'Id of the jira issue')
  .argument('<filePath>', 'Path to the file')
  .action((issueId, filePath) => addAttachment(issueId, filePath))

cli.command('update-issues').action(() => updateIssues())

cli.parse(process.argv)
