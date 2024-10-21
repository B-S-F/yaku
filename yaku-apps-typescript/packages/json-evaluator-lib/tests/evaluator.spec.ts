import { describe, it, expect, vi } from 'vitest'

import { evalCheck, evalConcatenation } from '../src/evaluate.js'
import { Status } from '../src/types'

describe('evalCheck', () => {
  it('should ignore empty filtered data', () => {
    const condition = '$.length === 0'
    const reference = '$[?(@.a==2)]'
    const data = [{ a: 1 }, { a: 1 }]
    const options = {}

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
  })

  it('should evaluate condition and return true status', () => {
    const condition = '($[*]).length === 3'
    const reference = '$.foo'
    const data = { foo: [1, 2, 3] }
    const options = {
      true: 'GREEN' as Status,
    }
    const expectedResult = [
      {
        reasons: [[1, 2, 3]],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(true)
    expect(result.status).toEqual('GREEN')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should evaluate condition and return false status', () => {
    const condition = '($[*]).includes(4)'
    const reference = '$.foo'
    const data = { foo: [1, 2, 3] }
    const options = {
      false: 'YELLOW' as Status,
    }
    const expectedResult = [
      {
        reasons: [[1, 2, 3]],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should evaluate all function and return true status', () => {
    const condition = 'all(ref, "($) === true")'
    const reference = '$.foo[*]'
    const data = { foo: [true, true, true] }
    const options = {
      true: 'GREEN' as Status,
      log: '$',
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(true)
    expect(result.status).toEqual('GREEN')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should evaluate all function and return false status with reasons', () => {
    const condition = 'all(ref, "($) < 5")'
    const reference = '$.foo[*]'
    const data = { foo: [1, 2, 6, 4] }
    const options = {
      false: 'RED' as Status,
      log: '$',
    }
    const expectedResult = [
      {
        reasons: [6],
        context: undefined,
      },
    ]

    vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', 'true')
    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return GREEN when ref is not found and return_if_not_found is set to GREEN', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch")`
    const reference = '$.otherExample[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'GREEN' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('GREEN')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return YELLOW when ref is not found and return_if_not_found is set to YELLOW', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch")`
    const reference = '$.otherExample[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'YELLOW' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return RED when ref is not found and return_if_not_found is set to RED', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch")`
    const reference = '$.otherExample[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'RED' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return GREEN when condition is not found and return_if_not_found is set to GREEN', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch_name")`
    const reference = '$.example[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'GREEN' as Status,
    }
    const expectedResult = [
      {
        reasons: [],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('GREEN')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return YELLOW when condition is not found and return_if_not_found is set to YELLOW', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch_name")`
    const reference = '$.example[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'YELLOW' as Status,
    }
    const expectedResult = [
      {
        reasons: [],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return RED when condition is not found and return_if_not_found is set to RED', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch_name")`
    const reference = '$.example[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'RED' as Status,
      return_if_not_found: 'RED' as Status,
    }
    const expectedResult = [
      {
        reasons: [],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return RED when ref is not found and return_if_not_found is not set', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch")`
    const reference = '$.otherExample[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'GREEN' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return RED when condition is not found and return_if_not_found is not set', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch_name")`
    const reference = '$.example[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'RED' as Status,
    }
    const expectedResult = [
      {
        reasons: [],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return GREEN when ref is found, but empty and return_if_empty is set to GREEN', () => {
    const condition = 'all(ref, "5 < $.total_commits")'
    const reference = '$.stats'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: 'John',
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_empty: 'GREEN' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('GREEN')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return YELLOW when ref is found, but empty and return_if_empty is set to YELLOW', () => {
    const condition = 'all(ref, "5 < $.total_commits")'
    const reference = '$.stats'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: 'John',
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_empty: 'YELLOW' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return RED when ref is found, but empty and return_if_empty is set to RED', () => {
    const condition = 'all(ref, "5 < $.total_commits")'
    const reference = '$.stats'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: 'John',
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_empty: 'RED' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return GREEN when condition is found, but empty and return_if_empty is set to GREEN', () => {
    const condition = `all(ref, "'John' === $.name")`
    const reference = '$.example[*].contributors[*]'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: {},
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_empty: 'GREEN' as Status,
    }
    const expectedResult = [
      {
        reasons: [{}],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('GREEN')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return YELLOW when condition is found, but empty and return_if_empty is set to YELLOW', () => {
    const condition = `all(ref, "'John' === $.name")`
    const reference = '$.example[*].contributors[*]'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: {},
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_empty: 'YELLOW' as Status,
    }
    const expectedResult = [
      {
        reasons: [{}],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return RED when condition is found, but empty and return_if_empty is set to RED', () => {
    const condition = `all(ref, "'John' === $.name")`
    const reference = '$.example[*].contributors[*]'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: {},
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_empty: 'RED' as Status,
    }
    const expectedResult = [
      {
        reasons: [{}],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')

    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return GREEN when condition is found, but once empty and once correct and return_if_empty is set to RED', () => {
    const condition = `all(ref, "'John' === $.name")`
    const reference = '$.example[*].contributors[*]'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: 'John',
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_empty: 'RED' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(true)
    expect(result.status).toEqual('GREEN')

    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return RED when ref is found, but empty and return_if_empty is not set', () => {
    const condition = 'all(ref, "5 < $.total_commits")'
    const reference = '$.stats'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: 'John',
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return RED when condition is found, but empty and return_if_empty is not set', () => {
    const condition = `all(ref, "'John' === $.name")`
    const reference = '$.example[*].contributors[*]'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: {},
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
    }
    const expectedResult = [
      {
        reasons: [{}],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('RED')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should pick return_if_not_found when both set and the ref is not found', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch")`
    const reference = '$.otherExample[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'YELLOW' as Status,
      return_if_empty: 'GREEN' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should pick return_if_not_found when both set and the condition is not found', () => {
    const condition = `all(ref, "'EXAMPLE_BRANCH' === $.branch_name")`
    const reference = '$.example[*]'
    const data = {
      example: [
        {
          branch_name: 'EXAMPLE_BRANCH',
          state: 'OPEN',
        },

        {
          branch_id: 1,
          state: 'OPEN',
        },
      ],
      example1: [],
    }
    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'YELLOW' as Status,
      return_if_empty: 'GREEN' as Status,
    }
    const expectedResult = [
      {
        reasons: [],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should pick return_if_empty when both set and the ref exists, but it is empty', () => {
    const condition = 'all(ref, "5 < $.total_commits")'
    const reference = '$.stats'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: 'John',
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'GREEN' as Status,
      return_if_empty: 'YELLOW' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should pick return_if_empty when both set and the condition exists, but it is empty', () => {
    const condition = `all(ref, "'John' === $.name")`
    const reference = '$.example[*].contributors[*]'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: {},
              age: 25,
            },
          ],
        },
      ],
      stats: [],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'GREEN' as Status,
      return_if_empty: 'YELLOW' as Status,
    }
    const expectedResult = [
      {
        reasons: [{}],
        context: undefined,
      },
    ]

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(false)
    expect(result.status).toEqual('YELLOW')
    expect(result.reasonPackages).toEqual(expectedResult)
  })

  it('should return GREEN when both variables do no influence the result', () => {
    const condition = `all(ref, "12 == $.objects")`
    const reference = '$.stats[*]'
    const data = {
      example: [
        {
          branch: 'EXAMPLE_BRANCH',
          state: 'OPEN',
          contributors: [],
        },
        {
          branch: 'OTHER_BRANCH',
          state: 'CLOSED',
          contributors: [
            {
              name: 'John',
              age: 25,
            },
          ],
        },
      ],
      stats: [{ objects: 12 }],
    }

    const options = {
      true: 'GREEN' as Status,
      return_if_not_found: 'RED' as Status,
      return_if_empty: 'YELLOW' as Status,
    }
    const expectedResult = []

    const result = evalCheck(condition, reference, data, options)

    expect(result.ref).toEqual(reference)
    expect(result.condition).toEqual(condition)
    expect(result.bool).toEqual(true)
    expect(result.status).toEqual('GREEN')
    expect(result.reasonPackages).toEqual(expectedResult)
  })
})

describe('evalConcatenation', () => {
  const checks = {
    check1: {
      ref: '',
      condition: '',
      status: 'GREEN' as Status,
      bool: true,
      reasonPackages: [
        {
          reasons: [],
          context: undefined,
        },
      ],
    },
    check2: {
      ref: '',
      condition: '',
      status: 'YELLOW' as Status,
      bool: false,
      reasonPackages: [
        {
          reasons: [],
          context: undefined,
        },
      ],
    },
    check3: {
      ref: '',
      condition: '',
      status: 'RED' as Status,
      bool: false,
      reasonPackages: [
        {
          reasons: [],
          context: undefined,
        },
      ],
    },
  }

  it('should evaluate an "AND" concatenation', () => {
    const result = evalConcatenation('check1 && check2 && check3', checks)
    expect(result).toEqual({
      condition: 'check1 && check2 && check3',
      status: 'RED',
    })
  })

  it('should evaluate an "OR" concatenation', () => {
    const result = evalConcatenation('check1 || check2 || check3', checks)
    expect(result).toEqual({
      condition: 'check1 || check2 || check3',
      status: 'GREEN',
    })
  })

  it('should throw an error if a referenced check does not exist', () => {
    expect(() => evalConcatenation('check1 && check4', checks)).toThrow(
      Error(
        'Error in concatenation condition. Please check the concatenation condition.'
      )
    )
  })
})
