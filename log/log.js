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
  if( subst.bindings[this.name] )
    return subst.bindings[this.name];
  return this;
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

Subst.prototype.unify = function(term1, term2) {
  throw new TODO("Subst.prototype.unify not implemented");
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

Program.prototype.solve = function() {
  throw new TODO("Program.prototype.solve not implemented");
};
