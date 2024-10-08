import { LongRunningToken } from './long.running.token'

/*
 * Tokens look like this:
 * yakp_aa_0000000001_75b4add7311daf6dd1ad0c79bb0ec4
 */

describe('Interactive login guard', () => {
  it('Hashes are different for multiple calls on one token', async () => {
    const preToken = LongRunningToken.generatePreToken()

    const hash1 = await preToken.generateHash()
    const hash2 = await preToken.generateHash()
    const hash3 = await preToken.generateHash()

    expect(hash1).not.toBe(hash2)
    expect(hash1).not.toBe(hash3)
    expect(hash2).not.toBe(hash3)
  })

  it('Hashes are different for multiple pre tokens', async () => {
    const preToken1 = LongRunningToken.generatePreToken()
    const preToken2 = LongRunningToken.generatePreToken()

    const hash1 = await preToken1.generateHash()
    const hash2 = await preToken2.generateHash()

    expect(hash1).not.toBe(hash2)
  })

  it('Hash verifies successfully', async () => {
    const preToken = LongRunningToken.generatePreToken()
    const hash = await preToken.generateHash()

    const token = LongRunningToken.from(1, preToken)
    expect(token.matches(hash)).resolves.toBeTruthy()
  })

  it('Hashes of different token does not match', async () => {
    const preToken1 = LongRunningToken.generatePreToken()
    const preToken2 = LongRunningToken.generatePreToken()

    const hash2 = await preToken2.generateHash()

    const token1 = LongRunningToken.from(1, preToken1)

    expect(token1.matches(hash2)).resolves.toBeFalsy()
  })

  it('Token serialises and deserialises properly', async () => {
    const preToken = LongRunningToken.generatePreToken()
    const hash = await preToken.generateHash()

    const token = LongRunningToken.from(1, preToken)
    const serializedToken = token.toString()

    const deserializedToken = LongRunningToken.parse(serializedToken)

    expect(deserializedToken.matches(hash)).resolves.toBeTruthy()
  })

  it('Slight changes to hash does not match', async () => {
    const preToken = LongRunningToken.generatePreToken()
    const hash = await preToken.generateHash()

    const token = LongRunningToken.from(1, preToken)

    const manipulatedHash = Array.from(hash)

    if (manipulatedHash[12] === 'f') {
      manipulatedHash[12] = 'e'
    } else {
      manipulatedHash[12] = 'f'
    }

    expect(token.matches(manipulatedHash.join(''))).resolves.toBeFalsy()
  })

  it('Slight changes to token random value does not match', async () => {
    const preToken = LongRunningToken.generatePreToken()
    const hash = await preToken.generateHash()

    const token = LongRunningToken.from(1, preToken)
    const serializedToken = token.toString()

    const manipulatedToken = Array.from(serializedToken)

    if (manipulatedToken[25] === 'f') {
      manipulatedToken[25] = 'e'
    } else {
      manipulatedToken[25] = 'f'
    }

    const deserializedToken = LongRunningToken.parse(manipulatedToken.join(''))

    expect(deserializedToken.matches(hash)).resolves.toBeFalsy()
  })

  it('Parsing succeeds for proper token', async () => {
    const tokenStr = 'yakp_aa_0000000001_75b4add7311daf6dd1ad0c79bb0ec4'
    const token = LongRunningToken.parse(tokenStr)

    expect(token).toBeDefined()
    expect(token.getId()).toBe(1)

    /*
     * Ensure that the verbatim token is not part of the Error
     * Prevents credential leakge
     */
    expect(token.toString()).toBe(tokenStr)
  })

  it('Parsing fails for incomplete token - too few components', async () => {
    const tooFewComponents = 'yakp_0000000001_75b4add7311daf6dd1ad0c79bb0ec4'

    const fn = () => LongRunningToken.parse(tooFewComponents)
    expect(fn).toThrowError(Error)
    expect(fn).toThrow('four parts')
    expect(fn).not.toThrow(tooFewComponents)
  })

  it('Parsing fails for incorrect token - prefix wrong', async () => {
    const prefixWrong = 'yak_aa_0000000001_75b4add7311daf6dd1ad0c79bb0ec4'

    const fn = () => LongRunningToken.parse(prefixWrong)
    expect(fn).toThrowError(Error)
    expect(fn).toThrow('first part')
    expect(fn).not.toThrow(prefixWrong)
  })

  it('Parsing fails for incorrect token - version wrong', async () => {
    const versionWrong = 'yakp_ab_0000000001_75b4add7311daf6dd1ad0c79bb0ec4'

    const fn = () => LongRunningToken.parse(versionWrong)
    expect(fn).toThrowError(Error)
    expect(fn).toThrow('second part')
    expect(fn).not.toThrow(versionWrong)
  })

  it('Parsing fails for incorrect token - number too long', async () => {
    const serialTooLong = 'yakp_aa_00000000011_75b4add7311daf6dd1ad0c79bb0ec4'

    const fn = () => LongRunningToken.parse(serialTooLong)
    expect(fn).toThrowError(Error)
    expect(fn).toThrow('third part')
    expect(fn).toThrow('characters')
    expect(fn).not.toThrow(serialTooLong)
  })

  it('Parsing fails for incorrect token - serial out of range number', async () => {
    const serialOutOfRange = 'yakp_aa_0000000000_75b4add7311daf6dd1ad0c79bb0ec4'

    const fn = () => LongRunningToken.parse(serialOutOfRange)
    expect(fn).toThrowError(Error)
    expect(fn).toThrow('number between')
    expect(fn).not.toThrow(serialOutOfRange)
  })

  it('Parsing fails for incorrect token - hex too long', async () => {
    const hexTooLong = 'yakp_aa_0000000001_75b4add7311daf6dd1ad0c79bb0ecd4'

    const fn = () => LongRunningToken.parse(hexTooLong)
    expect(fn).toThrowError(Error)
    expect(fn).toThrow('fourth part')
    expect(fn).toThrow('characters')
    expect(fn).not.toThrow(hexTooLong)
  })

  it('Parsing fails for incorrect token - no hex', async () => {
    const noHex = 'yakp_aa_0000000001_75b4add7311daf6dd1ad0c79bb0ecz'

    const fn = () => LongRunningToken.parse(noHex)
    expect(fn).toThrowError(Error)
    expect(fn).toThrow('lower case hex string')
    expect(fn).not.toThrow(noHex)
  })

  it('Parsing fails for incorrect token - negative zero integer', async () => {
    const noHex = 'yakp_aa_-000000000_75b4add7311daf6dd1ad0c79bb0ecz'

    const fn = () => LongRunningToken.parse(noHex)
    expect(fn).toThrowError(Error)
    expect(fn).toThrow('ten digit decimal integer')
    expect(fn).not.toThrow(noHex)
  })
})
