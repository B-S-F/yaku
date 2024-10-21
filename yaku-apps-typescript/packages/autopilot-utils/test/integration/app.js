import { Command } from 'commander'
import { AppError, AppOutput, AutopilotApp, GetLogger } from '../../dist/index.js'

/*
    * This is a command of the autopilot app.
    * It mirrors a simple evaluator
    * that can return green, red, fail or throw an error.
    * It is used for testing the autopilot app.
*/
const evaluateCommand = new Command('evaluate')
evaluateCommand.description('Evaluator test command.')
evaluateCommand.option('--green', 'Return green status.')
evaluateCommand.option('--red', 'Return red status.')
evaluateCommand.option('--fail', 'Fail the evaluation.')
evaluateCommand.option('--throw', 'Throw an unexpected error.')
evaluateCommand.action((options) => {
  GetLogger().info('Evaluate command called.')
  const appOutput = new AppOutput()
  if (options.green) {
    appOutput.setStatus('GREEN')
    appOutput.setReason('Test reason.')
  } else if (options.red) {
    appOutput.setStatus('RED')
    appOutput.setReason('Test reason.')
  } else if (options.fail) {
    throw new AppError('Test error.')
  } else if (options.throw) {
    throw new Error('Test error.')
  }
  appOutput.write()
})

const fetchCommand = new Command('fetch')
fetchCommand.description('Fetch test command.')
fetchCommand.option('--fail', 'Fail the fetch.')
fetchCommand.option('--throw', 'Throw an unexpected error.')
fetchCommand.action((options) => {
    GetLogger().info('Fetch command called.')
    const appOutput = new AppOutput()
    if (options.fail) {
        throw new AppError('Test error.')
    } else if (options.throw) {
        throw new Error('Test error.')
    }
    appOutput.addOutput({ test: 'test' })
    appOutput.write()
})

const app = new AutopilotApp(
  'app',
  '0.0.1',
  'some description',
  [evaluateCommand, fetchCommand]
)

app.run()