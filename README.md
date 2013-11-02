stack.js
========

Pseudo-call stack creation for managing method execution order.

Basically, this means you can define a set of methods to run in sequence with slightly more control 
of when methods get run within the context of a current code block.  The big takeaways are:

- Being able to defer methods in a another "call stack" from the current code context
- Preventing unhandled errors in the current context blocking additional, sequential method invocations

Everything is still being executed in a single JavaScript call stack, but this code will sit at the top 
of stack and manage sub stacks you can set up with methods like `defer()`. In the process, it will catch
unhandled errors for you so that additional call stacks (these sub stacks) can be executed without being
interrupted by those exceptions.


Usage
-----

See how `defer()` is used to execute a method after the current (Stack-based) call stack, 
started with `exec()`, has finished. (`invoked()` is also used to call functions in Stack-based call stacks
as seen later on.)

```javascript
function hardWork(){
  console.log("Hard work");
}

function work(){
  Stack.defer(hardWork); // delays call of hardWork() in another call stack
  console.log("Easy work");
}

Stack.exec(work); // execute work() in a managed call stack
// output:
// Easy work
// Hard work
```

Here you can see how throwing unhandled errors does not affect the deferred calls.

```javascript
function hardWork(){
  console.log("Hard work");
}

function work(){
  Stack.defer(hardWork); // delays call of hardWork()
  console.log("Easy work");
  throw new Error("Getting tired"); // won't affect hardWork being in other call stack
}

Stack.exec(work); // execute work() in a managed call stack
// output:
// Easy work
// Error: Getting tired
// Hard work
```

The method `invoked()` allows you to bind functions to a call stack when called.  Also, here
you see additional options for specifying methods in the Stack API.

```javascript
function clickHandler(event){
  // defer log() called for console object with arguments: event.target.localName
  Stack.defer(console, console.log, [event.target.localName]);
  console.log("clicked:");
}

document.addEventListener("click", Stack.invoked(clickHandler)); // clickHandler called in stack
// output on click:
// clicked:
// html
```

You can also build up a list of call stacks using `push()`. This also demonstrates different ways
to specify stack calls.

```javascript
function first(){
  console.log("first");
}
function second(){
  console.log("second");
}
function third(){
  console.log("third");
}

Stack.push(first);
Stack.push(this, second);
Stack.push(this, "third");
Stack.exec();
// outputs:
// first
// second
// third
```


API
---

Stack JS introduces a global `Stack` object from which all Stack methods are called.  Methods provided 
to the Stack API represent the roots to Stack-managed call stacks. When called, they execute all code 
specific to their call stack context.  Unhandled errors in those calls will only affect code within 
their own contexts and not those of other call stacks.

The API accepts methods both with and without a scope as well as with and without an arguments list. 
When a scope is provided, the method can be a function reference or the name of the method as it
is defined within the scope object. There are usually two method signatures that allow this:

- `member([method [, argumentsArray]])`
- `member([scope, method [, argumentsArray]])`

When the first parameter is specified as a function, the first signature is used. Otherwise, the second 
is used, with the first parameter representing the scope with which to call the function.  The arguments
array will be passed into the method function when it is called.  If the method is invoked with other arguments, 
those arguments will be provided first, followed by the arguments specified here in the arguments array.


**exec**

- `Stack.exec([method [, argumentsArray]])`
- `Stack.exec([scope, method [, argumentsArray]])`

Starts executing the set of call stack methods currently defined in the stack. If a method 
is passed into `exec()`, it will be pushed onto the end of the stack list.

Once `exec()` completes executing all methods in a stack list, the list is cleared.


**push**

- `Stack.push([method [, argumentsArray]])`
- `Stack.push([scope, method [, argumentsArray]])`

Adds a method to the stack list.  This method will be called the next time `exec()` is run. The order 
of execution occurs in the order in which methods are pushed onto the stack list.  However, using the 
`defer()` method will allow stack methods to be called directly after the current call stack rather 
than being added to the end.


**pushOnce**

- `Stack.deferOnce([method [, argumentsArray]])`
- `Stack.deferOnce([scope, method [, argumentsArray]])`

Like `push()` but does not allow duplication when pushing methods.  In additional calls to `pushOnce()` 
with the same method, the previous is found and removed from the stack list.  Duplicate methods are found 
by function reference only; the argument list is ignored.


**defer**

- `Stack.defer([method [, argumentsArray]])`
- `Stack.defer([scope, method [, argumentsArray]])`

Sets a method to be called in the next call stack immediately following the current call stack.  Becaise 
of this, `defer()` can only be called in the context of a Stack-managed call stack.  To add methods to
the call stack list outside of a Stack-managed call stack, use `push()`.


**deferOnce**

- `Stack.deferOnce([method [, argumentsArray]])`
- `Stack.deferOnce([scope, method [, argumentsArray]])`

Like `defer()` but does not allow duplication when deferring methods.  In additional calls to `deferOnce()` 
with the same method, the previous is found and removed from the stack list.  Duplicate methods are found 
by function reference only; the argument list is ignored.


**invoked**

- `Stack.invoked([method [, argumentsArray]])`
- `Stack.invoked([scope, method [, argumentsArray]])`

Creates a new function that wraps the provided method in a wrapper that causes the method to be called in the 
context of a new call stack.  In other words, when the generated method is called, it will effectively call 
`exec()` with the method.  This is useful for generating methods for event handlers that will force those
event handlers to be called in a Stack-managed call stack.


**value**

`Stack.value()`

Returns the value returned by the method call within the previous call stack.  A single deferred method, for
example, could get the value in the return statement in the previous call stack by calling `value()`.


**kill**

`Stack.kill()`

Stops execution of any additional call stacks within the stack list, clearing the stack list in the process. 
The current stack will complete as expected, but additional stacks, even those added after the call to
`kill()`, will not.


**clear**

`Stack.clear()`

Removes all call stacks from the stack list.  This will also clear the value returned by `value()` as well 
as reset `exec()` (nested `exec()` calls are ignored, though it is possible to error out of an `exec()` run
by throwing an error in a custom onerror handler at which point a call to `clear()` is needed to reset `exec()`).


**onerror (event)**

`Stack.onerror = function(error)`

Callback handler for unhandled errors encountered in call stacks.  A default handler is provided that will output
errors to the console, but that can be overridden by defining your own in the `onerror` property.

`onerror` handlers accept one argument: the error thrown by the unhandled exception.
