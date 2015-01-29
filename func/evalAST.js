
F.evalAST = function(ast) {
  
  F.ENV = new Environment();

  var ret = ev(ast);
  if( isDelayed(ret) )
    throw new Error("Cannot evaluate whole expression to delayed value");
  return ret;
};

F.pushStack = function() {
  F.ENV = new Environment(F.ENV);
}
F.popStack = function() {
  var parent = F.ENV.getParent();
  if( parent )
    F.ENV = F.ENV.getParent();
};

function Environment(parent) {
  this.parent = parent;
  this.vars = {};
}
Environment.prototype.hasVar = function(id, checkParent) {
  var ret = this.vars.hasOwnProperty(id);
  if( (!ret) && checkParent && this.parent !== undefined )
    ret = this.getParent().hasVar(id);
  return ret;
};
Environment.prototype.lookup = function(id) {
  if( this.hasVar(id) ) {
    if( this.vars[id] === undefined )
      throw new Error("Cannot use still unbound variable '"+id+"'");
    return this.vars[id];
  }
  if( this.parent !== undefined )
    return this.getParent().lookup(id);
  throw new Error("Unbound variable '" + id + "'");
};
Environment.prototype.setVar = function(id, val, local) {
  if( local || this.hasVar(id) )
    this.vars[id] = val;
  else if( this.parent !== undefined && this.parent.hasVar(id, true) )
    this.parent.setVar(id, val);
  else
    throw new Error("Cannot set value of unbound identifier '"+id+"'");
};
Environment.prototype.setParent = function(newPar) {
  this.parent = newPar;
};
Environment.prototype.getParent = function() {
  return this.parent;
};

function ev(ast) {

  if( isPrimitive(ast) )
    return ast;

  else {
  
    var tag = ast[0];
    var args = ast.slice(1);
  
    if( impls.hasOwnProperty(tag) ) {
      if( inputs.hasOwnProperty(tag) ) {
        for( var index = 0; index < args.length; ++index )
          args[index] = ev(args[index]);
        if( !checkArgs(args, inputs[tag]) )
          throw new Error("'" + tag + "' does not support the arguments: " + astToString(args, true) );
      }
  
      return impls[tag].apply(undefined, args);
    }
    else
      throw new Error("Unable to find implementation for '" + tag + "'");
  }
}

function isPrimitive(ast) {
  return ast === undefined || ast === null || typeof ast !== 'object' || ast[0] === 'closure';
}

function getType(ast) {
  if( ast === undefined )
    return 'undefined';
  if( ast === null )
    return 'null';
  if( typeof ast === 'object' )
    return ast[0];
  return typeof ast;
}

function checkArgs(args, type) {
  if( type === 'any' )
    return true;

  if( type == 'same' || ( arguments.length == 1 && args.length > 0 ) )
    type = typeof args[0];

  for( var ind = 0; ind < args.length; ++ind )
    if( getType(args[ind]) !== type )
      return false;

  return true;
}

// inputs provides some simple typechecking for operators
// an entry to this structure also forces all args to be evaluated before calling the implementation
var inputs = {
  "+": "number",
  "-": "number",
  "*": "number",
  "/": "number",
  "%": "number",

  "<": "number",
  ">": "number",

  "=": "any",
  "!=": "any",

  "and": "boolean",
  "or": "boolean",
};

var impls = {
  "+": function(a, b) {
    return a + b;
  },
  "-": function(a, b) {
    return a - b;
  },
  "*": function(a, b) {
    return a * b;
  },
  "/": function(a, b) {
    return a / b;
  },
  "%": function(a, b) {
    return a % b;
  },

  "<": function(a, b) {
    return a < b;
  },
  ">": function(a, b) {
    return a > b;
  },

  "=": function(a, b) {
    return a === b;
  },
  "!=": function(a, b) {
    return a !== b;
  },

  "and": function(a, b) {
    return a && b;
  },
  "or": function(a, b) {
    return a || b;
  },

  "id": function(id) {
    return F.ENV.lookup(id);
  },
  "set": function(id, expr) {
    var val = ev(expr);
    F.ENV.setVar(id, val);
    return val;
  },

  "seq": function(a, b) {
    ev(a);
    return ev(b);
  },

  // things that are not auto type checked
  "if": function(cond, a, b) {
    var condVal = ev(cond);
    if( typeof condVal !== 'boolean' )
      throw new Error("'if' condition must evaluate to boolean");
    if( condVal )
      return ev(a);
    else
      return ev(b);
  },

  "let": function(id, val, expr) {
    F.pushStack();

    F.ENV.setVar(id, undefined, true);

    var variable = ev(val);
    F.ENV.setVar(id, variable, true);

    var ret = ev(expr);

    F.popStack();
    return ret;
  },

  "fun": function(varlist, expr) {
    return ['closure', varlist, expr, F.ENV];
  },
  "call": function(funcexpr) {
    var arglist = Array.prototype.slice.call(arguments, 1);
    var func = ev(funcexpr);
    if( getType(func) !== 'closure' )
      throw new Error("Cannot call non-function");
    return callFunc(func, arglist);
  },

  // implementations for lists et al
  "cons": function(a, b) {
    return ["cons", ev(a), ev(b)];
  },
  "match": function(expr) {
    var val = ev(expr),
        args = Array.prototype.slice.call(arguments, 1),
        ret = undefined;
    while( args.length > 0 ) {
      var pattern = args[0];
      var expr = args[1];
      F.pushStack();
      if( checkMatch(pattern, val) ) {
        ret = ev(expr);
        args = [];
      }
      else
        args = args.slice(2);
      F.popStack();
    }
    if( ret === undefined )
      throw new Error("Match failure");
    return ret;
  },
  "listComp": function(expr, id, list, pred) {
    var listVal = ev(list);
    if( getType(listVal) !== 'cons' )
      throw new Error('"listComp" requires a list');
    return doListComp(expr, id, ev(list), pred);
  },

  // delay and force
  "delay": function(a, env) {
    return ['delay', a, env || F.ENV];
  },
  "force": function(a) {
    return doForce(a);
  }
};

// this function is recursive to allow for forcing of variables buried in expressions
function doForce(expr) {
  if( expr !== null && typeof expr === 'object' ) {
    if( expr[0] === 'delay' ) {
      var oldENV = F.ENV;
      if( expr.length > 2 )
        F.ENV = expr[2];
      var ret = ev(expr[1]);
      F.ENV = oldENV;
      return ret;
    }
    if( expr[0] === 'cons' ) {
      return ev( [ 'cons', doForce(expr[1]), doForce(expr[2]) ] );
    }
    return doForce( ev( expr.map(function(val){ return doForce(val) }) ) );
  }
  return expr;
}
function isDelayed(ast) {
  if( !isPrimitive(ast) && typeof ast === 'object' && ast.length > 0 ) {
    if( ast[0] === 'delay' )
      return true;
    for( var ind = 0; ind < ast.length; ++ind )
      if( isDelayed(ast[ind]) )
        return true;
    return false;
  }
  return false;
}

function doListComp(expr, id, val, pred) {
  if( isPrimitive(val) ) {
    F.pushStack();
    F.ENV.setVar(id, val, true);
    if( pred ) {
      var predVal = ev(pred);
      if( predVal === false ) {
        F.popStack();
        return undefined;
      }
    }
    var retVal = ev(expr);
    F.popStack();
    return retVal;
  }
  if( val !== null && typeof val === 'object' && val[0] == 'cons' ) {
    var left  = doListComp(expr, id, val[1], pred),
        right = val[2] === null ? null : doListComp(expr, id, val[2], pred);
    if( left === undefined || right === undefined )
      return left === undefined ? right : left;
    return ['cons', left, right];
  }
  return val;
}

function checkMatch(pattern, val) {
  if( pattern === null && val === null )
    return true;
  if( typeof pattern === 'object' && pattern !== null ) {
    if( pattern[0] === '_' )
      return true;
    if( pattern[0] === 'id' ) {
      F.ENV.setVar(pattern[1], val, true);
      return true;
    }
    if( pattern[0] === 'cons' && ( typeof val === 'object' && val[0] === 'cons' ) )
      return checkMatch(pattern[1], val[1]) && checkMatch(pattern[2], val[2]);
  }
  return pattern === val;
}

function callFunc(func, arglist) {
  var varlist = func[1],
      expr = func[2],
      closure = func[3];

  if( arglist.length > varlist.length )
    throw new Error("Cannot call function with more arguments than expected");

  var newEnv = new Environment(closure);
  for( var ind = 0; ind < arglist.length; ++ind )
    newEnv.setVar(varlist[ind], ev(arglist[ind]), true);

  // this enables currying
  if( arglist.length < varlist.length )
    return ['closure', varlist.slice(arglist.length), expr, newEnv];

  var oldENV = F.ENV;
  F.ENV = newEnv;

  var ret = ev(expr);
    
  F.ENV = oldENV;
  return ret;
};

function astToString(ast, shallow) {
  if( typeof ast === 'object' && ast.length > 0 ) {
    if( shallow && typeof ast[0] === 'string' )
      return getType(ast);

    var ret = "[";
    for( var ind = 0; ind < ast.length; ++ind )
      ret += ( ind > 0 ? ", " : "" ) + astToString(ast[ind], shallow);
    return ret + ']';
  }
  return "" + ast;
}
