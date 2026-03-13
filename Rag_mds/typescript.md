# TypeScript RAG Knowledge Base — Complete Technical Reference
## AI Interviewer Context Document | Three-Level Seniority Model

---

# SECTION 1: TYPE SYSTEM FUNDAMENTALS

## 1.1 Primitive Types

TypeScript's primitive types map directly to JavaScript primitives but add compile-time enforcement.

```typescript
// Core primitives
let age: number = 25;
let name: string = "Alice";
let isActive: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
let sym: symbol = Symbol("key");
let bigNum: bigint = 9007199254740993n;

// Type inference — TypeScript infers type from assignment
let inferred = 42; // inferred as number
let msg = "hello"; // inferred as string

// const narrows to literal type
const pi = 3.14; // type is 3.14, not number
const greeting = "hello"; // type is "hello", not string
```

**Junior Signal:** Knows primitives, can annotate variables. May not understand why `const` creates literal types.

---

## 1.2 any, unknown, never, void

These four types are special in TypeScript's type algebra.

```typescript
// any — escape hatch, disables type checking. Avoid.
let x: any = "hello";
x = 42;         // OK
x.foo();        // OK at compile time, may fail at runtime
x.toUpperCase(); // No error even if x is number

// unknown — type-safe alternative to any
let y: unknown = "hello";
y.toUpperCase(); // ERROR: Object is of type 'unknown'
if (typeof y === "string") {
  y.toUpperCase(); // OK — narrowed to string
}

// Difference: any is a two-way escape, unknown is a one-way receive
function processInput(input: unknown) {
  // Must narrow before use
  if (typeof input === "string") return input.trim();
  if (typeof input === "number") return input.toFixed(2);
  return String(input);
}

// never — bottom type, represents unreachable code
function fail(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}

// never in exhaustive checks
type Shape = "circle" | "square";
function area(s: Shape) {
  switch (s) {
    case "circle": return Math.PI;
    case "square": return 1;
    default:
      const _exhaustive: never = s; // compile error if Shape gets new member
      return _exhaustive;
  }
}

// void — function returns nothing (not never — it can return, just returns undefined)
function logMessage(msg: string): void {
  console.log(msg);
  // implicit return undefined
}

// void vs never
// void: function completes normally but has no return value
// never: function never completes (throws or infinite loops)
```

**Senior Signal:** Uses `never` for exhaustive checks and type algebra. Understands why `unknown` is preferred over `any` for user input or API responses.

---

## 1.3 Object Types, Interfaces, Type Aliases

```typescript
// Object type inline
let user: { name: string; age: number } = { name: "Bob", age: 30 };

// Interface — extendable, can be declaration-merged
interface User {
  id: number;
  name: string;
  email?: string; // optional
  readonly createdAt: Date; // cannot be reassigned
}

// Interface extension
interface Admin extends User {
  permissions: string[];
}

// Multiple interface extension
interface SuperAdmin extends Admin, Auditable {
  superPower: string;
}

// Type alias — more flexible, cannot be merged
type Point = {
  x: number;
  y: number;
};

// Type alias for unions (interfaces cannot do this)
type ID = string | number;
type Status = "pending" | "active" | "closed";
type NullableString = string | null;

// Intersection types (type alias only)
type Timestamped = { createdAt: Date; updatedAt: Date };
type UserWithTimestamp = User & Timestamped;

// Interface vs Type — practical differences
// 1. Interfaces can be merged (declaration merging)
interface Window {
  myProperty: string;
}
// Adds to the existing Window interface — useful for augmenting third-party types

// 2. Type aliases can represent any type, interfaces can only represent object shapes
type StringOrNumber = string | number; // Valid type alias
// interface StringOrNumber = string | number; // INVALID

// 3. Computed properties only in type aliases
type Keys = "a" | "b" | "c";
type Mapped = { [K in Keys]: boolean }; // OK
```

---

## 1.4 Arrays and Tuples

```typescript
// Array syntax — two equivalent forms
let nums1: number[] = [1, 2, 3];
let nums2: Array<number> = [1, 2, 3]; // Generic form

// Readonly arrays
let fixed: readonly number[] = [1, 2, 3];
let fixed2: ReadonlyArray<number> = [1, 2, 3];
fixed.push(4); // ERROR: Property 'push' does not exist on type 'readonly number[]'

// Tuple — fixed-length, position-typed array
let pair: [string, number] = ["hello", 42];
let [label, value] = pair; // destructuring works

// Optional tuple elements
type OptionalTuple = [string, number?]; // second element optional
const t1: OptionalTuple = ["hello"]; // OK
const t2: OptionalTuple = ["hello", 42]; // OK

// Rest elements in tuples
type StringsThenNumber = [...string[], number];
const s1: StringsThenNumber = [1]; // ERROR
const s2: StringsThenNumber = ["a", "b", 42]; // OK

// Named tuple elements (TS 4.0+)
type Range = [start: number, end: number];
function getRange(): Range {
  return [0, 100];
}
const [start, end] = getRange(); // IDE shows names in hover

// Tuple as function parameter type (common in React hooks pattern)
function useState<T>(initial: T): [T, (val: T) => void] {
  let state = initial;
  return [state, (val) => { state = val; }];
}
```

---

## 1.5 Enums

```typescript
// Numeric enum (default, auto-increments from 0)
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

// Custom numeric values
enum HttpStatus {
  OK = 200,
  Created = 201,
  NotFound = 404,
  InternalError = 500
}

// String enum — preferred in most cases (no reverse mapping, cleaner JS output)
enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Pending = "PENDING"
}

// Const enum — inlined at compile time, no runtime object
const enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}
// Compiled to: const c = "RED" (no Color object exists at runtime)
const c = Color.Red;

// Enum pitfalls
enum NumericEnum { A = 1 }
const x = NumericEnum[99]; // undefined — reverse mapping quirk
// TypeScript does not prevent assigning arbitrary numbers to numeric enums:
const bad: NumericEnum = 999; // No compile error!

// Alternatives to enum (often preferred)
// 1. Const object + typeof
const DIRECTION = {
  Up: "UP",
  Down: "DOWN",
} as const;
type Direction2 = typeof DIRECTION[keyof typeof DIRECTION]; // "UP" | "DOWN"

// 2. Union of string literals
type StatusLiteral = "ACTIVE" | "INACTIVE" | "PENDING";
// Better tree-shaking, no runtime object, no numeric assignment pitfall
```

**Mid Signal:** Knows string enums vs numeric, understands const enum inlining. Can argue for/against enums vs const objects.

---

# SECTION 2: TYPE MANIPULATION AND ADVANCED TYPES

## 2.1 Union and Intersection Types

```typescript
// Union type — value can be one of several types
type StringOrNumber = string | number;
type Result = "success" | "failure" | "pending";

// Discriminated union — property that acts as a tag
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rectangle"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2; // shape narrowed to circle
    case "square":
      return shape.side ** 2;
    case "rectangle":
      return shape.width * shape.height;
  }
  // TypeScript knows this is exhaustive if all cases handled
}

// Intersection type — value must satisfy all constituent types
type Serializable = { serialize(): string };
type Loggable = { log(): void };
type LoggableSerializable = Serializable & Loggable;

// Intersection with primitives creates never
type Impossible = string & number; // type is never

// Practical intersection: combining interfaces
type ApiResponse = {
  status: number;
  headers: Record<string, string>;
} & {
  body: unknown;
  timestamp: Date;
};

// Union distribution — important for conditional types
type ToArray<T> = T extends any ? T[] : never;
type StringOrNumberArray = ToArray<string | number>; // string[] | number[]
// NOT (string | number)[] — distributive conditional types expand the union
```

---

## 2.2 Type Narrowing

TypeScript's control-flow analysis narrows types within branches.

```typescript
// typeof narrowing
function pad(value: string | number, padding: number) {
  if (typeof value === "string") {
    return value.padStart(padding); // value: string
  }
  return String(value).padStart(padding); // value: number
}

// instanceof narrowing
class Dog { bark() { return "woof"; } }
class Cat { meow() { return "meow"; } }
type Animal = Dog | Cat;

function makeSound(animal: Animal) {
  if (animal instanceof Dog) {
    return animal.bark(); // animal: Dog
  }
  return animal.meow(); // animal: Cat
}

// in operator narrowing
type Fish = { swim(): void };
type Bird = { fly(): void };

function move(creature: Fish | Bird) {
  if ("swim" in creature) {
    creature.swim(); // creature: Fish
  } else {
    creature.fly(); // creature: Bird
  }
}

// Truthiness narrowing
function printLength(s: string | null | undefined) {
  if (s) {
    console.log(s.length); // s: string (null and undefined are falsy)
  }
}

// Equality narrowing
function compare(x: string | number, y: string | boolean) {
  if (x === y) {
    // x and y must both be string (only shared type)
    console.log(x.toUpperCase());
  }
}

// Type predicates (user-defined type guards)
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj
  );
}

// Assertion functions (TS 3.7+)
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== "string") throw new Error("Not a string");
}

function processValue(val: unknown) {
  assertIsString(val);
  val.toUpperCase(); // val is now narrowed to string
}
```

---

## 2.3 Generics

Generics enable reusable, type-safe components.

```typescript
// Basic generic function
function identity<T>(arg: T): T {
  return arg;
}
const result = identity("hello"); // inferred as string
const result2 = identity<number>(42); // explicit

// Generic constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 30 };
getProperty(user, "name"); // string
getProperty(user, "age");  // number
getProperty(user, "foo");  // ERROR: "foo" not in user

// Generic interfaces
interface Repository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: number): Promise<void>;
}

// Generic classes
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push("hello"); // ERROR

// Default generic parameters
interface ApiConfig<T = unknown> {
  url: string;
  transform?: (data: unknown) => T;
}

// Multiple generics with constraints
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

// Conditional types with generics
type IsArray<T> = T extends any[] ? true : false;
type A = IsArray<number[]>; // true
type B = IsArray<string>;   // false

// Infer keyword in conditional types
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Unpromise<T> = T extends Promise<infer V> ? V : T;
type ArrayItem<T> = T extends (infer I)[] ? I : never;

type StringItem = ArrayItem<string[]>; // string
type NumberValue = Unpromise<Promise<number>>; // number
```

---

## 2.4 Utility Types

TypeScript ships ~20 built-in utility types. Knowing them fluently is a mid-to-senior signal.

```typescript
// Partial<T> — all properties optional
interface UpdateUserDto {
  name: string;
  email: string;
  age: number;
}
function updateUser(id: number, data: Partial<UpdateUserDto>) { /* ... */ }
updateUser(1, { name: "Bob" }); // Only name, email and age remain optional

// Required<T> — all properties required (opposite of Partial)
type RequiredUser = Required<Partial<User>>;

// Readonly<T> — all properties readonly
const frozenUser: Readonly<User> = { id: 1, name: "Alice", createdAt: new Date() };
frozenUser.name = "Bob"; // ERROR

// Record<K, V> — object type with specific key and value types
type PageViews = Record<string, number>;
const views: PageViews = { home: 1000, about: 200 };

// Practical Record usage
type RolePermissions = Record<"admin" | "user" | "guest", string[]>;
const permissions: RolePermissions = {
  admin: ["read", "write", "delete"],
  user: ["read", "write"],
  guest: ["read"],
};

// Pick<T, K> — subset of properties
type UserPreview = Pick<User, "id" | "name">;

// Omit<T, K> — all properties except K
type UserWithoutPassword = Omit<User & { password: string }, "password">;

// Exclude<T, U> — from union T, remove members assignable to U
type NonNull = Exclude<string | null | undefined, null | undefined>; // string

// Extract<T, U> — from union T, keep members assignable to U
type OnlyStrings = Extract<string | number | boolean, string | boolean>; // string | boolean

// NonNullable<T> — removes null and undefined
type SafeString = NonNullable<string | null | undefined>; // string

// Parameters<T> — tuple of function parameter types
type LogParams = Parameters<typeof console.log>; // [...data: any[]]

function createUser(name: string, age: number, email: string) {}
type CreateUserParams = Parameters<typeof createUser>; // [name: string, age: number, email: string]

// ReturnType<T> — return type of function
type CreateUserReturn = ReturnType<typeof createUser>; // void

// ConstructorParameters<T> — parameters of constructor
class Connection {
  constructor(host: string, port: number, ssl: boolean) {}
}
type ConnectionArgs = ConstructorParameters<typeof Connection>; // [string, number, boolean]

// InstanceType<T> — instance type of constructor
type ConnectionInstance = InstanceType<typeof Connection>; // Connection

// Awaited<T> — unwraps Promise recursively (TS 4.5+)
type A = Awaited<Promise<string>>;               // string
type B = Awaited<Promise<Promise<number>>>;      // number

// Template literal types (TS 4.1+)
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<"click">; // "onClick"

type Keys = "name" | "age";
type Getters = `get${Capitalize<Keys>}`; // "getName" | "getAge"

// Uppercase, Lowercase, Capitalize, Uncapitalize
type Shouting = Uppercase<"hello">; // "HELLO"
type Quiet = Lowercase<"HELLO">; // "hello"
```

---

## 2.5 Mapped Types

Mapped types transform every property of an existing type.

```typescript
// Basic mapped type
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type NullableUser = Nullable<User>;
// { id: number | null; name: string | null; email?: string | null; ... }

// Mapping modifiers: + and - add/remove optional and readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]; // removes readonly
};

type Required2<T> = {
  [K in keyof T]-?: T[K]; // removes optional (?)
};

// Key remapping with as (TS 4.1+)
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Filter properties by type
type FilterByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

type StringProps = FilterByType<{ a: string; b: number; c: string }, string>;
// { a: string; c: string }

// Combining mapped types with conditional types
type ToPromise<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K];
};
```

---

## 2.6 Conditional Types

```typescript
// Basic conditional type
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<string>; // "yes"
type B = IsString<number>; // "no"

// Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;
type C = ToArray<string | number>; // string[] | number[] (distributed!)

// Prevent distribution with tuple wrapping
type ToArraySingle<T> = [T] extends [any] ? T[] : never;
type D = ToArraySingle<string | number>; // (string | number)[]

// infer — pattern matching in types
type FlattenArray<T> = T extends (infer Item)[] ? Item : T;
type E = FlattenArray<string[]>; // string
type F = FlattenArray<number>;   // number (passthrough)

// Nested infer
type ReturnTypeOfFirstArg<T> = T extends (
  first: (...args: any[]) => infer R,
  ...rest: any[]
) => any
  ? R
  : never;

// Deep conditional
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

// Conditional types enable "type-level programming"
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type Tail<T extends any[]> = T extends [any, ...infer T] ? T : never;
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type Prepend<T, Arr extends any[]> = [T, ...Arr];
type Append<T, Arr extends any[]> = [...Arr, T];

type H = Head<[1, 2, 3]>; // 1
type Ta = Tail<[1, 2, 3]>; // [2, 3]
type L = Last<[1, 2, 3]>; // 3
```

---

# SECTION 3: FUNCTIONS

## 3.1 Function Types and Signatures

```typescript
// Function type annotation
let add: (a: number, b: number) => number = (a, b) => a + b;

// Function type alias
type MathFn = (x: number, y: number) => number;

// Interface with call signature
interface Formatter {
  (value: unknown): string;
  locale: string; // also has properties
}

// Optional and default parameters
function greet(name: string, greeting?: string, suffix: string = "!"): string {
  return `${greeting ?? "Hello"}, ${name}${suffix}`;
}

// Rest parameters
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

// Overload signatures — critical for expressing complex function contracts
function getItem(index: number): string;
function getItem(label: string): number;
function getItem(arg: number | string): string | number {
  if (typeof arg === "number") return `item_${arg}`;
  return items.indexOf(arg);
}

// Method overloads in classes
class EventBus {
  on(event: "click", handler: (e: MouseEvent) => void): void;
  on(event: "keydown", handler: (e: KeyboardEvent) => void): void;
  on(event: string, handler: (e: Event) => void): void {
    // implementation
  }
}

// Contextual typing
const nums = [1, 2, 3];
nums.forEach(n => n.toFixed()); // n is inferred as number from context

// this parameter (fake first parameter for type checking)
interface Point { x: number; y: number }
function distanceFromOrigin(this: Point): number {
  return Math.sqrt(this.x ** 2 + this.y ** 2);
}
```

---

## 3.2 Generic Functions — Advanced

```typescript
// Inference from multiple positions
function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  return arr1.map((item, i) => [item, arr2[i]]);
}

// Curried generic functions
const curry = <A, B, C>(fn: (a: A, b: B) => C) =>
  (a: A) => (b: B) => fn(a, b);

const add = curry((a: number, b: number) => a + b);
const add5 = add(5); // (b: number) => number

// Generic higher-order functions
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Variance — covariance and contravariance
// Functions are covariant in return types
type CovariantFn = () => string; // can be assigned to () => string | number
// Functions are contravariant in parameter types
type ContravariantFn = (arg: string | number) => void; // can be assigned to (arg: string) => void

// --strictFunctionTypes enforces this correctly
// Without it, method parameters are bivariant (unsound but more flexible)
```

---

# SECTION 4: CLASSES

## 4.1 Class Syntax and TypeScript Extensions

```typescript
class Animal {
  // TypeScript class field declarations (required in strict mode)
  readonly species: string;
  protected age: number;
  private _name: string;

  // Constructor parameter shorthand — creates and initializes properties
  constructor(
    public id: number,
    name: string,
    species: string,
    age: number
  ) {
    this._name = name;
    this.species = species;
    this.age = age;
  }

  // Getter and setter
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    if (value.length < 1) throw new Error("Name too short");
    this._name = value;
  }

  // Method
  describe(): string {
    return `${this._name} is a ${this.species}, age ${this.age}`;
  }
}

class Dog extends Animal {
  breed: string;

  constructor(id: number, name: string, breed: string, age: number) {
    super(id, name, "Canis lupus familiaris", age);
    this.breed = breed;
  }

  // Override parent method
  describe(): string {
    return `${super.describe()} (${this.breed})`;
  }

  bark(): string {
    return "Woof!";
  }
}

// Abstract classes — cannot be instantiated directly
abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;

  // Concrete method shared by all subclasses
  describe(): string {
    return `Area: ${this.area()}, Perimeter: ${this.perimeter()}`;
  }
}

class Circle extends Shape {
  constructor(public radius: number) { super(); }
  area() { return Math.PI * this.radius ** 2; }
  perimeter() { return 2 * Math.PI * this.radius; }
}
```

---

## 4.2 Access Modifiers and Encapsulation

```typescript
class BankAccount {
  // private — only accessible within this class
  private balance: number;

  // protected — accessible in this class and subclasses
  protected transactionLog: string[] = [];

  // public — default, accessible everywhere
  public readonly accountId: string;

  // private fields with # — JS native privacy (TS 4.3+)
  // These are truly private, even from outside code that bypasses types
  #pin: number;

  constructor(initialBalance: number, pin: number) {
    this.balance = initialBalance;
    this.accountId = Math.random().toString(36).slice(2);
    this.#pin = pin;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Deposit must be positive");
    this.balance += amount;
    this.transactionLog.push(`+${amount}`);
  }

  withdraw(pin: number, amount: number): boolean {
    if (pin !== this.#pin) return false;
    if (amount > this.balance) return false;
    this.balance -= amount;
    this.transactionLog.push(`-${amount}`);
    return true;
  }

  getBalance(): number {
    return this.balance;
  }
}

// TypeScript vs # private:
// TypeScript private: erased at compile time, not really private in JS output
// # private: JS native, enforced at runtime
class TypeScriptPrivate {
  private secret = "ts-private";
}
// At runtime: (new TypeScriptPrivate() as any).secret === "ts-private" (accessible!)

class JSPrivate {
  #secret = "js-private";
}
// At runtime: (new JSPrivate() as any).#secret === undefined (truly private)
```

---

## 4.3 Static Members and Class Patterns

```typescript
class Singleton {
  private static instance: Singleton | null = null;
  private count = 0;

  private constructor() {} // Prevent external instantiation

  static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  increment() { this.count++; }
  getCount() { return this.count; }
}

// Factory pattern with static method
class User {
  private constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly role: "admin" | "user"
  ) {}

  static createAdmin(id: number, name: string): User {
    return new User(id, name, "admin");
  }

  static createUser(id: number, name: string): User {
    return new User(id, name, "user");
  }
}

// Mixin pattern
type Constructor<T = {}> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt = new Date();
  };
}

function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;
    activate() { this.isActive = true; }
    deactivate() { this.isActive = false; }
  };
}

class BaseUser {
  constructor(public name: string) {}
}

const TimestampedUser = Timestamped(BaseUser);
const ActivatableUser = Activatable(BaseUser);
const FullUser = Timestamped(Activatable(BaseUser));

const user = new FullUser("Alice");
user.activate();
user.createdAt; // Date
```

---

# SECTION 5: INTERFACES AND STRUCTURAL TYPING

## 5.1 Structural Typing (Duck Typing)

TypeScript uses structural typing — compatibility is based on shape, not name.

```typescript
interface Printable {
  print(): void;
}

class Document {
  print(): void { console.log("Printing document"); }
}

class Image {
  print(): void { console.log("Printing image"); }
  resize(factor: number): void { console.log(`Resizing by ${factor}`); }
}

// Both work — structurally compatible with Printable
function doPrint(item: Printable): void {
  item.print();
}

doPrint(new Document()); // OK
doPrint(new Image());    // OK — Image has print(), extra methods are fine

// Object literal excess property checks — stricter than structural
function createConfig(config: { host: string; port: number }) { /* ... */ }
createConfig({ host: "localhost", port: 3000, timeout: 5000 }); // ERROR!
// Excess property 'timeout' not allowed in fresh object literal

const config = { host: "localhost", port: 3000, timeout: 5000 };
createConfig(config); // OK — widened type, no excess check
```

---

## 5.2 Interface Augmentation and Module Augmentation

```typescript
// Declaration merging — multiple interface declarations merge
interface User {
  id: number;
}
interface User {
  name: string;
}
// Result: User has both id and name

// Module augmentation — add to external library types
import "express";

declare module "express" {
  interface Request {
    user?: {
      id: number;
      role: string;
    };
  }
}

// Global augmentation
declare global {
  interface String {
    toSnakeCase(): string;
  }
  interface Window {
    analytics: {
      track(event: string): void;
    };
  }
}

String.prototype.toSnakeCase = function() {
  return this.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`).toLowerCase();
};

// Namespace merging with interfaces
namespace Validation {
  export interface StringValidator {
    isValid(s: string): boolean;
  }
}
namespace Validation {
  export interface NumberValidator {
    isValid(n: number): boolean;
  }
}
// Both interfaces accessible under Validation namespace
```

---

# SECTION 6: MODULES AND NAMESPACES

## 6.1 ES Modules in TypeScript

```typescript
// Named exports
export const PI = 3.14159;
export type Point = { x: number; y: number };
export interface Serializable { serialize(): string; }
export function add(a: number, b: number): number { return a + b; }
export class Vector { /* ... */ }

// Default export (one per module)
export default class HttpClient { /* ... */ }

// Re-exports
export { add as sum } from "./math";
export * from "./utils";
export * as utils from "./utils"; // namespace re-export

// Import forms
import defaultExport from "./module";
import { named1, named2 as alias } from "./module";
import * as namespace from "./module";
import defaultExport, { named1 } from "./module";
import "./side-effects-only";

// Dynamic imports — code splitting, lazy loading
const math = await import("./math");
math.add(1, 2);

// Type-only imports (TS 3.8+) — erased at compile time, no runtime import
import type { User, Role } from "./types";
import { type User as UserType, createUser } from "./user"; // mixed import (TS 4.5+)

// isolatedModules flag requires type-only for re-exported types
export type { User }; // required with isolatedModules if User is only a type
```

---

## 6.2 Declaration Files (.d.ts)

```typescript
// Library type declarations (typically in @types/* packages or bundled)
// user.d.ts

declare module "legacy-library" {
  export function doThing(config: LegacyConfig): Result;
  
  export interface LegacyConfig {
    url: string;
    timeout?: number;
  }
  
  export interface Result {
    data: any;
    status: number;
  }
}

// Ambient declarations — describe values that exist globally
declare const __DEV__: boolean;
declare const __VERSION__: string;

// Ambient module pattern for non-TS imports
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare module "*.png" {
  const src: string;
  export default src;
}

// .d.ts for plain JS files
// math.js
export function add(a, b) { return a + b; }
// math.d.ts
export declare function add(a: number, b: number): number;
```

---

# SECTION 7: TSCONFIG AND COMPILER OPTIONS

## 7.1 Critical tsconfig.json Options

```json
{
  "compilerOptions": {
    // Strictness — always enable in new projects
    "strict": true,                    // Enables all strict checks below
    "noImplicitAny": true,             // Error on implicit any
    "strictNullChecks": true,          // null and undefined are not assignable to other types
    "strictFunctionTypes": true,       // Contravariant function parameter checking
    "strictBindCallApply": true,       // Correct types for bind/call/apply
    "strictPropertyInitialization": true, // Properties must be initialized in constructor
    "noImplicitThis": true,            // Error on 'this' with implicit any
    "alwaysStrict": true,              // Emit "use strict" in every file

    // Additional useful strict-like flags
    "noUnusedLocals": true,            // Error on unused local variables
    "noUnusedParameters": true,        // Error on unused function parameters
    "noImplicitReturns": true,         // All code paths must return in functions with return type
    "noFallthroughCasesInSwitch": true, // No fallthrough in switch statements
    "exactOptionalPropertyTypes": true, // Optional props cannot be explicitly set to undefined
    "noUncheckedIndexedAccess": true,  // Indexed access returns T | undefined

    // Module resolution
    "module": "ESNext",                // Output module format
    "moduleResolution": "bundler",     // How imports are resolved (Node16/Bundler for modern projects)
    "esModuleInterop": true,           // Allow default imports from CommonJS modules
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,         // Allow importing .json files
    "paths": {
      "@/*": ["./src/*"]               // Path aliases
    },
    "baseUrl": ".",

    // Output
    "target": "ES2022",                // Compilation target
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,               // Generate .d.ts files
    "declarationMap": true,            // Source maps for declarations
    "sourceMap": true,

    // Performance and features
    "incremental": true,               // Faster subsequent compiles
    "skipLibCheck": true,              // Skip type checking .d.ts files
    "isolatedModules": true,           // Each file compiled independently (required by esbuild/swc)
    "verbatimModuleSyntax": true       // Replaces isolatedModules, more explicit (TS 5.0+)
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 7.2 strictNullChecks Impact

```typescript
// Without strictNullChecks — dangerous defaults
function getUser(id: number): User { /* can return null/undefined without error */ }

// With strictNullChecks — explicit about nullable
function getUser(id: number): User | null { /* must handle null */ }
function getUser2(id: number): User | undefined { /* must check undefined */ }

// Null coalescing and optional chaining (require strictNullChecks to be meaningful)
const user = getUser(1);
const name = user?.name ?? "anonymous"; // Safe access + fallback

// Non-null assertion — use sparingly
const el = document.getElementById("app")!; // asserting non-null
// Prefer type guards:
const el2 = document.getElementById("app");
if (!el2) throw new Error("Missing #app element");
el2.innerHTML = "Hello"; // narrowed to HTMLElement

// exactOptionalPropertyTypes — stricter optional handling
interface Config {
  timeout?: number; // Without exactOptional: can be set to undefined
}
const c: Config = { timeout: undefined }; // ERROR with exactOptionalPropertyTypes
const c2: Config = {}; // OK — omitted, not set to undefined

// noUncheckedIndexedAccess — safer array/object indexing
const arr = [1, 2, 3];
const first = arr[0]; // Without: number. With: number | undefined
if (first !== undefined) {
  first.toFixed(); // Now type-safe
}
```

---

# SECTION 8: ASYNC PATTERNS

## 8.1 Promises and async/await

```typescript
// Basic async function
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<User>;
}

// Error handling patterns
async function safeGetUser(id: number): Promise<User | null> {
  try {
    return await fetchUser(id);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return null;
  }
}

// Result type pattern (no exceptions)
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

async function trySafeGet<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// Promise combinators
async function loadDashboard(userId: number) {
  // Parallel execution
  const [user, posts, notifications] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchNotifications(userId),
  ]);

  // Fail-fast with first rejection: Promise.all
  // Best-effort with all results: Promise.allSettled
  const results = await Promise.allSettled([
    fetchUser(userId),
    fetchPosts(userId),
  ]);
  results.forEach(result => {
    if (result.status === "fulfilled") console.log(result.value);
    else console.error(result.reason);
  });

  // Race — first to settle wins
  const fastest = await Promise.race([
    fetchFromPrimary(),
    fetchFromBackup(),
  ]);

  // Any — first to fulfill (ignores rejections unless all reject)
  const firstSuccess = await Promise.any([
    fetchFromServer1(),
    fetchFromServer2(),
    fetchFromServer3(),
  ]);
}

// AbortController — cancellable fetch
async function fetchWithTimeout<T>(
  url: string,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## 8.2 Generators and Async Generators

```typescript
// Synchronous generator
function* range(start: number, end: number, step = 1): Generator<number> {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

for (const n of range(0, 10, 2)) {
  console.log(n); // 0, 2, 4, 6, 8
}

// Generator with send/return types
function* counter(): Generator<number, string, boolean> {
  let count = 0;
  while (true) {
    const reset = yield count;
    if (reset) count = 0;
    else count++;
  }
}

// Async generator — for streaming data
async function* streamLines(url: string): AsyncGenerator<string> {
  const response = await fetch(url);
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;
    for (const line of lines) yield line;
  }
  if (buffer) yield buffer;
}

// Consuming async generator
async function processFile(url: string) {
  for await (const line of streamLines(url)) {
    console.log(line);
  }
}

// Symbol.asyncIterator — custom async iterables
class PaginatedResults<T> {
  constructor(
    private fetchPage: (page: number) => Promise<{ items: T[]; hasNext: boolean }>
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<T> {
    let page = 0;
    let items: T[] = [];
    let idx = 0;
    let hasNext = true;

    return {
      async next() {
        if (idx >= items.length) {
          if (!hasNext) return { done: true, value: undefined };
          const result = await this.fetchPage(page++); // won't work without bind fix
          items = result.items;
          hasNext = result.hasNext;
          idx = 0;
        }
        if (idx >= items.length) return { done: true, value: undefined };
        return { done: false, value: items[idx++] };
      }
    };
  }
}
```

---

# SECTION 9: ERROR HANDLING PATTERNS

## 9.1 TypeScript Error Handling

```typescript
// Problem: catch block gives 'unknown' (with useUnknownInCatchVariables, TS 4.0+)
try {
  // ...
} catch (error) {
  // error: unknown
  if (error instanceof Error) {
    console.log(error.message); // safe
  } else if (typeof error === "string") {
    console.log(error);
  } else {
    console.log("Unknown error", error);
  }
}

// Custom error classes
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    // Fix prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: unknown) {
    super(`${resource} with id ${id} not found`, "NOT_FOUND", 404);
  }
}

// Error discrimination
function handleError(error: unknown): Response {
  if (error instanceof ValidationError) {
    return Response.json({ errors: error.fields }, { status: error.statusCode });
  }
  if (error instanceof NotFoundError) {
    return Response.json({ message: error.message }, { status: 404 });
  }
  if (error instanceof AppError) {
    return Response.json({ message: error.message }, { status: error.statusCode });
  }
  return Response.json({ message: "Internal server error" }, { status: 500 });
}

// Result/Either pattern — functional error handling without exceptions
type Ok<T> = { readonly _tag: "Ok"; readonly value: T };
type Err<E> = { readonly _tag: "Err"; readonly error: E };
type Result<T, E = Error> = Ok<T> | Err<E>;

const ok = <T>(value: T): Ok<T> => ({ _tag: "Ok", value });
const err = <E>(error: E): Err<E> => ({ _tag: "Err", error });
const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r._tag === "Ok";
const isErr = <T, E>(r: Result<T, E>): r is Err<E> => r._tag === "Err";

function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}
```

---

# SECTION 10: DECORATORS

## 10.1 Decorator Syntax (Stage 3 Proposal + Legacy)

```typescript
// tsconfig: "experimentalDecorators": true for legacy decorators
// OR use TC39 Stage 3 decorators (TS 5.0+, no tsconfig needed)

// ---- LEGACY DECORATORS (experimentalDecorators) ----

// Class decorator
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class BugReport {
  type = "report";
  title: string;
  constructor(title: string) { this.title = title; }
}

// Decorator factory — decorator that takes arguments
function log(prefix: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      console.log(`${prefix}: Calling ${propertyKey}(${JSON.stringify(args)})`);
      const result = originalMethod.apply(this, args);
      console.log(`${prefix}: ${propertyKey} returned ${JSON.stringify(result)}`);
      return result;
    };
    return descriptor;
  };
}

class Calculator {
  @log("CALC")
  add(a: number, b: number): number {
    return a + b;
  }
}

// Property decorator
function validate(validator: (value: any) => boolean) {
  return function(target: any, propertyKey: string) {
    let value: any;
    Object.defineProperty(target, propertyKey, {
      get() { return value; },
      set(newVal: any) {
        if (!validator(newVal)) {
          throw new Error(`Invalid value for ${propertyKey}: ${newVal}`);
        }
        value = newVal;
      }
    });
  };
}

class User {
  @validate((v) => typeof v === "string" && v.length > 0)
  name!: string;

  @validate((v) => typeof v === "number" && v >= 0 && v <= 150)
  age!: number;
}

// ---- TC39 STAGE 3 DECORATORS (TS 5.0+) ----

function logMethod(
  target: ClassMethodDecoratorContext
) {
  return function(this: any, ...args: any[]) {
    console.log(`Calling ${String(target.name)}`);
    return (target.value as Function).apply(this, args);
  };
}

class Service {
  @logMethod
  getData() { return []; }
}
```

---

# SECTION 11: DESIGN PATTERNS IN TYPESCRIPT

## 11.1 Creational Patterns

```typescript
// Builder Pattern — complex object construction
class QueryBuilder {
  private table: string = "";
  private conditions: string[] = [];
  private orderByField: string = "";
  private limitCount: number | null = null;
  private selectedColumns: string[] = ["*"];

  select(...columns: string[]): this {
    this.selectedColumns = columns;
    return this;
  }

  from(table: string): this {
    this.table = table;
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  orderBy(field: string): this {
    this.orderByField = field;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  build(): string {
    if (!this.table) throw new Error("Table not specified");
    let query = `SELECT ${this.selectedColumns.join(", ")} FROM ${this.table}`;
    if (this.conditions.length) query += ` WHERE ${this.conditions.join(" AND ")}`;
    if (this.orderByField) query += ` ORDER BY ${this.orderByField}`;
    if (this.limitCount !== null) query += ` LIMIT ${this.limitCount}`;
    return query;
  }
}

const query = new QueryBuilder()
  .select("id", "name", "email")
  .from("users")
  .where("active = 1")
  .where("age > 18")
  .orderBy("name")
  .limit(10)
  .build();
// "SELECT id, name, email FROM users WHERE active = 1 AND age > 18 ORDER BY name LIMIT 10"

// Abstract Factory
interface Button { render(): void; onClick(handler: () => void): void; }
interface Checkbox { render(): void; onChange(handler: (checked: boolean) => void): void; }

interface UIFactory {
  createButton(label: string): Button;
  createCheckbox(label: string): Checkbox;
}

class MaterialUIFactory implements UIFactory {
  createButton(label: string): Button {
    return {
      render() { console.log(`<MdButton>${label}</MdButton>`); },
      onClick(handler) { /* ... */ }
    };
  }
  createCheckbox(label: string): Checkbox {
    return {
      render() { console.log(`<MdCheckbox>${label}</MdCheckbox>`); },
      onChange(handler) { /* ... */ }
    };
  }
}
```

---

## 11.2 Structural Patterns

```typescript
// Proxy Pattern — type-safe interception
interface Service {
  getData(id: number): Promise<string>;
  saveData(id: number, data: string): Promise<void>;
}

class LoggingProxy implements Service {
  constructor(private service: Service) {}

  async getData(id: number): Promise<string> {
    console.log(`[LOG] getData(${id})`);
    const start = Date.now();
    try {
      const result = await this.service.getData(id);
      console.log(`[LOG] getData took ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.error(`[LOG] getData failed: ${error}`);
      throw error;
    }
  }

  async saveData(id: number, data: string): Promise<void> {
    console.log(`[LOG] saveData(${id})`);
    return this.service.saveData(id, data);
  }
}

// Decorator Pattern (structural, not TS decorator syntax)
abstract class TextComponent {
  abstract render(): string;
}

class PlainText extends TextComponent {
  constructor(private text: string) { super(); }
  render(): string { return this.text; }
}

abstract class TextDecorator extends TextComponent {
  constructor(protected component: TextComponent) { super(); }
}

class BoldDecorator extends TextDecorator {
  render(): string { return `<b>${this.component.render()}</b>`; }
}

class ItalicDecorator extends TextDecorator {
  render(): string { return `<i>${this.component.render()}</i>`; }
}

// Composable
const text = new BoldDecorator(new ItalicDecorator(new PlainText("Hello")));
text.render(); // "<b><i>Hello</i></b>"

// Adapter Pattern
// Legacy interface
interface LegacyLogger {
  writeLog(severity: number, message: string): void;
}

// Modern interface
interface Logger {
  info(message: string): void;
  error(message: string): void;
  warn(message: string): void;
}

class LegacyLoggerAdapter implements Logger {
  constructor(private legacy: LegacyLogger) {}
  info(message: string): void { this.legacy.writeLog(1, message); }
  warn(message: string): void { this.legacy.writeLog(2, message); }
  error(message: string): void { this.legacy.writeLog(3, message); }
}
```

---

## 11.3 Behavioral Patterns

```typescript
// Observer Pattern
type EventMap = {
  "user:login": { userId: number; timestamp: Date };
  "user:logout": { userId: number };
  "order:created": { orderId: string; total: number };
};

type EventHandler<T> = (data: T) => void | Promise<void>;

class TypedEventEmitter<T extends Record<string, any>> {
  private handlers = new Map<keyof T, Set<EventHandler<any>>>();

  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }

  async emit<K extends keyof T>(event: K, data: T[K]): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    await Promise.all([...handlers].map(h => h(data)));
  }
}

const emitter = new TypedEventEmitter<EventMap>();
const unsubscribe = emitter.on("user:login", ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

// Strategy Pattern
type SortStrategy<T> = (arr: T[]) => T[];

const bubbleSort: SortStrategy<number> = (arr) => {
  const result = [...arr];
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length - i - 1; j++) {
      if (result[j] > result[j + 1]) {
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
      }
    }
  }
  return result;
};

class Sorter<T> {
  constructor(private strategy: SortStrategy<T>) {}
  setStrategy(strategy: SortStrategy<T>) { this.strategy = strategy; }
  sort(arr: T[]): T[] { return this.strategy(arr); }
}

// Command Pattern — with undo/redo
interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  private text = "";
  private history: Command[] = [];
  private redoStack: Command[] = [];

  executeCommand(command: Command): void {
    command.execute();
    this.history.push(command);
    this.redoStack = [];
  }

  undo(): void {
    const command = this.history.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.history.push(command);
  }

  getText() { return this.text; }
  setText(text: string) { this.text = text; }
}
```

---

# SECTION 12: TYPESCRIPT WITH REACT (COMMON INTERVIEW CONTEXT)

## 12.1 Component Types

```typescript
import React, { FC, ReactNode, ComponentPropsWithRef, forwardRef } from "react";

// Function component with props type
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  children?: ReactNode;
}

const Button: FC<ButtonProps> = ({ label, onClick, disabled = false, variant = "primary" }) => (
  <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`}>
    {label}
  </button>
);

// More explicit typing (preferred over FC for null return inference)
function Card({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
}

function List<T>({ items, renderItem, keyExtractor, emptyMessage = "No items" }: ListProps<T>) {
  if (items.length === 0) return <p>{emptyMessage}</p>;
  return (
    <ul>
      {items.map((item, i) => (
        <li key={keyExtractor(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  );
}

// Usage — full type inference
<List
  items={[{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]}
  renderItem={(user) => <span>{user.name}</span>} // user: { id: number; name: string }
  keyExtractor={(user) => user.id}
/>

// forwardRef with TypeScript
const Input = forwardRef<HTMLInputElement, { label: string; value: string; onChange: (v: string) => void }>(
  ({ label, value, onChange }, ref) => (
    <div>
      <label>{label}</label>
      <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
);
Input.displayName = "Input";

// Extending HTML element props
interface IconButtonProps extends ComponentPropsWithRef<"button"> {
  icon: React.ReactNode;
  tooltip?: string;
}

const IconButton: FC<IconButtonProps> = ({ icon, tooltip, children, ...rest }) => (
  <button title={tooltip} {...rest}>
    {icon}
    {children}
  </button>
);
```

---

## 12.2 Hooks with TypeScript

```typescript
import { useState, useReducer, useCallback, useMemo, useEffect, useRef, createContext, useContext } from "react";

// useState — inference and explicit typing
const [count, setCount] = useState(0); // inferred: number
const [user, setUser] = useState<User | null>(null); // explicit for complex types
const [items, setItems] = useState<string[]>([]);

// useReducer — discriminated union actions
type Action =
  | { type: "INCREMENT"; by?: number }
  | { type: "DECREMENT"; by?: number }
  | { type: "RESET" }
  | { type: "SET"; value: number };

interface State { count: number; history: number[] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + (action.by ?? 1), history: [...state.history, state.count] };
    case "DECREMENT":
      return { count: state.count - (action.by ?? 1), history: [...state.history, state.count] };
    case "RESET":
      return { count: 0, history: [] };
    case "SET":
      return { count: action.value, history: [...state.history, state.count] };
    default:
      const _: never = action; // exhaustive check
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, history: [] });
dispatch({ type: "INCREMENT", by: 5 });
dispatch({ type: "RESET" });

// useRef — mutable ref vs DOM ref
const counterRef = useRef(0); // mutable: RefObject<number> — .current is mutable
const inputRef = useRef<HTMLInputElement>(null); // DOM ref: RefObject<HTMLInputElement>

// Using DOM ref
useEffect(() => {
  inputRef.current?.focus();
}, []);

// Custom hook with proper return type
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const next = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return [storedValue, setValue];
}

// Context with TypeScript
interface ThemeContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const toggleTheme = useCallback(() => setTheme(t => t === "light" ? "dark" : "light"), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

# SECTION 13: RUNTIME VALIDATION — ZONING OUT OF TYPE SYSTEM

## 13.1 Zod (Most Popular Runtime Validation)

```typescript
import { z } from "zod";

// Zod schema — both validation AND type inference
const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
  role: z.enum(["admin", "user", "guest"]),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date(), // coerces string to Date
});

// Derive TypeScript type from schema
type User = z.infer<typeof UserSchema>;
// { id: number; name: string; email: string; age?: number; role: "admin"|"user"|"guest"; tags: string[]; ... }

// Parsing (throws on failure)
const user = UserSchema.parse(rawData);

// Safe parsing (never throws)
const result = UserSchema.safeParse(rawData);
if (result.success) {
  console.log(result.data); // fully typed
} else {
  console.error(result.error.issues); // ZodIssue[]
}

// Advanced Zod patterns
const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });

const UserListResponse = PaginatedResponse(UserSchema);
type UserListResponse = z.infer<typeof UserListResponse>;

// Transform and refine
const PositiveNumber = z.number().refine(n => n > 0, { message: "Must be positive" });

const TrimmedString = z.string().transform(s => s.trim());

const DateRange = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
}).refine(data => data.start <= data.end, {
  message: "Start must be before end",
  path: ["end"],
});

// Discriminated unions in Zod
const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ type: z.literal("keydown"), key: z.string() }),
  z.object({ type: z.literal("scroll"), delta: z.number() }),
]);

// API route validation
async function createUserHandler(req: Request): Promise<Response> {
  const body = await req.json();
  const result = UserSchema.omit({ id: true, createdAt: true }).safeParse(body);

  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // result.data is now fully typed
  const user = await db.createUser(result.data);
  return Response.json(user, { status: 201 });
}
```

---

# SECTION 14: ADVANCED TYPE-LEVEL PROGRAMMING

## 14.1 Recursive Types

```typescript
// JSON type — recursive
type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

// Deep partial — recursive utility type
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// DeepRequired
type DeepRequired<T> = T extends object ? {
  [P in keyof T]-?: DeepRequired<Required<T>[P]>;
} : T;

// Flatten nested object to dotted paths
type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPaths<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

interface Config {
  server: { host: string; port: number };
  db: { url: string; name: string };
}

type ConfigPaths = DotPaths<Config>;
// "server.host" | "server.port" | "db.url" | "db.name"

// Deep get by path
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

type HostType = PathValue<Config, "server.host">; // string
type PortType = PathValue<Config, "server.port">; // number
```

---

## 14.2 Template Literal Type Magic

```typescript
// Typed event system with template literals
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ApiRoute = `/api/${string}`;

// CRUD method generation
type CrudMethods<Resource extends string> = {
  [K in `get${Capitalize<Resource>}` |
        `create${Capitalize<Resource>}` |
        `update${Capitalize<Resource>}` |
        `delete${Capitalize<Resource>}`]: unknown;
};

// CSS property helpers
type CSSProperty = "margin" | "padding" | "border";
type CSSDirection = "top" | "right" | "bottom" | "left";
type CSSDirectionalProperty = `${CSSProperty}-${CSSDirection}`;
// "margin-top" | "margin-right" | ... | "border-left"

// Pluralize
type Pluralize<T extends string> = `${T}s`;
type Models = "user" | "post" | "comment";
type ModelEndpoints = Pluralize<Models>; // "users" | "posts" | "comments"

// CSS-in-JS theme tokens
interface Theme {
  colors: { primary: string; secondary: string; danger: string };
  spacing: { sm: string; md: string; lg: string };
}

type ThemeToken<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : ThemeToken<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

type ThemeTokens = ThemeToken<Theme>;
// "colors.primary" | "colors.secondary" | "colors.danger" | "spacing.sm" | ...
```

---

## 14.3 Phantom Types — Type Safety Without Runtime Cost

```typescript
// Phantom types — type parameters that don't appear in the structure
type Brand<T, B> = T & { readonly __brand: B };

// Branded primitives
type UserId = Brand<number, "UserId">;
type PostId = Brand<number, "PostId">;
type Email = Brand<string, "Email">;
type Dollars = Brand<number, "Dollars">;
type Cents = Brand<number, "Cents">;

// Constructors with validation
function makeUserId(id: number): UserId {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid user ID");
  return id as UserId;
}

function makeEmail(email: string): Email {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  return email as Email;
}

// Now functions are type-safe — no accidental ID mixing
async function getUser(id: UserId): Promise<User> { /* ... */ }
async function getPost(id: PostId): Promise<Post> { /* ... */ }

const userId = makeUserId(42);
const postId = 42 as PostId; // could also brand directly

getUser(userId); // OK
getUser(postId); // ERROR: Argument of type 'PostId' is not assignable to parameter of type 'UserId'
getUser(42);     // ERROR: number is not UserId

// State machine with phantom types
type State<S extends string> = Brand<{ data: unknown }, S>;
type PendingOrder = State<"pending">;
type ConfirmedOrder = State<"confirmed">;
type ShippedOrder = State<"shipped">;

function confirmOrder(order: PendingOrder): ConfirmedOrder {
  // Can only confirm pending orders
  return { ...order, __brand: "confirmed" } as unknown as ConfirmedOrder;
}

function shipOrder(order: ConfirmedOrder): ShippedOrder {
  // Can only ship confirmed orders
  return { ...order, __brand: "shipped" } as unknown as ShippedOrder;
}
```

---

# SECTION 15: PERFORMANCE AND COMPILER INTERNALS

## 15.1 Type Checking Performance

```typescript
// Problem: Large union types are slow
type SlowUnion = "a" | "b" | "c" | /* ... 1000 members */ "zzz";
// TypeScript must check each member on assignment

// Solution: Use objects/maps for large sets
const ValidCodes = {
  A: "A", B: "B", /* ... */
} as const;
type ValidCode = keyof typeof ValidCodes; // Much faster type check

// Recursive types hit depth limits — TypeScript has a ~100-level recursion limit
// Iterative approaches preferred
type TupleFive = [1, 2, 3, 4, 5]; // Better than recursive tuple builder for small sizes

// infer in deeply nested generics causes slowdowns
// Cache intermediate types with type aliases
type Intermediate = SomeLongComplexType<A, B, C>;
type Final = AnotherType<Intermediate>; // faster than AnotherType<SomeLongComplexType<A,B,C>>

// skipLibCheck: true — skip type checking all .d.ts files
// Huge performance win in large projects, safe because library types are tested by authors

// Project references — split large monorepos into typed subprojects
// tsconfig.json
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/api" }
  ]
}
// Each package has composite: true
// tsc --build handles incremental compilation across projects

// Language server performance hints
// - avoid excessive conditional types in hot paths
// - prefer interface over type alias for object shapes (interfaces are cached by name)
// - use type imports to reduce load
// - avoid re-exporting entire modules
```

---

## 15.2 Type Instantiation Depth

```typescript
// Recursive types hit TypeScript's instantiation limit
// This causes "Type instantiation is excessively deep" error

// PROBLEMATIC — deep recursion
type Fibonacci<N extends number> = N extends 0
  ? 0
  : N extends 1
  ? 1
  : [Fibonacci</* N-1 */>, Fibonacci</* N-2 */>]; // hits limit quickly

// Better: Use tail-call-style or limit depth
type BuildTuple<L extends number, T extends unknown[] = []> =
  T["length"] extends L ? T : BuildTuple<L, [...T, unknown]>;
type FiveLong = BuildTuple<5>; // [unknown, unknown, unknown, unknown, unknown]

// TypeScript's type system is Turing-complete but has limits:
// - Max instantiation depth: ~100 (error: "Type instantiation is excessively deep and possibly infinite")
// - Max union/intersection size: practical limits around 500-1000 members
// - Recursive type aliases can cause performance issues

// Strategies to avoid depth issues:
// 1. Add explicit return types to reduce inference work
// 2. Break complex types into named intermediate types
// 3. Use generics more sparingly in deeply nested structures
// 4. Prefer simpler type representations
```

---

# SECTION 16: MODULE PATTERNS AND DEPENDENCY INJECTION

## 16.1 Dependency Injection in TypeScript

```typescript
// Interface-based DI — the TypeScript way
interface ILogger {
  info(message: string): void;
  error(message: string, error?: Error): void;
  warn(message: string): void;
}

interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: Omit<User, "id">): Promise<User>;
  update(id: number, data: Partial<User>): Promise<User>;
  delete(id: number): Promise<void>;
}

interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

class UserService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly logger: ILogger
  ) {}

  async registerUser(data: RegisterDto): Promise<User> {
    this.logger.info(`Registering user: ${data.email}`);

    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error("Email already registered");

    const user = await this.userRepo.save({
      name: data.name,
      email: data.email,
      role: "user",
      createdAt: new Date(),
    });

    await this.emailService.send(
      user.email,
      "Welcome!",
      `Hello ${user.name}, welcome to our platform!`
    );

    this.logger.info(`User registered: ${user.id}`);
    return user;
  }
}

// Simple DI container
class Container {
  private bindings = new Map<symbol, () => unknown>();

  bind<T>(token: symbol, factory: () => T): void {
    this.bindings.set(token, factory);
  }

  resolve<T>(token: symbol): T {
    const factory = this.bindings.get(token);
    if (!factory) throw new Error(`No binding for ${token.toString()}`);
    return factory() as T;
  }
}

const TOKENS = {
  Logger: Symbol("Logger"),
  UserRepository: Symbol("UserRepository"),
  EmailService: Symbol("EmailService"),
  UserService: Symbol("UserService"),
};

const container = new Container();
container.bind<ILogger>(TOKENS.Logger, () => new ConsoleLogger());
container.bind<IUserRepository>(TOKENS.UserRepository, () =>
  new PrismaUserRepository(db)
);
container.bind<IEmailService>(TOKENS.EmailService, () =>
  new SmtpEmailService(smtpConfig)
);
container.bind<UserService>(TOKENS.UserService, () =>
  new UserService(
    container.resolve(TOKENS.UserRepository),
    container.resolve(TOKENS.EmailService),
    container.resolve(TOKENS.Logger)
  )
);
```

---

# SECTION 17: TYPESCRIPT WITH NODE.JS / EXPRESS

## 17.1 Express Type-Safe Routing

```typescript
import express, { Request, Response, NextFunction, Router } from "express";
import { z } from "zod";

// Typed request handlers with Zod validation
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type CreateUserBody = z.infer<typeof CreateUserSchema>;

// Middleware factory for validation
function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }
    req.body = result.data;
    next();
  };
}

// Extended Request type
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: "admin" | "user";
  };
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // Verify token...
  (req as AuthenticatedRequest).user = { id: 1, role: "user" };
  next();
}

const router = Router();

router.post(
  "/users",
  validateBody(CreateUserSchema),
  async (req: Request<{}, {}, CreateUserBody>, res: Response) => {
    const user = await userService.registerUser(req.body);
    res.status(201).json(user);
  }
);

router.get(
  "/users/:id",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    const user = await userService.findById(parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  }
);
```

---

# SECTION 18: TYPESCRIPT 5.X FEATURES

## 18.1 TypeScript 5.0+ Major Features

```typescript
// TS 5.0: const type parameters
function getFirst<const T extends readonly unknown[]>(arr: T): T[0] {
  return arr[0];
}
const result = getFirst(["a", "b", "c"] as const); // type: "a", not string

// TS 5.0: Multiple extends in type parameters
function merge<T extends object, U extends object, V extends object>(
  a: T, b: U, c: V
): T & U & V {
  return { ...a, ...b, ...c };
}

// TS 5.1: Unrelated types for getters and setters
class ElementSizeBox {
  private _value: number = 0;

  get value(): number | string { // getter and setter can be different types (TS 5.1+)
    return this._value;
  }

  set value(newValue: string | number) {
    if (typeof newValue === "string") {
      this._value = parseFloat(newValue);
    } else {
      this._value = newValue;
    }
  }
}

// TS 5.2: using declarations (Explicit Resource Management)
// Requires Symbol.dispose and Symbol.asyncDispose support
class DatabaseConnection {
  private conn: unknown;

  constructor() {
    this.conn = openConnection();
  }

  [Symbol.dispose]() {
    closeConnection(this.conn);
  }
}

async function processData() {
  using connection = new DatabaseConnection(); // automatically disposed at end of scope
  // ... use connection
} // connection[Symbol.dispose]() called here automatically

// TS 5.4: NoInfer<T> — prevents inference from specific positions
function createState<S>(
  initialState: S,
  options?: { historyLength?: number; logger?: (state: NoInfer<S>) => void }
) {
  // NoInfer prevents the options.logger callback from widening S's type
}

// TS 5.5: Inferred type predicates
const nums = [1, null, 2, undefined, 3];
const filtered = nums.filter(n => n !== null && n !== undefined);
// In TS 5.5+: filtered: number[] (previously: (number | null | undefined)[])

// TS 5.0: variadic tuple improvements — spreading generics
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];
type AB = Concat<[1, 2], [3, 4]>; // [1, 2, 3, 4]
```

---

# SECTION 19: TESTING PATTERNS

## 19.1 Unit Testing TypeScript Code

```typescript
// Vitest / Jest — type-safe test utilities

// Mock typing
import { vi, type Mock } from "vitest";

// Properly typed mocks
const mockUserRepo: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Or with vi.fn() for individual mocks
const findById = vi.fn<[number], Promise<User | null>>();

// Type-safe mock implementations
mockUserRepo.findById.mockResolvedValue({
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  role: "user",
  createdAt: new Date(),
});

// Testing discriminated unions
function testShape(shape: Shape) {
  expect(area(shape)).toBeGreaterThan(0);
}

// Test data builders — type-safe test fixtures
function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: Math.floor(Math.random() * 1000),
    name: "Test User",
    email: "test@example.com",
    role: "user",
    createdAt: new Date(),
    ...overrides,
  };
}

// Type-safe assertion helpers
function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value == null) throw new Error("Expected defined value");
}

// Snapshot testing with typed data
test("user serialization", () => {
  const user = buildUser({ name: "Bob" });
  expect(JSON.stringify(user)).toMatchSnapshot();
});

// Property-based testing (fast-check)
import { fc } from "@fast-check/vitest";

const { it: fcIt } = fc;

fcIt.prop([fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 })])(
  "addition is commutative",
  (a, b) => {
    expect(a + b).toBe(b + a);
  }
);
```

---

# SECTION 20: COMMON INTERVIEW CHALLENGES AND GOTCHAS

## 20.1 TypeScript Gotchas Every Developer Should Know

```typescript
// 1. Covariance of function return types vs contravariance of parameters
type Fn1 = () => string;
type Fn2 = () => string | number;
const fn1: Fn1 = () => "hello";
const fn2: Fn2 = fn1; // OK — return type is covariant (string is subtype of string|number)

type Fn3 = (arg: string) => void;
type Fn4 = (arg: string | number) => void;
const fn4: Fn4 = (arg: string | number) => {};
const fn3: Fn3 = fn4; // OK — parameter types are contravariant (string|number is wider than string)

// 2. Enum number assignability quirk
enum Direction { Up, Down }
const d: Direction = 999; // No error for numeric enums!

// 3. Excess property checks only on fresh object literals
interface Opts { x: number }
const obj = { x: 1, y: 2 };
const o1: Opts = obj; // OK — obj is not a fresh literal
const o2: Opts = { x: 1, y: 2 }; // ERROR — fresh literal triggers excess property check

// 4. Type widening with let vs const
let x = "hello"; // type: string (widened)
const y = "hello"; // type: "hello" (literal)
let z = ["a", "b"]; // type: string[] (widened)
const arr = ["a", "b"] as const; // type: readonly ["a", "b"]

// 5. void vs undefined
type VoidFn = () => void;
const fn: VoidFn = () => "anything"; // Allowed! void in callback position ignores return value
// This is why array.forEach callbacks can return values without error

// 6. Assignability of tuples and arrays
const tuple: [number, string] = [1, "hello"];
const arr2: (number | string)[] = tuple; // OK — tuple is assignable to array

// 7. Class structural typing
class MyClass { x: number = 0; }
class OtherClass { x: number = 0; }
const c: MyClass = new OtherClass(); // OK — same shape!

// 8. Generic defaults dont help narrowing
function wrap<T = string>(val: T) {
  val.toUpperCase(); // ERROR — T is still unknown even with default
}

// 9. infer in union position
type ElementType<T> = T extends (infer E)[] ? E : never;
type E1 = ElementType<string[]>; // string
type E2 = ElementType<number[] | boolean[]>; // number | boolean — distributed!

// 10. Template literal types and number
type Stringify<T extends number | string> = `${T}`;
type N = Stringify<42>; // "42" — numbers become their literal string forms
```

---

## 20.2 Structural vs. Nominal Typing Tradeoffs

```typescript
// TypeScript is structural — this can lead to "wrong" types being accepted
interface Celsius { value: number; unit: "celsius" }
interface Fahrenheit { value: number; unit: "fahrenheit" }

function toCelsius(temp: Fahrenheit): Celsius {
  return { value: (temp.value - 32) * 5/9, unit: "celsius" };
}

const wrongTemp: Celsius = { value: 100, unit: "celsius" };
// toCelsius(wrongTemp); // ERROR — unit mismatch catches it here

// But what about plain numbers?
function addCelsius(a: number, b: number) { return a + b; }
addCelsius(100, 212); // 100°C + 212°F = nonsense, but TypeScript allows it

// Solution: Branding (nominal typing simulation)
type Celsius2 = number & { readonly __celsius: unique symbol };
type Fahrenheit2 = number & { readonly __fahrenheit: unique symbol };

function celsius(n: number): Celsius2 { return n as Celsius2; }
function fahrenheit(n: number): Fahrenheit2 { return n as Fahrenheit2; }

function addTemps(a: Celsius2, b: Celsius2): Celsius2 {
  return (a + b) as Celsius2;
}

addTemps(celsius(30), celsius(25)); // OK
addTemps(celsius(30), fahrenheit(86)); // ERROR — type mismatch
```

---

# SECTION 21: ARCHITECTURAL PATTERNS AND SENIOR CONCERNS

## 21.1 Domain-Driven Design with TypeScript

```typescript
// Value Object — immutable, equality by value
class Money {
  private constructor(
    readonly amount: number,
    readonly currency: "USD" | "EUR" | "GBP"
  ) {
    if (amount < 0) throw new Error("Amount cannot be negative");
    if (!Number.isFinite(amount)) throw new Error("Amount must be finite");
  }

  static of(amount: number, currency: "USD" | "EUR" | "GBP"): Money {
    return new Money(Math.round(amount * 100) / 100, currency);
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error("Currency mismatch");
    return Money.of(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.of(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }
}

// Entity — identity by ID
class Order {
  private readonly _id: string;
  private _items: OrderItem[] = [];
  private _status: "draft" | "placed" | "shipped" | "delivered" = "draft";

  constructor(id: string) {
    this._id = id;
  }

  get id() { return this._id; }
  get status() { return this._status; }
  get items(): readonly OrderItem[] { return this._items; }

  addItem(product: Product, quantity: number): void {
    if (this._status !== "draft") {
      throw new Error("Cannot modify a placed order");
    }
    const existing = this._items.find(i => i.productId === product.id);
    if (existing) {
      existing.increaseQuantity(quantity);
    } else {
      this._items.push(new OrderItem(product.id, product.price, quantity));
    }
  }

  place(): void {
    if (this._items.length === 0) throw new Error("Cannot place empty order");
    if (this._status !== "draft") throw new Error("Order already placed");
    this._status = "placed";
  }

  total(): Money {
    return this._items.reduce(
      (sum, item) => sum.add(item.subtotal()),
      Money.of(0, "USD")
    );
  }
}

// Aggregate Root pattern — controls access to child entities
// Repository — data access abstraction
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
}

// Domain event
interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
}

interface OrderPlacedEvent extends DomainEvent {
  readonly type: "order.placed";
  readonly orderId: string;
  readonly customerId: string;
  readonly total: Money;
}
```

---

## 21.2 CQRS and Event Sourcing with TypeScript

```typescript
// Command — intent to change state
interface Command { readonly type: string }
interface PlaceOrderCommand extends Command {
  readonly type: "PlaceOrder";
  readonly customerId: string;
  readonly items: Array<{ productId: string; quantity: number }>;
}

// Query — read-only data fetch
interface Query { readonly type: string }
interface GetOrderQuery extends Query {
  readonly type: "GetOrder";
  readonly orderId: string;
}

// Command handler
type CommandHandler<C extends Command> = (command: C) => Promise<void>;
type QueryHandler<Q extends Query, R> = (query: Q) => Promise<R>;

class CommandBus {
  private handlers = new Map<string, CommandHandler<any>>();

  register<C extends Command>(type: C["type"], handler: CommandHandler<C>): void {
    this.handlers.set(type, handler);
  }

  async dispatch<C extends Command>(command: C): Promise<void> {
    const handler = this.handlers.get(command.type);
    if (!handler) throw new Error(`No handler for command: ${command.type}`);
    await handler(command);
  }
}

// Event sourcing — state derived from sequence of events
type OrderEvent =
  | { type: "OrderCreated"; orderId: string; customerId: string; at: Date }
  | { type: "ItemAdded"; orderId: string; productId: string; quantity: number; price: number; at: Date }
  | { type: "OrderPlaced"; orderId: string; at: Date }
  | { type: "OrderShipped"; orderId: string; trackingNumber: string; at: Date };

interface OrderState {
  id: string;
  customerId: string;
  status: "draft" | "placed" | "shipped";
  items: Array<{ productId: string; quantity: number; price: number }>;
}

function applyEvent(state: OrderState | null, event: OrderEvent): OrderState {
  switch (event.type) {
    case "OrderCreated":
      return { id: event.orderId, customerId: event.customerId, status: "draft", items: [] };
    case "ItemAdded":
      if (!state) throw new Error("Order not created yet");
      return {
        ...state,
        items: [...state.items, { productId: event.productId, quantity: event.quantity, price: event.price }]
      };
    case "OrderPlaced":
      return { ...state!, status: "placed" };
    case "OrderShipped":
      return { ...state!, status: "shipped" };
  }
}

function rehydrate(events: OrderEvent[]): OrderState | null {
  return events.reduce((state: OrderState | null, event) => applyEvent(state, event), null);
}
```

---

# SECTION 22: PERFORMANCE OPTIMIZATION PATTERNS

## 22.1 Type-Safe Caching and Memoization

```typescript
// Typed LRU cache
class LRUCache<K, V> {
  private cache = new Map<K, V>();

  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value); // Move to end (most recently used)
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean { return this.cache.has(key); }
  get size(): number { return this.cache.size; }
}

// WeakMap-based memoization (auto-cleans with GC)
function weakMemo<T extends object, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new WeakMap<T, R>();
  return (arg: T) => {
    if (cache.has(arg)) return cache.get(arg)!;
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

// Selector pattern (Redux-style with TypeScript)
type Selector<S, R> = (state: S) => R;

function createSelector<S, A, R>(
  inputA: Selector<S, A>,
  resultFn: (a: A) => R
): Selector<S, R>;
function createSelector<S, A, B, R>(
  inputA: Selector<S, A>,
  inputB: Selector<S, B>,
  resultFn: (a: A, b: B) => R
): Selector<S, R>;
function createSelector(...args: any[]): any {
  const resultFn = args[args.length - 1];
  const inputSelectors = args.slice(0, -1);
  let lastInputs: any[] | null = null;
  let lastResult: any;

  return (state: any) => {
    const inputs = inputSelectors.map((sel: any) => sel(state));
    if (lastInputs && inputs.every((input, i) => input === lastInputs![i])) {
      return lastResult;
    }
    lastInputs = inputs;
    lastResult = resultFn(...inputs);
    return lastResult;
  };
}
```

---

# SECTION 23: MONOREPO AND BUILD TOOLING

## 23.1 TypeScript in Monorepos

```typescript
// tsconfig.base.json — shared config
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}

// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true, // Required for project references
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}

// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist",
    "paths": {
      "@myapp/core": ["../core/src/index.ts"]
    }
  },
  "references": [
    { "path": "../core" } // Type-safe cross-package references
  ],
  "include": ["src"]
}

// root tsconfig.json
{
  "files": [],
  "references": [
    { "path": "packages/core" },
    { "path": "packages/api" },
    { "path": "packages/web" }
  ]
}

// Build command: tsc --build (respects references and caching)
// Watch: tsc --build --watch
// Clean: tsc --build --clean
```

---

## 23.2 TypeScript with Modern Build Tools

```typescript
// esbuild — extremely fast, but transpiles only (no type checking)
// tsup — wrapper around esbuild with declaration support
// vite — uses esbuild for dev, rollup for prod
// swc — Rust-based transpiler, faster than tsc

// The modern approach: separate type checking from transpilation
// package.json scripts:
{
  "scripts": {
    "dev": "tsx watch src/index.ts", // transpile + run (development)
    "build": "tsup src/index.ts --format esm,cjs --dts", // bundle + declarations
    "typecheck": "tsc --noEmit", // type checking only, no emit
    "test": "vitest",
    "test:types": "tsd" // type-level testing
  }
}

// tsx — TypeScript execute (like ts-node but faster, uses esbuild)
// Run TypeScript directly: tsx src/server.ts
// No pre-compilation needed in development

// tsd — type testing tool
// test.d.ts
import { expectType, expectError } from "tsd";
import { add } from "./index";

expectType<number>(add(1, 2));
expectError(add("a", "b")); // verify this IS an error

// Isolating type generation from compilation
// tsconfig.build.json (for declaration files only)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "emitDeclarationOnly": true,
    "declaration": true,
    "declarationDir": "dist/types"
  },
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

---

# SECTION 24: REAL-WORLD ANTI-PATTERNS

## 24.1 Anti-Patterns to Identify in Code Review

```typescript
// ANTI-PATTERN 1: Overusing 'any'
function processData(data: any) { // loses all type safety
  return data.items.map((item: any) => item.value); // cascading any
}

// BETTER: Use generics or unknown
function processData<T extends { items: Array<{ value: unknown }> }>(data: T) {
  return data.items.map(item => item.value);
}

// ANTI-PATTERN 2: Type casting instead of type narrowing
function getLength(value: string | number): number {
  return (value as string).length; // dangerous — breaks for numbers!
}

// BETTER:
function getLength2(value: string | number): number {
  if (typeof value === "string") return value.length;
  return value.toString().length;
}

// ANTI-PATTERN 3: Mutating objects when immutability is expected
function updateUser(user: User, updates: Partial<User>): User {
  Object.assign(user, updates); // mutates original — unexpected side effect
  return user;
}

// BETTER:
function updateUser2(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
}

// ANTI-PATTERN 4: God object type
interface GodObject {
  userId: number;
  userName: string;
  userEmail: string;
  orderIds: number[];
  currentOrder: Order;
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  billingAddress: Address;
  // 50 more properties...
}

// BETTER: Composition
interface UserContext {
  user: User;
  cart: Cart;
  currentOrder?: Order;
}

// ANTI-PATTERN 5: Boolean parameter flags
function createUser(name: string, isAdmin: boolean, sendEmail: boolean) { /* ... */ }
createUser("Alice", true, false); // What do these booleans mean?

// BETTER: Options object
function createUser2(name: string, options: {
  role?: "admin" | "user";
  sendWelcomeEmail?: boolean;
}) { /* ... */ }
createUser2("Alice", { role: "admin", sendWelcomeEmail: false });

// ANTI-PATTERN 6: Not using discriminated unions
interface ApiResponse {
  data?: User;
  error?: string;
  loading?: boolean;
}
// All fields are optional — confusing combinations possible

// BETTER: Discriminated union
type ApiState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// ANTI-PATTERN 7: Ignoring the return type of error-prone functions
const result = JSON.parse(untrustedInput); // returns any, silently
// No error handling, result is untyped

// BETTER:
function safeJsonParse<T>(input: string, schema: z.ZodSchema<T>): T | null {
  try {
    return schema.parse(JSON.parse(input));
  } catch {
    return null;
  }
}

// ANTI-PATTERN 8: Excessive non-null assertions
const el = document.getElementById("app")!; // ! everywhere
const name = user!.profile!.name!; // chained ! — runtime bomb

// BETTER:
const el = document.getElementById("app");
if (!el) throw new Error("Missing #app");
// OR
const name = user?.profile?.name ?? "anonymous";
```

---

# SECTION 25: SENIOR-LEVEL SYSTEM DESIGN PATTERNS

## 25.1 Type-Safe HTTP Client

```typescript
// Route definition type — encode API contract in types
type RouteMap = {
  "GET /users": { response: User[] };
  "GET /users/:id": { params: { id: string }; response: User | null };
  "POST /users": { body: CreateUserDto; response: User };
  "PUT /users/:id": { params: { id: string }; body: UpdateUserDto; response: User };
  "DELETE /users/:id": { params: { id: string }; response: void };
};

type ExtractMethod<T extends string> = T extends `${infer M} ${string}` ? M : never;
type ExtractPath<T extends string> = T extends `${string} ${infer P}` ? P : never;

// Typed API client
class ApiClient<Routes extends Record<string, { response: unknown }>> {
  constructor(private baseUrl: string) {}

  async get<K extends keyof Routes & `GET ${string}`>(
    route: K,
    options?: Routes[K] extends { params: infer P } ? { params: P } : {}
  ): Promise<Routes[K]["response"]> {
    let path = ExtractPath<K & string>;
    if (options && "params" in options) {
      const params = (options as any).params as Record<string, string>;
      path = path.replace(/:([^/]+)/g, (_, key) => params[key] ?? key);
    }
    const response = await fetch(`${this.baseUrl}${path}`);
    return response.json();
  }
}

const api = new ApiClient<RouteMap>("https://api.example.com");
const users = await api.get("GET /users"); // type: User[]
const user = await api.get("GET /users/:id", { params: { id: "42" } }); // type: User | null

// tRPC-style type-safe RPC (concept)
type Procedure<Input, Output> = {
  input: z.ZodSchema<Input>;
  resolve: (input: Input) => Promise<Output>;
};

function procedure<Input, Output>(
  input: z.ZodSchema<Input>,
  resolve: (input: Input) => Promise<Output>
): Procedure<Input, Output> {
  return { input, resolve };
}

const router = {
  getUser: procedure(
    z.object({ id: z.number() }),
    async ({ id }) => db.user.findById(id)
  ),
  createUser: procedure(
    z.object({ name: z.string(), email: z.string().email() }),
    async (data) => db.user.create(data)
  ),
};

type Router = typeof router;
type GetUserOutput = Awaited<ReturnType<Router["getUser"]["resolve"]>>;
// Fully typed output!
```

---

## 25.2 Observable/Reactive Patterns

```typescript
// Minimal typed observable
type Observer<T> = {
  next: (value: T) => void;
  error?: (err: unknown) => void;
  complete?: () => void;
};

type Unsubscribe = () => void;

class Observable<T> {
  constructor(
    private subscribe: (observer: Observer<T>) => Unsubscribe
  ) {}

  pipe<U>(operator: (source: Observable<T>) => Observable<U>): Observable<U> {
    return operator(this);
  }

  static fromPromise<T>(promise: Promise<T>): Observable<T> {
    return new Observable(observer => {
      promise.then(
        value => { observer.next(value); observer.complete?.(); },
        err => observer.error?.(err)
      );
      return () => {};
    });
  }

  static interval(ms: number): Observable<number> {
    return new Observable(observer => {
      let i = 0;
      const id = setInterval(() => observer.next(i++), ms);
      return () => clearInterval(id);
    });
  }
}

// Operators
function map<T, U>(fn: (value: T) => U) {
  return (source: Observable<T>): Observable<U> =>
    new Observable(observer =>
      source["subscribe"]({ // access private for demo
        next: value => observer.next(fn(value)),
        error: observer.error,
        complete: observer.complete,
      })
    );
}

function filter<T>(predicate: (value: T) => boolean) {
  return (source: Observable<T>): Observable<T> =>
    new Observable(observer =>
      source["subscribe"]({
        next: value => predicate(value) && observer.next(value),
        error: observer.error,
        complete: observer.complete,
      })
    );
}
```

---

# SECTION 26: INTERVIEW QUESTION PATTERNS BY LEVEL

## Level 1 (Junior) Questions and Expected Answers

```typescript
// Q: What's the difference between interface and type alias?
// A: Interfaces can be extended and merged; type aliases support unions, intersections, primitives

// Q: What is `unknown` and why prefer it over `any`?
// A: unknown requires type narrowing before use; any bypasses type checking entirely

// Q: Explain optional chaining and nullish coalescing
const name = user?.profile?.name ?? "Anonymous";
// ?. — short-circuits if null/undefined at any step
// ?? — falls back only on null/undefined (not 0, "", false — unlike ||)

// Q: What are generics?
function first<T>(arr: T[]): T | undefined { return arr[0]; }
// T is inferred from the argument, enabling type-safe reuse

// Q: What does `readonly` do?
interface Point { readonly x: number; readonly y: number }
// Prevents reassignment after creation (compile-time only, not runtime)
```

---

## Level 2 (Mid) Questions and Expected Answers

```typescript
// Q: Explain mapped types
type Optional<T> = { [K in keyof T]?: T[K] };

// Q: What are discriminated unions and when to use them?
// When modeling state machines, API responses, or event systems where
// the type of data depends on a tag field

// Q: How do you type a function that takes either a callback or a Promise?
function doWork(input: string): Promise<string>;
function doWork(input: string, callback: (result: string) => void): void;
function doWork(input: string, callback?: (result: string) => void): Promise<string> | void {
  // implementation
}

// Q: What's the difference between keyof and typeof?
interface User { id: number; name: string }
type UserKeys = keyof User; // "id" | "name"
const config = { host: "localhost", port: 3000 };
type ConfigType = typeof config; // { host: string; port: number }
type ConfigKeys = keyof typeof config; // "host" | "port"

// Q: How do you handle exhaustive checks?
function handleStatus(status: "active" | "inactive" | "pending"): string {
  switch (status) {
    case "active": return "green";
    case "inactive": return "gray";
    case "pending": return "yellow";
    default:
      const _check: never = status;
      throw new Error(`Unhandled: ${_check}`);
  }
}
```

---

## Level 3 (Senior) Questions and Expected Answers

```typescript
// Q: How would you design a type-safe event system for a large application?
// Answer involves: discriminated unions for events, generic emitter, proper handler typing,
// subscription lifecycle, avoiding memory leaks, async event handling

// Q: When would you use conditional types vs function overloads?
// Conditional types: for types that change based on input types
// Overloads: for functions with different behaviors based on arguments
// Trade-off: overloads are more readable, conditional types are more composable

// Q: Explain variance in TypeScript's type system
// Covariant: Cat[] is subtype of Animal[] (array of subtype is subtype of array)
// Contravariant: (Animal => void) is subtype of (Cat => void) — takes more general input
// Bivariant: method parameters are bivariant (TypeScript design decision for practicality)
// Invariant: generic type parameters are invariant without + or - modifiers

// Q: How do you handle circular type dependencies?
// 1. Extract shared types to a separate file
// 2. Use interfaces instead of classes for type definitions
// 3. Use lazy evaluation with type aliases where needed
// 4. Design the module dependency graph to avoid cycles

// Q: What are the performance implications of your type definitions?
// 1. Large union types slow down type checker — prefer const objects
// 2. Deep recursive types hit instantiation limits
// 3. Complex conditional types create more work than simple mapped types
// 4. interface vs type: interfaces are cached by name, faster for object shapes
// 5. skipLibCheck: true to avoid re-checking library types

// Q: How would you migrate a large JavaScript codebase to TypeScript?
// 1. Add tsconfig with allowJs: true, checkJs: false initially
// 2. Rename files incrementally (.js → .ts)
// 3. Start with leaf modules (no dependencies), work inward
// 4. Use //@ts-check comments for gradual JS checking
// 5. Disable strict initially, enable one flag at a time
// 6. Add noImplicitAny last after other strict checks pass
// 7. Use @ts-nocheck for files not yet converted
// 8. Build .d.ts files for remaining JS modules
```

---

# SECTION 27: ECOSYSTEM TOOLS OVERVIEW

## 27.1 Critical TypeScript Ecosystem Knowledge

```
TypeScript Toolchain Overview:

COMPILERS / TRANSPILERS:
├── tsc — Official TypeScript compiler. Type checking + emit.
├── esbuild — 100x faster, transpile only (no type checking). Used by Vite, tsx.
├── swc — Rust-based, transpile only. Used by Next.js.
└── Babel (@babel/preset-typescript) — transpile only, strips types.

RUNTIME:
├── ts-node — Run TypeScript directly in Node (uses tsc/swc)
└── tsx — Faster ts-node alternative (uses esbuild)

BUNDLERS:
├── tsup — Library bundler built on esbuild, generates .d.ts
├── Rollup — Production bundler with TypeScript plugin
├── Webpack — ts-loader or babel-loader
└── Vite — esbuild in dev, Rollup in prod

TYPE GENERATION:
├── zod — Runtime validation + TypeScript type inference
├── io-ts — Functional runtime type checking
├── typebox — JSON Schema + TypeScript types
└── ts-json-schema-generator — Generate JSON Schema from types

TESTING:
├── Vitest — Fast, Vite-native, Jest-compatible
├── Jest + ts-jest — Traditional Jest with TS support
└── tsd — Type-level testing

DI FRAMEWORKS:
├── tsyringe — Lightweight DI with decorators
├── inversify — Full-featured DI container
└── awilix — IoC container without decorators

FRAMEWORKS WITH FIRST-CLASS TS:
├── NestJS — Angular-style server framework
├── tRPC — End-to-end typesafe APIs
├── Prisma — Type-safe database ORM
├── TypeORM — Active Record + Data Mapper ORM
├── Effect-TS — Functional effect system
└── Hono — Lightweight web framework

VERSION MILESTONES:
- TS 2.0: strict null checks, never type
- TS 2.8: conditional types
- TS 3.0: unknown type, project references
- TS 3.7: optional chaining, nullish coalescing, assertion functions
- TS 4.0: labeled tuple elements, variadic tuple types
- TS 4.1: template literal types, key remapping in mapped types
- TS 4.5: Awaited<T>, type-only imports in import statements
- TS 5.0: const type parameters, decorators (TC39), verbatimModuleSyntax
- TS 5.4: NoInfer<T>
- TS 5.5: inferred type predicates, isolated declarations
```

---

# SECTION 28: TALENT SIGNALS REFERENCE TABLE

## Assessment Guide by Level

```
JUNIOR SIGNALS (L1):
+ Knows all primitive types and their JavaScript equivalents
+ Can annotate function parameters and return types
+ Understands interface vs type alias at surface level
+ Uses optional chaining and nullish coalescing correctly
+ Can write basic generic functions
+ Understands readonly modifier
+ Knows about strict mode and why it matters
+ Can interpret TypeScript error messages

RED FLAGS at Junior:
- Uses 'any' everywhere to avoid errors
- Doesn't understand why null and undefined are different
- Can't explain what type inference is
- Confused by "Type X is not assignable to type Y"

MID SIGNALS (L2):
+ Writes discriminated unions naturally for state modeling
+ Uses mapped types and utility types fluently
+ Understands narrowing and can write type predicates
+ Writes generic constraints (extends keyof, extends object)
+ Knows when to use interface vs type alias (merging, performance)
+ Comfortable with async/await error handling patterns
+ Writes overloaded function signatures
+ Uses Pick, Omit, Record, Partial, Required in real code
+ Can augment module types for third-party libraries

RED FLAGS at Mid:
- Still uses 'as' casting instead of narrowing
- Doesn't know the difference between conditional and mapped types
- Can't explain structural typing
- Writes type annotations where inference would do it better

SENIOR SIGNALS (L3):
+ Designs type-safe APIs using generic constraints and conditional types
+ Understands variance (covariance/contravariance in function types)
+ Can implement branded types for domain safety
+ Knows TypeScript internals (how tsc works, language server protocol)
+ Identifies type performance issues before they become problems
+ Uses 'never' for exhaustive checking and type algebra
+ Understands module augmentation and declaration merging for libraries
+ Can argue for/against TypeScript strict flags with business context
+ Thinks about the compiled output and runtime behavior
+ Designs systems where the types document the invariants
+ Understands the trade-offs: tsc vs esbuild vs swc, monorepo setups
+ Can discuss when TypeScript's type system is insufficient (nominal typing gaps)

RED FLAGS at Senior:
- Over-engineers types when simpler would do (type-level programming for its own sake)
- Doesn't think about type checking performance in large codebases  
- Can't explain why TypeScript uses structural over nominal typing
- Never uses 'unknown' or 'never' appropriately
- Treats TypeScript as just "JavaScript with annotations" without leveraging type algebra
```

---

# SECTION 29: QUICK REFERENCE — TYPE RECIPES

## Common Type Patterns Used in Real Codebases

```typescript
// 1. Make specific keys required, rest optional
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// 2. Make specific keys optional, rest required
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 3. Deep readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 4. XOR type — exactly one of two types
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

// 5. At least one key required
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

// 6. Recursive key paths
type Paths<T> = T extends object
  ? { [K in keyof T]: K extends string ? K | `${K}.${Paths<T[K]>}` : never }[keyof T]
  : never;

// 7. Tuple to union
type TupleToUnion<T extends readonly unknown[]> = T[number];
type Fruits = TupleToUnion<["apple", "banana", "cherry"]>; // "apple" | "banana" | "cherry"

// 8. Union to intersection (advanced)
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

// 9. Last element of union (requires UnionToIntersection)
type LastInUnion<U> = UnionToIntersection<U extends any ? (x: U) => void : never> extends (x: infer L) => void
  ? L
  : never;

// 10. Mutable version of Readonly
type Mutable<T> = { -readonly [P in keyof T]: T[P] };

// 11. Function that accepts and returns same type
type Endomorphism<T> = (value: T) => T;

// 12. Promise or direct value
type MaybePromise<T> = T | Promise<T>;

// 13. Nullable version
type Nullable<T> = T | null | undefined;

// 14. Non-empty array
type NonEmptyArray<T> = [T, ...T[]];

// 15. Type of object values
type ValueOf<T> = T[keyof T];
type Colors = { red: "#FF0000"; green: "#00FF00"; blue: "#0000FF" };
type ColorHex = ValueOf<Colors>; // "#FF0000" | "#00FF00" | "#0000FF"
```

---

*End of TypeScript RAG Knowledge Base Document*
*Total sections: 29 | Coverage: Junior through Senior | Includes: Type system, patterns, ecosystem, anti-patterns, architectural patterns*
