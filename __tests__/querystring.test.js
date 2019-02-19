// taken from https://github.com/nodejs/node/blob/master/test/parallel/test-querystring.js

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const qs = require('../index');

function createWithNoPrototype(properties) {
  const noProto = Object.create(null);
  properties.forEach((property) => {
    noProto[property.key] = property.value;
  });
  return noProto;
}
// folding block, commented to pass gjslint
// {{{
// [ wonkyQS, canonicalQS, obj ]
const qsTestCases = [
  ['__proto__=1',
   '__proto__=1',
   createWithNoPrototype([{ key: '__proto__', value: '1' }])],
  ['__defineGetter__=asdf',
   '__defineGetter__=asdf',
   JSON.parse('{"__defineGetter__":"asdf"}')],
  ['foo=918854443121279438895193',
   'foo=918854443121279438895193',
   { 'foo': '918854443121279438895193' }],
  ['foo=bar', 'foo=bar', { 'foo': 'bar' }],
  ['foo=bar&foo=quux', 'foo=bar&foo=quux', { 'foo': ['bar', 'quux'] }],
  ['foo=1&bar=2', 'foo=1&bar=2', { 'foo': '1', 'bar': '2' }],
  ['my+weird+field=q1%212%22%27w%245%267%2Fz8%29%3F',
   'my%20weird%20field=q1!2%22\'w%245%267%2Fz8)%3F',
   { 'my weird field': 'q1!2"\'w$5&7/z8)?' }],
  ['foo%3Dbaz=bar', 'foo%3Dbaz=bar', { 'foo=baz': 'bar' }],
  ['foo=baz=bar', 'foo=baz%3Dbar', { 'foo': 'baz=bar' }],
  ['str=foo&arr=1&arr=2&arr=3&somenull=&undef=',
   'str=foo&arr=1&arr=2&arr=3&somenull=&undef=',
   { 'str': 'foo',
     'arr': ['1', '2', '3'],
     'somenull': '',
     'undef': '' }],
  [' foo = bar ', '%20foo%20=%20bar%20', { ' foo ': ' bar ' }],
  ['foo=%zx', 'foo=%25zx', { 'foo': '%zx' }],
  ['foo=%EF%BF%BD', 'foo=%EF%BF%BD', { 'foo': '\ufffd' }],
  // See: https://github.com/joyent/node/issues/1707
  ['hasOwnProperty=x&toString=foo&valueOf=bar&__defineGetter__=baz',
   'hasOwnProperty=x&toString=foo&valueOf=bar&__defineGetter__=baz',
   { hasOwnProperty: 'x',
     toString: 'foo',
     valueOf: 'bar',
     __defineGetter__: 'baz' }],
  // See: https://github.com/joyent/node/issues/3058
  ['foo&bar=baz', 'foo=&bar=baz', { foo: '', bar: 'baz' }],
  ['a=b&c&d=e', 'a=b&c=&d=e', { a: 'b', c: '', d: 'e' }],
  ['a=b&c=&d=e', 'a=b&c=&d=e', { a: 'b', c: '', d: 'e' }],
  ['a=b&=c&d=e', 'a=b&=c&d=e', { 'a': 'b', '': 'c', 'd': 'e' }],
  ['a=b&=&c=d', 'a=b&=&c=d', { 'a': 'b', '': '', 'c': 'd' }],
  ['&&foo=bar&&', 'foo=bar', { foo: 'bar' }],
  ['&', '', {}],
  ['&&&&', '', {}],
  ['&=&', '=', { '': '' }],
  ['&=&=', '=&=', { '': [ '', '' ] }],
  ['=', '=', { '': '' }],
  ['+', '%20=', { ' ': '' }],
  ['+=', '%20=', { ' ': '' }],
  ['+&', '%20=', { ' ': '' }],
  ['=+', '=%20', { '': ' ' }],
  ['+=&', '%20=', { ' ': '' }],
  ['a&&b', 'a=&b=', { 'a': '', 'b': '' }],
  ['a=a&&b=b', 'a=a&b=b', { 'a': 'a', 'b': 'b' }],
  ['&a', 'a=', { 'a': '' }],
  ['&=', '=', { '': '' }],
  ['a&a&', 'a=&a=', { a: [ '', '' ] }],
  ['a&a&a&', 'a=&a=&a=', { a: [ '', '', '' ] }],
  ['a&a&a&a&', 'a=&a=&a=&a=', { a: [ '', '', '', '' ] }],
  ['a=&a=value&a=', 'a=&a=value&a=', { a: [ '', 'value', '' ] }],
  ['foo+bar=baz+quux', 'foo%20bar=baz%20quux', { 'foo bar': 'baz quux' }],
  ['+foo=+bar', '%20foo=%20bar', { ' foo': ' bar' }],
  ['a+', 'a%20=', { 'a ': '' }],
  ['=a+', '=a%20', { '': 'a ' }],
  ['a+&', 'a%20=', { 'a ': '' }],
  ['=a+&', '=a%20', { '': 'a ' }],
  ['%20+', '%20%20=', { '  ': '' }],
  ['=%20+', '=%20%20', { '': '  ' }],
  ['%20+&', '%20%20=', { '  ': '' }],
  ['=%20+&', '=%20%20', { '': '  ' }],
  [null, '', {}],
  [undefined, '', {}]
];

// [ wonkyQS, canonicalQS, obj ]
const qsColonTestCases = [
  ['foo:bar', 'foo:bar', { 'foo': 'bar' }],
  ['foo:bar;foo:quux', 'foo:bar;foo:quux', { 'foo': ['bar', 'quux'] }],
  ['foo:1&bar:2;baz:quux',
   'foo:1%26bar%3A2;baz:quux',
   { 'foo': '1&bar:2', 'baz': 'quux' }],
  ['foo%3Abaz:bar', 'foo%3Abaz:bar', { 'foo:baz': 'bar' }],
  ['foo:baz:bar', 'foo:baz%3Abar', { 'foo': 'baz:bar' }]
];

// [wonkyObj, qs, canonicalObj]
function extendedFunction() {}
extendedFunction.prototype = { a: 'b' };
const qsWeirdObjects = [
  // eslint-disable-next-line node-core/no-unescaped-regexp-dot
  [{ regexp: /./g }, 'regexp=', { 'regexp': '' }],
  // eslint-disable-next-line node-core/no-unescaped-regexp-dot
  [{ regexp: new RegExp('.', 'g') }, 'regexp=', { 'regexp': '' }],
  [{ fn: () => {} }, 'fn=', { 'fn': '' }],
  [{ fn: new Function('') }, 'fn=', { 'fn': '' }],
  [{ math: Math }, 'math=', { 'math': '' }],
  [{ e: extendedFunction }, 'e=', { 'e': '' }],
  [{ d: new Date() }, 'd=', { 'd': '' }],
  [{ d: Date }, 'd=', { 'd': '' }],
  [
    { f: new Boolean(false), t: new Boolean(true) },
    'f=&t=',
    { 'f': '', 't': '' }
  ],
  [{ f: false, t: true }, 'f=false&t=true', { 'f': 'false', 't': 'true' }],
  [{ n: null }, 'n=', { 'n': '' }],
  [{ nan: NaN }, 'nan=', { 'nan': '' }],
  [{ inf: Infinity }, 'inf=', { 'inf': '' }],
  [{ a: [], b: [] }, '', {}]
];
// }}}


const qsNoMungeTestCases = [
  ['', {}],
  ['foo=bar&foo=baz', { 'foo': ['bar', 'baz'] }],
  ['blah=burp', { 'blah': 'burp' }],
  ['a=!-._~\'()*', { 'a': '!-._~\'()*' }],
  ['a=abcdefghijklmnopqrstuvwxyz', { 'a': 'abcdefghijklmnopqrstuvwxyz' }],
  ['a=ABCDEFGHIJKLMNOPQRSTUVWXYZ', { 'a': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' }],
  ['a=0123456789', { 'a': '0123456789' }],
  ['gragh=1&gragh=3&goo=2', { 'gragh': ['1', '3'], 'goo': '2' }],
  ['frappucino=muffin&goat%5B%5D=scone&pond=moose',
   { 'frappucino': 'muffin', 'goat[]': 'scone', 'pond': 'moose' }],
  ['trololol=yes&lololo=no', { 'trololol': 'yes', 'lololo': 'no' }]
];

const qsUnescapeTestCases = [
  ['there is nothing to unescape here',
   'there is nothing to unescape here'],
  ['there%20are%20several%20spaces%20that%20need%20to%20be%20unescaped',
   'there are several spaces that need to be unescaped'],
  ['there%2Qare%0-fake%escaped values in%%%%this%9Hstring',
   'there%2Qare%0-fake%escaped values in%%%%this%9Hstring'],
  ['%20%21%22%23%24%25%26%27%28%29%2A%2B%2C%2D%2E%2F%30%31%32%33%34%35%36%37',
   ' !"#$%&\'()*+,-./01234567']
];

test('parse', () => {
  expect(qs.parse('id=918854443121279438895193').id).toBe('918854443121279438895193');
})


function check(actual, expected, input) {
  test(input, () => {
    expect(actual).toEqual(expected)
  })
}

// test that the canonical qs is parsed properly.
qsTestCases.forEach((testCase) => {
  check(qs.parse(testCase[0]), testCase[2], 'parse ' + testCase[0]);
});

// test that the colon test cases can do the same
qsColonTestCases.forEach((testCase) => {
  check(qs.parse(testCase[0], ';', ':'), testCase[2], 'parse ' + testCase[0]);
});

// Test the weird objects, that they get parsed properly
qsWeirdObjects.forEach((testCase) => {
  check(qs.parse(testCase[1]), testCase[2], 'parse ' + testCase[1]);
});

qsNoMungeTestCases.forEach((testCase) => {
  check(qs.stringify(testCase[1], '&', '='), testCase[0], 'stringify ' + testCase[0]);
});

test('test the nested qs-in-qs case', () => {
  const f = qs.parse('a=b&q=x%3Dy%26y%3Dz');
  expect(f).toEqual({ a: 'b', q: 'x=y&y=z' });

  f.q = qs.parse(f.q);
  const expectedInternal = createWithNoPrototype([
    { key: 'x', value: 'y' },
    { key: 'y', value: 'z' }
  ]);
  expect(f.q).toEqual(expectedInternal);
})

test('test the nested qs-in-qs in colon case', () => {
  const f = qs.parse('a:b;q:x%3Ay%3By%3Az', ';', ':');
  expect(f).toEqual({ a: 'b', q: 'x:y;y:z' });
  f.q = qs.parse(f.q, ';', ':');
  const expectedInternal = createWithNoPrototype([
    { key: 'x', value: 'y' },
    { key: 'y', value: 'z' }
  ]);
  expect(f.q).toEqual(expectedInternal);
})

// now test stringifying

// basic
qsTestCases.forEach((testCase) => {
  check(qs.stringify(testCase[2]), testCase[1], 'stringify ' + testCase[0]);
});

qsColonTestCases.forEach((testCase) => {
  check(qs.stringify(testCase[2], ';', ':'), testCase[1], 'stringify ' + testCase[0]);
});

qsWeirdObjects.forEach((testCase) => {
  check(qs.stringify(testCase[0]), testCase[1], 'stringify ' + testCase[0]);
});

test('invalid surrogate pair throws URIError', () => {
  try {
    qs.stringify({ foo: '\udc00' })
    expect(false).toBe(true)
  } catch (err) {
    expect(err.message).toBe('URI malformed')
    expect(err.code).toBe('ERR_INVALID_URI')
  }
})

test('coerce numbers to string', () => {
  expect(qs.stringify({ foo: 0 })).toBe('foo=0');
  expect(qs.stringify({ foo: -0 })).toBe('foo=0');
  expect(qs.stringify({ foo: 3 })).toBe('foo=3');
  expect(qs.stringify({ foo: -72.42 })).toBe('foo=-72.42');
  expect(qs.stringify({ foo: NaN })).toBe('foo=');
  expect(qs.stringify({ foo: Infinity })).toBe('foo=');
})


test('nested', () => {
  const f = qs.stringify({
    a: 'b',
    q: qs.stringify({
      x: 'y',
      y: 'z'
    })
  });
  expect(f).toBe('a=b&q=x%3Dy%26y%3Dz');
})

test('undefined', () => {
  qs.parse(undefined); // Should not throw.
})


test('nested in colon', () =>{
  const f = qs.stringify({
    a: 'b',
    q: qs.stringify({
      x: 'y',
      y: 'z'
    }, ';', ':')
  }, ';', ':');
  expect(f).toBe('a:b;q:x%3Ay%3By%3Az');
})

test('empty string', () => {
  expect(qs.stringify()).toBe('');
  expect(qs.stringify(0)).toBe('');
  expect(qs.stringify([])).toBe('');
  expect(qs.stringify(null)).toBe('');
  expect(qs.stringify(true)).toBe('');
})

check(qs.parse(), {}, 'parse empty');

// empty sep
check(qs.parse('a', []), { a: '' }, 'parse empty sep');

// empty eq
check(qs.parse('a', null, []), { '': 'a' }, 'parse empty eq');

test('Test limiting', () => {
  expect(
    Object.keys(qs.parse('a=1&b=1&c=1', null, null, { maxKeys: 1 })).length
  ).toBe(1);
})

test('Test limiting with a case that starts from `&`', () => {
  expect(
    Object.keys(qs.parse('&a', null, null, { maxKeys: 1 })).length
  ).toBe(0);
})

test('Test removing limit', () => {
  function testUnlimitedKeys() {
    const query = {};

    for (let i = 0; i < 2000; i++) query[i] = i;

    const url = qs.stringify(query);

    expect(
      Object.keys(qs.parse(url, null, null, { maxKeys: 0 })).length
    ).toBe(2000);
  }

  testUnlimitedKeys();
})

test('unescape buffer', () => {
  const b = qs.unescapeBuffer('%d3%f2Ug%1f6v%24%5e%98%cb' +
    '%0d%ac%a2%2f%9d%eb%d8%a2%e6');
  // <Buffer d3 f2 55 67 1f 36 76 24 5e 98 cb 0d ac a2 2f 9d eb d8 a2 e6>
  expect(b[0]).toBe(0xd3);
  expect(b[1]).toBe(0xf2);
  expect(b[2]).toBe(0x55);
  expect(b[3]).toBe(0x67);
  expect(b[4]).toBe(0x1f);
  expect(b[5]).toBe(0x36);
  expect(b[6]).toBe(0x76);
  expect(b[7]).toBe(0x24);
  expect(b[8]).toBe(0x5e);
  expect(b[9]).toBe(0x98);
  expect(b[10]).toBe(0xcb);
  expect(b[11]).toBe(0x0d);
  expect(b[12]).toBe(0xac);
  expect(b[13]).toBe(0xa2);
  expect(b[14]).toBe(0x2f);
  expect(b[15]).toBe(0x9d);
  expect(b[16]).toBe(0xeb);
  expect(b[17]).toBe(0xd8);
  expect(b[18]).toBe(0xa2);
  expect(b[19]).toBe(0xe6);

  expect(qs.unescapeBuffer('a+b', true).toString()).toBe('a b');
  expect(qs.unescapeBuffer('a+b').toString()).toBe('a+b');
  expect(qs.unescapeBuffer('a%').toString()).toBe('a%');
  expect(qs.unescapeBuffer('a%2').toString()).toBe('a%2');
  expect(qs.unescapeBuffer('a%20').toString()).toBe('a ');
  expect(qs.unescapeBuffer('a%2g').toString()).toBe('a%2g');
  expect(qs.unescapeBuffer('a%%').toString()).toBe('a%%');
})

// Test invalid encoded string
check(qs.parse('%\u0100=%\u0101'), { '%Ā': '%ā' }, 'Test invalid encoded string');

// Test custom decode
{
  function demoDecode(str) {
    return str + str;
  }

  check(
    qs.parse('a=a&b=b&c=c', null, null, { decodeURIComponent: demoDecode }),
    { aa: 'aa', bb: 'bb', cc: 'cc' }, 'custom decode 1');
  check(
    qs.parse('a=a&b=b&c=c', null, '==', { decodeURIComponent: (str) => str }),
    { 'a=a': '', 'b=b': '', 'c=c': '' }, 'custom decode 2');
}

// Test QueryString.unescape
{
  function errDecode(str) {
    throw new Error('To jump to the catch scope');
  }

  check(qs.parse('a=a', null, null, { decodeURIComponent: errDecode }),
        { a: 'a' }, 'QueryString.unescape');
}

test('Test custom encode', () => {
  function demoEncode(str) {
    return str[0];
  }

  const obj = { aa: 'aa', bb: 'bb', cc: 'cc' };
  expect(
    qs.stringify(obj, null, null, { encodeURIComponent: demoEncode })
  ).toBe('a=a&b=b&c=c');
})

test('Test QueryString.unescapeBuffer', () => {
  qsUnescapeTestCases.forEach((testCase) => {
    expect(qs.unescape(testCase[0])).toBe(testCase[1]);
    expect(qs.unescapeBuffer(testCase[0]).toString()).toBe(testCase[1]);
  });
})

// test overriding .unescape
{
  const prevUnescape = qs.unescape;
  qs.unescape = (str) => {
    return str.replace(/o/g, '_');
  };
  check(
    qs.parse('foo=bor'),
    createWithNoPrototype([{ key: 'f__', value: 'b_r' }]), 'overriding .unescape');
  qs.unescape = prevUnescape;
}
// test separator and "equals" parsing order
check(qs.parse('foo&bar', '&', '&'), { foo: '', bar: '' }, 'separator and "equals" parsing order');
