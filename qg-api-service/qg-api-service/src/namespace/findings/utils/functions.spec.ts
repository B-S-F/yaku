import { FindingQgResult } from './interfaces/qgRunMessageInterfaces'
import { extractFindings } from './functions'

describe('functions', () => {
  describe('extractFindings', () => {
    it('should return findings', async () => {
      const data = `
            header:
                name: Test Data
            overallStatus: GREEN
            chapters:
              "chapter_1":
                title: Chapter 1 Title
                status: GREEN
                extraProp: extra
                requirements:
                  "requirement_1":
                    title: Requirement 1 Title
                    status: GREEN
                    extraProp: extra
                    checks:
                      "check_1":
                        title: Check 1 Title
                        status: GREEN
                        evaluation:
                            autopilot: test_autopilot
                            status: GREEN
                            reason: Test Reason
                            extraProp: extra
                            results:
                            - criterion: Test Criterion
                              fulfilled: false
                              justification: Test Justification
                              metadata:
                                DateString: "2022-11-08T09:51:00"
                                DateType: 2022-11-08T09:51:00
                                IntegerType: 1588653
                                IntegerString: "1588653"
                                FloatingType: 1588653.3
                                FloatingString: "1588653.3"
                                IEEE754IntegerType: 1.588653e+06
                                IEEE754IntegerString: "1.588653e+06"
                                IEEE754FloatingType: 1.588653.3e+1043
                                IEEE754IFloatingString: "1.588653.3e+1043"
                                BooleanType: true
                                BooleanString: "true"
                            execution:
                            logs:
                                - Log 1
            `

      const expectedData: FindingQgResult[] = [
        {
          chapter: 'chapter_1',
          requirement: 'requirement_1',
          check: 'check_1',
          criterion: 'Test Criterion',
          justification: 'Test Justification',
          metadata: {
            DateString: '2022-11-08T09:51:00',
            DateType: new Date('2022-11-08T09:51:00.000Z'),
            IntegerType: 1588653,
            IntegerString: '1588653',
            FloatingType: 1588653.3,
            FloatingString: '1588653.3',
            IEEE754IntegerType: 1.588653e6,
            IEEE754IntegerString: '1.588653e+06',
            IEEE754FloatingType: '1.588653.3e+1043',
            IEEE754IFloatingString: '1.588653.3e+1043',
            BooleanType: true,
            BooleanString: 'true',
          },
        },
      ]

      const extractedData = extractFindings(data)

      expect(extractedData).toEqual(expectedData)
    })
  })
})
