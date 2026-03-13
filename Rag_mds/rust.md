# Rust Technical Interviewer Knowledge Base

## Document Metadata

**Language:** Rust
**Versions covered:** 1.0 (2015 edition), 1.31 (2018 edition), 1.39 (async/await stable), 1.51 (const generics MVP), 1.56 (2021 edition), 1.65 (GATs stable), 1.75 (async fn in traits stable), 1.82+ (2024 edition)
**Assessment model:** Three-Level Contextual (L1 Junior / L2 Mid / L3 Senior)
**Purpose:** AI interviewer signal detection — not pedagogy

---

## 1. Type System Fundamentals and Coercion/Conversion Rules

### Mechanics

Rust's type system is static, nominal, and affine (every value used at most once unless `Copy`). Type inference uses Hindley-Milner extended with trait bounds. All types resolved at compile time. No runtime type tags exist except behind `dyn Trait` (fat pointer with vtable) and explicit enum discriminants. The type system is the primary mechanism for enforcing memory safety — the borrow checker is built on top of it.

**Coercion sites** — implicit coercions only at these locations:
- `let` bindings with explicit annotation
- Function call arguments
- `return` expressions
- Struct/enum field initialization
- Array element positions

**Coercion kinds** (exhaustive list):
- `&T` → `&U` when `T: Deref<Target=U>` (deref coercion)
- `&mut T` → `&T` (mut-to-shared reference)
- `*mut T` → `*const T` (pointer mutability weakening)
- `&[T; N]` → `&[T]` (array to slice, unsized coercion)
- `&String` → `&str` (via Deref)
- `&Vec<T>` → `&[T]` (via Deref)
- `&Box<T>` → `&T` (via Deref)
- `fn(T) -> U` → function pointer type
- `!` (never type) coerces to any type

**Conversion traits — explicit only, never implicit:**
- `From<T>` / `Into<T>`: infallible, owned, blanket `Into` impl from `From`
- `TryFrom<T>` / `TryInto<T>`: fallible, owned, stable since 1.34
- `AsRef<T>` / `AsMut<T>`: infallible, borrowed, cheap reference conversion
- `Borrow<T>` / `BorrowMut<T>`: like `AsRef` but with hash/eq/ord guarantees
- `ToString` / `FromStr`: string conversion, `ToString` auto-impl'd from `Display`

```rust
// WRONG: no implicit numeric widening — Rust is not C
let x: i32 = 5;
// let y: i64 = x;  // compile error: mismatched types

// CORRECT: explicit cast with `as` (can truncate/wrap — unsafe for signed types)
let y: i64 = x as i64;  // always safe widening here
let big: i32 = 300;
let truncated: u8 = big as u8;  // 44 — silently truncates, no panic, no error
// as is NOT checked — use TryFrom for safe narrowing

// SAFE narrowing via TryFrom
use std::convert::TryFrom;
let safe: Result<u8, _> = u8::try_from(300i32);  // Err(TryFromIntError)
let ok:   Result<u8, _> = u8::try_from(255i32);  // Ok(255)

// From/Into: infallible, defined as From → Into blanket impl
#[derive(Debug)]
struct Meters(f64);
impl From<f64> for Meters {
    fn from(val: f64) -> Self { Meters(val) }
}
let m: Meters = 3.5_f64.into();   // Into auto-generated from From
let m2 = Meters::from(3.5_f64);   // equivalent

// Deref coercion chain
let s: String = String::from("hello");
let sr: &str = &s;           // &String deref-coerces to &str via Deref<Target=str>
let v: Vec<i32> = vec![1,2,3];
let sl: &[i32] = &v;         // &Vec<T> deref-coerces to &[T]

// Function accepting &str works with &String via coercion
fn print_str(s: &str) { println!("{}", s); }
let owned = String::from("hello");
print_str(&owned);   // coercion applied at call site: &String → &str

// AsRef<T>: write generic functions that accept multiple string-like types
fn open_file<P: AsRef<std::path::Path>>(path: P) {
    let path = path.as_ref();
    // now path: &Path, works for &str, String, &Path, PathBuf, OsStr, etc.
}

// Borrow<T>: required for HashMap::get — key type can differ from stored key
use std::collections::HashMap;
let mut map: HashMap<String, i32> = HashMap::new();
map.insert("hello".to_string(), 1);
map.get("hello");  // works: &str implements Borrow<str>, String: Borrow<str>
// This is why you can query HashMap<String, V> with a &str key
```

**L1 SIGNAL:** Must know Rust has no implicit numeric conversion. Must know `as` truncates silently. Must explain the difference between `From`/`Into` (infallible) and `TryFrom`/`TryInto` (fallible). Must know `&String` deref-coerces to `&str` and why that matters for function signatures.

**L1 RED FLAGS:**
- Uses `as` for all conversions without knowing it can truncate
- Cannot explain why `&String` works where `&str` is expected
- Confused about when to use `Into` vs `From` in function signatures (prefer `Into<T>` in parameters, implement `From<T>`)
- Does not know `TryFrom` exists; manually checks before casting

**L2 SIGNAL:** Must explain the `From` → `Into` blanket impl and why you should impl `From` and get `Into` for free. Must know `Borrow<T>` semantic contract (hash/eq/ord must match) vs `AsRef<T>` (no such requirement). Must know when to use `AsRef<Path>` in function signatures for ergonomics. Must know `Display` automatically impls `ToString`.

**L2 RED FLAGS:**
- Implements both `From` and `Into` manually (redundant work, misunderstands blanket impl)
- Uses `AsRef` where `Borrow` is required (HashMap scenario)
- Writes `fn f(s: &String)` instead of `fn f(s: &str)` — fails to leverage deref coercion
- Cannot explain the difference in `as` cast behavior for signed vs unsigned (wrapping vs truncation)

**L3 SIGNAL:** Must know: (1) Deref coercion chains are resolved transitively at compile time — `Box<String>` coerces to `&str` via two steps. (2) Unsized coercions (`[T; N]` → `[T]`) require the type to implement `CoerceUnsized` — this is how fat pointers are created. (3) The distinction between `Borrow<T>` and `AsRef<T>` is a correctness contract: `HashMap` requires `Borrow` because it relies on `Hash` and `Eq` implementations being consistent between the key type and the borrowed type. (4) `From` impls should not panic — panicking `From` impls are a design smell; use `TryFrom` instead.

**L3 RED FLAGS:**
- Cannot explain why `HashMap::get` uses `Borrow<Q>` instead of `AsRef<Q>`
- Unaware that deref coercions are a compiler feature, not runtime dispatch
- Cannot articulate when NOT to impl `From` (e.g., lossy conversions, platform-specific behavior)

---

## 2. Memory Model — Ownership, Borrowing, and the Stack/Heap

### Mechanics

Rust's memory model is based on **ownership**: every value has exactly one owner, when the owner goes out of scope the value is dropped (RAII), and there is no garbage collector. The borrow checker enforces these rules at compile time. Stack allocation is the default; heap allocation requires explicit wrapping (`Box`, `Vec`, `String`, etc.).

**Ownership rules (enforced by borrow checker):**
1. Each value has exactly one owner
2. When the owner goes out of scope, the value is dropped
3. Ownership can be transferred (moved) but not shared unless explicitly borrowed
4. `Copy` types are duplicated on assignment instead of moved

**Borrowing rules (enforced at compile time):**
- At any time: either one mutable reference OR any number of immutable references (not both)
- References must always be valid (no dangling references — enforced by lifetimes)
- References cannot outlive the data they point to

**Stack vs Heap:**
- Stack: fixed-size types known at compile time, `Copy` types, function frames
- Heap: dynamically-sized data, owned via smart pointers; allocation/deallocation is explicit

```rust
// OWNERSHIP AND MOVE SEMANTICS
let s1 = String::from("hello");  // s1 owns heap-allocated string
let s2 = s1;                     // ownership MOVED to s2; s1 is now invalid
// println!("{}", s1);           // compile error: value borrowed after move

// Copy types are duplicated, not moved
let x: i32 = 5;
let y = x;   // x is copied (i32: Copy), both x and y valid
println!("{} {}", x, y);  // fine

// What implements Copy: all integer types, bool, f32/f64, char,
// tuples of Copy types, fixed-size arrays of Copy types, raw pointers
// What does NOT implement Copy: String, Vec, Box, any heap-owning type

// CLONE: explicit deep copy
let s1 = String::from("hello");
let s2 = s1.clone();   // explicit heap allocation — not free
println!("{} {}", s1, s2);  // both valid

// BORROWING
let s = String::from("hello");
let len = calculate_len(&s);   // borrow, not move
println!("{} has length {}", s, len);  // s still valid

fn calculate_len(s: &str) -> usize { s.len() }  // takes reference, doesn't own

// MUTABLE BORROW
let mut s = String::from("hello");
let r = &mut s;            // one mutable borrow
r.push_str(" world");
// let r2 = &mut s;        // compile error: cannot borrow s as mutable more than once
// let r3 = &s;            // compile error: cannot borrow s as immutable while mut borrow active
println!("{}", r);

// NON-LEXICAL LIFETIMES (NLL, stable since Rust 2018)
// Borrows end at last use, not at scope boundary
let mut s = String::from("hello");
let r1 = &s;
let r2 = &s;
println!("{} {}", r1, r2);  // r1 and r2 last used here
let r3 = &mut s;            // OK: r1, r2 no longer in use
r3.push_str("!");
println!("{}", r3);

// STACK vs HEAP — explicit heap via Box
let stack_val: i32 = 42;            // on stack
let heap_val: Box<i32> = Box::new(42); // on heap, Box owns the allocation
// Box<T> is just a pointer; T lives on heap; when Box drops, T is freed

// Recursive types REQUIRE Box (size must be known at compile time)
enum List {
    Cons(i32, Box<List>),  // Box<List> has known size (pointer width)
    Nil,
}
// Without Box: List is infinitely sized — compiler rejects it

// DROP ORDER: locals dropped in reverse declaration order
{
    let a = String::from("a");
    let b = String::from("b");
    let c = String::from("c");
}  // c dropped first, then b, then a — reverse order

// Explicit early drop
let mutex_guard = mutex.lock().unwrap();
do_critical_work(&mutex_guard);
drop(mutex_guard);  // release lock before the long operation
do_long_non_critical_work();  // lock not held here

// RAII in practice — resource management
struct FileHandle(std::fs::File);
impl Drop for FileHandle {
    fn drop(&mut self) {
        // cleanup happens automatically when FileHandle goes out of scope
        // no need for manual close() calls
        println!("File closed");
    }
}

// Interior mutability — borrow rules checked at runtime, not compile time
use std::cell::RefCell;
let shared = RefCell::new(vec![1, 2, 3]);
shared.borrow().iter().for_each(|x| print!("{} ", x));  // immutable borrow
shared.borrow_mut().push(4);  // mutable borrow — panics if violated at runtime

// RefCell rule violations panic at runtime (not compile error)
let r1 = shared.borrow();
// let r2 = shared.borrow_mut();  // would panic: already borrowed immutably
```

**L1 SIGNAL:** Must explain move semantics vs copy. Must know why `String` is not `Copy`. Must know the single mutable reference rule and why it prevents data races. Must write a function that takes `&str` instead of `String` to avoid unnecessary clones.

**L1 RED FLAGS:**
- Cannot explain why `let s2 = s1` invalidates `s1` for `String` but not `i32`
- Clones everything to "make the borrow checker happy" without understanding ownership
- Confused about why the borrow checker rejects apparently reasonable code
- Does not know what `Drop` does or that it's called automatically

**L2 SIGNAL:** Must explain NLL (borrows end at last use, not scope boundary). Must know `RefCell` and when runtime borrow checking is appropriate (shared mutability inside a structure). Must know `Rc<RefCell<T>>` for single-threaded shared mutable state and why it cannot cross threads. Must understand drop order and its implications for lock guards.

**L2 RED FLAGS:**
- Does not know `RefCell` panics at runtime on violation (vs compile-time error)
- Uses `Rc<RefCell<T>>` in multithreaded code (not `Send`)
- Relies on lexical lifetimes mental model after 2018 edition (misunderstands NLL)
- Does not use `drop()` to explicitly release resources (e.g., mutex guards before long operations)

**L3 SIGNAL:** Must know: (1) `Rc<T>` uses reference counting, not GC — cycles cause leaks (`Weak<T>` breaks cycles). (2) `Arc<T>` is atomically reference-counted — `clone()` increments the atomic counter, which has measurable cost in tight loops. (3) `Cell<T>` works for `Copy` types with no allocation — prefer over `RefCell` where possible. (4) `UnsafeCell<T>` is the only legal way to achieve interior mutability in unsafe code — all safe interior mutability wrappers use it. (5) The "stacked borrows" model for `unsafe` code (Miri enforces this). (6) Memory layout of fat pointers (`&dyn Trait`, `&[T]`): two words — data pointer + vtable/length pointer.

**L3 RED FLAGS:**
- Cannot explain why `Arc<RefCell<T>>` is wrong for multithreaded code (should be `Arc<Mutex<T>>`)
- Does not know `Rc` cycles leak memory and how `Weak` prevents them
- Cannot explain `UnsafeCell` and why it is the only legal path to interior mutability
- Unaware that `Arc::clone()` has cost from atomic operations and when this matters at scale

---

## 3. Scope, Closures, and Variable Lifetime

### Mechanics

Rust closures are anonymous types that implement one or more of `Fn`, `FnMut`, `FnOnce`. Every closure has a unique, compiler-generated type. Closures capture variables from their environment by reference, mutable reference, or value (move), and the compiler infers the minimum capture mode needed.

**Closure capture rules:**
- `Fn`: captures by shared reference — can be called multiple times concurrently
- `FnMut`: captures by mutable reference — can be called multiple times, not concurrently
- `FnOnce`: captures by value (move) — can be called exactly once, consumes captured values
- Every `Fn` is also `FnMut`; every `FnMut` is also `FnOnce`

**Lifetimes:** compiler-inferred annotations that constrain how long references are valid. They are part of the type system, not runtime values. Named lifetimes (`'a`) appear in function signatures when the compiler cannot infer the relationship between input and output reference lifetimes.

```rust
// CLOSURE CAPTURE MODES
let x = 5;
let y = String::from("hello");

// Closure infers capture mode: x by copy (i32: Copy), y by reference
let closure = || println!("{} {}", x, y);
closure();
println!("{}", y);  // y still valid — captured by reference

// `move` closure: captures all by value
let moved = move || println!("{} {}", x, y);
// println!("{}", y);  // compile error: y moved into closure
moved();
moved();  // still callable — moved values are inside the closure

// FnOnce: closure that moves a captured value out
let s = String::from("hello");
let consume = move || {
    let _taken = s;  // s moved OUT of closure — makes this FnOnce
};
consume();   // OK
// consume(); // compile error: use of moved value — closure is FnOnce

// Returning closures — must box because size is unknown
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y   // captures x by value, returns closure
}
let add5 = make_adder(5);
println!("{}", add5(3));   // 8
println!("{}", add5(10));  // 15

// Boxed closure when returning different closure types
fn make_transform(double: bool) -> Box<dyn Fn(i32) -> i32> {
    if double {
        Box::new(|x| x * 2)
    } else {
        Box::new(|x| x + 1)
    }
    // `impl Fn` would fail: each branch has different type
}

// Higher-order functions with closures
fn apply_twice<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(f(x))
}
println!("{}", apply_twice(|x| x + 3, 7));  // 13

// Storing closures in structs
struct Cache<T, F: Fn(T) -> T> {
    func: F,
    value: Option<T>,
}
impl<T: Clone, F: Fn(T) -> T> Cache<T, F> {
    fn new(func: F) -> Self { Cache { func, value: None } }
    fn get(&mut self, arg: T) -> T {
        match &self.value {
            Some(v) => v.clone(),
            None => {
                let result = (self.func)(arg);
                self.value = Some(result.clone());
                result
            }
        }
    }
}

// LIFETIME ANNOTATIONS — when compiler cannot infer relationship
// This function takes two &str and returns one — which lifetime does the return have?
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
    // Return reference lives as long as the SHORTER of x and y ('a = min(lifetime x, lifetime y))
}

// Without annotation, this FAILS because compiler cannot determine which input
// the output reference is derived from
// fn longest(x: &str, y: &str) -> &str { ... }  // error: missing lifetime specifier

// Lifetime in structs
struct Important<'a> {
    excerpt: &'a str,  // struct cannot outlive the string it borrows from
}
let novel = String::from("Call me Ishmael. Some years ago...");
let first_sentence = novel.split('.').next().unwrap();
let i = Important { excerpt: first_sentence };
// novel must outlive i — compiler enforces this

// LIFETIME ELISION RULES (when you don't need to write lifetimes):
// Rule 1: each reference parameter gets its own lifetime
// Rule 2: if there is exactly one input lifetime, it's assigned to all outputs
// Rule 3: if one of the inputs is &self or &mut self, its lifetime is assigned to all outputs

// These are equivalent:
fn first_word(s: &str) -> &str { ... }
fn first_word<'a>(s: &'a str) -> &'a str { ... }  // elision applied

// 'static lifetime: valid for entire program duration
let s: &'static str = "I live in binary";   // string literal: 'static
// Returning &'static str from a function often means the data is a constant
// Be careful: 'static bounds on trait objects mean the type contains NO references
// (or only 'static references), NOT that the value lives forever

// Higher-ranked trait bounds (HRTB): for<'a> Fn(&'a T) -> &'a U
// Needed when closure must work for ALL lifetimes, not a specific one
fn apply_to_ref<F>(f: F, s: &str) -> &str
where F: for<'a> Fn(&'a str) -> &'a str
{
    f(s)
}
```

**L1 SIGNAL:** Must explain the three closure traits (`Fn`/`FnMut`/`FnOnce`) and when each applies. Must write a function that accepts a closure parameter with the correct trait bound. Must explain why `move` closures are needed for threads.

**L1 RED FLAGS:**
- Cannot explain the difference between `Fn`, `FnMut`, and `FnOnce`
- Does not know `move` closure is required for `thread::spawn`
- Writes `fn f(c: Closure)` instead of `fn f<F: Fn()>(c: F)` — closures don't have nameable types
- Cannot read a basic lifetime annotation on a function signature

**L2 SIGNAL:** Must explain lifetime elision rules (three rules). Must write a struct with a lifetime parameter and explain what constraint it expresses. Must know `'static` bound on trait objects means "no non-static references" not "lives forever". Must implement `impl Fn` return type vs `Box<dyn Fn>` and know the trade-off (static dispatch vs dynamic dispatch, heap allocation).

**L2 RED FLAGS:**
- Uses `Box<dyn Fn>` everywhere instead of `impl Fn` (unnecessary heap allocation)
- Confuses `'static` lifetime with "allocated for program duration"
- Cannot explain why a struct holding a `&str` needs a lifetime parameter
- Misapplies lifetime annotations — puts them on the wrong parameters

**L3 SIGNAL:** Must know: (1) HRTB (`for<'a>`) — when a closure must be polymorphic over ALL lifetimes (required for certain combinator patterns). (2) Lifetime variance: `&'a T` is covariant in `'a` and `T`; `&'a mut T` is covariant in `'a` but invariant in `T` — this is why you can't assign `&mut &'long T` where `&mut &'short T` is expected. (3) `PhantomData<&'a T>` to add lifetime constraints to structs that hold raw pointers. (4) Lifetime subtyping: `'a: 'b` means `'a` outlives `'b`. (5) Named lifetimes in impl blocks for methods that return references to struct fields.

---

## 4. Functions — Parameters, Return Types, Dispatch

### Mechanics

Rust functions are statically dispatched by default. Generic functions are monomorphized at compile time — separate machine code generated for each concrete type. Dynamic dispatch (`dyn Trait`) uses a vtable fat pointer and has runtime overhead. Function items have unique zero-sized types; function pointers (`fn()`) are fat pointers.

```rust
// FUNCTION BASICS
fn add(x: i32, y: i32) -> i32 { x + y }  // expression-based: last expr is return value
fn unit_fn() { }  // returns () implicitly
fn explicit_return(x: i32) -> i32 { return x * 2; }  // explicit return OK but idiomatic to omit

// PARAMETERS: Rust is always pass-by-value (move or copy)
// To "pass by reference", take a reference explicitly
fn greet(name: &str) { println!("Hello, {}!", name); }
fn mutate(v: &mut Vec<i32>) { v.push(42); }

// VARIADIC: Rust does not have C-style variadic functions in safe code
// Idiomatic: accept a slice
fn sum(nums: &[i32]) -> i32 { nums.iter().sum() }
sum(&[1, 2, 3, 4]);   // works
// Or accept an iterator
fn sum_iter<I: IntoIterator<Item=i32>>(nums: I) -> i32 { nums.into_iter().sum() }

// FUNCTION OVERLOADING: not supported — use generics or different names
// "Overload" via generics:
trait Area { fn area(&self) -> f64; }
struct Circle { r: f64 }
struct Rect   { w: f64, h: f64 }
impl Area for Circle { fn area(&self) -> f64 { std::f64::consts::PI * self.r * self.r } }
impl Area for Rect   { fn area(&self) -> f64 { self.w * self.h } }

// STATIC DISPATCH via generics (monomorphization)
fn print_area<T: Area>(shape: &T) {
    println!("Area: {}", shape.area());
}
// At compile time: separate `print_area_circle` and `print_area_rect` generated
// Zero runtime overhead, but increases binary size

// DYNAMIC DISPATCH via dyn Trait (fat pointer: data ptr + vtable ptr)
fn print_area_dyn(shape: &dyn Area) {
    println!("Area: {}", shape.area());  // vtable lookup at runtime
}
// Use when: heterogeneous collections, trait objects as return types
// when compile-time type is unknown, when binary size matters more than speed

// OBJECT SAFETY: a trait can only be used as dyn Trait if:
// - No associated functions without &self (static methods)
// - No generic methods
// - No return Self
// - No associated constants (stable restriction)
trait ObjectSafe {
    fn process(&self) -> i32;   // OK: takes &self, no generics, no Self
    // fn clone_self(&self) -> Self;  // NOT object-safe: returns Self
    // fn generic<T>(&self, t: T);    // NOT object-safe: generic method
}

// FUNCTION POINTERS vs CLOSURES
// fn pointer: no captured environment, same size everywhere (8 bytes on 64-bit)
let fp: fn(i32) -> i32 = |x| x + 1;  // works: non-capturing closure coerces to fn pointer
// let fp: fn(i32) -> i32 = |x| x + y;  // ERROR: captures y, can't be fn pointer

// DIVERGING FUNCTIONS: return type !  (never type)
fn panic_fn() -> ! {
    panic!("always panics");
}
fn infinite() -> ! {
    loop {}
}
// ! coerces to any type — useful in match arms
let x: i32 = match condition {
    true  => 42,
    false => panic!("impossible"),  // panic!() returns !, coerces to i32
};

// CONST FN: evaluatable at compile time (stable since Rust 1.46 for basic usage)
const fn square(x: u32) -> u32 { x * x }
const NINE: u32 = square(3);   // computed at compile time

// Limitations of const fn: no heap allocation, no dynamic dispatch,
// limited set of operations (expanding with each Rust release)

// ASSOCIATED FUNCTIONS vs METHODS
struct Counter { count: u32 }
impl Counter {
    fn new() -> Self { Counter { count: 0 } }          // associated function (no self)
    fn increment(&mut self) { self.count += 1; }        // method (takes &mut self)
    fn value(&self) -> u32 { self.count }               // method (takes &self)
    fn reset(self) -> Self { Counter { count: 0 } }     // consuming method (takes self)
}

// METHOD RESOLUTION ORDER:
// 1. Methods on the type itself (inherent impl)
// 2. Methods from traits in scope
// Ambiguity requires UFCS: Trait::method(&value)

// TURBOFISH syntax for explicit type parameters at call site
let v = "1 2 3".split_whitespace()
    .map(|s| s.parse::<i32>().unwrap())  // ::<i32> is turbofish
    .collect::<Vec<_>>();
// Needed when type inference cannot determine the type parameter
```

**L1 SIGNAL:** Must know the difference between methods (take `self`/`&self`/`&mut self`) and associated functions (no `self` — like static methods). Must know static dispatch vs dynamic dispatch and the basic performance implication. Must understand why closures can't always be used as `fn` pointers.

**L1 RED FLAGS:**
- Cannot explain the difference between `&self`, `&mut self`, and `self` as method receivers
- Does not know `dyn Trait` uses a vtable (calls it "just like a generic")
- Writes `fn f() -> ()` explicitly (unnecessary — `()` return is idiomatic to omit)
- Does not know diverging functions (`-> !`) and when `panic!()` is valid in match arms

**L2 SIGNAL:** Must explain monomorphization: one copy of machine code per concrete type instantiation, binary size implication. Must know object safety requirements for `dyn Trait`. Must use `impl Trait` in function positions correctly (argument position = bounded generic sugar, return position = opaque type). Must know when to prefer `dyn Trait` over generics (heterogeneous collections, plugin systems, reducing binary size).

**L2 RED FLAGS:**
- Uses `dyn Trait` everywhere, missing that generics give zero-cost static dispatch
- Does not know `impl Trait` in return position creates an opaque type (can't name it)
- Cannot explain object safety and why traits with generic methods can't be made into trait objects
- Unaware of turbofish syntax; gets confused when type inference fails

**L3 SIGNAL:** Must know: (1) Monomorphization causes code bloat — `Vec<i32>` and `Vec<u8>` generate separate implementations for every method. Mitigation: boxing/erasing types behind `dyn Trait` or using a common representation. (2) Vtable layout: pointer to destructor, size/align, then methods in declaration order — vtables are generated per trait-impl pair, not per type. (3) `dyn Trait` is a fat pointer — 16 bytes on 64-bit. (4) Function items have unique zero-sized types; only function pointers have a uniform type — coercion from item to pointer is a one-way operation. (5) `extern "C"` ABI for FFI functions and why Rust's default ABI is unspecified/unstable.

---

## 5. Object-Oriented Model — Structs, Enums, Traits, and Composition

### Mechanics

Rust has no classical inheritance. The OOP model is **trait-based composition**: behavior is defined in traits, types implement traits, and generics constrain types by trait bounds. This is closer to Haskell's typeclasses than to Java's interfaces. Data is in structs and enums; behavior is in trait impls and inherent impls.

```rust
// STRUCTS: three forms
struct Point { x: f64, y: f64 }                    // named fields
struct Color(u8, u8, u8);                           // tuple struct
struct Sentinel;                                    // unit struct (zero-sized)

// Struct update syntax
let p1 = Point { x: 1.0, y: 2.0 };
let p2 = Point { x: 3.0, ..p1 };  // y taken from p1 (moved/copied)

// ENUMS: algebraic data types — each variant can hold data
#[derive(Debug)]
enum Message {
    Quit,                           // unit variant
    Move { x: i32, y: i32 },       // struct-like variant
    Write(String),                  // tuple-like variant
    ChangeColor(u8, u8, u8),        // multiple fields
}

// Pattern matching is EXHAUSTIVE — must cover all variants
fn handle(msg: Message) {
    match msg {
        Message::Quit                 => println!("quit"),
        Message::Move { x, y }       => println!("move to {},{}", x, y),
        Message::Write(text)          => println!("write: {}", text),
        Message::ChangeColor(r, g, b) => println!("color: {},{},{}", r, g, b),
    }
}

// TRAITS: define shared behavior
trait Shape {
    fn area(&self) -> f64;                          // required method
    fn perimeter(&self) -> f64;                     // required method
    fn describe(&self) -> String {                  // default implementation
        format!("shape with area {:.2}", self.area())
    }
    fn scale_area(&self, factor: f64) -> f64 {     // default using required
        self.area() * factor
    }
}

#[derive(Debug, Clone)]
struct Circle { radius: f64 }
#[derive(Debug, Clone)]
struct Rectangle { width: f64, height: f64 }

impl Shape for Circle {
    fn area(&self)      -> f64 { std::f64::consts::PI * self.radius * self.radius }
    fn perimeter(&self) -> f64 { 2.0 * std::f64::consts::PI * self.radius }
}
impl Shape for Rectangle {
    fn area(&self)      -> f64 { self.width * self.height }
    fn perimeter(&self) -> f64 { 2.0 * (self.width + self.height) }
}

// TRAIT OBJECTS — heterogeneous collection
let shapes: Vec<Box<dyn Shape>> = vec![
    Box::new(Circle { radius: 3.0 }),
    Box::new(Rectangle { width: 4.0, height: 5.0 }),
];
let total: f64 = shapes.iter().map(|s| s.area()).sum();

// TRAIT BOUNDS — constrain generic types
fn largest_area<T: Shape>(shapes: &[T]) -> f64 {
    shapes.iter().map(|s| s.area()).fold(0.0_f64, f64::max)
}
// Multiple bounds with + syntax:
fn describe_and_debug<T: Shape + std::fmt::Debug>(s: &T) {
    println!("{:?} has area {}", s, s.area());
}
// Where clause (equivalent, better readability for complex bounds):
fn complex<T, U>(t: &T, u: &U) -> String
where T: Shape + Clone + std::fmt::Debug,
      U: Shape + std::fmt::Display,
{
    format!("{:?} and {}", t, u)
}

// BLANKET IMPLEMENTATIONS — impl Trait for ALL types satisfying a bound
// This is how ToString is auto-implemented for everything with Display:
impl<T: std::fmt::Display> ToString for T { ... }
// And how From<T> for T (identity) is provided in std

// NEWTYPE PATTERN: wrap existing type to implement foreign traits
// (cannot directly impl a foreign trait for a foreign type — orphan rule)
struct Wrapper(Vec<String>);
impl std::fmt::Display for Wrapper {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

// COMPOSITION over inheritance
struct Logger;
struct Validator;
struct UserService {
    logger:    Logger,
    validator: Validator,
    // behavior via trait impls on UserService, delegating to fields
}

// ORPHAN RULE: can only impl a trait for a type if:
// - The trait is defined in your crate, OR
// - The type is defined in your crate (OR BOTH)
// CANNOT: impl Display for Vec<T> (both foreign) — would break coherence

// DERIVE MACROS: auto-implement common traits
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
struct UserId(u64);

// derive order matters for Ord — compares fields in declaration order
#[derive(PartialOrd, Ord, PartialEq, Eq)]
struct Version { major: u32, minor: u32, patch: u32 }
// Version(1,2,3) < Version(1,2,4) — correct lexicographic order

// TRAIT COHERENCE and the orphan rule in depth:
// Rule prevents multiple crates from implementing the same trait for the same type
// causing ambiguity. "Blanket impl" special rules allow certain overlap patterns.

// Sealed trait pattern: prevent downstream trait implementations
mod private {
    pub trait Sealed {}
}
pub trait MyTrait: private::Sealed {
    fn method(&self);
}
// External users can use MyTrait but cannot implement it (cannot impl Sealed)
```

**L1 SIGNAL:** Must explain how Rust achieves polymorphism via traits instead of inheritance. Must know how `derive` works for common traits and what it generates. Must pattern-match an enum exhaustively. Must understand the orphan rule at a basic level.

**L1 RED FLAGS:**
- Tries to inherit from a struct (Rust has no struct inheritance)
- Does not know `derive` generates standard trait impls
- Pattern match with only `_` wildcard arm — not actually handling the variants
- Cannot write a basic trait with a default method

**L2 SIGNAL:** Must know trait objects vs generics trade-offs (monomorphism vs vtable, object safety). Must understand the orphan rule and the newtype pattern as a workaround. Must know blanket implementations and why they can conflict. Must use `where` clauses for complex bounds. Must know the sealed trait pattern for library API design.

**L2 RED FLAGS:**
- Cannot explain the orphan rule — does not know why you can't `impl Display for Vec<T>`
- Confused by trait bounds vs trait objects — treats them as interchangeable
- Does not know how to implement `From<T>` for their own type
- Writes `impl Trait for Struct {}` without understanding why it works or when it won't

**L3 SIGNAL:** Must know: (1) Coherence rules in depth: overlapping implementations are rejected unless one is more specific (specialization — still unstable in 1.82). (2) Supertraits: `trait A: B` means any type implementing `A` must also implement `B`. (3) Associated types vs generic parameters: `trait Iterator { type Item; }` means each impl provides exactly one `Item` type, whereas `trait Conv<T>` can have multiple impls for different `T`. (4) Trait objects with multiple traits: `dyn Trait1 + Trait2` — only works when both are object-safe and at most one is non-auto (marker) trait. (5) `std::any::Any` for runtime type erasure and downcast — its uses and severe limitations.

---

## 6. Generics, Traits, and Type Parameters

### Mechanics

Rust generics are resolved entirely at compile time via monomorphization. Every generic function, struct, enum, and trait impl is a template — the compiler generates concrete code for each type it's instantiated with. This is fundamentally different from Java/C# generics (type erasure) and closer to C++ templates (but with coherent semantics and no implicit instantiation errors).

```rust
// GENERIC STRUCTS
#[derive(Debug)]
struct Pair<T> {
    first:  T,
    second: T,
}
impl<T: std::fmt::Display + PartialOrd> Pair<T> {
    fn new(first: T, second: T) -> Self { Pair { first, second } }
    fn cmp_display(&self) {
        if self.first >= self.second {
            println!("The largest member is first = {}", self.first);
        } else {
            println!("The largest member is second = {}", self.second);
        }
    }
}

// GENERIC ENUMS (the most important ones in std)
// Option<T>: presence or absence
enum Option<T> { Some(T), None }
// Result<T, E>: success or failure
enum Result<T, E> { Ok(T), Err(E) }

// ASSOCIATED TYPES vs TYPE PARAMETERS — critical design decision
// Use associated types when: each impl should have EXACTLY ONE concrete type
// Use type parameters when: a type can implement the trait for MULTIPLE concrete types

// Good: Iterator has one Item per impl
trait MyIterator {
    type Item;   // each impl defines ONE item type
    fn next(&mut self) -> Option<Self::Item>;
}

// Good: From can be implemented for multiple source types
impl From<i32> for String { ... }
impl From<f64> for String { ... }
impl From<bool> for String { ... }
// String: From<i32> AND From<f64> AND From<bool> — multiple impls, so type param is correct

// CONST GENERICS (stable since Rust 1.51 for basics, 1.65 for more complex usage)
// Value parameters, not type parameters — known at compile time
fn array_sum<const N: usize>(arr: &[i32; N]) -> i32 {
    arr.iter().sum()
}
array_sum(&[1, 2, 3]);     // N=3, monomorphized
array_sum(&[1, 2, 3, 4]);  // N=4, different monomorphization

// Generic struct with const generic
struct FixedQueue<T, const N: usize> {
    data:  [Option<T>; N],
    head:  usize,
    len:   usize,
}
impl<T: Copy, const N: usize> FixedQueue<T, N> {
    fn new() -> Self {
        FixedQueue { data: [None; N], head: 0, len: 0 }
    }
    fn push(&mut self, val: T) -> bool {
        if self.len == N { return false; }
        self.data[(self.head + self.len) % N] = Some(val);
        self.len += 1;
        true
    }
    fn pop(&mut self) -> Option<T> {
        if self.len == 0 { return None; }
        let val = self.data[self.head].take();
        self.head = (self.head + 1) % N;
        self.len -= 1;
        val
    }
}

// TYPE BOUNDS on const generics (limited, expanding with each edition)
// Currently: const generics can only be integer/bool/char types

// GENERIC FUNCTIONS — monomorphized per concrete type
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut max = &list[0];
    for item in list {
        if item > max { max = item; }
    }
    max
}
// Generates: `largest_i32`, `largest_f64`, etc. at compile time
// Binary size grows with number of distinct type instantiations

// PHANTOM DATA: zero-sized type for adding type parameters without storing the type
use std::marker::PhantomData;
struct TypedId<T> {
    id:      u64,
    _marker: PhantomData<T>,   // T is a type-level tag, no memory cost
}
impl<T> TypedId<T> {
    fn new(id: u64) -> Self { TypedId { id, _marker: PhantomData } }
}
struct User;
struct Post;
let user_id: TypedId<User> = TypedId::new(1);
let post_id: TypedId<Post> = TypedId::new(1);
// user_id == post_id would fail to compile — different types despite same id value

// GENERIC BOUNDS CHEAT SHEET
// T: Trait           — T must implement Trait
// T: Trait + Trait2  — T must implement both
// T: 'a              — T's references must outlive 'a
// T: 'static         — T contains no non-static references
// T: ?Sized          — T may or may not be Sized (opt out of default Sized bound)
// T: Send            — T can be sent to another thread
// T: Sync            — &T can be shared between threads

// ?Sized: accept both Sized and unsized types
// By default ALL type parameters have an implicit: T: Sized bound
fn print_it<T: std::fmt::Display + ?Sized>(t: &T) {
    println!("{}", t);  // works for &str (unsized) and String (sized) alike
}

// GENERIC ASSOCIATED TYPES (GATs) — stable since Rust 1.65
// Allow associated types to themselves be generic (lifetime-parameterized)
trait Streaming {
    type Item<'a> where Self: 'a;   // Item is generic over lifetime 'a
    fn next<'a>(&'a mut self) -> Option<Self::Item<'a>>;
}
// Enables iterator-like traits that yield references tied to &self lifetime
// Previously impossible, required workarounds or unsafe code

// SPECIALIZATION — still UNSTABLE (nightly only, ongoing design work)
// Would allow: provide a default impl, override for specific types
// Currently blocked by soundness concerns with lifetimes
// Default impls via separate traits are the stable workaround
```

**L1 SIGNAL:** Must write a generic function with a trait bound. Must explain that generics are monomorphized (separate code per type). Must use `Option<T>` and `Result<T, E>` idiomatically.

**L1 RED FLAGS:**
- Avoids generics; rewrites the same function for each type
- Does not know that generic functions require bounds to call methods on T
- Cannot write a generic struct with an `impl` block
- Confused by `T: 'static` (thinks it means the value lasts forever, not that it has no non-static references)

**L2 SIGNAL:** Must explain when to use associated types vs type parameters. Must know const generics and their limitations. Must understand `PhantomData` and why it's needed. Must know `?Sized` and why it's needed to write `fn f<T: ?Sized>(t: &T)` for use with `str` and other unsized types. Must know `Send` and `Sync` as marker traits for thread safety.

**L2 RED FLAGS:**
- Uses type parameters where associated types should be used (creates ambiguity)
- Does not know `PhantomData` — writes structs with unused type parameters without it
- Cannot explain why all type parameters default to `T: Sized`
- Does not use `?Sized` bound when writing generic functions intended to work with slices/str

**L3 SIGNAL:** Must know: (1) GATs (stable 1.65) unlock streaming iterators — can yield references tied to `&self` lifetime, previously a fundamental limitation. (2) Specialization is still nightly-only and why: the "leakage" problem where specialization interacts unsoundly with lifetimes. (3) Binary size implications of monomorphization at scale — libraries with heavy generics can balloon binary size; use `Box<dyn Trait>` for less performance-critical code in size-sensitive environments. (4) The difference between `trait Trait: Bound` (supertrait) and `fn f<T: Trait + Bound>` (both bounds at call site) — supertraits are part of the trait definition, bounds are at usage site. (5) `impl Trait` in argument position is sugar for a bounded generic; in return position it is an opaque type — these are semantically different.

---

## 7. Standard Library — Core Containers and Complexity

### Mechanics

Rust's standard library containers are split by ownership/sharing semantics. All containers implement `IntoIterator`. All have well-defined complexity guarantees. Understanding which container to use in which situation is a fundamental L2/L3 signal.

```rust
// VECTOR: Vec<T> — contiguous heap-allocated growable array
// Access: O(1), Push: O(1) amortized, Insert at index: O(n), Search: O(n)
let mut v: Vec<i32> = Vec::new();
v.push(1);
v.push(2);
v.extend([3, 4, 5]);
v.insert(0, 0);         // O(n): shifts all elements right
v.remove(0);            // O(n): shifts all elements left
v.swap_remove(0);       // O(1): replaces with last element (changes order)

// Capacity management — critical for performance-sensitive code
let mut v: Vec<i32> = Vec::with_capacity(1000);  // pre-allocate
println!("{}", v.capacity());  // 1000
println!("{}", v.len());       // 0 — no elements yet
// Pushing beyond capacity causes reallocation (copies all elements)
// Vec growth factor: ~2x (implementation detail, not guaranteed)

// DEQUE: VecDeque<T> — ring buffer for O(1) push/pop at both ends
// Use over Vec when: frequently pushing/popping from front
use std::collections::VecDeque;
let mut deque: VecDeque<i32> = VecDeque::new();
deque.push_back(1);
deque.push_front(0);
deque.pop_front();   // O(1) — unlike Vec::remove(0) which is O(n)

// HASH MAP: HashMap<K, V> — hash table with Robin Hood hashing
// Get: O(1) average, Insert: O(1) average, worst case O(n) (hash collision)
// Default hasher: SipHash 1-3 (DoS-resistant, not fastest for integer keys)
use std::collections::HashMap;
let mut map: HashMap<String, i32> = HashMap::new();
map.insert("a".to_string(), 1);
map.entry("b".to_string()).or_insert(2);        // insert if absent
map.entry("a".to_string()).or_insert(99);       // no-op: "a" exists
*map.entry("a".to_string()).and_modify(|v| *v += 10).or_insert(0);  // modify or insert

// Custom hasher for performance (integer keys, non-adversarial input)
use std::collections::HashMap;
use std::hash::BuildHasherDefault;
// FxHashMap, AHashMap (ahash crate) — 3-5x faster for integer keys
// Use std HashMap only when: user-controlled keys (DoS risk), or simplicity

// HASH SET: HashSet<T> — unique values, O(1) insert/lookup/remove
use std::collections::HashSet;
let mut set: HashSet<i32> = HashSet::new();
set.insert(1);
set.insert(2);
set.insert(1);      // duplicate ignored
set.contains(&1);   // true — note: takes reference
// Set operations:
let s1: HashSet<i32> = [1,2,3].into_iter().collect();
let s2: HashSet<i32> = [2,3,4].into_iter().collect();
let union:        HashSet<_> = s1.union(&s2).collect();         // {1,2,3,4}
let intersection: HashSet<_> = s1.intersection(&s2).collect();  // {2,3}
let difference:   HashSet<_> = s1.difference(&s2).collect();    // {1}

// B-TREE MAP: BTreeMap<K, V> — sorted keys, O(log n) operations
// Use when: need sorted iteration, range queries, ordered data
use std::collections::BTreeMap;
let mut btree: BTreeMap<i32, &str> = BTreeMap::new();
btree.insert(3, "c");
btree.insert(1, "a");
btree.insert(2, "b");
for (k, v) in &btree { print!("{}: {} ", k, v); }  // always sorted: 1:a 2:b 3:c

// Range queries — only possible with BTreeMap/BTreeSet
use std::ops::Bound::{Included, Excluded};
for (k, v) in btree.range(1..3) { }   // keys 1 and 2

// LINKED LIST: LinkedList<T> — rarely the right choice in Rust
// O(1) insert/remove at known position, O(n) access by index
// Memory: poor cache locality, each node heap-allocated
// Prefer Vec or VecDeque in almost all cases
// Use only when: truly need O(1) split/concat of large lists

// BINARY HEAP: BinaryHeap<T> — max-heap priority queue
// Push: O(log n), Pop max: O(log n), Peek: O(1)
use std::collections::BinaryHeap;
let mut heap = BinaryHeap::new();
heap.push(3);
heap.push(1);
heap.push(4);
heap.pop();   // Some(4) — always the maximum

// Min-heap via Reverse wrapper
use std::cmp::Reverse;
let mut min_heap: BinaryHeap<Reverse<i32>> = BinaryHeap::new();
min_heap.push(Reverse(3));
min_heap.push(Reverse(1));
min_heap.pop();   // Some(Reverse(1)) — minimum

// ITERATOR ADAPTORS — zero-overhead lazy transformations
let result: Vec<i32> = (0..100)
    .filter(|x| x % 2 == 0)      // lazy: no allocation
    .map(|x| x * x)               // lazy: no allocation
    .take(5)                      // lazy: no allocation
    .collect();                   // ONE allocation here
// [0, 4, 16, 36, 64]
// This is a single pass, not filter→new_array→map→new_array→take→new_array

// EXTEND vs APPEND: append moves all elements, leaving source empty
let mut a = vec![1, 2];
let mut b = vec![3, 4];
a.append(&mut b);   // b is now empty, a has [1,2,3,4] — O(1) if Vec has capacity
// vs extend: copies/clones elements, source remains intact
let mut c = vec![1, 2];
let d = [3, 4];
c.extend(d.iter());  // d still accessible

// String operations
let mut s = String::with_capacity(64);  // pre-allocate to avoid realloc
s.push_str("hello");
s.push(' ');
s.push_str("world");
// String is a Vec<u8> that guarantees UTF-8
// Indexing by byte offset (not char) — &s[0..5] works on byte boundaries only
// s.chars().nth(n) for O(n) character access
// For frequent char access: collect to Vec<char>, but 4x memory cost
```

**L1 SIGNAL:** Must choose correctly between `Vec`, `HashMap`, `HashSet`, `BTreeMap`. Must know push/pop complexity. Must know `HashMap::entry()` API for insert-or-update patterns. Must use `Vec::with_capacity()` when size is known ahead of time.

**L1 RED FLAGS:**
- Uses `HashMap::contains_key()` then `HashMap::insert()` instead of `entry()`
- Does not pre-allocate Vec when the size is known — unnecessary reallocations
- Uses `LinkedList` for general-purpose sequences
- Does not know `String` is UTF-8 encoded — tries to index by character position

**L2 SIGNAL:** Must know default `HashMap` hasher is DoS-resistant (SipHash) but not the fastest for integer keys. Must know when `BTreeMap` is better than `HashMap` (sorted iteration, range queries). Must explain `VecDeque` ring buffer and when to prefer it over `Vec`. Must use iterator adaptors fluently and understand they are lazy (no intermediate allocation). Must know `swap_remove` is O(1) while `remove` is O(n).

**L2 RED FLAGS:**
- Uses `BTreeMap` everywhere for HashMap use cases (unnecessary O(log n) overhead)
- Does not know custom hashers exist — doesn't consider performance impact in hot loops
- Chains multiple `.collect()` calls on iterators (creates unnecessary intermediate allocations)
- Cannot explain why `.collect::<Vec<_>>()` causes a single allocation but multiple `.filter().map()` calls do not

**L3 SIGNAL:** Must know: (1) `HashMap` growth policy: rehashes and relocates all entries when load factor exceeds threshold — with Robin Hood hashing, worst-case probing is bounded. (2) `BTreeMap` node size is 2B-tree with B=6 (11 keys/node) — good cache locality for small keys, but poor for large keys. (3) `String` internals: heap pointer + length + capacity (same as `Vec<u8>`). For string-heavy workloads, consider `Arc<str>` (no heap alloc on clone), `Box<str>` (no excess capacity), `Cow<str>` (avoid allocation when no mutation needed). (4) `SmallVec<[T; N]>` (external crate) for stack-local storage of small arrays without heap allocation — critical for allocation-sensitive hot paths. (5) Index map (external crate `indexmap`) when insertion-order iteration of a hash map is required.

---

## 8. Concurrency Model — Threads, Channels, Async, and Shared State

### Mechanics

Rust's concurrency story rests on two marker traits: `Send` (can be transferred to another thread) and `Sync` (`&T` can be shared between threads). The type system enforces these at compile time — it is impossible to write a data race in safe Rust. The async/await model is based on stackless coroutines (zero-cost, no allocation per task).

**`Send` and `Sync` rules:**
- `T: Send` if ownership of `T` can be transferred to another thread
- `T: Sync` if `&T` can be shared between threads (i.e., `T: Sync ⟺ &T: Send`)
- `Rc<T>`: neither `Send` nor `Sync` (non-atomic ref count)
- `RefCell<T>`: `Send` if `T: Send`, but NOT `Sync`
- `Mutex<T>`: `Send + Sync` if `T: Send`
- `Arc<T>`: `Send + Sync` if `T: Send + Sync`
- Raw pointers (`*const T`, `*mut T`): neither `Send` nor `Sync`

```rust
// BASIC THREAD SPAWNING
use std::thread;
use std::time::Duration;

let handle = thread::spawn(|| {
    println!("Hello from thread");
    thread::sleep(Duration::from_millis(100));
    42  // return value
});
let result = handle.join().unwrap();   // blocks, returns Result<T, Box<dyn Any>>
println!("Thread returned: {}", result);

// MOVE CLOSURES REQUIRED: thread closure must own its data
let data = vec![1, 2, 3];
let handle = thread::spawn(move || {
    println!("{:?}", data);   // data moved into closure (can't borrow across thread)
});
// println!("{:?}", data);  // compile error: data moved

// CHANNELS: message-passing for safe communication
use std::sync::mpsc;  // multi-producer, single-consumer

let (tx, rx) = mpsc::channel::<String>();

// Multiple senders via clone
let tx2 = tx.clone();
thread::spawn(move || { tx.send("hello".to_string()).unwrap(); });
thread::spawn(move || { tx2.send("world".to_string()).unwrap(); });

// Receive (blocking)
for msg in rx { println!("{}", msg); }  // iterator drains until all senders dropped

// MUTEX<T>: mutual exclusion for shared mutable state
use std::sync::{Arc, Mutex};

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];
for _ in 0..10 {
    let counter = Arc::clone(&counter);
    handles.push(thread::spawn(move || {
        let mut num = counter.lock().unwrap();  // blocks until lock acquired
        *num += 1;
        // MutexGuard drops here, lock released automatically (RAII)
    }));
}
for h in handles { h.join().unwrap(); }
println!("Result: {}", *counter.lock().unwrap());  // 10

// DEADLOCK: Rust prevents data races but NOT deadlocks
// Two threads each holding one lock and waiting for the other
let lock_a = Arc::new(Mutex::new(0));
let lock_b = Arc::new(Mutex::new(0));
// Thread 1: locks a, then b
// Thread 2: locks b, then a
// → deadlock

// RWLOCK: multiple readers OR one writer
use std::sync::RwLock;
let cache = Arc::new(RwLock::new(HashMap::new()));
// Multiple concurrent readers:
let r1 = cache.read().unwrap();
let r2 = cache.read().unwrap();  // OK: multiple readers
// Single writer (blocks until all readers done):
drop(r1); drop(r2);
let mut w = cache.write().unwrap();
w.insert("key".to_string(), "value".to_string());

// ONCE CELL / LAZY STATIC (std since Rust 1.70): one-time initialization
use std::sync::OnceLock;
static CONFIG: OnceLock<Config> = OnceLock::new();
fn get_config() -> &'static Config {
    CONFIG.get_or_init(|| load_config())
}

// ATOMIC TYPES: lock-free shared primitives
use std::sync::atomic::{AtomicU64, Ordering};
static COUNTER: AtomicU64 = AtomicU64::new(0);
COUNTER.fetch_add(1, Ordering::Relaxed);      // no ordering guarantees needed for counter
COUNTER.fetch_add(1, Ordering::SeqCst);       // full sequential consistency (slowest)
COUNTER.compare_exchange(old, new, Ordering::AcqRel, Ordering::Relaxed);  // CAS

// Memory ordering (critical for lock-free data structures):
// Relaxed: no ordering guarantee — only atomicity of the operation itself
// Acquire: this load SEES all writes before the matching Release
// Release: all writes before this are visible to Acquire loads on the same atomic
// AcqRel: both Acquire and Release (for read-modify-write operations)
// SeqCst: total global ordering — most expensive, guarantees all threads see same order

// ASYNC/AWAIT (tokio example — tokio is the dominant async runtime)
use tokio;

#[tokio::main]
async fn main() {
    let result = fetch_data("https://api.example.com").await;
}

async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?;  // .await suspends, yields to runtime
    response.text().await
}

// ASYNC FUNDAMENTALS: async fn returns impl Future<Output=T>
// Futures are LAZY: nothing runs until .await or a runtime polls them
// Futures are stackless coroutines: state machine generated by compiler
// Each .await point is a state machine transition

// Running futures concurrently within async context:
use tokio::join;  // concurrent, same thread (cooperative multitasking)
let (r1, r2) = join!(fetch_user(1), fetch_posts(1));

// Spawn tasks on the runtime's thread pool (true parallelism)
let handle = tokio::spawn(async move {
    compute_something_heavy().await
});
let result = handle.await.unwrap();  // JoinHandle<T>

// CHANNEL for async context:
use tokio::sync::mpsc;
let (tx, mut rx) = mpsc::channel::<i32>(100);  // bounded channel — backpressure!
tokio::spawn(async move { tx.send(42).await.unwrap(); });
let val = rx.recv().await;  // async receive

// SELECT: wait on multiple futures, run first to complete
use tokio::select;
select! {
    result = fetch_data(url) => handle_data(result),
    _ = tokio::time::sleep(Duration::from_secs(5)) => handle_timeout(),
}

// RAYON: data parallelism via work-stealing thread pool
use rayon::prelude::*;
let sum: i64 = (0..1_000_000_i64)
    .into_par_iter()          // parallel iterator
    .filter(|&x| x % 2 == 0)
    .map(|x| x * x)
    .sum();
// Rayon automatically splits work across CPU cores via work-stealing
// No manual thread management — ideal for CPU-bound data processing
```

**L1 SIGNAL:** Must know why `move` closures are required for thread spawning. Must know `Arc<Mutex<T>>` as the pattern for shared mutable state. Must explain why `Rc` is not `Send`. Must use channels for basic thread communication.

**L1 RED FLAGS:**
- Uses `Rc` instead of `Arc` for multi-threaded shared ownership
- Does not know why `move` is required in `thread::spawn`
- Thinks Rust prevents deadlocks (it only prevents data races)
- Confused about `Mutex::lock()` returning `MutexGuard` — doesn't know it's RAII

**L2 SIGNAL:** Must explain `Send` and `Sync` marker traits and be able to reason about whether a type is `Send`/`Sync`. Must know the difference between `Mutex` (exclusive access) and `RwLock` (multiple readers / one writer). Must explain async/await at a high level: futures are lazy, the runtime polls them, `.await` suspends. Must know when to use `tokio::spawn` vs `join!` (parallel execution vs sequential with concurrency). Must know memory orderings for atomics at a conceptual level.

**L2 RED FLAGS:**
- Cannot explain why `RefCell<T>` is not `Sync`
- Uses blocking I/O inside async functions (blocks the whole thread, starves other tasks)
- Does not know `join!` is concurrent but not parallel (same thread, cooperative)
- Uses `Mutex` in async code with `std::sync::Mutex` instead of `tokio::sync::Mutex` (blocking vs async-aware)

**L3 SIGNAL:** Must know: (1) Async task waking: `Waker` stored in task, executor polls future, future stores waker, I/O callback calls `waker.wake()` to re-schedule. (2) `async fn` state machine: each `await` point is an enum variant holding all live variables — state machine size is the sum of all variables across all await points. (3) `Pin<T>` and `Unpin`: futures are self-referential structs (variables can point to each other across await points), requiring pinning to prevent moves. (4) Blocking code in async: use `tokio::task::spawn_blocking` for CPU-intensive or blocking I/O work — running it directly starves the async runtime. (5) `select!` cancels branches that don't fire — futures must be cancel-safe (partial state is lost). (6) Mutex poisoning: if a thread panics while holding a mutex, it becomes poisoned — `lock()` returns `Err` — and what to do about it. (7) Rayon vs tokio: rayon for CPU-bound data parallelism (work-stealing across all cores), tokio for I/O-bound async tasks (cooperative multitasking on few OS threads).

---

## 9. Error Handling Strategies

### Mechanics

Rust has no exceptions. Errors are represented as values. Recoverable errors use `Result<T, E>`; unrecoverable errors use `panic!`. The `?` operator is sugar for early-return propagation. This design makes error paths explicit and auditable.

```rust
use std::fmt;
use std::num::ParseIntError;

// CUSTOM ERROR TYPE: implement std::error::Error
#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Parse(ParseIntError),
    InvalidInput { field: String, value: String },
    NotFound(u64),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Io(e)           => write!(f, "IO error: {}", e),
            AppError::Parse(e)        => write!(f, "Parse error: {}", e),
            AppError::InvalidInput { field, value }
                                      => write!(f, "Invalid {} = {:?}", field, value),
            AppError::NotFound(id)    => write!(f, "Not found: id={}", id),
        }
    }
}

// std::error::Error requires Display + Debug, provides default cause chain
impl std::error::Error for AppError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            AppError::Io(e)    => Some(e),
            AppError::Parse(e) => Some(e),
            _                  => None,
        }
    }
}

// From impls: enable ? operator to auto-convert error types
impl From<std::io::Error>  for AppError { fn from(e: std::io::Error)  -> Self { AppError::Io(e) } }
impl From<ParseIntError>   for AppError { fn from(e: ParseIntError)   -> Self { AppError::Parse(e) } }

// THE ? OPERATOR: propagate errors with automatic From conversion
fn read_config(path: &str) -> Result<Config, AppError> {
    let content = std::fs::read_to_string(path)?;  // io::Error → AppError::Io via From
    let port    = content.trim().parse::<u16>()?;  // ParseIntError → AppError::Parse via From
    Ok(Config { port })
}
// Equivalent to: match result { Ok(v) => v, Err(e) => return Err(AppError::from(e)) }

// THISERROR CRATE: derive macro for error types (industry standard)
use thiserror::Error;
#[derive(Error, Debug)]
enum ServiceError {
    #[error("database error: {0}")]      Db(#[from] sqlx::Error),
    #[error("not found: id={id}")]       NotFound { id: u64 },
    #[error("validation failed: {msg}")] Validation { msg: String },
    #[error(transparent)]                Io(#[from] std::io::Error),  // delegate Display to source
}
// #[from] generates From impl automatically
// #[error(...)] generates Display automatically
// This is the idiomatic pattern for library error types

// ANYHOW CRATE: ergonomic error handling for applications (not libraries)
use anyhow::{Context, Result, anyhow, bail};

fn main() -> Result<()> {  // anyhow::Result = Result<T, anyhow::Error>
    let content = std::fs::read_to_string("config.toml")
        .context("failed to read config file")?;  // adds context to any error
    let value: i32 = content.trim().parse()
        .context("config must contain a number")?;
    if value < 0 { bail!("value must be non-negative, got {}", value); }  // bail! = return Err
    let err = anyhow!("custom one-off error");  // anyhow! = create anyhow::Error
    Ok(())
}
// anyhow: great for apps. thiserror: great for libraries that callers will match on.

// PANIC vs RESULT: the design decision
// panic! for: violated invariants (programming errors), truly unrecoverable states
// Result for: expected failure modes (I/O, parsing, network, validation)
// Never use panic! for: user input validation, network errors, file not found

// RESULT COMBINATORS
let r: Result<i32, String> = Ok(5);
r.map(|v| v * 2);                    // Ok(10) — transform Ok value
r.map_err(|e| format!("err: {}", e)); // transform Err value
r.and_then(|v| if v > 0 { Ok(v) } else { Err("negative".into()) });
r.unwrap_or(0);                      // 5 or 0 on Err
r.unwrap_or_else(|e| { log(e); 0 }); // lazily evaluated default
r.ok();                              // Option<i32>: Some(5) or None
r.is_ok(); r.is_err();               // bool predicates

// COLLECTING RESULTS: fail-fast
let strings = vec!["1", "2", "not a number", "4"];
let numbers: Result<Vec<i32>, _> = strings.iter()
    .map(|s| s.parse::<i32>())
    .collect();  // Err(ParseIntError) — stops at first error

// Collect all errors (partition_result on nightly, manual on stable)
let (oks, errs): (Vec<_>, Vec<_>) = strings.iter()
    .map(|s| s.parse::<i32>())
    .partition(Result::is_ok);
let values: Vec<i32>     = oks.into_iter().map(Result::unwrap).collect();
let errors: Vec<_>       = errs.into_iter().map(Result::unwrap_err).collect();
```

**L1 SIGNAL:** Must use `?` operator for error propagation. Must know when to use `unwrap()` (tests, prototyping, logically impossible failures) vs proper error handling. Must implement `Display` for custom error types. Must know the difference between `panic!` and `Result`.

**L1 RED FLAGS:**
- Uses `.unwrap()` everywhere in production code without justification
- Cannot write a function that returns `Result<T, E>` with `?` propagation
- Does not implement `Display` for custom errors (just derives `Debug`)
- Uses `panic!` for expected error conditions (user input, network failures)

**L2 SIGNAL:** Must know when to use `thiserror` (libraries) vs `anyhow` (applications). Must implement `From` impls to enable `?` conversion. Must know `source()` method for error cause chaining. Must use `.context()` / `.with_context()` from `anyhow` to add diagnostic context at each layer. Must know how to collect an iterator of `Result<T, E>` into `Result<Vec<T>, E>`.

**L2 RED FLAGS:**
- Uses `Box<dyn Error>` instead of a typed error enum for library code (callers can't match)
- Doesn't know the difference between anyhow and thiserror — uses anyhow in a library
- Cannot explain how `?` uses `From` to convert error types
- Implements `std::error::Error` manually but forgets to implement `Display` (required)

**L3 SIGNAL:** Must know: (1) Error handling performance: `Result<T, E>` is zero-cost for the happy path — no exception table, no unwinding unless a panic occurs. (2) `catch_unwind`: can catch panics at a boundary (e.g., FFI, plugin systems) — but panicking through FFI is undefined behavior, so always catch at the Rust/C boundary. (3) `thiserror` expands to manual trait impls — no runtime overhead from derive. (4) Error type size matters: large `E` in `Result<T, E>` increases stack frame size — consider boxing large error variants. (5) In async contexts, errors in spawned tasks are not automatically propagated — `JoinHandle::await` must be checked, and panics in tasks poison the `JoinHandle`. (6) Structured error handling at scale: organizing error types in a hierarchy (per-module errors rolled up into a top-level error type) vs one flat error enum — trade-offs in ergonomics, debuggability, and API stability.

---

## 10. Module and Package System

### Mechanics

Rust's module system: **packages** contain one or more **crates** (binary or library); a crate is a compilation unit. **Modules** organize code within a crate. Visibility is controlled with `pub`, `pub(crate)`, `pub(super)`, and `pub(in path)`. The module tree must be explicitly declared — no auto-discovery of files.

```rust
// CRATE STRUCTURE
// src/lib.rs   — library crate root
// src/main.rs  — binary crate root
// src/bin/tool.rs — additional binary
// Cargo.toml   — manifest

// MODULE DECLARATION in src/lib.rs
mod utils;           // declares module, loads from src/utils.rs or src/utils/mod.rs
mod network {        // inline module definition
    pub mod http;
    pub mod tcp;
}

// FILE-BASED MODULES (Rust 2018+ style — preferred)
// src/utils.rs           → mod utils;
// src/network/mod.rs     → mod network;
// src/network/http.rs    → pub mod http; (in network/mod.rs)

// VISIBILITY
pub struct Public;                    // visible everywhere
pub(crate) struct CrateVisible;       // visible within this crate only
pub(super) struct ParentVisible;      // visible in parent module
struct Private;                       // visible in current module only

pub struct Config {
    pub name: String,          // public field
    pub(crate) timeout: u64,   // accessible within crate, not externally
    secret_key: String,        // private — only accessible in Config's module
}

// USE DECLARATIONS
use std::collections::HashMap;
use std::collections::{HashMap, HashSet, BTreeMap};   // multiple at once
use std::io::{self, Read, Write};                     // self = std::io module itself
use std::collections::HashMap as Map;                  // rename
pub use self::models::User;                            // re-export (becomes part of public API)

// Re-exporting for clean public API (pub use is library API design)
// In lib.rs: pub use crate::core::processor::Processor; — users import from top-level

// PATH SYNTAX
// Absolute: crate::module::Type  or  std::collections::HashMap
// Relative: self::sibling_module::Type  or  super::parent_function
// External: use rand::Rng;

// WORKSPACES: multiple crates sharing one Cargo.lock
// Cargo.toml (workspace root):
// [workspace]
// members = ["server", "client", "shared"]
// All crates share one target/ directory and one dependency resolution

// CONDITIONAL COMPILATION
#[cfg(target_os = "linux")]
fn linux_only() { }

#[cfg(feature = "async")]
use tokio;

#[cfg(test)]
mod tests {
    use super::*;   // imports everything from parent module
    #[test]
    fn it_works() { assert_eq!(2 + 2, 4); }
}

// cfg attributes in Cargo.toml features
// [features]
// default = ["http"]
// http = ["reqwest"]
// async = ["tokio"]

// CARGO FEATURES: additive capability flags
// cargo build --features "http async"
// #[cfg(feature = "http")] gates code behind feature flags

// SEMVER and Cargo
// ^1.2.3 — compatible: >=1.2.3 <2.0.0 (default)
// ~1.2.3 — patch: >=1.2.3 <1.3.0
// =1.2.3 — exact
// * — any version
// cargo update — update within compatible range
// Cargo.lock — committed for binaries, gitignored for libraries

// EXTERN CRATE (Rust 2015 compatibility — not needed in 2018+)
extern crate serde;   // 2015 edition only — 2018+ implicit
```

**L1 SIGNAL:** Must understand `mod`, `use`, and `pub`. Must know the file-based module system. Must write a library crate with a clean public API using `pub use` re-exports. Must understand `#[cfg(test)]` for test modules.

**L1 RED FLAGS:**
- Does not understand that `mod utils;` looks for `utils.rs` — tries to `use` without declaring
- Cannot structure a project with multiple files
- Marks everything `pub` to "make the compiler happy"
- Does not know `pub(crate)` exists — uses either fully public or fully private

**L2 SIGNAL:** Must know workspace structure for multi-crate projects. Must use `pub use` to design clean public APIs that hide internal structure. Must understand feature flags for conditional compilation. Must know when to split into library vs binary crates.

**L2 RED FLAGS:**
- Puts all code in `main.rs` for a non-trivial project
- Doesn't know about workspace — copies code between crates instead of sharing a common crate
- Doesn't understand that `pub use` re-exports determine the public API surface
- Cannot use `#[cfg(feature = "...")]` to gate optional functionality

**L3 SIGNAL:** Must know: (1) Cargo semver compatibility: breaking changes in a library require a major version bump — what counts as breaking (adding non-exhaustive enums, removing public items, changing public function signatures). (2) `#[non_exhaustive]` attribute on enums and structs — downstream crates cannot exhaustively match or construct them, enabling future additions without breaking changes. (3) Build scripts (`build.rs`): run before compilation, used for code generation, linking native libraries, environment detection. (4) Proc macros: three kinds (derive, attribute, function-like), run at compile time, have access to the token stream, live in their own crate. (5) Cargo.lock commitment policy: commit for application binaries (reproducible builds), do not commit for libraries (allow users to get latest compatible dependencies).

---

## 11. Testing Strategies and Patterns

### Mechanics

Rust has first-class testing support built into `cargo test`. Unit tests live alongside the code they test (in `#[cfg(test)]` modules). Integration tests live in `tests/`. Doc tests run examples in doc comments. Property-based testing via `proptest` or `quickcheck` crates.

```rust
// UNIT TESTS: inline, access private internals
#[cfg(test)]                    // compiled only for test builds
mod tests {
    use super::*;               // imports private items from parent module

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
        assert_ne!(add(2, 3), 6);
        assert!(add(2, 3) > 0);
    }

    #[test]
    #[should_panic(expected = "divide by zero")]
    fn test_divide_by_zero() {
        divide(1, 0);           // must panic with message containing "divide by zero"
    }

    #[test]
    fn test_result() -> Result<(), String> {
        let r = parse_int("42").map_err(|e| e.to_string())?;
        assert_eq!(r, 42);
        Ok(())                  // return Ok(()) for Result-returning test
    }

    // Test with custom message
    #[test]
    fn test_boundary() {
        let result = clamp(150, 0, 100);
        assert_eq!(result, 100, "clamp({}) should be {}, got {}", 150, 100, result);
    }
}

// INTEGRATION TESTS: tests/ directory, only access public API
// tests/integration_test.rs
use my_library::Config;

#[test]
fn integration_test() {
    let config = Config::from_file("tests/fixtures/valid_config.toml").unwrap();
    assert_eq!(config.port, 8080);
}

// DOC TESTS: examples in documentation are compiled and run
/// Adds two numbers together.
///
/// # Examples
/// ```
/// use my_lib::add;
/// let result = add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 { a + b }
// cargo test runs all doc examples — documentation stays accurate

// MOCKING: mockall crate (most popular)
use mockall::automock;
#[automock]
trait Database {
    fn get_user(&self, id: u64) -> Option<User>;
    fn save_user(&mut self, user: User) -> Result<(), DbError>;
}

#[test]
fn test_user_service() {
    let mut mock_db = MockDatabase::new();
    mock_db.expect_get_user()
        .with(mockall::predicate::eq(1u64))
        .times(1)
        .returning(|_| Some(User { id: 1, name: "Alice".to_string() }));

    let service = UserService::new(mock_db);
    let user = service.get_user(1).unwrap();
    assert_eq!(user.name, "Alice");
}

// PROPERTY-BASED TESTING with proptest
use proptest::prelude::*;

proptest! {
    #[test]
    fn sort_idempotent(v in prop::collection::vec(any::<i32>(), 0..100)) {
        let mut a = v.clone();
        a.sort();
        let mut b = a.clone();
        b.sort();
        prop_assert_eq!(a, b);  // sorting an already-sorted array is a no-op
    }

    #[test]
    fn add_commutative(a in any::<i32>(), b in any::<i32>()) {
        prop_assert_eq!(add_saturating(a, b), add_saturating(b, a));
    }
}

// CARGO TEST FLAGS
// cargo test                      — run all tests
// cargo test test_name            — run tests whose names contain "test_name"
// cargo test -- --test-threads=1  — run tests sequentially (for shared resources)
// cargo test -- --nocapture       — show println! output (suppressed by default)
// cargo test -- --ignored         — run only #[ignore]d tests

// BENCHMARK TESTING with criterion (external crate — stable)
use criterion::{criterion_group, criterion_main, Criterion, BenchmarkId};

fn bench_fibonacci(c: &mut Criterion) {
    let mut group = c.benchmark_group("fibonacci");
    for i in [10u64, 20, 30].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(i), i, |b, &n| {
            b.iter(|| fibonacci(criterion::black_box(n)));
        });
    }
    group.finish();
}
criterion_group!(benches, bench_fibonacci);
criterion_main!(benches);

// TEST HELPERS AND FIXTURES
fn make_user(id: u64) -> User {
    User { id, name: format!("user_{}", id), email: format!("u{}@test.com", id) }
}
// Use builder pattern for complex test fixtures
struct UserBuilder { inner: User }
impl UserBuilder {
    fn new() -> Self { UserBuilder { inner: User::default() } }
    fn with_id(mut self, id: u64)       -> Self { self.inner.id = id; self }
    fn with_name(mut self, n: &str)     -> Self { self.inner.name = n.to_string(); self }
    fn build(self)                       -> User { self.inner }
}
let user = UserBuilder::new().with_id(1).with_name("Alice").build();
```

**L1 SIGNAL:** Must write unit tests in `#[cfg(test)]` modules. Must use `assert_eq!`, `assert_ne!`, `assert!`. Must know `#[should_panic]`. Must know `cargo test` command and basic flags.

**L1 RED FLAGS:**
- Does not write any tests
- Does not know tests in `#[cfg(test)]` can access private functions
- Uses `println!` to verify behavior instead of assertions
- Does not know `cargo test -- --nocapture` to see println output

**L2 SIGNAL:** Must write integration tests in `tests/`. Must write doc tests. Must use a mocking library (`mockall`) or trait-based test doubles. Must use `proptest` or `quickcheck` for property-based testing. Must know test fixtures and builder patterns for test setup.

**L2 RED FLAGS:**
- All tests are in `src/` inline — no integration tests even for public API
- Tests only the happy path — no error case tests
- Cannot write tests for async functions (needs `#[tokio::test]` or similar)
- Does not use mocking — instead creates real dependencies in tests (slow, flaky)

**L3 SIGNAL:** Must know: (1) `criterion` for statistically rigorous benchmarks — understands warmup, iteration count, and statistical significance. (2) Fuzz testing with `cargo-fuzz` (libFuzzer) or `AFL.rs` for finding security vulnerabilities and panics. (3) Snapshot testing with `insta` crate for output comparison. (4) `loom` crate for testing concurrent code — model checking with permutation of thread schedules. (5) Test isolation: `tempfile` crate for temporary directories, avoiding shared global state between tests (tests run in parallel by default). (6) Performance regression testing in CI: storing baseline criterion results and comparing.


---

## 12. Performance Optimization Patterns

### Mechanics

Rust's performance model: zero-cost abstractions (iterators, closures, generics compile to the same code as hand-written loops), LLVM-backed optimization, predictable layout, no GC pauses. The primary performance tools are: `cargo build --release` (enables LLVM optimization passes), profiling with `perf`/`flamegraph`/`cargo-flamegraph`, and micro-benchmarking with `criterion`.

```rust
// ZERO-COST ITERATOR PIPELINES
// This compiles to an equivalent hand-written loop — no intermediate allocations
let sum: i64 = (0..1_000_000_i64)
    .filter(|&x| x % 2 == 0)
    .map(|x| x * x)
    .sum();
// LLVM sees through the iterator chain and produces optimal machine code

// AVOID CLONES IN HOT PATHS
// BAD: clones String on every iteration
fn process_bad(items: &[String]) {
    for item in items {
        let copy = item.clone();  // unnecessary allocation
        process_string(copy);
    }
}
// GOOD: pass references
fn process_good(items: &[String]) {
    for item in items {
        process_str_ref(item.as_str());  // no allocation
    }
}

// COW (Copy-on-Write): avoid allocation when mutation is rare
use std::borrow::Cow;
fn ensure_uppercase(s: &str) -> Cow<str> {
    if s.chars().all(|c| c.is_uppercase()) {
        Cow::Borrowed(s)      // no allocation — return reference to original
    } else {
        Cow::Owned(s.to_uppercase())  // allocate only when needed
    }
}
// Cow<str> deref-coerces to &str — caller doesn't care which variant

// AVOID REPEATED HASHING: entry API does one lookup
let mut counts: HashMap<String, usize> = HashMap::new();
// BAD: two hash lookups (contains_key + insert or get_mut)
if !counts.contains_key("key") {
    counts.insert("key".to_string(), 0);
}
// GOOD: one lookup
*counts.entry("key".to_string()).or_insert(0) += 1;

// STRING BUILDING: use String::with_capacity or write! macro
// BAD: repeated concatenation = O(n^2) allocations
let mut s = String::new();
for i in 0..100 { s = s + &i.to_string() + ", "; }
// GOOD: pre-allocate or use join
let parts: Vec<String> = (0..100).map(|i| i.to_string()).collect();
let result = parts.join(", ");
// Or use write! into a preallocated String:
use std::fmt::Write;
let mut s = String::with_capacity(512);
for i in 0..100 { write!(s, "{}, ", i).unwrap(); }

// SIMD-FRIENDLY CODE: use slices and iterators (LLVM auto-vectorizes)
fn sum_slice(data: &[f32]) -> f32 {
    data.iter().sum()  // LLVM will auto-vectorize with SSE/AVX
}
// Manual SIMD: std::arch module (unsafe), portable_simd (nightly), packed_simd crate

// ALLOCATION PROFILING
// DHAT (heap profiler via valgrind) or dhat-rs crate
// cargo run --features dhat-heap — instruments all allocations
// Look for: hot allocation sites, unexpectedly large allocations, fragmentation

// INLINING HINTS
#[inline]      // suggest inlining (hint, not command)
fn small_fn(x: i32) -> i32 { x * 2 }

#[inline(always)]  // force inline (even in debug builds)
fn critical_fn(x: i32) -> i32 { x + 1 }

#[inline(never)]   // force no inline (useful for profiling specific functions)
fn do_not_inline(x: i32) -> i32 { heavy_computation(x) }

// STACK vs HEAP: prefer stack for small, fixed-size data
// Stack access: ~1 cycle (L1 cache resident)
// Heap access: varies 10-100+ cycles (may miss cache)
let stack_arr: [i32; 64] = [0; 64];   // 256 bytes on stack — fast
let heap_vec: Vec<i32>    = vec![0; 64];  // pointer + heap alloc — slower

// For large or unknown-size data: heap is correct and necessary
// For >~1MB data: consider heap even if size is known (stack overflow risk)

// LOOP UNROLLING and bounds checks
// Vec index with [] performs bounds check every access
// Use .iter() or .iter_mut() to avoid redundant bounds checks (compiler proves safety)
let v = vec![1i32, 2, 3, 4, 5];
// These are equivalent in release mode (bounds checks eliminated):
let sum: i32 = v.iter().sum();         // idiomatic, compiler optimizes
let sum: i32 = v.iter().copied().sum(); // for Copy types, avoids &i32 deref

// If you absolutely need unchecked access in a proven-safe hot loop:
unsafe { *v.get_unchecked(0) }   // no bounds check — must prove manually it's safe

// CACHE PERFORMANCE: array of structs vs struct of arrays
// AoS: cache-unfriendly when accessing one field of many objects
struct ParticleAoS { x: f32, y: f32, z: f32, mass: f32 }
let particles: Vec<ParticleAoS> = vec![...];
// Summing x: stride = 16 bytes, cache wastes 12 bytes per element

// SoA: cache-friendly for per-field operations
struct ParticlesSoA { xs: Vec<f32>, ys: Vec<f32>, zs: Vec<f32>, masses: Vec<f32> }
// Summing xs: xs is contiguous — full cache line utilization

// RELEASE BUILD OPTIMIZATIONS: set in Cargo.toml
// [profile.release]
// opt-level = 3       # maximum optimization (default)
// lto = "fat"         # link-time optimization across crates (slower build, faster code)
// codegen-units = 1   # single codegen unit (slower build, better inter-function optimization)
// strip = true        # strip debug symbols (smaller binary)
// panic = "abort"     # abort on panic instead of unwind (smaller binary, no try/catch)
//
// [profile.release-with-debug]
// inherits = "release"
// debug = true        # keep debug info for profiling

// PROFILE-GUIDED OPTIMIZATION (PGO): 2-15% improvement
// Step 1: build with profiling instrumentation
// RUSTFLAGS="-Cprofile-generate=./pgo-data" cargo build --release
// Step 2: run workload representative of production
// Step 3: merge profiling data and rebuild
// RUSTFLAGS="-Cprofile-use=./pgo-data/merged.profdata" cargo build --release
```

**L1 SIGNAL:** Must know that `--release` is needed for performance testing. Must know iterators are zero-cost. Must use `Vec::with_capacity` when size is known. Must prefer `&str` over `String` in function parameters to avoid cloning.

**L1 RED FLAGS:**
- Benchmarks debug builds
- Clones strings unnecessarily in performance-sensitive code
- Does not know iterator chains are lazy (thinks each adaptor allocates)
- Uses `String::from` + `+` concatenation in a loop (O(n²) allocations)

**L2 SIGNAL:** Must explain when `Cow<str>` avoids allocations. Must know `HashMap::entry()` for single-lookup insert-or-update. Must understand `#[inline]` hints and when to use them. Must know SoA vs AoS layout for cache performance. Must use criterion for micro-benchmarks and understand statistical noise.

**L2 RED FLAGS:**
- Does not know `Cow<str>` exists — always allocates in clone-vs-borrow scenarios
- Cannot explain cache locality or why SoA can be faster than AoS
- Uses `#[inline(always)]` on large functions (can increase I-cache pressure, hurting performance)
- Does not know bounds checks can be eliminated by iterators in release mode

**L3 SIGNAL:** Must know: (1) LTO (link-time optimization) enables inlining across crate boundaries — `lto = "fat"` is often worth the build time cost for release binaries. (2) PGO (profile-guided optimization) gives 2-15% throughput improvement by guiding branch prediction and inlining decisions. (3) `codegen-units = 1` improves optimization quality at the cost of parallel compilation — worth it for final release. (4) SIMD: `std::arch` for architecture-specific intrinsics, `portable_simd` (nightly) for portable SIMD. LLVM auto-vectorizes iterator chains reliably in many cases. (5) `panic = "abort"` avoids generating unwind tables, reducing binary size by 10-20% and enabling more aggressive inlining. (6) Cargo `--timings` to identify slow build dependencies. `sccache` for build caching in CI. Cranelift backend for faster debug builds.

---

## 13. Undefined Behavior, Unsafe Rust, and Gotchas

### Mechanics

Safe Rust is designed to make undefined behavior impossible. `unsafe` code opts out of these guarantees. The borrow checker, type system, and runtime checks (bounds checking, overflow checking in debug mode) are the safety mechanisms. Knowing what constitutes UB — and how to avoid it in `unsafe` blocks — is critical L3 knowledge.

```rust
// OVERFLOW BEHAVIOR
// Debug builds: panic on overflow
// Release builds: wrapping (two's complement)
let x: u8 = 255;
// x + 1;  // debug: panic; release: 0 (wrapping)

// Explicit overflow handling:
255u8.wrapping_add(1);          // 0 — explicit wrapping semantics
255u8.checked_add(1);           // None — returns None on overflow
255u8.saturating_add(1);        // 255 — clamps to max
255u8.overflowing_add(1);       // (0, true) — value + did_overflow flag

// INTEGER DIVISION TRUNCATION (no rounding)
5 / 2       // 2 (truncates toward zero)
-5 / 2      // -2 (truncates toward zero, not floor!)
-5 / 2_i32  // -2 in Rust (same), but -3 in Python (floor division)

// NAN BEHAVIOR for floats
let nan = f64::NAN;
nan == nan           // false — NaN != NaN (IEEE 754)
nan < 0.0            // false
nan > 0.0            // false
f64::is_nan(nan)     // true — correct check
// f32/f64 do NOT implement Ord (only PartialOrd) — can't sort Vec<f64> directly
let mut floats = vec![3.0_f64, 1.0, 2.0];
floats.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
// OR use total_cmp (stable since 1.62) which handles NaN consistently:
floats.sort_by(f64::total_cmp);

// ITERATOR EXHAUSTION — iterators are stateful and consumed
let v = vec![1, 2, 3];
let mut iter = v.iter();
iter.next();     // Some(&1)
iter.next();     // Some(&2)
// for x in iter {...}  // only gets &3 — partially consumed

// COLLECT TYPE INFERENCE
// Must specify target type — often via turbofish or annotation
let v: Vec<i32> = (0..5).collect();               // explicit annotation
let v = (0..5).collect::<Vec<_>>();               // turbofish
let s: String = ['h','i'].iter().collect();       // chars → String
let m: HashMap<_, _> = vec![("a", 1), ("b", 2)].into_iter().collect();

// STRING INDEXING PANICS
let s = String::from("hello");
// s[0]     // compile error: cannot index String
// &s[0..1] // "h" — works only on valid UTF-8 byte boundaries
// &s[0..2] // might panic if multi-byte char spans boundary (e.g., "Ω" is 2 bytes)
let s2 = "Ω is a letter";
// &s2[0..1]  // PANIC: not a UTF-8 char boundary

// Safe string operations:
s.chars().nth(0);             // O(n) — iterates to find nth char
s.chars().count();            // O(n) — length in chars, not bytes
s.len();                      // O(1) — length in bytes, not chars

// LIFETIME GOTCHA: temporary dropped at end of statement
// This does NOT work:
// let s: &str = String::from("hello").as_str();  // dangling: String dropped
// let r = &*Box::new(5);  // dangling: Box dropped
// Compiler catches these, but be aware in more complex scenarios

// SHARED REFERENCE ALIASING — safe code cannot create this, but patterns to know:
// Multiple &T references are always safe (immutable)
// &mut T is EXCLUSIVE — compiler proves no other reference exists at the same time

// UNSAFE RUST — the five things unsafe enables:
// 1. Dereference raw pointers
// 2. Call unsafe functions
// 3. Access/modify mutable static variables
// 4. Implement unsafe traits
// 5. Access fields of unions

// RAW POINTERS
let x = 5;
let p: *const i32 = &x as *const i32;   // create raw pointer (safe)
let val: i32 = unsafe { *p };            // dereference (unsafe)
// Raw pointers can be null, can alias, can dangle — all UB if misused

// UNDEFINED BEHAVIOR LIST (what makes unsafe code unsound):
// - Dereferencing null or dangling pointer
// - Data race (two threads accessing same memory, one writes, no synchronization)
// - Unaligned memory access
// - Reading uninitialized memory
// - Violating aliasing rules: &mut T must not alias any other reference
// - Calling a function through a pointer with the wrong signature
// - Unwinding out of an extern "C" function (ABI boundary panic is UB)
// - Breaking invariants of a type (e.g., String must be valid UTF-8)
// - Use-after-free
// - Integer overflow in C-like arithmetics (in unsafe numeric code)

// TRANSMUTE: reinterpret bytes — extremely dangerous
// Only valid if: both types same size, bit pattern valid for target type
let bytes: [u8; 4] = [0x00, 0x00, 0x80, 0x3f];
let f: f32 = unsafe { std::mem::transmute(bytes) };  // 1.0f32
// SAFE ALTERNATIVE: f32::from_bits / f32::to_bits (since Rust 1.20)
let f: f32 = f32::from_bits(u32::from_le_bytes(bytes));

// MIRI: UB detector for unsafe code
// cargo +nightly miri test — runs tests under Miri interpreter, catches most UB
// Slower than real execution but catches: dangling pointers, uninitialized reads,
// integer overflow, alignment violations, stacked borrows violations

// SANITIZERS (nightly): AddressSanitizer, MemorySanitizer, ThreadSanitizer
// RUSTFLAGS="-Z sanitizer=address" cargo +nightly test
// Catches: heap use-after-free, stack/heap buffer overflows, use-after-scope

// SAFE ABSTRACTION PATTERN: unsafe internals, safe public API
pub struct MySlice<T> {
    ptr: *const T,
    len: usize,
    _marker: std::marker::PhantomData<T>,
}
impl<T> MySlice<T> {
    pub fn get(&self, index: usize) -> Option<&T> {
        if index < self.len {
            Some(unsafe { &*self.ptr.add(index) })  // safe: bounds checked above
        } else {
            None
        }
    }
}
// Rule: unsafe code must document its safety invariants and prove they hold
```

**L1 SIGNAL:** Must know overflow behavior differs between debug and release. Must know floats don't implement `Ord`. Must know string indexing panics on non-UTF-8 boundaries. Must know `checked_add`/`saturating_add`/`wrapping_add`.

**L1 RED FLAGS:**
- Does not know debug vs release overflow behavior difference
- Indexes strings with `&s[n..]` without considering UTF-8 boundaries
- Does not know `f64` doesn't implement `Ord` — confused when sort fails to compile
- Thinks `unsafe` just "disables the borrow checker" (it enables 5 specific things)

**L2 SIGNAL:** Must explain the five things `unsafe` enables. Must know raw pointer semantics. Must know when to use `transmute` vs safe alternatives. Must understand that `unsafe` blocks contract: the programmer guarantees the safety invariants. Must know Miri for detecting UB in unsafe code.

**L2 RED FLAGS:**
- Uses `unsafe` to work around borrow checker without understanding why the borrow checker complained
- Does not know Miri exists — no tool for verifying unsafe code
- Uses `mem::transmute` where `from_bits`/safe alternatives exist
- Cannot articulate the safety invariant their `unsafe` block relies on

**L3 SIGNAL:** Must know: (1) Stacked borrows model: `&mut T` creates a "new borrow" on the stack; the borrow must be used in strict LIFO order — violations are UB in unsafe code (Miri enforces this). (2) `UnsafeCell<T>` is the only legal way to create shared mutable references — raw pointer arithmetic through shared references is UB without `UnsafeCell`. (3) Alignment: `*const T` requires the address to be aligned to `align_of::<T>()` — reading a u32 from an odd address is UB even in unsafe. Use `ptr::read_unaligned` for unaligned access. (4) Union safety: accessing a union field reads raw bytes — only the last-written field is valid; `MaybeUninit<T>` is the safe way to handle uninitialized data. (5) `extern "C"` functions must not panic — install a panic hook that aborts at FFI boundaries.

---

## 14. Modern Language Features by Version

### Rust Editions and Feature Timeline

```rust
// RUST 2015 (EDITION 1.0)
// Foundation: ownership, traits, generics, lifetimes, pattern matching
// extern crate required for dependencies

// RUST 2018 EDITION (1.31)
// extern crate no longer required (auto-imported)
// NLL (Non-Lexical Lifetimes) stable — borrows end at last use
// impl Trait in argument position
// dyn Trait syntax required (replacing bare trait objects)
// module path simplification: use crate::module instead of extern crate + ::module
// async/await syntax added to language (though runtime came in 1.39)

// ASYNC/AWAIT — stable in Rust 1.39 (2019)
async fn fetch(url: &str) -> Result<String, reqwest::Error> {
    reqwest::get(url).await?.text().await
}
// Desugars to: fn fetch(...) -> impl Future<Output=Result<String, reqwest::Error>>

// RUST 1.51 (2021): CONST GENERICS (MVP)
fn zeros<const N: usize>() -> [i32; N] { [0; N] }
let arr: [i32; 5] = zeros::<5>();

// RUST 2021 EDITION (1.56)
// Disjoint capture in closures: only captures fields used, not entire struct
let point = Point { x: 1, y: 2 };
// 2018: this closure captures all of `point`
// 2021: this closure captures only `point.x` (disjoint capture)
let f = move || println!("{}", point.x);
// In 2021, `point.y` could still be used after the move closure is created

// IntoIterator for arrays: [1,2,3].into_iter() yields i32, not &i32
// (In 2018, array.into_iter() returned &i32 — 2021 fixes this)
for x in [1, 2, 3] { println!("{}", x); }  // x is i32 in 2021

// Panic macro no longer accepts non-string-literal with single argument
// panic!(my_string)  → panic!("{}", my_string)  (or panic!("{my_string}"))

// RUST 1.58 (2022): CAPTURED IDENTIFIERS IN FORMAT STRINGS
let name = "world";
println!("Hello, {name}!");  // captures `name` from scope — no positional arg needed
let x = 42;
println!("{x:>10}");         // formatting specifiers work too

// RUST 1.63 (2022): SCOPED THREADS
// std::thread::scope allows threads to borrow from outer scope (with lifetime guarantee)
let data = vec![1, 2, 3, 4, 5];
std::thread::scope(|s| {
    s.spawn(|| println!("{:?}", data));   // can borrow `data`! lifetime guaranteed
    s.spawn(|| println!("sum: {}", data.iter().sum::<i32>()));
});  // all scoped threads joined here — data still valid

// Previously required `move` and `Arc`; scoped threads eliminate this for shared reads

// RUST 1.65 (2022): GATs STABLE, LET/ELSE
// let-else: bind or return (replaces match-or-return boilerplate)
fn parse_config(s: &str) -> Option<Config> {
    let Some(first_line) = s.lines().next() else {
        return None;   // let-else: if pattern doesn't match, execute else block
    };
    // first_line is in scope here
    Some(Config::from_line(first_line))
}

// RUST 1.70 (2023): ONCECELL IN STD
use std::sync::OnceLock;
static INSTANCE: OnceLock<ExpensiveObject> = OnceLock::new();
fn get() -> &'static ExpensiveObject {
    INSTANCE.get_or_init(ExpensiveObject::new)
}

// RUST 1.75 (2023): ASYNC FN IN TRAITS STABLE
trait AsyncFetch {
    async fn fetch(&self, url: &str) -> Result<String, Error>;
    // Previously required: fn fetch(&self, ...) -> impl Future<...> + Send;
    // Or the async-trait crate with boxing overhead
}

// RUST 1.79 (2024): INLINE CONST EXPRESSIONS
let x = [1, 2, 3, const { usize::BITS as usize }];  // const expression in array position

// RUST 1.80 (2024): LAZY CELL STABLE
use std::cell::LazyCell;
let expensive = LazyCell::new(|| compute_expensive_value());
println!("{}", *expensive);  // computed on first access, cached forever

// RUST 1.82 (2024): RAW REF OPERATORS, MORE CONST FN STABILIZATIONS
// &raw const x and &raw mut x: create raw pointers without going through a reference
// Avoids creating an intermediate reference (which has aliasing requirements)
let x = 5;
let p = &raw const x;  // raw pointer, no &x created (no aliasing requirements)

// EDITION 2024 (stabilizing)
// if let chains: if let Some(x) = opt && x > 0 { ... }
// Improved async closure capture
// Reserved syntax for gen (generators/coroutines)
```

**L1 SIGNAL:** Must know the difference between editions (2015/2018/2021) and that editions are not breaking changes — old code still compiles. Must know `let-else` (1.65). Must know format string captures (1.58).

**L1 RED FLAGS:**
- Does not know editions exist — confused why `dyn Trait` is required in some places
- Cannot use captured format strings (`println!("{name}")`)
- Does not know `async fn` in traits is now stable (historically needed `async-trait` crate)

**L2 SIGNAL:** Must explain disjoint capture in closures (2021 edition) and why it matters. Must know scoped threads (1.63) and when they eliminate the need for `Arc`. Must know `OnceLock` and `LazyCell` for one-time initialization. Must know which features required external crates before being stabilized in `std`.

**L2 RED FLAGS:**
- Still uses `lazy_static!` macro when `OnceLock`/`LazyCell` are in std
- Does not know scoped threads — always uses `Arc` for shared borrows across threads
- Unaware that `async fn` in traits changed stabilization status
- Cannot explain what changed between Rust 2018 and 2021 editions for their project

**L3 SIGNAL:** Must know: (1) Edition migrations are done with `cargo fix --edition` — no code is broken, old Rust compiles in new editions via compatibility layer. (2) GATs (1.65) unlock streaming iterators and self-referential patterns previously impossible or requiring unsafe. (3) Const generics evolution: 1.51 was MVP (integers only), later releases expand to more complex const expressions. (4) `async fn` in traits (1.75) desugars differently from free async functions — the returned future is an opaque type per impl, which creates object-safety issues for `dyn AsyncTrait`. (5) RPITIT (return position `impl Trait` in traits) semantic differences and how it relates to GATs under the hood.

---

## 15. Ecosystem and Tooling

### Core Toolchain

```
rustup    — toolchain manager (install/switch stable/beta/nightly)
cargo     — build system, package manager, test runner, benchmark runner
rustc     — the compiler (rarely called directly)
clippy    — linter (cargo clippy) — hundreds of correctness and style lints
rustfmt   — formatter (cargo fmt) — enforces consistent style
rust-analyzer — LSP server for IDEs (replaces RLS)
```

```bash
# TOOLCHAIN MANAGEMENT
rustup update                         # update all installed toolchains
rustup toolchain install nightly      # install nightly
rustup override set nightly           # use nightly for current directory
rustup target add wasm32-unknown-unknown  # cross-compile target

# CARGO COMMANDS
cargo new my-project                  # create new binary crate
cargo new my-lib --lib                # create new library crate
cargo build                           # debug build (target/debug/)
cargo build --release                 # release build (target/release/)
cargo run                             # build and run
cargo test                            # run all tests
cargo test --release                  # run tests with optimizations
cargo bench                           # run benchmarks
cargo check                           # type-check without codegen (fast)
cargo clippy                          # run linter
cargo fmt                             # format code
cargo doc --open                      # generate and open documentation
cargo audit                           # check dependencies for vulnerabilities
cargo update                          # update Cargo.lock
cargo tree                            # show dependency tree
cargo tree --duplicates               # show duplicate dependencies (version conflicts)

# USEFUL CARGO PLUGINS
cargo install cargo-expand    # show macro expansion: cargo expand
cargo install cargo-flamegraph # profiling: cargo flamegraph
cargo install cargo-watch     # auto-rebuild: cargo watch -x run
cargo install cargo-criterion # criterion benchmark runner
cargo install cargo-udeps     # find unused dependencies
cargo install cargo-audit     # security vulnerability checker
cargo install cargo-deny      # license and vulnerability policy enforcement
cargo install tokio-console   # async runtime inspector (tokio)
cargo install cargo-msrv      # find minimum supported Rust version
```

### Key Crates by Category

| Category | Crate | Notes |
|---|---|---|
| Async runtime | `tokio` | Dominant, multi-threaded work-stealing scheduler |
| Async runtime | `async-std` | std-compatible API surface, less popular |
| Async runtime | `smol` | Lightweight, good for embedded/single-threaded |
| HTTP client | `reqwest` | Tokio-based, TLS, ergonomic |
| HTTP server | `axum` | Tokio/Tower-based, type-safe, fast |
| HTTP server | `actix-web` | Actor-based, highest raw throughput in benchmarks |
| Serialization | `serde` | De-facto standard, derive macros, many formats |
| Serialization | `serde_json` | JSON via serde |
| Serialization | `bincode` | Binary serde format, compact |
| DB (async) | `sqlx` | Compile-time checked SQL queries, async |
| DB (ORM) | `diesel` | Sync ORM, type-safe query builder |
| Error handling | `thiserror` | Library error types via derive |
| Error handling | `anyhow` | Application error handling, context |
| Logging | `tracing` | Structured, async-aware, spans |
| Logging | `log` + `env_logger` | Simple facade, not async-aware |
| CLI | `clap` | Argument parsing, derive macros |
| Config | `config` | Multi-source config (files, env, CLI) |
| Parallelism | `rayon` | Data-parallel iterators, work-stealing |
| Random | `rand` | Cryptographically-secure and fast PRNGs |
| Regex | `regex` | Guaranteed linear-time matching |
| Date/Time | `chrono` | Full date/time library |
| Data parallel | `ndarray` | N-dimensional arrays (numpy analog) |
| Hashing (fast) | `ahash` | Fast non-cryptographic hasher for HashMap |
| Testing mocks | `mockall` | Derive mocks for traits |
| Testing props | `proptest` | Property-based testing |
| Benchmarking | `criterion` | Statistical micro-benchmarks |
| WASM | `wasm-bindgen` | Rust to/from JavaScript interop |

```rust
// TRACING: structured logging for async code (preferred over log crate)
use tracing::{info, warn, error, debug, instrument, span, Level};

#[instrument(skip(password))]  // auto-traces function entry/exit, logs args
async fn login(username: &str, password: &str) -> Result<User, AuthError> {
    info!(username = username, "attempting login");  // structured fields
    let user = db::find_user(username).await
        .map_err(|e| { error!(error = ?e, "db error"); e })?;
    info!(user_id = user.id, "login successful");
    Ok(user)
}

// SERDE: serialize/deserialize with derive macros
use serde::{Serialize, Deserialize};
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]   // JSON uses camelCase
struct UserDto {
    #[serde(rename = "userId")]       // override field rename for this specific field
    id:         u64,
    first_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    email:      Option<String>,      // omit from JSON if None
    #[serde(default)]
    is_active:  bool,                // use Default::default() if missing from JSON
}

// SQLX: compile-time checked SQL
use sqlx::postgres::PgPool;
#[derive(sqlx::FromRow)]
struct User { id: i64, name: String }

async fn get_user(pool: &PgPool, id: i64) -> Result<User, sqlx::Error> {
    sqlx::query_as!(User, "SELECT id, name FROM users WHERE id = $1", id)
        .fetch_one(pool)
        .await
}
// query_as! macro checks the SQL query against the database at COMPILE TIME
// Requires DATABASE_URL environment variable during compilation

// CLAP: CLI argument parsing with derive
use clap::Parser;
#[derive(Parser, Debug)]
#[command(name = "myapp", about = "Does stuff")]
struct Args {
    #[arg(short, long)]                     name:    String,
    #[arg(short, long, default_value = "8080")]  port:    u16,
    #[arg(long)]                            verbose: bool,
}
fn main() {
    let args = Args::parse();
    println!("Hello, {}! Port: {}", args.name, args.port);
}
```

**L1 SIGNAL:** Must know `cargo test`, `cargo build --release`, `cargo clippy`, `cargo fmt`. Must know the difference between `serde` and `serde_json`. Must know `tokio` is a runtime (not part of std).

**L1 RED FLAGS:**
- Does not run `cargo clippy` — unaware of common lint improvements
- Confused about why `async fn` does nothing without a runtime
- Does not know `cargo check` is faster than `cargo build` for type-checking
- Does not know `#[derive(Serialize, Deserialize)]` requires the `serde` crate with `features = ["derive"]`

**L2 SIGNAL:** Must know the tracing vs log crate trade-off (structured, async-aware vs simple facade). Must know `sqlx` compile-time query checking and its implications (DATABASE_URL required at compile time). Must explain the serde attribute system (`rename_all`, `skip_serializing_if`, `default`). Must know cargo plugins for audit, flamegraph, and expand.

**L2 RED FLAGS:**
- Uses `println!` for logging in production code — no structured logging
- Does not know `cargo audit` for security vulnerability checking
- Cannot configure serde field naming (`rename_all`, `rename`)
- Uses `env_logger` in a library crate — imposing logging implementation on users

**L3 SIGNAL:** Must know: (1) `tokio-console` for live async task inspection — shows task wakeup counts, sleep durations, identifies slow tasks. (2) `cargo-deny` for enforcing license compatibility and security policies in CI. (3) `cargo-msrv` to find and enforce the minimum supported Rust version (important for libraries). (4) `cargo tree --duplicates` to identify version conflicts causing binary bloat. (5) `cargo expand` to debug proc macro output. (6) The performance implications of `reqwest` feature flags (`native-tls` vs `rustls`) and their build dependencies. (7) `sqlx`'s offline mode (`sqlx-data.json`) for CI builds without a database.

---

## 16. Design Patterns in Idiomatic Rust

### Mechanics

Rust's type system enables patterns that look different from OOP patterns but achieve the same goals more safely. Key Rust-idiomatic patterns: builder, typestate, newtype, extension traits, RAII, strategy via closures, visitor via pattern matching.

```rust
// BUILDER PATTERN: construct complex objects step by step
// Idiomatic with owned builder (consuming setters) for compile-time field validation
#[derive(Debug)]
struct Server {
    host:         String,
    port:         u16,
    max_conn:     usize,
    tls_config:   Option<TlsConfig>,
}

struct ServerBuilder {
    host:       String,
    port:       u16,
    max_conn:   usize,
    tls_config: Option<TlsConfig>,
}

impl ServerBuilder {
    fn new(host: impl Into<String>) -> Self {
        ServerBuilder { host: host.into(), port: 8080, max_conn: 100, tls_config: None }
    }
    fn port(mut self, port: u16)             -> Self { self.port = port; self }
    fn max_connections(mut self, n: usize)   -> Self { self.max_conn = n; self }
    fn tls(mut self, cfg: TlsConfig)         -> Self { self.tls_config = Some(cfg); self }
    fn build(self) -> Result<Server, ConfigError> {
        if self.port == 0 { return Err(ConfigError::InvalidPort); }
        Ok(Server { host: self.host, port: self.port, max_conn: self.max_conn, tls_config: self.tls_config })
    }
}

let server = ServerBuilder::new("localhost")
    .port(3000)
    .max_connections(500)
    .build()?;

// TYPESTATE PATTERN: encode state in the type system — invalid transitions fail to compile
struct Connection<State> {
    stream: TcpStream,
    _state: std::marker::PhantomData<State>,
}
struct Disconnected;
struct Connected;
struct Authenticated;

impl Connection<Disconnected> {
    fn connect(addr: &str) -> Result<Connection<Connected>, Error> {
        let stream = TcpStream::connect(addr)?;
        Ok(Connection { stream, _state: PhantomData })
    }
}
impl Connection<Connected> {
    fn authenticate(self, creds: Credentials) -> Result<Connection<Authenticated>, Error> {
        // perform auth...
        Ok(Connection { stream: self.stream, _state: PhantomData })
    }
}
impl Connection<Authenticated> {
    fn query(&mut self, sql: &str) -> Result<Rows, Error> { /* only callable when authed */ }
}
// Cannot call .query() on a Connected (unauthenticated) connection — compile error

// NEWTYPE PATTERN: type-safe wrappers to prevent misuse
struct UserId(u64);
struct OrderId(u64);
// Cannot pass UserId where OrderId is expected — prevents ID mixup bugs
// Zero runtime cost: same memory layout as u64

// EXTENSION TRAITS: add methods to foreign types
trait SortedExt {
    fn sorted(self) -> Self;
}
impl<T: Ord> SortedExt for Vec<T> {
    fn sorted(mut self) -> Self { self.sort(); self }
}
let v = vec![3, 1, 2].sorted();  // method on Vec<T> defined in local crate

// RAII GUARD PATTERN: cleanup guaranteed via Drop
struct TransactionGuard<'a> {
    conn:      &'a mut Connection,
    committed: bool,
}
impl<'a> TransactionGuard<'a> {
    fn new(conn: &'a mut Connection) -> Result<Self, Error> {
        conn.execute("BEGIN")?;
        Ok(TransactionGuard { conn, committed: false })
    }
    fn commit(mut self) -> Result<(), Error> {
        self.conn.execute("COMMIT")?;
        self.committed = true;
        Ok(())
    }
}
impl Drop for TransactionGuard<'_> {
    fn drop(&mut self) {
        if !self.committed {
            let _ = self.conn.execute("ROLLBACK");  // ignore error in drop
        }
    }
}
// Transaction always rolled back if not committed — even on panic

// STRATEGY PATTERN via closures or trait objects
struct Sorter<F: Fn(&str, &str) -> std::cmp::Ordering> {
    compare: F,
}
impl<F: Fn(&str, &str) -> std::cmp::Ordering> Sorter<F> {
    fn sort(&self, data: &mut Vec<String>) {
        data.sort_by(|a, b| (self.compare)(a, b));
    }
}
let case_insensitive = Sorter { compare: |a, b| a.to_lowercase().cmp(&b.to_lowercase()) };

// ITERATOR ADAPTER PATTERN: implement Iterator for custom types
struct Fibonacci { a: u64, b: u64 }
impl Fibonacci { fn new() -> Self { Fibonacci { a: 0, b: 1 } } }
impl Iterator for Fibonacci {
    type Item = u64;
    fn next(&mut self) -> Option<u64> {
        let next = self.a;
        self.a = self.b;
        self.b = next + self.a;
        Some(next)  // infinite iterator — return None for finite
    }
}
Fibonacci::new().take(10).collect::<Vec<_>>();  // [0,1,1,2,3,5,8,13,21,34]

// COMMAND PATTERN for undo/redo
trait Command {
    fn execute(&mut self, doc: &mut Document);
    fn undo(&mut self, doc: &mut Document);
}
struct History {
    done:   Vec<Box<dyn Command>>,
    undone: Vec<Box<dyn Command>>,
}
impl History {
    fn execute(&mut self, mut cmd: Box<dyn Command>, doc: &mut Document) {
        cmd.execute(doc);
        self.done.push(cmd);
        self.undone.clear();
    }
    fn undo(&mut self, doc: &mut Document) {
        if let Some(mut cmd) = self.done.pop() {
            cmd.undo(doc);
            self.undone.push(cmd);
        }
    }
}
```

**L1 SIGNAL:** Must implement the Builder pattern. Must know the newtype pattern for type safety. Must implement a simple `Iterator` for a custom type. Must know RAII via `Drop`.

**L1 RED FLAGS:**
- Does not know the Builder pattern — creates structs with many required fields in a single constructor call
- Never uses newtype wrappers — uses primitive types directly (`u64` for IDs, allowing ID mixups)
- Cannot implement `Iterator` for a custom type
- Does not know `Drop` and relies on explicit cleanup methods (which can be forgotten)

**L2 SIGNAL:** Must know the typestate pattern and articulate when it's appropriate (protocol state machines, connection lifecycle, builder validation). Must know extension traits. Must implement the RAII guard pattern for resources (transactions, locks, file handles). Must know the strategy pattern via closures vs trait objects and the trade-off.

**L2 RED FLAGS:**
- Does not know typestate pattern — uses runtime state tracking (`enum State`) when compile-time would work
- Cannot write an extension trait for a foreign type
- Does not implement `Drop` for resource-holding types — relies on caller to call cleanup
- Uses `Box<dyn Fn>` for strategies where `impl Fn` in a generic would be zero-cost

**L3 SIGNAL:** Must know: (1) The typestate pattern's limitation: the number of states must be known at compile time — dynamic state machines still need runtime enums. (2) Builder pattern: typed/untyped builder — typed builder with phantom type parameters can enforce required fields at compile time (`let s = Builder::new().required_field("x").build()` vs `Builder::new().build()` — the latter fails to compile if required fields not set). (3) "Parse, don't validate" principle: transform unvalidated data into validated types at the boundary — validated types cannot exist in an invalid state. (4) The `#[must_use]` attribute on builder methods and `Result` types — enables compiler warnings when results are silently discarded.

---

## 17. Ownership, Borrowing, and Lifetimes — Advanced Patterns

### Mechanics

This section covers the advanced edge cases of the ownership and lifetime system that differentiate L2 from L3 candidates.

```rust
// SELF-REFERENTIAL STRUCTS: structs containing references to their own fields
// This is why Pin<T> exists — moving a self-referential struct invalidates the pointer
// Cannot write in safe Rust; requires Pin or external crates (ouroboros, self_cell)

// PINNING: Pin<P> guarantees the pointed-to value won't move
use std::pin::Pin;
use std::marker::PhantomPinned;

struct SelfReferential {
    value:    String,
    pointer:  *const String,   // raw pointer to `value`
    _pin:     PhantomPinned,   // opt out of Unpin — cannot move once pinned
}
impl SelfReferential {
    fn new(val: String) -> Pin<Box<Self>> {
        let mut s = Box::pin(SelfReferential {
            value:   val,
            pointer: std::ptr::null(),
            _pin:    PhantomPinned,
        });
        // Safe: we know s won't move (it's pinned)
        let ptr = &s.value as *const String;
        unsafe { s.as_mut().get_unchecked_mut().pointer = ptr; }
        s
    }
}
// Futures are self-referential: they hold references to local variables
// across await points — this is why async fn returns Pin<Box<dyn Future>>

// VARIANCE: how lifetime relationships flow through type constructors
// Covariant in 'a:     &'a T — can use 'long where 'short expected
// Invariant in 'a:     &'a mut T — 'a must match exactly
// Contravariant in 'a: fn(&'a T) — can use 'short where 'long expected (rare)

// Why &mut T is invariant in T (not covariant):
// If &mut T were covariant, you could write:
// let mut x: &'short str = "hello";
// let r: &mut &'short str = &mut x;
// let r_long: &mut &'long str = r;  // UNSOUND if this were allowed
// *r_long = "this is a 'long str";
// Now x: &'short str points to a 'long lifetime — use after free possible

// LIFETIME SUBTYPING: 'long: 'short (long outlives short)
fn first_or<'a, 'b: 'a>(first: &'a str, default: &'b str) -> &'a str {
    if first.is_empty() { default } else { first }
    // 'b: 'a means 'b outlives 'a — safe to return &'a str derived from &'b str
}

// TWO-PHASE BORROWS (NLL): enabled since Rust 2018
// A borrow can start in "reservation" phase (just checking if it's possible)
// and activate only when actually used
// This allows some code patterns that were rejected by lexical lifetime analysis:
let mut v = vec![1, 2, 3];
let first = &v[0];                     // immutable borrow starts
v.push(first.clone());                 // borrow ends (first used here as last use)
// Pre-NLL: this would fail. NLL: fine because `first` not used after push

// REBORROWING: creating shorter-lived borrows from longer-lived ones
fn process(r: &mut Vec<i32>) {
    let shorter: &mut Vec<i32> = &mut *r;  // reborrow — shorter ends before r
    shorter.push(1);
    // r usable again after shorter's last use
}

// BORROWED DATA IN ENUM: Option and the as_ref/as_mut pattern
let opt: Option<String> = Some("hello".to_string());
let r: Option<&String>  = opt.as_ref();   // borrow inner, don't consume Option
let s: Option<&str>     = opt.as_deref(); // &String → &str via Deref
let m: Option<String>   = opt.map(|s| s.to_uppercase());   // consumes opt

// COLLECT INTO VARIOUS TYPES from iterator of Results/Options
// Fail-fast (stops at first error):
let v: Result<Vec<i32>, _> = vec!["1","2","x"].iter().map(|s| s.parse()).collect();
// Flatten errors (Result and Option are both collectable):
let v: Option<Vec<i32>> = vec![Some(1), Some(2), None].into_iter().collect();  // None
let v: Option<Vec<i32>> = vec![Some(1), Some(2)].into_iter().collect();        // Some([1,2])
```

**L3 SIGNAL:** Must explain variance in depth (covariant, invariant, contravariant) and why `&mut T` being invariant in `T` prevents unsoundness. Must know `Pin<T>` and `Unpin` and why futures require pinning. Must explain two-phase borrows and how NLL enables more code patterns. Must know `PhantomData` for lifetime variance annotation on raw pointer structs.

**L3 RED FLAGS:**
- Cannot explain why `&mut T` is invariant in `T`
- Does not know `Pin<T>` — cannot explain why `Future` implementations require it
- Cannot explain `PhantomData<T>` purpose beyond "makes the compiler happy"
- Unaware of two-phase borrows — still uses workarounds from pre-NLL era

---

## 18. Rust Gotcha Cheat Sheet

| Code / Scenario | Result / Behavior | Explanation |
|---|---|---|
| `let s2 = s1;` (String) | `s1` invalid after this line | String is not Copy — ownership moved |
| `255u8 + 1` (debug) | `panic!` at runtime | Overflow panics in debug builds |
| `255u8 + 1` (release) | `0` | Wrapping arithmetic in release builds |
| `let x: i32 = 5; let y: i64 = x;` | Compile error | No implicit numeric widening |
| `let x = 300i32 as u8;` | `44` | `as` truncates: 300 mod 256 = 44 |
| `[1,2,3].into_iter()` (2021) | Yields `i32` values | In 2021 edition, array into_iter yields owned values |
| `[1,2,3].into_iter()` (2018) | Yields `&i32` references | Different behavior by edition — common confusion |
| `f64::NAN == f64::NAN` | `false` | NaN is not equal to itself (IEEE 754) |
| `"Ω".len()` | `2` | Length in bytes, not chars; Ω is 2 UTF-8 bytes |
| `"Ω".chars().count()` | `1` | Length in Unicode scalar values |
| `&"hello"[0..1]` | `"h"` | OK: `h` is 1 byte |
| `&"Ωhello"[0..1]` | `panic!` | Not a valid UTF-8 boundary |
| `let v: Vec<i32> = vec![1,2,3]; let iter = v.iter(); for x in iter {} for x in iter {}` | Compile error on second `for` | Iterator consumed after first use |
| `match opt { Some(x) => ..., _ => ... }` (non-exhaustive) | Warning/no None branch | Prefer explicit `None =>` arm |
| `Vec::sort()` on `Vec<f64>` | Compile error | `f64: !Ord` — use `sort_by(f64::total_cmp)` |
| `Rc<T>` in `thread::spawn` | Compile error | `Rc<T>` is not `Send` |
| `RefCell::borrow_mut()` when already borrowed | `panic!` at runtime | Borrow rules enforced at runtime |
| `std::sync::Mutex` in `async fn` | Deadlock risk | Use `tokio::sync::Mutex` in async context |
| `let s: &str = &String::from("x");` | `s` is dangling | Temporary String dropped at end of statement |
| `#[derive(PartialEq, Eq, PartialOrd, Ord)]` on struct | Lexicographic order by fields | Field order matters for comparison |
| `impl From<A> for B` | Also provides `B::from(a)` AND `a.into():B` | From blanket-impls Into |
| `fn f(s: &String)` | Compiles but anti-idiomatic | Prefer `fn f(s: &str)` — more general |
| Calling `.unwrap()` in tests | OK | But use `?` with `-> Result<(), E>` test return type for better error messages |
| `cargo test` (parallel) | Tests run in parallel by default | Shared resources need `--test-threads=1` or proper isolation |
| `move \|\| data` then `data` | Compile error | `data` moved into closure |
| `for i in 0..n` then `0..=n` | `0..n` is exclusive, `0..=n` is inclusive | Range endpoint inclusion |
| `HashMap` default hasher | SipHash 1-3 | DoS-resistant but slow for integer keys; use `ahash` for non-adversarial |
| `Option<T>` size vs `T` | Same size for pointer types | Null pointer optimization: `Option<Box<T>>` = same size as `Box<T>` |
| `panic!` in `Drop::drop()` | Aborts the process | Already panicking + Drop panics = abort |
| `impl Trait` return type | Opaque type, cannot name it | Use `Box<dyn Trait>` if you need to name/store it |
| `&[T; N]` vs `&[T]` | Array reference vs slice | Coercion is automatic; slices are preferred in function params |

---

## 19. Signal Reference Matrix

| Topic | L1 Junior Signal | L2 Mid Signal | L3 Senior Signal |
|---|---|---|---|
| Ownership / Borrow | Explains move vs copy, fixes borrow errors | NLL, RefCell, Rc/Arc patterns | UnsafeCell, variance, stacked borrows |
| Lifetimes | Reads basic annotations, writes simple ones | Elision rules, struct lifetimes, `'static` meaning | HRTB, variance, PhantomData for raw ptrs |
| Traits | Implements a trait, uses derive | Trait objects vs generics, orphan rule, blanket impls | Object safety, coherence, sealed traits, GATs |
| Generics | Writes bounded generic fn | Associated types vs params, const generics, `?Sized` | Monomorphization cost, specialization limits |
| Error Handling | Uses `?`, knows `unwrap` vs handle | thiserror vs anyhow, `From` impls, error hierarchy | Error size, async error propagation, `catch_unwind` |
| Async/Await | Single await, basic tokio | `join!`, `spawn`, async-aware Mutex | Waker mechanism, Pin, cancel safety, backpressure |
| Concurrency | `Arc<Mutex<T>>`, thread spawn | `Send`/`Sync` reasoning, channels, atomics | Ordering semantics, lock-free DS, Rayon |
| Unsafe | Knows what `unsafe` enables | Raw pointers, transmute alternatives, Miri | Stacked borrows, UnsafeCell, FFI boundaries |
| Performance | `--release`, iterator laziness | Cow, inline hints, capacity pre-alloc | LTO/PGO, cache layout, SIMD, LLVM deopt |
| Type Conversions | `From`/`Into`, `as` truncation | `TryFrom`, `AsRef` vs `Borrow` | Deref coercion chains, unsized coercions |
| Modules/Crates | `mod`, `use`, `pub` | `pub use` re-exports, workspaces, features | Proc macros, build scripts, semver policy |
| Testing | `#[test]`, `assert_eq!`, `cargo test` | Integration tests, mockall, proptest | criterion, loom, fuzzing, snapshot tests |
| Closures | Writes basic closures, knows `move` | `Fn`/`FnMut`/`FnOnce` dispatch, `impl Fn` vs `Box<dyn Fn>` | HRTB, capture disjointness (2021), fn pointer coercion |
| Standard Library | Vec, HashMap, basic iterators | BTreeMap, VecDeque, iterator adaptors, Entry API | Custom hashers, SmallVec, allocation profiling |
| Design Patterns | Builder, newtype | Typestate, RAII guard, extension traits | "Parse don't validate", typed builders, `#[must_use]` |
| Editions | Knows editions exist | Explains 2018 vs 2021 changes | Migration strategy, feature gate history |
| Ecosystem | cargo, serde, tokio basics | sqlx, tracing, clap, axum | cargo-deny, cargo-msrv, tokio-console, PGO |

---

## 20. Red Flag Signals

### L1 Junior Red Flags — disqualifying for any Rust role

1. Cannot explain why `let s2 = s1;` makes `s1` invalid for `String` but not for `i32` — does not understand `Copy` vs move semantics.
2. Uses `.clone()` on everything to avoid borrow checker errors without understanding ownership — "I just clone until it compiles."
3. Does not know `&str` vs `String` — always uses `String` in function parameters, missing deref coercion opportunity.
4. Cannot write a basic `impl Trait for Struct` — does not understand the trait system at all.
5. Uses `as` for all numeric conversions without knowing it can truncate silently.
6. Confuses `Rc` and `Arc` — does not know `Rc` is single-threaded only.
7. Does not write tests — or writes only `println!` assertions.
8. Cannot pattern-match an enum — uses `if let` for every arm without knowing exhaustive `match`.
9. Does not know `cargo clippy` or `cargo fmt` exist.
10. Calls `.unwrap()` on everything in production code — no concept of error propagation.

### L2 Mid Red Flags — concern signals for independent contributor role

1. Cannot explain the difference between `Fn`, `FnMut`, and `FnOnce` — writes `Box<dyn Fn>` for all closure storage without understanding the dispatch cost.
2. Uses `std::sync::Mutex` inside `async fn` without understanding it can deadlock the async runtime (should use `tokio::sync::Mutex`).
3. Implements both `From<A> for B` and `Into<B> for A` manually — does not know the blanket impl.
4. Cannot explain the orphan rule — does not know why `impl Display for Vec<T>` is illegal.
5. Uses `dyn Trait` everywhere when generics would give zero-cost static dispatch — does not understand the performance difference.
6. Writes `fn f(s: &String)` instead of `fn f(s: &str)` — does not leverage deref coercion for ergonomic APIs.
7. Cannot write a lifetime-annotated struct — does not understand why `struct Foo { s: &str }` fails.
8. Does not know `HashMap::entry()` API — uses `contains_key` + `insert` (two lookups).
9. Does not pre-allocate `Vec::with_capacity()` when processing known-size data.
10. Cannot distinguish when to use `thiserror` (libraries) vs `anyhow` (applications).

### L3 Senior Red Flags — disqualifying for system design / senior role

1. Cannot explain `Send` and `Sync` — cannot reason about why certain types are not thread-safe without trial-and-error compilation.
2. Does not know `Pin<T>` — cannot explain why `Future` impls require pinning or what self-referential structs have to do with it.
3. Uses `unsafe` blocks without documenting the safety invariant — "I know it works" is not a safety argument.
4. Cannot explain monomorphization cost — does not know when to prefer `dyn Trait` over generics to reduce binary size.
5. Cannot reason about memory ordering for atomics — uses `SeqCst` everywhere "to be safe" without understanding the performance penalty or when weaker orderings suffice.
6. Unaware of `Miri` for detecting UB in `unsafe` code — no methodology for verifying unsafe code correctness.
7. Designs all APIs without `#[must_use]` on `Result` return types — silently discarded errors are a class of production bugs.
8. Cannot explain the difference between `Borrow<T>` and `AsRef<T>` — does not know why `HashMap` requires `Borrow` for lookups.
9. Reaches for `Box<dyn Error>` in library public APIs — prevents callers from matching on specific error variants.
10. Cannot discuss trade-offs between `tokio`, `async-std`, and `rayon` for different concurrency patterns — treats "async" as a single concept.

---

## 21. Senior Differentiator Questions with Expected Answer Outlines

### Question 1: Ownership and API Design
> "You're designing a Rust library for processing large CSV files. A user calls `reader.records()` which returns an iterator. Should the iterator yield `Record` (owned) or `&Record` (borrowed)? Walk through the trade-offs."

**Strong answer covers:**
- Owned: simpler lifetimes, user can store records freely, but allocates per record — bad for high-throughput parsing where most records are discarded
- Borrowed: zero-allocation fast path, but tied to the reader's lifetime — user cannot store records without cloning, creates lifetime complexity
- The real solution: `Cow<Record>` or a streaming API where the iterator borrows from a buffer reused per record (the `csv` crate's approach — yields `StringRecord` which reuses internal allocation via `&mut self` in `read_record`)
- Mention: GATs would allow `type Item<'a> where Self: 'a` in a custom `LendingIterator` trait — yields references tied to `&'a self` without owned allocation
- Weak answer: picks one without trade-off reasoning, unaware of lending iterator pattern

**Weak answer:** "Just use owned, simpler API."

---

### Question 2: Concurrency Model Selection
> "You need to build a service that: (1) handles 10,000 concurrent HTTP connections, (2) occasionally runs a 500ms CPU-bound computation per request, (3) queries a PostgreSQL database. What concurrency primitives and crates would you use, and what are the pitfalls?"

**Strong answer covers:**
- Async runtime (tokio) for HTTP connections — I/O-bound work, many concurrent futures, few OS threads
- `tokio::task::spawn_blocking` for the 500ms CPU computation — running blocking/CPU work directly in async starves the runtime's I/O polling; spawn_blocking moves it to a dedicated thread pool
- `sqlx` for async PostgreSQL — `diesel` would require `spawn_blocking` for every query
- Connection pool (`sqlx::Pool`) to limit DB connections (PostgreSQL default is 100 — 10k tasks trying to connect would be refused)
- Pitfalls: blocking `std::sync::Mutex` in async (use `tokio::sync::Mutex`), not handling `JoinHandle` errors from spawn, backpressure (bounded channels to avoid memory growth), graceful shutdown

**Weak answer:** "Use tokio for everything." No mention of blocking work, no mention of connection pooling.

---

### Question 3: Unsafe and Soundness
> "A colleague writes an unsafe abstraction: a `Ring<T>` circular buffer with raw pointer arithmetic. They say 'it passes all tests and Miri found no issues.' What would you look for in a code review to verify it's actually sound?"

**Strong answer covers:**
- Safety documentation: every `unsafe` block must document which invariant makes it safe
- Aliasing rules: `&mut T` must not alias any other reference — raw pointers in circular buffer can easily violate this if not carefully managed
- Send/Sync: is `Ring<T>: Send` correct? Only if `T: Send`. `Ring<T>: Sync`? Only if `T: Sync`. These need manual `unsafe impl` if the struct contains raw pointers (raw pointers are neither Send nor Sync by default)
- Uninitialized memory: `MaybeUninit<T>` should be used for uninitialized slots — reading uninitialized `T` is UB even with raw pointers
- Drop semantics: when Ring is dropped, it must drop all initialized elements — `Drop` impl must track which slots are initialized
- Stacked borrows: Miri may not catch all patterns — mention running with `-Zmiri-tag-raw-pointers`
- Panic safety: if `T::drop()` panics while Ring is being dropped, are we in a consistent state?

**Weak answer:** "Looks fine if tests pass and Miri is happy."

---

### Question 4: Lifetime and Borrow Design
> "You're implementing a cache that stores borrowed string keys and owned values. The signature starts as `struct Cache<'a> { data: HashMap<&'a str, Value> }`. A user wants to insert keys that come from a `String` they own. Why is this a design dead-end, and how would you fix it?"

**Strong answer covers:**
- `&'a str` requires the string data to outlive `'a` — if the key comes from a user-owned `String`, the cache's lifetime is tied to that String's lifetime — cannot move or drop the String while the cache lives
- Fix 1: `HashMap<String, Value>` — own the keys, clone on insert. Simple, correct, slightly more allocation
- Fix 2: `HashMap<Arc<str>, Value>` — shared ownership, cheap clone (atomic refcount increment), keys can be shared between cache and caller
- Fix 3: `HashMap<Box<str>, Value>` — owned, no excess capacity (unlike String), slightly more compact
- Fix 4: `entry_ref` (nightly) or the `hashbrown` raw entry API — insert with `&str`, store as `String` without double-hash
- Mention `Cow<'a, str>` for the "sometimes borrowed, sometimes owned" case
- Mention `indexmap::IndexMap` if insertion-order iteration is needed

**Weak answer:** "Use `HashMap<String, Value>` and clone." Correct endpoint but no reasoning about the trade-offs.

---

### Question 5: Performance and Architecture
> "A Rust HTTP service is seeing P99 latency spikes of 50ms in an otherwise 2ms service. GC is not the cause (no GC in Rust). Walk me through diagnosing this systematically."

**Strong answer covers:**
- Async runtime contention: tasks blocked on `std::sync::Mutex` (blocking) starve tokio's thread pool — check with `tokio-console` for tasks in blocked state
- Slow blocking I/O on the async thread pool: check if any sync file I/O, CPU-bound computation, or blocking `sleep` runs directly in async context
- Lock contention: a heavily contended `Mutex<HashMap>` serializes all requests — replace with `DashMap` (sharded concurrent hashmap) or RwLock for read-heavy workloads
- Allocation pressure: `cargo-flamegraph` or `perf` to find hot allocation paths — excessive `String` cloning, `Vec` resizing in hot path
- Syscall amplification: too many small writes to socket — check if response is being written in fragments (enable `TCP_NODELAY` or use `BufWriter`)
- Connection pool exhaustion: all requests waiting for DB connection — check sqlx pool size vs concurrent request rate
- Cold start / first-request penalty: JIT-like effects from OS page faults on first access after deployment
- Tail latency from GC in dependencies: even Rust can call into C libraries with GC (e.g., certain database drivers)
- Use `cargo flamegraph` for CPU profiling, `tokio-console` for async runtime inspection, `dhat-rs` for allocation profiling

**Weak answer:** "Add more logging and see what's slow." No systematic methodology.

---

## 22. Rust-Specific: ABI Stability and FFI

### Mechanics

Rust does not have a stable ABI for its compiled types. Every Rust release is free to change struct layout, calling convention, and symbol mangling. This has production consequences for: dynamic libraries, plugin systems, and C FFI.

```rust
// C-COMPATIBLE TYPES: #[repr(C)] gives predictable layout
#[repr(C)]
struct Point { x: f64, y: f64 }  // layout matches C struct { double x; double y; }

// #[repr(transparent)]: single-field wrapper with same ABI as the inner type
#[repr(transparent)]
struct UserId(u64);   // identical ABI to u64 — safe to transmute or pass to C

// EXPORTING RUST FUNCTIONS TO C
#[no_mangle]              // keep the symbol name (no Rust name mangling)
pub extern "C" fn add(a: i32, b: i32) -> i32 { a + b }

// IMPORTING C FUNCTIONS INTO RUST
extern "C" {
    fn c_function(x: i32) -> i32;
    fn c_puts(s: *const std::os::raw::c_char) -> i32;
}
unsafe { c_function(42); }

// CBINDGEN: generate C headers from Rust public API (cargo install cbindgen)
// BINDGEN: generate Rust bindings from C headers (cargo install bindgen)

// DYNAMIC LIBRARY CONCERNS (e.g., Rust dylib plugins):
// - No stable Rust ABI: recompile plugin and host together on every release
// - Use C ABI (extern "C") at the boundary for stable interface
// - Consider: abi_stable crate for stable-ish Rust ABI (limited to a defined subset)

// NULL POINTER OPTIMIZATION: Option<Box<T>> = same size as *mut T
// Some(Box::new(x)) has same representation as non-null pointer
// None has same representation as null pointer
// FFI can use Option<Box<T>> where C expects nullable pointer:
extern "C" fn callback_fn(data: Option<Box<UserData>>) { ... }

// HANDLING PANICS ACROSS FFI: panicking through extern "C" is UB
// Always catch panics at the FFI boundary:
#[no_mangle]
pub extern "C" fn safe_entry(x: i32) -> i32 {
    let result = std::panic::catch_unwind(|| { rust_fn(x) });
    match result {
        Ok(v)  => v,
        Err(_) => -1,  // convert panic to error code
    }
}
```

---

## 23. Rust-Specific: The Borrow Checker Mental Model

### Mechanics

The borrow checker enforces three rules simultaneously. Understanding its decision procedure is essential for designing APIs and debugging lifetime errors.

```rust
// THE THREE RULES THE BORROW CHECKER ENFORCES:
// 1. Every reference must be valid (no dangling pointers)
// 2. At any time: EITHER one &mut T OR any number of &T (not both)
// 3. No reference outlives its data

// RULE 2 IMPLICATION: split borrows
// The borrow checker is field-aware — can borrow different fields simultaneously
struct Point { x: f64, y: f64 }
let mut p = Point { x: 1.0, y: 2.0 };
let rx = &mut p.x;   // mutable borrow of p.x
let ry = &mut p.y;   // OK: different field — borrow checker knows they don't overlap
// *rx and *ry can be used simultaneously — borrow is on the field, not the struct

// RULE 2 VIOLATION: borrow checker is method-opaque
impl Point {
    fn get_x_mut(&mut self) -> &mut f64 { &mut self.x }
    fn get_y(&self)          -> f64      { self.y }
}
// Cannot call get_x_mut() and then get_y() on the same Point simultaneously
// Even though they access different fields — the borrow checker only sees &mut self and &self

// This is why many Rust APIs take a single &mut self and return split borrows,
// or split the struct into sub-structs

// SPLITTING BORROWS via tuples or separate types
struct PointParts<'a> { x: &'a mut f64, y: &'a mut f64 }
impl Point {
    fn parts_mut(&mut self) -> PointParts<'_> {
        PointParts { x: &mut self.x, y: &mut self.y }
    }
}
let parts = p.parts_mut();
*parts.x += 1.0;
*parts.y += 2.0;   // both usable simultaneously via split struct

// BORROW CHECKER AND LOOPS: a common confusion point
let mut v = vec![1, 2, 3];
// FAILS: iterating and modifying simultaneously
// for x in &v { v.push(*x); }  // immutable borrow (iter) + mutable borrow (push)

// FIX: collect indices or use index-based loop
let len = v.len();
for i in 0..len { v.push(v[i]); }  // v[i] borrows temporarily, then push

// Or: operate on a separate collection
let additions: Vec<i32> = v.iter().copied().collect();
v.extend(additions);

// ENTRY API: designed specifically to avoid "look up then modify" borrow conflicts
// The "check then insert" pattern is not just an efficiency issue — it's often
// required because the check (immutable borrow) and the insert (mutable borrow)
// cannot coexist even though they happen "sequentially"
```

---

## 24. Rust-Specific: CPython Extension / WebAssembly Integration

```rust
// WEBASSEMBLY with wasm-bindgen
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0, 1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2)
    }
}

#[wasm_bindgen]
pub struct Counter { count: i32 }
#[wasm_bindgen]
impl Counter {
    pub fn new()        -> Counter  { Counter { count: 0 } }
    pub fn increment(&mut self)     { self.count += 1; }
    pub fn value(&self) -> i32      { self.count }
}

// Calling JavaScript from Rust:
#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// wasm-pack: build tool for Rust → WASM → npm package
// wasm-pack build --target web     → ES module for browser
// wasm-pack build --target nodejs  → CommonJS for Node.js
// wasm-pack build --target bundler → for webpack/rollup

// WASM SIZE OPTIMIZATION
// wasm-opt (binaryen) post-processes WASM for size: wasm-opt -Oz
// twiggy: size profiler for WASM binaries
// Avoid panic infrastructure: use panic = "abort" in Cargo.toml for wasm target
```

---

*End of Rust Technical Interviewer Knowledge Base — optimized for semantic chunking on `##` section boundaries. Document covers Rust 1.0 through 1.82+, all 20 mandatory sections plus 4 Rust-specific sections (ABI/FFI, borrow checker model, WASM, unsafe taxonomy).*