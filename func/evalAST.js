
F.evalAST = function(ast) {
  
  F.ENV = new Environment();

  return ev(ast);
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
  if( this.hasVar(id) )
    return this.vars[id];
  if( this.parent !== undefined )
    return this.getParent().lookup(id);
  throw new Error("Unbound variable " + id);
};
Environment.prototype.setVar = function(id, val) {
  if( this.hasVar(id) )
    this.vars[id] = val;
  else if( this.parent !== undefined && this.parent.hasVar(id, true) )
    this.parent.setVar(id, val);
  else
    this.vars[id] = val;
};
Environment.prototype.getParent = function() {
  return this.parent;
};


function ev(ast) {

  if( ast === undefined || typeof ast !== 'object' )
    return ast;
  
  else {
  
    var tag = ast[0];
    var args = ast.slice(1);
  
    if( impls.hasOwnProperty(tag) ) {
      if( inputs.hasOwnProperty(tag) ) {
        for( var index = 0; index < args.length; ++index )
          args[index] = ev(args[index]);
        if( !checkArgs(args, inputs[tag]) )
          throw new Error(tag + " does not support the arguments: " + args);
      }
  
      return impls[tag].apply(undefined, args);
    }
    else
      throw new Error("Unable to find implementation for " + tag);
  }
}

function checkArgs(args, type) {
  if( typeof args != 'object' || !args.hasOwnProperty('length') )
    return typeof args == type;

  if( type == 'same' || ( arguments.length == 1 && args.length > 0 ) )
    type = typeof args[0];

  for( var ind = 0; ind < args.length; ++ind )
    if( typeof args[ind] !== type )
      return false;

  return true;
}

// inputs provides some simple typechecking for operators
var inputs = {
  "+": "number",
  "-": "number",
  "*": "number",
  "/": "number",
  "%": "number",

  "<": "number",
  ">": "number",

  "=": "same",
  "!=": "same",

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

  // things that are not typecast
  "if": function(cond, a, b) {
    if( ev(cond) )
      return ev(a);
    else
      return ev(b);
  },

  "let": function(id, val, expr) {
    F.pushStack();

    F.ENV.setVar(id, ev(val));
    var ret = ev(expr);

    F.popStack();
    return ret;
  },

  "fun": function(varlist, expr) {
    return new CFunction(varlist, expr);
  },
  "call": function(funcexpr) {
    var arglist = Array.prototype.slice.call(arguments,1);
    var func = ev(funcexpr);
    if( typeof func !== 'object' )
      throw new Error("Cannot call non-function");
    return func.exec(arglist);
  }
};

function CFunction(varlist, expr, env) {
  this.varlist = varlist;
  this.expr = expr;
  this.ENV = env || F.ENV;
};
CFunction.prototype.count_args = function() {
  return this.varlist.length;
};
CFunction.prototype.exec = function(arglist) {
    if( arglist.length > this.count_args() )
      throw new Error("Cannot call function with more arguments than expected");

    var newEnv = new Environment(this.ENV);
    for( var ind = 0; ind < arglist.length; ++ind )
      newEnv.setVar(this.varlist[ind], ev(arglist[ind]) );
    if( arglist.length < this.count_args() ) {
      return new CFunction(this.varlist.slice(arglist.length), this.expr, newEnv);
    }

    var oldENV = F.ENV;
    F.ENV = newEnv;

    var ret = ev(this.expr);
    
    F.ENV = oldENV;
    return ret;
};

