/**
 * A custom call stack manager that allows for sequential
 * method calls and deferred method execution.
 */
window.Stack = (function(){

	function Stack(){
		this._stacks = []; // collection of call stacks (methods) to be executed in sequence
		this._defers = []; // list of deferred methods managed in exec()
		this._isExec = false; // is executing; exec() was called and hasn't completed
		this._killSwitch = false; // true when breaking from an exec loop
		this._lastValue = void 0; // last value from a stack call
	}

	/**
	 * Returns a function that, when called, will call the provided function 
	 * in a new call stack.  This is useful for creating event handlers 
	 * that are automatically executed in an exec().
	 */
	Stack.prototype.invoked = function(scope, fn, args){
		var stack = this;
		function StackRoot(/* arguments */){
			var stackMethod = new StackMethod(scope, fn, args);
			stackMethod.prependArgs(arguments);
			stack._stacks.push(stackMethod);
			stack.exec();

			// it's possible we're already in an exec call
			// if so, the return value here will be undefined
			// and the actual return value will be lost
			return stackMethod.returnValue;
		};

		return StackRoot;
	};

	/**
	 * Defers the execution of the provided method into the next
	 * call stack. It will automatically be called when the 
	 * current call stack completes.  This will only work if the
	 * current script is being run in the context of an exec().
	 * If you are building up a list of calls to be run sequentially 
	 * with exec(), use push() instead.
	 */
	Stack.prototype.defer = function(scope, fn, args){

		// adding method to defers which will be added
		// to the stack list by the exec() stack loop
		var item = new StackMethod(scope, fn, args);
		if (typeof item.fn === "function"){

			// validation doesn't need to happen if
			// attempt is made on an invalid defer
			if (!this._isExec){
				throw new Error("Failure to call defer() within a Stack-executed call stack. The deferred method will not be called.");
			}

			this._defers.push(item);
			return true;
		}

		return false;
	};

	/**
	 * Pushes a method call to the end of the set of call stacks
	 * that is to be processed by exec().  Unlike defer(), push()ed
	 * methods are placed at the very end of the stack list rather than
	 * occurring immediately following the current call stack.
	 */
	Stack.prototype.push = function(scope, fn, args){
		var item = new StackMethod(scope, fn, args);
		if (typeof item.fn === "function"){
			this._stacks.push(item);
			return true;
		}

		return false;
	};

	/**
	 * Executes a series of managed call stacks. Once a call stack
	 * executes, it is becomes empty and needs to be rebuilt
	 */
	Stack.prototype.exec = function(scope, fn, args){
		var stackMethod;

		// optional, initial method to start exec with
		this.push(scope, fn, args);

		if (this._isExec){
			// already running through a 
			// set of stacks. Break and let
			// the current run handle things
			return false;
		}

		// process the call stacks in a loop running 
		// through and emptying the call stacks array

		this._isExec = true;
		this._defers.length = 0;
		this._lastValue = void 0; // values not carried over from prev execs
		while (this._stacks.length && !this._killSwitch){

			stackMethod = this._stacks.shift();
			try {
				this._lastValue = stackMethod.call();
			}catch(err){
				
				// custom error handling here could throw and
				// break the stack. That's ok; it may be desired
				// for debugging purposes so it won't be handled
				// but _isExec may be stuck at which point you
				// should clear() to clear it out
				if (this.onerror){
					this.onerror(err);
				}
			}

			// add any deferred calls to the beginning of the stack
			if (this._defers.length){
				this._stacks.unshift.apply(this._stacks, this._defers);
				this._defers.length = 0;
			}
		}

		this._isExec = false;
		if (this._killSwitch){
			this.clear();
			this._killSwitch = false;
		}

		return true;
	};

	/**
	 * Returns the value returned by the last call stack.
	 */
	Stack.prototype.value = function(){
		return this._lastValue;
	};

	/**
	 * Breaks out of the loop processing stack calls.
	 * This can be used for breaking out of an infinite call stack loop.
	 */
	Stack.prototype.kill = function(){
		this._killSwitch = true;
	};

	/**
	 * Removes all call stack methods from the stack list and
	 * clears any saved stack value.
	 */
	Stack.prototype.clear = function(){
		this._stacks.length = 0;
		this._isExec = false; // can save a corrupt isExec value
		this._lastValue = void 0;
	};

	/**
	 * Event handler for errors captured within each call stack. When an
	 * error is thrown in a call stack, this handler is immediately called
	 * with that error as an argument before any other call stacks are called.
	 * If not defined with a custom handler, a default handler will display 
	 * a call stack through the console.
	 */
	Stack.prototype.onerror = function(err){
		console.error(err && err.stack ? err.stack : err);
	};


	/**
	 * Encapsulates a method call to be handled
	 * as a call stack call.
	 */
	function StackMethod(scope, fn, args){
		if (typeof scope === "function"){
			// when signature = (fn, args)
			args = fn;
			fn = scope;
			scope = null;
		}

		this.scope = scope;
		this.fn = fn;
		this.args = args;
		this.returnValue = void 0;

		// allow a single non0-null, non-array argument to work
		// as an argument list by putting it into an array
		if (this.args instanceof Array === false){
			this.args = this.args ? [this.args] : [];
		}
	}
		
	/**
	 * Calls the method.
	 */
	StackMethod.prototype.call = function(/* arguments */){

		// multiple call()s would continue to build
		// up the argument list, but a call() should
		// only ever hapen once making it not matter
		this.prependArgs(arguments);

		this.returnValue = this.fn.apply(this.scope, this.args);
		return this.returnValue;
	};
		
	/**
	 * Adds arguments to the called method.
	 */
	StackMethod.prototype.prependArgs = function(addArgs){
		this.args.unshift.apply(this.args, addArgs);
	};


	return new Stack();

})();