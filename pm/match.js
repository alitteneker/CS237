
// Globals
var _ = {}, bindings;

function match(value /* , pat1, fun1, pat2, fun2, ... */) {
  var args = Array.prototype.slice.call(arguments, 1);
  while( args.length > 1 ) {
    var pattern = args[0];
    var fun = args[1];
    bindings = [];

    if( checkMatch(value, pattern) ) {
      return fun.apply(undefined, bindings);
    }
    args = args.slice(2);
  }
  throw new Error("Match failure!");
}

function checkMatch(value, pattern) {
  if( pattern === value )
    return true;
  else if( typeof pattern === 'function' && pattern(value) )
    return true;
  else if( pattern === _ ) {
    bindings.push(value);
    return true;
  }
  if( pattern instanceof cMany && value instanceof Array ) {
    var oldBindings = bindings;
    bindings = [];
    
    var ret = false;
    while( value.length > 0 ) {
      if( checkMatch(value[0], pattern.pat) )
        ret = true;
      else
        break;
      value.shift();
    }

    oldBindings.push(bindings);
    bindings = oldBindings;

    return ret;
  }
  else if( pattern !== null && value !== null
      && typeof pattern === 'object' && typeof value === 'object'
      && pattern.length > 0 && value.length > 0 ) {
    if( pattern[0] instanceof cMany ) {
      if( checkMatch(value, pattern[0]) ) {
        if( value.length > 0 || pattern.length > 1 )
          return checkMatch(value, pattern.slice(1));
        return true;
      }
      return false;
    }
    else if( pattern.length == 1 && value.length == 1 )
      return checkMatch(value[0], pattern[0]);
    return checkMatch(value[0], pattern[0]) && checkMatch(value.slice(1), pattern.slice(1));
  }
  return false;
}

// WHEN
function when(pattern) {
  return function(value) {
    if( checkMatch(value, pattern) ) {
      bindings.push(value);
      return true;
    }
    return false;
  };
}

// MANY
function cMany(pattern) {
  this.pat = pattern;
}
function many(pattern) {
  return new cMany(pattern);
}


