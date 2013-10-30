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

	Stack.push(main);
	Stack.exec();

	console.assert(result === 1, "push() adds a function called after exec()");
	console.assert(Stack._stacks.length === 0, "stack list is empty after push() exec()");


	result = "";
	function p1(){
		result += "a";
	}
	function p2(){
		result += "b";
	}
	function p3(){
		result += "c";
	}


	Stack.push(p1);
	Stack.push(p2);
	Stack.push(p3);
	Stack.exec();

	console.assert(result === "abc", "multiple push()es adds functions each called sequentially after exec()");


	result = "";
	Stack.push(p1);
	Stack.push(p1);
	Stack.push(p1);
	Stack.exec();

	console.assert(result === "aaa", "push() same function runs each duplicate function");


	result = "";
	Stack.push(p1);
	Stack.push(p2);
	Stack.push(p3);
	Stack.clear();
	Stack.exec();

	console.assert(result === "", "clear() clears push()ed stacks from exec()");
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

	Stack.exec(main);

	console.assert(result === 2, "defer() calls a function later in a stack");
	console.assert(Stack._stacks.length === 0, "stack list is empty after exec() defer()");


	result = 0;
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


	Stack.push(p1);
	Stack.push(p2);
	Stack.exec();

	console.assert(result === 3, "defer() inserted after current stack, not at end of stack");
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

	delete Stack.onerror;
},

].forEach(function(f){if(f)f()});
console.log("Tests complete!");