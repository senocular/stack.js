// Stupid-simple unit tests:
console.log("Tests started...");[

function testExec(){
	var result = 0;
	function main(){
		result = 1;
	}

	Stack.exec(main);
	console.assert(result === 1, "exec() runs a function");
	console.assert(Stack._stacks.length === 0, "stack list is empty after exec(fn)");


	// Note: exec() directs arguments to push() inhernetly testing push() arguments
	result = 0;
	function argumented(val){
		result = val;
	}

	Stack.exec(argumented, [1]);
	console.assert(result === 1, "exec() runs a function with an argument");

	Stack.exec(argumented, 2);
	console.assert(result === 2, "exec() runs a function with a non-array argument");


	var a = {value: 1};
	var b = {value: 2};
	result = 0;
	function scoped(){
		result = this.value;
	}

	Stack.exec(a, scoped);
	console.assert(result === 1, "exec() runs a function scoped to 'object A'");

	Stack.exec(b, scoped);
	console.assert(result === 2, "exec() runs a function scoped to 'object B'");


	result = 0;
	function scopeArg(val){
		result = this.value + val;
	}

	Stack.exec(a, scopeArg, 2);
	console.assert(result === 3, "exec() runs a function scoped to 'object A' with an argument");


	result = 0;
	var scope = {
		method: function(){
			result = 1;
		}
	};

	Stack.exec(scope, "method");
	console.assert(result === 1, "exec() runs a method by name in an object scope");

	Stack.push(scope, "method"); // if run now, result = 1
	scope.method = function(){
		result = 2;
	};

	Stack.exec();
	console.assert(result === 2, "exec() runs a method by name with version defined after it was push()ed to stack list");
},

function testInvoked(){
	var result = 0;
	function main(){
		Stack.defer(deferMe);
		result = 1;
	}

	function deferMe(){
		result = 2;
	}

	var stackedMain = Stack.invoked(main);
	stackedMain();

	console.assert(result === 2, "invoked() runs a function in stack able to defer()");


	result = "";
	function argumented(a, b, c){
		result = a+"-"+b+"-"+c;
	}

	var stackedArgumented = Stack.invoked(argumented, [2, 3]);
	stackedArgumented(1);

	console.assert(result === "1-2-3", "invoked() runs a function with combined arguments");
},

function testPush(){
	var result = 0;
	function main(){
		result = 1;
	}

	result = 0;
	Stack.push(main);
	Stack.exec();

	console.assert(result === 1, "push() adds a function called after exec()");
	console.assert(Stack._stacks.length === 0, "stack list is empty after push() exec()");


	Stack.push(null);
	Stack.push(null, "method");
	Stack.push({});
	Stack.push({}, null);
	console.assert(Stack._stacks.length === 0, "push() with invalid arguments does not add to stack");
	Stack.clear();


	function addA(){
		result += "a";
	}
	function addB(){
		result += "b";
	}
	function addC(){
		result += "c";
	}


	result = "";
	Stack.push(addA);
	Stack.push(addB);
	Stack.push(addC);
	Stack.exec();

	console.assert(result === "abc", "multiple push()es adds functions each called sequentially after exec()");


	result = "";
	Stack.push(addA);
	Stack.push(addA);
	Stack.push(addA);
	Stack.exec();

	console.assert(result === "aaa", "push() same function runs each duplicate function");


	result = "";
	Stack.pushOnce(addA);
	Stack.pushOnce(addB);
	Stack.pushOnce(addC);
	Stack.exec();

	console.assert(result === "abc", "multiple pushOnce()es adds functions each called sequentially after exec()");


	result = "";
	Stack.pushOnce(addA);
	Stack.pushOnce(addA);
	Stack.pushOnce(addA);
	Stack.exec();

	console.assert(result === "a", "pushOnce() same function does not duplicate function");


	result = "";
	Stack.pushOnce(addA);
	Stack.push(addB);
	Stack.pushOnce(addA);
	Stack.exec();

	console.assert(result === "ba", "last pushOnce() is the push that is called");


	result = "";
	var scope = {
		method: function(){
			result += "a";
		}
	};

	result = "";
	Stack.pushOnce(scope.method);
	Stack.pushOnce(scope.method, [1,2,3]);
	Stack.pushOnce(scope, scope.method);
	Stack.pushOnce(scope, "method");
	Stack.pushOnce(scope, "method", [3,2,1]);
	Stack.exec();

	console.assert(result === "a", "pushOnce() same function by reference and name does not duplicate function");


	result = "";
	Stack.push(addA);
	Stack.push(addB);
	Stack.pushOnce(addC);
	Stack.clear();
	Stack.exec();

	console.assert(result === "", "clear() clears push()ed stacks from exec()");


	function addBPush(){
		Stack.push(addB);
		result += "(push)";
	}

	result = "";
	Stack.push(addA);
	Stack.push(addBPush);
	Stack.push(addC);
	Stack.exec();

	console.assert(result === "a(push)cb", "push() in exec() pushes to end of stack");
},

function testDefer(){

	var result = 0;
	function main(){
		Stack.defer(deferMe);
		result = 1;
	}

	function deferMe(){
		result = 2;
	}

	result = 0;
	Stack.exec(main);

	console.assert(result === 2, "defer() calls a function later in a stack");
	console.assert(Stack._stacks.length === 0, "stack list is empty after exec() defer()");


	function p1(){
		Stack.defer(d1);
		result = 1;
	}

	function d1(){
		result = 2;
	}

	function p2(){
		result = 3;
	}


	result = 0;
	Stack.push(p1);
	Stack.push(p2);
	Stack.exec();

	console.assert(result === 3, "defer() inserted after current stack, not at end of stack");


	function onceSame(){
		Stack.deferOnce(addA);
		Stack.deferOnce(addA);
		Stack.deferOnce(addA);
	}

	function addA(){
		result += "a";
	}

	function addB(){
		result += "b";
	}

	function addC(){
		result += "c";
	}

	result = "";
	Stack.exec(onceSame);
	console.assert(result === "a", "deferOnce() same function does not duplicate function");


	function onceDiff(){
		Stack.deferOnce(addA);
		Stack.deferOnce(addB);
		Stack.deferOnce(addC);
	}

	result = "";
	Stack.exec(onceDiff);
	console.assert(result === "abc", "multiple deferOnce()es adds functions each called sequentially after exec()");


	function onceOrder(){
		Stack.deferOnce(addA);
		Stack.deferOnce(addB);
		Stack.deferOnce(addA);
	}

	result = "";
	Stack.exec(onceOrder);
	console.assert(result === "ba", "last deferOnce() is the defer that is called");


	function onceVary(){
		Stack.deferOnce(scope.method);
		Stack.deferOnce(scope.method, [1,2,3]);
		Stack.deferOnce(scope, scope.method);
		Stack.deferOnce(scope, "method");
		Stack.deferOnce(scope, "method", [3,2,1]);
	}

	var scope = {
		method: function(){
			result += "a";
		}
	};

	result = "";
	Stack.exec(onceVary);
	console.assert(result === "a", "deferOnce() same function by reference and name does not duplicate function");
},

function testValue(){
	var result = 0;
	function main(){
		Stack.defer(getValue);
		result = 1;
		return 2; // retrieved
	}

	function getValue(){
		result = Stack.value();
		return 3;
	}

	Stack.exec(main);
	console.assert(result === 2, "value() in defer() captures previous stack return value");
	console.assert(Stack.value() === 3, "value() retained after exec()");

	result = 0;
	function next(){
		result = Stack.value();
		return 4;
	}

	Stack.exec(next);
	console.assert(result === 3, "value() saved from previous call to exec()");

	console.assert(Stack.value() === 4, "value() retained after exec() prior to clear()");
	Stack.clear();
	console.assert(Stack.value() === undefined, "value() undefined after clear()");
},

function testKill(){
	var result = 0;
	function p1(){
		Stack.kill();
		Stack.defer(d1);
		result = 1; // run
	}

	function d1(){
		result = 2; // not run
	}

	function p2(){
		result = 3; // not run
	}

	Stack.push(p1);
	Stack.push(p2);
	Stack.exec();

	console.assert(result === 1, "kill() prevents additional stack execution");
	console.assert(Stack._stacks.length === 0, "stack list is empty after kill()");
},

function testErrors(){
	var error;
	var result;

	function noop(){}

	try {
		Stack.defer(noop);
		error = null;
	}catch(err){
		error = err; // success
	}
	console.assert(error !== null, "unexpected success for defer() outside of exec()");


	try {
		Stack.defer(null);
		error = null; // success
	}catch(err){
		error = err;
	}
	console.assert(error === null, "unexpected error for should-be-silent defer(null) outside of exec()", error);

	try {
		Stack.exec();
		error = null; // success
	}catch(err){
		error = err;
	}
	console.assert(error === null, "unexpected error for should-be-silent no-stack exec call", error);

	try {
		Stack.push(null);
		Stack.exec();
		error = null; // success
	}catch(err){
		error = err;
	}
	console.assert(error === null, "unexpected error for should-be-silent push(null)", error);


	function main(){
		Stack.defer(null);
	}

	try {
		Stack.exec(main);
		error = null; // success
	}catch(err){
		error = err;
	}
	console.assert(error === null, "unexpected error for should-be-silent defer(null)", error);


	result = "";
	Stack.onerror = function(err){
		result = err.message;
	};

	function thrower(){
		throw new Error("test");
	}

	function postThrow(){
		result = "post";
	}

	Stack.exec(thrower);
	console.assert(result === "test", "custom onerror handler captures error");

	Stack.push(thrower);
	Stack.push(postThrow);
	Stack.exec();

	console.assert(result === "post", "push()ed method runs after throw earlier in stack list");

	result = 0;
	function setValue(){
		return 1;
	}
	function getValue(){
		result = Stack.value();
	}
	Stack.push(setValue);
	Stack.push(thrower);
	Stack.push(getValue);
	Stack.exec();

	console.assert(result === void 0, "thrown error in stack results in undefined value() in next stack");

	delete Stack.onerror;
},

].forEach(function(f){if(f)f()});
console.log("Tests complete!");