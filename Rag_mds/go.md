# Golang RAG Knowledge Base — Complete Technical Reference
## AI Interviewer Context Document | Three-Level Seniority Model

---

# SECTION 1: LANGUAGE FUNDAMENTALS

## 1.1 Variables, Types, and Declarations

```go
package main

import "fmt"

func main() {
    // var declaration — explicit type
    var age int = 25
    var name string = "Alice"
    var isActive bool = true

    // var with type inference
    var score = 98.5 // inferred as float64

    // short variable declaration — only inside functions
    count := 42
    message := "hello"

    // multiple assignment
    x, y := 10, 20
    x, y = y, x // swap without temp variable

    // blank identifier — discard values
    value, _ := someFunction()

    // zero values — Go initializes everything
    var i int        // 0
    var f float64    // 0.0
    var s string     // ""
    var b bool       // false
    var p *int       // nil
    var sl []int     // nil
    var m map[string]int // nil

    // constants
    const Pi = 3.14159
    const MaxRetries = 3
    const Greeting = "Hello"

    // typed constants
    const TypedPi float64 = 3.14159

    // iota — auto-incrementing constant
    const (
        Sunday = iota // 0
        Monday        // 1
        Tuesday       // 2
        Wednesday     // 3
        Thursday      // 4
        Friday        // 5
        Saturday      // 6
    )

    // iota with expressions
    const (
        _  = iota // skip 0
        KB = 1 << (10 * iota) // 1024
        MB                    // 1048576
        GB                    // 1073741824
        TB
    )

    fmt.Println(age, name, isActive, score, count, message, x, y, value)
}
```

---

## 1.2 Basic Types

```go
// Numeric types
var i8 int8   = 127           // -128 to 127
var i16 int16 = 32767
var i32 int32 = 2147483647
var i64 int64 = 9223372036854775807
var i int     = 42            // platform-dependent (32 or 64 bit)

var u8  uint8  = 255          // 0 to 255 (alias: byte)
var u16 uint16 = 65535
var u32 uint32 = 4294967295
var u64 uint64 = 18446744073709551615
var u  uint    = 42

var f32 float32 = 3.14
var f64 float64 = 3.141592653589793 // default float literal type

var c64  complex64  = 1 + 2i
var c128 complex128 = 3 + 4i

var r rune = 'A'   // alias for int32, Unicode code point
var by byte = 'A'  // alias for uint8

// string — immutable sequence of bytes (UTF-8 encoded)
var s string = "Hello, 世界"
fmt.Println(len(s))           // 13 bytes, not 9 characters
fmt.Println([]rune(s))        // convert to rune slice for character iteration

// Iterating strings correctly
for i, ch := range s {
    fmt.Printf("index %d: %c (U+%04X)\n", i, ch, ch)
}

// Type conversions — explicit, no implicit conversion
var a int = 42
var b float64 = float64(a)     // int → float64
var c int = int(b)             // float64 → int (truncates)
var d string = string(rune(65)) // int → string via rune
// string(42) is NOT "42" — it gives the character with Unicode point 42

// strconv for string/number conversion
import "strconv"
numStr := strconv.Itoa(42)         // int → "42"
num, err := strconv.Atoi("42")     // "42" → int
fStr := strconv.FormatFloat(3.14, 'f', 2, 64) // "3.14"
f, err := strconv.ParseFloat("3.14", 64)
```

---

## 1.3 Control Flow

```go
// if — no parentheses, braces required
if x > 0 {
    fmt.Println("positive")
} else if x < 0 {
    fmt.Println("negative")
} else {
    fmt.Println("zero")
}

// if with init statement — scope limited to if block
if err := doSomething(); err != nil {
    fmt.Println("error:", err)
    return
}

// for — Go's only loop
// traditional
for i := 0; i < 10; i++ {
    fmt.Println(i)
}

// while-style
n := 0
for n < 10 {
    n++
}

// infinite loop
for {
    if done { break }
}

// range over slice
nums := []int{1, 2, 3, 4, 5}
for i, v := range nums {
    fmt.Println(i, v)
}
for _, v := range nums { /* index not needed */ }
for i := range nums { /* value not needed */ }

// range over map
m := map[string]int{"a": 1, "b": 2}
for k, v := range m {
    fmt.Println(k, v) // order NOT guaranteed
}

// range over string (runes, not bytes)
for i, ch := range "hello" {
    fmt.Println(i, ch) // ch is rune (int32)
}

// range over channel
for v := range ch {
    fmt.Println(v) // blocks until channel closed
}

// switch — no fallthrough by default
switch day {
case "Monday", "Tuesday", "Wednesday", "Thursday", "Friday":
    fmt.Println("Weekday")
case "Saturday", "Sunday":
    fmt.Println("Weekend")
default:
    fmt.Println("Unknown")
}

// switch with no condition (replaces if-else chain)
switch {
case score >= 90:
    fmt.Println("A")
case score >= 80:
    fmt.Println("B")
default:
    fmt.Println("C")
}

// switch with init statement
switch err := doWork(); {
case err == nil:
    fmt.Println("success")
case errors.Is(err, ErrNotFound):
    fmt.Println("not found")
default:
    fmt.Println("error:", err)
}

// fallthrough — explicit
switch n {
case 1:
    fmt.Println("one")
    fallthrough
case 2:
    fmt.Println("one or two")
}

// goto — rare but valid
for i := 0; i < 10; i++ {
    if i == 5 { goto done }
}
done:
fmt.Println("done")

// labeled break/continue
outer:
for i := 0; i < 3; i++ {
    for j := 0; j < 3; j++ {
        if j == 1 { continue outer }
        if i == 2 { break outer }
    }
}

// defer — runs when surrounding function returns (LIFO order)
func processFile(path string) error {
    f, err := os.Open(path)
    if err != nil { return err }
    defer f.Close() // called when processFile returns

    // Multiple defers — LIFO
    defer fmt.Println("last defer — runs first")
    defer fmt.Println("first defer — runs last")

    return processData(f)
}

// defer with closure captures current value
for i := 0; i < 3; i++ {
    i := i // shadow to capture current value
    defer func() { fmt.Println(i) }()
}
// prints 2, 1, 0
```

---

## 1.4 Functions

```go
// Basic function
func add(a, b int) int {
    return a + b
}

// Multiple return values — idiomatic Go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 3)
if err != nil {
    log.Fatal(err)
}

// Named return values
func minMax(nums []int) (min, max int) {
    if len(nums) == 0 { return 0, 0 }
    min, max = nums[0], nums[0]
    for _, n := range nums[1:] {
        if n < min { min = n }
        if n > max { max = n }
    }
    return // naked return — returns named values
}

// Variadic functions
func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}
sum(1, 2, 3)
nums := []int{1, 2, 3}
sum(nums...) // spread slice

// Functions are first-class values
add := func(a, b int) int { return a + b }

// Higher-order functions
func apply(fn func(int) int, values []int) []int {
    result := make([]int, len(values))
    for i, v := range values {
        result[i] = fn(v)
    }
    return result
}

doubled := apply(func(n int) int { return n * 2 }, []int{1, 2, 3})

// Closures
func counter(start int) func() int {
    count := start
    return func() int {
        count++
        return count
    }
}
c := counter(0)
c() // 1
c() // 2

// Recursive functions
func fibonacci(n int) int {
    if n <= 1 { return n }
    return fibonacci(n-1) + fibonacci(n-2)
}

// defer + named return for cleanup pattern
func openDB() (db *sql.DB, err error) {
    db, err = sql.Open("postgres", connStr)
    if err != nil { return }
    defer func() {
        if err != nil {
            db.Close()
            db = nil
        }
    }()
    err = db.Ping()
    return
}
```

---

# SECTION 2: COMPOSITE TYPES

## 2.1 Arrays and Slices

```go
// Arrays — fixed size, value type (copied on assignment)
var arr [5]int                    // [0 0 0 0 0]
arr2 := [3]string{"a", "b", "c"} // literal
arr3 := [...]int{1, 2, 3, 4}     // compiler infers size: [4]int

// Arrays are comparable
a1 := [3]int{1, 2, 3}
a2 := [3]int{1, 2, 3}
fmt.Println(a1 == a2) // true

// Slices — dynamic, reference type (header: pointer, length, capacity)
var s []int              // nil slice
s = []int{1, 2, 3}      // slice literal
s = make([]int, 5)      // len=5, cap=5, all zeros
s = make([]int, 3, 10)  // len=3, cap=10

// Nil vs empty slice
var nilSlice []int        // nil, len=0
emptySlice := []int{}    // not nil, len=0
emptySlice2 := make([]int, 0) // not nil, len=0

// Both work with range, append, len, cap
// json.Marshal: nil → null, empty → []

// Slice operations
s := []int{1, 2, 3, 4, 5}
s[2]         // 3 — index
s[1:3]       // [2 3] — half-open range [low:high]
s[:3]        // [1 2 3]
s[2:]        // [3 4 5]
s[:]         // copy of header, same backing array
s[1:3:4]     // full slice expression: [low:high:max] — controls capacity

// append — may allocate new backing array if cap exceeded
s = append(s, 6)
s = append(s, 7, 8, 9)
s = append(s, []int{10, 11}...)  // append another slice

// Copy — copy(dst, src) returns number of elements copied
dst := make([]int, len(src))
n := copy(dst, src) // min(len(dst), len(src)) elements

// Delete element at index i (order preserved)
s = append(s[:i], s[i+1:]...)

// Delete without preserving order (faster)
s[i] = s[len(s)-1]
s = s[:len(s)-1]

// 2D slice
matrix := make([][]int, rows)
for i := range matrix {
    matrix[i] = make([]int, cols)
}

// Gotcha: slices share backing array
a := []int{1, 2, 3, 4, 5}
b := a[1:3]    // [2 3] — shares memory with a
b[0] = 99      // modifies a[1] too!
// Solution: copy to avoid sharing
b = append([]int{}, a[1:3]...)

// Growth strategy: Go doubles capacity up to ~1024, then ~1.25x
// This matters for performance: pre-allocate when size is known
s := make([]int, 0, expectedSize) // avoids reallocations
```

---

## 2.2 Maps

```go
// Map declaration
var m map[string]int   // nil map — reads return zero value, writes panic!
m = make(map[string]int)
m2 := map[string]int{"a": 1, "b": 2}

// Operations
m["key"] = 42          // set
v := m["key"]          // get (zero value if missing)
delete(m, "key")       // delete (no error if missing)

// Two-value form — check existence
v, ok := m["key"]
if !ok {
    fmt.Println("key not found")
}

// Iteration — order NOT guaranteed
for k, v := range m {
    fmt.Println(k, v)
}

// Map as set
set := make(map[string]struct{})
set["item"] = struct{}{}
_, exists := set["item"] // check membership

// Concurrent maps — NOT safe for concurrent use
// Use sync.Map or mutex-wrapped map
import "sync"
var mu sync.RWMutex
var cache = make(map[string]int)

func read(key string) (int, bool) {
    mu.RLock()
    defer mu.RUnlock()
    v, ok := cache[key]
    return v, ok
}

func write(key string, val int) {
    mu.Lock()
    defer mu.Unlock()
    cache[key] = val
}

// sync.Map — optimized for high-read, low-write scenarios
var sm sync.Map
sm.Store("key", 42)
v, ok := sm.Load("key")
sm.Delete("key")
sm.Range(func(k, v interface{}) bool {
    fmt.Println(k, v)
    return true // return false to stop iteration
})
sm.LoadOrStore("key", defaultVal) // atomic get-or-set
```

---

## 2.3 Structs

```go
// Struct declaration
type User struct {
    ID        int
    Name      string
    Email     string
    CreatedAt time.Time
    Role      string
}

// Struct literal
user := User{
    ID:    1,
    Name:  "Alice",
    Email: "alice@example.com",
    Role:  "admin",
}

// Positional (fragile — avoid for structs with many fields)
user2 := User{1, "Bob", "bob@example.com", time.Now(), "user"}

// Zero value struct
var u User // all fields zero-valued

// Pointer to struct
p := &User{ID: 1, Name: "Alice"}
p.Name = "Bob" // auto-dereference (*p).Name = "Bob"

// new — allocates zero-value struct, returns pointer
p2 := new(User)
p2.Name = "Charlie"

// Anonymous fields (embedding)
type Address struct {
    Street string
    City   string
    Zip    string
}

type Person struct {
    Name    string
    Age     int
    Address // embedded — fields promoted
}

p := Person{
    Name: "Alice",
    Age:  30,
    Address: Address{Street: "123 Main St", City: "NYC", Zip: "10001"},
}
fmt.Println(p.City)   // promoted field access
fmt.Println(p.Address.City) // also valid

// Struct tags — metadata for encoding, validation, ORM
type UserDTO struct {
    ID    int    `json:"id" db:"user_id" validate:"required"`
    Name  string `json:"name" validate:"required,min=1,max=100"`
    Email string `json:"email" validate:"required,email"`
    Age   int    `json:"age,omitempty" validate:"min=0,max=150"`
}

// Accessing tags at runtime
import "reflect"
t := reflect.TypeOf(UserDTO{})
field, _ := t.FieldByName("Name")
fmt.Println(field.Tag.Get("json"))     // "name"
fmt.Println(field.Tag.Get("validate")) // "required,min=1,max=100"

// Anonymous structs — useful for one-off types, test data
config := struct {
    Host string
    Port int
}{
    Host: "localhost",
    Port: 8080,
}

// Struct comparison — comparable if all fields are comparable
type Point struct { X, Y int }
p1 := Point{1, 2}
p2 := Point{1, 2}
fmt.Println(p1 == p2) // true

// Structs are value types — full copy on assignment
original := User{ID: 1, Name: "Alice"}
copy := original
copy.Name = "Bob"
fmt.Println(original.Name) // "Alice" — unchanged

// Structs with slice/map fields are NOT fully independent copies
type Container struct {
    Items []string
}
c1 := Container{Items: []string{"a", "b"}}
c2 := c1
c2.Items[0] = "x"
fmt.Println(c1.Items[0]) // "x" — both share slice backing array!
```

---

# SECTION 3: METHODS AND INTERFACES

## 3.1 Methods

```go
type Rectangle struct {
    Width, Height float64
}

// Value receiver — works on a copy
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// Value receiver — does NOT modify original
func (r Rectangle) Scale(factor float64) Rectangle {
    return Rectangle{r.Width * factor, r.Height * factor}
}

// Pointer receiver — modifies original
func (r *Rectangle) ScaleInPlace(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

rect := Rectangle{Width: 10, Height: 5}
rect.ScaleInPlace(2) // auto-takes address of rect: (&rect).ScaleInPlace(2)
fmt.Println(rect.Width) // 20

// Method on non-struct types
type StringSlice []string
func (ss StringSlice) Join(sep string) string {
    return strings.Join(ss, sep)
}

// Methods on types from other packages NOT allowed
// type MyInt int — must define type in same package

// Value vs pointer receiver rules:
// 1. Use pointer receiver if method needs to modify the receiver
// 2. Use pointer receiver if struct is large (avoid copying)
// 3. Be consistent — if one method is pointer receiver, all should be
// 4. Value receivers work on both values and pointers
// 5. Pointer receivers work on both values and pointers (if addressable)

// Method expressions and method values
area := rect.Area     // method value — bound to rect
fmt.Println(area())   // call without receiver

areaFn := Rectangle.Area // method expression — unbound
fmt.Println(areaFn(rect)) // explicit receiver
```

---

## 3.2 Interfaces

```go
// Interface declaration — set of method signatures
type Shape interface {
    Area() float64
    Perimeter() float64
}

// Implicit implementation — no 'implements' keyword
type Circle struct { Radius float64 }
func (c Circle) Area() float64      { return math.Pi * c.Radius * c.Radius }
func (c Circle) Perimeter() float64 { return 2 * math.Pi * c.Radius }

type Square struct { Side float64 }
func (s Square) Area() float64      { return s.Side * s.Side }
func (s Square) Perimeter() float64 { return 4 * s.Side }

// Both implicitly satisfy Shape
var shapes []Shape = []Shape{Circle{5}, Square{4}}
for _, s := range shapes {
    fmt.Printf("Area: %.2f, Perimeter: %.2f\n", s.Area(), s.Perimeter())
}

// Empty interface — accepts any value (pre-generics workaround)
var any interface{} = 42
any = "hello"
any = struct{ name string }{"Alice"}

// any — alias for interface{} (Go 1.18+)
func printAnything(v any) { fmt.Println(v) }

// Type assertion
var i interface{} = "hello"
s, ok := i.(string)    // safe assertion
if ok {
    fmt.Println(s.ToUpper())
}

s2 := i.(string)       // panics if i is not string
s3 := i.(int)          // panics!

// Type switch
func describe(i interface{}) string {
    switch v := i.(type) {
    case int:
        return fmt.Sprintf("int: %d", v)
    case string:
        return fmt.Sprintf("string: %s", v)
    case bool:
        return fmt.Sprintf("bool: %v", v)
    case []int:
        return fmt.Sprintf("[]int with %d elements", len(v))
    case nil:
        return "nil"
    default:
        return fmt.Sprintf("unknown type: %T", v)
    }
}

// Interface composition
type Reader interface {
    Read(p []byte) (n int, err error)
}
type Writer interface {
    Write(p []byte) (n int, err error)
}
type ReadWriter interface {
    Reader
    Writer
}
type ReadWriteCloser interface {
    Reader
    Writer
    Close() error
}

// Interface internals — two-word struct (type, value)
// nil interface: both type and value are nil
// Interface holding nil pointer: type is set, value is nil — NOT nil interface!
var r *os.File = nil
var err error = r  // error interface now has type=*os.File, value=nil
fmt.Println(err == nil) // FALSE! Common gotcha

// Correct way to return nil interface:
func getFile(path string) (io.Reader, error) {
    if path == "" {
        return nil, nil // returns actual nil interface
    }
    f, err := os.Open(path)
    return f, err
}

// Stringer interface — fmt.Println calls String() if available
type Point struct{ X, Y int }
func (p Point) String() string {
    return fmt.Sprintf("(%d, %d)", p.X, p.Y)
}

// error interface
type error interface {
    Error() string
}
```

---

## 3.3 Interface Patterns

```go
// Accept interfaces, return structs (guideline)
// Functions should accept the narrowest interface needed
// Functions should return concrete types (easier to use, test, evolve)

// Good:
func WriteJSON(w io.Writer, v interface{}) error { /* ... */ }

// Instead of:
// func WriteJSON(w *os.File, v interface{}) error  -- too specific

// Interface segregation — small interfaces
type Saver interface { Save() error }
type Loader interface { Load() error }
type Deleter interface { Delete() error }

// Composed when needed
type Repository interface {
    Saver
    Loader
    Deleter
}

// Functional options pattern with interfaces
type Server struct {
    host    string
    port    int
    timeout time.Duration
    tls     bool
}

type Option func(*Server)

func WithHost(host string) Option {
    return func(s *Server) { s.host = host }
}
func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}
func WithTimeout(d time.Duration) Option {
    return func(s *Server) { s.timeout = d }
}

func NewServer(opts ...Option) *Server {
    s := &Server{
        host:    "localhost",
        port:    8080,
        timeout: 30 * time.Second,
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

server := NewServer(
    WithHost("0.0.0.0"),
    WithPort(9090),
    WithTimeout(60*time.Second),
)
```

---

# SECTION 4: ERROR HANDLING

## 4.1 The Error Pattern

```go
// error is a built-in interface
type error interface {
    Error() string
}

// Errors package
import "errors"

var ErrNotFound = errors.New("not found")
var ErrUnauthorized = errors.New("unauthorized")

// Sentinel errors — compare with ==
func findUser(id int) (*User, error) {
    if id <= 0 { return nil, ErrNotFound }
    // ...
}

user, err := findUser(0)
if err == ErrNotFound {
    // handle not found
}

// Custom error types — implement error interface
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error: field %s - %s", e.Field, e.Message)
}

type NotFoundError struct {
    Resource string
    ID       any
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s with id %v not found", e.Resource, e.ID)
}

// Error wrapping — Go 1.13+
func processUser(id int) error {
    user, err := db.GetUser(id)
    if err != nil {
        return fmt.Errorf("processUser: failed to get user %d: %w", id, err)
        // %w wraps the error, preserving the chain
    }
    return nil
}

// errors.Is — check error chain
err := processUser(0)
if errors.Is(err, ErrNotFound) {
    // handles wrapped ErrNotFound too
}

// errors.As — extract typed error from chain
var notFound *NotFoundError
if errors.As(err, &notFound) {
    fmt.Println("resource:", notFound.Resource)
}

// Custom Is/As methods for more control
type TemporaryError struct {
    Err     error
    Retries int
}

func (e *TemporaryError) Error() string { return e.Err.Error() }
func (e *TemporaryError) Unwrap() error { return e.Err }
func (e *TemporaryError) Is(target error) bool {
    _, ok := target.(*TemporaryError)
    return ok
}

// Multiple error wrapping (Go 1.20+)
err1, err2 := doA(), doB()
combined := errors.Join(err1, err2)
// errors.Is and errors.As check both

// Error handling patterns
// Pattern 1: early return
func processOrder(id int) error {
    order, err := getOrder(id)
    if err != nil { return fmt.Errorf("getOrder: %w", err) }

    if err := validateOrder(order); err != nil {
        return fmt.Errorf("validateOrder: %w", err)
    }

    if err := chargePayment(order); err != nil {
        return fmt.Errorf("chargePayment: %w", err)
    }

    return nil
}

// Pattern 2: errgroup for parallel operations
import "golang.org/x/sync/errgroup"

func loadDashboard(ctx context.Context, userID int) (*Dashboard, error) {
    g, ctx := errgroup.WithContext(ctx)
    var user *User
    var orders []*Order

    g.Go(func() error {
        var err error
        user, err = getUser(ctx, userID)
        return err
    })

    g.Go(func() error {
        var err error
        orders, err = getOrders(ctx, userID)
        return err
    })

    if err := g.Wait(); err != nil {
        return nil, err
    }

    return &Dashboard{User: user, Orders: orders}, nil
}
```

---

# SECTION 5: GOROUTINES AND CHANNELS

## 5.1 Goroutines

```go
// Launch goroutine — lightweight thread (~2KB initial stack, grows as needed)
go func() {
    fmt.Println("running in goroutine")
}()

go longRunningTask()

// Goroutines are NOT threads — Go runtime schedules them on OS threads (GOMAXPROCS)
// Default GOMAXPROCS = number of CPU cores (Go 1.5+)

// WaitGroup — wait for multiple goroutines
import "sync"

func processItems(items []string) {
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(item string) {
            defer wg.Done()
            process(item)
        }(item) // pass item as argument to avoid closure capture bug
    }

    wg.Wait() // blocks until all Done() calls
}

// Goroutine closure capture bug — common mistake
for i := 0; i < 3; i++ {
    go func() {
        fmt.Println(i) // BUG: all goroutines see same i (likely 3)
    }()
}

// Fix 1: pass as argument
for i := 0; i < 3; i++ {
    go func(i int) {
        fmt.Println(i) // OK: each goroutine gets its own copy
    }(i)
}

// Fix 2: shadow variable (Go 1.22+ loop variable semantics fix)
for i := 0; i < 3; i++ {
    i := i // shadow
    go func() { fmt.Println(i) }()
}
// Go 1.22: loop variables have per-iteration scope, so the bug is fixed automatically

// Goroutine leak — goroutines not properly terminated
func leaky() {
    ch := make(chan int)
    go func() {
        v := <-ch // blocks forever if no one sends — goroutine leak!
        fmt.Println(v)
    }()
    // ch never sent to
}

// Fix: use context for cancellation
func notLeaky(ctx context.Context) {
    ch := make(chan int)
    go func() {
        select {
        case v := <-ch:
            fmt.Println(v)
        case <-ctx.Done():
            return // goroutine exits when context is cancelled
        }
    }()
}
```

---

## 5.2 Channels

```go
// Unbuffered channel — synchronous, send blocks until receive
ch := make(chan int)

go func() { ch <- 42 }() // send blocks until receiver ready
v := <-ch                  // receive blocks until sender ready

// Buffered channel — async up to buffer capacity
bch := make(chan int, 10)
bch <- 1  // doesn't block (buffer not full)
bch <- 2
v := <-bch // doesn't block (buffer has data)

// Channel directions — restrict in function signatures
func producer(ch chan<- int) { // send-only
    ch <- 42
}
func consumer(ch <-chan int) { // receive-only
    v := <-ch
    fmt.Println(v)
}

// Closing channels
close(ch) // signal no more values will be sent
v, ok := <-ch // ok=false when channel closed and empty
for v := range ch { /* runs until closed */ }

// Only sender should close — closing a closed channel panics!
// Reading from closed, empty channel returns zero value

// Select — multiplex channel operations
select {
case v := <-ch1:
    fmt.Println("from ch1:", v)
case v := <-ch2:
    fmt.Println("from ch2:", v)
case ch3 <- 42:
    fmt.Println("sent to ch3")
case <-time.After(1 * time.Second):
    fmt.Println("timeout")
default:
    fmt.Println("no channel ready") // non-blocking
}

// Fan-out — distribute work to multiple goroutines
func fanOut(input <-chan int, workers int) []<-chan int {
    outputs := make([]<-chan int, workers)
    for i := 0; i < workers; i++ {
        ch := make(chan int)
        outputs[i] = ch
        go func(out chan<- int) {
            for v := range input {
                out <- process(v)
            }
            close(out)
        }(ch)
    }
    return outputs
}

// Fan-in — merge multiple channels into one
func fanIn(channels ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    merged := make(chan int)

    output := func(ch <-chan int) {
        defer wg.Done()
        for v := range ch { merged <- v }
    }

    wg.Add(len(channels))
    for _, ch := range channels {
        go output(ch)
    }

    go func() {
        wg.Wait()
        close(merged)
    }()

    return merged
}

// Pipeline pattern
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums { out <- n }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in { out <- n * n }
        close(out)
    }()
    return out
}

// Usage: pipeline
for v := range square(square(generate(2, 3, 4))) {
    fmt.Println(v) // 16, 81, 256
}

// Channel as semaphore — limit concurrency
sem := make(chan struct{}, maxConcurrent)

for _, url := range urls {
    sem <- struct{}{} // acquire
    go func(url string) {
        defer func() { <-sem }() // release
        fetch(url)
    }(url)
}
```

---

## 5.3 Context Package

```go
import "context"

// Context carries: deadlines, cancellation signals, request-scoped values
// Always pass ctx as first parameter by convention

// Root contexts
ctx := context.Background() // non-nil, empty — use at top level
ctx2 := context.TODO()      // placeholder — signals "not yet decided"

// Derived contexts
ctx, cancel := context.WithCancel(parent)
defer cancel() // ALWAYS defer cancel to avoid goroutine leak

ctx, cancel := context.WithTimeout(parent, 5*time.Second)
defer cancel()

ctx, cancel := context.WithDeadline(parent, time.Now().Add(5*time.Second))
defer cancel()

// Value context — pass request-scoped data (use typed keys!)
type contextKey string
const (
    userIDKey  contextKey = "userID"
    requestKey contextKey = "requestID"
)

ctx = context.WithValue(ctx, userIDKey, 42)
userID := ctx.Value(userIDKey).(int) // type assert

// Checking cancellation
func doWork(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err() // context.Canceled or context.DeadlineExceeded
        default:
            // do work
        }
    }
}

// HTTP server with context
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    result, err := db.QueryContext(ctx, "SELECT * FROM users")
    if err != nil {
        if errors.Is(err, context.Canceled) {
            // client disconnected
            return
        }
        http.Error(w, err.Error(), 500)
        return
    }
    // use result
}

// Context propagation chain
func (s *Service) HandleRequest(ctx context.Context, req *Request) (*Response, error) {
    // Derived context with timeout for this specific operation
    opCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()

    data, err := s.repo.Fetch(opCtx, req.ID)
    if err != nil {
        return nil, fmt.Errorf("HandleRequest: %w", err)
    }

    return &Response{Data: data}, nil
}
```

---

# SECTION 6: SYNC PRIMITIVES

## 6.1 Mutex, RWMutex, Once, Cond

```go
import "sync"

// Mutex — mutual exclusion
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

// RWMutex — multiple readers, single writer
type Cache struct {
    mu    sync.RWMutex
    store map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()         // multiple goroutines can hold RLock
    defer c.mu.RUnlock()
    v, ok := c.store[key]
    return v, ok
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()          // exclusive write lock
    defer c.mu.Unlock()
    c.store[key] = value
}

// sync.Once — run exactly once (thread-safe singleton)
type DB struct {
    conn *sql.DB
}

var (
    dbInstance *DB
    dbOnce     sync.Once
)

func GetDB() *DB {
    dbOnce.Do(func() {
        conn, err := sql.Open("postgres", connStr)
        if err != nil { panic(err) }
        dbInstance = &DB{conn: conn}
    })
    return dbInstance
}

// sync.Cond — condition variable
type Queue struct {
    mu    sync.Mutex
    cond  *sync.Cond
    items []int
}

func NewQueue() *Queue {
    q := &Queue{}
    q.cond = sync.NewCond(&q.mu)
    return q
}

func (q *Queue) Enqueue(item int) {
    q.mu.Lock()
    defer q.mu.Unlock()
    q.items = append(q.items, item)
    q.cond.Signal() // wake one waiter
}

func (q *Queue) Dequeue() int {
    q.mu.Lock()
    defer q.mu.Unlock()
    for len(q.items) == 0 {
        q.cond.Wait() // atomically releases lock and waits
    }
    item := q.items[0]
    q.items = q.items[1:]
    return item
}

// sync.Pool — reuse temporary objects, reduce GC pressure
var bufPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 0, 4096)
    },
}

func processRequest(data []byte) {
    buf := bufPool.Get().([]byte)
    defer bufPool.Put(buf[:0]) // reset length, keep capacity

    buf = append(buf, data...)
    // process buf
}

// sync.Map — concurrent map optimized for specific patterns
// Good for: key written once read many times, disjoint key sets
var m sync.Map
m.Store("key", "value")
val, ok := m.Load("key")
m.Delete("key")
actual, loaded := m.LoadOrStore("key", "value") // atomic CAS
m.Range(func(k, v interface{}) bool {
    fmt.Println(k, v)
    return true
})

// atomic operations
import "sync/atomic"
var counter int64
atomic.AddInt64(&counter, 1)
val := atomic.LoadInt64(&counter)
atomic.StoreInt64(&counter, 0)
old := atomic.SwapInt64(&counter, 100)
swapped := atomic.CompareAndSwapInt64(&counter, old, 200)

// atomic.Value — store/load arbitrary values atomically
var config atomic.Value
config.Store(Config{Host: "localhost", Port: 8080})
c := config.Load().(Config)
```

---

# SECTION 7: GENERICS (GO 1.18+)

## 7.1 Generic Functions and Types

```go
// Generic function — type parameter in square brackets
func Map[T, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

doubled := Map([]int{1, 2, 3}, func(n int) int { return n * 2 })
strs := Map([]int{1, 2, 3}, strconv.Itoa)

func Filter[T any](slice []T, pred func(T) bool) []T {
    var result []T
    for _, v := range slice {
        if pred(v) { result = append(result, v) }
    }
    return result
}

func Reduce[T, U any](slice []T, initial U, fn func(U, T) U) U {
    acc := initial
    for _, v := range slice {
        acc = fn(acc, v)
    }
    return acc
}

// Type constraints
type Number interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
    ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
    ~float32 | ~float64
}

func Sum[T Number](nums []T) T {
    var total T
    for _, n := range nums { total += n }
    return total
}

// ~ tilde — includes types with underlying type
type MyInt int
Sum([]MyInt{1, 2, 3}) // works because ~int includes MyInt

// constraints package
import "golang.org/x/exp/constraints"

func Min[T constraints.Ordered](a, b T) T {
    if a < b { return a }
    return b
}

func Contains[T comparable](slice []T, target T) bool {
    for _, v := range slice {
        if v == target { return true }
    }
    return false
}

// Generic types
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
    var zero T
    if len(s.items) == 0 { return zero, false }
    last := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return last, true
}

func (s *Stack[T]) Peek() (T, bool) {
    var zero T
    if len(s.items) == 0 { return zero, false }
    return s.items[len(s.items)-1], true
}

// Generic type with multiple parameters
type Pair[A, B any] struct {
    First  A
    Second B
}

func Zip[A, B any](as []A, bs []B) []Pair[A, B] {
    n := len(as)
    if len(bs) < n { n = len(bs) }
    result := make([]Pair[A, B], n)
    for i := 0; i < n; i++ {
        result[i] = Pair[A, B]{as[i], bs[i]}
    }
    return result
}

// Type inference — compiler infers type parameters when possible
s := Stack[int]{}  // explicit
s.Push(42)         // T inferred from argument

// Limitations of Go generics (vs TypeScript):
// 1. No specialization — can't have different implementations per type
// 2. No operator overloading — need constraints to use +, -, <, etc.
// 3. No covariance — Stack[Cat] is NOT a Stack[Animal]
// 4. Methods can't introduce new type parameters (only types can)
// 5. No generic interfaces as type assertions yet
```

---

# SECTION 8: PACKAGES AND MODULES

## 8.1 Package System

```go
// Package declaration — must match directory name (except main)
package main // executable
package utils // library

// main package — entry point
package main

func main() {
    // program starts here
}

// Exported vs unexported — capitalization determines visibility
type User struct {  // exported
    ID   int        // exported field
    name string     // unexported field — accessible within package only
}

func (u *User) Name() string { return u.name } // exported getter
func (u *User) setName(n string) { u.name = n } // unexported setter

// Package-level vars and init
var defaultTimeout = 30 * time.Second // unexported package var

// init function — runs before main, after var initialization
func init() {
    // package initialization
    // multiple init() functions allowed per file/package
    // called in source order, files in undefined order
    log.SetFlags(log.LstdFlags | log.Lshortfile)
}

// Import paths
import (
    "fmt"                          // standard library
    "net/http"                     // standard library with path
    "github.com/user/repo"         // external module
    "github.com/user/repo/subpkg"  // sub-package

    // aliases
    myfmt "fmt"
    . "math" // dot import — Pi, Sqrt, etc. without prefix (avoid!)
    _ "image/png" // blank import — side effects only (registers PNG decoder)
)

// Internal packages — only importable by parent
// myproject/internal/db/db.go
// myproject/service/service.go can import myproject/internal/db
// github.com/other/project CANNOT import myproject/internal/db
```

---

## 8.2 Go Modules

```
# go.mod — module definition
module github.com/myorg/myproject

go 1.22

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/jackc/pgx/v5 v5.5.0
    go.uber.org/zap v1.26.0
    golang.org/x/sync v0.5.0
)

require (
    // indirect dependencies
    github.com/bytedance/sonic v1.10.2 // indirect
)

// Semantic versioning: vMAJOR.MINOR.PATCH
// v0.x.y — unstable API
// v1.0.0+ — stable API
// Major version changes require new import path: module/v2

// go.sum — cryptographic hashes for security
// Never edit manually
```

```bash
# Module commands
go mod init github.com/org/project  # create go.mod
go mod tidy                          # add missing, remove unused dependencies
go mod download                      # download all dependencies
go mod verify                        # verify integrity of cached modules
go mod vendor                        # copy dependencies to vendor/

go get github.com/pkg/errors@v0.9.1  # add/upgrade dependency
go get github.com/pkg/errors@latest  # latest version
go get github.com/pkg/errors@none    # remove dependency

# Workspace mode (Go 1.18+) — develop multiple modules simultaneously
go work init
go work use ./module1 ./module2
# go.work file
```

---

# SECTION 9: STANDARD LIBRARY DEPTH

## 9.1 fmt, strings, strconv, bytes

```go
import (
    "fmt"
    "strings"
    "strconv"
    "bytes"
)

// fmt verbs
fmt.Printf("%d", 42)         // decimal int
fmt.Printf("%f", 3.14)       // float
fmt.Printf("%.2f", 3.14159) // float with 2 decimal places
fmt.Printf("%s", "hello")    // string
fmt.Printf("%q", "hello")    // quoted string: "hello"
fmt.Printf("%v", struct{A int}{42}) // default: {42}
fmt.Printf("%+v", struct{A int}{42}) // with field names: {A:42}
fmt.Printf("%#v", struct{A int}{42}) // Go syntax: struct { A int }{A:42}
fmt.Printf("%T", 42.0)      // type: float64
fmt.Printf("%p", &x)         // pointer address
fmt.Printf("%b", 42)         // binary: 101010
fmt.Printf("%x", 255)        // hex: ff
fmt.Printf("%08b", 42)       // padded: 00101010

// Sprintf — format to string
s := fmt.Sprintf("Hello, %s! You are %d years old.", name, age)

// Errorf — format error (with %w for wrapping)
err := fmt.Errorf("failed to process %d: %w", id, originalErr)

// strings package
strings.Contains("hello world", "world")     // true
strings.HasPrefix("hello", "hel")            // true
strings.HasSuffix("hello", "llo")            // true
strings.Index("hello", "ll")                 // 2 (-1 if not found)
strings.Count("hello", "l")                  // 2
strings.Replace("oink oink oink", "oink", "moo", 2) // "moo moo oink"
strings.ReplaceAll("oink oink", "oink", "moo")
strings.Split("a,b,c", ",")                  // ["a" "b" "c"]
strings.SplitN("a,b,c", ",", 2)             // ["a" "b,c"]
strings.Join([]string{"a", "b", "c"}, ", ") // "a, b, c"
strings.TrimSpace("  hello  ")               // "hello"
strings.Trim("##hello##", "#")              // "hello"
strings.ToUpper("hello")                     // "HELLO"
strings.ToLower("HELLO")                     // "hello"
strings.Title("hello world")                 // "Hello World" (deprecated, use cases.Title)
strings.Fields("  foo  bar  ")              // ["foo" "bar"]
strings.Repeat("ab", 3)                      // "ababab"
strings.EqualFold("Go", "go")               // true (case-insensitive)

// strings.Builder — efficient string building
var sb strings.Builder
for i := 0; i < 10; i++ {
    fmt.Fprintf(&sb, "item %d\n", i)
}
result := sb.String()

// bytes.Buffer — read/write buffer
var buf bytes.Buffer
buf.WriteString("Hello")
buf.WriteByte(',')
buf.WriteString(" World")
fmt.Println(buf.String()) // "Hello, World"

// strconv
strconv.Itoa(42)                        // "42"
strconv.Atoi("42")                      // 42, nil
strconv.ParseInt("FF", 16, 64)          // 255, nil (base 16, 64-bit)
strconv.ParseFloat("3.14", 64)          // 3.14, nil
strconv.FormatInt(255, 16)              // "ff"
strconv.FormatBool(true)                // "true"
strconv.ParseBool("true")               // true, nil
strconv.Quote("hello\nworld")           // "\"hello\\nworld\""
```

---

## 9.2 io, bufio, os

```go
import (
    "bufio"
    "io"
    "os"
)

// io.Reader interface — fundamental
type Reader interface {
    Read(p []byte) (n int, err error)
}

// io.Writer interface
type Writer interface {
    Write(p []byte) (n int, err error)
}

// io utility functions
data, err := io.ReadAll(r)           // read everything
n, err := io.Copy(dst, src)          // copy between reader/writer
n, err := io.CopyN(dst, src, 100)    // copy N bytes
n, err := io.WriteString(w, "hello") // write string to writer
r2 := io.LimitReader(r, 1024)        // limit to 1024 bytes
r3 := io.MultiReader(r1, r2)         // concatenate readers
w2 := io.MultiWriter(w1, w2)         // tee to multiple writers

// os file operations
f, err := os.Open("file.txt")           // read-only
defer f.Close()

f, err := os.Create("file.txt")         // write-only, truncate
defer f.Close()

f, err := os.OpenFile("file.txt", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0644)
defer f.Close()

os.WriteFile("file.txt", []byte("hello"), 0644) // write entire file
data, err := os.ReadFile("file.txt")              // read entire file

os.Remove("file.txt")
os.Rename("old.txt", "new.txt")
os.MkdirAll("path/to/dir", 0755)

// File info
info, err := os.Stat("file.txt")
info.Size()
info.ModTime()
info.IsDir()
info.Mode()

// Walk directory
import "path/filepath"
filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
    if err != nil { return err }
    fmt.Println(path)
    return nil
})

// WalkDir — newer, more efficient
filepath.WalkDir(".", func(path string, d os.DirEntry, err error) error {
    if err != nil { return err }
    if !d.IsDir() {
        fmt.Println(path)
    }
    return nil
})

// bufio — buffered I/O
reader := bufio.NewReader(f)
line, err := reader.ReadString('\n')   // read until delimiter
line, isPrefix, err := reader.ReadLine() // read line (no alloc)

scanner := bufio.NewScanner(f)
scanner.Split(bufio.ScanLines) // default
for scanner.Scan() {
    fmt.Println(scanner.Text())
}
if err := scanner.Err(); err != nil { /* handle */ }

// Custom split function
scanner.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
    // parse custom format
    return 0, nil, nil
})

writer := bufio.NewWriter(f)
writer.WriteString("hello\n")
writer.Flush() // MUST flush buffered writer!
```

---

## 9.3 encoding/json

```go
import "encoding/json"

// Marshal — Go → JSON
type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email,omitempty"` // omit if empty
    Password  string    `json:"-"`               // never marshal
    CreatedAt time.Time `json:"created_at"`
    Tags      []string  `json:"tags"`
    Metadata  map[string]any `json:"metadata,omitempty"`
}

user := User{ID: 1, Name: "Alice", Tags: []string{"admin"}}
data, err := json.Marshal(user)
// {"id":1,"name":"Alice","tags":["admin"],"created_at":"0001-01-01T00:00:00Z"}

// Indented for readability
data, err := json.MarshalIndent(user, "", "  ")

// Unmarshal — JSON → Go
var decoded User
err := json.Unmarshal(data, &decoded)

// Unknown JSON structure
var raw map[string]any
err := json.Unmarshal(data, &raw)
name := raw["name"].(string) // type assert — dangerous, prefer typed structs

// json.Decoder/Encoder — streaming (preferred for large data or HTTP)
decoder := json.NewDecoder(r.Body)
decoder.DisallowUnknownFields() // strict parsing
var req CreateUserRequest
if err := decoder.Decode(&req); err != nil {
    http.Error(w, err.Error(), 400)
    return
}

encoder := json.NewEncoder(w)
encoder.SetIndent("", "  ")
encoder.Encode(response)

// Custom marshaling
type Duration time.Duration

func (d Duration) MarshalJSON() ([]byte, error) {
    return json.Marshal(time.Duration(d).String())
}

func (d *Duration) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil { return err }
    dur, err := time.ParseDuration(s)
    *d = Duration(dur)
    return err
}

// json.RawMessage — defer decoding
type Event struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"` // raw bytes, decode later
}

var event Event
json.Unmarshal(data, &event)
switch event.Type {
case "click":
    var click ClickPayload
    json.Unmarshal(event.Payload, &click)
}
```

---

## 9.4 net/http

```go
import "net/http"

// Simple HTTP server
http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
})
http.ListenAndServe(":8080", nil)

// Custom mux and server (preferred for production)
mux := http.NewServeMux()

// Go 1.22 enhanced routing
mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("POST /users", createUser)
mux.HandleFunc("PUT /users/{id}", updateUser)
mux.HandleFunc("DELETE /users/{id}", deleteUser)

server := &http.Server{
    Addr:         ":8080",
    Handler:      mux,
    ReadTimeout:  15 * time.Second,
    WriteTimeout: 15 * time.Second,
    IdleTimeout:  60 * time.Second,
}

// Graceful shutdown
go func() {
    if err := server.ListenAndServe(); err != http.ErrServerClosed {
        log.Fatal(err)
    }
}()

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
server.Shutdown(ctx)

// Middleware pattern
type Middleware func(http.Handler) http.Handler

func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if !isValidToken(token) {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        next.ServeHTTP(w, r)
    })
}

// Chain middleware
func Chain(h http.Handler, middleware ...Middleware) http.Handler {
    for i := len(middleware) - 1; i >= 0; i-- {
        h = middleware[i](h)
    }
    return h
}

handler := Chain(mux, LoggingMiddleware, AuthMiddleware)

// HTTP client
client := &http.Client{
    Timeout: 10 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        IdleConnTimeout:     90 * time.Second,
    },
}

// GET request
resp, err := client.Get("https://api.example.com/users")
defer resp.Body.Close()
data, err := io.ReadAll(resp.Body)

// POST with JSON
body, _ := json.Marshal(payload)
req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
req.Header.Set("Content-Type", "application/json")
req.Header.Set("Authorization", "Bearer "+token)
resp, err := client.Do(req)
```

---

# SECTION 10: TESTING IN GO

## 10.1 Testing Package

```go
// file: math_test.go
package math

import (
    "testing"
    "math"
)

// Test function — must start with Test, take *testing.T
func TestAdd(t *testing.T) {
    result := Add(2, 3)
    if result != 5 {
        t.Errorf("Add(2, 3) = %d; want 5", result)
    }
}

// Table-driven tests — idiomatic Go
func TestDivide(t *testing.T) {
    tests := []struct {
        name     string
        a, b     float64
        expected float64
        wantErr  bool
    }{
        {"positive", 10, 2, 5.0, false},
        {"negative", -10, 2, -5.0, false},
        {"zero divisor", 10, 0, 0, true},
        {"both zero", 0, 0, 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := Divide(tt.a, tt.b)
            if (err != nil) != tt.wantErr {
                t.Errorf("Divide(%v, %v) error = %v, wantErr %v", tt.a, tt.b, err, tt.wantErr)
                return
            }
            if !tt.wantErr && math.Abs(result-tt.expected) > 1e-9 {
                t.Errorf("Divide(%v, %v) = %v, want %v", tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

// Benchmarks — must start with Benchmark
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2)
    }
}

// Benchmark with setup
func BenchmarkSortLarge(b *testing.B) {
    data := generateLargeSlice(10000)
    b.ResetTimer() // don't count setup time
    for i := 0; i < b.N; i++ {
        b.StopTimer()
        input := make([]int, len(data))
        copy(input, data)
        b.StartTimer()
        sort.Ints(input)
    }
}

// Parallel benchmark
func BenchmarkParallel(b *testing.B) {
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            doWork()
        }
    })
}

// Test helpers
func assertEqual(t *testing.T, got, want interface{}) {
    t.Helper() // marks as helper, shows caller in failure output
    if got != want {
        t.Errorf("got %v, want %v", got, want)
    }
}

// TestMain — setup/teardown for entire package
func TestMain(m *testing.M) {
    // setup
    db = setupTestDB()

    code := m.Run() // run all tests

    // teardown
    db.Close()
    os.Exit(code)
}

// Subtests and cleanup
func TestUserService(t *testing.T) {
    db := setupTestDB(t)
    t.Cleanup(func() { db.Close() }) // runs after test completes

    t.Run("CreateUser", func(t *testing.T) {
        // ...
    })

    t.Run("GetUser", func(t *testing.T) {
        // parallel subtests
        t.Parallel()
        // ...
    })
}

// Examples — also serve as documentation
func ExampleAdd() {
    fmt.Println(Add(1, 2))
    // Output: 3
}

// Fuzz testing (Go 1.18+)
func FuzzParseDate(f *testing.F) {
    // seed corpus
    f.Add("2023-01-15")
    f.Add("invalid")
    f.Add("")

    f.Fuzz(func(t *testing.T, input string) {
        // should not panic
        _, _ = ParseDate(input)
    })
}

// Run tests
// go test ./...            — all packages
// go test -run TestAdd     — specific test
// go test -v               — verbose
// go test -race            — race detector
// go test -bench=.         — run benchmarks
// go test -cover           — coverage
// go test -coverprofile=coverage.out && go tool cover -html=coverage.out
```

---

## 10.2 Mocking and Testable Code

```go
// Dependency injection via interfaces for testability
type UserRepository interface {
    FindByID(ctx context.Context, id int) (*User, error)
    Save(ctx context.Context, user *User) error
}

type UserService struct {
    repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

// Mock implementation for testing
type MockUserRepository struct {
    users map[int]*User
    calls []string
}

func (m *MockUserRepository) FindByID(ctx context.Context, id int) (*User, error) {
    m.calls = append(m.calls, fmt.Sprintf("FindByID(%d)", id))
    if u, ok := m.users[id]; ok {
        return u, nil
    }
    return nil, ErrNotFound
}

func (m *MockUserRepository) Save(ctx context.Context, user *User) error {
    m.calls = append(m.calls, "Save")
    if m.users == nil { m.users = make(map[int]*User) }
    m.users[user.ID] = user
    return nil
}

func TestUserService_GetUser(t *testing.T) {
    mockRepo := &MockUserRepository{
        users: map[int]*User{1: {ID: 1, Name: "Alice"}},
    }
    service := NewUserService(mockRepo)

    user, err := service.GetUser(context.Background(), 1)
    if err != nil { t.Fatal(err) }
    if user.Name != "Alice" { t.Errorf("want Alice, got %s", user.Name) }
    if len(mockRepo.calls) != 1 { t.Errorf("expected 1 call, got %d", len(mockRepo.calls)) }
}

// httptest — test HTTP handlers
import "net/http/httptest"

func TestGetUserHandler(t *testing.T) {
    req := httptest.NewRequest("GET", "/users/1", nil)
    w := httptest.NewRecorder()

    handler := NewUserHandler(mockService)
    handler.GetUser(w, req)

    resp := w.Result()
    if resp.StatusCode != http.StatusOK {
        t.Errorf("got status %d, want 200", resp.StatusCode)
    }

    var user User
    json.NewDecoder(resp.Body).Decode(&user)
    if user.ID != 1 { t.Errorf("got user ID %d, want 1", user.ID) }
}

// httptest server — test external HTTP calls
func TestHTTPClient(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(User{ID: 1, Name: "Test"})
    }))
    defer server.Close()

    client := NewAPIClient(server.URL)
    user, err := client.GetUser(context.Background(), 1)
    // assert
}
```

---

# SECTION 11: REFLECTION AND RUNTIME

## 11.1 reflect Package

```go
import "reflect"

// reflect.TypeOf — get type information
t := reflect.TypeOf(42)           // reflect.Type: int
t2 := reflect.TypeOf("hello")     // reflect.Type: string
t3 := reflect.TypeOf(User{})      // reflect.Type: main.User
t4 := reflect.TypeOf(&User{})     // reflect.Type: *main.User

t.Kind()   // reflect.Int, reflect.String, reflect.Struct, reflect.Ptr...
t.Name()   // "int", "string", "User"
t.PkgPath() // package path for named types

// reflect.ValueOf — get/set values
v := reflect.ValueOf(42)
v.Int()     // 42 — panics if not int
v.String()  // panics if not string
v.Kind()    // reflect.Int

// Modify via reflection — must use pointer
x := 42
v := reflect.ValueOf(&x).Elem() // Elem dereferences pointer
v.CanSet()  // true
v.SetInt(100)
fmt.Println(x) // 100

// Struct reflection — iterate fields
type Config struct {
    Host    string `env:"HOST" default:"localhost"`
    Port    int    `env:"PORT" default:"8080"`
    Debug   bool   `env:"DEBUG" default:"false"`
}

func loadFromEnv(cfg interface{}) error {
    v := reflect.ValueOf(cfg)
    if v.Kind() != reflect.Ptr || v.Elem().Kind() != reflect.Struct {
        return errors.New("must pass pointer to struct")
    }
    v = v.Elem()
    t := v.Type()

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        fieldVal := v.Field(i)

        envKey := field.Tag.Get("env")
        defaultVal := field.Tag.Get("default")

        val := os.Getenv(envKey)
        if val == "" { val = defaultVal }
        if val == "" { continue }

        switch field.Type.Kind() {
        case reflect.String:
            fieldVal.SetString(val)
        case reflect.Int:
            n, _ := strconv.ParseInt(val, 10, 64)
            fieldVal.SetInt(n)
        case reflect.Bool:
            b, _ := strconv.ParseBool(val)
            fieldVal.SetBool(b)
        }
    }
    return nil
}

// Reflection on methods
t := reflect.TypeOf((*MyInterface)(nil)).Elem()
for i := 0; i < t.NumMethod(); i++ {
    method := t.Method(i)
    fmt.Println(method.Name, method.Type)
}

// reflect.DeepEqual — recursive equality check
a := []int{1, 2, 3}
b := []int{1, 2, 3}
reflect.DeepEqual(a, b) // true (slices are comparable this way)
reflect.DeepEqual(a, []int{1, 2}) // false

// Performance: reflection is 10-100x slower than direct code
// Use for framework code, configuration loading, serialization
// Avoid in hot paths
```

---

# SECTION 12: DESIGN PATTERNS IN GO

## 12.1 Idiomatic Go Patterns

```go
// ---- FUNCTIONAL OPTIONS (canonical Go pattern) ----
type Server struct {
    host     string
    port     int
    timeout  time.Duration
    maxConns int
    tls      *tls.Config
    logger   *slog.Logger
}

type ServerOption func(*Server) error

func WithHost(host string) ServerOption {
    return func(s *Server) error {
        if host == "" { return errors.New("host cannot be empty") }
        s.host = host
        return nil
    }
}

func WithTLS(cert, key string) ServerOption {
    return func(s *Server) error {
        tlsCfg, err := loadTLSConfig(cert, key)
        if err != nil { return fmt.Errorf("TLS setup: %w", err) }
        s.tls = tlsCfg
        return nil
    }
}

func NewServer(opts ...ServerOption) (*Server, error) {
    s := &Server{
        host:     "0.0.0.0",
        port:     8080,
        timeout:  30 * time.Second,
        maxConns: 1000,
        logger:   slog.Default(),
    }
    for _, opt := range opts {
        if err := opt(s); err != nil {
            return nil, fmt.Errorf("NewServer: %w", err)
        }
    }
    return s, nil
}

// ---- MIDDLEWARE/DECORATOR ----
type Handler func(context.Context, *Request) (*Response, error)

type Middleware func(Handler) Handler

func WithLogging(logger *slog.Logger) Middleware {
    return func(next Handler) Handler {
        return func(ctx context.Context, req *Request) (*Response, error) {
            start := time.Now()
            resp, err := next(ctx, req)
            logger.Info("request", "duration", time.Since(start), "error", err)
            return resp, err
        }
    }
}

func WithRetry(maxAttempts int, delay time.Duration) Middleware {
    return func(next Handler) Handler {
        return func(ctx context.Context, req *Request) (*Response, error) {
            var lastErr error
            for i := 0; i < maxAttempts; i++ {
                resp, err := next(ctx, req)
                if err == nil { return resp, nil }
                lastErr = err
                select {
                case <-time.After(delay * time.Duration(i+1)):
                case <-ctx.Done():
                    return nil, ctx.Err()
                }
            }
            return nil, fmt.Errorf("after %d attempts: %w", maxAttempts, lastErr)
        }
    }
}

func Chain(h Handler, middleware ...Middleware) Handler {
    for i := len(middleware) - 1; i >= 0; i-- {
        h = middleware[i](h)
    }
    return h
}

// ---- WORKER POOL ----
type Job struct {
    ID   int
    Data interface{}
}

type Result struct {
    Job   Job
    Value interface{}
    Err   error
}

func WorkerPool(ctx context.Context, numWorkers int, jobs <-chan Job, process func(Job) Result) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup

    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for {
                select {
                case job, ok := <-jobs:
                    if !ok { return }
                    results <- process(job)
                case <-ctx.Done():
                    return
                }
            }
        }()
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}

// ---- TABLE-DRIVEN DISPATCH ----
type Processor func(context.Context, []byte) error

var processors = map[string]Processor{
    "user.created":  handleUserCreated,
    "user.deleted":  handleUserDeleted,
    "order.placed":  handleOrderPlaced,
}

func dispatch(ctx context.Context, eventType string, data []byte) error {
    fn, ok := processors[eventType]
    if !ok {
        return fmt.Errorf("unknown event type: %s", eventType)
    }
    return fn(ctx, data)
}
```

---

## 12.2 Repository and Service Pattern

```go
// Domain model
type User struct {
    ID        int
    Name      string
    Email     string
    Role      Role
    CreatedAt time.Time
    UpdatedAt time.Time
}

type Role string
const (
    RoleAdmin Role = "admin"
    RoleUser  Role = "user"
    RoleGuest Role = "guest"
)

// Repository interface
type UserRepository interface {
    FindByID(ctx context.Context, id int) (*User, error)
    FindByEmail(ctx context.Context, email string) (*User, error)
    List(ctx context.Context, filter UserFilter) ([]*User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int) error
}

type UserFilter struct {
    Role     *Role
    Page     int
    PageSize int
    OrderBy  string
}

// Service layer
type UserService struct {
    repo  UserRepository
    email EmailSender
    cache Cache
    log   *slog.Logger
}

func (s *UserService) CreateUser(ctx context.Context, req CreateUserRequest) (*User, error) {
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }

    existing, err := s.repo.FindByEmail(ctx, req.Email)
    if err != nil && !errors.Is(err, ErrNotFound) {
        return nil, fmt.Errorf("checking email: %w", err)
    }
    if existing != nil {
        return nil, &ConflictError{Message: "email already registered"}
    }

    user := &User{
        Name:      req.Name,
        Email:     req.Email,
        Role:      RoleUser,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }

    if err := s.repo.Create(ctx, user); err != nil {
        return nil, fmt.Errorf("creating user: %w", err)
    }

    // non-critical: fire-and-forget email
    go func() {
        if err := s.email.SendWelcome(context.Background(), user); err != nil {
            s.log.Error("failed to send welcome email", "error", err, "userID", user.ID)
        }
    }()

    return user, nil
}
```

---

# SECTION 13: DATABASE PATTERNS

## 13.1 database/sql

```go
import (
    "database/sql"
    _ "github.com/lib/pq" // driver: side effect import
)

// Setup connection pool
db, err := sql.Open("postgres", "postgres://user:pass@localhost/dbname?sslmode=disable")
if err != nil { log.Fatal(err) }

// Connection pool tuning — CRITICAL for production
db.SetMaxOpenConns(25)                  // max concurrent DB connections
db.SetMaxIdleConns(25)                  // maintain idle connections
db.SetConnMaxLifetime(5 * time.Minute)  // recycle connections
db.SetConnMaxIdleTime(5 * time.Minute)  // close idle connections

if err := db.Ping(); err != nil { log.Fatal(err) }

// Query with context
ctx := context.Background()

// Single row
var user User
err = db.QueryRowContext(ctx,
    "SELECT id, name, email, created_at FROM users WHERE id = $1", id,
).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)
if errors.Is(err, sql.ErrNoRows) {
    return nil, ErrNotFound
}
if err != nil { return nil, err }

// Multiple rows
rows, err := db.QueryContext(ctx,
    "SELECT id, name, email FROM users WHERE role = $1 ORDER BY name LIMIT $2 OFFSET $3",
    role, limit, offset)
if err != nil { return nil, err }
defer rows.Close() // ALWAYS close rows

var users []*User
for rows.Next() {
    var u User
    if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
        return nil, err
    }
    users = append(users, &u)
}
if err := rows.Err(); err != nil { // check iteration errors
    return nil, err
}

// Exec — INSERT, UPDATE, DELETE
result, err := db.ExecContext(ctx,
    "INSERT INTO users (name, email, role) VALUES ($1, $2, $3)",
    user.Name, user.Email, user.Role)
if err != nil { return err }

id, _ := result.LastInsertId()  // works for MySQL, not postgres
affected, _ := result.RowsAffected()

// For postgres — use RETURNING
var newID int
err = db.QueryRowContext(ctx,
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
    name, email).Scan(&newID)

// Transactions
tx, err := db.BeginTx(ctx, &sql.TxOptions{
    Isolation: sql.LevelReadCommitted,
    ReadOnly:  false,
})
if err != nil { return err }
defer tx.Rollback() // no-op if committed

_, err = tx.ExecContext(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID)
if err != nil { return err }

_, err = tx.ExecContext(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID)
if err != nil { return err }

return tx.Commit()

// Prepared statements — reuse across queries
stmt, err := db.PrepareContext(ctx, "SELECT id, name FROM users WHERE email = $1")
if err != nil { return err }
defer stmt.Close()

row := stmt.QueryRowContext(ctx, email)

// sql.Null types for nullable columns
var nullName sql.NullString
var nullAge sql.NullInt64
row.Scan(&nullName, &nullAge)
if nullName.Valid { fmt.Println(nullName.String) }
```

---

# SECTION 14: GOROUTINE PATTERNS — ADVANCED

## 14.1 Context Propagation and Cancellation

```go
// Timeout hierarchy
func (s *Service) ProcessRequest(ctx context.Context, req Request) (*Response, error) {
    // Overall timeout for entire operation
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()

    // Sub-operation timeouts
    fetchCtx, fetchCancel := context.WithTimeout(ctx, 3*time.Second)
    defer fetchCancel()

    data, err := s.fetchData(fetchCtx, req.ID)
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            return nil, fmt.Errorf("data fetch timed out: %w", err)
        }
        return nil, err
    }

    processCtx, processCancel := context.WithTimeout(ctx, 5*time.Second)
    defer processCancel()

    result, err := s.processData(processCtx, data)
    return result, err
}

// Semaphore pattern — limit goroutine concurrency
type Semaphore chan struct{}

func NewSemaphore(n int) Semaphore {
    return make(chan struct{}, n)
}

func (s Semaphore) Acquire(ctx context.Context) error {
    select {
    case s <- struct{}{}:
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func (s Semaphore) Release() { <-s }

// Rate limiting with time.Ticker
type RateLimiter struct {
    ticker *time.Ticker
    quit   chan struct{}
}

func NewRateLimiter(rps int) *RateLimiter {
    return &RateLimiter{
        ticker: time.NewTicker(time.Second / time.Duration(rps)),
        quit:   make(chan struct{}),
    }
}

func (r *RateLimiter) Wait(ctx context.Context) error {
    select {
    case <-r.ticker.C:
        return nil
    case <-ctx.Done():
        return ctx.Err()
    case <-r.quit:
        return errors.New("rate limiter stopped")
    }
}

// Circuit breaker pattern
type CircuitBreaker struct {
    mu           sync.Mutex
    failureCount int
    lastFailure  time.Time
    state        string // "closed", "open", "half-open"
    threshold    int
    timeout      time.Duration
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()
    state := cb.getState()
    cb.mu.Unlock()

    if state == "open" {
        return errors.New("circuit breaker open")
    }

    err := fn()
    cb.mu.Lock()
    defer cb.mu.Unlock()

    if err != nil {
        cb.failureCount++
        cb.lastFailure = time.Now()
        if cb.failureCount >= cb.threshold {
            cb.state = "open"
        }
        return err
    }

    cb.failureCount = 0
    cb.state = "closed"
    return nil
}

func (cb *CircuitBreaker) getState() string {
    if cb.state == "open" && time.Since(cb.lastFailure) > cb.timeout {
        cb.state = "half-open"
    }
    return cb.state
}
```

---

## 14.2 goroutine Lifecycle Management

```go
// Supervisor pattern — restart workers on failure
type Worker struct {
    id     int
    jobs   <-chan Job
    done   chan<- struct{}
    logger *slog.Logger
}

func (w *Worker) Run(ctx context.Context) {
    defer func() {
        if r := recover(); r != nil {
            w.logger.Error("worker panicked", "id", w.id, "panic", r)
            w.done <- struct{}{} // signal for restart
        }
    }()

    for {
        select {
        case job, ok := <-w.jobs:
            if !ok { return }
            w.process(job)
        case <-ctx.Done():
            return
        }
    }
}

// Bounded concurrency with error collection
func ProcessAll(ctx context.Context, items []Item, maxWorkers int) []error {
    sem := make(chan struct{}, maxWorkers)
    errs := make([]error, len(items))
    var mu sync.Mutex
    var wg sync.WaitGroup

    for i, item := range items {
        select {
        case sem <- struct{}{}:
        case <-ctx.Done():
            break
        }

        wg.Add(1)
        go func(i int, item Item) {
            defer wg.Done()
            defer func() { <-sem }()

            if err := processItem(ctx, item); err != nil {
                mu.Lock()
                errs[i] = err
                mu.Unlock()
            }
        }(i, item)
    }

    wg.Wait()
    return errs
}

// Graceful shutdown with multiple services
type App struct {
    services []Service
    logger   *slog.Logger
}

func (a *App) Run(ctx context.Context) error {
    g, ctx := errgroup.WithContext(ctx)

    for _, svc := range a.services {
        svc := svc // capture
        g.Go(func() error {
            return svc.Start(ctx)
        })
    }

    return g.Wait()
}

func main() {
    ctx, stop := signal.NotifyContext(context.Background(),
        syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    app := NewApp()
    if err := app.Run(ctx); err != nil && !errors.Is(err, context.Canceled) {
        log.Fatal(err)
    }
}
```

---

# SECTION 15: MEMORY MODEL AND PERFORMANCE

## 15.1 Go Memory Model

```go
// Go memory model — happens-before guarantees
// A send on a channel happens before the corresponding receive
// Closing a channel happens before a receive of the zero value
// goroutine start happens after the go statement
// goroutine exit has no happens-before guarantee without sync

// DATA RACE — concurrent access without synchronization
var counter int
go func() { counter++ }() // race!
go func() { counter++ }() // race!
// -race flag detects: go run -race main.go

// Safe: use atomic or mutex
var counter int64
go func() { atomic.AddInt64(&counter, 1) }()
go func() { atomic.AddInt64(&counter, 1) }()

// Memory escape analysis
// Values that escape to heap: returned pointers, interface values, closures, stack too small
// go build -gcflags="-m" to see escape analysis

// Stack allocation (no GC pressure)
func noEscape() int {
    x := 42 // stays on stack
    return x
}

// Heap allocation (GC must collect)
func escapes() *int {
    x := 42 // x escapes to heap — returned pointer
    return &x
}

// Avoid escapes: pass by pointer, use sync.Pool, pre-allocate
```

---

## 15.2 Performance Patterns

```go
// Pre-allocation — know the size
// Bad: repeated append causes multiple allocations
var result []int
for i := 0; i < 10000; i++ {
    result = append(result, i) // may reallocate many times
}

// Good: pre-allocate
result := make([]int, 0, 10000)
for i := 0; i < 10000; i++ {
    result = append(result, i) // single allocation
}

// Or: index directly
result := make([]int, 10000)
for i := range result {
    result[i] = i
}

// String building — avoid + concatenation in loops
// Bad: O(n²) allocations
s := ""
for i := 0; i < 1000; i++ {
    s += fmt.Sprintf("item%d", i) // new allocation each time
}

// Good: strings.Builder
var sb strings.Builder
sb.Grow(10000) // optional pre-allocate
for i := 0; i < 1000; i++ {
    fmt.Fprintf(&sb, "item%d", i)
}
s := sb.String()

// Struct layout — minimize padding
// Bad layout: 24 bytes due to alignment
type BadLayout struct {
    a bool    // 1 byte + 7 padding
    b float64 // 8 bytes
    c bool    // 1 byte + 7 padding
}

// Good layout: 10 bytes (after compiler alignment: 16)
type GoodLayout struct {
    b float64 // 8 bytes
    a bool    // 1 byte
    c bool    // 1 byte + 6 padding
}
// Use fieldalignment tool: go install golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest

// Interface boxing cost
// Storing a value in an interface causes allocation if value doesn't fit in pointer
// int, pointer, bool — no allocation
// structs, arrays — may allocate

// Inlining — small functions are inlined by compiler
// go build -gcflags="-m=2" to see inlining decisions
// pragma: //go:noinline prevents inlining

// CPU profiling
import "runtime/pprof"

f, _ := os.Create("cpu.prof")
pprof.StartCPUProfile(f)
defer pprof.StopCPUProfile()

// Memory profiling
runtime.GC() // force GC before snapshot
f, _ := os.Create("mem.prof")
pprof.WriteHeapProfile(f)

// go tool pprof cpu.prof
// (pprof) top10
// (pprof) web (requires graphviz)
// (pprof) list functionName

// Benchmarking properly
func BenchmarkMap(b *testing.B) {
    m := make(map[string]int)
    keys := make([]string, 1000)
    for i := range keys {
        keys[i] = fmt.Sprintf("key%d", i)
        m[keys[i]] = i
    }
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        _ = m[keys[i%1000]]
    }
}

// go test -bench=. -benchmem -count=5 | tee results.txt
// benchstat results.txt — statistical analysis
```

---

# SECTION 16: LOGGING AND OBSERVABILITY

## 16.1 slog (Go 1.21+)

```go
import "log/slog"

// Default logger
slog.Info("server started", "addr", ":8080")
slog.Error("request failed", "error", err, "path", r.URL.Path)
slog.Debug("cache miss", "key", key, "duration", time.Since(start))

// Structured logging
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelDebug,
    AddSource: true, // include file:line
}))

logger.Info("user created",
    slog.Int("userID", user.ID),
    slog.String("email", user.Email),
    slog.Duration("took", time.Since(start)),
)

// Logger with context (request-scoped fields)
logger = logger.With(
    slog.String("requestID", reqID),
    slog.String("userAgent", r.UserAgent()),
)

// Store in context
type loggerKey struct{}
ctx = context.WithValue(ctx, loggerKey{}, logger)
func LoggerFrom(ctx context.Context) *slog.Logger {
    if l, ok := ctx.Value(loggerKey{}).(*slog.Logger); ok { return l }
    return slog.Default()
}

// Custom handler for filtering/sampling
type SamplingHandler struct {
    handler slog.Handler
    rate    float64
}

func (h *SamplingHandler) Handle(ctx context.Context, r slog.Record) error {
    if r.Level < slog.LevelWarn && rand.Float64() > h.rate {
        return nil // sample out debug/info logs
    }
    return h.handler.Handle(ctx, r)
}

// slog levels: Debug=-4, Info=0, Warn=4, Error=8
// Custom levels
const LevelTrace = slog.Level(-8)
const LevelFatal = slog.Level(12)
```

---

## 16.2 Metrics and Tracing

```go
// Prometheus metrics
import "github.com/prometheus/client_golang/prometheus"

var (
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "path", "status"},
    )

    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration",
            Buckets: prometheus.DefBuckets, // .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10
        },
        []string{"method", "path"},
    )

    activeConnections = prometheus.NewGauge(prometheus.GaugeOpts{
        Name: "active_connections",
        Help: "Number of active connections",
    })
)

func init() {
    prometheus.MustRegister(requestsTotal, requestDuration, activeConnections)
}

func metricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        wrapped := &responseWriter{ResponseWriter: w, status: 200}

        activeConnections.Inc()
        defer activeConnections.Dec()

        next.ServeHTTP(wrapped, r)

        requestsTotal.WithLabelValues(r.Method, r.URL.Path, strconv.Itoa(wrapped.status)).Inc()
        requestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(time.Since(start).Seconds())
    })
}

// OpenTelemetry tracing
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/trace"
)

func (s *Service) GetUser(ctx context.Context, id int) (*User, error) {
    ctx, span := otel.Tracer("user-service").Start(ctx, "GetUser")
    defer span.End()

    span.SetAttributes(attribute.Int("user.id", id))

    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return nil, err
    }

    return user, nil
}
```

---

# SECTION 17: BUILD SYSTEM AND TOOLING

## 17.1 Go Build Tools

```bash
# Build commands
go build ./...              # build all packages
go build -o bin/server .    # build with output name
go build -race .            # with race detector
go build -tags production . # build tags

# Cross compilation
GOOS=linux GOARCH=amd64 go build -o bin/server-linux .
GOOS=darwin GOARCH=arm64 go build -o bin/server-mac-arm .
GOOS=windows GOARCH=amd64 go build -o bin/server.exe .

# Build flags
go build -ldflags="-X main.version=1.0.0 -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" .
# -s -w: strip debug info (smaller binary)
go build -ldflags="-s -w" .

# Accessing build info at runtime
import "runtime/debug"
info, _ := debug.ReadBuildInfo()
fmt.Println(info.Main.Version)

// Embedding version in binary
var (
    version   = "dev"
    buildTime = "unknown"
    commit    = "unknown"
)

// go:generate
//go:generate go run github.com/sqlc-dev/sqlc/cmd/sqlc generate
//go:generate stringer -type=Status
go generate ./...

// Build tags
//go:build linux && amd64
// +build linux,amd64  // old syntax, still needed for Go < 1.17

// Testing specific builds
//go:build integration
func TestIntegration(t *testing.T) { /* ... */ }
// go test -tags integration ./...

// Embed files
import _ "embed"

//go:embed templates/*.html
var templates embed.FS

//go:embed config.yaml
var configBytes []byte

tmpl, _ := template.ParseFS(templates, "templates/*.html")
```

---

## 17.2 Static Analysis and Linting

```bash
# Official tools
go vet ./...                 # catch common mistakes
go vet -shadow ./...         # detect variable shadowing

# golangci-lint — meta linter
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
golangci-lint run ./...

# .golangci.yml configuration
linters:
  enable:
    - errcheck      # check error returns
    - gosimple      # simplification suggestions
    - govet         # suspicious constructs
    - ineffassign   # ineffectual assignments
    - staticcheck   # static analysis
    - unused        # unused code
    - goimports     # import formatting
    - revive        # opinionated style
    - bodyclose     # ensure http bodies are closed
    - contextcheck  # context propagation
    - exhaustive    # exhaustive enum switches
    - noctx         # detect http requests without context
    - wrapcheck     # ensure errors are wrapped

# staticcheck — advanced analysis
go install honnef.co/go/tools/cmd/staticcheck@latest
staticcheck ./...
```

---

# SECTION 18: ADVANCED CONCURRENCY PATTERNS

## 18.1 Advanced Channel Patterns

```go
// Heartbeat pattern — goroutine signals it's alive
func worker(ctx context.Context) (<-chan struct{}, <-chan int) {
    heartbeat := make(chan struct{}, 1)
    results := make(chan int)

    go func() {
        defer close(results)
        pulse := time.NewTicker(500 * time.Millisecond)
        defer pulse.Stop()

        for {
            select {
            case heartbeat <- struct{}{}:
            default:
            }

            select {
            case <-pulse.C:
            case <-ctx.Done():
                return
            case results <- doWork():
            }
        }
    }()

    return heartbeat, results
}

// Or-done — stop reading from channels when done
func orDone(ctx context.Context, ch <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for {
            select {
            case <-ctx.Done():
                return
            case v, ok := <-ch:
                if !ok { return }
                select {
                case out <- v:
                case <-ctx.Done():
                    return
                }
            }
        }
    }()
    return out
}

// Tee channel — duplicate stream to two channels
func Tee(ctx context.Context, in <-chan int) (<-chan int, <-chan int) {
    out1 := make(chan int)
    out2 := make(chan int)

    go func() {
        defer close(out1)
        defer close(out2)
        for v := range orDone(ctx, in) {
            // local vars so both selects reference same value
            var out1, out2 = out1, out2
            for i := 0; i < 2; i++ {
                select {
                case out1 <- v:
                    out1 = nil
                case out2 <- v:
                    out2 = nil
                }
            }
        }
    }()

    return out1, out2
}

// Bridge — flatten channel of channels
func Bridge(ctx context.Context, chanStream <-chan <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for {
            var stream <-chan int
            select {
            case maybeStream, ok := <-chanStream:
                if !ok { return }
                stream = maybeStream
            case <-ctx.Done():
                return
            }
            for v := range orDone(ctx, stream) {
                select {
                case out <- v:
                case <-ctx.Done():
                    return
                }
            }
        }
    }()
    return out
}
```

---

## 18.2 lock-free Data Structures

```go
// Lock-free stack using CAS (Compare-And-Swap)
import "sync/atomic"
import "unsafe"

type LFNode struct {
    value int
    next  unsafe.Pointer
}

type LockFreeStack struct {
    head unsafe.Pointer
}

func (s *LockFreeStack) Push(val int) {
    node := &LFNode{value: val}
    for {
        oldHead := atomic.LoadPointer(&s.head)
        node.next = oldHead
        if atomic.CompareAndSwapPointer(&s.head, oldHead, unsafe.Pointer(node)) {
            return
        }
    }
}

func (s *LockFreeStack) Pop() (int, bool) {
    for {
        oldHead := atomic.LoadPointer(&s.head)
        if oldHead == nil { return 0, false }
        node := (*LFNode)(oldHead)
        if atomic.CompareAndSwapPointer(&s.head, oldHead, node.next) {
            return node.value, true
        }
    }
}

// ABA problem note: production lock-free requires hazard pointers or epoch-based reclamation
// In practice, sync.Mutex or channel-based solutions are preferred unless profiled hot path
```

---

# SECTION 19: MICROSERVICES PATTERNS

## 19.1 gRPC with Go

```go
// proto file: user.proto
// service UserService {
//     rpc GetUser(GetUserRequest) returns (GetUserResponse);
//     rpc ListUsers(ListUsersRequest) returns (stream User);
//     rpc WatchUsers(WatchRequest) returns (stream UserEvent);
// }

// Generated server implementation
type UserServer struct {
    pb.UnimplementedUserServiceServer
    service *UserService
}

func (s *UserServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    user, err := s.service.GetUser(ctx, int(req.Id))
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            return nil, status.Errorf(codes.NotFound, "user %d not found", req.Id)
        }
        return nil, status.Errorf(codes.Internal, "internal error: %v", err)
    }

    return &pb.GetUserResponse{
        User: &pb.User{
            Id:    int32(user.ID),
            Name:  user.Name,
            Email: user.Email,
        },
    }, nil
}

// Server streaming
func (s *UserServer) ListUsers(req *pb.ListUsersRequest, stream pb.UserService_ListUsersServer) error {
    users, err := s.service.ListAll(stream.Context())
    if err != nil { return status.Errorf(codes.Internal, "%v", err) }

    for _, user := range users {
        if err := stream.Send(&pb.User{Id: int32(user.ID), Name: user.Name}); err != nil {
            return err
        }
    }
    return nil
}

// gRPC server setup
func startGRPC(svc *UserService) {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil { log.Fatal(err) }

    grpcServer := grpc.NewServer(
        grpc.ChainUnaryInterceptor(
            loggingInterceptor,
            recoveryInterceptor,
            authInterceptor,
        ),
        grpc.MaxRecvMsgSize(4*1024*1024), // 4MB
    )

    pb.RegisterUserServiceServer(grpcServer, &UserServer{service: svc})
    reflection.Register(grpcServer) // enable grpcurl in dev

    if err := grpcServer.Serve(lis); err != nil {
        log.Fatal(err)
    }
}

// Unary interceptor
func loggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    log.Printf("method=%s duration=%v err=%v", info.FullMethod, time.Since(start), err)
    return resp, err
}
```

---

# SECTION 20: COMMON INTERVIEW CHALLENGES

## 20.1 Classic Go Problems

```go
// --- PROBLEM: Concurrent map counter ---
// Count word frequency across many goroutines

// Approach 1: mutex
type WordCounter struct {
    mu    sync.Mutex
    counts map[string]int
}

func (wc *WordCounter) Increment(word string) {
    wc.mu.Lock()
    wc.counts[word]++
    wc.mu.Unlock()
}

// Approach 2: channel aggregation
func countWords(words <-chan string) map[string]int {
    counts := make(map[string]int)
    for w := range words {
        counts[w]++
    }
    return counts
}

// Approach 3: sharded map (highest performance)
type ShardedMap struct {
    shards [256]struct {
        sync.RWMutex
        m map[string]int
    }
}

func (sm *ShardedMap) shard(key string) int {
    h := fnv.New32()
    h.Write([]byte(key))
    return int(h.Sum32() % 256)
}

// --- PROBLEM: Implement a timeout ---
func fetchWithTimeout(url string, timeout time.Duration) ([]byte, error) {
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil { return nil, err }

    resp, err := http.DefaultClient.Do(req)
    if err != nil { return nil, err }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

// --- PROBLEM: Merge sorted channels ---
func MergeSorted(ctx context.Context, channels ...<-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        // min heap of (value, channelIndex)
        h := &minHeap{}
        heap.Init(h)

        // Initialize with first element from each channel
        for i, ch := range channels {
            if v, ok := <-ch; ok {
                heap.Push(h, heapItem{val: v, idx: i})
            }
        }

        for h.Len() > 0 {
            item := heap.Pop(h).(heapItem)
            select {
            case out <- item.val:
            case <-ctx.Done():
                return
            }
            // Get next from same channel
            if v, ok := <-channels[item.idx]; ok {
                heap.Push(h, heapItem{val: v, idx: item.idx})
            }
        }
    }()
    return out
}

// --- PROBLEM: Rate-limited API caller ---
type APIClient struct {
    client  *http.Client
    limiter *rate.Limiter // golang.org/x/time/rate
}

func NewAPIClient(rps int) *APIClient {
    return &APIClient{
        client:  &http.Client{Timeout: 10 * time.Second},
        limiter: rate.NewLimiter(rate.Limit(rps), rps), // tokens per second, burst size
    }
}

func (c *APIClient) Get(ctx context.Context, url string) (*http.Response, error) {
    if err := c.limiter.Wait(ctx); err != nil {
        return nil, fmt.Errorf("rate limit wait: %w", err)
    }

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil { return nil, err }

    return c.client.Do(req)
}

// --- PROBLEM: Implement Once with reset ---
type ResettableOnce struct {
    mu   sync.Mutex
    done bool
}

func (o *ResettableOnce) Do(f func()) {
    o.mu.Lock()
    defer o.mu.Unlock()
    if !o.done {
        f()
        o.done = true
    }
}

func (o *ResettableOnce) Reset() {
    o.mu.Lock()
    defer o.mu.Unlock()
    o.done = false
}
```

---

# SECTION 21: GOTCHAS AND ANTI-PATTERNS

## 21.1 Common Go Mistakes

```go
// GOTCHA 1: nil interface vs nil concrete type
type MyError struct{ msg string }
func (e *MyError) Error() string { return e.msg }

func mayFail(fail bool) error {
    var err *MyError = nil
    if fail { err = &MyError{"failed"} }
    return err // BUG: returns non-nil error interface even when err is nil!
}

// Fix:
func mayFail2(fail bool) error {
    if fail { return &MyError{"failed"} }
    return nil // explicit nil interface
}

// GOTCHA 2: goroutine closure captures loop variable (pre Go 1.22)
funcs := make([]func(), 5)
for i := 0; i < 5; i++ {
    funcs[i] = func() { fmt.Println(i) } // all print 5!
}
// Fix:
for i := 0; i < 5; i++ {
    i := i // shadow
    funcs[i] = func() { fmt.Println(i) }
}
// Go 1.22: loop variables are per-iteration by default, no shadow needed

// GOTCHA 3: defer in loop
for _, file := range files {
    f, _ := os.Open(file)
    defer f.Close() // executes when FUNCTION returns, not loop iteration!
}
// Fix:
for _, file := range files {
    func() {
        f, _ := os.Open(file)
        defer f.Close() // now closes on each iteration
        process(f)
    }()
}

// GOTCHA 4: slice sharing
func remove(s []int, i int) []int {
    return append(s[:i], s[i+1:]...)  // modifies original backing array!
}
// Fix: copy first
func removeSafe(s []int, i int) []int {
    result := make([]int, 0, len(s)-1)
    result = append(result, s[:i]...)
    result = append(result, s[i+1:]...)
    return result
}

// GOTCHA 5: map concurrency
var m = map[string]int{}
go func() { m["key"] = 1 }()  // data race!
go func() { _ = m["key"] }()  // data race!

// GOTCHA 6: copying a mutex
type Counter struct {
    mu    sync.Mutex
    count int
}
func badCopy(c Counter) { // copies mutex — undefined behavior!
    c.mu.Lock()
    // ...
}
// Fix: always use pointer receivers with mutex
func goodMethod(c *Counter) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

// GOTCHA 7: not closing response body
resp, err := http.Get(url) // leaks connection if body not read and closed!
if err != nil { return err }
// ALWAYS do both:
defer resp.Body.Close()
_, _ = io.Copy(io.Discard, resp.Body) // drain body to allow connection reuse

// GOTCHA 8: shadowing err
val, err := getA()
if err != nil { return err }
val2, err := getB()  // OK: new val2, reassigns err
if err != nil { return err }
// But:
val3, err2 := getC()  // unnecessary new err2
// Prefer: val3, err = getC()

// GOTCHA 9: integer overflow
var x int8 = 127
x++ // wraps to -128! No runtime error in Go

// GOTCHA 10: time.After leaks
for {
    select {
    case v := <-ch:
        fmt.Println(v)
    case <-time.After(1 * time.Second): // new timer every loop! leaks until GC
        fmt.Println("timeout")
    }
}
// Fix:
ticker := time.NewTimer(1 * time.Second)
defer ticker.Stop()
for {
    ticker.Reset(1 * time.Second)
    select {
    case v := <-ch:
        fmt.Println(v)
    case <-ticker.C:
        fmt.Println("timeout")
    }
}
```

---

# SECTION 22: GO RUNTIME INTERNALS

## 22.1 Scheduler, GC, and Stack

```
GOROUTINE SCHEDULER (GMP model):
- G: Goroutine — lightweight thread (~2KB initial stack, grows to ~1GB max)
- M: Machine (OS thread) — actually executes goroutines
- P: Processor — scheduling context, holds runqueue of goroutines

GOMAXPROCS = number of P's (default = CPU cores)
Each P has a local run queue (LRQ) + global run queue (GRQ)
Work stealing: idle P steals from other P's queues

GOROUTINE STATES:
- Runnable: ready to run, in run queue
- Running: currently executing on an M
- Blocked: waiting (channel, syscall, mutex)
- Dead: finished

PREEMPTION:
- Before Go 1.14: cooperative — goroutines yield at function calls
- Go 1.14+: asynchronous preemption — signal-based, can preempt at any safe point
- No preemption: CGo calls, assembly functions

STACK GROWTH:
- Initial goroutine stack: 2KB (configurable)
- Grows by allocating new stack and copying
- Shrinks during GC when 1/4 used
- GODEBUG=gccheckmark=1 for stack checks

GARBAGE COLLECTOR (Tricolor Mark-and-Sweep):
- Concurrent — runs mostly alongside application
- Stop-the-world pauses: very short (sub-millisecond in modern Go)
- Write barrier: during mark phase, tracks pointer writes
- Tricolor invariant: objects are white (unchecked), gray (in queue), black (done)
- GOGC=100 (default): GC when heap doubles since last GC
- GOGC=off: disable GC
- runtime.GC(): force GC
- runtime.ReadMemStats(): detailed memory stats

MEMORY ALLOCATOR:
- Small objects (<32KB): mcache → mcentral → mheap
- Large objects (≥32KB): directly from mheap
- Tiny allocations (<16B, no pointers): packed together
- Object sizes quantized into ~70 size classes

ESCAPE ANALYSIS:
- Values that escape to heap: stored in interface, returned pointer, captured by goroutine, 
  too large for stack, stored in map/channel, reflect operations
- go build -gcflags="-m" shows escape decisions
- Heap allocation: slower allocation, GC pressure
- Stack allocation: fast, no GC needed
```

---

## 22.2 Runtime Diagnostics

```go
import "runtime"

// Memory stats
var stats runtime.MemStats
runtime.ReadMemStats(&stats)
fmt.Printf("Alloc: %v MiB\n", stats.Alloc/1024/1024)
fmt.Printf("TotalAlloc: %v MiB\n", stats.TotalAlloc/1024/1024)
fmt.Printf("Sys: %v MiB\n", stats.Sys/1024/1024)
fmt.Printf("NumGC: %v\n", stats.NumGC)
fmt.Printf("GCCPUFraction: %.2f%%\n", stats.GCCPUFraction*100)

// Goroutine count
fmt.Println("goroutines:", runtime.NumGoroutine())

// pprof endpoints in HTTP server
import _ "net/http/pprof"
// GET /debug/pprof/goroutine — goroutine stack dumps
// GET /debug/pprof/heap     — heap profile
// GET /debug/pprof/cpu      — CPU profile (30s)

// Goroutine stack dump on signal
import "os/signal"
go func() {
    sigs := make(chan os.Signal, 1)
    signal.Notify(sigs, syscall.SIGUSR1)
    for range sigs {
        buf := make([]byte, 1<<20)
        n := runtime.Stack(buf, true) // all goroutines
        fmt.Printf("=== GOROUTINE DUMP ===\n%s\n", buf[:n])
    }
}()

// GODEBUG environment variables
// GODEBUG=gctrace=1 — print GC timing info
// GODEBUG=gccheckmark=1 — verify GC correctness
// GODEBUG=schedtrace=1000 — scheduler trace every 1000ms
// GODEBUG=asyncpreemptoff=1 — disable async preemption
// GOMAXPROCS=1 — single OS thread (useful for debugging races)
```

---

# SECTION 23: REAL-WORLD PROJECT STRUCTURE

## 23.1 Standard Go Project Layout

```
myproject/
├── cmd/                    # Main applications
│   ├── api/
│   │   └── main.go         # API server entry point
│   └── worker/
│       └── main.go         # Background worker entry point
├── internal/               # Private code (not importable externally)
│   ├── domain/             # Domain models, interfaces
│   │   ├── user.go
│   │   └── order.go
│   ├── repository/         # Data access implementations
│   │   ├── postgres/
│   │   │   └── user.go
│   │   └── redis/
│   │       └── cache.go
│   ├── service/            # Business logic
│   │   └── user.go
│   ├── handler/            # HTTP/gRPC handlers
│   │   └── user.go
│   └── middleware/
│       └── auth.go
├── pkg/                    # Public reusable packages
│   ├── logger/
│   └── errors/
├── api/                    # API definitions
│   └── proto/
│       └── user.proto
├── migrations/             # Database migrations
├── config/                 # Configuration
│   └── config.go
├── scripts/                # Build/deploy scripts
├── Makefile
├── go.mod
├── go.sum
└── README.md

// main.go pattern — dependency injection wiring
func main() {
    cfg := config.Load()
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    db, err := postgres.Connect(cfg.DatabaseURL)
    if err != nil { logger.Error("db connect", "error", err); os.Exit(1) }
    defer db.Close()

    cache := redis.NewClient(cfg.RedisURL)
    defer cache.Close()

    // Wire dependencies
    userRepo := userpostgres.NewRepository(db)
    userCache := userredis.NewCache(cache)
    userSvc := userservice.New(userRepo, userCache, logger)
    userHandler := userhttp.NewHandler(userSvc)

    // HTTP server
    mux := http.NewServeMux()
    userHandler.Register(mux)

    srv := &http.Server{
        Addr:    cfg.Addr,
        Handler: middleware.Chain(mux, middleware.Logging(logger), middleware.Recovery),
    }

    // Graceful shutdown
    ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    go func() {
        logger.Info("server starting", "addr", cfg.Addr)
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            logger.Error("server error", "error", err)
            stop()
        }
    }()

    <-ctx.Done()
    logger.Info("shutting down")

    shutCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    srv.Shutdown(shutCtx)
}
```

---

# SECTION 24: ECOSYSTEM OVERVIEW

## 24.1 Key Go Libraries and Frameworks

```
WEB FRAMEWORKS:
├── net/http (stdlib)    — sufficient for most cases in Go 1.22+ (pattern routing)
├── gin                  — fast, popular, middleware-rich
├── echo                 — fast, clean API
├── chi                  — lightweight, compatible with net/http
├── fiber                — Express-like, built on fasthttp
└── gorilla/mux          — classic mux (now in maintenance mode)

DATABASE:
├── database/sql (stdlib) — standard interface
├── pgx                   — PostgreSQL native driver (preferred over lib/pq)
├── sqlx                  — extensions for database/sql
├── GORM                  — full ORM (reflection-heavy, slower)
├── sqlc                  — generate type-safe Go from SQL queries
├── ent                   — Facebook's graph ORM
└── bun                   — fast SQL-first ORM

CONFIGURATION:
├── viper                 — 12-factor app config (files, env, flags)
├── envconfig             — struct-based env config
└── cleanenv              — minimal config from env/files

TESTING:
├── testing (stdlib)      — sufficient for most tests
├── testify               — assertions, mocking (assert, require, mock)
├── gomock                — interface mock generation
├── mockery               — mock generator
└── gock                  — HTTP mocking

OBSERVABILITY:
├── log/slog (stdlib 1.21) — structured logging
├── uber-go/zap           — high-performance logging
├── prometheus/client_golang — metrics
├── go.opentelemetry.io   — distributed tracing

CONCURRENCY:
├── golang.org/x/sync     — errgroup, semaphore, singleflight
├── golang.org/x/time     — rate limiting
└── panjf2000/ants        — goroutine pool

gRPC:
├── google.golang.org/grpc
├── google.golang.org/protobuf
└── grpc-gateway          — HTTP/JSON → gRPC transcoding

VALIDATION:
├── go-playground/validator — struct tag validation
└── bufbuild/protovalidate  — proto validation

DEPENDENCY INJECTION:
├── google/wire           — compile-time DI code generation
├── uber-go/fx            — dependency injection framework
└── samber/do             — reflection-based DI

CLI:
├── cobra                 — powerful CLI framework (k8s, docker use it)
├── urfave/cli            — simpler CLI framework
└── flag (stdlib)         — basic flag parsing

SERIALIZATION:
├── encoding/json (stdlib) — standard JSON
├── json-iterator/go      — faster json (drop-in replacement)
├── mailru/easyjson       — code-gen JSON (fastest)
├── encoding/gob          — Go-native binary format
└── google/flatbuffers    — zero-copy serialization
```

---

# SECTION 25: TALENT SIGNALS REFERENCE TABLE

## Assessment Guide by Level

```
LEVEL 1 — JUNIOR SIGNALS:
+ Knows all basic types: int, string, bool, byte, rune, float64
+ Understands := vs var declaration
+ Can write functions with multiple return values and handle errors
+ Understands slices vs arrays (length, capacity, append)
+ Can range over slices, maps, channels
+ Knows when to use pointers (mutation) vs values
+ Understands defer (LIFO, runs on return)
+ Can write basic goroutines and use WaitGroup
+ Knows the error interface and if err != nil pattern
+ Understands nil (pointer, slice, map, channel, func, interface)

JUNIOR RED FLAGS:
- Doesn't check error returns ("I'll add error handling later")
- Uses panic for expected errors
- Doesn't know difference between nil slice and empty slice
- Confused by value vs pointer receivers
- Uses global variables for everything
- Doesn't defer file/resource closes

LEVEL 2 — MID SIGNALS:
+ Writes idiomatic interfaces (small, composable)
+ Uses functional options pattern for configuration
+ Understands goroutine lifecycle and leak prevention
+ Uses context.Context correctly (pass through, cancel, timeout)
+ Knows sync.Mutex, sync.RWMutex, sync.Once, sync.WaitGroup
+ Writes table-driven tests with t.Run subtests
+ Understands channel directions (chan<-, <-chan)
+ Can implement fan-out, fan-in, pipeline patterns
+ Knows when to use channels vs mutexes
+ Uses errgroup for parallel error handling
+ Understands escape analysis at a basic level
+ Writes benchmarks and understands -race flag
+ Comfortable with reflect for tag-based frameworks

MID RED FLAGS:
- Uses goroutines without thinking about lifecycle
- Copies mutexes (passes struct with mutex by value)
- Ignores the nil interface gotcha
- Doesn't understand buffered vs unbuffered channels
- Can't explain why channels don't guarantee message ordering across goroutines

LEVEL 3 — SENIOR SIGNALS:
+ Designs interfaces at the right level of abstraction (accept interfaces, return structs)
+ Understands GMP scheduler model and its implications
+ Knows GC mechanics and how to reduce GC pressure
+ Can discuss GOMAXPROCS tuning and its effects
+ Identifies goroutine leaks proactively in code review
+ Uses pprof for profiling and can read flame graphs
+ Designs for graceful shutdown from the start
+ Understands happens-before in the Go memory model
+ Can argue for channels vs mutexes based on ownership semantics
+ Designs connection pools appropriately (SetMaxOpenConns, etc.)
+ Understands module versioning implications (major version breaks)
+ Knows when NOT to use generics (added complexity vs type safety tradeoff)
+ Can discuss CGo costs and why to avoid it in hot paths
+ Thinks about binary size, startup time for serverless/containers
+ Can design a system where Go's lack of generics (pre-1.18) was a real constraint and how they handled it
+ Understands singleflight for cache stampede prevention
+ Can explain why copying a sync.Mutex is undefined behavior at the memory model level

SENIOR RED FLAGS:
- Over-engineers concurrency (channels when a mutex would do)
- Doesn't think about connection pool exhaustion under load
- Can't explain goroutine scheduler preemption
- Writes Java-style OOP in Go (deep inheritance hierarchies via embedding)
- Uses recover() to silently swallow all panics
- Doesn't understand that interface comparison includes dynamic type
- "We should use microservices" without discussing operational cost

ARCHITECTURAL SIGNALS (Staff/Principal):
+ Knows when Go is the wrong tool (CPU-bound numerics → Rust/C, ML → Python)
+ Can discuss Kubernetes client-go internals and informer patterns
+ Understands why Go's lack of ADTs (algebraic data types) matters for domain modeling
+ Thinks about observability (metrics, traces, logs) as first-class requirements
+ Has opinions on error handling strategies at scale (sentinel vs typed vs wrapped)
+ Can design a reliable message processing system with at-least-once/exactly-once guarantees
+ Understands NUMA effects on Go runtime performance
+ Can reason about garbage collection pauses in latency-sensitive systems
+ Has experience with Go's toolchain in monorepos (module graph, workspace mode)
```

---

# SECTION 26: QUICK REFERENCE — COMMON RECIPES

## Go Patterns Used in Real Codebases

```go
// 1. Retry with exponential backoff
func retry(ctx context.Context, maxAttempts int, fn func() error) error {
    var lastErr error
    for i := 0; i < maxAttempts; i++ {
        if err := fn(); err == nil { return nil } else { lastErr = err }
        delay := time.Duration(1<<uint(i)) * 100 * time.Millisecond
        select {
        case <-time.After(delay):
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    return fmt.Errorf("after %d attempts: %w", maxAttempts, lastErr)
}

// 2. Singleflight — prevent cache stampede
import "golang.org/x/sync/singleflight"
var sfg singleflight.Group

func getUser(ctx context.Context, id int) (*User, error) {
    v, err, _ := sfg.Do(fmt.Sprintf("user:%d", id), func() (interface{}, error) {
        return db.GetUser(ctx, id) // only one DB call even if 1000 concurrent requests
    })
    if err != nil { return nil, err }
    return v.(*User), nil
}

// 3. Read config from env with defaults
func getEnv(key, defaultVal string) string {
    if v := os.Getenv(key); v != "" { return v }
    return defaultVal
}
func getEnvInt(key string, defaultVal int) int {
    if v := os.Getenv(key); v != "" {
        if n, err := strconv.Atoi(v); err == nil { return n }
    }
    return defaultVal
}

// 4. Safe type assertion helper
func assertString(v interface{}) (string, bool) {
    s, ok := v.(string)
    return s, ok
}

// 5. Must pattern — panic on startup errors, not at runtime
func mustGetenv(key string) string {
    v := os.Getenv(key)
    if v == "" { panic(fmt.Sprintf("required env var %s not set", key) }
    return v
}

// 6. Pointer to value helpers
func ptr[T any](v T) *T { return &v }
ptrStr := ptr("hello")
ptrInt := ptr(42)

// 7. Drain and close channel safely
func drainAndClose[T any](ch chan T) {
    close(ch)
    for range ch {}
}

// 8. Copy slice
func copySlice[T any](s []T) []T {
    c := make([]T, len(s))
    copy(c, s)
    return c
}

// 9. Keys of map
func keys[K comparable, V any](m map[K]V) []K {
    result := make([]K, 0, len(m))
    for k := range m { result = append(result, k) }
    return result
}

// 10. Chunk slice
func chunk[T any](s []T, size int) [][]T {
    var chunks [][]T
    for size < len(s) {
        s, chunks = s[size:], append(chunks, s[:size:size])
    }
    return append(chunks, s)
}

// 11. First non-zero value (like SQL COALESCE)
func coalesce[T comparable](vals ...T) T {
    var zero T
    for _, v := range vals {
        if v != zero { return v }
    }
    return zero
}

// 12. Timeout helper for tests
func withTimeout(t *testing.T, timeout time.Duration, fn func()) {
    t.Helper()
    done := make(chan struct{})
    go func() { fn(); close(done) }()
    select {
    case <-done:
    case <-time.After(timeout):
        t.Fatalf("test timed out after %v", timeout)
    }
}

// 13. Graceful HTTP shutdown boilerplate
func runServer(ctx context.Context, srv *http.Server) error {
    errCh := make(chan error, 1)
    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            errCh <- err
        }
        close(errCh)
    }()

    select {
    case err := <-errCh:
        return err
    case <-ctx.Done():
        shutCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        return srv.Shutdown(shutCtx)
    }
}

// 14. Generic set type
type Set[T comparable] map[T]struct{}
func (s Set[T]) Add(v T) { s[v] = struct{}{} }
func (s Set[T]) Has(v T) bool { _, ok := s[v]; return ok }
func (s Set[T]) Delete(v T) { delete(s, v) }
func (s Set[T]) Slice() []T {
    result := make([]T, 0, len(s))
    for v := range s { result = append(result, v) }
    return result
}

// 15. Environment-based logger setup
func newLogger(env string) *slog.Logger {
    if env == "production" {
        return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
            Level: slog.LevelInfo,
        }))
    }
    return slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
        AddSource: true,
    }))
}
```

---

# SECTION 27: GO VERSION HISTORY — KEY MILESTONES

```
Go 1.0  (2012): Language specification frozen
Go 1.5  (2015): GC rewritten (concurrent), GOMAXPROCS=NumCPU default
Go 1.7  (2016): context package added to stdlib
Go 1.11 (2018): Modules introduced (experimental)
Go 1.13 (2019): error wrapping (%w), errors.Is, errors.As, errors.Unwrap
Go 1.14 (2020): Goroutine asynchronous preemption, module-aware mode default
Go 1.16 (2021): Modules on by default, embed package, io/fs interface
Go 1.17 (2021): Module graph pruning, //go:build syntax
Go 1.18 (2022): Generics (type parameters), fuzzing, workspace mode
Go 1.19 (2022): Soft memory limit (GOMEMLIMIT), slog draft
Go 1.20 (2023): errors.Join, comparable types in any constraint
Go 1.21 (2023): log/slog stdlib, slices/maps/cmp packages, min/max builtins, clear builtin
Go 1.22 (2024): Enhanced routing in net/http (method+path), loop variable per-iteration, range over int
Go 1.23 (2024): iter package, range over func iterators, Timer/Ticker improvements
Go 1.24 (2025): Swiss tables map implementation (faster maps), weak pointers, finalize

KEY UPCOMING / RECENT FEATURES:
- range over function iterators: for v := range slices.Values(s) {}
- iter.Seq[V] and iter.Seq2[K,V] — iterator types
- Structured concurrency proposals (ongoing discussion)
- Opt-in telemetry (Go 1.21+)
- Generic type inference improvements each release
```

---

*End of Golang RAG Knowledge Base Document*
*Total sections: 27 | Coverage: Junior through Staff | Includes: Runtime internals, concurrency patterns, standard library, ecosystem, anti-patterns, architectural patterns*
