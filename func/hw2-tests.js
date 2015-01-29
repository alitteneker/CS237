tests(
  F,
  {
    name: 'recursive let',
    code: 'let f = fun n -> if n = 0\n' +
          '                 then 1\n' +
          '                 else n * f (n - 1) in\n' +
          '  f 5',
    expected: 120
  },
  {
    name: 'unbound let handling',
    code: 'let x = 1 in let x = x + 1 in x + 2',
    shouldThrow: true
  },
  {
    name: 'currying',
    code: 'let add = fun x y -> x + y in\n' +
          '  let inc = add 1 in\n' +
          '    inc 10',
    expected: 11
  },
  {
    name: 'cons',
    code: '5 + 4::0::6::nil',
    expected: ['cons', 9, ['cons', 0, ['cons', 6, null]]]
  },
  {
    name: 'cons equals',
    code: 'let x = (1+2)::(2+3) in x = x',
    expected: true
  },
  {
    name: 'list sugar',
    code: '[5 + 4;0;6]',
    expected: ['cons', 9, ['cons', 0, ['cons', 6, null]]]
  },
  {
    name: 'match',
    code: 'let lst = [1;2::3;4] in\n' +
          '  match lst with\n' +
          '    [1;x::3;y] -> y * 10 + x',
    expected: 42
  },
  {
    name: 'match failure should throw exception',
    code: 'match 5 with 6 -> 42',
    shouldThrow: true
  },
  {
    name: 'factorial w/ pattern matching',
    code: 'let f = fun n ->\n' +
          '          match n with\n' +
          '            0 -> 1\n' +
          '          | _ -> n * f (n - 1) in\n' +
          '  f 6',
    expected: 720
  },
  {
    name: 'map',
    code: 'let map = fun f l ->\n' +
          '            match l with\n' +
          '              nil -> nil\n' +
          '            | x::xs -> f x::map f xs in\n' +
          '  map (fun x -> x + 1) [1;2;3]',
    expected: ['cons', 2, ['cons', 3, ['cons', 4, null]]]
  },
  {
    name: 'set and seq',
    code: 'let counter = (let count = 0 in fun -> count := count + 1) in\n' +
          '  counter (); counter (); counter ()',
    expected: 3
  },
  {
    name: 'list comprehension w/o predicate',
    code: 'let nats = [0;1;2;3;4] in\n' +
          '  [x * 2 | x <- nats]',
    expected: ['cons', 0, ['cons', 2, ['cons', 4, ['cons', 6, ['cons', 8, null]]]]]
  },
  {
    name: 'list comprehension w/ predicate',
    code: 'let nats = [0;1;2;3;4] in\n' +
          '  [x * 2 | x <- nats, x % 2 = 0]',
    expected: ['cons', 0, ['cons', 4, ['cons', 8, null]]]
  },
  {
    name: 'delay and force',
    code: 'let take = fun n s ->\n' +
          '  match n with\n' +
          '    0 -> nil\n' +
          '  | _ -> match s with\n' +
          '           first::rest -> first::take (n - 1) (force rest) in\n' +
          'let ones = 1::delay ones in\n' +
          '  take 5 ones',
    expected:  ['cons', 1, ['cons', 1, ['cons', 1, ['cons', 1, ['cons', 1, null]]]]]
  },
  {
    name: 'force error',
    code: 'let x = 1 in let y = delay (x + 1) in x := 2; force (y+1)',
    expected: 4
    //shouldThrow: true
  },
  {
    name: 'prime number test',
    code: 'let head = fun s -> match s with x::_ -> x in ' +
          'let tail = fun s -> match s with _::dxs -> force dxs in ' +
          'let take = fun n s -> match n with 0 -> null | _ -> (head s)::take (n - 1) (tail s) in ' +
          'let ones = 1::delay ones in ' +
          'let sum = fun s1 s2 -> (head s1) + (head s2)::delay (sum (tail s1) (tail s2)) in ' +
          'let fib = 1::delay (1::delay (sum fib (tail fib))) in ' +
          'let filterMultiples = fun n s -> if head s % n = 0 then filterMultiples n (tail s) else (head s)::delay (filterMultiples n (tail s)) in ' +
          'let sieve = fun s -> (head s)::delay (sieve (filterMultiples (head s) (tail s))) in ' +
          'let intsFrom = fun n -> n::delay (intsFrom (n + 1)) in ' +
          'let primes = sieve (intsFrom 2) in ' +
          'let first = fun p s -> if p (head s) then head s else first p (tail s) in ' +
          'first (fun x -> x > 1502) primes',
    expected: 1511
  }
);

