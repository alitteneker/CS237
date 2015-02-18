function cClass(name, superClass, instVars) {
	this.cname = name;
	this.superClass = superClass;
	this.varNames = instVars;
	this.methods = {};
}
cClass.prototype.getSuperClass = function(name, consider) {
	if( consider && this.cname === name )
	  return this;
	if( name === undefined )
		return this.superClass;
	if( this.hasSuperClass() )
	  return this.superClass.getSuperClass(name, true);
	throw new Error("Unable to find super class with name '" + name + "'");
}
cClass.prototype.hasSuperClass = function() {
	return this.superClass !== null;
};
cClass.prototype.hasVar = function(name, local) {
	var index = this.varNames.length;
	while( index-- ) {
		if( this.varNames[index] === name )
		  return true;
	}
	if( !local && this.hasSuperClass() )
	  return this.superClass.hasVar(name);
	throw new Error("Unable to identify variable '" + name + "'");
};
cClass.prototype.hasMethod = function(name, local) {
	if( this.methods.hasOwnProperty(name) )
	  return true;
	if( !local && this.hasSuperClass() )
	  return this.superClass.hasMethod(name);
	return false;
};
cClass.prototype.getMethod = function(name) {
	if( this.hasMethod(name, true) )
	  return this.methods[name];
	if( this.hasSuperClass() )
	  return this.superClass.getMethod(name);
	throw new Error("Unable to find method '" + name + "'");
};

function cInstance(classType) {
	this.classType = classType;
	this.vars = {};
}

var OO = {
	classTable: {},
	hasClass: function(name) {
		return this.classTable[name] !== undefined;
	},
	getClass: function(name) {
		if( this.hasClass(name) )
		  return this.classTable[name];
		throw new Error("Class '" + name + "' is not defined");
	},
	declareClass: function(name, superClassName, instVarNames) {
		if( this.hasClass(name) )
		  throw new Error("Class with name '" + name + "' is already defined");
		var superClass = ( superClassName === null ) ? null : this.getClass(superClassName);
		this.classTable[name] = new cClass(name, superClass, instVarNames);
	},
	declareMethod: function(className, selector, implFn) {
		var classDef = this.getClass(className);
		if( classDef.hasMethod(selector, true) )
		  throw new Error("Class " + className + " already has method '" + selector + "'");
		classDef.methods[selector] = implFn;
	},
	instantiate: function(className) {
		var classDef = this.getClass(className);
		var args = Array.prototype.slice.call(arguments, 1);

		var ret = new cInstance(classDef);
		this.send.apply( this, [ret, 'initialize'].concat(args) );
		return ret;
	},
	send: function(recv, selector) {
		if( typeof recv === 'number' )
			recv = this.instantiate('Number', recv);
		var meth = recv.classType.getMethod(selector);
		var args = Array.prototype.slice.call(arguments, 2);
		return meth.apply(recv, [recv].concat(args));
	},
	superSend: function(superClassName, recv, selector) {
		var meth = recv.classType.getSuperClass(superClassName).getMethod(selector);
		var args = Array.prototype.slice.call(arguments, 3);
		return meth.apply(recv, [recv].concat(args))
	},
	getInstVar: function(recv, instVarName) {
		if( !recv.classType.hasVar(instVarName) )
			throw new Error("Class " + recv.classType.cname + " does not have variable with name '" + instVarName + "'");
		return recv.vars[instVarName];
	},
	setInstVar: function(recv, instVarName, value) {
		if( !recv.classType.hasVar(instVarName) )
			throw new Error("Class " + recv.classType.cname + " does not have variable with name '" + instVarName + "'");
		recv.vars[instVarName] = value;
		return value;
	}
};

OO.initializeCT = function() {
	this.classTable = {};
	OO.declareClass( "Object", null, []);
	OO.declareMethod("Object", "initialize", function(_this)        {  });
	OO.declareMethod("Object", "isNumber",   function(_this)        { return false; });
	OO.declareMethod("Object", "===",        function(_this, other) { return _this === other; });
	OO.declareMethod("Object", "!==",        function(_this, other) { return _this !== other; });

	OO.declareClass( "Number", "Object", ['value']);
	OO.declareMethod("Number", "initialize", function(_this, value) { OO.setInstVar(_this, 'value', value); });
	OO.declareMethod("Number", "isNumber",   function(_this)        { return true; });
	OO.declareMethod("Number", "===",        function(_this, other) { return OO.getInstVar(_this, 'value') === other; });
	OO.declareMethod("Number", "!==",        function(_this, other) { return OO.getInstVar(_this, 'value') !== other; });
	OO.declareMethod("Number", "+",          function(_this, other) { return OO.getInstVar(_this, 'value') + other; });
	OO.declareMethod("Number", "-",          function(_this, other) { return OO.getInstVar(_this, 'value') - other; });
	OO.declareMethod("Number", "*",          function(_this, other) { return OO.getInstVar(_this, 'value') * other; });
	OO.declareMethod("Number", "/",          function(_this, other) { return OO.getInstVar(_this, 'value') / other; });
	OO.declareMethod("Number", "%",          function(_this, other) { return OO.getInstVar(_this, 'value') % other; });
};
