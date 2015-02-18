function cClass(name, superClass, instVars) {
	this.cname = name;
	this.superClass = superClass;
	this.varNames = instVars;
	this.methods = {};
}
cClass.prototype.getSuperClass = function(name, consider) {
	if( consider && ( name === this.cname || name === undefined ) )
	  return this;
	if( this.hasSuperClass() )
	  return this.superClass.getSuperClass(name, true);
	throw new Error("Unable to find super class with name '" + name + "'");
};
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
cClass.prototype.addMethod = function(name, fn) {
	if( this.hasMethod(name, true) )
		throw new Error("Class " + this.cname + " already has method '" + name + "'");
	this.methods[name] = fn;
};
cClass.prototype.getMethod = function(name) {
	if( this.hasMethod(name, true) )
	  return this.methods[name];
	if( this.hasSuperClass() )
	  return this.superClass.getMethod(name);
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
	if( !(typeof fn === 'function' ) )
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
		var meth = recv.classType.getSuperClass(superClassName).getMethod(selector);
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

	OO.declareClass( "Number", "Object", ['value']);
	OO.declareMethod("Number", "initialize", function(_this, value) { OO.setInstVar(_this, 'value', value); });
	OO.declareMethod("Number", "isNumber",   function(_this)        { return true; });
	OO.declareMethod("Number", "+",          function(_this, other) { return _this + other; });
	OO.declareMethod("Number", "-",          function(_this, other) { return _this - other; });
	OO.declareMethod("Number", "*",          function(_this, other) { return _this * other; });
	OO.declareMethod("Number", "/",          function(_this, other) { return _this / other; });
	OO.declareMethod("Number", "%",          function(_this, other) { return _this % other; });
};
