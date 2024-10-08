export type AutopilotPackage = {
  context: string
  fewshotExamples: { input: string; output: string }[]
}

export type Autopilots = {
  [key: string]: AutopilotPackage
}

// ------------ structure of the YAML file ----------------
export type Result = {
  criterion: string
  fulfilled: boolean
  justification: string
}

export type Evaluation = {
  autopilot: string
  status: string
  reason: string
  results: Result[]
  execution: {
    logs: string[]
  }
}

//third level
export type Check = {
  title: string
  status: string
  evaluation: Evaluation
}

//second level
export type Requirement = {
  title: string
  status: string
  check: Check
}

//top level
export type Chapter = {
  title: string
  status: string
  requirement: Requirement
}

export type YAMLData = {
  overallStatus: string
  name: string
  chapter: Chapter
}
///////////////////////////////////////////

export type QGConfig = {
  env?: {
    [key: string]: string
  }
  autopilots: {
    [key: string]: {
      run?: string
      config?: string[]
      env?: {
        [key: string]: string
      }
    }
  }
  chapters: {
    [key: string]: {
      requirements: {
        [key: string]: {
          checks: {
            [key: string]: {
              title: string
              automation?: {
                autopilot: string
                env?: {
                  [key: string]: string
                }
              }
              manual?: {
                status: string
                reason: string
              }
            }
          }
        }
      }
    }
  }
}

export type ParsedQGConfig = {
  title: string
  run: {
    autopilot: string
    script: string
    config?: string[]
    env?: {
      [key: string]: string
    }
  }
}

export type File = {
  filename: string
  content: string | ParsedQGConfig
}
