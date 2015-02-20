function cClass(name, superClass, instVars) {
	this.cname = name;
	this.superClass = superClass;
	this.varNames = [];
	this.methods = {};

	for( var ind = 0; ind < instVars.length; ++ind ) {
		if( this.hasVar(instVars[ind]) )
		  throw new Error("Duplicate variable definition for " + name + ": '" + instVars[ind] + "'");
		this.varNames.push(instVars[ind]);
	}
}
cClass.prototype.getSuperClass = function(name) {
	var def = this.superClass;
	while( def !== null ) {
		if( def.cname === name )
			return def;
	}
	throw new Error("Unable to find super class of " + this.cname + " with name '" + name + "'");
};
cClass.prototype.hasSuperClass = function() {
	return this.superClass !== null;
};
cClass.prototype.hasVar = function(name, local) {
	var def = this, index;
	while( def !== null ) {
		if( def.varNames.indexOf(name) >= 0 )
	  	return true;
	  def = local ? null : def.superClass;
	}
	return false;
};
cClass.prototype.hasMethod = function(name, local) {
	var def = this;
	while( def !== null ) {
		if( def.methods.hasOwnProperty(name) )
	  	return true;
		def = local ? null : def.superClass;
	}
	return false;
};
cClass.prototype.addMethod = function(name, fn) {
	if( this.hasMethod(name, true) )
		throw new Error("Class " + this.cname + " already has method '" + name + "'");
	this.methods[name] = fn;
};
cClass.prototype.getMethod = function(name, cname) {
	var def = this;
	while( def !== null ) {
		if( def.methods.hasOwnProperty(name) && ( cname === undefined || def.cname === cname ) )
		  return def.methods[name];
		def = def.superClass;
	}
	throw new Error("Unable to find method '" + name + "'");
};
cClass.prototype.instantiate = function(args) {
	return new cInstance(this, args);
}

function cInstance(classType, args) {
	this.classType = classType;
	this.vars = {};
	this.callMethod('initialize', args);
}
cInstance.prototype.checkVarAllowed = function(name) {
	if( !this.classType.hasVar(name) )
		throw new Error("Class " + this.classType.cname + " does not have variable with name '" + name + "'");
}
cInstance.prototype.getVar = function(name) {
	this.checkVarAllowed(name);
	return this.vars[name];
};
cInstance.prototype.setVar = function(name, value) {
	this.checkVarAllowed(name);
	return (this.vars[name] = value);
};
cInstance.prototype.callMethod = function(fn, args) {
	if( !(typeof fn === 'function') )
	  fn = this.classType.getMethod(fn);
	return fn.apply(this, [this].concat(args));
};

var OO = {
	classTable: {},
	hasClass: function(name) {
		return this.classTable.hasOwnProperty(name);
	},
	getClass: function(name) {
		if( name === null )
		  return null;
		if( this.hasClass(name) )
		  return this.classTable[name];
		throw new Error("Class '" + name + "' is not defined");
	},
	declareClass: function(name, superClassName, instVarNames) {
		if( this.hasClass(name) )
		  throw new Error("Class with name '" + name + "' is already defined");
		this.classTable[name] = new cClass(name, this.getClass(superClassName), instVarNames);
	},
	declareMethod: function(className, selector, implFn) {
		this.getClass(className).addMethod(selector, implFn);
	},
	instantiate: function(className) {
		var classDef = this.getClass(className);
		return classDef.instantiate(Array.prototype.slice.call(arguments, 1));
	},
	send: function(recv, selector) {
		var args = Array.prototype.slice.call(arguments, 2);
		if( typeof recv === 'number' )
			return this.getClass('Number').getMethod(selector).apply(recv, [recv].concat(args));
		return recv.callMethod(selector, args);
	},
	superSend: function(superClassName, recv, selector) {
		var meth = recv.classType.getMethod(selector, superClassName);
		return recv.callMethod( meth, Array.prototype.slice.call(arguments, 3) );
	},
	getInstVar: function(recv, instVarName) {
		return recv.getVar(instVarName);
	},
	setInstVar: function(recv, instVarName, value) {
		return recv.setVar(instVarName, value);
	}
};

OO.initializeCT = function() {
	this.classTable = {};

	OO.declareClass( "Object", null, []);
	OO.declareMethod("Object", "initialize", function(_this)        {  });
	OO.declareMethod("Object", "isNumber",   function(_this)        { return false; });
	OO.declareMethod("Object", "===",        function(_this, other) { return _this === other; });
	OO.declareMethod("Object", "!==",        function(_this, other) { return _this !== other; });

	OO.declareClass( "Number", "Object", []);
	OO.declareMethod("Number", "isNumber",   function(_this)        { return true; });
	OO.declareMethod("Number", "+",          function(_this, other) { return _this + other; });
	OO.declareMethod("Number", "-",          function(_this, other) { return _this - other; });
	OO.declareMethod("Number", "*",          function(_this, other) { return _this * other; });
	OO.declareMethod("Number", "/",          function(_this, other) { return _this / other; });
	OO.declareMethod("Number", "%",          function(_this, other) { return _this % other; });
};
