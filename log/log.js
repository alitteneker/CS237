// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------
Rule._seed_uid = 0;
Rule.prototype.getFreshName = function() {
  return '_' + ++Rule._seed_uid;
}
Rule.prototype.makeFresh = function(item, idMap) {
  var me = this;
  if( item instanceof Var ) {
    if( !idMap[item.name] )
      idMap[item.name] = me.getFreshName();
    return new Var(idMap[item.name]);
  }
  return new Clause( item.name, item.args.map( function(arg) {
    return me.makeFresh(arg, idMap);
  }));
}
Rule.prototype.makeCopyWithFreshVarNames = function() {
  var me = this, ids = {};
  return new Rule(this.makeFresh(me.head, ids), this.body.map(function(val) {
    return me.makeFresh(val, ids);
  }));
};

Clause.prototype.rewrite = function(subst) {
  return new Clause( this.name, this.args.map( function(arg) {
    return arg.rewrite(subst);
  }));
};

Var.prototype.rewrite = function(subst) {
  if( subst.lookup(this.name) )
    return subst.lookup(this.name);
  return new Var(this.name);
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------
Subst.prototype.bind = function(varName, term) {
  if( Object.keys(this.bindings).length > 0 ) {
    var subst = new Subst();
    subst.bind(varName, term);
    for( var key in this.bindings )
      this.bindings[key] = this.bindings[key].rewrite(subst);
  }
  this.bindings[varName] = term;
  return this;
};
Subst.prototype.unify = function(term1, term2, depth) {
  if( depth <= 1 ) {
    term1 = term1.rewrite(this);
    term2 = term2.rewrite(this);
  }
  if( term1 instanceof Var && term2 instanceof Var ) {
    this.bind(term1.name, term2);
    return this;
  }
  if( ( term1 instanceof Var && term2 instanceof Clause ) || ( term1 instanceof Clause && term2 instanceof Var ) ) {
    this.bind.apply(this, term1 instanceof Var ? [term1.name, term2] : [term2.name, term1]);
    return this;
  }
  if( term1 instanceof Clause && term2 instanceof Clause
    && term1.name === term2.name && term1.args.length === term2.args.length )
  {
    depth = depth || 0;
    for( var i = 0; i < term1.args.length; ++i ) {
      if( !this.unify(term1.args[i], term2.args[i], depth + 1 ) )
        return undefined;
    }
    return this;
  }
  throw new Error("Unable to unify");
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

function tryUnify(subst, term1, term2) {
  var match;
  try {
    match = subst.clone().unify( term1, term2 );
  } catch(e) {
    if( e.message != 'Unable to unify' )
      throw e;
    match = undefined;
  }
  return match;
}

// walk through the rules to try to find a solution to the given query, then check the nextQuery
function RuleWalker(program, query, nextQuery) {
  this.idx = 0;
  this.query = query;
  this.nextQuery = nextQuery;
  this.set = program.rules;
  this.program = program;
  this.bodyWalker = false;
}
RuleWalker.prototype.setQuery = function(queryClause) {
  this.query = queryClause;
  this.reset();
};
RuleWalker.prototype.nextSolution = function(subst) {
  while( this.idx < this.set.length ) {
    var rule = this.program.rules[this.idx];
    var disableIncrement = false;

    // Unify with rule head
    var match = tryUnify( subst, this.query, rule.head );

    // Unify with rule body, if it exists
    if( match && rule.body.length > 0 ) {
      if( !this.bodyWalker || this.bodyWalker.set !== rule.body )
        this.bodyWalker = new QueryChecker(this.program, rule.body, 0);
      if( match = this.bodyWalker.next(match) )
        disableIncrement = true;
    }
    else
      this.bodyWalker = false;

    // try to unify this solution with the remaining query terms
    match = match && this.nextQuery.next(match);

    // need to be sure to increment before returning if we have no child queries
    if( !disableIncrement && ( !this.nextQuery.query || !match ) )
      this.increment();

    // If we have a match, return this next solution
    if( match )
      return match;
  }

  return false;
};
RuleWalker.prototype.increment = function() {
  this.nextQuery && this.nextQuery.reset();
  this.idx++;
};
RuleWalker.prototype.reset = function() {
  this.idx = 0;
};

// recursively check each query, to make sure they are all accurate together
function QueryChecker(program, clauses, queryIdx) {
  this.set = clauses;
  this.query = clauses[queryIdx];
  this.nextQuery = this.query ? new QueryChecker(program, clauses, queryIdx + 1) : null;
  this.walker = this.query ? new RuleWalker(program, this.query, this.nextQuery) : null;
}
QueryChecker.prototype.next = function(subst) {
  if( !this.query )
    return subst;
  return this.walker.nextSolution(subst || new Subst());
};
QueryChecker.prototype.reset = function() {
  this.walker && this.walker.reset();
};

Program.prototype.solve = function() {
  for( var i = 0; i < this.rules.length; ++i )
    this.rules[i] = this.rules[i].makeCopyWithFreshVarNames();
  return new QueryChecker(this, this.query, 0);
};




//----------
