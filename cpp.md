# C++ RAG Knowledge Base
## Three-Level Contextual Model for AI Technical Interviewing

**Document Purpose:** Dense knowledge dump for RAG ingestion by an AI technical interviewer. Every section is tagged with seniority signals (L1=Junior, L2=Mid, L3=Senior). This is not a tutorial — it is a structured signal reference for assessing candidate depth.

**Seniority Model:**
- **L1 Junior** — works under guidance, day-scoped tasks, follows patterns: *"I implemented the feature as instructed"*
- **L2 Mid** — works independently, week/month-scoped tasks: *"I chose RAII here for exception safety"*
- **L3 Senior** — takes ambiguous requirements, system-wide impact: *"We should avoid this; it causes ABI breakage and the cache miss pattern kills throughput"*

**C++ Standard Coverage:** C++11, C++14, C++17, C++20, C++23 — all features tagged by standard.

---

# SECTION 1: Fundamental Types, Type System, and Initialization

## 1.1 Fundamental Types and Sizes

C++ fundamental types have implementation-defined sizes — the standard only guarantees minimums. This is a critical difference from Java/C# and a major source of portability bugs.

```cpp
// Integer types — sizes are implementation-defined (these are typical on 64-bit)
bool        // 1 byte (true/false)
char        // 1 byte — signed or unsigned, implementation-defined
signed char // 1 byte — explicitly signed
unsigned char // 1 byte — explicitly unsigned, safe for raw bytes
short       // ≥ 2 bytes (typically 2)
int         // ≥ 2 bytes (typically 4)
long        // ≥ 4 bytes (4 on Windows 64-bit, 8 on Linux/macOS 64-bit)
long long   // ≥ 8 bytes (C++11)

// Use fixed-width types for portability (cstdint)
#include <cstdint>
int8_t    int16_t    int32_t    int64_t     // signed
uint8_t   uint16_t   uint32_t   uint64_t    // unsigned
int_fast8_t   // fastest type with at least 8 bits
int_least8_t  // smallest type with at least 8 bits
intptr_t      // integer large enough to hold a pointer
ptrdiff_t     // signed, for pointer differences
size_t        // unsigned, result of sizeof, array sizes, STL sizes

// Floating point (IEEE 754)
float        // 32-bit, ~7 decimal digits precision
double       // 64-bit, ~15 decimal digits precision
long double  // 80-bit or 128-bit, implementation-defined

// Character types
char     // used for both characters and raw bytes
wchar_t  // wide char, 2 or 4 bytes (implementation-defined, avoid for portability)
char8_t  // C++20, for UTF-8 (underlying type: unsigned char)
char16_t // C++11, for UTF-16
char32_t // C++11, for UTF-32

// Void and nullptr
void           // no type — used for functions returning nothing, void* raw pointers
nullptr_t      // type of nullptr (C++11)
nullptr        // null pointer constant — type-safe, not integer 0 or (void*)0
NULL           // C-style, typically #define NULL 0 — avoid in C++, use nullptr

// Checking sizes at compile time
static_assert(sizeof(int) == 4, "Expected 32-bit int");
static_assert(sizeof(void*) == 8, "Expected 64-bit pointers");

// Numeric limits
#include <limits>
std::numeric_limits<int>::max()        // 2147483647
std::numeric_limits<int>::min()        // -2147483648
std::numeric_limits<double>::epsilon() // smallest difference from 1.0
std::numeric_limits<float>::infinity() // +infinity
std::numeric_limits<int>::is_signed    // true
```

**L1 SIGNAL:** Junior must know: `int` is not guaranteed 32-bit, `sizeof(int) != sizeof(long)` on all platforms. Must use `int32_t` when exact size matters. Must know `nullptr` is preferred over `NULL` in modern C++. Must understand `signed` vs `unsigned` and the overflow behavior of each.

**L1 RED FLAG:** Uses `int` everywhere without considering overflow or portability. Doesn't know `sizeof(char) == 1` by definition. Confuses `NULL` and `nullptr`.

---

## 1.2 Initialization Forms — The Most Important C++ Gotcha

C++ has multiple initialization syntaxes with different semantics. Choosing incorrectly causes subtle bugs.

```cpp
// C++11 and later: prefer brace initialization (uniform initialization)
int a = 5;       // copy initialization
int b(5);        // direct initialization
int c{5};        // brace (list) initialization — C++11, PREFERRED
int d = {5};     // copy list initialization

// Why brace initialization is preferred:
// 1. Prevents narrowing conversions (compile error, not silent truncation)
int x = 3.14;    // OK, silently truncates to 3 (BAD)
int y{3.14};     // ERROR: narrowing conversion not allowed (GOOD)
int z(3.14);     // OK, silently truncates to 3 (BAD)

// 2. Consistent syntax for all types
std::vector<int> v1(3, 0);   // 3 elements, each 0
std::vector<int> v2{3, 0};   // 2 elements: 3 and 0 (uses initializer_list ctor!)
// This is a famous gotcha with std::vector

// 3. Value initialization
int a1{};        // 0  (value-initialized)
int a2 = {};     // 0  (value-initialized)
int a3();        // Most Vexing Parse! Declares a FUNCTION, not a variable
int a4;          // uninitialized (undefined behavior to read)

// Most Vexing Parse
std::string s1();        // Declares function s1() returning string — NOT a string!
std::string s2{};        // Default-constructed string — correct
std::string s3("");      // Also correct
Widget w1(Widget());     // Declares function, not Widget! 
Widget w2{Widget()};     // Creates Widget — correct

// Default member initialization (C++11)
struct Config {
    int timeout{5000};           // 5 seconds default
    std::string host{"localhost"};
    bool debug{false};
    double rate = 1.0;           // also valid for default member init
};

// const and constexpr initialization
const int SIZE = 100;           // runtime const (can be non-literal)
constexpr int BUFSIZE = 1024;   // compile-time constant — must be literal or constexpr expr
constexpr double PI = 3.14159265358979;

// Structured bindings (C++17)
std::pair<int, std::string> p = {1, "hello"};
auto [id, name] = p;   // structured binding

std::map<std::string, int> m = {{"a", 1}, {"b", 2}};
for (auto& [key, val] : m) {
    // key is const std::string&, val is int&
}

// auto type deduction
auto i = 42;          // int
auto d = 3.14;        // double
auto s = "hello";     // const char* (NOT std::string!)
auto str = std::string{"hello"};  // std::string

// auto with references
int x = 10;
auto  a = x;    // int (copy)
auto& b = x;    // int& (reference)
auto* c = &x;   // int* (pointer)
const auto& d2 = x;  // const int& (const reference)
```

**L2 SIGNAL:** Mid must explain the Most Vexing Parse, the `vector{3,0}` vs `vector(3,0)` distinction, and when `auto` deduces incorrectly (string literals become `const char*`). Must know `constexpr` vs `const` — `constexpr` guarantees compile-time evaluation, `const` doesn't.

---

## 1.3 Type Casting — The Four C++ Casts

```cpp
// 1. static_cast — compile-time checked, explicit type conversion
int i = 42;
double d = static_cast<double>(i);       // int → double
int j = static_cast<int>(3.99);          // double → int, truncates (not rounds)
Base* bp = static_cast<Base*>(derived_ptr);  // upcast, safe
// Derived* dp = static_cast<Derived*>(base_ptr);  // downcast, UNSAFE if wrong type

// 2. dynamic_cast — runtime checked, for polymorphic types only (virtual function required)
// Returns nullptr for pointer, throws std::bad_cast for reference on failure
Base* bp = getBase();
if (Derived* dp = dynamic_cast<Derived*>(bp)) {
    dp->derivedMethod();   // safe, bp actually points to Derived
} // else: dp is nullptr, bp was not a Derived

// dynamic_cast is slow (RTTI lookup). Avoid in hot paths.
// If you know the type at compile time, use static_cast

// 3. const_cast — remove or add const/volatile
const int ci = 42;
int* p = const_cast<int*>(&ci);  // LEGAL, but writing via p is UB if ci was originally const
// Legitimate use: call legacy API that takes non-const but doesn't modify
void legacyAPI(char* s);
const char* cs = "hello";
legacyAPI(const_cast<char*>(cs));   // OK if legacyAPI doesn't modify

// 4. reinterpret_cast — raw bit reinterpretation, implementation-defined
// Violates type aliasing rules if misused — source of hard bugs
int n = 0x41424344;
char* cp = reinterpret_cast<char*>(&n);   // read bytes of int
// Correct use: hardware register access, serialization, type punning via memcpy
uintptr_t addr = reinterpret_cast<uintptr_t>(&n);  // pointer to integer

// Type punning CORRECTLY (without UB via reinterpret_cast)
float f = 3.14f;
uint32_t bits;
std::memcpy(&bits, &f, sizeof(f));   // defined behavior
// Or use std::bit_cast (C++20) — cleaner
uint32_t bits2 = std::bit_cast<uint32_t>(f);   // C++20

// C-style cast — avoid in C++, does any of the 4 above in order
int* p2 = (int*)voidPtr;   // could be static, reinterpret, or const cast — ambiguous
// Use named casts — they make intent explicit and are greppable
```

**L3 SIGNAL:** Senior must know: (1) `dynamic_cast` requires at least one virtual function in the base class (RTTI enabled). (2) `const_cast` writing through pointer to originally-const object is undefined behavior. (3) `reinterpret_cast` for type punning violates strict aliasing rules (UB) — use `memcpy` or `std::bit_cast` (C++20). (4) C-style casts bypass C++ type system — ban them in codebases via `-Wold-style-cast` compiler warning.

---

# SECTION 2: Memory Management — Stack, Heap, RAII, Smart Pointers

## 2.1 Stack vs Heap — The Fundamental Model

```cpp
// STACK: automatic storage duration
// - Allocation/deallocation: O(1), just adjust stack pointer
// - Size limited (typically 1-8MB)
// - Lifetime: tied to scope
// - Access: fast (likely in cache)
void stackExample() {
    int x = 42;              // on stack
    double arr[100];         // 800 bytes on stack
    std::string s{"hello"};  // object on stack (but may heap-allocate internally)
}   // x, arr, s automatically destroyed here

// HEAP: dynamic storage duration
// - Allocation: slower, managed by allocator (glibc malloc, tcmalloc, jemalloc)
// - Size: limited by available memory
// - Lifetime: manual (or smart pointer managed)
// - Fragmentation: concern for long-running programs
void heapExample() {
    int* p = new int{42};         // allocate on heap
    int* arr = new int[100]{};    // array allocation, zero-initialized
    
    // Must free — failure is memory leak
    delete p;           // single object
    delete[] arr;       // array — MUST use delete[], not delete (UB otherwise)
    
    p = nullptr;        // good practice, prevent use-after-free via dangling pointer
    arr = nullptr;
}

// new vs malloc:
// new: type-safe, calls constructor, throws std::bad_alloc on failure
// malloc: returns void*, no constructor call, returns nullptr on failure
// NEVER mix: don't free(new'd ptr), don't delete(malloc'd ptr)

// Placement new — construct in pre-allocated memory
alignas(MyClass) unsigned char buf[sizeof(MyClass)];
MyClass* obj = new(buf) MyClass{arg1, arg2};  // construct in buf
obj->~MyClass();  // must manually call destructor

// nothrow new
int* p = new(std::nothrow) int{42};
if (!p) { /* handle allocation failure */ }
```

## 2.2 RAII — Resource Acquisition Is Initialization

RAII is the most important C++ idiom. It ties resource lifetime to object lifetime, guaranteeing cleanup even in the presence of exceptions.

```cpp
// Without RAII — fragile, leak on exception
void withoutRAII() {
    FILE* f = fopen("data.txt", "r");
    // ... if exception thrown here, f leaks ...
    fclose(f);   // might never run
}

// With RAII — exception-safe by design
class FileHandle {
    FILE* file_;
public:
    explicit FileHandle(const char* path, const char* mode)
        : file_{fopen(path, mode)} {
        if (!file_) throw std::runtime_error(std::string("Cannot open: ") + path);
    }
    ~FileHandle() { if (file_) fclose(file_); }   // always runs (even during stack unwind)

    // Non-copyable (owns resource)
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;

    // Movable
    FileHandle(FileHandle&& o) noexcept : file_{std::exchange(o.file_, nullptr)} {}
    FileHandle& operator=(FileHandle&& o) noexcept {
        if (this != &o) { fclose(file_); file_ = std::exchange(o.file_, nullptr); }
        return *this;
    }

    FILE* get() const { return file_; }
    // operator bool, etc.
};

void withRAII() {
    FileHandle f{"data.txt", "r"};  // acquires in constructor
    processFile(f.get());
}  // FileHandle destructor always called, file always closed

// RAII for mutexes
void threadSafe() {
    std::mutex mtx;
    {
        std::lock_guard<std::mutex> lock{mtx};  // acquires mutex
        // critical section
    }  // lock_guard destructor releases mutex — even if exception thrown
}

// RAII for any resource via scope_exit (C++23 or custom)
template<typename F>
class ScopeExit {
    F f_;
    bool active_{true};
public:
    explicit ScopeExit(F f) : f_{std::move(f)} {}
    ~ScopeExit() { if (active_) f_(); }
    void release() { active_ = false; }  // cancel cleanup
};

void apiExample() {
    initializeResource();
    auto cleanup = ScopeExit{[] { cleanupResource(); }};
    // ... code that might throw ...
    // cleanup always runs
}
```

## 2.3 Smart Pointers — The Modern Memory Model

```cpp
#include <memory>

// unique_ptr: sole ownership, zero overhead vs raw pointer
// When to use: single owner, replacing new/delete
{
    auto p = std::make_unique<MyClass>(arg1, arg2);  // preferred over new
    // p owns the object exclusively
    p->method();
    (*p).field = 42;
    
    // Transfer ownership (move only, not copyable)
    auto p2 = std::move(p);   // p is now nullptr, p2 owns it
    // p is nullptr here — safe to check
    
}  // p2 destructor called, MyClass destructor runs, memory freed

// unique_ptr with custom deleter (for C APIs, arrays)
auto filePtr = std::unique_ptr<FILE, decltype(&fclose)>{fopen("f.txt","r"), fclose};
auto arrPtr  = std::make_unique<int[]>(100);   // array unique_ptr (no custom deleter needed)

// shared_ptr: shared ownership via reference counting
// When to use: shared ownership, observer pattern, shared caches
{
    auto sp1 = std::make_shared<MyClass>();   // ref count = 1
    {
        auto sp2 = sp1;   // ref count = 2 (copy increases count)
        // sp2 goes out of scope → ref count = 1
    }
    // sp1 goes out of scope → ref count = 0 → MyClass destroyed
}

// shared_ptr cost: TWO heap allocations without make_shared (object + control block)
// make_shared: ONE heap allocation (object and control block together)
auto bad  = std::shared_ptr<MyClass>{new MyClass{}};  // 2 allocations
auto good = std::make_shared<MyClass>();               // 1 allocation

// shared_ptr overhead: atomic ref count operations (~CPU lock prefix)
// Avoid copying shared_ptr in hot paths — pass by const reference

// weak_ptr: non-owning observer, breaks circular references
// When to use: cache, observer that shouldn't extend lifetime, break shared_ptr cycles

class Node {
    std::weak_ptr<Node> parent_;   // weak to break cycle (NOT shared_ptr — would cycle)
    std::vector<std::shared_ptr<Node>> children_;
public:
    void setParent(std::shared_ptr<Node> p) { parent_ = p; }
    std::shared_ptr<Node> getParent() {
        return parent_.lock();   // returns shared_ptr (empty if expired)
    }
};

// Checking weak_ptr validity
std::weak_ptr<MyClass> wp = sp;
if (auto locked = wp.lock()) {
    locked->method();   // safe to use
} else {
    // object was destroyed
}

// NEVER: raw pointer from shared_ptr, pass to another shared_ptr
// std::shared_ptr<T> p2{sp.get()};  // DOUBLE FREE — two shared_ptrs each think they own it

// enable_shared_from_this — get shared_ptr from within the object
class Session : public std::enable_shared_from_this<Session> {
public:
    void asyncOp() {
        auto self = shared_from_this();  // keeps Session alive during async op
        doAsync([self]() { self->onComplete(); });
    }
};

// Ownership rule of thumb:
// unique_ptr: one owner (most common for heap objects)
// shared_ptr: multiple owners, lifetime unclear
// weak_ptr: observer, no ownership
// raw pointer: non-owning observer, performance-critical code, never the only reference
// reference: non-owning, must be valid, most common parameter/return type
```

**L2 SIGNAL:** Mid must explain: (1) `make_shared` vs `shared_ptr{new T}` (single vs double allocation). (2) `weak_ptr` to break shared_ptr cycles. (3) When NOT to use `shared_ptr` (single ownership → `unique_ptr`, stack object → no smart pointer). (4) `enable_shared_from_this` pattern and why `shared_ptr<T>(this)` in a member function is double-free UB.

**L3 SIGNAL:** Senior must discuss: (1) Atomic ref count in `shared_ptr` — each copy/destroy is a `std::atomic` operation, causing cache-line bouncing in multi-threaded scenarios with many threads sharing the same `shared_ptr`. (2) Custom allocators for `std::allocate_shared`. (3) The difference between `deleter` types and how they interact with the control block. (4) `shared_ptr<void>` as a type-erased owning handle. (5) Why `unique_ptr` has zero overhead but `shared_ptr` doesn't — and the ABI implications of `shared_ptr` in public interfaces.

---

## 2.4 Common Memory Bugs

```cpp
// BUG 1: Use after free (dangling pointer)
int* p = new int{42};
delete p;
*p = 10;     // UB: use after free
int x = *p;  // UB: read freed memory

// BUG 2: Double free
int* p2 = new int{42};
delete p2;
delete p2;   // UB: double free — crash or heap corruption

// BUG 3: Array/scalar mismatch
int* arr = new int[10];
delete arr;    // UB: should be delete[]
int* obj = new int{5};
delete[] obj;  // UB: should be delete

// BUG 4: Buffer overflow
int arr2[5];
arr2[5] = 1;   // UB: out of bounds write
arr2[-1] = 1;  // UB: out of bounds write
// C++ does NOT bounds-check [] on raw arrays or std::vector in release mode
// Use arr.at(5) for bounds-checked access (throws std::out_of_range)

// BUG 5: Uninitialized read
int x2;
std::cout << x2;   // UB: indeterminate value (could print anything)

// BUG 6: Stack overflow via large local array
void badStack() {
    int hugeArray[10'000'000];   // 40MB on stack — stack overflow
}

// BUG 7: Return pointer/reference to local
int* dangling() {
    int local = 42;
    return &local;   // UB: local destroyed, pointer dangles
}

// Detecting memory bugs:
// AddressSanitizer (ASan): -fsanitize=address (detects use-after-free, buffer overflow, leaks)
// Valgrind: slower but thorough leak detection
// UBSan: -fsanitize=undefined (detects undefined behavior)
// MemorySanitizer (MSan): -fsanitize=memory (detects uninitialized reads)
```

---

# SECTION 3: Pointers, References, and Value Categories

## 3.1 Pointers vs References

```cpp
// REFERENCES: aliases for existing objects
// - Cannot be null
// - Cannot be rebound (always refer to same object)
// - No pointer arithmetic
// - Syntactically transparent (no * or -> needed)
int x = 10;
int& ref = x;    // ref is an alias for x
ref = 20;        // modifies x through ref
// int& badRef;  // ERROR: reference must be initialized
// int& nullRef = nullptr;  // ERROR: cannot bind reference to nullptr

// POINTERS: store address of an object
// - Can be null
// - Can be rebound
// - Pointer arithmetic allowed
// - Must dereference with * or ->
int* ptr = &x;   // ptr holds address of x
*ptr = 30;       // modifies x through ptr
ptr = nullptr;   // ptr no longer points to x
ptr = &y;        // ptr now points to y (rebinding)

// Const correctness — critical for API design
const int ci = 42;
const int* p1 = &ci;     // pointer to const int: can't modify *p1, can rebind p1
int* const p2 = &x;      // const pointer to int: can modify *p2, can't rebind p2
const int* const p3 = &ci; // const pointer to const int: neither

// Reading from right to left:
// "p3 is a const pointer to a const int"

// Reference to const — extends lifetime of temporaries
const std::string& s = std::string{"hello"};  // temporary lifetime extended to s's scope
// std::string& bad = std::string{"hello"};   // ERROR (non-const ref to temporary)

// Pointer arithmetic (raw arrays only)
int arr[5] = {1, 2, 3, 4, 5};
int* p = arr;    // arr decays to pointer to first element
*(p + 2) = 99;  // arr[2] = 99
p++;             // p now points to arr[1]
// Arithmetic on pointer past arr+5 (one-past-end) is UB

// Function pointers
int add(int a, int b) { return a + b; }
int (*fp)(int, int) = add;  // function pointer
fp(1, 2);    // 3

// Prefer std::function for type-erased callable (but has overhead)
std::function<int(int,int)> f = add;
f(1, 2);   // 3

// or templates for zero-overhead
template<typename F>
void apply(F func, int a, int b) { return func(a, b); }
```

## 3.2 Value Categories — lvalue, rvalue, xvalue

Understanding value categories is essential to understand move semantics.

```cpp
// lvalue: has identity, can take address, persists beyond expression
int x = 10;      // x is lvalue
int* p = &x;     // can take address of lvalue

// rvalue: temporary, no persistent identity, cannot take address  
int y = x + 1;   // (x + 1) is rvalue (prvalue actually)
// int* p2 = &(x + 1);  // ERROR: cannot take address of rvalue

// lvalue reference: binds to lvalues
int& lref = x;      // OK, x is lvalue
// int& bad = 42;   // ERROR: cannot bind lvalue ref to rvalue

// rvalue reference (C++11): binds to rvalues
int&& rref = 42;    // OK, 42 is rvalue
int&& rref2 = x + 1;  // OK, (x+1) is rvalue

// Identifying value categories:
// lvalue: named variable, *ptr, array subscript, function returning lvalue ref
// prvalue: literal, arithmetic expression, function returning non-ref
// xvalue: std::move(x), function returning rvalue ref, cast to rvalue ref

// std::move: cast to rvalue reference (doesn't actually move!)
int&& r = std::move(x);  // x is now an xvalue (safe to steal from)
// After std::move(x), x is in valid but unspecified state — don't use without reassigning

// std::forward: preserve value category (for perfect forwarding in templates)
template<typename T>
void wrapper(T&& arg) {
    downstream(std::forward<T>(arg));  // forwards as lvalue if T is lvalue ref, rvalue otherwise
}
```

## 3.3 Move Semantics — The C++11 Revolution

```cpp
// Without move semantics: copying is expensive for heap-owning types
// With move semantics: steal resources from temporaries in O(1)

class Buffer {
    std::unique_ptr<char[]> data_;
    size_t size_;

public:
    // Constructor
    explicit Buffer(size_t size) 
        : data_{std::make_unique<char[]>(size)}, size_{size} {}

    // Copy constructor: expensive (allocate + copy)
    Buffer(const Buffer& other) 
        : data_{std::make_unique<char[]>(other.size_)}, size_{other.size_} {
        std::memcpy(data_.get(), other.data_.get(), size_);
    }

    // Move constructor: cheap (steal pointer, O(1))
    Buffer(Buffer&& other) noexcept  // noexcept is CRITICAL for STL optimization
        : data_{std::move(other.data_)}, size_{std::exchange(other.size_, 0)} {}

    // Copy assignment
    Buffer& operator=(const Buffer& other) {
        if (this != &other) {
            data_ = std::make_unique<char[]>(other.size_);
            size_ = other.size_;
            std::memcpy(data_.get(), other.data_.get(), size_);
        }
        return *this;
    }

    // Move assignment
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            data_ = std::move(other.data_);
            size_ = std::exchange(other.size_, 0);
        }
        return *this;
    }

    ~Buffer() = default;  // unique_ptr handles cleanup
};

// noexcept on move is critical:
// std::vector reallocation uses move ONLY if noexcept, copy otherwise
// Without noexcept on move: vector push_back is O(n) with copy instead of O(1) with move
std::vector<Buffer> v;
v.push_back(Buffer{1024});   // move (or NRVO — no copy or move at all)
v.reserve(100);               // if Buffer's move is noexcept, realloc moves; else copies

// Rule of Five (if you define any of these, define all five):
// - Destructor
// - Copy constructor
// - Copy assignment operator
// - Move constructor
// - Move assignment operator
// If you need a custom destructor, you almost always need all five.

// Rule of Zero: if possible, use types (smart pointers, containers) that manage resources
// and let the compiler generate all five implicitly
class Good {
    std::unique_ptr<int> data_;   // unique_ptr handles everything
    std::string name_;             // string handles everything
    // No user-defined destructor, copy, move needed
    // Compiler generates correct versions automatically
};

// Move-only type (like unique_ptr)
class UniqueHandle {
    int handle_;
public:
    explicit UniqueHandle(int h) : handle_{h} {}
    ~UniqueHandle() { if (handle_ != -1) closeHandle(handle_); }
    UniqueHandle(const UniqueHandle&) = delete;            // delete copy
    UniqueHandle& operator=(const UniqueHandle&) = delete; // delete copy assign
    UniqueHandle(UniqueHandle&& o) noexcept : handle_{std::exchange(o.handle_, -1)} {}
    UniqueHandle& operator=(UniqueHandle&& o) noexcept {
        if (this != &o) { closeHandle(handle_); handle_ = std::exchange(o.handle_, -1); }
        return *this;
    }
};
```

**L2 SIGNAL:** Must explain: (1) `noexcept` on move constructor affects `std::vector` reallocation strategy — without it, vector copies instead of moves. (2) `std::exchange(old, new)` returns old value and sets new — cleaner than save/assign/return. (3) Rule of Five vs Rule of Zero — prefer Zero by using RAII types as members. (4) `std::move` is just a cast — it doesn't move anything; the actual resource transfer happens in the move constructor/assignment.

**L3 SIGNAL:** Must discuss: (1) Return Value Optimization (RVO/NRVO) — compiler elides copy/move entirely when returning local objects (mandatory since C++17 for prvalues). (2) Named RVO (NRVO) is optional but almost universally implemented. (3) When to `return std::move(local)` — almost never (prevents NRVO). (4) Move semantics interaction with exception safety — moved-from state must be valid (destructable and reassignable). (5) Universal references (`T&&` in template context) vs rvalue references (`MyClass&&` in concrete context) — different things.

---

# SECTION 4: Object-Oriented Programming — Classes, Inheritance, Polymorphism

## 4.1 Classes — Layout, Construction, Destruction

```cpp
// Class member layout is implementation-defined but follows rules:
// - Members declared in order (with padding for alignment)
// - Static members are not part of object layout
// - Virtual functions add a vtable pointer (typically first, typically 8 bytes)

class Animal {
    // Access: private by default in class (public by default in struct)
    std::string name_;      // 32 bytes (small string optimization: 24 bytes)
    int age_;               // 4 bytes
    // 4 bytes padding for alignment
    
public:
    // Constructors
    Animal() = default;                          // default ctor
    explicit Animal(std::string name, int age)   // explicit prevents implicit conversion
        : name_{std::move(name)}, age_{age} {}   // member initializer list (preferred over body assignment)
    
    // Destructor — virtual if class is a base in polymorphic hierarchy
    virtual ~Animal() = default;  // virtual destructor is CRITICAL for correct polymorphic deletion
    
    // Pure virtual — makes class abstract (cannot be instantiated)
    virtual std::string speak() const = 0;
    
    // Virtual with default implementation
    virtual void breathe() const { std::cout << "inhale\n"; }
    
    // Non-virtual (non-polymorphic)
    const std::string& name() const { return name_; }
    int age() const { return age_; }

    // Static member function — no this pointer
    static Animal* createDefault() { return new Animal{"Unknown", 0}; }
    
    // Operator overloading
    bool operator==(const Animal& other) const {
        return name_ == other.name_ && age_ == other.age_;
    }
    
    // Friend function (access private members)
    friend std::ostream& operator<<(std::ostream& os, const Animal& a) {
        return os << a.name_ << " (" << a.age_ << ")";
    }
};

// Member initializer list vs constructor body:
// MIL: initializes members directly (one construction)
// Body: default-initializes then assigns (two operations for non-trivial types)
class Expensive {
    std::vector<int> data_;
public:
    // GOOD: initializes data_ once with move
    Expensive(std::vector<int> d) : data_{std::move(d)} {}
    
    // BAD: default-initializes data_ (empty vector), then copy-assigns
    Expensive(std::vector<int> d) { data_ = d; }
};

// Initialization order:
// 1. Base class(es) in declaration order
// 2. Member variables in declaration order (NOT MIL order!)
// 3. Constructor body
class Ordered {
    int b_;
    int a_;   // b_ declared before a_, so b_ initializes first regardless of MIL order
public:
    Ordered(int a, int b) : a_{a}, b_{b} {}  // b_ initializes FIRST (declaration order)
};
```

## 4.2 Inheritance and Polymorphism

```cpp
class Dog : public Animal {
    std::string breed_;
    
public:
    Dog(std::string name, int age, std::string breed)
        : Animal{std::move(name), age},     // base class constructor first
          breed_{std::move(breed)} {}
    
    // Override — MUST use override keyword (C++11) for safety
    std::string speak() const override { return "Woof!"; }
    void breathe() const override {
        Animal::breathe();   // call base class version explicitly
        std::cout << "pant\n";
    }
    
    // final: prevents further overriding
    std::string getBreed() const final { return breed_; }
};

// Polymorphism via virtual dispatch (vtable)
void makeSpeak(const Animal& a) {
    a.speak();  // dispatches to Dog::speak() if a is Dog, Cat::speak() if Cat, etc.
}

Dog dog{"Rex", 3, "Labrador"};
makeSpeak(dog);   // "Woof!" — virtual dispatch

// Object slicing — a classic C++ bug
void slicingBug(Animal a) {    // passed by VALUE — slices Dog to Animal
    a.speak();  // calls Animal::speak() (pure virtual — crash!) or Animal version
}
slicingBug(dog);   // Dog sliced to Animal — dog's Dog-specific data LOST

// Fix: pass by reference or pointer
void noSlicing(const Animal& a) { a.speak(); }  // polymorphic, no slicing

// Virtual destructor — why it matters
Animal* p = new Dog{"Fido", 2, "Poodle"};
delete p;   // Without virtual ~Animal: calls ~Animal only, ~Dog never called — RESOURCE LEAK
            // With virtual ~Animal: calls ~Dog (which calls ~Animal) — CORRECT

// Pure virtual with default implementation (rarely needed but valid)
struct Interface {
    virtual void doWork() = 0;   // pure virtual
};
void Interface::doWork() {       // default implementation
    // subclasses can call: Interface::doWork()
}

// Multiple inheritance — allowed in C++, use with care
class Flyable { public: virtual void fly() = 0; };
class Swimmable { public: virtual void swim() = 0; };
class Duck : public Animal, public Flyable, public Swimmable {
public:
    std::string speak() const override { return "Quack"; }
    void fly()  override { std::cout << "flap\n"; }
    void swim() override { std::cout << "paddle\n"; }
};

// Diamond problem — virtual inheritance
struct Base { int x; };
struct Left  : virtual Base {};   // virtual inheritance shares Base
struct Right : virtual Base {};
struct Diamond : Left, Right {};   // one shared Base::x, not two
Diamond d;
d.x = 1;   // unambiguous (virtual inheritance)
```

## 4.3 Virtual Dispatch Internals — vtable

```cpp
// vtable (virtual function table):
// - Each class with virtual functions has one vtable (shared by all instances)
// - Each polymorphic object has a hidden vptr (pointer to its class's vtable)
// - vptr is set in the constructor, updated if base has virtual functions

// sizeof impact: adding first virtual function adds pointer size to object
struct NV { int x; };               // sizeof = 4
struct V  { int x; virtual ~V(); }; // sizeof = 16 (4 + 4 padding + 8 for vptr on 64-bit)

// Virtual call cost:
// 1. Dereference vptr (may miss cache if many different types)
// 2. Load function pointer from vtable
// 3. Indirect function call (prevents inlining)
// Direct call: 1 instruction. Virtual call: 3-5 instructions + possible cache miss

// Devirtualization — compiler can sometimes see through virtual calls:
Dog d{"Rex", 2, "Lab"};
d.speak();   // compiler knows concrete type → may devirtualize → direct call

Animal* p = &d;
p->speak();  // cannot devirtualize — type unknown at compile time

// Final hint for devirtualization
class TerminalDog final : public Dog {
    // Compiler knows TerminalDog::speak cannot be further overridden
    // → can devirtualize calls on TerminalDog*
};

// CRTP (Curiously Recurring Template Pattern) — static polymorphism, zero overhead
template<typename Derived>
struct Printable {
    void print() const {
        static_cast<const Derived*>(this)->print_impl();  // compile-time dispatch
    }
};

struct Circle : Printable<Circle> {
    void print_impl() const { std::cout << "Circle\n"; }
};
// No vtable, no vptr, calls inlined
```

**L3 SIGNAL:** Must discuss: (1) vtable layout is ABI — changing virtual function order or adding virtual functions in the middle breaks binary compatibility. This is why stable C++ libraries avoid virtual functions in public interfaces. (2) Virtual call performance in CPU-bound code — branch misprediction on indirect calls, icache pollution from many different callee targets. (3) CRTP as zero-overhead static polymorphism alternative. (4) `std::variant` + `std::visit` as value-based polymorphism without inheritance. (5) Devirtualization conditions and the `final` keyword's impact.

---

## 4.4 Special Member Functions — The Complete Rules

```cpp
// Compiler-generated special members (Rule of Zero / Rule of Five)
struct Default {
    // All generated by compiler if not user-declared:
    Default();                           // default constructor
    Default(const Default&);             // copy constructor
    Default& operator=(const Default&);  // copy assignment
    Default(Default&&) noexcept;         // move constructor    (C++11)
    Default& operator=(Default&&);       // move assignment     (C++11)
    ~Default();                          // destructor
};

// Compiler STOPS generating move if you declare copy or destructor
// This can cause unexpected copies where moves were expected

struct BadPerf {
    std::vector<int> data;
    ~BadPerf() { /* logging */ }   // user-defined destructor
    // Compiler suppresses move constructor and move assignment!
    // std::vector<BadPerf> operations will COPY instead of MOVE
    
    // Fix: explicitly default them
    BadPerf(BadPerf&&) noexcept = default;
    BadPerf& operator=(BadPerf&&) noexcept = default;
};

// = delete: explicitly prevent operations
struct NonCopyable {
    NonCopyable() = default;
    NonCopyable(const NonCopyable&) = delete;
    NonCopyable& operator=(const NonCopyable&) = delete;
    NonCopyable(NonCopyable&&) = default;
    NonCopyable& operator=(NonCopyable&&) = default;
};

// Special member interaction table (simplified):
// User declares:    | Default ctor | Copy ctor | Copy assign | Move ctor | Move assign | Dtor
// Nothing           | Generated    | Generated | Generated   | Generated | Generated   | Generated
// Destructor        | Generated    | Generated | Generated   | DELETED   | DELETED     | -
// Copy ctor         | NOT gen      | -         | Generated   | DELETED   | DELETED     | Generated
// Copy assign       | Generated    | Generated | -           | DELETED   | DELETED     | Generated
// Move ctor         | NOT gen      | DELETED   | DELETED     | -         | DELETED     | Generated
// Move assign       | Generated    | DELETED   | DELETED     | DELETED   | -           | Generated
// Any of above      | varies       | varies    | varies      | varies    | varies      | Generated (if not declared)
```

---

# SECTION 5: Templates and Generic Programming

## 5.1 Function Templates

```cpp
// Function template — type deduction at call site
template<typename T>
T max_val(T a, T b) {
    return a > b ? a : b;
}

max_val(3, 5);         // T = int, deduced
max_val(3.0, 5.0);     // T = double, deduced
max_val<int>(3, 5);    // T = int, explicit
// max_val(3, 5.0);    // ERROR: ambiguous deduction (int vs double)
max_val<double>(3, 5.0); // OK: explicit T = double

// Template with multiple parameters
template<typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {   // trailing return type (C++11)
    return a + b;
}
// C++14: auto add(T a, U b) { return a + b; }  // return type deduced

// Non-type template parameters
template<int N>
std::array<int, N> makeZeroArray() {
    std::array<int, N> arr{};
    return arr;
}
auto a = makeZeroArray<5>();   // std::array<int, 5>

// Template specialization
template<typename T>
struct IsPointer { static constexpr bool value = false; };

template<typename T>
struct IsPointer<T*> { static constexpr bool value = true; };   // partial specialization

IsPointer<int>::value    // false
IsPointer<int*>::value   // true

// Function template specialization (prefer overloading over function template specialization)
template<>
std::string max_val<std::string>(std::string a, std::string b) {
    return a.length() > b.length() ? a : b;
}
```

## 5.2 Class Templates

```cpp
template<typename T, size_t Capacity = 100>
class FixedStack {
    T data_[Capacity];
    size_t size_{0};

public:
    void push(const T& val) {
        if (size_ >= Capacity) throw std::overflow_error("Stack full");
        data_[size_++] = val;
    }
    
    void push(T&& val) {   // rvalue overload for efficiency
        if (size_ >= Capacity) throw std::overflow_error("Stack full");
        data_[size_++] = std::move(val);
    }
    
    T pop() {
        if (empty()) throw std::underflow_error("Stack empty");
        return std::move(data_[--size_]);
    }
    
    const T& top() const {
        if (empty()) throw std::underflow_error("Stack empty");
        return data_[size_ - 1];
    }
    
    bool empty() const { return size_ == 0; }
    size_t size() const { return size_; }
    static constexpr size_t capacity() { return Capacity; }
};

FixedStack<int, 50> intStack;
FixedStack<std::string> strStack;   // Capacity defaults to 100

// Class template argument deduction (CTAD) — C++17
// Deduction guides (or compiler infers from constructor)
template<typename T>
class Wrapper {
public:
    Wrapper(T val) : val_{std::move(val)} {}
    T val_;
};
// Deduction guide (if constructor argument differs from template param)
template<typename T>
Wrapper(T) -> Wrapper<T>;

Wrapper w{42};           // C++17: deduced as Wrapper<int>
Wrapper w2{"hello"};     // Wrapper<const char*>
```

## 5.3 Variadic Templates

```cpp
// Variadic templates: zero or more type parameters
template<typename... Args>
void print(Args&&... args) {
    (std::cout << ... << args) << "\n";   // fold expression (C++17)
}

print(1, "hello", 3.14);   // prints "1hello3.14\n"

// Fold expressions (C++17)
template<typename... Args>
auto sum(Args... args) {
    return (... + args);   // left fold: ((a + b) + c)
}
sum(1, 2, 3, 4);   // 10

template<typename... Ts>
bool all_true(Ts... vals) {
    return (... && vals);   // fold with &&
}

// Perfect forwarding with variadic templates
template<typename T, typename... Args>
std::unique_ptr<T> makeObj(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

// Parameter pack expansion
template<typename... Ts>
struct TypeList {};

template<typename... Ts>
constexpr size_t typeCount = sizeof...(Ts);   // number of types in pack
typeCount<int, double, std::string>   // 3
```

## 5.4 Concepts (C++20)

```cpp
// Concept: named constraint on template parameters
// Replaces SFINAE boilerplate with readable, composable constraints

// Define a concept
template<typename T>
concept Numeric = std::is_arithmetic_v<T>;

template<typename T>
concept Printable = requires(T t) {
    { std::cout << t };   // T must support operator<<
};

template<typename T>
concept Container = requires(T c) {
    c.begin();
    c.end();
    c.size();
    typename T::value_type;
};

template<typename T>
concept Sortable = Container<T> && requires(T c) {
    { *c.begin() } -> std::totally_ordered;  // elements must be totally ordered
};

// Using concepts
template<Numeric T>
T square(T x) { return x * x; }

// Abbreviated function template syntax (C++20)
auto square2(Numeric auto x) { return x * x; }

// Requires clause
template<typename T>
requires Numeric<T> && (sizeof(T) >= 4)
T bigSquare(T x) { return x * x; }

// Concepts replace SFINAE
// Old SFINAE way (C++14):
template<typename T, typename = std::enable_if_t<std::is_arithmetic_v<T>>>
T oldSquare(T x) { return x * x; }

// Modern concepts way (C++20) — readable, better error messages:
template<std::integral T>
T intSquare(T x) { return x * x; }

// Standard library concepts (C++20 — <concepts>)
std::integral<int>          // true
std::floating_point<double> // true
std::same_as<int, int>      // true
std::derived_from<Dog, Animal>  // true
std::convertible_to<int, double> // true
std::invocable<decltype(add), int, int>  // true
std::ranges::range<std::vector<int>>   // true
```

**L3 SIGNAL:** Must discuss: (1) Before concepts, SFINAE (`std::enable_if`, `void_t`, detection idiom) was the mechanism for template constraints — complex, unreadable, terrible error messages. Concepts replace this. (2) Concepts are checked at the point of use, not at template instantiation — earlier, better error messages. (3) Concepts compose with `&&` and `||`. (4) `requires` clauses vs `requires` expressions — different uses. (5) Constrained vs unconstrained template overloads — constrained is preferred when both match.

---

## 5.5 Template Metaprogramming (TMP)

```cpp
// Compile-time computation via template instantiation
// (largely replaced by constexpr in modern C++, but understanding TMP is a senior signal)

// Classic TMP: factorial at compile time
template<int N>
struct Factorial {
    static constexpr int value = N * Factorial<N-1>::value;
};
template<>
struct Factorial<0> {
    static constexpr int value = 1;
};
constexpr int f5 = Factorial<5>::value;   // 120, computed at compile time

// Modern: constexpr function (cleaner, same compile-time result)
constexpr int factorial(int n) { return n <= 1 ? 1 : n * factorial(n-1); }
constexpr int f5_modern = factorial(5);   // 120, computed at compile time

// Type traits (standard TMP)
std::is_same_v<int, int>           // true
std::is_pointer_v<int*>            // true
std::is_reference_v<int&>          // true
std::remove_const_t<const int>     // int
std::remove_reference_t<int&>      // int
std::add_pointer_t<int>            // int*
std::conditional_t<true, int, double>  // int
std::common_type_t<int, double>    // double

// void_t trick for detection idiom (C++17)
template<typename, typename = void>
struct has_begin : std::false_type {};

template<typename T>
struct has_begin<T, std::void_t<decltype(std::declval<T>().begin())>> : std::true_type {};

has_begin<std::vector<int>>::value   // true
has_begin<int>::value                // false

// if constexpr (C++17) — compile-time branching, not TMP
template<typename T>
void process(T val) {
    if constexpr (std::is_integral_v<T>) {
        // This branch compiled only for integral types
        return val & 0xFF;
    } else if constexpr (std::is_floating_point_v<T>) {
        // This branch compiled only for floating point
        return static_cast<int>(val);
    } else {
        static_assert(always_false<T>, "Unsupported type");
    }
}
```

---

# SECTION 6: The Standard Library — Containers, Iterators, Algorithms

## 6.1 Container Overview and Complexity

```cpp
// SEQUENCE CONTAINERS
// std::vector<T>
// - Contiguous memory, dynamic size
// - push_back: O(1) amortized (O(n) when resize)
// - Insert/erase at middle: O(n) (shifts elements)
// - Random access: O(1)
// - Cache-friendly: sequential memory layout
// - Preferred container for most use cases

std::vector<int> v{1, 2, 3};
v.push_back(4);             // O(1) amortized
v.emplace_back(5);          // construct in-place (avoids extra copy)
v.insert(v.begin() + 1, 0); // O(n): shifts elements
v.erase(v.begin() + 1);     // O(n): shifts elements
v.reserve(100);             // pre-allocate, avoids reallocation
v.size();                   // number of elements
v.capacity();               // allocated slots
v.shrink_to_fit();          // release excess capacity (hint, not guaranteed)
v[2];                       // O(1), no bounds check
v.at(2);                    // O(1), bounds checked (throws std::out_of_range)
v.front(); v.back();        // first/last element (UB if empty)
v.data();                   // raw pointer to underlying array

// std::array<T, N> — fixed size, stack allocated
std::array<int, 5> arr{1, 2, 3, 4, 5};
arr.size();      // 5 (constexpr)
arr.fill(0);     // fill all with 0
arr.data();      // raw pointer

// std::deque<T> — double-ended queue
// - push_front/push_back: O(1) amortized
// - Insert/erase at middle: O(n)
// - Random access: O(1) but slower than vector (not contiguous)
// - Memory: segmented (chunks of contiguous memory)
std::deque<int> dq;
dq.push_front(0);
dq.push_back(4);

// std::list<T> — doubly-linked list
// - Insert/erase anywhere: O(1) (given iterator)
// - No random access: O(n) traversal
// - Poor cache performance (heap nodes, scattered memory)
// - Use when: frequent insert/erase in middle AND you have iterators
// - Avoid in modern code: cache misses dominate over algorithmic advantage
std::list<int> lst{1, 2, 3};
auto it = std::next(lst.begin());
lst.insert(it, 99);   // O(1): insert before it
lst.erase(it);        // O(1): erase at it

// std::forward_list<T> — singly-linked list (less memory than list)

// ASSOCIATIVE CONTAINERS (sorted)
// std::map<K, V> — BST (typically red-black tree)
// - O(log n) find/insert/erase
// - Keys sorted
// - Use when: need sorted iteration or ordered keys
std::map<std::string, int> m;
m["hello"] = 1;           // insert or update (creates entry if not present!)
m.insert({"world", 2});   // only inserts if key doesn't exist
m.emplace("foo", 3);      // construct in-place
auto it2 = m.find("hello");  // O(log n), returns end() if not found
if (it2 != m.end()) { /* found */ }
m.count("hello");         // 0 or 1 for map (not multimap)
m.contains("hello");      // C++20, bool

// std::set<T> — unique keys only
std::set<int> s{3, 1, 4, 1, 5};   // {1, 3, 4, 5} (sorted, unique)
s.insert(2);
s.erase(3);
s.count(4);    // 0 or 1

// UNORDERED CONTAINERS (hash-based)
// std::unordered_map<K, V>
// - O(1) average find/insert/erase, O(n) worst case (all same hash bucket)
// - No sorted order
// - Faster than map for most use cases, but:
//   * worse cache behavior for iteration (sparse hash table)
//   * can be DOS'd by hash collision attacks (use custom hash with seed)
std::unordered_map<std::string, int> um;
um["hello"] = 1;
um.reserve(100);        // pre-allocate buckets (avoid rehash)
um.load_factor();       // current elements / buckets
um.max_load_factor(0.7);  // trigger rehash when 70% full

// Custom hash for unordered containers
struct Point { int x, y; };
struct PointHash {
    size_t operator()(const Point& p) const {
        // Combine hashes (FNV, boost::hash_combine pattern)
        size_t h1 = std::hash<int>{}(p.x);
        size_t h2 = std::hash<int>{}(p.y);
        return h1 ^ (h2 * 2654435761ULL);   // multiplicative hash mixing
    }
};
struct PointEq {
    bool operator()(const Point& a, const Point& b) const {
        return a.x == b.x && a.y == b.y;
    }
};
std::unordered_map<Point, int, PointHash, PointEq> pointMap;

// std::unordered_set<T>
std::unordered_set<int> us{1, 2, 3};

// CONTAINER ADAPTERS (restrict interface)
std::stack<int> stk;          // LIFO, backed by deque by default
stk.push(1); stk.top(); stk.pop();

std::queue<int> q;            // FIFO, backed by deque by default
q.push(1); q.front(); q.pop();

std::priority_queue<int> pq;  // max-heap by default
pq.push(3); pq.push(1); pq.push(4);
pq.top();   // 4 (max)

// Min-heap priority queue
std::priority_queue<int, std::vector<int>, std::greater<int>> minPQ;
```

## 6.2 Iterators

```cpp
// Iterator categories (from weakest to strongest):
// - InputIterator:    read once, forward only (e.g., istream_iterator)
// - OutputIterator:   write once, forward only (e.g., ostream_iterator)
// - ForwardIterator:  read/write, multipass (e.g., forward_list)
// - BidirectionalIterator: forward + backward (e.g., list, map)
// - RandomAccessIterator:  O(1) jump (e.g., vector, deque, array)
// - ContiguousIterator (C++17): RandomAccess + contiguous memory (vector, array)

std::vector<int> v{1, 2, 3, 4, 5};
auto it = v.begin();   // iterator to first element
auto end = v.end();    // iterator to one-past-last (sentinel)

// Iterator operations
*it           // dereference: read/write element
++it; it++    // advance forward
--it; it--    // retreat backward (bidirectional or better)
it + 3        // jump (random access only)
it[3]         // subscript (random access only)
it2 - it1     // distance (random access: O(1), others: O(n))
it1 < it2     // comparison (random access only)
it1 == it2    // equality (all categories)

// Range-based for (uses begin()/end(), works with any iterable)
for (const auto& elem : v) { /* read */ }
for (auto& elem : v) { /* write */ }
for (auto [k, val] : myMap) { /* structured binding */ }

// Iterator invalidation — critical source of bugs
std::vector<int> vec{1, 2, 3};
auto iter = vec.begin();
vec.push_back(4);     // MAY INVALIDATE iter if reallocation occurs
*iter;                // UB if vec reallocated

// Iterator invalidation rules:
// vector: insert/erase/push_back (if reallocation) invalidates all iterators
// deque: insert at front/back preserves deque iterators but invalidates pointers
// list/map/set: insert never invalidates, erase invalidates only erased element's iterator
// unordered_map: insert invalidates all if rehash occurs

// Safe erase pattern (erase while iterating vector)
auto it2 = vec.begin();
while (it2 != vec.end()) {
    if (shouldErase(*it2)) {
        it2 = vec.erase(it2);  // erase returns next valid iterator
    } else {
        ++it2;
    }
}

// Or use std::remove_if + erase idiom (erase-remove idiom)
vec.erase(
    std::remove_if(vec.begin(), vec.end(), [](int x) { return x % 2 == 0; }),
    vec.end()
);

// C++20 ranges: ranges::remove_if + ranges::erase simplification
std::erase_if(vec, [](int x) { return x % 2 == 0; });  // C++20 simplified
```

## 6.3 Algorithms

```cpp
#include <algorithm>
#include <numeric>

std::vector<int> v{3, 1, 4, 1, 5, 9, 2, 6, 5, 3};

// Searching
std::find(v.begin(), v.end(), 5);                    // linear search, returns iterator
std::find_if(v.begin(), v.end(), [](int x){ return x > 4; });
std::binary_search(v.begin(), v.end(), 5);           // requires sorted, O(log n)
std::lower_bound(v.begin(), v.end(), 5);             // first >= 5, requires sorted
std::upper_bound(v.begin(), v.end(), 5);             // first > 5, requires sorted
auto [lo, hi] = std::equal_range(sorted.begin(), sorted.end(), 5);  // range of equals

// Sorting
std::sort(v.begin(), v.end());                       // O(n log n), not stable
std::stable_sort(v.begin(), v.end());                // O(n log n), preserves equal order
std::sort(v.begin(), v.end(), std::greater<int>{});  // descending
std::partial_sort(v.begin(), v.begin()+3, v.end());  // only first 3 in order
std::nth_element(v.begin(), v.begin()+4, v.end());   // pivot: element at position 4

// Transformation
std::transform(v.begin(), v.end(), v.begin(), [](int x){ return x * 2; });  // in-place
std::transform(a.begin(), a.end(), b.begin(), out.begin(), std::plus<int>{}); // binary

// Copying and moving
std::copy(v.begin(), v.end(), out.begin());
std::copy_if(v.begin(), v.end(), out.begin(), [](int x){ return x > 3; });
std::move(v.begin(), v.end(), out.begin());  // move elements

// Aggregation
std::accumulate(v.begin(), v.end(), 0);                          // sum
std::accumulate(v.begin(), v.end(), 1, std::multiplies<int>{});  // product
std::reduce(v.begin(), v.end(), 0, std::plus<int>{});            // C++17, may parallelize
std::count(v.begin(), v.end(), 5);
std::count_if(v.begin(), v.end(), [](int x){ return x > 4; });
auto [min_it, max_it] = std::minmax_element(v.begin(), v.end());

// Parallel algorithms (C++17) — execution policy
#include <execution>
std::sort(std::execution::par, v.begin(), v.end());          // parallel sort
std::reduce(std::execution::par_unseq, v.begin(), v.end());  // parallel reduce

// Set operations (requires sorted)
std::set_union(a.begin(), a.end(), b.begin(), b.end(), out.begin());
std::set_intersection(a.begin(), a.end(), b.begin(), b.end(), out.begin());
std::set_difference(a.begin(), a.end(), b.begin(), b.end(), out.begin());

// Heap operations
std::make_heap(v.begin(), v.end());  // converts range to max-heap
std::push_heap(v.begin(), v.end());  // assume v.back() just added
std::pop_heap(v.begin(), v.end());   // max goes to v.back()

// Numeric algorithms
std::iota(v.begin(), v.end(), 0);              // fill with 0, 1, 2, ...
std::partial_sum(v.begin(), v.end(), out.begin());  // prefix sums
std::inner_product(a.begin(), a.end(), b.begin(), 0);  // dot product
std::adjacent_difference(v.begin(), v.end(), out.begin());  // differences
```

## 6.4 C++20 Ranges

```cpp
#include <ranges>
namespace rv = std::views;

std::vector<int> v{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// Lazy views — no intermediate allocation
auto evens   = v | rv::filter([](int x){ return x % 2 == 0; });
auto doubled = evens | rv::transform([](int x){ return x * 2; });
auto first3  = doubled | rv::take(3);

for (int x : first3) std::cout << x;   // 4 8 12 (lazy: processes only what's needed)

// vs chained algorithms (creates intermediate vectors)
auto old_way = v;
auto filtered = std::vector<int>{};
std::copy_if(old_way.begin(), old_way.end(), std::back_inserter(filtered),
             [](int x){ return x % 2 == 0; });
// etc.

// Ranges algorithms
std::ranges::sort(v);                              // works on containers directly
std::ranges::sort(v, std::greater{});              // comparator
std::ranges::sort(mystructs, {}, &Struct::field);  // project on member
auto it = std::ranges::find(v, 5);
std::ranges::copy(v, std::ostream_iterator<int>(std::cout, " "));

// Views library
rv::iota(1, 11)         // range [1, 10]
rv::repeat(42)          // infinite range of 42s
rv::enumerate(v)        // pairs of (index, value)  C++23
rv::zip(a, b)           // pairs of (a[i], b[i])    C++23
rv::chunk(v, 3)         // groups of 3              C++23
rv::join(nested)        // flatten nested ranges
rv::reverse(v)          // reversed view
rv::drop(v, 2)          // skip first 2
rv::split(str, '/')     // split string by delimiter

// Collecting into a container (C++23)
auto result = v | rv::filter(isEven) | rv::transform(double_) | std::ranges::to<std::vector>();
// C++20 alternative:
std::vector<int> result2;
std::ranges::copy(v | rv::filter(isEven) | rv::transform(double_),
                  std::back_inserter(result2));
```

**L3 SIGNAL:** Must know: (1) Ranges views are lazy — no work done until iterated. Good for large data or when you may early-exit. (2) Ranges algorithms take range objects, not iterator pairs — cleaner API, less error-prone. (3) Projection argument (third param to ranges algorithms) eliminates many lambda wrappers. (4) `std::ranges::to` (C++23) materializes lazy ranges into containers. (5) Parallel algorithms require `<execution>` header and TBB or libstdc++ parallel support — not universally available.

---

# SECTION 7: Lambdas and Callable Objects

## 7.1 Lambda Expressions — Complete Reference

```cpp
// Lambda syntax:
// [capture](params) specifiers -> return_type { body }

// Basic lambda
auto f = [](int x) { return x * 2; };
f(5);   // 10

// Captures
int multiplier = 3;
std::string prefix = "val: ";

auto byValue   = [multiplier](int x) { return x * multiplier; };  // copy
auto byRef     = [&multiplier](int x) { return x * multiplier; }; // reference
auto byRefAll  = [&](int x) { return prefix + std::to_string(x * multiplier); }; // ref all
auto byValAll  = [=](int x) { return x * multiplier; };            // value all
auto mixed     = [=, &prefix](int x) { prefix += "!"; return x; }; // mix
auto initCapture = [m = std::move(someUniquePtr)](){ m->method(); }; // init capture (C++14)

// Mutable lambda — allows modifying captured-by-value variables
int count = 0;
auto inc = [count]() mutable { return ++count; };  // modifies COPY of count
inc();   // returns 1, original count still 0
// Without mutable: captured-by-value variables are const in lambda body

// Generic lambdas (C++14)
auto genericMax = [](auto a, auto b) { return a > b ? a : b; };
genericMax(3, 5);       // int
genericMax(3.0, 5.0);   // double
genericMax("abc"s, "xyz"s);  // string

// Explicit template params (C++20)
auto transform = []<typename T>(std::vector<T>& vec, T mult) {
    for (auto& x : vec) x *= mult;
};

// Lambda as comparator
struct Person { std::string name; int age; };
std::vector<Person> people = {{"Alice", 30}, {"Bob", 25}, {"Carol", 35}};
std::sort(people.begin(), people.end(),
          [](const Person& a, const Person& b) { return a.age < b.age; });

// Recursive lambda (requires std::function or auto parameter)
// Method 1: std::function (has overhead)
std::function<int(int)> fib = [&fib](int n) -> int {
    return n <= 1 ? n : fib(n-1) + fib(n-2);
};

// Method 2: pass self as parameter (C++23 deducing this, or template trick)
auto fib2 = [](this auto& self, int n) -> int {  // C++23 deducing this
    return n <= 1 ? n : self(n-1) + self(n-2);
};

// Method 3: Y-combinator for zero-overhead recursive lambda
auto Y = [](auto f) {
    return [f](auto... args) { return f(f, args...); };
};
auto fib3 = Y([](auto self, int n) -> int {
    return n <= 1 ? n : self(self, n-1) + self(self, n-2);
});

// Lambda as immediately invoked expression (IIE) — for complex initialization
const auto config = [&]() -> Config {
    Config c;
    c.host = getenv("HOST") ?: "localhost";
    c.port = std::stoi(getenv("PORT") ?: "8080");
    return c;
}();   // immediately invoked

// Stateful functor equivalent to lambda
struct Multiplier {
    int factor;
    int operator()(int x) const { return x * factor; }
};
// Lambda with capture compiles to approximately this struct
```

## 7.2 std::function and Callable Wrappers

```cpp
// std::function<Signature>: type-erased callable
// Can hold: function pointer, lambda, functor, member function + object
// Cost: heap allocation for large closures, virtual dispatch, no inlining

// std::function usage
std::function<int(int, int)> op;
op = [](int a, int b) { return a + b; };
op = std::plus<int>{};
op(3, 4);   // 7

// Binding member functions
class Timer {
public:
    void onTick(int elapsed) { /* ... */ }
};
Timer t;
std::function<void(int)> callback = [&t](int e) { t.onTick(e); };
// or: std::bind(&Timer::onTick, &t, std::placeholders::_1);  // older style

// When to use std::function:
// - Store heterogeneous callables in containers
// - Runtime-swappable callbacks
// - Public API that accepts user callbacks (erase concrete type)

// When NOT to use std::function:
// - Hot paths (virtual dispatch, possible heap alloc overhead)
// - Template context where type is deduced (auto parameter is zero-overhead)

// Prefer templates over std::function in generic code:
// SLOW (std::function overhead):
void processAll(std::vector<int>& v, std::function<int(int)> fn) {
    for (auto& x : v) x = fn(x);
}

// FAST (inlined, zero overhead):
template<typename F>
void processAllFast(std::vector<int>& v, F fn) {
    for (auto& x : v) x = fn(x);
}
// Or: void processAllFast(std::vector<int>& v, auto fn) { ... }  // C++20

// std::move_only_function (C++23) — like std::function but move-only, no overhead for small callables
std::move_only_function<void()> f2 = [p = std::move(uniquePtr)]() { p->run(); };
```

---

# SECTION 8: Concurrency — Threads, Synchronization, and Atomics

## 8.1 std::thread and Thread Management

```cpp
#include <thread>
#include <mutex>
#include <atomic>
#include <future>
#include <condition_variable>

// Creating threads
std::thread t1([]() {
    std::cout << "Thread 1\n";
});

// Thread with arguments (arguments are COPIED, use ref wrapper for reference)
void process(int& count, const std::string& label) { count++; }
int count = 0;
std::thread t2(process, std::ref(count), "worker");

// std::ref is required for references — thread copies args by default
// Without std::ref: modifies a copy, original unchanged

// Thread lifecycle — must join or detach before thread object destroyed
t1.join();      // wait for t1 to finish (blocks caller)
t2.detach();    // detach: thread runs independently, no join needed
// If thread object destroyed without join/detach: std::terminate() called!

// Joining RAII wrapper (C++20: std::jthread)
// C++20:
std::jthread jt([]() { /* auto-joined on destruction */ });
// C++17 and earlier: manual RAII wrapper
class JoinThread {
    std::thread t_;
public:
    template<typename F, typename... Args>
    JoinThread(F&& f, Args&&... args) : t_{std::forward<F>(f), std::forward<Args>(args)...} {}
    ~JoinThread() { if (t_.joinable()) t_.join(); }
    JoinThread(JoinThread&&) = default;
};

// Thread identification
std::this_thread::get_id();     // current thread's ID
t1.get_id();                    // specific thread's ID
std::this_thread::sleep_for(std::chrono::milliseconds(100));
std::this_thread::yield();      // hint to scheduler to reschedule

// Hardware concurrency
unsigned n = std::thread::hardware_concurrency();   // number of logical cores
```

## 8.2 Mutual Exclusion and Synchronization

```cpp
// std::mutex — basic mutual exclusion
std::mutex mtx;

// RAII lock wrappers (always prefer over raw lock/unlock)
{
    std::lock_guard<std::mutex> lock{mtx};    // acquires, releases on destruction
    // critical section
}

{
    std::unique_lock<std::mutex> ulock{mtx};  // more flexible: can unlock early, defer, try
    ulock.unlock();
    // ... non-critical work ...
    ulock.lock();
    // critical section again
}

// Avoiding deadlock — always lock multiple mutexes in same order
// Or use std::lock (locks multiple mutexes deadlock-free)
std::mutex m1, m2;
std::lock(m1, m2);   // locks both, deadlock-free
std::lock_guard<std::mutex> lg1{m1, std::adopt_lock};  // already locked
std::lock_guard<std::mutex> lg2{m2, std::adopt_lock};

// C++17: std::scoped_lock (lock multiple, RAII)
std::scoped_lock lock{m1, m2};   // cleaner

// std::shared_mutex — readers-writer lock (C++17)
std::shared_mutex rwMtx;
// Multiple readers simultaneously
{ std::shared_lock<std::shared_mutex> rLock{rwMtx}; /* read */ }
// Exclusive writer
{ std::unique_lock<std::shared_mutex> wLock{rwMtx}; /* write */ }

// std::recursive_mutex — allows same thread to lock multiple times
std::recursive_mutex rmtx;

// Condition variables — for producer/consumer signaling
std::mutex cvMtx;
std::condition_variable cv;
std::queue<int> dataQueue;
bool done = false;

// Producer
void producer() {
    for (int i = 0; i < 10; ++i) {
        {
            std::lock_guard<std::mutex> lock{cvMtx};
            dataQueue.push(i);
        }
        cv.notify_one();   // wake one waiting consumer
    }
    { std::lock_guard<std::mutex> lock{cvMtx}; done = true; }
    cv.notify_all();   // wake all consumers to check done
}

// Consumer
void consumer() {
    while (true) {
        std::unique_lock<std::mutex> lock{cvMtx};
        cv.wait(lock, []{ return !dataQueue.empty() || done; });  // spurious wake-safe
        if (dataQueue.empty() && done) break;
        int val = dataQueue.front(); dataQueue.pop();
        lock.unlock();
        process(val);
    }
}

// std::once_flag + std::call_once — thread-safe one-time initialization
std::once_flag initFlag;
std::call_once(initFlag, []() {
    expensiveInit();   // guaranteed called exactly once across all threads
});
```

## 8.3 Atomic Operations

```cpp
#include <atomic>

// std::atomic<T>: lock-free operations on scalar types
// Avoids mutex overhead for simple counter, flag, or pointer operations

std::atomic<int> counter{0};
counter++;                      // atomic increment
counter.fetch_add(5);           // atomic add, returns old value
counter.fetch_sub(1);           // atomic subtract
counter.store(0);               // atomic write
int val = counter.load();       // atomic read
int old = counter.exchange(10); // atomic swap, returns old

// Compare-and-swap (CAS) — foundation of lock-free algorithms
int expected = 5;
bool swapped = counter.compare_exchange_strong(expected, 10);
// If counter == expected: set counter = 10, return true
// If counter != expected: set expected = counter's current value, return false

// compare_exchange_weak: may fail spuriously (loop required)
// Use on platforms where CAS is simulated (ARM): slightly faster
int exp = 0;
while (!counter.compare_exchange_weak(exp, exp + 1)) {}  // atomic increment via CAS

// Memory ordering — controls which operations are visible to other threads
// Performance trade-off: weaker order = faster, stronger = more guarantees
std::atomic<bool> ready{false};
std::atomic<int> data{0};

// Producer:
data.store(42, std::memory_order_relaxed);   // no ordering guarantee
ready.store(true, std::memory_order_release);  // all prior writes visible to acquirers

// Consumer:
while (!ready.load(std::memory_order_acquire)) {}  // synchronizes with release
int d = data.load(std::memory_order_relaxed);       // sees 42

// Memory order quick reference:
// relaxed: no synchronization, just atomicity (counters, statistics)
// acquire: this load cannot be reordered after subsequent reads/writes
// release: this store cannot be reordered before prior reads/writes
// acq_rel: acquire + release (for RMW operations like fetch_add)
// seq_cst: total sequential consistency, strongest, default

// std::atomic_flag — guaranteed lock-free, spinlock building block
std::atomic_flag flag = ATOMIC_FLAG_INIT;
while (flag.test_and_set()) {}  // spinlock acquire
// critical section
flag.clear();                    // spinlock release

// Lock-free stack (simplified, ABA problem not addressed)
template<typename T>
class LockFreeStack {
    struct Node { T data; Node* next; };
    std::atomic<Node*> head_{nullptr};
public:
    void push(T val) {
        auto node = new Node{std::move(val), head_.load()};
        while (!head_.compare_exchange_weak(node->next, node)) {}
    }
    std::optional<T> pop() {
        Node* old = head_.load();
        while (old && !head_.compare_exchange_weak(old, old->next)) {}
        if (!old) return std::nullopt;
        T val = std::move(old->data);
        delete old;   // ABA problem: old might be reused before delete!
        return val;
    }
};
```

## 8.4 Futures, Promises, and async

```cpp
// std::future / std::promise: one-shot value transfer between threads
std::promise<int> prom;
std::future<int> fut = prom.get_future();

std::thread producer([&prom]() {
    // ... compute ...
    prom.set_value(42);           // satisfy the future
    // prom.set_exception(std::make_exception_ptr(std::runtime_error("err")));
});

int result = fut.get();  // blocks until value available, rethrows exception if set
producer.join();

// std::async — launch task on a thread
std::future<int> f1 = std::async(std::launch::async, []() -> int {
    return heavyCompute();   // always runs in separate thread
});

std::future<int> f2 = std::async(std::launch::deferred, []() -> int {
    return lightCompute();   // runs in calling thread when .get() called
});

std::future<int> f3 = std::async([]() -> int {
    return compute();   // std::launch::async | std::launch::deferred — implementation decides
});

int r1 = f1.get();   // blocks until done

// std::shared_future: multiple consumers
std::shared_future<int> sf = f1.share();
// Multiple threads can call sf.get()

// std::packaged_task: wrap callable with a future
std::packaged_task<int(int, int)> task([](int a, int b) { return a + b; });
std::future<int> taskFut = task.get_future();
std::thread t(std::move(task), 3, 4);   // run task in thread
int sum = taskFut.get();   // 7
t.join();

// C++20: std::jthread with stop_token for cooperative cancellation
std::jthread worker([](std::stop_token st) {
    while (!st.stop_requested()) {
        // do work
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
});
worker.request_stop();  // ask thread to stop
// worker.join() called automatically in ~jthread
```

**L3 SIGNAL:** Must discuss: (1) ABA problem in lock-free algorithms — between load and CAS, another thread may have changed value and changed back; solution: tagged pointers or hazard pointers. (2) The cost of `seq_cst` memory order — compiles to MFENCE on x86, much more expensive than `acquire`/`release`. (3) False sharing: two `std::atomic<int>` variables on the same cache line cause cache bouncing between threads — align to cache line with `alignas(64)`. (4) `std::atomic<shared_ptr>` (C++20): fully atomic shared_ptr operations. (5) Why `double-checked locking` pattern requires memory barriers and why `std::call_once` is the correct implementation. (6) Thread pool design decisions: work-stealing vs shared queue, thread affinity, task priority.

---

# SECTION 9: Exception Handling and Error Strategies

## 9.1 Exception Mechanics

```cpp
// Throwing
throw std::runtime_error{"Something failed"};
throw 42;               // can throw any type (avoid non-exception types)
throw;                  // rethrow current exception (in catch block only)

// Catching
try {
    riskyOperation();
} catch (const std::invalid_argument& e) {  // specific first
    handleInvalid(e.what());
} catch (const std::exception& e) {         // base class catches all std exceptions
    handleGeneric(e.what());
} catch (...) {                              // catch anything (including non-std exceptions)
    handleUnknown();
    throw;   // rethrow to propagate
}

// std::exception hierarchy
// std::exception
//   ├─ std::logic_error    (programming errors, recoverable in theory)
//   │   ├─ std::invalid_argument
//   │   ├─ std::domain_error
//   │   ├─ std::length_error
//   │   └─ std::out_of_range
//   └─ std::runtime_error  (runtime conditions, often unrecoverable)
//       ├─ std::range_error
//       ├─ std::overflow_error
//       ├─ std::underflow_error
//       ├─ std::system_error  (OS errors, has std::error_code)
//       └─ std::bad_alloc, std::bad_cast, std::bad_typeid, etc.

// Custom exceptions — derive from std::exception or its subclasses
class AppError : public std::runtime_error {
    int code_;
public:
    AppError(std::string msg, int code)
        : std::runtime_error{std::move(msg)}, code_{code} {}
    int code() const noexcept { return code_; }
};

// Stack unwinding: when exception thrown, destructors called for all objects in scope
// This is why RAII works — destructors are guaranteed to run during unwinding
void withUnwinding() {
    FileHandle f{"data.txt", "r"};   // destructor will run even if exception thrown
    auto p = std::make_unique<Widget>();   // destructor will run
    throw std::runtime_error{"oops"};     // f and p destructors run before propagation
}
```

## 9.2 noexcept — Exception Specifications

```cpp
// noexcept: promise that function will not throw
// If it does throw: std::terminate() called immediately (no stack unwinding)

void safe() noexcept { /* guaranteed not to throw */ }
void maybe() noexcept(false) { /* may throw (default) */ }

// noexcept(condition) — conditional noexcept
template<typename T>
void swap_vals(T& a, T& b) noexcept(std::is_nothrow_move_constructible_v<T> &&
                                    std::is_nothrow_move_assignable_v<T>) {
    T tmp = std::move(a);
    a = std::move(b);
    b = std::move(tmp);
}

// Checking noexcept at compile time
static_assert(noexcept(swap_vals(std::declval<int&>(), std::declval<int&>())));

// Why noexcept matters:
// 1. std::vector uses move only if move is noexcept (else copies for exception safety)
// 2. Performance: compiler can omit exception handling code
// 3. std::terminate vs unwinding: noexcept can be faster when guarantee is real

// Always mark noexcept:
// - Move constructors and move assignment operators
// - Destructors (implicitly noexcept in C++11 if no throw)
// - Swap functions
// - Simple accessors that clearly can't throw

// Exception safety levels (Abrahams guarantees):
// No-throw: operation completes with no exception (noexcept)
// Strong: if exception, state unchanged (commit-or-rollback)
// Basic: if exception, state is valid but unspecified (no leaks, no corruption)
// No guarantee: state may be invalid (avoid this level)

// Strong exception guarantee example
class SafeVector {
    std::vector<int> data_;
public:
    void add(int val) {   // strong guarantee
        std::vector<int> tmp = data_;  // copy (basic exception safe)
        tmp.push_back(val);            // may throw
        data_ = std::move(tmp);        // noexcept move (commit)
    }
};

// error_code: error handling without exceptions (for performance-critical or noexcept paths)
#include <system_error>
std::error_code ec;
if (!doOperation(ec)) {
    if (ec == std::errc::no_such_file_or_directory) { /* handle */ }
    else { /* other error */ }
}
// C++23: std::expected<T, E> — functional error handling
std::expected<int, std::string> divide(int a, int b) {
    if (b == 0) return std::unexpected{"division by zero"};
    return a / b;
}
auto result = divide(10, 2);
if (result) std::cout << *result;   // 5
else std::cout << result.error();   // error message
```

---

# SECTION 10: Compilation Model, Preprocessor, and Build Systems

## 10.1 Translation Units and Linkage

```cpp
// One Definition Rule (ODR): each entity must be defined exactly once
// across all translation units (TUs)
// Exception: inline functions, template definitions, constexpr vars — can appear in multiple TUs

// Header file best practices
// myclass.h:
#pragma once   // or use include guards:
// #ifndef MYCLASS_H
// #define MYCLASS_H
// #endif

// Declaration (in header):
void process(int x);           // function declaration
extern int globalVar;          // variable declaration (extern = defined elsewhere)
class MyClass { /* ... */ };   // class definition (always in header)

// Definition (in .cpp):
void process(int x) { /* ... */ }   // function definition
int globalVar = 0;                   // variable definition

// inline: allows definition in multiple TUs (ODR exception)
// Modern use: for short functions defined in headers
inline int square(int x) { return x * x; }   // defined in header, multiple TUs OK

// static (file/namespace scope): internal linkage — not visible to other TUs
static int fileLocal = 42;   // not exported, each TU has its own copy
// Prefer anonymous namespace in C++ (cleaner, also gives internal linkage)
namespace {
    int anotherFileLocal = 42;
    void helperFunc() {}    // not visible outside this TU
}

// extern "C": disable C++ name mangling for C interop
extern "C" {
    void c_compatible_function(int x);   // C linkage, predictable symbol name
}
// Or: extern "C" int single_func(int x);

// Linkage types:
// External: default for non-static, non-anonymous-namespace functions/vars
// Internal: static or anonymous namespace
// No linkage: local variables inside functions
```

## 10.2 Preprocessor

```cpp
// Macros — powerful but dangerous (use sparingly, prefer constexpr/inline/templates)
#define PI 3.14159      // simple substitution (no type, no scope)
#define MAX(a,b) ((a)>(b)?(a):(b))  // macro function — double evaluation bug!
MAX(x++, y++)   // x++ or y++ evaluated TWICE — silent bug

// Prefer:
constexpr double PI = 3.14159;
template<typename T> constexpr T max_val(T a, T b) { return a > b ? a : b; }

// Predefined macros
__FILE__      // current source file path (string)
__LINE__      // current line number (int)
__func__      // current function name (string, C++11)
__DATE__      // compilation date (string)
__TIME__      // compilation time (string)
__cplusplus   // C++ standard version: 199711, 201103, 201402, 201703, 202002, 202302

// Feature test macros (C++20) — check feature availability
#if __cpp_concepts >= 201907L
    // use concepts
#endif
#if __has_include(<format>)
    #include <format>
#endif

// Conditional compilation
#ifndef NDEBUG
    #define ASSERT(cond) do { if (!(cond)) { std::abort(); } } while(0)
#else
    #define ASSERT(cond) ((void)0)
#endif

// X-macro pattern — avoid repetition for enum/string mapping
#define COLORS \
    X(RED,   0xFF0000) \
    X(GREEN, 0x00FF00) \
    X(BLUE,  0x0000FF)

enum Color {
    #define X(name, val) name = val,
    COLORS
    #undef X
};

const char* colorName(Color c) {
    switch(c) {
        #define X(name, val) case name: return #name;
        COLORS
        #undef X
    }
    return "UNKNOWN";
}
```

## 10.3 Build Systems and Compilation Pipeline

```
Source Files (.cpp)
    ↓ Preprocessor (expand includes, macros, #ifdef)
    ↓ Compiler (lexing, parsing, semantic analysis, IR, optimization)
    ↓ Code Generation (machine code)
Object Files (.o / .obj)
    ↓ Linker (symbol resolution, relocation)
Executable or Library (.exe, .so, .dll, .a, .lib)

Compilation flags (GCC/Clang):
-O0    no optimization (for debug)
-O1    basic optimization
-O2    standard optimization (most production builds)
-O3    aggressive (can increase code size)
-Os    optimize for size
-Og    optimize for debug experience

Debug/Analysis flags:
-g                      debug symbols
-fsanitize=address      AddressSanitizer (ASan)
-fsanitize=undefined    UBSanitizer (UBSan)
-fsanitize=thread       ThreadSanitizer (TSan)
-fsanitize=memory       MemorySanitizer (MSan)
-Wall -Wextra -Wpedantic  warnings
-Werror                 treat warnings as errors

Warning flags to always enable:
-Wall -Wextra -Wshadow -Wold-style-cast -Wconversion -Wsign-conversion
-Wnull-dereference -Wdouble-promotion
```

```cmake
# CMake (most common modern C++ build system)
cmake_minimum_required(VERSION 3.20)
project(MyApp VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)   # avoid GNU extensions, use standard C++

# Libraries
add_library(mylib STATIC src/lib.cpp include/lib.h)
target_include_directories(mylib PUBLIC include/)
target_compile_options(mylib PRIVATE -Wall -Wextra)

# Executable
add_executable(myapp src/main.cpp)
target_link_libraries(myapp PRIVATE mylib)

# External dependencies (FetchContent or find_package)
include(FetchContent)
FetchContent_Declare(
    googletest
    URL https://github.com/google/googletest/archive/v1.14.0.zip
)
FetchContent_MakeAvailable(googletest)

# Tests
enable_testing()
add_executable(tests test/test_main.cpp)
target_link_libraries(tests PRIVATE mylib GTest::gtest_main)
include(GoogleTest)
gtest_discover_tests(tests)
```

---

# SECTION 11: Modern C++ Features by Standard

## 11.1 C++11 Key Features

```cpp
// auto type deduction
auto x = 42;              // int
auto v = std::vector<int>{1,2,3};

// Range-based for
for (const auto& elem : container) {}

// nullptr (type-safe null pointer)
int* p = nullptr;   // not 0, not NULL

// Move semantics (see Section 3.3)
// Smart pointers (see Section 2.3)
// Lambda expressions (see Section 7.1)
// Variadic templates (see Section 5.3)
// constexpr functions

// initializer_list
void f(std::initializer_list<int> lst) {
    for (int x : lst) std::cout << x;
}
f({1, 2, 3, 4, 5});

// Delegating constructors
class Widget {
    int x_, y_;
    Widget(int x, int y, bool) : x_{x}, y_{y} {}  // private impl
public:
    Widget() : Widget(0, 0, true) {}        // delegates to impl ctor
    Widget(int x) : Widget(x, 0, true) {}  // delegates to impl ctor
};

// Inheriting constructors
class Base { public: Base(int x, int y) {} };
class Derived : public Base {
    using Base::Base;   // inherit Base's constructors
};
Derived d{1, 2};   // calls Base(int, int)

// static_assert (compile-time assertion)
static_assert(sizeof(int) == 4, "Need 32-bit int");
static_assert(std::is_default_constructible_v<MyClass>);

// Type aliases (cleaner than typedef)
using StringVec = std::vector<std::string>;
using Callback = std::function<void(int)>;
template<typename T>
using Matrix = std::vector<std::vector<T>>;
```

## 11.2 C++14 Key Features

```cpp
// Generic lambdas (auto parameters)
auto f = [](auto x, auto y) { return x + y; };

// Return type deduction for regular functions
auto compute(int x) { return x * x; }   // deduced as int

// Variable templates
template<typename T>
constexpr T pi_v = T(3.14159265358979323846);
double pi = pi_v<double>;
float pif = pi_v<float>;

// std::make_unique
auto p = std::make_unique<MyClass>(arg1, arg2);

// Integer literal suffixes
auto x = 42LL;   // long long
auto y = 42ULL;  // unsigned long long
auto z = 3.14f;  // float
auto b = 0b1010; // binary literal

// std::exchange
int old = std::exchange(x, 0);  // sets x=0, returns old x value
```

## 11.3 C++17 Key Features

```cpp
// Structured bindings
auto [key, val] = *map.find("x");
auto [first, ...rest] = tuple;  // NOT valid, but close
auto& [x, y, z] = myStruct;

// if constexpr — compile-time branching
template<typename T>
auto stringify(T val) {
    if constexpr (std::is_same_v<T, bool>)
        return val ? "true"s : "false"s;
    else if constexpr (std::is_arithmetic_v<T>)
        return std::to_string(val);
    else
        return std::string{val};
}

// if/switch with initializer
if (auto it = m.find(key); it != m.end()) {
    use(it->second);   // it scoped to if block
}

// Fold expressions (see Section 5.3)

// std::optional<T>
std::optional<int> findFirst(const std::vector<int>& v, int target) {
    for (int i = 0; i < v.size(); ++i)
        if (v[i] == target) return i;
    return std::nullopt;  // no value
}
auto idx = findFirst(v, 42);
if (idx) std::cout << *idx;         // dereference if has value
idx.value_or(-1);                    // get value or default
idx.has_value();                     // bool check

// std::variant<Ts...> — type-safe union
std::variant<int, double, std::string> v;
v = 42;
v = 3.14;
v = std::string{"hello"};

// Visiting variant
std::visit([](const auto& val) { std::cout << val; }, v);

// Pattern matching via overloaded visitor
struct Visitor {
    void operator()(int i)        { std::cout << "int: " << i; }
    void operator()(double d)     { std::cout << "double: " << d; }
    void operator()(const std::string& s) { std::cout << "string: " << s; }
};
std::visit(Visitor{}, v);

// Overloaded helper (for inline visitors)
template<typename... Ts>
struct overloaded : Ts... { using Ts::operator()...; };
template<typename... Ts>
overloaded(Ts...) -> overloaded<Ts...>;   // deduction guide

std::visit(overloaded{
    [](int i)         { std::cout << "int: " << i; },
    [](double d)      { std::cout << "double: " << d; },
    [](const std::string& s) { std::cout << "str: " << s; }
}, v);

// std::any — holds any copyable type
std::any a = 42;
a = std::string{"hello"};
std::any_cast<std::string>(a);              // get value (throws if wrong type)
std::any_cast<std::string>(&a);             // get pointer (nullptr if wrong type)
a.type() == typeid(std::string)             // type check

// std::string_view — non-owning string reference (no allocation)
std::string_view sv = "hello world";   // points to string literal
sv.substr(0, 5);                       // returns string_view, no allocation
// Never return string_view referring to local std::string — dangling!

// Class Template Argument Deduction (CTAD)
std::vector v2{1, 2, 3};  // deduced as std::vector<int>
std::pair p2{1, 3.14};    // deduced as std::pair<int, double>

// Parallel algorithms
std::sort(std::execution::par, data.begin(), data.end());

// std::filesystem (C++17)
#include <filesystem>
namespace fs = std::filesystem;
fs::path p = "/usr/local/bin";
fs::exists(p);
fs::create_directories(p / "subdir");
for (auto& entry : fs::directory_iterator(p)) {
    std::cout << entry.path().filename();
}
fs::file_size("large.bin");
```

## 11.4 C++20 Key Features

```cpp
// Concepts (see Section 5.4)

// Ranges (see Section 6.4)

// Coroutines
#include <coroutine>

// Generator using coroutines
struct Generator {
    struct promise_type {
        int current_value;
        Generator get_return_object() { return Generator{handle_t::from_promise(*this)}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(int val) { current_value = val; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    using handle_t = std::coroutine_handle<promise_type>;
    handle_t handle_;

    explicit Generator(handle_t h) : handle_{h} {}
    ~Generator() { if (handle_) handle_.destroy(); }

    bool next() { handle_.resume(); return !handle_.done(); }
    int value() { return handle_.promise().current_value; }
};

Generator counter(int start, int end) {
    for (int i = start; i < end; ++i) {
        co_yield i;   // suspend and yield value
    }
}

auto gen = counter(0, 10);
while (gen.next()) std::cout << gen.value();

// std::format (C++20)
#include <format>
std::string s = std::format("Hello, {}! You are {} years old.", name, age);
std::format("{:>10}", "right");    // right-align in 10 chars
std::format("{:.3f}", 3.14159);   // 3-decimal float
std::format("{:#010x}", 255);     // 0x000000ff

// Three-way comparison operator (spaceship operator)
struct Point {
    int x, y;
    auto operator<=>(const Point&) const = default;   // auto-generates all comparisons
    bool operator==(const Point&) const = default;
};
Point p1{1, 2}, p2{3, 4};
p1 < p2;    // true
p1 == p2;   // false
p1 != p2;   // true

// std::span — non-owning view over contiguous data
#include <span>
void process(std::span<const int> data) {
    for (int x : data) { /* ... */ }
}
std::vector<int> v{1,2,3};
process(v);          // vector to span
int arr[] = {1,2,3};
process(arr);        // array to span
process({arr, 3});   // pointer + size to span

// Modules (C++20, still widely adopting)
// mymodule.ixx:
export module mymodule;
export int add(int a, int b) { return a + b; }

// consumer.cpp:
import mymodule;
int x = add(1, 2);

// jthread (auto-joining, cancellable thread — see Section 8.1)

// std::atomic<shared_ptr> (C++20) — atomic shared_ptr operations

// Calendar and timezone (C++20)
#include <chrono>
using namespace std::chrono;
auto now = system_clock::now();
auto today = floor<days>(now);
year_month_day ymd{today};
std::cout << ymd.year() << "/" << ymd.month() << "/" << ymd.day();
```

## 11.5 C++23 Key Features

```cpp
// std::expected<T, E> (see Section 9.2)

// std::flat_map / std::flat_set — sorted contiguous container (better cache performance)
#include <flat_map>
std::flat_map<std::string, int> fm;   // vector-backed sorted map
// Much better cache performance than std::map (contiguous storage vs pointer tree)
// Trade-off: O(n) insert/erase vs O(log n) for map

// std::mdspan — multi-dimensional view
#include <mdspan>
std::vector<double> data(6*4);
std::mdspan<double, std::extents<int, 6, 4>> matrix{data.data()};
matrix[2, 3] = 1.5;   // 2D access

// std::generator (coroutine generator, standardized)
#include <generator>
std::generator<int> iota(int start = 0) {
    for (int i = start; ; ++i) co_yield i;
}

// Deducing this (explicit object parameter) — for CRTP without templates, recursive lambdas
struct Base {
    void func(this auto&& self) {   // self deduces to concrete derived type
        self.derived_impl();        // CRTP-like static dispatch
    }
};

// std::print / std::println
#include <print>
std::println("Hello, {}!", name);
std::print(std::cerr, "Error: {}\n", msg);

// std::ranges::to (materialization of ranges)
auto v = iota_view | std::views::filter(even) | std::ranges::to<std::vector>();

// zip, chunk, stride, adjacent views (finalized in C++23)
for (auto [a, b] : std::views::zip(v1, v2)) {}
for (auto chunk : v | std::views::chunk(3)) {}
```

---

# SECTION 12: Undefined Behavior — The Most Critical Senior Topic

## 12.1 What is Undefined Behavior

UB means the C++ standard imposes no requirements — the compiler can do anything: crash, silently produce wrong results, delete files, or (most dangerously) appear to work correctly until a different optimization level or platform reveals the bug.

```cpp
// The optimizer ASSUMES UB never occurs and uses this to optimize aggressively
// This can cause startling transformations

// UB 1: Signed integer overflow (unsigned overflow is DEFINED — wraps)
int x = INT_MAX;
x + 1;         // UB: signed overflow (not guaranteed to wrap!)
// Optimizer: "x + 1 > x" is always true (no overflow in valid code) → may optimize away check

// Check for overflow BEFORE the operation:
bool addOverflows(int a, int b) {
    return b > 0 && a > INT_MAX - b;   // check before add
}
// Or use compiler builtins:
int result;
if (__builtin_add_overflow(a, b, &result)) { /* overflow */ }
// Or use std::numeric_limits:
if (a > std::numeric_limits<int>::max() - b) { /* overflow */ }

// UB 2: Null pointer dereference
int* p = nullptr;
*p = 42;   // UB — crash on most systems, but not guaranteed

// UB 3: Out-of-bounds array access
int arr[5];
arr[5] = 1;   // UB: writes beyond array
arr[-1] = 1;  // UB: writes before array
// No bounds checking in operator[] for raw arrays or std::vector (release builds)

// UB 4: Use after free
int* p2 = new int{42};
delete p2;
*p2 = 10;   // UB: accessing freed memory

// UB 5: Uninitialized read
int x2;
if (x2 > 0) { }  // UB: reading uninitialized variable

// UB 6: Strict aliasing violation
// Compiler assumes pointers of different types don't alias (except char*, unsigned char*, std::byte*)
float f = 3.14f;
int* ip = reinterpret_cast<int*>(&f);
int bits = *ip;   // UB: strict aliasing violation (different types alias)
// Fix: use memcpy or std::bit_cast

// UB 7: Data race (concurrent unsynchronized access)
int shared = 0;
std::thread t1([&]{ shared++; });
std::thread t2([&]{ shared++; });
// UB: both threads read/write shared without synchronization
// Fix: std::atomic<int> or mutex

// UB 8: Dereferencing end() iterator
std::vector<int> v{1, 2, 3};
*v.end();   // UB: one-past-end is not dereferenceable

// UB 9: Violating class invariants via const_cast
const int ci = 42;
*const_cast<int*>(&ci) = 0;  // UB if ci was originally declared const

// UB 10: Left shift by negative or >= width
int x3 = 1 << 32;   // UB: shift by bit width (int is 32 bits)
int x4 = 1 << -1;   // UB: negative shift

// Detecting UB:
// -fsanitize=undefined (UBSan) — catches most UB at runtime
// -fsanitize=address (ASan) — catches memory errors
// clang-tidy — static analysis
// cppcheck, PVS-Studio, SonarQube — additional static analyzers
```

**L3 SIGNAL:** Must know: (1) The optimizer assumes UB never occurs — this is a TOOL for optimization (removal of dead code, loop unrolling) but a TRAP for incorrect code. A famous example: null pointer checks after dereferencing the pointer are removed because "if execution reaches here, the pointer wasn't null (or UB occurred)" — the check is meaningless to the optimizer. (2) `-fsanitize=address,undefined` should be required in CI on debug builds. (3) Integer overflow: signed is UB, unsigned wraps (modular arithmetic). This distinction affects cryptographic code. (4) Strict aliasing: writing through `char*` or `unsigned char*` is defined, reinterpret through other types is UB. (5) The "as-if" rule: compiler can do anything that produces the same observable behavior — UB programs have no observable behavior constraints.

---

# SECTION 13: Design Patterns in C++

## 13.1 Creational Patterns

```cpp
// FACTORY METHOD
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    static std::unique_ptr<Shape> create(std::string_view type, double param);
};

class Circle : public Shape {
    double r_;
public:
    explicit Circle(double r) : r_{r} {}
    double area() const override { return 3.14159 * r_ * r_; }
};

class Square : public Shape {
    double s_;
public:
    explicit Square(double s) : s_{s} {}
    double area() const override { return s_ * s_; }
};

std::unique_ptr<Shape> Shape::create(std::string_view type, double param) {
    if (type == "circle") return std::make_unique<Circle>(param);
    if (type == "square") return std::make_unique<Square>(param);
    throw std::invalid_argument{std::string{"Unknown shape: "} + std::string{type}};
}

// SINGLETON (thread-safe via function-local static, C++11 guarantees thread-safe init)
class Database {
    Database() { /* connect */ }
public:
    static Database& instance() {
        static Database db;   // initialized once, thread-safe per C++11 spec
        return db;
    }
    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;
    void query(std::string_view sql) {}
};

// BUILDER
class HttpRequest {
public:
    class Builder {
        std::string method_{"GET"};
        std::string url_;
        std::map<std::string, std::string> headers_;
        std::string body_;
    public:
        Builder& method(std::string m) { method_ = std::move(m); return *this; }
        Builder& url(std::string u) { url_ = std::move(u); return *this; }
        Builder& header(std::string k, std::string v) { headers_[std::move(k)] = std::move(v); return *this; }
        Builder& body(std::string b) { body_ = std::move(b); return *this; }
        HttpRequest build() && {   // rvalue qualified: builder consumed
            if (url_.empty()) throw std::invalid_argument{"URL required"};
            return HttpRequest{std::move(*this)};
        }
    private:
        friend class HttpRequest;
    };

    static Builder builder() { return Builder{}; }

private:
    explicit HttpRequest(Builder&& b) : /* assign fields */ {}
};

auto req = HttpRequest::builder()
    .method("POST")
    .url("https://api.example.com/data")
    .header("Content-Type", "application/json")
    .body(R"({"key":"value"})")
    .build();
```

## 13.2 Structural Patterns

```cpp
// PIMPL (Pointer to Implementation) — reduce compile-time dependencies, hide implementation
// widget.h (public header, minimal dependencies)
class Widget {
    struct Impl;   // forward declaration, no definition needed
    std::unique_ptr<Impl> pImpl_;  // unique_ptr requires complete type at definition sites
public:
    Widget();
    ~Widget();  // must be defined in .cpp where Impl is complete
    Widget(Widget&&) noexcept;
    Widget& operator=(Widget&&) noexcept;
    void render();
    void update(int x, int y);
};

// widget.cpp (includes heavy headers here, not in widget.h)
#include "widget.h"
#include <heavy_graphics_library.h>
struct Widget::Impl {
    HeavyGraphicsObject gfx;
    int x{0}, y{0};
};
Widget::Widget() : pImpl_{std::make_unique<Impl>()} {}
Widget::~Widget() = default;   // unique_ptr destructor needs Impl to be complete here
Widget::Widget(Widget&&) noexcept = default;
Widget& Widget::operator=(Widget&&) noexcept = default;
void Widget::render()       { pImpl_->gfx.draw(); }
void Widget::update(int x, int y) { pImpl_->x = x; pImpl_->y = y; }

// Benefits: Changing Impl doesn't recompile Widget's users. Hides implementation details.
// Cost: One extra heap allocation per Widget, one extra indirection per call.

// ADAPTER
class LegacyLogger {
public:
    void writeLog(const char* msg, int level) { /* ... */ }
};

class ModernLogger {
public:
    virtual void log(std::string_view msg) = 0;
    virtual ~ModernLogger() = default;
};

class LoggerAdapter : public ModernLogger {
    LegacyLogger& legacy_;
public:
    explicit LoggerAdapter(LegacyLogger& l) : legacy_{l} {}
    void log(std::string_view msg) override {
        legacy_.writeLog(msg.data(), 0);
    }
};

// PROXY (lazy initialization, access control)
template<typename T>
class LazyInit {
    mutable std::optional<T> value_;
    mutable std::once_flag flag_;
    std::function<T()> factory_;
public:
    explicit LazyInit(std::function<T()> factory) : factory_{std::move(factory)} {}
    const T& get() const {
        std::call_once(flag_, [this]{ value_ = factory_(); });
        return *value_;
    }
    const T& operator*() const { return get(); }
    const T* operator->() const { return &get(); }
};
```

## 13.3 Behavioral Patterns

```cpp
// OBSERVER (with type-safe events)
template<typename... Args>
class Signal {
    using Slot = std::function<void(Args...)>;
    std::vector<std::pair<int, Slot>> slots_;
    int nextId_{0};
public:
    int connect(Slot slot) {
        int id = nextId_++;
        slots_.emplace_back(id, std::move(slot));
        return id;
    }
    void disconnect(int id) {
        slots_.erase(std::remove_if(slots_.begin(), slots_.end(),
            [id](const auto& s){ return s.first == id; }), slots_.end());
    }
    void emit(Args&&... args) const {
        for (const auto& [id, slot] : slots_)
            slot(args...);
    }
};

struct Button {
    Signal<> clicked;
    Signal<int, int> moved;   // x, y coordinates
};

Button btn;
int id = btn.clicked.connect([]{ std::cout << "clicked!\n"; });
btn.clicked.emit();
btn.clicked.disconnect(id);

// COMMAND (undo/redo)
class Command {
public:
    virtual ~Command() = default;
    virtual void execute() = 0;
    virtual void undo() = 0;
};

class CommandHistory {
    std::vector<std::unique_ptr<Command>> done_, undone_;
public:
    void execute(std::unique_ptr<Command> cmd) {
        cmd->execute();
        done_.push_back(std::move(cmd));
        undone_.clear();
    }
    void undo() {
        if (done_.empty()) return;
        done_.back()->undo();
        undone_.push_back(std::move(done_.back()));
        done_.pop_back();
    }
    void redo() {
        if (undone_.empty()) return;
        undone_.back()->execute();
        done_.push_back(std::move(undone_.back()));
        undone_.pop_back();
    }
};

// STRATEGY (using templates — zero overhead vs virtual dispatch)
template<typename SortStrategy>
class Sorter {
    SortStrategy strategy_;
public:
    explicit Sorter(SortStrategy s = {}) : strategy_{std::move(s)} {}
    template<typename Range>
    void sort(Range& r) { strategy_(r); }
};

struct QuickSort {
    template<typename R> void operator()(R& r) { std::sort(r.begin(), r.end()); }
};
struct StableSort {
    template<typename R> void operator()(R& r) { std::stable_sort(r.begin(), r.end()); }
};

Sorter<QuickSort> qs;
Sorter<StableSort> ss;

// VISITOR with std::variant (no virtual dispatch needed)
using Expr = std::variant<int, double, std::string>;

struct Printer {
    void operator()(int i)         { std::cout << "int(" << i << ")"; }
    void operator()(double d)      { std::cout << "double(" << d << ")"; }
    void operator()(const std::string& s) { std::cout << "str(" << s << ")"; }
};
std::visit(Printer{}, expr);
```

---

# SECTION 14: Performance-Critical C++ Patterns

## 14.1 Cache-Friendly Data Structures

```cpp
// Cache line = 64 bytes on most modern CPUs
// Accessing data not in cache: L1 miss ~5ns, L2 ~15ns, L3 ~50ns, RAM ~100ns
// A cache miss in a tight loop dominates all other costs

// AoS (Array of Structs) vs SoA (Struct of Arrays)
// AoS: common OOP layout
struct Particle {
    float x, y, z;      // position
    float vx, vy, vz;   // velocity
    float mass;
    uint32_t id;
};
std::vector<Particle> particles(10000);
// If you only need positions: loading Particle also loads velocity and mass (wasted bandwidth)

// SoA: better for SIMD, better cache utilization when accessing one field
struct ParticlesSoA {
    std::vector<float> x, y, z;    // all x positions contiguous
    std::vector<float> vx, vy, vz;
    std::vector<float> mass;
    std::vector<uint32_t> id;
};
// Physics update (only needs position + velocity): accesses contiguous arrays
// Perfect for SIMD: process 8 floats at a time with AVX2

// False sharing — two variables on same cache line, different threads
struct BadCounters {
    std::atomic<int> a{0};  // bytes 0-3
    std::atomic<int> b{0};  // bytes 4-7
    // a and b share a cache line — threads modifying a and b cause cache coherence traffic
};

struct GoodCounters {
    alignas(64) std::atomic<int> a{0};  // own cache line
    alignas(64) std::atomic<int> b{0};  // own cache line
};

// Branch prediction — predictable branches are nearly free
// Unpredictable branches: ~15 cycle misprediction penalty

// Compiler hints for branch prediction
if (__builtin_expect(condition, 1)) { /* likely */ }
if (__builtin_expect(condition, 0)) { /* unlikely */ }
// C++20: [[likely]] / [[unlikely]]
if (condition) [[likely]]   { /* likely path */ }
if (condition) [[unlikely]] { /* unlikely path */ }

// SIMD-friendly code (let the compiler auto-vectorize)
void add_arrays(float* a, const float* b, int n) {
    // Compiler can auto-vectorize with -O2 -march=native
    for (int i = 0; i < n; ++i) a[i] += b[i];
}

// Help auto-vectorization: no aliasing guarantee
void add_arrays_novoid(float* __restrict__ a, const float* __restrict__ b, int n) {
    for (int i = 0; i < n; ++i) a[i] += b[i];  // __restrict__ = no aliasing
}
```

## 14.2 Allocators and Memory Strategies

```cpp
// Custom allocator for STL containers
template<typename T>
class PoolAllocator {
    MemoryPool& pool_;
public:
    using value_type = T;
    explicit PoolAllocator(MemoryPool& pool) : pool_{pool} {}

    T* allocate(std::size_t n) {
        return static_cast<T*>(pool_.alloc(n * sizeof(T), alignof(T)));
    }
    void deallocate(T* p, std::size_t n) {
        pool_.dealloc(p, n * sizeof(T));
    }
};

MemoryPool pool{1024 * 1024};  // 1MB pool
std::vector<int, PoolAllocator<int>> poolVec{PoolAllocator<int>{pool}};
// All allocations come from pool — no system malloc overhead

// std::pmr (Polymorphic Memory Resources, C++17) — runtime-configurable allocators
#include <memory_resource>

char buffer[4096];
std::pmr::monotonic_buffer_resource mbr{buffer, sizeof(buffer)};
std::pmr::vector<int> pmrVec{&mbr};   // allocates from buffer, no heap
pmrVec.push_back(1);  // from buffer
// mbr release: all memory freed at once (fast, no individual dealloc)

// Stack allocation for small objects
template<typename T, size_t N>
class SmallVector {
    T stack_data_[N];   // on stack if <= N elements
    T* data_{stack_data_};
    size_t size_{0};
    size_t capacity_{N};

public:
    void push_back(T val) {
        if (size_ == capacity_) grow();
        data_[size_++] = std::move(val);
    }

    void grow() {
        auto new_cap = capacity_ * 2;
        T* new_data = new T[new_cap];
        std::move(data_, data_ + size_, new_data);
        if (data_ != stack_data_) delete[] data_;
        data_ = new_data;
        capacity_ = new_cap;
    }
    // ... rest of interface
};
// llvm::SmallVector is a famous real-world example
```

## 14.3 Compile-Time Computation

```cpp
// constexpr: evaluated at compile time if possible, runtime if necessary
constexpr int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}
constexpr int fib10 = fibonacci(10);   // computed at compile time
static_assert(fib10 == 55);

// consteval: MUST be evaluated at compile time (C++20)
consteval int square(int n) { return n * n; }
constexpr int s = square(5);   // OK
int x = 5;
// int y = square(x);   // ERROR: x is not constexpr

// constinit: variable is constant-initialized (C++20)
constinit int globalCounter = 0;  // guaranteed no dynamic initialization
// constinit ensures no "static initialization order fiasco" for this variable

// Compile-time lookup table
constexpr auto makeTable() {
    std::array<int, 256> table{};
    for (int i = 0; i < 256; ++i)
        table[i] = (i * i) % 251;   // some hash
    return table;
}
constexpr auto lookupTable = makeTable();   // in .rodata section, computed at compile time

// Type list operations (TMP)
template<typename... Ts>
struct TypeList {
    static constexpr size_t size = sizeof...(Ts);
};

template<typename T, typename List>
struct Contains;

template<typename T, typename... Ts>
struct Contains<T, TypeList<Ts...>>
    : std::bool_constant<(std::is_same_v<T, Ts> || ...)> {};

static_assert(Contains<int, TypeList<float, int, double>>::value);
static_assert(!Contains<char, TypeList<float, int, double>>::value);
```

---

# SECTION 15: String Handling in C++

## 15.1 String Types Comparison

```cpp
// std::string (std::basic_string<char>)
// - Owning, heap-allocated (usually, modulo SSO)
// - Mutable
// - NUL-terminated (\0 at end, but may contain embedded \0)
std::string s{"hello"};
s += " world";
s.length();       // or .size()
s.empty();
s.substr(0, 5);   // new string (heap allocation)
s.find("llo");    // returns position or std::string::npos
s.c_str();        // const char* (NUL-terminated, valid until s modified or destroyed)
s.data();         // char* (C++17: non-const), same as c_str() but not required NUL-terminated pre-C++11

// Small String Optimization (SSO):
// Most implementations store short strings (typically <16 or <23 chars) inline in the string object
// No heap allocation for short strings — check with capacity/sizeof
sizeof(std::string)   // typically 24 or 32 bytes on 64-bit
std::string short_s{"hi"};  // no heap allocation (SSO)
std::string long_s(100, 'x');  // heap allocation

// std::string_view (C++17) — non-owning, read-only view
// - No allocation
// - O(1) substr (just adjusts pointer and length, no copy)
// - Use for function parameters where string is only read
std::string_view sv = s;   // view of s
sv.substr(0, 5);           // O(1), returns string_view (no allocation)
// DANGER: string_view does not extend lifetime
std::string_view danger() {
    std::string local = "hello";
    return local;   // DANGLING: local destroyed, string_view invalid
}

// Function parameter types:
// by value std::string: use when you need ownership or will std::move
// const std::string&: use when caller must have std::string (prevents string_view/char*)
// std::string_view: most flexible non-owning parameter (accepts string, char*, literal)
void process(std::string_view sv) { /* accepts all string-like types */ }
process("literal");           // const char* — no conversion needed
process(s);                   // std::string — no copy
process(sv2);                 // string_view — no copy

// std::format (C++20) — type-safe formatting
std::string result = std::format("{} + {} = {}", 1, 2, 3);

// std::string conversion
std::to_string(42);          // int to string
std::stoi("42");             // string to int (throws on invalid)
std::stod("3.14");           // string to double

// String operations
std::string upper = s;
std::transform(upper.begin(), upper.end(), upper.begin(), ::toupper);

// Split string (no stdlib split, common patterns)
std::vector<std::string> split(std::string_view str, char delim) {
    std::vector<std::string> tokens;
    size_t start = 0, end;
    while ((end = str.find(delim, start)) != std::string_view::npos) {
        tokens.emplace_back(str.substr(start, end - start));
        start = end + 1;
    }
    tokens.emplace_back(str.substr(start));
    return tokens;
}

// C++23: ranges-based split
auto tokens = std::string_view{"a,b,c"} | std::views::split(',');
```

---

# SECTION 16: Input/Output Streams and Filesystem

## 16.1 Stream I/O

```cpp
#include <iostream>
#include <fstream>
#include <sstream>

// Console I/O
std::cout << "Value: " << x << "\n";   // "\n" preferred over std::endl (endl flushes)
std::cerr << "Error: " << msg << "\n"; // unbuffered error stream
std::cout.flush();                      // explicit flush when needed

// std::cin
int n;
std::cin >> n;                 // skip whitespace, read int
std::string line;
std::getline(std::cin, line);  // read full line including spaces

// Check for errors
if (!(std::cin >> n)) {
    std::cin.clear();          // clear error state
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
}

// File I/O
std::ifstream in{"data.txt"};
if (!in) throw std::runtime_error{"Cannot open data.txt"};
std::string word;
while (in >> word) { process(word); }  // read word by word
std::string line2;
while (std::getline(in, line2)) { processLine(line2); }  // line by line

// Write to file
std::ofstream out{"output.txt", std::ios::app};  // append mode
out << "Result: " << result << "\n";
out.close();   // explicit or let destructor handle

// Binary file I/O
std::ifstream bin{"data.bin", std::ios::binary};
int value;
bin.read(reinterpret_cast<char*>(&value), sizeof(value));

std::ofstream bout{"out.bin", std::ios::binary};
bout.write(reinterpret_cast<const char*>(&value), sizeof(value));

// String streams — in-memory I/O
std::ostringstream oss;
oss << "x=" << x << ", y=" << y;
std::string s = oss.str();

std::istringstream iss{"42 3.14 hello"};
int i; double d; std::string w;
iss >> i >> d >> w;   // 42, 3.14, "hello"

// std::filesystem (C++17)
#include <filesystem>
namespace fs = std::filesystem;

fs::path p{"dir/subdir/file.txt"};
p.filename();         // "file.txt"
p.extension();        // ".txt"
p.stem();             // "file"
p.parent_path();      // "dir/subdir"
p / "another.txt";    // append path component

fs::exists(p);
fs::is_regular_file(p);
fs::is_directory(p);
fs::file_size(p);
fs::last_write_time(p);

fs::create_directory("newdir");
fs::create_directories("a/b/c");
fs::remove("file.txt");
fs::remove_all("dir");   // recursive
fs::copy("src", "dst", fs::copy_options::recursive);
fs::rename("old.txt", "new.txt");

for (const auto& entry : fs::recursive_directory_iterator(".")) {
    if (entry.is_regular_file() && entry.path().extension() == ".cpp")
        std::cout << entry.path() << "\n";
}
```

---

# SECTION 17: Inheritance, Virtual Dispatch, and Polymorphism at Scale

## 17.1 Alternatives to Virtual Dispatch

```cpp
// Problem: virtual dispatch is hard to inline, requires RTTI/vtable, scattered icache

// ALTERNATIVE 1: CRTP (Curiously Recurring Template Pattern)
// Static polymorphism — dispatch resolved at compile time, can inline
template<typename Derived>
class Shape {
public:
    double area() const {
        return static_cast<const Derived*>(this)->area_impl();
    }
    void draw() const {
        static_cast<const Derived*>(this)->draw_impl();
    }
};

class Circle : public Shape<Circle> {
    double r_;
public:
    explicit Circle(double r) : r_{r} {}
    double area_impl() const { return 3.14159 * r_ * r_; }
    void draw_impl() const { /* ... */ }
};

// Works at compile time, full inlining:
template<typename S>
void printArea(const Shape<S>& s) { std::cout << s.area(); }
printArea(Circle{5.0});   // direct call, no virtual dispatch

// ALTERNATIVE 2: std::variant + std::visit (sum type)
using Shape2 = std::variant<Circle, Square, Triangle>;
std::vector<Shape2> shapes;
for (const auto& s : shapes) {
    double a = std::visit([](const auto& shape){ return shape.area(); }, s);
}
// Benefits: no heap allocation per object, better cache behavior, closed set of types
// Drawback: closed set (adding new type requires changing variant), switch-like dispatch

// ALTERNATIVE 3: Type erasure (manual or via std::any/std::function)
class AnyDrawable {
    struct Base { virtual void draw() const = 0; virtual ~Base() = default; };
    template<typename T>
    struct Concrete : Base {
        T obj_;
        Concrete(T o) : obj_{std::move(o)} {}
        void draw() const override { obj_.draw(); }
    };
    std::unique_ptr<Base> impl_;
public:
    template<typename T>
    AnyDrawable(T obj) : impl_{std::make_unique<Concrete<T>>(std::move(obj))} {}
    void draw() const { impl_->draw(); }
};
// Used by std::function internally
```

---

# SECTION 18: Testing, Debugging, and Profiling

## 18.1 Testing Frameworks

```cpp
// Google Test (most widely used)
#include <gtest/gtest.h>

// Basic assertions
TEST(CalculatorTest, AddPositives) {
    Calculator calc;
    EXPECT_EQ(calc.add(2, 3), 5);      // non-fatal: continues on failure
    ASSERT_EQ(calc.add(2, 3), 5);      // fatal: stops test on failure
    EXPECT_NEAR(calc.divide(1.0, 3.0), 0.333, 1e-3);  // floating point
    EXPECT_THROW(calc.divide(1, 0), std::invalid_argument);  // exception check
    EXPECT_NO_THROW(calc.add(1, 2));
}

// Fixtures — shared setup/teardown
class DatabaseTest : public ::testing::Test {
protected:
    Database db_;
    void SetUp() override    { db_.connect("test_db"); }
    void TearDown() override { db_.disconnect(); }
};

TEST_F(DatabaseTest, InsertAndRetrieve) {
    db_.insert({1, "Alice"});
    auto user = db_.findById(1);
    ASSERT_TRUE(user.has_value());
    EXPECT_EQ(user->name, "Alice");
}

// Parameterized tests
class SqrtTest : public testing::TestWithParam<std::pair<double, double>> {};
TEST_P(SqrtTest, ComputesCorrectly) {
    auto [input, expected] = GetParam();
    EXPECT_NEAR(std::sqrt(input), expected, 1e-5);
}
INSTANTIATE_TEST_SUITE_P(Values, SqrtTest, testing::Values(
    std::pair{4.0, 2.0}, std::pair{9.0, 3.0}, std::pair{16.0, 4.0}
));

// Google Mock
#include <gmock/gmock.h>
class MockDatabase : public IDatabase {
public:
    MOCK_METHOD(std::optional<User>, findById, (int id), (override));
    MOCK_METHOD(void, insert, (const User& u), (override));
};

TEST(UserServiceTest, FetchesUser) {
    MockDatabase db;
    EXPECT_CALL(db, findById(42))
        .WillOnce(testing::Return(User{42, "Alice"}));
    UserService svc{db};
    auto user = svc.getUser(42);
    EXPECT_EQ(user.name, "Alice");
}

// Catch2 (header-only alternative)
#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>
TEST_CASE("Vector operations", "[vector]") {
    std::vector<int> v{1, 2, 3};
    REQUIRE(v.size() == 3);
    SECTION("push_back") {
        v.push_back(4);
        REQUIRE(v.size() == 4);
        REQUIRE(v.back() == 4);
    }
}
```

## 18.2 Profiling and Benchmarking

```cpp
// Google Benchmark
#include <benchmark/benchmark.h>

static void BM_VectorSort(benchmark::State& state) {
    std::vector<int> data(state.range(0));
    std::iota(data.begin(), data.end(), 0);
    std::shuffle(data.begin(), data.end(), std::mt19937{42});

    for (auto _ : state) {
        auto copy = data;           // copy to sort fresh each iteration
        std::sort(copy.begin(), copy.end());
        benchmark::DoNotOptimize(copy.data());  // prevent dead code elimination
        benchmark::ClobberMemory();             // force memory writes to be visible
    }
    state.SetItemsProcessed(state.iterations() * state.range(0));
}
BENCHMARK(BM_VectorSort)->Range(8, 8<<14);  // sizes 8 to 131072

BENCHMARK_MAIN();

// perf (Linux profiler)
// perf stat ./myapp         — CPU counter summary
// perf record ./myapp       — sampling profiler
// perf report               — view profile (call graph)

// valgrind --tool=callgrind ./myapp   — instruction-level profiling
// kcachegrind cachegrind.out.*        — GUI viewer

// gprof: -pg compiler flag, then gprof myapp gmon.out

// Sanitizers (compile flags):
// -fsanitize=address       — heap/stack buffer overflow, use-after-free, leaks
// -fsanitize=undefined     — UB: signed overflow, null deref, alignment, etc.
// -fsanitize=thread        — data races
// -fsanitize=memory        — uninitialized reads

// clang-tidy static analysis
// cppcheck --enable=all --std=c++20 src/

// Quick timing
#include <chrono>
auto start = std::chrono::high_resolution_clock::now();
// ... work ...
auto end = std::chrono::high_resolution_clock::now();
auto dur = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
std::cout << dur.count() << "us\n";
```

---

# SECTION 19: ABI, Linkage, and Library Design

## 19.1 ABI Stability

ABI (Application Binary Interface) defines how compiled code interacts at the binary level: function calling conventions, name mangling, vtable layout, data structure layout.

```
ABI-breaking changes (require recompile of all users):
- Adding virtual function to class (changes vtable)
- Adding member variable to class (changes sizeof)
- Changing function signature (changes mangled name / calling convention)
- Changing base class (changes layout)
- Changing enum underlying type
- Changing non-inline function body that was inline

ABI-stable changes (safe to change without recompile):
- Adding non-virtual member functions
- Adding static member variables
- Adding private member variables (if PIMPL used)
- Changing function bodies of out-of-line functions
- Adding new non-virtual classes
```

```cpp
// Stable ABI patterns:
// 1. Opaque handle (C-compatible)
typedef struct MyObject_ MyObject;
MyObject* createMyObject(int x);
void destroyMyObject(MyObject* obj);
int getX(const MyObject* obj);

// 2. PIMPL (see Section 13.2) — hides member layout
// 3. Abstract interface + factory
struct IService {
    virtual ~IService() = default;
    virtual void execute(int x) = 0;
    static std::unique_ptr<IService> create();  // factory returns by interface
};
// Adding members to IService's impl doesn't affect callers

// Name mangling: C++ mangles function names to encode types
// extern "C" disables mangling for C compatibility:
extern "C" {
    void c_api_function(int x, double y);  // _c_api_function in symbol table
}
// C++ function: mangled to _Z18c_api_function_v1id or similar

// Inspecting symbols
// nm -D mylib.so      — list dynamic symbols
// c++filt _Z3fooi    — demangle mangled name
// objdump -d myapp    — disassemble
// ldd myapp           — list shared library dependencies
```

---

# SECTION 20: C++ Interview Signal Reference Matrix

## 20.1 Assessment Matrix by Topic

| Topic | Junior (L1) Signal | Mid (L2) Signal | Senior (L3) Signal |
|---|---|---|---|
| Memory model | Knows heap vs stack, new/delete | RAII, smart pointers, Rule of Five | Custom allocators, PMR, pool design, ABI |
| Move semantics | Knows move exists | Implements noexcept move, Rule of Five | noexcept impact on vector, NRVO, forwarding refs |
| Templates | Uses templates, knows generics | SFINAE, template specialization, CRTP | Concepts, TMP, variadic, fold expressions |
| Concurrency | Knows threads exist | mutex, lock_guard, futures | Memory ordering, lock-free, ABA, false sharing |
| Undefined behavior | Avoids obvious bugs | Knows common UB sources, uses sanitizers | Optimizer implications, strict aliasing, UBSan |
| STL | Uses vector, map | Iterator invalidation, complexity analysis | Allocators, custom hash, PMR containers |
| Virtual dispatch | Uses polymorphism | vtable cost, override keyword, Rule of Five | CRTP, variant+visit, devirtualization, ABI |
| Exceptions | Writes try/catch | noexcept semantics, exception guarantees | Error code vs exception decision, noexcept vectors |
| Build system | Compiles with CMake | CMake targets, flags, sanitizers | Modules, LTO, PGO, cross-compilation |
| Performance | Avoids obvious issues | Cache basics, avoid copies, benchmark | Cache miss profiling, SIMD hints, allocation strategy |
| const correctness | Uses const | const member functions, const references | Bitwise vs logical const, mutable, volatile |
| Design patterns | Names patterns | Implements PIMPL, RAII, smart factory | ABI-stable API design, zero-cost abstraction |

---

## 20.2 Red Flag Signals

### L1 Junior Red Flags
- Uses raw `new`/`delete` without explanation
- Does not know the difference between `delete` and `delete[]`
- Does not know what a destructor is
- Cannot explain the difference between a pointer and a reference
- Uses `NULL` instead of `nullptr`
- Does not know that `struct` vs `class` only differs in default access
- Cannot write a simple class with constructor, destructor, and member function
- Does not know what `const` means on a member function

### L2 Mid Red Flags
- Does not know the Rule of Five (or Rule of Zero)
- Cannot explain RAII or give an example
- Does not know `std::unique_ptr` vs `std::shared_ptr`
- Uses `std::shared_ptr` everywhere regardless of ownership semantics
- Does not know what `override` does (vs implicit override)
- Cannot explain iterator invalidation in vector
- Does not know `noexcept` on move constructor affects vector behavior
- Cannot write a basic template function
- Uses `std::endl` everywhere (unnecessary flush cost)
- Does not handle errors in system calls (fopen, malloc, etc.)

### L3 Senior Red Flags
- Cannot explain what undefined behavior means practically (just "don't do it")
- Does not know the memory ordering model (`memory_order_acquire` etc.)
- Cannot discuss vtable layout and its ABI implications
- Does not know the difference between `std::thread` and `std::async`
- Cannot explain false sharing or how to detect/fix it
- Does not know CRTP or alternatives to virtual dispatch for performance
- Cannot discuss trade-offs between `std::variant`, virtual dispatch, and type erasure
- Always uses `std::shared_ptr` for "safety" without considering ownership semantics
- Does not know what happens to moved-from objects (valid but unspecified state)
- Cannot describe NRVO/RVO and when `return std::move(local)` is wrong
- Proposes mutex-protected data structure without considering contention patterns
- Cannot read a gprof/perf output or understand what cache miss ratio means

---

# SECTION 21: Comprehensive Gotcha Cheat Sheet

| Code / Scenario | Behavior | Why / Fix |
|---|---|---|
| `int* p = new int; delete[] p;` | UB | Scalar new, array delete mismatch |
| `int arr[5]; arr[5] = 1;` | UB | Out of bounds, no runtime check on raw array |
| `int x; if (x > 0)` | UB | Uninitialized read |
| `int max = INT_MAX; max + 1;` | UB | Signed integer overflow |
| `void f(Animal a)` called with `Dog` | Slicing | Dog data lost; pass by reference/pointer |
| `delete ptr; delete ptr;` | UB / crash | Double free; set to nullptr after delete |
| `std::string_view sv = func_returning_string();` | Dangling | func returns temporary, sv dangles |
| `vector.push_back(x); *it = y;` | UB | iterator invalidated by push_back (realloc) |
| `std::thread t{f}; /* no join */` | `std::terminate` | Thread not joined or detached before dtor |
| `float a, b; reinterpret_cast<int*>(&a)` | UB (strict aliasing) | Use memcpy or std::bit_cast |
| `shared_ptr<T>{obj.get()}` | Double free | Two shared_ptrs own same object |
| `return &localVar;` | UB (dangling) | Local destroyed at return |
| `new T[n]` freed with `delete` | UB | Must use `delete[]` for array allocation |
| `dynamic_cast<D*>(b)` no virtual | Compile error | Needs at least one virtual function |
| `static int x = init(); // multi-thread` | Safe C++11 | Function-local static init is thread-safe |
| `i = i++;` | UB (pre-C++17) | Undefined sequencing; C++17 defines it |
| `char* p; int* ip = (int*)p;` | Potential UB | C-style cast hides alignment/aliasing issue |
| Recursive descent > ~10k levels | Stack overflow | Use trampoline or iterative |
| `std::vector<bool>` | Special case | Bit-packed, `[]` returns proxy, not `bool&` |
| `memset` on non-trivial type | UB | Skips constructor/destructor logic |

---

## 21.2 std::vector\<bool\> Special Case

```cpp
// std::vector<bool> is NOT a normal vector<T> — it's bit-packed
// operator[] returns a PROXY object, not bool&
std::vector<bool> v{true, false, true};
// auto& ref = v[0];   // ref is a proxy, not bool&
// bool* p = &v[0];   // ERROR: cannot take address of proxy

// WORKAROUNDS:
// 1. Use std::vector<char> or std::vector<uint8_t>
// 2. Use std::deque<bool> (normal element access)
// 3. Use std::bitset<N> for fixed size

// auto with vector<bool>:
auto val = v[0];   // val is proxy, not bool
bool actual = v[0];   // converts proxy to bool — safe
```

---

# SECTION 22: C++ Core Guidelines — Key Rules Summary

```
Resource Management:
R.1:  Manage resources via RAII
R.3:  A raw pointer is non-owning
R.4:  A raw reference is non-owning
R.5:  Prefer scoped objects, don't heap-allocate unnecessarily
R.10: Avoid malloc/free
R.11: Avoid new/delete explicitly (use smart pointers)
R.20: Use unique_ptr or shared_ptr to represent ownership
R.21: Prefer unique_ptr over shared_ptr unless shared ownership required
R.22: Use make_shared to create shared_ptr
R.23: Use make_unique to create unique_ptr

Interfaces:
I.3:  Avoid singletons
I.11: Never transfer ownership by raw pointer or reference
I.23: Keep number of function arguments low

Classes:
C.2:  Use class if the class has an invariant; use struct if all data members are public
C.7:  Don't define a class or enum and declare a variable of its type in the same statement
C.20: If you can avoid defining any default operations, do
C.21: If you define or =delete any default operation, define or =delete them all
C.31: All resources acquired by a class must be released by the class's destructor
C.35: A base class destructor should be either public and virtual, or protected and non-virtual
C.36: A destructor must not fail (it is noexcept by default since C++11)
C.80: Use =default if you have to be explicit about using the default semantics
C.82: Don't call virtual functions in constructors and destructors

Concurrency:
CP.1:  Assume your code will run as part of a multi-threaded program
CP.20: Use RAII, never plain lock/unlock
CP.22: Never call unknown code while holding a lock
CP.42: Don't wait without a condition
CP.200: Use volatile only to talk to non-C++ memory (hardware registers, signal handlers)
```

---

# SECTION 23: Ecosystem, Tools, and Build Infrastructure

## 23.1 Key Libraries and Their Use Cases

| Library | Purpose | When to Choose |
|---|---|---|
| Boost | Foundational utilities (many now in STL) | Platform support, legacy code, before STL adopted feature |
| Abseil | Google's C++ common libraries | Strings, containers, time, synchronization primitives |
| {fmt} | Fast, type-safe string formatting | C++17 projects without `<format>`, or for logging speed |
| spdlog | Structured, fast logging | Production logging with sink flexibility |
| nlohmann/json | JSON parsing/serialization | Easy API, header-only, good ergonomics |
| simdjson | SIMD-accelerated JSON parsing | High-throughput JSON ingestion, 2-4x faster than nlohmann |
| Catch2 | Test framework (header-only) | Simple setup, good test organization |
| Google Test | Test + Mock framework | Most industry-standard, powerful mocking |
| Google Benchmark | Micro-benchmarking | Performance regression testing |
| CMake | Build system | De-facto standard, most package managers support it |
| Conan / vcpkg | Package managers | Dependency management |
| clang-tidy | Static analysis | Lint, enforce guidelines |
| ASan/UBSan/TSan | Runtime sanitizers | CI debug builds |
| valgrind | Memory error detection | Slower but comprehensive |
| perf / VTune | CPU profiling | Performance bottleneck identification |
| Protocol Buffers | Binary serialization | Cross-language RPC, compact wire format |
| gRPC | RPC framework | Service-to-service communication |
| Asio / libuv | Async I/O | Network servers, event-driven architecture |

## 23.2 Compiler Comparison

| Feature | GCC | Clang | MSVC |
|---|---|---|---|
| Standard compliance | Excellent | Excellent | Good (C++17+) |
| Error messages | Good | Best (human-readable) | Good |
| Optimization | Excellent (PGO, LTO) | Excellent | Good |
| Sanitizers | ASan, UBSan, TSan | ASan, UBSan, TSan, MSan | Limited |
| Static analysis | clang-tidy (separate) | clang-tidy built-in | /analyze |
| Modules | C++20 partial | C++20 partial | Better support |
| Compilation speed | Good | Faster incremental | Good |
| Platform | Linux/macOS primary | Linux/macOS/Windows | Windows primary |

---

# SECTION 24: Patterns for Scale — When C++ Architecture Matters

## 24.1 Architectural Trade-offs (Senior Differentiation Zone)

### Virtual dispatch at scale
Virtual functions add indirection (vtable), prevent inlining, and scatter call targets across memory. For hot loops (physics engines, parsers, game engines), this causes branch predictor failures and icache thrashing. Solutions: CRTP for static polymorphism, `std::variant + std::visit` for closed type sets, sort-by-type to batch same virtual calls together (improving branch prediction).

### Inheritance vs composition
Deep inheritance hierarchies create rigid coupling, fragile base class problem (changing base breaks all derived), and ABI instability. Prefer composition (has-a) over inheritance (is-a) for implementation reuse. Reserve inheritance for true Liskov Substitution Principle relationships (behavioral subtyping, not code reuse).

### Memory allocation patterns
`std::allocator` (new/malloc) in tight loops causes heap fragmentation and allocation latency. For performance-critical code: monotonic/arena allocators (all-at-once release), pool allocators (fixed-size blocks), stack allocation (alloca, VLAs, or SmallVector pattern). `std::pmr` (C++17) standardizes this via swappable memory resources.

### Lock granularity
Coarse-grained locking (one mutex for entire data structure) is safe but serializes all access. Fine-grained locking allows concurrency but risks deadlock (lock ordering required). Lock-free algorithms (CAS-based) avoid blocking but are complex (ABA problem, memory ordering, hazard pointers). For most use cases: fine-grained locking is the right trade-off. Lock-free only when profiling proves lock contention is the bottleneck.

### Template code bloat
Each template instantiation generates new code. `vector<int>` and `vector<double>` are distinct instantiations. In large codebases with many template types, this causes binary bloat and longer link times. Solutions: Explicit instantiation, type erasure to share code across types, extern template to avoid instantiation in multiple TUs.

```cpp
// extern template: prevent re-instantiation across TUs
// In header:
extern template class std::vector<MyExpensiveType>;
// In one .cpp:
template class std::vector<MyExpensiveType>;   // explicit instantiation here only

// Explicit instantiation (reduce binary size):
template int max_val<int>(int, int);      // instantiated here
template double max_val<double>(double, double);
// Other TUs will use these, not generate their own
```

---

# SECTION 25: Senior Differentiator Questions for AI Interviewer

## Q1: Performance Diagnosis
> "A C++ server processing 100,000 requests/second has tail latency spikes of 50ms every 10 seconds. How do you diagnose?"

**Expected answer covers:** Perf/VTune to identify hotspots, checking for major GC (tcmalloc/jemalloc stats, heap fragmentation), memory allocation patterns (many small allocations → switch to pool/PMR), cache miss analysis (hardware counters), lock contention (TSan, `perf lock`), checking for `std::endl` flushes, verifying noexcept on moves in vectors (missed move → copies), checking for false sharing in shared data structures, inspecting system call patterns (`strace` frequency).

## Q2: API Design Trade-off
> "You need a polymorphic collection of shapes for a rendering engine processing 60fps. Would you use virtual dispatch, std::variant, or CRTP? Why?"

**Expected answer:** Depends on requirements. Open set of shapes (plugin system, user types) → virtual dispatch (only option). Closed set of known shapes, performance-critical → `std::variant + std::visit` (value semantics, no heap per shape, better cache). Compile-time known shapes, maximum performance → CRTP (inlined, devirtualized, but requires templates throughout). Senior engineers also mention: sorting shapes by type before rendering batch improves branch prediction even with virtual dispatch.

## Q3: Undefined Behavior in Practice
> "This code 'works' in debug but silently computes wrong results in release. What's happening?"

```cpp
int x = 2147483647;
if (x + 1 > x) { /* optimizer removes this — always true with no overflow */ }
```

**Expected answer:** Signed integer overflow is undefined behavior. The optimizer proves `x + 1 > x` is always true (because if it weren't, overflow would have occurred, which is UB the optimizer assumes can't happen) — and removes the check. In release mode, this can remove safety checks. Fix: use `__builtin_add_overflow`, compare before adding, or use `unsigned int` (defined wrapping behavior).

## Q4: Concurrency Architecture
> "Design a thread-safe LRU cache that supports high concurrency with minimal lock contention."

**Expected answer:** Segmented locks (N mutexes, key % N → shard) for O(1) lookup per shard with low contention. Or lock-free with carefully ordered atomics. Must discuss: read/write lock vs exclusive lock trade-off (reads dominate → `shared_mutex`). Cache eviction: can use a background thread with work queue to amortize eviction cost. False sharing: ensure cache lines between shards don't overlap (`alignas(64)`). TTL expiry: lazy expiry (check on access) vs active expiry (background thread).

## Q5: Template Design Decision
> "When would you use a virtual function vs a template vs std::function for a callback mechanism?"

**Expected answer:** Virtual function — runtime polymorphism needed, callback type unknown at compile time, callback stored in heterogeneous collection (e.g., plugin system). Template — callback type known at compile time, zero-overhead is critical, monomorphization acceptable (increased binary size). `std::function` — runtime polymorphism with value semantics, stored in containers, traded against overhead (small heap allocation, no inlining). Also mention: `std::move_only_function` (C++23) for move-only callbacks, and the design question of whether you need a single callback or a slot with multiple subscribers.

---

*End of C++ RAG Knowledge Base — optimized for semantic chunking on `##` section boundaries*
*Coverage: C++11 through C++23 · 25 Sections · Junior to Senior signal mapping*