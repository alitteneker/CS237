
// Globals
var _ = {}, _nc = {}, bindings;

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
  if( pattern === _nc || pattern === value || ( typeof pattern === 'function' && pattern(value) ) )
    return true;
  else if( pattern === _ ) {
    bindings.push(value);
    return true;
  }
  else if( pattern instanceof RegExp ) {
    var found = pattern.exec(value.toString());
    if( found !== null ) {
      if( found.length > 1 )
        bindings.push(found.slice(1));
      return true;
    }
  }
  else if( pattern instanceof cMany || pattern instanceof oPattern ) {
    return pattern._match(value);
  }
  else if( pattern !== null && value !== null
      && pattern instanceof Array && value instanceof Array
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
  else if( pattern !== null && !(pattern instanceof Array)
          && typeof pattern === 'object' && typeof value === 'object') {
    var ret = false;
    try {
      if( checkMatch(value, matchObj(pattern)) )
        ret = true;
    } catch(e) {
      console.log("Warning: error in object match")
    };
    return ret;
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
cMany.prototype._match = function(value) {
  var pattern = this.pat;
  if( !(value instanceof Array) )
    return false;

  var oldBindings = bindings;
  bindings = [];

  var ret = false;
  while( value.length > 0 ) {
    if( checkMatch(value[0], pattern) )
      ret = true;
    else
      break;
    value.shift();
  }

  oldBindings.push(bindings);
  bindings = oldBindings;

  return ret;
}
function many(pattern) {
  return new cMany(pattern);
}


// LOGICAL COMBINATIONS (variable arg length, with safe short circuiting)
function and() {
  var patterns = Array.prototype.slice.call(arguments, 0);
  return function(value) {
    var ret = true, ind = -1, old_bindings = bindings, len = patterns.length;
    bindings = [];
    while( ret && ++ind < len )
      ret = ret && checkMatch(value, patterns[ind]);
    if( ret )
      old_bindings = old_bindings.concat(bindings);
    bindings = old_bindings;
    return ret;
  }
}
function or() {
  var patterns = Array.prototype.slice.call(arguments, 0);
  return function(value) {
    var ret = false, ind = -1, len = patterns.length, old_bindings;
    while( !ret && ++ind < len ) {
      old_bindings = bindings;
      bindings = [];
      if( Boolean(ret = checkMatch(value, patterns[ind])) )  // friggin strict checks
        old_bindings = old_bindings.concat(bindings);
      bindings = old_bindings;
    }
    return ret;
  }
}
function not(pattern) {
  return function(value) {
    return !checkMatch(value, pattern);
  }
}

/**
  // =======================
  // === OBJECT MATCHING ===
  // =======================
  // INPUTS:
  
  // no KV definition causes everything to be assumed to be required
  oPattern({ key_name: val_pattern, ... }, boolean)

  // specify key_values explicitly
  oPattern([
    {
      name: key_name,
      type: 'allowed* | required | disallowed',
      key_pattern: key_name* | pattern,
      val_pattern: _nc* | pattern,
      multiple: boolean,
    },
    ...
  ])

  // can combine definition styles
  oPattern({ ... },
    [ { ... }, ... ],
    boolean
  })
  
  // OUTPUTS:
  
  // always returns an object, but the value of each key varies by 
  {
    key_name: value,
    key_name: [ val_bindings ],
    key_name: { keys: [ key_bindings_1, ... ], values: [ val_bindings_1, ... ] }
  }
*/
function matchObj(oPat, ePat, extras) {
  return new oPattern(oPat, ePat, extras);
}
function oPattern(oPat, ePat, extras) {
  this.required = [];
  this.key_values = [];
  this.allow_extras = typeof ePat === 'boolean' ? ePat : typeof extras === 'boolean' ? extras : true;

  if( oPat instanceof Array ) {
    ePat = oPat;
    oPat = null;
  }
  
  this.decomposePattern(oPat, ePat);
}
oPattern.prototype.decomposePattern = function(oPat, ePat) {
  var ind, keys, key_values, consider, name_types = {};
  if( oPat && oPat instanceof Object ) {
    keys = [];
    for( key in oPat )
      keys.push( key );
    for( ind = 0; ind < keys.length; ++ind ) {
      consider = {
        name: keys[ind],
        type: 'required',
        key_pattern: keys[ind],
        val_pattern: oPat[keys[ind]]
      };
      name_types[consider.name] = consider.type;
      this.key_values.push(consider);
    }
  }
  if( ePat && ePat instanceof Array && ( key_values = ePat ) ) {
    for( ind = 0; ind < key_values.length; ++ind ) {
      consider = jQuery.extend(
        {
          type: 'required',
          key_pattern: key_values[ind].name,
          val_pattern: _nc,
          multiple: true
        },
        key_values[ind]
      );
      name_types[consider.name] = consider.type;
      this.key_values.push(consider);
    }
  }

  for( ind = 0; ind < this.key_values.length; ++ind ) {
    this.key_values[ind].index = ind;
    if( this.key_values[ind].name === undefined )
      throw new Error("Cannot define key without name property");
    if( !/^(?:required|allowed|disallowed)$/.test(this.key_values[ind].type) )
      throw new Error("Illegal type " + this.key_values[ind].type);
    if( this.key_values[ind].type === 'required' )
      this.required.push(this.key_values[ind].index);
  }
  this.required.dedup();
}

/**
 * Bit of a tangent here, but it's necessary for the below. There are some things we need to setup.
 * We want to be able to build a resultant binding dictionary that follows the format above the oPattern
 * definition. But there's a problem; we need to be able to create something that is structured as an
 * array or object, while maintaining the ability to differentiate it from an array or object resulting
 * from a nested match. To address this conundrum, we create two 'classes', funtionally identical to
 * arrays/objects, which can be easily differentiated from their more basic siblings with instanceof.
 */
function cArray() { Array.apply(this, arguments) }
cArray.prototype = Object.create(Array.prototype);
cArray.prototype.constructor = cArray;
cArray.prototype.toJSON = function() {
  var ret = [];
  for( var ind = 0; ind < this.length; ++ind )
    ret.push( JSON.stringify(this[ind]) );
  return '[' + ret.join(', ') + ']';
};
function cObject() {
  this.keys   = new cArray();
  this.values = new cArray();
}

oPattern.prototype._checkKVMatch = function(key, value, bind, definition) {
  // save the original bindings, and create some new kv specific binding
  var ret, existing,
      old_bindings = bindings,
      key_bindings = [],
      val_bindings = [];

  // check our definition's patterns with the kv bindings properly set
  bindings = key_bindings;
  ret = checkMatch(key, definition.key_pattern);
  if( ret ) {
    bindings = val_bindings;
    ret = checkMatch(value, definition.val_pattern);
  }
  
  // if we've found a match, and some results were bound, bind the results in the bind object
  if( ret && ( val_bindings.length || key_bindings.length ) ) {
    existing = bind[definition.name];
    key_bindings = key_bindings.length > 0 ? ( key_bindings.length == 1 ? key_bindings[0] : key_bindings ) : definition.name;
    val_bindings = val_bindings.length > 0 ? ( val_bindings.length == 1 ? val_bindings[0] : val_bindings ) : value;
    if( key_bindings instanceof Array || key_bindings !== definition.name ) {
      if( !(existing instanceof cObject) ) {
        bind[definition.name] = new cObject();
        if( existing !== undefined ) {
          bind[definition.name].values = existing instanceof cArray ? existing : new cArray(existing);
          bind[definition.name].keys = [].fill.call({ length: existing.length }, definition.name);
        }
      }
      bind[definition.name].keys.push(key_bindings);
      bind[definition.name].values.push(val_bindings);
    }
    else if( existing !== undefined ) {
      if( existing instanceof cArray )
        existing.push(val_bindings);
      else if( existing instanceof cObject ) {
        existing.keys.push(key_bindings);
        existing.values.push(val_bindings);
      }
      else {
        bind[definition.name] = new cArray();
        bind[definition.name].push(existing, val_bindings);
      }
    }
    else
      bind[definition.name] = val_bindings;
  }
  
  // restore the original bindings, and return the result
  bindings = old_bindings;
  return ret;
}
oPattern.prototype._checkMatch = function(key, value, bind, match) {
  var ind,
      definition,
      ret = null;
  for( ind = 0; !ret && ind < this.key_values.length; ++ind ) {
    definition = this.key_values[ind];
    if( match[definition.name] && !definition.multiple )
      continue;
    if( this._checkKVMatch(key, value, bind, definition) ) {
      match[definition.name] = true;
      ret = definition;
    }
  }
  return ret;
}
oPattern.prototype._match = function(value) {
  var ind,
      length = 0,
      val_keys = [],
      val_vals = [],
      found_required = [],
      bind = {},
      match = {},
      result;

  if( !(value instanceof Object) )
    return false;

  // construct easier to iterate through 
  for( ind in value ) {
    val_keys.push(ind);
    ++length;
  }
  val_keys.sort();
  for( ind = 0; ind < length; ++ind )
    val_vals.push(value[val_keys[ind]]);

  // check all keys in the object
  for( ind = 0; ind < length; ++ind ) {
    result = this._checkMatch(val_keys[ind], val_vals[ind], bind, match);
    if( result === null ) {
      if( !this.allow_extras )
        return false;
    }
    else if( result.type === 'disallowed' )
      return false;
    else if( result.type === 'required' )
      found_required.push(result.name);
  }

  // ensure all required elements are found
  found_required.dedup();
  if( this.required.length !== found_required.length )
    return false;

  if( Object.keys(bind).length === 0 )
    bind = value;
  bindings.push(bind);
  return true;
}


// Order preserving inline deduplication function
Array.prototype.dedup = function() {
  var found = {};
  for( var ind = 0; ind < this.length; ++ind ) {
    if( found[this[ind]] )
      this.splice(ind--, 1);
    else
      found[this[ind]] = true;
  }
  return this;
}



