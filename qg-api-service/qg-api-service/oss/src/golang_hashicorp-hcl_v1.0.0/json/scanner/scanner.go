// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

package scanner

import (
	"bytes"
	"fmt"
	"os"
	"unicode"
	"unicode/utf8"

	"github.com/hashicorp/hcl/json/token"
)

// eof represents a marker rune for the end of the reader.
const eof = rune(0)

// Scanner defines a lexical scanner
type Scanner struct {
	buf *bytes.Buffer // Source buffer for advancing and scanning
	src []byte        // Source buffer for immutable access

	// Source Position
	srcPos  token.Pos // current position
	prevPos token.Pos // previous position, used for peek() method

	lastCharLen int // length of last character in bytes
	lastLineLen int // length of last line in characters (for correct column reporting)

	tokStart int // token text start position
	tokEnd   int // token text end  position

	// Error is called for each error encountered. If no Error
	// function is set, the error is reported to os.Stderr.
	Error func(pos token.Pos, msg string)

	// ErrorCount is incremented by one for each error encountered.
	ErrorCount int

	// tokPos is the start position of most recently scanned token; set by
	// Scan. The Filename field is always left untouched by the Scanner.  If
	// an error is reported (via Error) and Position is invalid, the scanner is
	// not inside a token.
	tokPos token.Pos
}

// New creates and initializes a new instance of Scanner using src as
// its source content.
func New(src []byte) *Scanner {
	// even though we accept a src, we read from a io.Reader compatible type
	// (*bytes.Buffer). So in the future we might easily change it to streaming
	// read.
	b := bytes.NewBuffer(src)
	s := &Scanner{
		buf: b,
		src: src,
	}

	// srcPosition always starts with 1
	s.srcPos.Line = 1
	return s
}

// next reads the next rune from the bufferred reader. Returns the rune(0) if
// an error occurs (or io.EOF is returned).
func (s *Scanner) next() rune {
	ch, size, err := s.buf.ReadRune()
	if err != nil {
		// advance for error reporting
		s.srcPos.Column++
		s.srcPos.Offset += size
		s.lastCharLen = size
		return eof
	}

	if ch == utf8.RuneError && size == 1 {
		s.srcPos.Column++
		s.srcPos.Offset += size
		s.lastCharLen = size
		s.err("illegal UTF-8 encoding")
		return ch
	}

	// remember last position
	s.prevPos = s.srcPos

	s.srcPos.Column++
	s.lastCharLen = size
	s.srcPos.Offset += size

	if ch == '\n' {
		s.srcPos.Line++
		s.lastLineLen = s.srcPos.Column
		s.srcPos.Column = 0
	}

	// debug
	// fmt.Printf("ch: %q, offset:column: %d:%d\n", ch, s.srcPos.Offset, s.srcPos.Column)
	return ch
}

// unread unreads the previous read Rune and updates the source position
func (s *Scanner) unread() {
	if err := s.buf.UnreadRune(); err != nil {
		panic(err) // this is user fault, we should catch it
	}
	s.srcPos = s.prevPos // put back last position
}

// peek returns the next rune without advancing the reader.
func (s *Scanner) peek() rune {
	peek, _, err := s.buf.ReadRune()
	if err != nil {
		return eof
	}

	s.buf.UnreadRune()
	return peek
}

// Scan scans the next token and returns the token.
func (s *Scanner) Scan() token.Token {
	ch := s.next()

	// skip white space
	for isWhitespace(ch) {
		ch = s.next()
	}

	var tok token.Type

	// token text markings
	s.tokStart = s.srcPos.Offset - s.lastCharLen

	// token position, initial next() is moving the offset by one(size of rune
	// actually), though we are interested with the starting point
	s.tokPos.Offset = s.srcPos.Offset - s.lastCharLen
	if s.srcPos.Column > 0 {
		// common case: last character was not a '\n'
		s.tokPos.Line = s.srcPos.Line
		s.tokPos.Column = s.srcPos.Column
	} else {
		// last character was a '\n'
		// (we cannot be at the beginning of the source
		// since we have called next() at least once)
		s.tokPos.Line = s.srcPos.Line - 1
		s.tokPos.Column = s.lastLineLen
	}

	switch {
	case isLetter(ch):
		lit := s.scanIdentifier()
		if lit == "true" || lit == "false" {
			tok = token.BOOL
		} else if lit == "null" {
			tok = token.NULL
		} else {
			s.err("illegal char")
		}
	case isDecimal(ch):
		tok = s.scanNumber(ch)
	default:
		switch ch {
		case eof:
			tok = token.EOF
		case '"':
			tok = token.STRING
			s.scanString()
		case '.':
			tok = token.PERIOD
			ch = s.peek()
			if isDecimal(ch) {
				tok = token.FLOAT
				ch = s.scanMantissa(ch)
				ch = s.scanExponent(ch)
			}
		case '[':
			tok = token.LBRACK
		case ']':
			tok = token.RBRACK
		case '{':
			tok = token.LBRACE
		case '}':
			tok = token.RBRACE
		case ',':
			tok = token.COMMA
		case ':':
			tok = token.COLON
		case '-':
			if isDecimal(s.peek()) {
				ch := s.next()
				tok = s.scanNumber(ch)
			} else {
				s.err("illegal char")
			}
		default:
			s.err("illegal char: " + string(ch))
		}
	}

	// finish token ending
	s.tokEnd = s.srcPos.Offset

	// create token literal
	var tokenText string
	if s.tokStart >= 0 {
		tokenText = string(s.src[s.tokStart:s.tokEnd])
	}
	s.tokStart = s.tokEnd // ensure idempotency of tokenText() call

	return token.Token{
		Type: tok,
		Pos:  s.tokPos,
		Text: tokenText,
	}
}

// scanNumber scans a HCL number definition starting with the given rune
func (s *Scanner) scanNumber(ch rune) token.Type {
	zero := ch == '0'
	pos := s.srcPos

	s.scanMantissa(ch)
	ch = s.next() // seek forward
	if ch == 'e' || ch == 'E' {
		ch = s.scanExponent(ch)
		return token.FLOAT
	}

	if ch == '.' {
		ch = s.scanFraction(ch)
		if ch == 'e' || ch == 'E' {
			ch = s.next()
			ch = s.scanExponent(ch)
		}
		return token.FLOAT
	}

	if ch != eof {
		s.unread()
	}

	// If we have a larger number and this is zero, error
	if zero && pos != s.srcPos {
		s.err("numbers cannot start with 0")
	}

	return token.NUMBER
}

// scanMantissa scans the mantissa beginning from the rune. It returns the next
// non decimal rune. It's used to determine wheter it's a fraction or exponent.
func (s *Scanner) scanMantissa(ch rune) rune {
	scanned := false
	for isDecimal(ch) {
		ch = s.next()
		scanned = true
	}

	if scanned && ch != eof {
		s.unread()
	}
	return ch
}

// scanFraction scans the fraction after the '.' rune
func (s *Scanner) scanFraction(ch rune) rune {
	if ch == '.' {
		ch = s.peek() // we peek just to see if we can move forward
		ch = s.scanMantissa(ch)
	}
	return ch
}

// scanExponent scans the remaining parts of an exponent after the 'e' or 'E'
// rune.
func (s *Scanner) scanExponent(ch rune) rune {
	if ch == 'e' || ch == 'E' {
		ch = s.next()
		if ch == '-' || ch == '+' {
			ch = s.next()
		}
		ch = s.scanMantissa(ch)
	}
	return ch
}

// scanString scans a quoted string
func (s *Scanner) scanString() {
	braces := 0
	for {
		// '"' opening already consumed
		// read character after quote
		ch := s.next()

		if ch == '\n' || ch < 0 || ch == eof {
			s.err("literal not terminated")
			return
		}

		if ch == '"' {
			break
		}

		// If we're going into a ${} then we can ignore quotes for awhile
		if braces == 0 && ch == '$' && s.peek() == '{' {
			braces++
			s.next()
		} else if braces > 0 && ch == '{' {
			braces++
		}
		if braces > 0 && ch == '}' {
			braces--
		}

		if ch == '\\' {
			s.scanEscape()
		}
	}

	return
}

// scanEscape scans an escape sequence
func (s *Scanner) scanEscape() rune {
	// http://en.cppreference.com/w/cpp/language/escape
	ch := s.next() // read character after '/'
	switch ch {
	case 'a', 'b', 'f', 'n', 'r', 't', 'v', '\\', '"':
		// nothing to do
	case '0', '1', '2', '3', '4', '5', '6', '7':
		// octal notation
		ch = s.scanDigits(ch, 8, 3)
	case 'x':
		// hexademical notation
		ch = s.scanDigits(s.next(), 16, 2)
	case 'u':
		// universal character name
		ch = s.scanDigits(s.next(), 16, 4)
	case 'U':
		// universal character name
		ch = s.scanDigits(s.next(), 16, 8)
	default:
		s.err("illegal char escape")
	}
	return ch
}

// scanDigits scans a rune with the given base for n times. For example an
// octal notation \184 would yield in scanDigits(ch, 8, 3)
func (s *Scanner) scanDigits(ch rune, base, n int) rune {
	for n > 0 && digitVal(ch) < base {
		ch = s.next()
		n--
	}
	if n > 0 {
		s.err("illegal char escape")
	}

	// we scanned all digits, put the last non digit char back
	s.unread()
	return ch
}

// scanIdentifier scans an identifier and returns the literal string
func (s *Scanner) scanIdentifier() string {
	offs := s.srcPos.Offset - s.lastCharLen
	ch := s.next()
	for isLetter(ch) || isDigit(ch) || ch == '-' {
		ch = s.next()
	}

	if ch != eof {
		s.unread() // we got identifier, put back latest char
	}

	return string(s.src[offs:s.srcPos.Offset])
}

// recentPosition returns the position of the character immediately after the
// character or token returned by the last call to Scan.
func (s *Scanner) recentPosition() (pos token.Pos) {
	pos.Offset = s.srcPos.Offset - s.lastCharLen
	switch {
	case s.srcPos.Column > 0:
		// common case: last character was not a '\n'
		pos.Line = s.srcPos.Line
		pos.Column = s.srcPos.Column
	case s.lastLineLen > 0:
		// last character was a '\n'
		// (we cannot be at the beginning of the source
		// since we have called next() at least once)
		pos.Line = s.srcPos.Line - 1
		pos.Column = s.lastLineLen
	default:
		// at the beginning of the source
		pos.Line = 1
		pos.Column = 1
	}
	return
}

// err prints the error of any scanning to s.Error function. If the function is
// not defined, by default it prints them to os.Stderr
func (s *Scanner) err(msg string) {
	s.ErrorCount++
	pos := s.recentPosition()

	if s.Error != nil {
		s.Error(pos, msg)
		return
	}

	fmt.Fprintf(os.Stderr, "%s: %s\n", pos, msg)
}

// isHexadecimal returns true if the given rune is a letter
func isLetter(ch rune) bool {
	return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || ch == '_' || ch >= 0x80 && unicode.IsLetter(ch)
}

// isHexadecimal returns true if the given rune is a decimal digit
func isDigit(ch rune) bool {
	return '0' <= ch && ch <= '9' || ch >= 0x80 && unicode.IsDigit(ch)
}

// isHexadecimal returns true if the given rune is a decimal number
func isDecimal(ch rune) bool {
	return '0' <= ch && ch <= '9'
}

// isHexadecimal returns true if the given rune is an hexadecimal number
func isHexadecimal(ch rune) bool {
	return '0' <= ch && ch <= '9' || 'a' <= ch && ch <= 'f' || 'A' <= ch && ch <= 'F'
}

// isWhitespace returns true if the rune is a space, tab, newline or carriage return
func isWhitespace(ch rune) bool {
	return ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r'
}

// digitVal returns the integer value of a given octal,decimal or hexadecimal rune
func digitVal(ch rune) int {
	switch {
	case '0' <= ch && ch <= '9':
		return int(ch - '0')
	case 'a' <= ch && ch <= 'f':
		return int(ch - 'a' + 10)
	case 'A' <= ch && ch <= 'F':
		return int(ch - 'A' + 10)
	}
	return 16 // larger than any legal digit val
}
