// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------
Rule._seed_uid = 0;
Rule.prototype.getFreshName = function() {
  return '_' + ++Rule._seed_uid;
}
Rule.prototype.makeCopyWithFreshVarNames = function() {
  var me = this;
  var ids = {};
  return new Rule(
    new Clause(this.head.name, this.head.args.map(function(arg) {
      if( !ids[arg] )
        ids[arg] = me.getFreshName();
      return new Var(ids[arg]);
    })),
    this.body.map(function(val) {
      return new Clause(val.name, val.args.map(function(arg) {
        if( !ids[arg] )
          ids[arg] = me.getFreshName();
        return new Var(ids[arg]);
      }));
    })
  );
};

Clause.prototype.rewrite = function(subst) {
  return new Clause( this.name, this.args.map( function(arg) { return arg.rewrite(subst); }) );
};

Var.prototype.rewrite = function(subst) {
  if( subst.lookup(this.name) )
    return subst.lookup(this.name);
  return this;
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

Subst.prototype.unify = function(term1, term2) {
  term1 = term1.rewrite(this);
  term2 = term2.rewrite(this);
  if( term1 instanceof Var && term2 instanceof Var ) {
    this.bind(term1.name, term2);
    return this;
  }
  if( ( term1 instanceof Var && term2 instanceof Clause ) || ( term1 instanceof Clause && term2 instanceof Var ) ) {
    this.bind.apply(this, term1 instanceof Var ? [term1.name, term2] : [term2.name, term1]);
    return this;
  }
  if( term1 instanceof Clause && term2 instanceof Clause ) {
    if( term1.name === term2.name && term1.args.length === term2.args.length ) {
      for( var i = 0; i < term1.args.length; ++i ) {
        if( !this.unify(term1.args[i], term2.args[i]) )
          return undefined;
      }
      return this;
    }
  }
  throw new Error("Unable to unify");
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

Program.prototype.solve = function() {
  throw new TODO("Program.prototype.solve not implemented");
};
