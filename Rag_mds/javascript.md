# JavaScript RAG Knowledge Base
## Three-Level Contextual Model for AI Technical Interviewing

**Document Purpose:** Dense knowledge dump for RAG ingestion by an AI technical interviewer. Every section is tagged with seniority signals (L1=Junior, L2=Mid, L3=Senior). This is not a tutorial. It is a structured signal reference.

**Seniority Model:**
- **L1 Junior** — works under guidance, day-scoped tasks, follows patterns, "I implemented the feature as instructed"
- **L2 Mid** — works independently, week/month-scoped tasks, "I chose this pattern for better testability"
- **L3 Senior** — takes ambiguous requirements, considers system-wide impact, "We should avoid this tool, it's overkill and costly"

---

# SECTION 1: Types, Type Coercion, and Primitive Mechanics

## 1.1 The Seven Primitive Types

JavaScript has exactly **7 primitive types**: `undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol`. Everything else is an object. Primitives are immutable and stored by value. Objects are mutable and stored by reference.

```js
typeof undefined    // "undefined"
typeof null         // "object"  ← historical bug, null IS a primitive
typeof true         // "boolean"
typeof 42           // "number"
typeof 42n          // "bigint"
typeof "hello"      // "string"
typeof Symbol()     // "symbol"
typeof {}           // "object"
typeof []           // "object"  ← arrays ARE objects
typeof function(){} // "function" ← callable objects get special typeof result

// Correct null check
value === null           // only correct way
Object.is(null, null)   // true

// undefined vs null
let a;              // a === undefined (declared, no value assigned)
let b = null;       // b === null (intentional empty)
undefined == null   // true  (loose equality, special case)
undefined === null  // false (different types)
```

**L1 SIGNAL:** Junior must know the 7 primitives by name, know `typeof null === "object"` is a bug (not a feature), and distinguish `undefined` (variable declared but never assigned) from `null` (intentionally absent value). Must know `===` does not coerce types.

**L1 RED FLAG:** Cannot name all primitive types. Does not know that `typeof null` is "object". Checks `x == null || x == undefined` instead of `x == null`.

---

## 1.2 Type Coercion — ToPrimitive, ToNumber, ToBoolean, ToString

JavaScript's abstract operations (defined in the ECMAScript spec) drive all implicit type conversion. The `+` operator is the most dangerous coercion site.

```js
// ToBoolean — falsy values (ONLY these 8 are falsy):
// false, 0, -0, 0n, "", null, undefined, NaN
Boolean(0)         // false
Boolean("")        // false
Boolean([])        // true  ← GOTCHA: empty array is truthy
Boolean({})        // true  ← GOTCHA: empty object is truthy
Boolean("false")   // true  ← non-empty string, always truthy
Boolean(NaN)       // false

// ToPrimitive for objects: calls valueOf() first, then toString()
// For Date objects: toString() runs first (hint is "string")
[] + []    // ""                 both arrays ToPrimitive → ""
[] + {}    // "[object Object]"  {} ToPrimitive → "[object Object]"
{} + []    // 0                  {} parsed as empty BLOCK, then +[] = +("") = 0

// The + operator rules:
// If either operand is a string after ToPrimitive → string concat
// Otherwise → numeric addition
1 + "2"        // "12"   number coerced to string
"3" - 1        // 2      - forces numeric, string coerced to number
null + 1       // 1      null → 0
undefined + 1  // NaN    undefined → NaN
true + true    // 2      booleans → numbers
"5" * "3"      // 15     * forces numeric
+"3"           // 3      unary + coerces to number
+""            // 0
+null          // 0
+undefined     // NaN
+[]            // 0      [] → "" → 0
+{}            // NaN    {} → "[object Object]" → NaN

// Loose equality (==) full coercion matrix
null == undefined    // true  (special rule, no coercion)
null == 0            // false ← GOTCHA: null only loosely equals undefined
NaN == NaN           // false ← NaN is never equal to anything
0 == false           // true  false → 0
"" == false          // true  both → 0
"1" == 1             // true  string → number
[] == false          // true  [] → "" → 0, false → 0
[] == ![]            // true  ![] is false, then [] == false → true
"" == 0              // true
" " == 0             // true  " " → 0

// Object.is: identity equality, no coercion
Object.is(NaN, NaN)   // true  ← only correct NaN check
Object.is(0, -0)      // false ← 0 and -0 are distinct
0 === -0              // true  ← === treats them as same
```

**L2 SIGNAL:** Mid-level must explain the ToPrimitive algorithm: for non-Date objects, `valueOf()` is called first; if it returns a non-primitive, `toString()` is called. For Date, hint is "string" so `toString()` runs first. Must articulate when to intentionally use `==` (e.g., `x == null` catches both null and undefined elegantly).

**L2 RED FLAG:** Cannot predict the output of `[] == ![]` or explain why. Does not know when `==` is acceptable vs dangerous.

---

## 1.3 Number Internals — IEEE 754 Double Precision

JavaScript's `number` type is 64-bit IEEE 754 floating point. This has concrete engineering consequences in financial, scientific, and high-precision applications.

```js
// The classic floating point issue
0.1 + 0.2                     // 0.30000000000000004
0.1 + 0.2 === 0.3             // false

// Safe integer range
Number.MAX_SAFE_INTEGER        // 9007199254740991  (2^53 - 1)
Number.MIN_SAFE_INTEGER        // -9007199254740991
Number.isSafeInteger(9007199254740992)   // false
9007199254740993 === 9007199254740992    // true ← integers above MAX_SAFE collapse!

// Fix patterns
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON   // true (epsilon comparison)
(0.1 + 0.2).toFixed(2)                         // "0.30" — string, NOT for calculation
Number.EPSILON                                  // 2.220446049250313e-16

// Special values
Infinity                // positive infinity
-Infinity               // negative infinity
NaN                     // Not a Number, but typeof NaN === "number"
1 / 0                   // Infinity (no exception)
-1 / 0                  // -Infinity
0 / 0                   // NaN

// NaN checks — always use Number.isNaN
isNaN("hello")          // true  ← coerces first, unreliable
Number.isNaN("hello")   // false ← no coercion, correct
Number.isNaN(NaN)       // true

// BigInt for integers beyond MAX_SAFE_INTEGER
const big = 9007199254740993n        // accurate
typeof 42n                            // "bigint"
42n + 1n                              // 43n
42n + 1                               // TypeError: cannot mix BigInt and Number
BigInt(42) + 42n                      // 84n (explicit conversion)
JSON.stringify(42n)                   // TypeError: BigInt not JSON serializable
42n > 42                              // false (cross-type comparison works, but carefully)

// Numeric separators (ES2021)
const million = 1_000_000;
const hex = 0xFF_FF_FF;
const bytes = 0b1010_0001;
```

**L3 SIGNAL:** Senior must know IEEE 754 makes JavaScript unsuitable for financial calculations without a library (`decimal.js`, `big.js`). Must know BigInt cannot mix with number, has no floating point, doesn't work with `JSON.stringify` natively. Must discuss when to use string-based fixed-point arithmetic for money vs pulling in a library vs moving calculations server-side to a Decimal-typed language. Must know that `Number.EPSILON` comparison for floats only works for values close to 1 (epsilon is relative to 1.0, not to the values being compared — for large floats, use relative epsilon).

---

## 1.4 Symbol — Unique Keys and Meta-Programming

```js
// Symbols are always unique, even with the same description
Symbol("tag") === Symbol("tag")   // false

// Use as unique object keys (don't show up in standard enumerations)
const id = Symbol("id");
const user = { [id]: 123, name: "Alice" };
user[id]                    // 123
Object.keys(user)           // ["name"]   ← symbol excluded
JSON.stringify(user)        // {"name":"Alice"} ← symbol dropped
for (const k in user) {}    // "name" only
Object.getOwnPropertySymbols(user)  // [Symbol(id)] ← only way to get them

// Well-known symbols — metaprogramming hooks into JS internals
// Symbol.iterator — make any object iterable
class Range {
  constructor(start, end) { this.start = start; this.end = end; }
  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        return current <= end
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      }
    };
  }
}
[...new Range(1, 5)]   // [1, 2, 3, 4, 5]
for (const n of new Range(1, 3)) console.log(n);  // 1 2 3

// Symbol.toPrimitive — control type coercion
const price = {
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return 42;
    if (hint === "string") return "$42";
    return true;   // default hint
  }
};
+price         // 42
`${price}`     // "$42"
price + ""     // "true"

// Symbol.hasInstance — control instanceof behavior
class EvenChecker {
  static [Symbol.hasInstance](num) { return num % 2 === 0; }
}
4 instanceof EvenChecker   // true
3 instanceof EvenChecker   // false

// Symbol.for — global symbol registry (shared across iframes/realms)
Symbol.for("app.id") === Symbol.for("app.id")   // true ← same key = same symbol
Symbol("app.id") === Symbol("app.id")            // false ← always unique

// Symbol.keyFor
const s = Symbol.for("shared");
Symbol.keyFor(s)   // "shared"
```

---

# SECTION 2: Scope, Closures, and Execution Context

## 2.1 Lexical Scope and the Scope Chain

JavaScript uses **lexical (static) scope** — the scope of a variable is determined at author time, not call time. The engine resolves variable names by walking up the scope chain from the current execution context to the global context.

```js
// var: function-scoped, hoisted to function top (declaration only, not initialization)
// let/const: block-scoped, exist in TDZ (Temporal Dead Zone) before declaration

function outer() {
  var x = 10;
  let y = 20;
  function inner() {
    console.log(x);   // 10 — found via scope chain
    console.log(y);   // 20 — found via scope chain
    var z = 30;       // scoped to inner only
  }
  inner();
  // console.log(z)   // ReferenceError: z is not defined
}

// var hoisting
console.log(a);   // undefined — declaration hoisted, initialization is not
var a = 5;
console.log(a);   // 5

// let/const TDZ
// console.log(b);  // ReferenceError: Cannot access 'b' before initialization
let b = 5;

// Function declaration hoisting — entire function is hoisted (name + body)
console.log(typeof greet);   // "function" — fully hoisted
greet();                      // works
function greet() { return "hello"; }

// Function expression — NOT hoisted
// console.log(typeof sayHi);  // "undefined"
// sayHi();                     // TypeError: sayHi is not a function
var sayHi = function() { return "hi"; };

// Block scope with let/const
{
  let blockScoped = "inside";
  var leaks = "outside";
}
// console.log(blockScoped)  // ReferenceError
console.log(leaks)            // "outside"

// Classic var loop bug
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);   // prints 3, 3, 3
}
// Why: one shared `i`, setTimeout runs after loop, i === 3

// Fix 1: use let (creates new binding per iteration)
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);   // prints 0, 1, 2
}

// Fix 2: IIFE to capture value
for (var k = 0; k < 3; k++) {
  ((captured) => {
    setTimeout(() => console.log(captured), 0);
  })(k);  // 0, 1, 2
}

// Hoisting priority: function declaration wins over var of same name
console.log(typeof foo);    // "function"
var foo = "bar";
function foo() {}
console.log(typeof foo);    // "string" (now assigned)
```

**L1 SIGNAL:** Must know var is function-scoped and hoisted, let/const are block-scoped with TDZ. Must identify the var-in-loop bug and fix it with let or IIFE. Must know function declarations are fully hoisted but function expressions are not.

---

## 2.2 Closures — Full Mechanics

A closure is a function that **retains access to its lexical environment after the outer function has returned**. Closures are the mechanism behind module patterns, factory functions, memoization, partial application, and data encapsulation.

```js
// Basic closure: inner function retains access to outer scope after outer returns
function makeCounter(start = 0) {
  let count = start;   // closed-over variable
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    reset()     { count = start; return count; },
    value()     { return count; }
  };
}
const counter = makeCounter(10);
counter.increment();   // 11
counter.increment();   // 12
counter.decrement();   // 11
counter.value();       // 11

// Each call creates an independent closure environment
const c1 = makeCounter(0);
const c2 = makeCounter(100);
c1.increment();   // 1
c2.increment();   // 101 — completely independent

// Closure for private state (module pattern)
function createStack() {
  const items = [];   // truly private, inaccessible outside
  return {
    push(item) { items.push(item); },
    pop()      { return items.pop(); },
    peek()     { return items[items.length - 1]; },
    size()     { return items.length; },
    isEmpty()  { return items.length === 0; },
    toArray()  { return [...items]; }   // return copy to protect internal state
  };
}

// Memoization via closure
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const memoFib = memoize(function fib(n) {
  if (n <= 1) return n;
  return memoFib(n - 1) + memoFib(n - 2);
});
memoFib(40);   // fast after first call

// Partial application via closure
function partial(fn, ...preArgs) {
  return function(...laterArgs) {
    return fn(...preArgs, ...laterArgs);
  };
}
const multiply = (a, b, c) => a * b * c;
const double = partial(multiply, 2, 1);
double(5);    // 10

// CLOSURE MEMORY LEAK — closure holds entire outer scope
function attachHandler(elements) {
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", function() {
      // This closure retains the entire `elements` NodeList in memory
      // even after elements are removed from DOM
      console.log(`Clicked index ${i}`);
    });
  }
}

// FIX: capture only what's needed
function attachHandlerFixed(elements) {
  elements.forEach((el, i) => {
    const index = i;   // primitive — closure captures number, not the array
    el.addEventListener("click", () => console.log(`Clicked ${index}`));
  });
}

// Breaking closure references for GC
function setup() {
  let bigData = new Array(1_000_000).fill("x");
  const len = bigData.length;   // extract primitive
  bigData = null;                // explicitly release large object
  return () => console.log(len);  // closure holds number, not array
}
```

**L2 SIGNAL:** Mid-level must explain that a closure prevents GC of the entire outer scope chain, not just the used variables (V8 may optimize away unused closures but it's not guaranteed). Must know how to break closure references to allow GC (set to null). Must understand closures in event listeners and the pattern of cleanup in React useEffect / Vue beforeUnmount.

**L3 SIGNAL:** Senior must know that in V8, if a variable in a closure is captured by any inner function, the ENTIRE scope frame is retained — even if other functions in the same closure don't use that variable. This is called "closure sharing" and is a real source of memory retention in large apps.

---

## 2.3 Execution Context and Call Stack

Every time JavaScript runs code, it creates an **Execution Context (EC)**. Three types: Global EC, Function EC, Eval EC. Each EC has: Variable Environment, Lexical Environment, and `this` binding.

```js
// Call stack is LIFO
function a() { b(); }
function b() { c(); }
function c() { console.trace(); }
a();
// Stack: c → b → a → (anonymous global)

// Stack overflow from infinite recursion
function recurse() { return recurse(); }
// recurse() → RangeError: Maximum call stack size exceeded

// Tail call (proper tail position)
function factorial(n, acc = 1) {
  if (n <= 1) return acc;
  return factorial(n - 1, n * acc);   // tail position — no work after return
}
// NOTE: V8 does NOT implement TCO in practice (spec says it should, but doesn't)
// Safe only to ~10,000 depth in practice before stack overflow

// Trampoline: iterative alternative to deep recursion
function trampoline(fn) {
  return function(...args) {
    let result = fn(...args);
    while (typeof result === "function") {
      result = result();
    }
    return result;
  };
}

function factTail(n, acc = 1) {
  if (n <= 1) return acc;
  return () => factTail(n - 1, n * acc);   // returns function instead of calling
}
const safeFact = trampoline(factTail);
safeFact(100000);   // works without stack overflow

// EC creation phase sets up:
// 1. arguments object (for function ECs, not arrow functions)
// 2. var declarations hoisted and initialized to undefined
// 3. Function declarations fully hoisted (name + body)
// 4. let/const placed in TDZ (exist but not accessible)
// 5. this binding determined
```

**L3 SIGNAL:** Senior must know V8 does NOT implement TCO despite it being in the ES6 spec. For deep recursion on large datasets, trampolining or iterative conversion is the correct production solution. Must discuss lazy evaluation via generators as an alternative to deep recursive algorithms.

---

# SECTION 3: The `this` Keyword — All Four Binding Rules

`this` is determined **at call time**, not at definition time (except arrow functions). Four rules in order of precedence: new > explicit > implicit > default. Arrow functions have no own `this` — they inherit lexically.

## 3.1 Default Binding

```js
// Standalone function call — this = global (sloppy) or undefined (strict)
function showThis() { console.log(this); }
showThis();   // window (browser) or global (Node)

"use strict";
function strictThis() { console.log(this); }
strictThis();   // undefined
```

## 3.2 Implicit Binding

```js
// Method call — this = the object before the dot
const obj = {
  name: "obj",
  greet() { return this.name; }
};
obj.greet();   // "obj"

// Implicit binding LOSS — most common this bug
const fn = obj.greet;
fn();   // undefined ← detached from obj, default binding kicks in

// Loss in callbacks
setTimeout(obj.greet, 0);             // undefined ← lost binding
[1].forEach(obj.greet);               // undefined ← lost binding
document.getElementById("btn").addEventListener("click", obj.greet); // undefined
```

## 3.3 Explicit Binding

```js
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}
const person = { name: "Alice" };

greet.call(person, "Hello", "!");     // "Hello, Alice!"   — spread args
greet.apply(person, ["Hi", "."]);    // "Hi, Alice."      — array args
const boundGreet = greet.bind(person, "Hey");  // returns new function
boundGreet("?");                      // "Hey, Alice?"

// bind is permanent — subsequent binds don't override
const rebound = boundGreet.bind({ name: "Bob" });
rebound("!");   // "Hey, Alice!" ← first bind always wins
```

## 3.4 new Binding

```js
function Person(name) {
  // new creates: new empty object, sets [[Prototype]] to Person.prototype,
  // sets this = new object, executes body, returns this (unless explicit return of object)
  this.name = name;
}
const p = new Person("Alice");
p.name   // "Alice"

// If constructor explicitly returns an object, that object is returned instead of this
function Weird() {
  this.a = 1;
  return { b: 2 };   // returns this object, not the constructed one
}
new Weird()   // { b: 2 }

function Normal() {
  this.a = 1;
  return 42;   // non-object return is ignored, this is returned
}
new Normal()  // { a: 1 }
```

## 3.5 Arrow Functions and this

```js
// Arrow functions: NO own this, inherit from enclosing lexical scope at DEFINITION time
const timer = {
  count: 0,
  start() {
    // 'this' here = timer (regular function, implicit binding)
    setInterval(() => {
      this.count++;   // 'this' inherited from start() = timer ✓
    }, 1000);
  }
};

// Arrow function as method — GOTCHA
const obj2 = {
  name: "obj2",
  greet: () => {
    // Arrow defined at object literal level — enclosing scope is module/global
    return this.name;   // undefined ← not obj2
  },
  greetCorrect() {
    return this.name;   // "obj2" ← regular function, implicit binding
  }
};

// Class methods and this loss
class Counter {
  count = 0;

  // Regular method: this lost when used as callback
  increment() { this.count++; }

  // Arrow class field: each instance gets its own function, always bound
  incrementArrow = () => { this.count++; };  // this always = instance

  constructor() {
    // Option: bind in constructor (older pattern)
    this.increment = this.increment.bind(this);
  }
}
// Trade-off: arrow class field creates new function per instance (memory cost)
// vs prototype method (shared, but loses this)
```

**L2 SIGNAL:** Must identify this-loss bugs in event handlers and callbacks, apply the correct fix (bind, arrow, or wrapper), and explain the class field arrow function pattern used in React components. Must know arrow class fields are slightly less memory-efficient (each instance gets its own function copy vs shared prototype method).

---

# SECTION 4: Prototypal Inheritance and the Prototype Chain

## 4.1 [[Prototype]] Chain Mechanics

Every object has an internal `[[Prototype]]` slot (accessible via `Object.getPrototypeOf()` or `.__proto__`). Property lookup walks up the chain until found or chain ends at `null`.

```js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function() {
  return `${this.name} makes a sound`;
};

const dog = new Animal("Rex");
dog.speak();                                       // "Rex makes a sound"
dog.hasOwnProperty("name");                        // true  ← own property
dog.hasOwnProperty("speak");                       // false ← on prototype
Object.getPrototypeOf(dog) === Animal.prototype    // true

// Chain: dog → Animal.prototype → Object.prototype → null
Object.getPrototypeOf(Animal.prototype) === Object.prototype   // true
Object.getPrototypeOf(Object.prototype)                        // null

// Property shadowing
Animal.prototype.type = "generic";
dog.type = "specific";      // shadows prototype property
dog.type;                   // "specific" (own property wins)
delete dog.type;
dog.type;                   // "generic" (falls back to prototype)

// Setting up inheritance chain (ES5 style)
function Dog(name, breed) {
  Animal.call(this, name);   // call parent constructor
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);  // set up prototype chain
Dog.prototype.constructor = Dog;                  // fix constructor reference
Dog.prototype.bark = function() { return "Woof!"; };

const d = new Dog("Rex", "Labrador");
d.speak();   // inherited from Animal.prototype
d.bark();    // own to Dog.prototype
d instanceof Dog      // true
d instanceof Animal   // true

// Object.create for dictionary (no prototype pollution risk)
const dict = Object.create(null);
dict.hasOwnProperty   // undefined ← no Object.prototype
// Safe for user-controlled keys — no prototype pollution vector
```

## 4.2 ES6 Classes — Sugar Over Prototypes

```js
class Animal {
  #name;    // private field (ES2022) — truly private, not just naming convention
  #sound;

  constructor(name, sound) {
    this.#name = name;
    this.#sound = sound;
  }

  speak() { return `${this.#name} says ${this.#sound}`; }

  get name()    { return this.#name; }
  set name(v)   {
    if (typeof v !== "string") throw new TypeError("name must be string");
    this.#name = v;
  }

  static create(name, sound) { return new Animal(name, sound); }
  static #count = 0;
  static getCount() { return Animal.#count; }

  toString() { return `Animal(${this.#name})`; }
  [Symbol.toPrimitive](hint) {
    return hint === "number" ? 0 : this.#name;
  }
}

class Dog extends Animal {
  #tricks = [];

  constructor(name) {
    super(name, "woof");   // must call super before accessing this
  }

  learn(trick) { this.#tricks.push(trick); return this; }   // fluent
  perform()    { return this.#tricks.join(", "); }
  speak()      { return super.speak() + "!"; }   // call parent method
}

// Classes are functions
typeof Animal                         // "function"
// Methods are on the prototype
Object.getOwnPropertyNames(Animal.prototype)  // ["constructor", "speak", "name"]
// Static on the class itself
Object.getOwnPropertyNames(Animal)    // ["length", "name", "prototype", "create", ...]

// Private fields are truly spec-private (not WeakMap tricks, actual internal slot)
const a = new Animal("Cat", "meow");
// a.#name   // SyntaxError at parse time — not runtime, parse time
Object.getOwnPropertyNames(a)   // [] ← private fields not exposed

// Mixin pattern (JS only supports single inheritance)
const Serializable = (Base) => class extends Base {
  serialize()                     { return JSON.stringify(this); }
  static deserialize(json)        { return Object.assign(new this(), JSON.parse(json)); }
};

const Validatable = (Base) => class extends Base {
  validate() { return Object.values(this).every(v => v !== null && v !== undefined); }
};

class User extends Serializable(Validatable(Animal)) {}
// Chain: User → SerializableMixin → ValidatableMixin → Animal → Object
```

**L3 SIGNAL:** Must know: (1) Private class fields use actual internal spec slots — not closures, not WeakMaps — making them faster and truly inaccessible. (2) Mixin pattern introduces prototype chain depth, increasing property lookup time. (3) At scale, deeply nested class hierarchies show measurable perf regression vs flat object composition. (4) Prototype pollution attack: `obj["__proto__"]` assignment can corrupt `Object.prototype` for all objects in the process — critical security issue when doing object merges with user-supplied keys.

---

# SECTION 5: Asynchronous JavaScript — Event Loop to Async/Await

## 5.1 The Event Loop Architecture

JavaScript is single-threaded with non-blocking I/O powered by the event loop. The event loop manages the call stack, microtask queue, and macrotask queue.

```js
// Execution order rule:
// 1. Synchronous code (call stack runs to empty)
// 2. ALL microtasks drain (Promise .then, queueMicrotask, MutationObserver)
// 3. Browser: render (60Hz)
// 4. ONE macrotask runs (setTimeout, setInterval, I/O callbacks, setImmediate)
// 5. Repeat: all microtasks → render → next macrotask

console.log("1 sync");
setTimeout(() => console.log("2 setTimeout"), 0);
Promise.resolve()
  .then(() => console.log("3 promise.then"))
  .then(() => console.log("4 chained .then"));
queueMicrotask(() => console.log("5 queueMicrotask"));
console.log("6 sync");

// Output: 1, 6, 3, 5, 4, 2
// Sync runs first. Then ALL microtasks drain (3, 5, 4). Then macrotask (2).

// Microtask starvation — blocks event loop indefinitely
function starve() {
  Promise.resolve().then(starve);   // infinite microtask chain
}
// This will lock the tab — rendering never gets a turn

// Node.js event loop phases (libuv):
// timers → pending callbacks → idle/prepare → poll → check → close callbacks
// process.nextTick and Promise microtasks drain between EVERY phase

process.nextTick(() => console.log("nextTick"));           // before promises
Promise.resolve().then(() => console.log("promise"));      // microtask
setImmediate(() => console.log("setImmediate"));           // check phase
setTimeout(() => console.log("setTimeout"), 0);            // timers phase

// Output (in I/O callback): nextTick, promise, setImmediate, setTimeout
// Output (top level): nextTick, promise, (setTimeout/setImmediate order varies)
```

**L2 SIGNAL:** Must predict output order of mixed sync/Promise/setTimeout code. Must explain why `setTimeout(fn, 0)` doesn't mean "immediately" — it queues a macrotask. Must know that Promise microtasks can starve the render pipeline.

## 5.2 Promise API — Full Reference

```js
// Promise states: pending → fulfilled | rejected (immutable once settled)

// .then returns a NEW promise
const p = Promise.resolve(42);
p.then(v => v * 2)        // new promise resolving to 84
 .then(v => console.log(v));  // 84

// Error propagation in chains
fetch("/api/data")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);   // caught below
    return res.json();
  })
  .then(data => process(data))
  .catch(err => handleError(err))    // catches ANY error from above
  .finally(() => cleanup());         // always runs, no arguments

// Promise.all — all or nothing, concurrent
Promise.all([p1, p2, p3])
  .then(([r1, r2, r3]) => { /* all resolved */ })
  .catch(err => { /* FIRST rejection → here, others still run */ });

// Promise.allSettled — wait for all regardless of outcome (ES2020)
Promise.allSettled([p1, p2, p3]).then(results => {
  results.forEach(r => {
    if (r.status === "fulfilled") console.log(r.value);
    else console.log(r.reason);
  });
});

// Promise.race — first to SETTLE wins (fulfilled OR rejected)
Promise.race([
  fetch("/api"),
  new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
]);

// Promise.any — first FULFILLED wins (ES2021)
// If ALL reject → AggregateError with all rejection reasons
Promise.any([fetch(cdn1), fetch(cdn2), fetch(cdn3)])
  .then(firstSuccess => { /* fastest successful CDN */ })
  .catch(aggErr => { /* all failed */ console.log(aggErr.errors); });

// Promise.withResolvers — expose resolve/reject outside executor (ES2024)
const { promise, resolve, reject } = Promise.withResolvers();
setTimeout(() => resolve(42), 1000);
promise.then(console.log);   // 42

// Promisification pattern
function promisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}
const readFile = promisify(require("fs").readFile);
```

## 5.3 Async/Await — Patterns and Pitfalls

```js
// async function always returns a Promise
async function fetchUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();   // returned value is the resolution value
}

// Error handling — always handle rejections
async function safe() {
  try {
    return await fetchUser(1);
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Go-style error handling utility
async function to(promise) {
  try {
    return [null, await promise];
  } catch (err) {
    return [err, null];
  }
}
const [err, user] = await to(fetchUser(1));
if (err) handleError(err);

// GOTCHA 1: await in forEach — does NOT work as expected
async function wrong(ids) {
  ids.forEach(async (id) => {
    const user = await fetchUser(id);   // fires all simultaneously, no sequencing
    console.log(user);
  });
  // forEach returns immediately, doesn't await the async callbacks
}

// Sequential: for...of
async function sequential(ids) {
  for (const id of ids) {
    const user = await fetchUser(id);   // truly sequential, one at a time
    console.log(user);
  }
}

// Concurrent: Promise.all
async function concurrent(ids) {
  const users = await Promise.all(ids.map(id => fetchUser(id)));
  return users;
}

// GOTCHA 2: sequential when concurrent would be faster
async function slow() {
  const user  = await fetchUser(1);     // waits before starting next
  const posts = await fetchPosts(1);    // independent, could run concurrently
}
async function fast() {
  const [user, posts] = await Promise.all([fetchUser(1), fetchPosts(1)]);
}

// GOTCHA 3: Forgetting await
async function buggy() {
  const promise = fetchUser(1);    // ← forgot await
  console.log(promise);            // Promise object, not user data
}

// GOTCHA 4: Unhandled rejection in Node 15+
// Node 15+ crashes the process on unhandled rejection (changed from warning)
// Must handle: process.on("unhandledRejection", handler)

// Top-level await (ES2022, ESM only)
// const config = await fetch("/config").then(r => r.json());

// Async generator for streaming/pagination
async function* paginate(url) {
  let nextUrl = url;
  while (nextUrl) {
    const res = await fetch(nextUrl);
    const { data, next } = await res.json();
    yield data;
    nextUrl = next;
  }
}

for await (const page of paginate("/api/items")) {
  process(page);   // memory efficient — one page at a time
}
```

**L3 SIGNAL:** Must discuss: (1) AbortController for fetch cancellation, and why there's no built-in Promise cancellation in the spec (design decision: cancellation propagation is hard to reason about). (2) The Zalgo problem: mixing sync and async resolution in callbacks is unpredictable and must be avoided — always be consistently async. (3) Cost of excessive Promise chaining: each `.then()` allocates a microtask and a Promise object — in hot loops this causes measurable GC pressure. (4) Backpressure in async generators: if consumer is slow, producer must wait — no built-in mechanism, needs careful design.

---

# SECTION 6: Generators, Iterators, and Lazy Evaluation

## 6.1 The Iterator Protocol

The iterator protocol is the unifying interface for `for...of`, spread (`...`), destructuring, `Array.from`, `Promise.all`, and any custom data structure.

```js
// An iterator is an object with a next() method
// next() returns: { value: any, done: boolean }

// An iterable is an object with [Symbol.iterator]() that returns an iterator

// Manual iterator
const iterator = {
  current: 1,
  last: 5,
  [Symbol.iterator]() { return this; },   // iterable iterator (self-reference)
  next() {
    return this.current <= this.last
      ? { value: this.current++, done: false }
      : { value: undefined, done: true };
  }
};

for (const n of iterator) console.log(n);   // 1 2 3 4 5
[...iterator]    // [] ← consumed! iterators are stateful

// Custom iterable class
class LinkedList {
  #head = null;
  prepend(value) { this.#head = { value, next: this.#head }; return this; }
  [Symbol.iterator]() {
    let current = this.#head;
    return {
      next() {
        if (!current) return { value: undefined, done: true };
        const { value } = current;
        current = current.next;
        return { value, done: false };
      }
    };
  }
}

const list = new LinkedList().prepend(3).prepend(2).prepend(1);
[...list]                // [1, 2, 3]
const [head, ...rest] = list;   // destructuring works
```

## 6.2 Generator Functions

```js
// Generator function: returns a Generator object (both iterator and iterable)
// Execution pauses at each yield, resumes on .next()

function* counter(start = 0, step = 1) {
  let n = start;
  while (true) {
    const reset = yield n;   // yield sends value out, receives value in via .next(val)
    n = reset ? start : n + step;
  }
}

const gen = counter(0, 2);
gen.next()        // { value: 0, done: false }
gen.next()        // { value: 2, done: false }
gen.next(true)    // { value: 0, done: false } ← sent true, reset triggered
gen.next()        // { value: 2, done: false }

// Finite generator
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) yield i;
}
[...range(0, 10, 2)]   // [0, 2, 4, 6, 8]

// Infinite lazy sequence (only computes on demand)
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) { yield a; [a, b] = [b, a + b]; }
}

function take(n, iterable) {
  const result = [];
  for (const val of iterable) {
    result.push(val);
    if (result.length >= n) break;
  }
  return result;
}
take(10, fibonacci())   // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// yield* — delegate to another iterable
function* concat(...iterables) {
  for (const it of iterables) yield* it;
}
[...concat([1, 2], [3, 4], [5])]   // [1, 2, 3, 4, 5]

// Generator control methods
function* guarded() {
  try {
    yield 1; yield 2;
  } finally {
    console.log("cleanup");   // runs on .return() or .throw()
  }
}
const g = guarded();
g.next();           // { value: 1, done: false }
g.return("done");   // logs "cleanup", { value: "done", done: true }
g.throw(new Error("fail"));   // logs "cleanup", throws

// Generator as state machine
function* trafficLight() {
  while (true) { yield "red"; yield "green"; yield "yellow"; }
}
```

**L3 SIGNAL:** Must know: (1) Generators were the foundation for async/await before it was a language feature — libraries like `co` and Koa v1 used generators + promises for async control flow. (2) Generators enable cooperative multitasking — yielding control explicitly. (3) Async generators are the correct tool for streaming API responses, SSE, WebSocket message streams. (4) Memory: a generator retains all local variables in its stack frame between yields — can cause unexpected memory retention in long-lived generators.

---

# SECTION 7: Functional Programming Patterns

## 7.1 Array Higher-Order Functions

```js
const users = [
  { id: 1, name: "Alice", age: 30, role: "admin" },
  { id: 2, name: "Bob",   age: 25, role: "user"  },
  { id: 3, name: "Carol", age: 35, role: "admin" },
];

// map: transform each element, same length, does not mutate
users.map(u => u.name)                     // ["Alice", "Bob", "Carol"]
users.map(u => ({ ...u, age: u.age + 1}))  // new array with incremented ages

// filter: returns subset, does not mutate
users.filter(u => u.role === "admin")      // [Alice, Carol]

// reduce: most powerful, can implement map/filter, builds any accumulator
users.reduce((acc, u) => acc + u.age, 0)  // 90 (sum)

// groupBy via reduce
users.reduce((acc, u) => {
  (acc[u.role] ??= []).push(u);   // ??= (ES2021 logical assignment)
  return acc;
}, {});  // { admin: [Alice, Carol], user: [Bob] }

// flatMap: map then flatten one level (ES2019)
["hello world", "foo bar"].flatMap(s => s.split(" "))
// ["hello", "world", "foo", "bar"]
// More efficient than .map().flat() which creates intermediate array

// find vs findIndex vs some vs every vs includes
users.find(u => u.id === 2)          // { id: 2, name: "Bob", ... }
users.findIndex(u => u.id === 2)     // 1
users.some(u => u.age > 30)          // true
users.every(u => u.age > 20)         // true
[1, 2, 3].includes(2)                // true

// Sort MUTATES the original array
// Default sort converts to strings — GOTCHA for numbers
[10, 9, 2, 1, 100].sort()                // [1, 10, 100, 2, 9] ← string sort!
[10, 9, 2, 1, 100].sort((a, b) => a - b) // [1, 2, 9, 10, 100] ← numeric

// Stable sort guaranteed since ES2019 (previously implementation-dependent)

// Immutable sort (never mutate the original)
const sorted = [...users].sort((a, b) => a.age - b.age);

// ES2023 non-mutating array methods
arr.toSorted((a, b) => a - b)    // returns new sorted array
arr.toReversed()                  // returns new reversed array
arr.toSpliced(1, 2, "x")         // returns new spliced array
arr.with(2, "new")               // returns new array with index 2 replaced

// at() — negative indexing (ES2022)
[1, 2, 3, 4, 5].at(-1)   // 5
[1, 2, 3, 4, 5].at(-2)   // 4

// Object.groupBy (ES2024) — replaces the reduce groupBy pattern
Object.groupBy(users, u => u.role)
// { admin: [Alice, Carol], user: [Bob] }

// Array.from
Array.from("hello")                      // ["h","e","l","l","o"]
Array.from({ length: 5 }, (_, i) => i)  // [0, 1, 2, 3, 4]
Array.from(new Set([1, 2, 2, 3]))        // [1, 2, 3]

// Sparse array gotchas
new Array(3)                    // [empty × 3] ← sparse, not [undefined, undefined, undefined]
new Array(3).map(x => 1)        // [empty × 3] ← map skips holes!
Array.from({ length: 3 }, () => 1)  // [1, 1, 1] ← correct
[...new Array(3)].map(() => 1)       // [1, 1, 1] ← spread fills holes with undefined
```

## 7.2 Currying, Partial Application, and Composition

```js
// Curry: f(a,b,c) → f(a)(b)(c)
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...more) => curried(...args, ...more);
  };
}

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3)    // 6
add(1, 2)(3)    // 6
add(1)(2, 3)    // 6

// Partial application: lock some arguments
function partial(fn, ...preArgs) {
  return (...laterArgs) => fn(...preArgs, ...laterArgs);
}
const double = partial((a, b) => a * b, 2);
double(5)    // 10

// Function composition: right-to-left (mathematical order)
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
// Function pipeline: left-to-right (execution order)
const pipe    = (...fns) => x => fns.reduce((v, f) => f(v), x);

const trim       = s => s.trim();
const toLower    = s => s.toLowerCase();
const capitalize = s => s[0].toUpperCase() + s.slice(1);

const normalize = pipe(trim, toLower, capitalize);
normalize("  HELLO WORLD  ")   // "Hello world"

// Transducers: composable, single-pass transformations
// Problem: [1..1000].filter(even).map(x => x * 2) creates intermediate arrays
// Transducer solution: compose transformations, apply in one reduce pass
const map    = fn   => reducer => (acc, val) => reducer(acc, fn(val));
const filter = pred => reducer => (acc, val) => pred(val) ? reducer(acc, val) : acc;
const append = (acc, val) => [...acc, val];

const isEven = n => n % 2 === 0;

const xform = compose(
  filter(isEven),
  map(x => x * 2)
);

[1,2,3,4,5].reduce(xform(append), []);   // [4, 8] — single pass, no intermediate array
```

**L3 SIGNAL:** Must know transducers avoid intermediate array allocations — relevant when processing large datasets. Currying has a cost: each partial application creates a closure. For hot paths, manual partial binding is faster. Must be able to evaluate when pulling in Ramda/fp-ts/Effect-TS is worth the dependency cost vs implementing what's needed.

---

# SECTION 8: Memory Management and Garbage Collection

## 8.1 Garbage Collection — Mark and Sweep

V8 uses generational GC: **Scavenger** (minor GC) for young generation (short-lived objects), **Mark-Compact** (major GC) for old generation. GC pauses can cause latency spikes. Memory is reclaimed when objects are unreachable from GC roots (global, stack frames, live closures).

```js
// LEAK 1: Forgotten event listeners
function setup() {
  const data = loadHeavyData();
  const handler = () => process(data);   // closure keeps data alive
  document.getElementById("btn").addEventListener("click", handler);
  // If button is removed from DOM but listener not removed → data never GC'd
  return () => document.getElementById("btn").removeEventListener("click", handler);
}

// LEAK 2: Closures capturing large objects unnecessarily
function attachBig() {
  const bigData = new Array(1_000_000).fill("x");
  const len = bigData.length;   // extract only what's needed (primitive)
  // bigData can now be GC'd — closure only holds len (number)
  document.getElementById("el").addEventListener("click", () => console.log(len));
}

// LEAK 3: Accidental globals
function leaky() {
  leaked = "global";   // no let/const/var → window.leaked
}
// Fix: "use strict" makes this a ReferenceError

// LEAK 4: Timers holding references
function startPolling() {
  const data = heavyComputation();
  const id = setInterval(() => sendData(data), 1000);   // data retained forever
  return () => clearInterval(id);   // must call cleanup
}

// LEAK 5: Detached DOM nodes
const cache = [];
function makeNode() {
  const div = document.createElement("div");
  cache.push(div);   // div held in JS even after removal from DOM
}

// WeakMap/WeakSet: keys are weak references, don't prevent GC
const metadata = new WeakMap();
function setMeta(obj, data) { metadata.set(obj, data); }
// When obj is GC'd, its WeakMap entry is automatically removed

// WeakRef (ES2021): optional reference
const ref = new WeakRef(largeObject);
// later:
const obj = ref.deref();
if (obj !== undefined) {
  // object still alive
}

// FinalizationRegistry (ES2021): cleanup callback after GC
const registry = new FinalizationRegistry(key => {
  console.log(`Object with key ${key} was collected`);
});
registry.register(largeObject, "my-key");
```

## 8.2 V8 Internals — Hidden Classes and JIT Optimization

```js
// V8 creates hidden classes (shapes/maps) for objects with consistent property layout
// Objects with same shape share the same hidden class → V8 can optimize

// FAST: consistent shape across all instances
function Point(x, y) { this.x = x; this.y = y; }
const p1 = new Point(1, 2);   // hidden class C0: {x, y}
const p2 = new Point(3, 4);   // same hidden class → IC hit → FAST

// SLOW: adding properties after construction creates new hidden class
const obj = {};
obj.x = 1;   // hidden class transition: {} → {x}
obj.y = 2;   // hidden class transition: {x} → {x, y}
// Each transition makes IC polymorphic → slower

// Rule: always initialize all properties in constructor, in same order

// SLOW: delete operator degrades to dictionary mode (hash map)
const o = { a: 1, b: 2 };
delete o.a;   // now in dictionary mode → property access is slower
o.a = undefined;   // better: set to undefined, keeps hidden class

// Inline Cache (IC) states:
// monomorphic: one shape → fastest (IC specializes)
// polymorphic: 2-4 shapes → slower (IC checks each)
// megamorphic: 5+ shapes → IC gives up, generic lookup

function add(a, b) { return a.val + b.val; }
add({ val: 1 }, { val: 2 });    // monomorphic → fast
add({ val: 1, extra: 0 }, { val: 2 });  // polymorphic → slower

// Typed arrays avoid hidden class issues entirely (always same layout)
const floats = new Float64Array(1000);   // always PACKED_DOUBLE_ELEMENTS
const ints   = new Int32Array(1000);     // always PACKED_SMI_ELEMENTS

// Array element kinds (can only transition downward, never up)
const arr = [1, 2, 3];        // PACKED_SMI_ELEMENTS ← fastest
arr.push(1.5);                 // PACKED_DOUBLE_ELEMENTS ← slower
arr.push("string");            // PACKED_ELEMENTS ← slowest

// Object pooling to reduce GC pressure
class Pool {
  #pool = [];
  #factory; #reset; #max;

  constructor(factory, reset, max = 100) {
    this.#factory = factory;
    this.#reset = reset;
    this.#max = max;
  }

  acquire() {
    return this.#pool.length > 0 ? this.#pool.pop() : this.#factory();
  }

  release(obj) {
    if (this.#pool.length < this.#max) {
      this.#reset(obj);
      this.#pool.push(obj);
    }
  }
}

const vec3Pool = new Pool(
  () => ({ x: 0, y: 0, z: 0 }),
  v => { v.x = 0; v.y = 0; v.z = 0; }
);
```

**L3 SIGNAL:** Must be able to: (1) Use `--prof` and `node --prof-process` to analyze V8 CPU profiles. (2) Know that Turbofan (V8's optimizing JIT compiler) operates on a sea-of-nodes IR and deoptimization is the main performance sink — preventing deopt is more impactful than micro-optimizations. (3) Know when to use typed arrays for numerical workloads. (4) Understand that `SharedArrayBuffer + Atomics` enables true shared memory between Web Workers, with associated security implications (Spectre mitigations, COEP/COOP headers required).

---

# SECTION 9: Module Systems — ESM, CJS, and Interop

## 9.1 CommonJS (CJS)

```js
// CommonJS: synchronous, runtime loading, default in Node.js (historically)

// Export patterns
module.exports = { PI: 3.14, add: (a, b) => a + b };  // replace entire exports
exports.PI = 3.14;      // add to exports object
exports.add = (a, b) => a + b;
// WARNING: never mix module.exports = {} and exports.x = ... in same file

// Import
const math = require("./math");
const { add, PI } = require("./math");

// CJS caches modules — require() twice returns same object reference
require("./config") === require("./config")   // true ← same object

// Circular dependency: partially evaluated module is returned
// a.js: const b = require('./b'); exports.val = 1;
// b.js: const a = require('./a'); console.log(a.val);  // undefined! a not done yet

// Dynamic loading works (require is a runtime function)
const plugin = require(`./plugins/${pluginName}`);

// __dirname, __filename available
console.log(__dirname);    // /absolute/path/to/directory
console.log(__filename);   // /absolute/path/to/file.js
```

## 9.2 ES Modules (ESM)

```js
// ESM: static analysis, async loading, live bindings, native browser support

// Named exports
export const PI = 3.14;
export function add(a, b) { return a + b; }
export class Vector {}

// Default export (one per module)
export default function main() {}

// Re-exports
export { add as sum } from "./math.js";       // rename
export * from "./utils.js";                   // all named
export * as utils from "./utils.js";          // namespace

// Imports
import { add, PI } from "./math.js";          // named
import main from "./app.js";                  // default
import * as math from "./math.js";            // namespace
import main, { add } from "./module.js";      // both

// Dynamic import (works in both CJS and ESM, returns Promise)
const { add } = await import("./math.js");
// Use case: code splitting, conditional loading, lazy routes

// ESM LIVE BINDINGS (not copies like CJS)
// counter.js:
export let count = 0;
export function increment() { count++; }

// main.js:
import { count, increment } from "./counter.js";
count;       // 0
increment();
count;       // 1 ← live binding reflects actual current value
// In CJS: const { count } = require('./counter') gives count = 0 forever (copy)

// import.meta — replaces __dirname/__filename in ESM
import.meta.url        // "file:///path/to/module.js"
import.meta.dirname    // Node 21.2+ ("/path/to/")
import.meta.filename   // Node 21.2+ ("/path/to/module.js")

// Older Node ESM __dirname equivalent
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Top-level await (ESM only, ES2022)
const config = await fetch("/config").then(r => r.json());
// Blocks parent module evaluation — performance concern in critical path

// package.json configuration
// { "type": "module" } — all .js files treated as ESM
// .mjs extension always ESM, .cjs extension always CJS

// CJS/ESM interop rules:
// ESM can import CJS (whole module as default export)
// CJS CANNOT require() ESM (must use dynamic import())
// Named exports from CJS require "exports" field in package.json
```

**L3 SIGNAL:** Must know: (1) Tree-shaking requires static ESM imports (dynamic imports can't be statically analyzed by bundlers). (2) Dual package hazard: publishing both CJS and ESM can result in two copies of a module in one bundle with different state — dangerous for singletons. (3) The `"exports"` field in package.json for conditional exports (separate CJS/ESM builds for library authors). (4) Module federation (webpack 5) for sharing modules across independently deployed microfrontend applications. (5) Top-level await blocks parent module evaluation chain — can make app startup slower if used carelessly.

---

# SECTION 10: Error Handling Strategies

## 10.1 Custom Error Classes

```js
// Built-in error types
new Error("generic")
new TypeError("wrong type — e.g., expected string got number")
new RangeError("out of valid range — e.g., array index or numeric range")
new ReferenceError("accessing undeclared variable")
new SyntaxError("invalid syntax — usually from eval/JSON.parse")
new URIError("malformed URI in encodeURI/decodeURIComponent")

// Custom error hierarchy
class AppError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = this.constructor.name;   // use subclass name
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    if (Error.captureStackTrace) {       // V8 only
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return { name: this.name, message: this.message, code: this.code, context: this.context };
  }
}

class NetworkError extends AppError {
  constructor(message, statusCode, url) {
    super(message, "NETWORK_ERROR", { statusCode, url });
    this.statusCode = statusCode;
    this.url = url;
    this.isRetryable = statusCode >= 500 || statusCode === 429;
  }
}

class ValidationError extends AppError {
  constructor(field, message, value) {
    super(message, "VALIDATION_ERROR", { field, value });
    this.field = field;
    this.value = value;
  }
}

// Error chaining (ES2022 — cause property)
async function loadConfig() {
  try {
    return await fetch("/config").then(r => r.json());
  } catch (err) {
    throw new AppError("Failed to load config", "CONFIG_LOAD_FAILED", { cause: err });
  }
}

// Walking the cause chain
function getRootCause(err) {
  return err.cause ? getRootCause(err.cause) : err;
}
```

## 10.2 Error Handling Patterns

```js
// Pattern 1: try/catch for async
async function handleRequest(req) {
  try {
    const data = await processRequest(req);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, status: 400, field: err.field, message: err.message };
    }
    if (err instanceof NetworkError && err.isRetryable) {
      return retry(req);
    }
    throw err;   // unknown errors: re-throw for global handler
  }
}

// Pattern 2: Result type (functional, no exceptions for expected errors)
const Result = {
  ok:  value => ({ ok: true,  value }),
  err: error => ({ ok: false, error })
};

async function safeDiv(a, b) {
  if (b === 0) return Result.err(new RangeError("Division by zero"));
  return Result.ok(a / b);
}

const result = await safeDiv(10, 0);
if (!result.ok) console.error(result.error.message);
else console.log(result.value);

// Pattern 3: Never swallow errors silently
try {
  await riskyOperation();
} catch (err) {
  // BAD: catch (err) {} — swallowed
  // BAD: catch (err) { console.log(err) } — logged but not handled
  // GOOD: decide: recover, retry, or re-throw
  logger.error({ err, context: "riskyOperation" });
  throw new AppError("Operation failed", "OP_FAILED", { cause: err });
}

// Global error boundaries
// Browser
window.addEventListener("unhandledrejection", event => {
  logger.error(event.reason);
  event.preventDefault();   // suppress console error
});

// Node.js (Node 15+: unhandled rejection crashes the process by default)
process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason }, "Unhandled rejection");
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});
```

---

# SECTION 11: Design Patterns in JavaScript

## 11.1 Creational Patterns

```js
// MODULE PATTERN — IIFE for private scope
const Cart = (() => {
  let items = [];   // private

  function total() { return items.reduce((s, i) => s + i.price * i.qty, 0); }

  return {
    add(item)    { items.push(item); },
    remove(id)   { items = items.filter(i => i.id !== id); },
    getTotal()   { return total(); },
    getItems()   { return [...items]; }   // copy, protect internal state
  };
})();

// FACTORY PATTERN — create objects without new
function createUser(type, data) {
  const base = { id: crypto.randomUUID(), createdAt: new Date(), ...data };
  const configs = {
    admin:  { permissions: ["read","write","delete","admin"], ...base },
    editor: { permissions: ["read","write"], ...base },
    viewer: { permissions: ["read"], ...base }
  };
  if (!configs[type]) throw new TypeError(`Unknown type: ${type}`);
  return Object.freeze(configs[type]);
}

// SINGLETON — one instance per process
class Config {
  static #instance = null;
  #data = {};

  static getInstance() {
    Config.#instance ??= new Config();
    return Config.#instance;
  }

  set(key, val) { this.#data[key] = val; }
  get(key)      { return this.#data[key]; }
}

const config = Config.getInstance();  // always same object
```

## 11.2 Behavioral Patterns

```js
// OBSERVER / EVENT EMITTER
class Emitter {
  #listeners = new Map();

  on(event, fn) {
    (this.#listeners.get(event) ?? this.#listeners.set(event, new Set()).get(event)).add(fn);
    return () => this.off(event, fn);   // returns unsubscribe
  }

  once(event, fn) {
    const wrapper = (...args) => { fn(...args); this.off(event, wrapper); };
    return this.on(event, wrapper);
  }

  off(event, fn)    { this.#listeners.get(event)?.delete(fn); }

  emit(event, ...args) {
    this.#listeners.get(event)?.forEach(fn => {
      try { fn(...args); } catch (err) { console.error(err); }
    });
  }
}

// COMMAND PATTERN — undo/redo
class History {
  #done = [];
  #undone = [];
  execute(cmd) { cmd.execute(); this.#done.push(cmd); this.#undone = []; }
  undo()       { const cmd = this.#done.pop(); if (cmd) { cmd.undo(); this.#undone.push(cmd); } }
  redo()       { const cmd = this.#undone.pop(); if (cmd) { cmd.execute(); this.#done.push(cmd); } }
}

// PROXY PATTERN — reactive objects
function reactive(target, onChange) {
  return new Proxy(target, {
    set(obj, key, value) {
      const old = obj[key];
      obj[key] = value;
      if (old !== value) onChange(key, value, old);
      return true;
    },
    get(obj, key) {
      const val = Reflect.get(obj, key);
      return val && typeof val === "object" ? reactive(val, onChange) : val;
    }
  });
}

// DECORATOR PATTERN — function wrapping
function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  return async function(...args) {
    let last;
    for (let i = 1; i <= maxRetries; i++) {
      try { return await fn.apply(this, args); }
      catch (err) {
        last = err;
        if (i < maxRetries) await new Promise(r => setTimeout(r, baseDelay * i));  // backoff
      }
    }
    throw last;
  };
}

function withLogging(fn, logger = console) {
  return function(...args) {
    const t = performance.now();
    try {
      const result = fn.apply(this, args);
      logger.log(`${fn.name} OK in ${(performance.now()-t).toFixed(2)}ms`);
      return result;
    } catch (err) {
      logger.error(`${fn.name} FAILED:`, err);
      throw err;
    }
  };
}

const safeApi = withRetry(withLogging(fetchData), 3, 500);
```

## 11.3 Structural Patterns

```js
// STRATEGY PATTERN — swappable algorithms
class Sorter {
  constructor(strategy) { this.strategy = strategy; }
  sort(data) { return this.strategy([...data]); }   // always copy
}

const quickSort  = arr => { /* ... */ return arr; };
const mergeSort  = arr => { /* ... */ return arr; };
const sorter = new Sorter(data.length > 1000 ? mergeSort : quickSort);

// ADAPTER PATTERN — wrap incompatible interface
class OldPaymentAPI {
  processPayment(amount, cardNumber) { /* legacy */ }
}

class PaymentAdapter {
  #legacy;
  constructor(legacy) { this.#legacy = legacy; }
  pay({ amount, card }) {   // new interface
    return this.#legacy.processPayment(amount, card);
  }
}

// PROXY PATTERN — validation
function withValidation(target, validators) {
  return new Proxy(target, {
    set(obj, key, value) {
      if (validators[key] && !validators[key](value)) {
        throw new TypeError(`Invalid value for ${key}: ${value}`);
      }
      return Reflect.set(obj, key, value);
    }
  });
}
```

---

# SECTION 12: Web APIs and Browser Environment

## 12.1 Fetch and AbortController

```js
// Fetch with timeout and cancellation
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new NetworkError(`HTTP ${res.status}`, res.status, url);
    return res;
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Timeout after ${timeoutMs}ms`);
    throw err;
  } finally {
    clearTimeout(id);
  }
}

// Streaming large response bodies
async function streamingDownload(url, onProgress) {
  const res = await fetch(url);
  const total = +res.headers.get("content-length");
  const reader = res.body.getReader();
  let received = 0;
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(received / total);
  }

  return new Uint8Array(chunks.reduce((acc, c) => [...acc, ...c], []));
}

// Request deduplication (cache in-flight requests)
const inflight = new Map();
async function dedupedfetch(url) {
  if (inflight.has(url)) return inflight.get(url);
  const promise = fetch(url).then(r => r.json()).finally(() => inflight.delete(url));
  inflight.set(url, promise);
  return promise;
}
```

## 12.2 Web Workers and Shared Memory

```js
// Web Worker: separate V8 context, no shared state, message passing
// main.js
const worker = new Worker("worker.js", { type: "module" });
worker.postMessage({ type: "COMPUTE", data: largeArray });
worker.onmessage = ({ data }) => displayResult(data);
worker.onerror = err => console.error(err);
worker.terminate();   // clean up

// Transferable objects — zero-copy transfer (buffer is detached in sender)
const buffer = new ArrayBuffer(1024 * 1024);
worker.postMessage({ buffer }, [buffer]);   // transferred, not copied
// buffer is now detached in main thread — accessing it throws

// SharedArrayBuffer — true shared memory between threads
const shared = new SharedArrayBuffer(4);
const view = new Int32Array(shared);
// Both main and worker read/write same memory
// Requires COEP + COOP headers for security (Spectre mitigation)

// Atomics — safe concurrent access to SharedArrayBuffer
Atomics.add(view, 0, 1);           // atomic increment
Atomics.load(view, 0);             // atomic read
Atomics.compareExchange(view, 0, expected, desired);  // CAS
Atomics.wait(view, 0, value);      // block until view[0] !== value
Atomics.notify(view, 0, 1);        // wake one waiting thread

// Inline worker (no separate file needed)
function createWorker(fn) {
  const blob = new Blob([`(${fn.toString()})()`], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}
```

## 12.3 Intersection Observer and Performance APIs

```js
// Lazy loading images
const lazyLoader = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      observer.unobserve(img);   // stop observing after load
    }
  });
}, { rootMargin: "200px", threshold: 0 });   // start loading 200px early

document.querySelectorAll("img[data-src]").forEach(img => lazyLoader.observe(img));

// Performance Observer for Core Web Vitals
const perfObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    if (entry.entryType === "largest-contentful-paint") {
      console.log("LCP:", entry.startTime);
    }
    if (entry.entryType === "layout-shift" && !entry.hadRecentInput) {
      console.log("CLS delta:", entry.value);
    }
  });
});

perfObserver.observe({ type: "largest-contentful-paint", buffered: true });
perfObserver.observe({ type: "layout-shift", buffered: true });

// requestAnimationFrame for smooth animations
function animate(timestamp) {
  const elapsed = timestamp - startTime;
  element.style.transform = `translateX(${Math.sin(elapsed / 1000) * 100}px)`;
  requestAnimationFrame(animate);   // schedules before next repaint
}
requestAnimationFrame(ts => { startTime = ts; animate(ts); });

// requestIdleCallback for non-critical background work
requestIdleCallback(deadline => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    processTask(tasks.shift());
  }
}, { timeout: 2000 });   // force run within 2s even if not idle
```

---

# SECTION 13: Testing Strategies

## 13.1 Unit Testing with Jest

```js
// AAA: Arrange → Act → Assert
describe("ShoppingCart", () => {
  let cart;
  beforeEach(() => { cart = createCart(); });   // fresh state per test
  afterEach(() => { jest.clearAllMocks(); });

  // Positive test
  it("calculates total correctly", () => {
    cart.add({ id: 1, price: 20, qty: 2 });
    cart.add({ id: 2, price: 10, qty: 1 });
    expect(cart.getTotal()).toBe(50);
  });

  // Error path test
  it("throws TypeError for invalid item", () => {
    expect(() => cart.add(null)).toThrow(TypeError);
    expect(() => cart.add(null)).toThrow("Invalid item");
  });

  // Async test
  it("loads user from API", async () => {
    const user = await fetchUser(1);
    expect(user).toMatchObject({ id: 1, name: expect.any(String) });
    expect(user.email).toMatch(/@/);
  });
});

// Mocking modules
jest.mock("./api", () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: "Alice" }),
  saveUser:  jest.fn().mockRejectedValue(new Error("DB error"))
}));

// Spying without replacing
const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
// ... trigger code that calls console.error ...
expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("failed"));
consoleSpy.mockRestore();

// Mock timers
jest.useFakeTimers();
const fn = jest.fn();
setTimeout(fn, 1000);
jest.advanceTimersByTime(999);
expect(fn).not.toHaveBeenCalled();
jest.advanceTimersByTime(1);
expect(fn).toHaveBeenCalledTimes(1);
jest.useRealTimers();

// Custom matchers
expect.extend({
  toBeWithinRange(received, min, max) {
    const pass = received >= min && received <= max;
    return {
      pass,
      message: () => `expected ${received} to be within [${min}, ${max}]`
    };
  }
});
expect(50).toBeWithinRange(10, 100);   // ✓

// Property-based testing (fast-check)
import fc from "fast-check";
test("sort is idempotent", () => {
  fc.assert(fc.property(fc.array(fc.integer()), arr => {
    const sorted = [...arr].sort((a, b) => a - b);
    expect([...sorted].sort((a, b) => a - b)).toEqual(sorted);
  }));
});
```

## 13.2 Testing Philosophy

**Test Pyramid (bottom to top):**
1. Unit tests — many, fast, isolated (mock dependencies)
2. Integration tests — fewer, test module interactions
3. E2E tests — few, slow, test full user flows (Playwright, Cypress)

**What NOT to mock:**
- The thing under test (its internals)
- Pure functions (just call them)
- Simple data structures

**What to mock:**
- External services (HTTP, DB, file system)
- System time (use fake timers)
- Third-party libraries with side effects

**Coverage pitfall:** 100% coverage doesn't mean bug-free. Coverage measures which lines ran, not which logic states were tested. Mutation testing (Stryker) is more effective at finding real gaps.

**L2 RED FLAG:** Mocking internals of the module under test (testing implementation, not behavior). Not handling async correctly in tests. No error path tests.

---

# SECTION 14: Node.js Architecture

## 14.1 Event Loop Phases (libuv)

```
Phase 1: timers          → setTimeout / setInterval callbacks
Phase 2: pending cbs     → I/O error callbacks deferred from previous iteration
Phase 3: idle, prepare   → internal use
Phase 4: poll            → retrieve I/O events, execute callbacks; blocks here if no timers pending
Phase 5: check           → setImmediate callbacks
Phase 6: close cbs       → socket.on("close"), etc.

Between each phase: process.nextTick queue drains fully, then Promise microtasks drain
```

```js
// Phase ordering demonstration
setImmediate(() => console.log("setImmediate"));     // check phase
setTimeout(() => console.log("setTimeout"), 0);      // timers phase
process.nextTick(() => console.log("nextTick"));     // before next phase
Promise.resolve().then(() => console.log("promise")); // microtask

// Top-level output: nextTick, promise, [setTimeout/setImmediate — order varies]
// Inside I/O callback: nextTick, promise, setImmediate, setTimeout

// process.nextTick starvation (like microtask starvation)
function recursiveNextTick() {
  process.nextTick(recursiveNextTick);   // blocks ALL other callbacks forever
}
```

## 14.2 Streams and Backpressure

```js
import { createReadStream, createWriteStream } from "fs";
import { Transform, pipeline } from "stream";
import { pipeline as pipelineAsync } from "stream/promises";

// Transform stream
class UpperCase extends Transform {
  _transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
}

// pipeline handles backpressure and cleanup automatically
await pipelineAsync(
  createReadStream("input.txt"),
  new UpperCase(),
  createWriteStream("output.txt")
);

// Manual backpressure (without pipeline)
const readable = createReadStream("large.txt");
const writable = createWriteStream("output.txt");

readable.on("data", chunk => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    readable.pause();   // ← stop reading when write buffer full
    writable.once("drain", () => readable.resume());   // resume on drain
  }
});
readable.on("end", () => writable.end());
```

## 14.3 Cluster vs Worker Threads

```js
// CLUSTER: multiple processes, each with own V8 instance, no shared memory
// Best for: HTTP servers, multi-core CPU utilization
import cluster from "cluster";
import { cpus } from "os";

if (cluster.isPrimary) {
  cpus().forEach(() => cluster.fork());
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.pid} died, restarting`);
    cluster.fork();
  });
} else {
  // each worker: own event loop, own heap, IPC via process.send/message
  startServer();
}

// WORKER THREADS: same process, shared memory via SharedArrayBuffer
// Best for: CPU-intensive computation (image processing, crypto, parsing)
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

if (isMainThread) {
  const w = new Worker(__filename, { workerData: { nums: [1,2,3] } });
  w.on("message", result => console.log(result));
} else {
  const result = workerData.nums.map(x => x ** 2);
  parentPort.postMessage(result);
}
```

**L3 SIGNAL:** Must distinguish: Cluster = child_process (separate V8, separate heap, IPC serialization cost). Worker Threads = same process (shared memory with SharedArrayBuffer, lower IPC cost, true parallelism without process spawn overhead). For HTTP servers use Cluster. For CPU computation use Worker Threads. For high-frequency shared state between processes, use Redis pub/sub instead of cluster IPC (JSON serialization cost is real). Must know the poll phase can block if no pending callbacks and no timers — libuv sits waiting.

---

# SECTION 15: Security — Attack Vectors and Mitigations

## 15.1 Cross-Site Scripting (XSS)

```js
// NEVER insert user content via innerHTML
element.innerHTML = userInput;                // ← RCE in browser context

// SAFE alternatives
element.textContent = userInput;              // always safe, no HTML parsing
element.setAttribute("data-val", userInput);  // safe

// When rich HTML is needed (user comments with formatting)
import DOMPurify from "dompurify";
element.innerHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
  ALLOWED_ATTR: ["href"]
});

// DOM-based XSS sources to avoid:
// location.hash, location.search, document.referrer, postMessage data
// Never eval() any of these
```

## 15.2 Prototype Pollution

```js
// Attack: polluting Object.prototype via user-controlled keys
const payload = JSON.parse('{"__proto__": {"isAdmin": true}}');
Object.assign({}, payload);   // pollutes Object.prototype!
const victim = {};
victim.isAdmin;               // true ← every object is now admin

// Vulnerable merge
function merge(target, source) {
  for (const key in source) target[key] = source[key];   // ← no guard
}

// Safe merge
function safeMerge(target, source) {
  const blocklist = new Set(["__proto__", "constructor", "prototype"]);
  for (const key of Object.keys(source)) {
    if (blocklist.has(key)) continue;
    target[key] = source[key];
  }
  return target;
}

// Or use Object.create(null) as intermediate
const safe = Object.assign(Object.create(null), untrusted);

// Or structuredClone (does not copy prototype chain)
const clone = structuredClone(untrusted);

// Detecting pollution
"isAdmin" in Object.prototype   // true if polluted — check for sanitization
```

## 15.3 ReDoS, Timing Attacks, SSRF

```js
// REDOS — catastrophic backtracking
const VULNERABLE = /^(a+)+$/;
// "aaaaaaaaaaaaaaaaX" → exponential backtracking → hangs process
// Fix: eliminate nested quantifiers, use linear-complexity regex or dedicated library

// Timing attack — naive secret comparison short-circuits
function insecureCompare(a, b) { return a === b; }   // timing reveals mismatch position

// Constant-time comparison (for tokens, HMAC signatures)
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// SSRF — Server-Side Request Forgery in Node.js
function isSafeUrl(urlStr) {
  let url;
  try { url = new URL(urlStr); }
  catch { return false; }

  const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254"];
  if (blocked.includes(url.hostname)) return false;
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(url.hostname)) return false;
  return ["http:", "https:"].includes(url.protocol);
}

// eval() and code injection — NEVER use with user input
eval(userInput);                    // arbitrary code execution
new Function("return " + expr)();   // same risk
// Use math.js, expr-eval, or safe-eval libraries for dynamic expressions
```

---

# SECTION 16: Advanced Meta-Programming — Proxy and Reflect

```js
// Reflect mirrors all internal object operations (14 traps total)
// Always use Reflect in Proxy traps to ensure correct behavior

const handler = {
  // Intercept property read
  get(target, key, receiver) {
    console.log(`GET ${String(key)}`);
    return Reflect.get(target, key, receiver);
  },

  // Intercept property write
  set(target, key, value, receiver) {
    if (typeof value !== "number") throw new TypeError("Only numbers");
    return Reflect.set(target, key, value, receiver);
  },

  // Intercept delete
  deleteProperty(target, key) {
    console.log(`DELETE ${String(key)}`);
    return Reflect.deleteProperty(target, key);
  },

  // Intercept function call
  apply(target, thisArg, args) {
    console.log(`CALL ${target.name}(${args})`);
    return Reflect.apply(target, thisArg, args);
  },

  // Intercept new
  construct(target, args, newTarget) {
    console.log(`NEW ${target.name}`);
    return Reflect.construct(target, args, newTarget);
  },

  // Intercept in operator
  has(target, key) { return Reflect.has(target, key); },

  // Intercept Object.keys, for...in, etc.
  ownKeys(target) { return Reflect.ownKeys(target).filter(k => !k.startsWith("_")); },

  // Intercept Object.getPrototypeOf
  getPrototypeOf(target) { return Reflect.getPrototypeOf(target); }
};

// Practical: validation proxy
function validated(target, schema) {
  return new Proxy(target, {
    set(obj, key, value) {
      const validator = schema[key];
      if (validator && !validator(value)) {
        throw new TypeError(`Invalid value "${value}" for field "${key}"`);
      }
      return Reflect.set(obj, key, value);
    }
  });
}

const user = validated({}, {
  name:  v => typeof v === "string" && v.length > 0,
  age:   v => Number.isInteger(v) && v >= 0 && v < 150,
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
});

// Practical: observable state (Vue 3 reactivity core concept)
function reactive(raw, notify) {
  return new Proxy(raw, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      return value && typeof value === "object" ? reactive(value, notify) : value;
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      notify(key, value);
      return result;
    }
  });
}
```

---

# SECTION 17: State Management Patterns

## 17.1 Redux Pattern from Scratch

```js
function createStore(reducer, initialState, enhancer) {
  if (enhancer) return enhancer(createStore)(reducer, initialState);

  let state = initialState;
  const listeners = new Set();
  let dispatching = false;

  return {
    getState()     { return state; },
    subscribe(fn)  { listeners.add(fn); return () => listeners.delete(fn); },
    dispatch(action) {
      if (dispatching) throw new Error("Reducers cannot dispatch actions");
      if (!action?.type) throw new TypeError("Action must have a type");
      try {
        dispatching = true;
        state = reducer(state, action);
      } finally {
        dispatching = false;
      }
      listeners.forEach(fn => fn());
      return action;
    }
  };
}

// Pure reducer
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case "INC":   return { ...state, count: state.count + 1 };
    case "DEC":   return { ...state, count: state.count - 1 };
    case "RESET": return { count: 0 };
    default:      return state;   // always return state for unknown actions
  }
}

// Middleware
const logger = store => next => action => {
  console.log("dispatching", action);
  const result = next(action);
  console.log("next state", store.getState());
  return result;
};

const thunk = store => next => action => {
  if (typeof action === "function") return action(store.dispatch, store.getState);
  return next(action);
};

// Compose middleware
function applyMiddleware(...middlewares) {
  return createStore => (reducer, initialState) => {
    const store = createStore(reducer, initialState);
    const chain = middlewares.map(m => m(store));
    const dispatch = chain.reduceRight((next, m) => m(next), store.dispatch);
    return { ...store, dispatch };
  };
}
```

## 17.2 Immutable Updates

```js
// Without Immer — verbose but explicit
const nextState = {
  ...state,
  users: state.users.map(user =>
    user.id === targetId ? { ...user, name: newName } : user
  )
};

// With structuredClone + mutation (ES2022, synchronous, no library)
function updateUser(state, id, updates) {
  const next = structuredClone(state);
  const user = next.users.find(u => u.id === id);
  if (user) Object.assign(user, updates);
  return next;
}

// Structural sharing: only changed nodes are new (efficient)
// Root → Users array → Changed user object (new)
//                   → Unchanged user objects (same reference)
```

---

# SECTION 18: Performance Optimization

## 18.1 Debounce and Throttle

```js
// DEBOUNCE: execute AFTER last call in a burst (search input, resize handler)
function debounce(fn, delay) {
  let id;
  function debounced(...args) {
    clearTimeout(id);
    id = setTimeout(() => fn.apply(this, args), delay);
  }
  debounced.cancel = () => clearTimeout(id);
  debounced.flush  = (...args) => { clearTimeout(id); fn.apply(this, args); };
  return debounced;
}

const searchUsers = debounce(query => fetch(`/search?q=${query}`), 300);
input.addEventListener("input", e => searchUsers(e.target.value));

// THROTTLE: execute at most once per interval (scroll, mousemove, resize)
function throttle(fn, interval) {
  let lastCall = 0;
  let id;
  return function(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastCall);
    clearTimeout(id);
    if (remaining <= 0) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      id = setTimeout(() => { lastCall = Date.now(); fn.apply(this, args); }, remaining);
    }
  };
}

window.addEventListener("scroll", throttle(() => updateScrollIndicator(), 16)); // ~60fps
```

## 18.2 Rendering Optimization

```js
// Virtual list — render only visible items (critical for 10k+ item lists)
function VirtualList({ items, itemHeight, viewportHeight }) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex   = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + viewportHeight) / itemHeight)
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div style={{ height: viewportHeight, overflow: "auto" }}
         onScroll={e => setScrollTop(e.target.scrollTop)}>
      <div style={{ height: items.length * itemHeight, position: "relative" }}>
        {visibleItems.map((item, i) => (
          <div key={item.id} style={{ position: "absolute", top: (startIndex + i) * itemHeight }}>
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}

// Break up long tasks to avoid INP (Interaction to Next Paint) issues
async function processLargeArray(items, chunkSize = 100) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    processChunk(chunk);
    await new Promise(r => setTimeout(r, 0));   // yield to browser event loop
  }
}

// Memoized selector (reselect pattern)
function createSelector(...inputSelectors) {
  const resultFn = inputSelectors.pop();
  let lastInputs = null;
  let lastResult = null;

  return function(state) {
    const inputs = inputSelectors.map(s => s(state));
    if (lastInputs && inputs.every((v, i) => v === lastInputs[i])) return lastResult;
    lastInputs = inputs;
    lastResult = resultFn(...inputs);
    return lastResult;
  };
}

const selectVisibleTodos = createSelector(
  state => state.todos,
  state => state.filter,
  (todos, filter) => todos.filter(t => filter === "all" || t.status === filter)
);
```

---

# SECTION 19: TypeScript Advanced Patterns

## 19.1 Generics and Constraints

```ts
// Generic function
function identity<T>(arg: T): T { return arg; }

// Constrained generic
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic interface
interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  save(entity: Omit<T, "id"> & Partial<Pick<T, "id">>): Promise<T>;
  delete(id: ID): Promise<void>;
}

// Generic class
class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners = new Map<keyof Events, Set<Function>>();

  on<K extends keyof Events>(event: K, fn: (data: Events[K]) => void): () => void {
    (this.listeners.get(event) ?? this.listeners.set(event, new Set()).get(event)!).add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
}

type AppEvents = {
  "user:login":  { userId: string; timestamp: Date };
  "user:logout": { userId: string };
  "error":       { message: string; code: number };
};
const emitter = new TypedEventEmitter<AppEvents>();
emitter.on("user:login", ({ userId, timestamp }) => { /* type safe */ });
```

## 19.2 Utility and Conditional Types

```ts
type User = { id: number; name: string; email: string; role: "admin" | "user" };

// Built-in utility types
type ReadonlyUser   = Readonly<User>;
type PartialUser    = Partial<User>;
type RequiredUser   = Required<Partial<User>>;
type NoId           = Omit<User, "id">;
type IdAndName      = Pick<User, "id" | "name">;
type UserRecord     = Record<string, User>;
type RoleUnion      = User["role"];             // "admin" | "user"
type NonNullUser    = NonNullable<User | null>; // User

// Conditional types
type IsArray<T>     = T extends any[] ? true : false;
type ElementType<T> = T extends (infer E)[] ? E : never;
type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;

// Infer keyword
type ReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

type Parameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

// Distributive conditional types (distributes over union)
type ToArray<T> = T extends any ? T[] : never;
type Test = ToArray<string | number>;   // string[] | number[]

// Prevent distribution with tuple wrapping
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Test2 = ToArrayNonDist<string | number>;   // (string | number)[]

// Mapped types
type Nullable<T>     = { [K in keyof T]: T[K] | null };
type Optional<T>     = { [K in keyof T]?: T[K] };
type Mutable<T>      = { -readonly [K in keyof T]: T[K] };
type Required<T>     = { [K in keyof T]-?: T[K] };

// Deep readonly
type DeepReadonly<T> = T extends (infer E)[]
  ? ReadonlyArray<DeepReadonly<E>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// Template literal types
type EventName    = "click" | "focus" | "blur";
type HandlerName  = `on${Capitalize<EventName>}`;   // "onClick" | "onFocus" | "onBlur"
type CSSProperty  = `${string}-${string}`;

// Discriminated unions — exhaustive pattern matching
type Shape =
  | { kind: "circle";    radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle";  base: number;  height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":    return Math.PI * shape.radius ** 2;
    case "rectangle": return shape.width * shape.height;
    case "triangle":  return 0.5 * shape.base * shape.height;
    default:          return shape satisfies never;   // compile error if case missed
  }
}

// Result type
type Result<T, E = Error> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

function parseJSON<T>(json: string): Result<T> {
  try   { return { ok: true,  value: JSON.parse(json) }; }
  catch (e) { return { ok: false, error: e as Error }; }
}

// satisfies operator (TS 4.9): validate type without widening
const config = {
  port:    3000,
  host:    "localhost",
  timeout: 5000
} satisfies Partial<ServerConfig>;
// config.port is number (not ServerConfig["port"]), but type-checked against ServerConfig
```

**L3 SIGNAL:** Must know: (1) Structural type system: types are compatible based on shape, not name — enables duck typing at the type level but creates subtle bugs with excess property checks (only active at assignment sites, not at function calls). (2) Complex conditional and mapped types have compile-time cost — large codebases with deeply nested generic types can cause LSP to lag. (3) Declaration merging for module augmentation. (4) `any` is a type hole — every `any` disables type checking both for the value AND for things it's passed to. `unknown` is always safer (forces narrowing before use). (5) The `as` cast is an escape hatch that bypasses type safety — overuse is a code smell; `satisfies` is usually better.

---

# SECTION 20: Concurrency and Real-time Patterns

## 20.1 Concurrency Control

```js
// Concurrency limiter — max N parallel operations
class ConcurrencyLimiter {
  #queue = [];
  #running = 0;
  #limit;

  constructor(limit) { this.#limit = limit; }

  async run(fn) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ fn, resolve, reject });
      this.#flush();
    });
  }

  async #flush() {
    while (this.#running < this.#limit && this.#queue.length) {
      const { fn, resolve, reject } = this.#queue.shift();
      this.#running++;
      fn().then(resolve, reject).finally(() => { this.#running--; this.#flush(); });
    }
  }
}

// Process 500 URLs, max 10 concurrent
const limiter = new ConcurrencyLimiter(10);
const results = await Promise.all(urls.map(url => limiter.run(() => fetch(url))));

// Token bucket rate limiter
class TokenBucket {
  #tokens;
  #max;
  #rate;   // tokens per ms
  #last;

  constructor(max, perSecond) {
    this.#tokens = this.#max = max;
    this.#rate = perSecond / 1000;
    this.#last = Date.now();
  }

  #refill() {
    const now = Date.now();
    this.#tokens = Math.min(this.#max, this.#tokens + (now - this.#last) * this.#rate);
    this.#last = now;
  }

  async consume(tokens = 1) {
    while (true) {
      this.#refill();
      if (this.#tokens >= tokens) { this.#tokens -= tokens; return; }
      await new Promise(r => setTimeout(r, (tokens - this.#tokens) / this.#rate));
    }
  }
}
```

## 20.2 Real-time Communication

```js
// Server-Sent Events — server to client, unidirectional, auto-reconnect
// Server (Express):
app.get("/stream", (req, res) => {
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");

  // Named event
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  send("connected", { time: Date.now() });

  const interval = setInterval(() => send("tick", { time: Date.now() }), 1000);
  req.on("close", () => clearInterval(interval));
});

// Client:
const es = new EventSource("/stream");
es.addEventListener("tick", e => console.log(JSON.parse(e.data)));
es.onerror = () => { /* browser auto-reconnects after 3s */ };

// WebSocket with exponential backoff reconnect
class RobustWS {
  #url; #ws; #delay = 1000; #maxDelay = 30000;
  #handlers = new Map();

  constructor(url) { this.#url = url; this.#connect(); }

  #connect() {
    this.#ws = new WebSocket(this.#url);
    this.#ws.onopen    = () => { this.#delay = 1000; this.#emit("open"); };
    this.#ws.onmessage = e => this.#emit("message", JSON.parse(e.data));
    this.#ws.onclose   = () => {
      this.#emit("close");
      setTimeout(() => this.#connect(), this.#delay);
      this.#delay = Math.min(this.#delay * 2, this.#maxDelay);
    };
  }

  send(data)       { if (this.#ws.readyState === WebSocket.OPEN) this.#ws.send(JSON.stringify(data)); }
  on(event, fn)    { (this.#handlers.get(event) ?? this.#handlers.set(event, new Set()).get(event)).add(fn); }
  #emit(event, d)  { this.#handlers.get(event)?.forEach(fn => fn(d)); }
}
```

---

# SECTION 21: ES2020–2024 Feature Reference

| Feature | Version | Description |
|---|---|---|
| Optional chaining `?.` | ES2020 | `user?.address?.city` — short-circuits on null/undefined |
| Nullish coalescing `??` | ES2020 | `val ?? "default"` — only falls back on null/undefined (not 0 or "") |
| `Promise.allSettled` | ES2020 | Wait for all, get results regardless of outcome |
| `BigInt` | ES2020 | Arbitrary precision integers: `9007199254740993n` |
| `globalThis` | ES2020 | Unified global object across environments (browser/Node/worker) |
| Logical assignment `\|\|=` `&&=` `??=` | ES2021 | `a ??= "default"` — assign if null/undefined |
| `Promise.any` | ES2021 | First fulfilled wins; AggregateError if all reject |
| Numeric separators | ES2021 | `1_000_000` for readability |
| `WeakRef` | ES2021 | Optional reference that doesn't prevent GC |
| `FinalizationRegistry` | ES2021 | Cleanup callback after GC |
| Private class fields `#` | ES2022 | `#field` — truly private, spec-level enforcement |
| `Object.hasOwn` | ES2022 | Safe replacement for `hasOwnProperty` |
| `.at()` | ES2022 | Negative indexing: `arr.at(-1)` |
| Error cause | ES2022 | `new Error("msg", { cause: originalErr })` |
| Top-level await | ES2022 | `await` at module top level (ESM only) |
| `structuredClone` | ES2022 | Deep clone without JSON roundtrip, handles Date/Map/Set/RegExp |
| `Array.toSorted` | ES2023 | Non-mutating sort — returns new array |
| `Array.toReversed` | ES2023 | Non-mutating reverse |
| `Array.toSpliced` | ES2023 | Non-mutating splice |
| `Array.with(i, v)` | ES2023 | Non-mutating index set |
| `Object.groupBy` | ES2024 | Group array by key function |
| `Map.groupBy` | ES2024 | Like Object.groupBy but returns Map |
| `Promise.withResolvers` | ES2024 | Expose resolve/reject outside executor |
| `ArrayBuffer.resize` | ES2024 | Resizable buffers |
| `RegExp.escape` | ES2025 | Safe escape of string for use in RegExp |

---

# SECTION 22: JavaScript Gotcha Cheat Sheet

| Code | Output | Why |
|---|---|---|
| `typeof null` | `"object"` | Historical bug — null is a primitive |
| `0.1 + 0.2 === 0.3` | `false` | IEEE 754 floating point imprecision |
| `NaN === NaN` | `false` | NaN is never equal to itself |
| `[] == ![]` | `true` | `![]` = false, `[] == false` → both become 0 |
| `typeof []` | `"object"` | Arrays are objects — use `Array.isArray()` |
| `[10,2,1].sort()` | `[1, 10, 2]` | String sort: "10" < "2" lexicographically |
| `{} + []` | `0` | `{}` parsed as empty block; `+[]` = `+""` = 0 |
| `[] + {}` | `"[object Object]"` | Both coerced to string |
| `null + 1` | `1` | null → 0 in numeric context |
| `undefined + 1` | `NaN` | undefined → NaN |
| `Boolean([])` | `true` | Non-null object — even empty array is truthy |
| `Boolean("")` | `false` | Empty string is falsy |
| `"5" - 3` | `2` | `-` forces numeric coercion |
| `"5" + 3` | `"53"` | `+` prefers string concatenation |
| `[1] == 1` | `true` | `[1]` → `"1"` → `1` via ToPrimitive |
| `null == undefined` | `true` | Special spec rule |
| `null === undefined` | `false` | Different types |
| `0 === -0` | `true` | Use `Object.is(0, -0)` for distinction |
| `Object.is(NaN, NaN)` | `true` | Only correct NaN equality check |
| `new Array(3)` | `[empty × 3]` | Sparse array, not `[undefined, undefined, undefined]` |
| `new Array(3).map(() => 1)` | `[empty × 3]` | `map` skips sparse holes |
| `typeof undeclared` | `"undefined"` | `typeof` doesn't throw on undeclared vars |
| `parseInt("09")` | `9` | Modern engines; always pass radix: `parseInt("09", 10)` |
| `0.1 + 0.7` | `0.7999...96` | IEEE 754 — never use floats for financial calculations |
| `[] + []` | `""` | Both arrays ToPrimitive to `""` |

---

# SECTION 23: AI Interviewer Signal Reference Matrix

## Assessment Matrix by Topic

| Topic | Junior Signal | Mid Signal | Senior Signal |
|---|---|---|---|
| Type coercion | Knows `===` vs `==`, falsy list | Explains ToPrimitive, intentional `==` use | Designs APIs to avoid coercion surprises |
| Closures | Counter factory pattern | GC implications, module encapsulation | Scope sharing in V8, leak diagnosis |
| Async/Await | Single fetch, basic try/catch | `Promise.all`, forEach gotcha | Event loop, backpressure, Node 15+ rejection |
| Prototypes | Uses classes/extends | Explains chain, class is sugar | Prototype pollution risk, composition vs inheritance |
| Event loop | JS is single-threaded | Microtask/macrotask output order | libuv phases, starvation, Node vs browser diff |
| Memory | GC exists | 4 leak patterns, WeakMap cache | DevTools profiling, V8 GC, object pooling |
| Modules | import/export | Tree-shaking, ESM vs CJS | Dual package hazard, module federation |
| TypeScript | Basic types, interfaces | Generics, discriminated unions | Conditional types, structural typing edge cases |
| Testing | Happy path unit tests | Mocking, async, test pyramid | Property-based, mutation testing, architecture |
| Performance | Knows debounce concept | Implements debounce/throttle, virtualization | V8 hidden classes, JIT, profiling |
| Security | No innerHTML with user input | XSS, DOMPurify, input validation | Prototype pollution, timing attacks, CSP |
| Design Patterns | Names 2-3 patterns | Implements Observer, Factory, Module | Trade-off reasoning, avoids over-engineering |

---

## Red Flag Signals

### L1 Junior Red Flags (should eliminate from consideration)
- Cannot explain difference between `let`, `const`, `var`
- Does not know arrays and objects are reference types
- Writes `x == null || x == undefined` instead of `x == null`
- Cannot write a basic callback function
- Believes `setTimeout(fn, 0)` executes immediately
- Does not know `typeof null === "object"` is a quirk

### L2 Mid Red Flags (concern signals)
- Uses `var` by default in new code
- Cannot implement `debounce` from scratch
- Does not know `Array.sort()` mutates in place
- No error handling in async/await (missing try/catch)
- Overuses `any` in TypeScript
- Cannot explain why `this` is undefined in a callback
- Does not know the difference between shallow and deep clone

### L3 Senior Red Flags (strong concern signals)
- Cannot explain the event loop and its phases
- Does not consider memory implications of closure patterns
- Always reaches for a library without being able to explain the underlying mechanism
- Cannot discuss ESM vs CJS trade-offs in production Node.js services
- Unaware of prototype pollution as a security vector
- Proposes deep inheritance hierarchies without considering composition
- Cannot read a V8 CPU profile
- Does not know that `Promise.all` fails fast (and when `allSettled` is more appropriate)
- Designs APIs that mix sync and async return paths (Zalgo anti-pattern)
- Cannot discuss trade-offs between different approaches (always has one "correct" answer)

---

# SECTION 24: Ecosystem and Tooling

## Bundler Comparison for Senior Trade-off Discussion

| Tool | Algorithm | Best For | Trade-offs |
|---|---|---|---|
| webpack 5 | CommonJS + ESM, incremental | Large apps, micro-frontend (Module Federation) | Complex config, slowest cold build, best ecosystem, persistent cache |
| Rollup | ESM-first, pure tree-shaking | Library authoring | Poor code-splitting, best output quality for libraries |
| Vite | ESM in dev, Rollup in prod | DX, SPAs | No bundling in dev (native ESM); prod still needs Rollup |
| esbuild | Go-based, parallel, 10-100x faster | CI, large builds needing speed | No TS type-checking, limited plugin ecosystem |
| Parcel | Zero-config | Prototypes, small projects | Opinionated defaults, hard to customize at scale |
| Turbopack | Incremental computation (Rust) | Next.js, large TS monorepos | Still maturing; excellent incremental rebuild speed |

## Runtime Comparison

```
Node.js (v20 LTS)
 ├─ V8 engine
 ├─ npm ecosystem, node_modules
 ├─ CJS default, ESM via .mjs / "type": "module"
 ├─ No browser API compat until Node 18 (fetch)
 └─ Mature, battle-tested in production

Deno (v2.x)
 ├─ V8 engine
 ├─ ESM only, npm compatibility via npm: prefix
 ├─ Browser-compatible APIs (fetch, WebCrypto, etc.)
 ├─ TypeScript built-in (no build step)
 ├─ Secure by default (permissions required)
 └─ deno.json for config, no node_modules

Bun (v1.x)
 ├─ JavaScriptCore engine (not V8!)
 ├─ All-in-one: runtime + bundler + test runner + package manager
 ├─ Fastest npm install, fastest JS runtime in benchmarks
 ├─ Node.js API compatibility layer (not 100%)
 └─ Still maturing — production use requires careful validation
```

**Senior question:** "When would you use Bun in production?"
- **Good answer:** greenfield projects with simple dependencies, scripts, CI tasks, where startup speed matters
- **Bad answer:** "Always, it's faster" — ignores ecosystem maturity, API gaps, JavaScriptCore vs V8 behavior differences, native module compatibility

---

# SECTION 25: Patterns for Scale — When JavaScript Breaks Down

## Architectural Limits of JavaScript (Senior Differentiation Zone)

### CPU-bound workloads
JavaScript's single-threaded event loop makes it poorly suited for synchronous CPU-intensive computation. Worker Threads add parallelism but with overhead. Senior engineers must know when to: offload to WASM (WebAssembly for near-native speed), native Node.js addons (N-API/node-addon-api), or a separate microservice in Go/Rust/Java. Example: image processing, video transcoding, ML inference, cryptographic operations.

### Memory pressure and GC pauses
V8's GC is generational: Scavenger (minor GC, fast, for short-lived objects) and Mark-Compact (major GC, can cause >100ms pauses). In real-time systems (WebSockets, gaming, trading), GC pauses cause latency spikes. Solutions: object pooling, allocation-free hot paths, typed arrays, pre-allocating buffers.

### The cost of JSON at scale
`JSON.stringify` and `JSON.parse` are synchronous and block the event loop. For payloads >100KB, they can cause noticeable lag. Solutions: streaming JSON parsers (`clarinet`, `JSONStream`), binary formats (`MessagePack`, `CBOR`, `Protocol Buffers` via `protobufjs`), or moving serialization to worker threads.

### Type safety at runtime
TypeScript types are erased at runtime. In distributed systems, runtime schema validation at API boundaries is non-negotiable. Libraries: Zod (ergonomic, slightly slower), Ajv (JSON Schema, fastest), Valibot (smallest bundle), io-ts (FP-style, most type-safe). Senior must discuss the cost of Zod.parse in hot paths (cold parse has overhead) and when to use pre-compiled validators.

### Monolithic event loop failure modes
A single blocked event loop stalls ALL requests on that process. This is why: streaming APIs instead of buffering, never using `fs.readFileSync` in servers, avoiding synchronous crypto in hot paths, and chunking large data processing with `setTimeout(fn, 0)` yields are not optional — they are reliability requirements.

```js
// BAD: blocking event loop in HTTP server
app.get("/process", (req, res) => {
  const result = JSON.parse(fs.readFileSync("huge.json", "utf8"));  // blocks ALL requests
  res.json(result);
});

// GOOD: async everywhere
app.get("/process", async (req, res) => {
  const data = await fs.promises.readFile("huge.json", "utf8");
  const result = JSON.parse(data);   // still sync, but I/O was async
  res.json(result);
});

// BETTER: stream for truly large files
app.get("/process", (req, res) => {
  const stream = fs.createReadStream("huge.json");
  pipeline(stream, JSONStream.parse("*"), res, err => {
    if (err) res.status(500).end();
  });
});
```

---

## Senior Differentiator Question Bank

**Performance diagnosis:**
> "A Node.js service processing 50,000 webhook events per minute has gradually increasing response latency over 2 weeks. Walk me through your diagnosis."

Expected answer covers: event loop lag monitoring (`clinic.js`, `0x`, `clinic flame`), heap snapshot comparison over time, GC pause frequency via `--trace-gc`, checking for synchronous JSON.parse on large payloads, Promise chain depth, missing `await` causing uncontrolled concurrency, stream backpressure being ignored, memory leak in closures/event listeners. Should mention Worker Threads for CPU work and evaluating whether the event loop is being starved.

**Architecture:**
> "You need to implement a real-time notification system for 100,000 concurrent users. Walk me through your architecture."

Expected answer covers: WebSockets vs SSE (SSE is simpler, HTTP/2 multiplexes, auto-reconnects; WS for bidirectional), horizontal scaling requires sticky sessions or pub/sub (Redis pub/sub), message delivery guarantees (at-most-once vs at-least-once), backpressure when client is slow, heartbeat/ping for dead connection detection, graceful reconnection with missed event replay.

**Trade-offs:**
> "Should you use a class or a plain function returning an object for this service abstraction?"

Expected answer: Classes provide a familiar OOP interface, prototype chain for method sharing, and `instanceof` checks. Plain objects (factory functions) provide better encapsulation (truly private via closure), no `this` binding issues, easier to compose, and often easier to test. Classes add prototype overhead for many small instances. For shared services and singletons, either works. For value objects created frequently, plain objects or classes with pool are better. The answer depends on the use case — red flag if they say one is always better.

---

*End of JavaScript RAG Knowledge Base — optimized for semantic chunking on `##` section boundaries*