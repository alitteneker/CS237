// This function is used by the test harness to pretty-print values.
// Right now it doesn't handle undefined, functions, NaN, Number.POSITIVE_INFINITY, etc.
// Feel free to modify / extend it as you see fit.
// (FYI, pretty-printing is not used by our grading scripts.)

function prettyPrintValue(value) {
  return JSON.stringify(value);
}

// Helper functions used in the tests

function greaterThan(n) {
  return function(x) { return x > n; };
}

function isNumber(x) {
  return typeof x === 'number';
}

// Tests!

tests(
  {
    name: 'wildcard',
    code: 'match(123,\n' +
          '  _, function(x) { return x + 2; }\n' +
          ')',
    expected: 125
  },
  {
    name: 'literal pattern',
    code: 'match(123,\n' +
          '  42,  function() { return "aaa"; },\n' +
          '  123, function() { return "bbb"; },\n' +
          '  444, function() { return "ccc"; }\n' +
          ')',
    expected: "bbb"
  },
  {
    name: 'array pattern',
    code: 'match(["+", 5, 7],\n' +
          '  ["+", _, _], function(x, y) { return x + y; }\n' +
          ')',
    expected: 12
  },
  {
    name: 'when',
    code: 'match(5,\n' +
          '  when(greaterThan(8)), function(x) { return x + " is greater than 8"; },\n' +
          '  when(greaterThan(2)), function(x) { return x + " is greater than 2"; }\n' +
          ')',
    expected: "5 is greater than 2"
  },
  {
    name: 'regex pattern',
    code: 'match("hello bob",\n'+
          '  /hello\\s+(\\w+)/, function(name) { return "My name is "+name; }\n' +
          ')',
    expected: 'My name is bob'
  },
  {
    name: 'many',
    code: 'match(["sum", 1, 2, 3, 4],\n' +
          '  ["sum", many(when(isNumber))], function(ns) {\n' +
          '                                   return ns.reduce(function(x, y) { return x + y; });\n' +
          '                                 }\n' +
          ')',
    expected: 10
  },
  {
    name: 'many pairs',
    code: 'match([[1, 2], [3, 4], [5, 6]],\n' +
          '  [many([_, _])], function(pts) { return JSON.stringify(pts); }\n' +
          ')',
    expected: "[1,2,3,4,5,6]"
  },
  {
    name: 'content after many',
    code: 'match([1, 2, 3, "and", 4], [many(when(isNumber)), "and", _], function(xs, x) { return xs.length + " numbers followed by a " + x; })',
    expected: '3 numbers followed by a 4'
  },
  {
    name: 'many over consumption error',
    code: 'match([1, 2, 3, "and", 4], [many(_), "and", _], function(xs, x) { return "This should not work" })',
    shouldThrow: true
  },
  {
    name: 'first match wins',
    code: 'match(123,\n' +
          '  _,   function(x) { return x; },\n' +
          '  123, function()  { return 4; }\n' +
          ')',
    expected: 123
  },
  {
    name: 'match failed',
    code: 'match(3,\n' +
          '  1,   function() { return 1; },\n' +
          '  2,   function() { return 2; },\n' +
          '  [3], function() { return 3; }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'non capture group',
    code: 'match([10, 123],\n' +
          '  [_nc, _],   function(x) { return x; }\n' +
          ')',
    expected: 123
  },
  {
    name: 'and',
    code: 'match(123,\n' +
          '  and(/1(\\d)3/, /12(\\d)/), function(x, y) { return x * y; }\n' +
          ')',
    expected: 6
  },
  {
    name: 'or',
    code: 'match(123,\n' +
          '  or(/1(\\d)3/, /12(\\d)/), function(x) { return Number(x); }\n' +
          ')',
    expected: 2
  },
  {
    name: 'backtrack',
    code: 'match(123,\n' +
          '  or(and(/12(\\d)/, 124), /\\d(\\d)\\d/), function(x) { return Number(x); }\n' +
          ')',
    expected: 2
  },
  {
    name: 'nested many',
    code: 'match([[1,2,3],[5,6]], [many([many(_)])], function(value) {return value})',
    expected: [[1,2,3],[5,6]]
  },
  {
    name: 'basic object',
    code: 'match({ a: 1, hello: "world", b: 2, hola: "mundo", c: 3 },\n'+
          '  matchObj({ hello: _, hola: /\\w{5}/ }), function(result) { return result }' +
          ')',
    expected: { hello: 'world', hola: 'mundo' }
  },
  {
    name: 'multiple basic object patterns',
    code: 'match({ hello: 1, world: 2, foo: "bar" },\n'+
          '  matchObj({ hello: /^\\D$/ }), function(x) { return x.hello },\n' +
          '  matchObj({ foo: /^\\w{3}$/ }), function(x) { return x.foo }\n' +
          ')',
    expected: 'bar'
  },
  {
    name: 'object pattern by simple value',
    code: 'match({ hello: 3, foo: 4, world: 3, bar: "123" },\n' +
          '  matchObj([{ name: "threes", key_pattern: _, val_pattern: 3 }]),\n' +
          '  function(x) { return x.threes.keys; }\n'+
          ')',
    expected: [ 'hello', 'world' ]
  }
);

