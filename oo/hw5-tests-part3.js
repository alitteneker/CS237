// Initialize the class table!

OO.initializeCT();

// Tests for Part II

tests(O,
  {
    name: 'thenElse (1/2)',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          '1 > 2 then {111} else {222}',
    expected: 222
  },
  {
    name: 'thenElse (2/2)',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          '1 < 2 then {111} else {222}',
    expected: 111
  },
  {
    name: 'non-local return (1/2)',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n\n' +
          'def Number.fact() {\n' +
          '  this === 0 then {\n' +
          '    return 1;\n' +
          '  } else {\n' +
          '    return this * (this - 1).fact();\n' +
          '  }\n' +
          '}\n\n' +
          '5.fact()',
    expected: 120
  },
  {
    name: 'non-local return (2/2)',
    code: 'def Object.m() {\n' +
          '  var b = { return 5; };\n' +
          '  return this.n(b) * 2;\n' +
          '}\n\n' +
          'def Object.n(aBlock) {\n' +
          '  aBlock.call();\n' +
          '  return 42;\n' +
          '}\n\n' +
          'new Object().m()',
    expected: 5
  },

  /* Extras from piazza - By David Torosyan */
  {
    name: 'implicit return (1/2)',
    code: '{ var x = 1; x + 2; var y = 2;}.call()\n',
    expected: 3
  },
  {
    name: 'implicit return (2/2)',
    code: 'class RefCell with value;\n' +
          'def RefCell.initialize(value) { this.value = value; }\n' +
          'def RefCell.get() = this.value;\n' +
          'def RefCell.set(value) { \n' +
          '    {\n' +
          '        null;\n' +
          '        this.value = value;\n' +
          '    }.call()\n' +
          '}\n' +
          'var r = new RefCell(1);\n' +
          'r.set(2);\n' +
          'r.get();\n',
    expected: 2
  },
  {
    name: 'null return block',
    code: '{}.call()\n',
    expected: null
  },
  {
    name: 'null return method',
    code: 'def Object.foo() {\n' +
          '1;\n' +
          '}\n' +
          '\n' +
          'new Object().foo()\n',
    expected: null
  },
  {
    name: 'ans',
    code: '1;\n' +
          'def Object.m() {\n' +
          '}\n',
    expected: 1
  },
  {
    name: 'recursive non-local return',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          '\n' +
          'def Object.foo(first) {\n' +
          '  first\n' +
          '    then { this.bar(); }\n' +
          '    else { \n' +
          '      var b =  {return 5;}; \n' +
          '      return b;\n' +
          '    }\n' +
          '}\n' +
          '\n' +
          'def Object.bar() {\n' +
          '  this.foo(false).call();\n' +
          '}\n' +
          '\n' +
          'new Object().foo(true)\n',
    shouldThrow: true
  },
  {
    name: 'floating return',
    code: '{return 1;}.call()\n',
    shouldThrow: true
  },
  {
    name: 'while loop',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          'def Block while body = this.call() then {body.call(); this while body; } else {};\n' +
          '\n' +
          'var i = 0;\n' +
          'var sum = 0;\n' +
          '{i < 10} while {\n' +
          '    i = i + 1;\n' +
          '    sum = sum + i;\n' +
          ' };\n' +
          ' \n' +
          ' sum;\n',
    expected: 55
  },
  {
    name: 'do while loop',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          'def Block while body = this.call() then {body.call(); this while body; } else {};\n' +
          'def Block doWhile cond {\n' +
          '    this.call();\n' +
          '    cond.call() then {this doWhile cond;} else {};\n' +
          '}\n' +
          '\n' +
          'var i = 0;\n' +
          'var sum = 0;\n' +
          '{\n' +
          '    i = i + 1;\n' +
          '    sum = sum + i;\n' +
          ' } doWhile {i < 10};\n' +
          ' \n' +
          ' sum;\n',
    expected: 55
  },
  {
    name: 'for loop',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          'def Number to n do body = this <= n then {body.call(this); this+1 to n do body} else {};\n' +
          '\n' +
          'var sum = 0;\n' +
          '0 to 10 do {\n' +
          '    i | sum = sum + i;\n' +
          ' };\n' +
          ' \n' +
          ' sum;\n',
    expected: 55
  },
  {
    name: 'floating this',
    code: 'this;\n',
    shouldThrow: true
  },
  {
    name: 'floating super',
    code: 'super.foo();\n',
    shouldThrow: true
  },
  {
    name: 'Object super',
    code: 'def Object.foo() { return super.foo(); };\n',
    shouldThrow: true
  }
);
