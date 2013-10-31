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

This example shows how `defer()` is used to execute a method after the current (Stack-based) call stack, 
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

The method `invoked()` allows you to bind functions to a call stack when called.

```javascript
function clickHandler(event){
  // defer log() called for console with arguments [event.target.localName]
  Stack.defer(console, console.log, [event.target.localName]);
  console.log("clicked:");
}

document.addEventListener("click", Stack.invoked(clickHandler));
// output on click:
// clicked:
// html
```

You can also build up a list of call stacks using `push()`.

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
Stack.push(second);
Stack.push(third);
Stack.exec();
// outputs:
// first
// second
// third
```


TODO
----

API.
