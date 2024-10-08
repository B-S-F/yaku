import { compare, hash } from 'bcrypt'
import { randomBytes } from 'crypto'

export interface PreToken {
  generateHash(): Promise<string>
}

class InnerPreToken implements PreToken {
  private readonly random: Buffer
  private readonly saltRounds: number

  constructor(random: Buffer, saltRounds: number) {
    this.random = random
    this.saltRounds = saltRounds
  }

  async generateHash(): Promise<string> {
    return await hash(this.random, this.saltRounds)
  }

  getRandom(): Buffer {
    return Buffer.from(this.random)
  }
}

/*
 * Tokens look like this:
 * yakp_aa_0000000001_75b4add7311daf6dd1ad0c79bb0ec4
 *
 * First part is fix - yakp
 * Second part is fix - aa
 *
 * First and second part serve as magic numbers to detect the kind of token
 * and the version of the token format - we may change the token format in the
 * future and thus have an easy way to adapt.
 *
 * Third part is an integer for lookup in the database
 *
 * Fourth part is a random value for which a salted hash is stored in the database
 */

export class LongRunningToken {
  private static readonly PREFIX = 'yakp'
  private static readonly VERSION = 'aa'

  private static readonly MIN_SERIAL = 1
  private static readonly MAX_SERIAL = 9_999_999_999
  private static readonly SERIAL_LEN = 10

  private static readonly RAND_LEN = 15
  private static readonly HEX_LEN = 2 * LongRunningToken.RAND_LEN

  private static readonly SALT_ROUNDS = 10

  private readonly id: number
  private readonly random: Buffer

  private constructor(id: number, random: Buffer) {
    this.id = id
    this.random = random
  }

  static parse(candidate: string): LongRunningToken {
    if (!candidate) {
      throw new Error(`Illegal token, candidate is undefined`)
    }

    const parts = candidate.split('_')

    if (parts.length !== 4) {
      throw new Error(
        'Illegal token, expected token to contain four parts separated by underscores'
      )
    }

    if (parts[0] !== LongRunningToken.PREFIX) {
      throw new Error('Illegal token, expected first part to be "yakp"')
    }

    if (parts[1] !== LongRunningToken.VERSION) {
      throw new Error('Illegal token, expected second part to be "aa"')
    }

    const numberStr = parts[2]

    if (numberStr.length != LongRunningToken.SERIAL_LEN) {
      throw new Error(
        `Illegal token, expected third part to be ${LongRunningToken.SERIAL_LEN} characters long`
      )
    }

    const numberRegEx = /^[0-9]{10}$/

    if (!numberRegEx.test(numberStr)) {
      throw new Error(
        'Illegal token, expected third part to be a ten digit decimal integer (left padded with zeros)'
      )
    }

    const id = Number(numberStr)

    // This should not happen, due to the regex above, but let's make sure
    if (!Number.isInteger(id)) {
      throw new Error('Illegal token, expected third part to be an integer')
    }

    if (id < LongRunningToken.MIN_SERIAL || id > LongRunningToken.MAX_SERIAL) {
      throw new Error(
        `Illegal token, expected third part to be number between ${LongRunningToken.MIN_SERIAL} and ${LongRunningToken.MAX_SERIAL}`
      )
    }

    const hexStr = parts[3]

    if (hexStr.length !== LongRunningToken.HEX_LEN) {
      throw new Error(
        `Illegal token, expected fourth part to be ${LongRunningToken.HEX_LEN} characters long`
      )
    }

    // lower case hex without prefix, 30 chars long
    const hexRegEx = /^[a-f0-9]{30}$/

    if (!hexRegEx.test(hexStr)) {
      throw new Error(
        'Illegal token, expected fourth part to be a lower case hex string'
      )
    }

    const random = Buffer.from(hexStr, 'hex')

    return new LongRunningToken(id, random)
  }

  static generatePreToken(): PreToken {
    const random = randomBytes(this.RAND_LEN)
    return new InnerPreToken(random, this.SALT_ROUNDS)
  }

  static from(id: number, preToken: PreToken): LongRunningToken {
    if (!(preToken instanceof InnerPreToken)) {
      throw new Error('Implementation bug')
    }

    if (!Number.isInteger(id)) {
      throw new Error('Illegal id, expected to be an integer')
    }

    if (id < this.MIN_SERIAL || id > this.MAX_SERIAL) {
      throw new Error(
        `Illegal token, expected id to be number between ${this.MIN_SERIAL} and ${this.MAX_SERIAL}`
      )
    }

    return new LongRunningToken(id, preToken.getRandom())
  }

  getId(): number {
    return this.id
  }

  toString(): string {
    return (
      LongRunningToken.PREFIX +
      '_' +
      LongRunningToken.VERSION +
      '_' +
      this.id.toString().padStart(LongRunningToken.SERIAL_LEN, '0') +
      '_' +
      this.random.toString('hex')
    )
  }

  async matches(hash: string): Promise<boolean> {
    return await compare(this.random, hash)
  }
}
