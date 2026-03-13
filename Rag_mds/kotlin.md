# KOTLIN — FULL-SPECTRUM RAG KNOWLEDGE BASE

> Structured for AI Interviewer · Three-Level Contextual Model · Junior → Mid → Senior  
> Topics: Core Syntax · OOP · Null Safety · Collections · Coroutines · Flows · Extension Functions · DSLs · Generics · Spring Boot · Ktor · Testing · Android · Performance · Multiplatform · Interop

---

# SECTION 1 · CORE SYNTAX & LANGUAGE FUNDAMENTALS

> `[JUNIOR]` Variables, types, control flow, functions, null safety  
> `[MID]` Destructuring, operator overloading, type aliases, inline functions  
> `[SENIOR]` Reified generics, contracts, type-safe builders, value classes

---

## 1.1 Variables, Types, and Basic Syntax

```kotlin
// Variables
val name: String = "Alice"          // immutable reference (val ≈ Java final)
var count: Int   = 0                // mutable reference
val inferred     = "type inferred"  // compiler infers String

// Type system — everything is an object (no primitives at source level)
val byte:   Byte    = 127
val short:  Short   = 32_767
val int:    Int     = 2_147_483_647
val long:   Long    = 9_223_372_036_854_775_807L
val float:  Float   = 3.14f
val double: Double  = 3.14159265358979
val char:   Char    = 'A'
val bool:   Boolean = true

// At bytecode level, Kotlin uses JVM primitives where possible (int, long, etc.)
// Nullable versions (Int?) always boxed to java.lang.Integer

// String templates — avoid concatenation
val greeting = "Hello, $name!"
val expr     = "2 + 2 = ${2 + 2}"
val multi    = """
    |SELECT *
    |FROM users
    |WHERE id = $id
""".trimMargin()                     // trimMargin strips leading whitespace up to |

// Type conversions — explicit (no implicit widening)
val i: Int   = 42
val l: Long  = i.toLong()           // explicit; i as Long does NOT work
val d: Double = i.toDouble()

// Any, Unit, Nothing
val any: Any = "can hold anything"  // ≈ java.lang.Object
fun log(msg: String): Unit {}       // Unit ≈ void (return type omitted if Unit)
fun fail(msg: String): Nothing =    // Nothing — function never returns normally
    throw IllegalStateException(msg)

// Type checks and casts
if (any is String) {
    println(any.length)              // smart cast — no explicit cast needed
}
val str = any as String              // unsafe cast — throws ClassCastException if wrong type
val str2 = any as? String           // safe cast — returns null if wrong type
```

---

## 1.2 Null Safety

```kotlin
// Kotlin's type system distinguishes nullable and non-null types
var nonNull: String  = "hello"      // can NEVER be null
var nullable: String? = null        // can be null

// Safe call operator ?.
val length = nullable?.length       // null if nullable is null; Int? type
val upper  = nullable?.uppercase()?.trim()  // chains safely

// Elvis operator ?: — provide default when null
val len = nullable?.length ?: 0     // 0 if nullable is null
val user = findUser(id) ?: throw UserNotFoundException(id)

// Non-null assertion !! — throws NullPointerException if null (use sparingly)
val definitelyNotNull = nullable!!  // String type; NPE if nullable is null
// Use only when you know it can't be null but compiler doesn't

// let — execute block only when non-null
nullable?.let { value ->
    println("Value is: $value")     // value is smart-cast to String inside block
}

// Safe navigation with higher-order functions
val result = list.firstOrNull()?.let { processItem(it) } ?: defaultValue

// lateinit — delay initialization of non-null var (for DI, test setup)
class MyService {
    lateinit var repo: UserRepository  // non-null but initialized later

    fun init() { repo = UserRepository() }

    fun isInitialized() = ::repo.isInitialized  // check before access
}

// Nullability contracts with require/check
fun processUser(user: User?) {
    requireNotNull(user) { "User cannot be null" }  // throws IllegalArgumentException
    // user is smart-cast to User here
    checkNotNull(user.email) { "Email required" }   // throws IllegalStateException
}

// Platform types — from Java interop (String! — may or may not be null)
// Always annotate Java code with @Nullable / @NonNull for Kotlin safety

// Null-safe equality
val a: String? = null
val b: String? = null
println(a == b)      // → true  (structural equality, null-safe)
println(a === b)     // → true  (referential equality for null constants)
```

---

## 1.3 Control Flow as Expressions

```kotlin
// if — expression (returns value)
val max = if (a > b) a else b
val grade = if (score >= 90) "A" else if (score >= 80) "B" else "C"

// when — expression (replaces switch + more powerful)
val description = when (status) {
    "pending"   -> "Order is pending"
    "confirmed" -> "Order confirmed"
    "cancelled" -> "Order cancelled"
    else        -> "Unknown status"
}

// when with type checks
fun describe(obj: Any): String = when (obj) {
    is Int     -> "Int: $obj"
    is String  -> "String of length ${obj.length}"
    is List<*> -> "List with ${obj.size} items"
    null       -> "null"
    else       -> "Unknown: ${obj::class.simpleName}"
}

// when without argument — replaces if/else chain
when {
    score >= 90 -> "A"
    score >= 80 -> "B"
    score >= 70 -> "C"
    else        -> "F"
}

// for — iteration
for (i in 1..10)      { }          // 1 to 10 inclusive
for (i in 1 until 10) { }          // 1 to 9 (exclusive)
for (i in 10 downTo 1 step 2) { }  // 10, 8, 6, 4, 2
for (item in list)    { }
for ((index, value) in list.withIndex()) { println("$index: $value") }
for ((key, value) in map) { println("$key -> $value") }

// while / do-while
while (condition)  { }
do { } while (condition)

// Ranges
1..10                               // IntRange (inclusive)
1 until 10                          // IntRange (exclusive end)
'a'..'z'                            // CharRange
"apple".."mango"                    // ClosedRange<String>

// Loop control
loop@ for (i in 1..10) {
    for (j in 1..10) {
        if (i + j == 15) break@loop  // labeled break
        if (j == 5) continue@loop    // labeled continue
    }
}

// try — expression
val number = try {
    parseInt(input)
} catch (e: NumberFormatException) {
    -1
}
```

---

## 1.4 Functions

```kotlin
// Function declaration
fun add(a: Int, b: Int): Int = a + b          // expression body
fun greet(name: String): Unit {               // block body
    println("Hello, $name!")
}

// Default parameters — replace most builder patterns
fun createUser(
    name: String,
    email: String,
    role: String = "user",
    active: Boolean = true,
): User = User(name, email, role, active)

// Named arguments — call in any order, improves readability
val user = createUser(
    name  = "Alice",
    email = "alice@example.com",
    role  = "admin",
)

// Varargs
fun sum(vararg numbers: Int): Int = numbers.sum()
sum(1, 2, 3, 4, 5)
val nums = intArrayOf(1, 2, 3)
sum(*nums)                                     // spread operator

// Single-expression functions
fun square(n: Int) = n * n
fun isEven(n: Int) = n % 2 == 0

// Local functions — functions inside functions
fun processOrder(order: Order): Result {
    fun validate(item: OrderItem) {            // local function
        require(item.quantity > 0) { "Quantity must be positive" }
    }
    order.items.forEach { validate(it) }
    return processItems(order.items)
}

// Extension functions — add methods to existing types
fun String.isPalindrome(): Boolean =
    this == this.reversed()

fun Int.factorial(): Long =
    if (this <= 1) 1L else this * (this - 1).factorial()

"racecar".isPalindrome()   // → true
5.factorial()              // → 120

// Extension functions on nullable types
fun String?.isNullOrBlank(): Boolean =
    this == null || this.isBlank()

// Infix functions — called with infix notation (no dot, no parentheses)
infix fun Int.times(str: String) = str.repeat(this)
3 times "ha"               // → "hahaha"

// Tail-recursive functions
tailrec fun factorial(n: Long, acc: Long = 1L): Long =
    if (n <= 1) acc else factorial(n - 1, acc * n)
// tailrec — compiler optimizes to iterative loop; prevents StackOverflow

// Operator overloading
data class Vector(val x: Double, val y: Double) {
    operator fun plus(other: Vector)  = Vector(x + other.x, y + other.y)
    operator fun times(scalar: Double) = Vector(x * scalar, y * scalar)
    operator fun unaryMinus()         = Vector(-x, -y)
    operator fun get(index: Int) = when (index) { 0 -> x; 1 -> y; else -> throw IndexOutOfBoundsException() }
}

val v1 = Vector(1.0, 2.0)
val v2 = Vector(3.0, 4.0)
val v3 = v1 + v2            // Vector(4.0, 6.0)
val v4 = v1 * 2.0           // Vector(2.0, 4.0)
```

---

## 1.5 Lambdas and Higher-Order Functions

```kotlin
// Lambda syntax
val square: (Int) -> Int = { x -> x * x }
val add: (Int, Int) -> Int = { a, b -> a + b }
val greet: () -> String = { "Hello!" }

// Trailing lambda — if last parameter is lambda, move outside parentheses
listOf(1, 2, 3).filter { it > 1 }          // it = implicit single param
listOf(1, 2, 3).map { num -> num * 2 }     // explicit param name
listOf(1, 2, 3).reduce { acc, n -> acc + n }

// Higher-order functions
fun <T, R> List<T>.myMap(transform: (T) -> R): List<R> {
    val result = mutableListOf<R>()
    for (item in this) result.add(transform(item))
    return result
}

// Function types
val operation: (Int, Int) -> Int = ::add    // function reference
val memberRef: String.() -> Int = String::length  // member reference

// Closures — capture variables from enclosing scope
fun makeCounter(): () -> Int {
    var count = 0
    return { ++count }                       // captures count
}
val counter = makeCounter()
counter()  // → 1
counter()  // → 2

// inline functions — inlines lambda at call site (no Function object overhead)
inline fun <T> measureTime(block: () -> T): Pair<T, Long> {
    val start = System.currentTimeMillis()
    val result = block()
    return result to System.currentTimeMillis() - start
}

// noinline — don't inline specific lambda params
inline fun example(inlined: () -> Unit, noinline notInlined: () -> Unit) { }

// crossinline — lambda cannot have non-local returns
inline fun runOnMain(crossinline block: () -> Unit) {
    mainThread { block() }    // block() in different context — no non-local return
}

// Returning from lambdas — local vs non-local
fun findFirst(list: List<Int>): Int? {
    list.forEach { n ->
        if (n > 3) return n      // non-local return — returns from findFirst
    }
    return null
}

fun findFirstLocal(list: List<Int>): Int? {
    list.forEach { n ->
        if (n > 3) return@forEach // local return — next iteration
    }
    return null
}
```

---

# SECTION 2 · OBJECT-ORIENTED PROGRAMMING

> `[JUNIOR]` Classes, data classes, interfaces, inheritance  
> `[MID]` Sealed classes, objects, companion objects, delegation  
> `[SENIOR]` Type-safe builders, contracts, value classes, class delegation

---

## 2.1 Classes and Data Classes

```kotlin
// Primary constructor
class Person(val name: String, var age: Int) {
    // Secondary constructor — must delegate to primary
    constructor(name: String) : this(name, 0)

    // Initializer block — runs during construction
    init {
        require(name.isNotBlank()) { "Name cannot be blank" }
        require(age >= 0) { "Age cannot be negative" }
    }

    // Properties with backing fields
    var email: String = ""
        get() = field.lowercase()
        set(value) {
            require(value.contains("@")) { "Invalid email" }
            field = value
        }

    // Computed property (no backing field)
    val isAdult: Boolean get() = age >= 18

    // Member function
    fun greet() = "Hello, I'm $name"

    override fun toString() = "Person(name=$name, age=$age)"
}

// data class — auto-generates equals, hashCode, toString, copy, componentN
data class User(
    val id: Long,
    val name: String,
    val email: String,
    val role: Role = Role.USER,
)

val alice = User(1L, "Alice", "alice@example.com")
val bob   = alice.copy(id = 2L, name = "Bob")    // structural copy

// Destructuring
val (id, name, email) = alice
val (x, y) = Pair(1, 2)

// Component functions enable destructuring
data class Point(val x: Int, val y: Int)
val (px, py) = Point(3, 4)

// equals and hashCode from data class
val user1 = User(1L, "Alice", "a@b.com")
val user2 = User(1L, "Alice", "a@b.com")
user1 == user2      // → true (structural equality via generated equals)
user1 === user2     // → false (different objects)

// open class — allow inheritance (classes are final by default)
open class Animal(val name: String) {
    open fun sound(): String = "..."
    fun breathe() = "breathing"       // final — cannot be overridden
}

class Dog(name: String) : Animal(name) {
    override fun sound() = "Woof"
}

// Abstract class
abstract class Shape {
    abstract fun area(): Double
    abstract fun perimeter(): Double
    fun describe() = "${javaClass.simpleName}: area=${area()}"
}
```

---

## 2.2 Interfaces

```kotlin
// Interface — can have default implementations and properties
interface Drawable {
    val color: String                    // abstract property
    val opacity: Float get() = 1.0f     // property with default

    fun draw()                           // abstract method
    fun describe() = "Drawing $color"   // default implementation

    companion object {
        fun empty(): Drawable = object : Drawable {
            override val color = "transparent"
            override fun draw() {}
        }
    }
}

// Implementing multiple interfaces
interface Resizable { fun resize(factor: Double) }

class Circle(override val color: String, var radius: Double) : Drawable, Resizable {
    override fun draw() = println("Drawing circle r=$radius")
    override fun resize(factor: Double) { radius *= factor }
}

// Interface delegation — implement interface by delegating to another object
class LoggingList<T>(private val inner: MutableList<T>) : MutableList<T> by inner {
    override fun add(element: T): Boolean {
        println("Adding: $element")
        return inner.add(element)      // only override what we want to customize
    }
}
val list = LoggingList(mutableListOf<String>())
list.add("hello")                     // logs; rest of MutableList is delegated

// Functional interfaces (SAM) — single abstract method
fun interface Validator<T> {
    fun validate(value: T): Boolean
}

val emailValidator = Validator<String> { it.contains("@") }  // lambda conversion
val result = emailValidator.validate("alice@example.com")
```

---

## 2.3 Sealed Classes and Enums

```kotlin
// Sealed class — restricted hierarchy; all subclasses in same compilation unit
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable, val message: String = exception.message ?: "") : Result<Nothing>()
    object Loading : Result<Nothing>()
}

// when on sealed class is exhaustive — no else needed
fun handleResult(result: Result<User>) = when (result) {
    is Result.Success -> showUser(result.data)
    is Result.Error   -> showError(result.message)
    Result.Loading    -> showSpinner()
}

// Sealed interface (Kotlin 1.5+) — more flexible than sealed class
sealed interface Shape {
    data class Circle(val radius: Double) : Shape
    data class Rectangle(val width: Double, val height: Double) : Shape
    data class Triangle(val base: Double, val height: Double) : Shape
}

fun area(shape: Shape): Double = when (shape) {
    is Shape.Circle    -> Math.PI * shape.radius * shape.radius
    is Shape.Rectangle -> shape.width * shape.height
    is Shape.Triangle  -> 0.5 * shape.base * shape.height
}

// Enum class
enum class Direction(val degrees: Int) {
    NORTH(0), EAST(90), SOUTH(180), WEST(270);

    fun opposite(): Direction = values()[(ordinal + 2) % 4]
    fun isHorizontal() = this == EAST || this == WEST
}

Direction.NORTH.name     // → "NORTH"
Direction.NORTH.ordinal  // → 0
Direction.valueOf("EAST") // → Direction.EAST
Direction.values()        // → Array<Direction>
Direction.entries         // Kotlin 1.9+: List<Direction> (preferred over values())

// Enum with abstract methods
enum class Operation {
    ADD {
        override fun apply(a: Int, b: Int) = a + b
    },
    SUBTRACT {
        override fun apply(a: Int, b: Int) = a - b
    };

    abstract fun apply(a: Int, b: Int): Int
}
```

---

## 2.4 Objects and Companion Objects

```kotlin
// object declaration — singleton
object Registry {
    private val store = mutableMapOf<String, Any>()

    fun register(key: String, value: Any) { store[key] = value }
    fun get(key: String): Any? = store[key]
}

Registry.register("key", "value")
Registry.get("key")

// companion object — class-level members (≈ Java static)
class HttpClient private constructor(private val baseUrl: String) {
    companion object {
        private const val DEFAULT_TIMEOUT = 30_000

        fun create(baseUrl: String) = HttpClient(baseUrl)
        fun createDefault() = HttpClient("https://api.example.com")

        // companion object can implement interfaces
    }

    fun get(path: String): Response { TODO() }
}

HttpClient.create("https://custom.com")
HttpClient.DEFAULT_TIMEOUT            // companion members accessed on class

// @JvmStatic — expose companion member as true Java static
companion object {
    @JvmStatic fun create() = MyClass()
    @JvmField val CONSTANT = 42       // @JvmField — expose as Java field (no get/set)
}

// Object expressions — anonymous objects (≈ Java anonymous classes)
val comparator = object : Comparator<String> {
    override fun compare(a: String, b: String) = a.length - b.length
}
listOf("banana", "apple", "cherry").sortedWith(comparator)

// Shorter with lambda (SAM conversion for Java interfaces)
val comparator2 = Comparator<String> { a, b -> a.length - b.length }
```

---

## 2.5 Value Classes and Type Aliases

```kotlin
// Value class (Kotlin 1.5+) — wraps single value; erased to underlying type at runtime
@JvmInline
value class UserId(val value: Long) {
    init { require(value > 0) { "UserId must be positive" } }

    fun isValid() = value > 0
}

@JvmInline
value class Email(val value: String) {
    init { require(value.contains("@")) { "Invalid email" } }
}

// Prevents mixing up primitive values of same underlying type
fun findUser(id: UserId): User? = TODO()
// findUser(42L) — compile error! Must use UserId(42L)
findUser(UserId(42L))

// Type aliases — alternative name for existing type
typealias UserId2 = Long                              // simple alias
typealias UserMap = Map<String, User>                 // complex type alias
typealias Callback = (Result<Unit>) -> Unit           // function type alias
typealias StringPair = Pair<String, String>

// Type alias ≠ value class: type aliases are completely interchangeable
// with their underlying type; value classes provide type safety

// Destructuring declarations
operator fun User.component1() = id
operator fun User.component2() = name

// delegate properties — by keyword
import kotlin.properties.Delegates

// Lazy initialization — computed on first access, cached
val config: Config by lazy {
    loadFromFile("config.json")     // runs once, result cached
}

// Observable — notified on change
var name: String by Delegates.observable("initial") { prop, old, new ->
    println("${prop.name}: $old → $new")
}

// Vetoable — reject change based on condition
var age: Int by Delegates.vetoable(0) { _, old, new ->
    new >= 0   // return false to reject change
}

// Map delegation — delegate properties to a map
class Config(map: Map<String, Any?>) {
    val host: String by map
    val port: Int    by map
    val debug: Boolean by map
}
val config2 = Config(mapOf("host" to "localhost", "port" to 8080, "debug" to false))
```

---

# SECTION 3 · GENERICS

> `[MID]` Type parameters, bounds, variance  
> `[SENIOR]` Declaration-site variance, reified, star projection, type erasure

---

## 3.1 Generics and Variance

```kotlin
// Generic class
class Box<T>(val value: T) {
    fun <R> map(transform: (T) -> R): Box<R> = Box(transform(value))
}

// Upper bounds
fun <T : Comparable<T>> max(a: T, b: T): T = if (a >= b) a else b

// Multiple bounds
fun <T> process(value: T) where T : Serializable, T : Comparable<T> { }

// ─── Variance — Kotlin uses declaration-site variance ────────────────────────

// out — covariant (Producer — can only produce T, not consume)
// List<out T> means List<Dog> is a subtype of List<Animal>
interface Producer<out T> {
    fun produce(): T          // T in return position — OK
    // fun consume(item: T)   // compile error — T in parameter position
}

// in — contravariant (Consumer — can only consume T, not produce)
// Comparator<in T> means Comparator<Animal> is a subtype of Comparator<Dog>
interface Consumer<in T> {
    fun consume(item: T)      // T in parameter position — OK
    // fun produce(): T       // compile error — T in return position
}

// Invariant — can both produce and consume
class MutableBox<T>(var value: T) {
    fun get(): T = value
    fun set(v: T) { value = v }
}

// Use-site variance (type projection) — at call site
fun sumAll(list: List<out Number>): Double =
    list.sumOf { it.toDouble() }

// Star projection — when type parameter doesn't matter
fun printAll(list: List<*>) {
    list.forEach { println(it) }    // items are of type Any?
}

// Reified type parameters — access type at runtime (only in inline functions)
inline fun <reified T> isInstance(value: Any): Boolean = value is T
inline fun <reified T> List<Any>.filterIsInstance2(): List<T> =
    filter { it is T }.map { it as T }

// Without reified: type erased at runtime — cannot do "is T"
// With reified: compiler inlines the type information

inline fun <reified T : Any> Gson.fromJson(json: String): T =
    fromJson(json, T::class.java)            // use T::class.java in inline/reified

val user: User = gson.fromJson<User>(jsonString)   // no need to pass User::class.java

// Nothing type — subtype of every type
fun infiniteLoop(): Nothing = while (true) { }
fun alwaysThrows(): Nothing = throw RuntimeException()
val emptyList: List<Nothing> = emptyList()    // List<Nothing> is subtype of List<Any>
```

---

# SECTION 4 · COLLECTIONS

> `[JUNIOR]` List, Map, Set, basic operations  
> `[MID]` Sequences, collection transformations, grouping  
> `[SENIOR]` Custom sequences, performance trade-offs, specialized collections

---

## 4.1 Collections Overview

```kotlin
// Kotlin separates read-only and mutable interfaces
// Read-only (immutable view — underlying may be mutable)
val readOnlyList:  List<String>       = listOf("a", "b", "c")
val readOnlyMap:   Map<String, Int>   = mapOf("a" to 1, "b" to 2)
val readOnlySet:   Set<String>        = setOf("x", "y", "z")

// Mutable collections
val mutableList: MutableList<String>  = mutableListOf("a", "b")
val mutableMap:  MutableMap<String, Int> = mutableMapOf("a" to 1)
val mutableSet:  MutableSet<String>   = mutableSetOf("x", "y")

// Immutable (truly) — unmodifiable, not just read-only view
val immutableList = listOf("a", "b", "c")  // backed by java.util.Arrays$ArrayList
// persistentListOf from kotlinx.collections.immutable for structural sharing

// Empty collections
emptyList<String>()
emptyMap<String, Int>()
emptySet<String>()

// Array types — more primitive, avoid in favor of List in most cases
val array = arrayOf(1, 2, 3)
val intArray = intArrayOf(1, 2, 3)       // primitive int[] — no boxing
val longArray = LongArray(10) { it * 2L } // sized with initializer

// Conversion
array.toList()
mutableList.toTypedArray()
intArray.toList()
```

---

## 4.2 Collection Operations

```kotlin
val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
val words   = listOf("apple", "banana", "cherry", "apricot", "blueberry")

// Transformations
numbers.map { it * 2 }                   // [2, 4, 6, ...]
numbers.flatMap { listOf(it, it * 2) }   // flatten
numbers.mapNotNull { if (it > 5) it * 2 else null }  // map + filter null
words.mapIndexed { i, w -> "$i: $w" }

// Filtering
numbers.filter { it % 2 == 0 }           // [2, 4, 6, 8, 10]
numbers.filterNot { it % 2 == 0 }        // [1, 3, 5, 7, 9]
numbers.filterIsInstance<Int>()           // type filter
words.partition { it.startsWith("a") }   // Pair(matching, nonMatching)
words.take(3)                            // first 3
words.drop(3)                            // all except first 3
words.takeWhile { it.length < 7 }        // take while predicate true
words.dropWhile { it.length < 7 }

// Aggregation
numbers.sum()
numbers.sumOf { it * 1.0 }
numbers.average()
numbers.count { it > 5 }
numbers.min(); numbers.max()
numbers.minOf { it }; numbers.maxOf { it }
numbers.minByOrNull { it }; numbers.maxByOrNull { it }
numbers.reduce { acc, n -> acc + n }
numbers.fold(100) { acc, n -> acc + n }   // fold with initial value
numbers.runningFold(0) { acc, n -> acc + n }  // intermediate accumulations

// Grouping
words.groupBy { it.first() }              // Map<Char, List<String>>
words.groupingBy { it.length }.eachCount()  // Map<Int, Int>
words.groupBy({ it.length }) { it.uppercase() }  // Map<Int, List<String>>

// Sorting
words.sorted()                            // natural order
words.sortedBy { it.length }
words.sortedByDescending { it.length }
words.sortedWith(compareBy({ it.length }, { it }))  // multiple criteria

// Searching
words.find { it.startsWith("b") }        // first match or null
words.first { it.startsWith("b") }       // first match or NoSuchElementException
words.firstOrNull { it.startsWith("z") } // null if not found
words.any { it.length > 6 }             // true if any matches
words.all { it.isNotEmpty() }           // true if all match
words.none { it.isBlank() }             // true if none match
words.contains("banana")
"banana" in words                         // operator form of contains

// Flattening
listOf(listOf(1, 2), listOf(3, 4)).flatten()
listOf(listOf(1, 2), listOf(3, 4)).flatMap { it.map { n -> n * 2 } }

// Windowing / chunking
numbers.chunked(3)                        // [[1,2,3],[4,5,6],[7,8,9],[10]]
numbers.windowed(3)                       // sliding windows of size 3
numbers.zipWithNext()                     // pairs of adjacent elements
numbers.zip(words)                        // zip two lists into pairs

// Distinct
listOf(1, 2, 2, 3, 3, 3).distinct()      // [1, 2, 3]
words.distinctBy { it.first() }           // distinct by first letter

// Joining
words.joinToString(", ")
words.joinToString(separator = " | ", prefix = "[", postfix = "]")
words.joinToString { it.uppercase() }     // transform + join
```

---

## 4.3 Sequences — Lazy Evaluation

```kotlin
// Sequence — lazy evaluation; operations applied one element at a time
// Use when: chaining multiple operations on large collections

// Eager (List) — intermediate lists created at each step
val eagerResult = (1..1_000_000)
    .filter { it % 2 == 0 }    // creates new List<Int> with 500k elements
    .map { it * it }            // creates another List<Int> with 500k elements
    .take(5)                    // creates List<Int> with 5 elements

// Lazy (Sequence) — no intermediate collections
val lazyResult = (1..1_000_000).asSequence()
    .filter { it % 2 == 0 }    // lazy — not yet evaluated
    .map { it * it }            // lazy — not yet evaluated
    .take(5)                    // lazy — not yet evaluated
    .toList()                   // TERMINAL — triggers evaluation; stops after 5 elements

// Custom sequence with generateSequence
val fibonacci = generateSequence(Pair(0L, 1L)) { (a, b) -> Pair(b, a + b) }
    .map { it.first }
    .take(20)
    .toList()

// Infinite sequences
val naturals = generateSequence(1) { it + 1 }
val evens    = naturals.filter { it % 2 == 0 }
evens.take(10).toList()        // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

// sequence { } builder
val primes = sequence {
    var n = 2
    val found = mutableListOf<Int>()
    while (true) {
        if (found.none { n % it == 0 }) {
            found.add(n)
            yield(n)           // suspend and emit
        }
        n++
    }
}
primes.take(10).toList()       // [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

// When to use List vs Sequence:
// List:     small collections, need random access, single operation
// Sequence: large collections, chained operations, early termination possible
// Sequence overhead: creating iterator object — worse for small simple ops
```

---

# SECTION 5 · COROUTINES

> `[MID]` suspend functions, launch/async, coroutine scope, structured concurrency  
> `[SENIOR]` Coroutine context, dispatchers, exception handling, channels, custom scope

---

## 5.1 Coroutines Fundamentals

```kotlin
import kotlinx.coroutines.*

// suspend function — can suspend without blocking thread
suspend fun fetchUser(id: Long): User {
    delay(100)                          // non-blocking delay (vs Thread.sleep)
    return userRepository.findById(id)  // suspending call
}

// Coroutine builders — launch vs async
fun main() = runBlocking {              // blocks current thread; use in main or tests
    // launch — fire-and-forget; returns Job
    val job: Job = launch {
        delay(1000)
        println("World")
    }

    // async — returns Deferred<T>; use when you need a result
    val deferred: Deferred<User> = async {
        fetchUser(42L)
    }

    println("Hello")
    job.join()                          // wait for job to complete
    val user = deferred.await()         // wait for result (suspending)
}

// CoroutineScope — defines lifetime of coroutines
class UserService(private val scope: CoroutineScope) {
    fun loadUser(id: Long) {
        scope.launch {
            val user = fetchUser(id)    // runs in scope's context
            updateUI(user)
        }
    }
}

// Structured concurrency — parent waits for all children; cancellation propagates
suspend fun loadDashboard(): Dashboard = coroutineScope {
    val user   = async { fetchUser(currentUserId) }
    val orders = async { fetchOrders(currentUserId) }
    val prefs  = async { fetchPreferences(currentUserId) }

    // All three run concurrently; coroutineScope waits for all
    Dashboard(user.await(), orders.await(), prefs.await())
}
// If any child throws, all others are cancelled; exception propagates to parent

// withContext — switch context without launching new coroutine
suspend fun readFile(path: String): String = withContext(Dispatchers.IO) {
    File(path).readText()               // blocking I/O on IO dispatcher
}
```

---

## 5.2 Dispatchers and Coroutine Context

```kotlin
// Dispatchers — thread pools for coroutines
Dispatchers.Main         // UI thread (Android/JavaFX); single-threaded
Dispatchers.IO           // optimized for I/O (default 64 threads)
Dispatchers.Default      // CPU-bound work (# cores threads)
Dispatchers.Unconfined   // runs in caller's thread until first suspension

// Launch with specific dispatcher
launch(Dispatchers.IO) {
    val data = networkCall()              // runs on IO thread pool
    withContext(Dispatchers.Main) {
        updateUI(data)                    // switch to main thread
    }
}

// CoroutineContext — combination of elements
val context: CoroutineContext =
    Dispatchers.Default +
    CoroutineName("my-coroutine") +
    Job()

// SupervisorJob — child failure doesn't cancel siblings
val supervisorScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
supervisorScope.launch {
    // This child's failure won't cancel other children
    riskyOperation()
}

// Custom context element
class RequestId(val id: String) : CoroutineContext.Element {
    companion object Key : CoroutineContext.Key<RequestId>
    override val key: CoroutineContext.Key<*> = Key
}

suspend fun getCurrentRequestId(): String? =
    coroutineContext[RequestId]?.id

launch(Dispatchers.Default + RequestId("req-123")) {
    val id = getCurrentRequestId()    // → "req-123"
}

// CoroutineScope lifecycle binding (Android example)
class MyViewModel : ViewModel() {
    // viewModelScope — cancelled when ViewModel cleared
    fun loadData() = viewModelScope.launch {
        val data = repository.getData()
        _state.value = data
    }
}

// lifecycleScope — cancelled on lifecycle destroy
class MyFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.flow.collect { updateUI(it) }
            }
        }
    }
}
```

---

## 5.3 Exception Handling and Cancellation

```kotlin
// Exception handling in coroutines
// launch — exceptions propagate to parent scope
val job = scope.launch {
    try {
        riskyOperation()
    } catch (e: SpecificException) {
        handleSpecific(e)
    }
}

// CoroutineExceptionHandler — catches unhandled exceptions in launch
val handler = CoroutineExceptionHandler { _, exception ->
    println("Caught: $exception")
}
scope.launch(handler) {
    throw RuntimeException("something went wrong")
}

// async — exceptions stored in Deferred; thrown on await()
val deferred = scope.async {
    throw RuntimeException("async error")
}
try {
    deferred.await()     // exception thrown here
} catch (e: RuntimeException) {
    handleError(e)
}

// Cancellation — cooperative (coroutine must check for cancellation)
val job = launch {
    repeat(1_000) { i ->
        ensureActive()                // check for cancellation; throws CancellationException
        delay(100)                    // suspending functions check cancellation
        processItem(i)
    }
}
job.cancel()                         // requests cancellation
job.cancelAndJoin()                  // cancel + wait for completion

// withTimeout — auto-cancel after timeout
val result = withTimeout(5_000) {    // throws TimeoutCancellationException
    longRunningOperation()
}

val resultOrNull = withTimeoutOrNull(5_000) {  // returns null on timeout
    longRunningOperation()
}

// CancellationException — should NOT be caught normally
try {
    delay(1000)
} catch (e: CancellationException) {
    throw e   // MUST re-throw CancellationException
} catch (e: Exception) {
    handleOtherErrors(e)
}

// finally — runs even after cancellation
val job2 = launch {
    try {
        repeat(10) { delay(100) }
    } finally {
        withContext(NonCancellable) {
            // cleanup that must complete even after cancellation
            saveState()
        }
    }
}
```

---

## 5.4 Flows

```kotlin
import kotlinx.coroutines.flow.*

// Flow — cold async stream (vs Sequence: async; vs Channel: hot)
// Cold: nothing happens until collected; each collector gets its own stream

// Flow builders
val flow1: Flow<Int> = flow {
    for (i in 1..10) {
        delay(100)
        emit(i)                        // produce values
    }
}

val flow2 = (1..10).asFlow()           // from Iterable
val flow3 = flowOf(1, 2, 3, 4, 5)     // from varargs

// Terminal operators — trigger collection
flow1.collect { value -> println(value) }
val list  = flow1.toList()
val first = flow1.first()
val sum   = flow1.fold(0) { acc, n -> acc + n }

// Intermediate operators — transform without collecting
flow1
    .filter  { it % 2 == 0 }
    .map     { it * it }
    .take    (3)
    .collect { println(it) }

// flatMapConcat — map each element to flow, concatenate
flow1.flatMapConcat { n -> flowOf(n, n * 2) }

// flatMapMerge — merge concurrently (unordered)
flow1.flatMapMerge(concurrency = 4) { n ->
    flow { emit(fetchData(n)) }
}

// flatMapLatest — cancel previous when new emitted (for search, etc.)
searchQuery
    .debounce(300)
    .flatMapLatest { query ->
        flow { emit(searchApi(query)) }
    }
    .collect { results -> updateUI(results) }

// Exception handling in flows
flow1
    .catch { e -> emit(-1) }           // handle and continue
    .onEach { println("Emitting: $it") }
    .collect { println("Collected: $it") }

// StateFlow — hot flow; holds current value; always has a value
class CounterViewModel : ViewModel() {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    fun increment() { _count.update { it + 1 } }
}

// SharedFlow — hot flow; multiple collectors; no current value
class EventBus {
    private val _events = MutableSharedFlow<AppEvent>(
        replay = 0,                    // no replay for new subscribers
        extraBufferCapacity = 64,      // buffer for slow consumers
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )
    val events: SharedFlow<AppEvent> = _events.asSharedFlow()

    suspend fun emit(event: AppEvent) = _events.emit(event)
}

// Flow context — flowOn switches upstream context
flow {
    emit(readFromDatabase())           // runs on IO (from flowOn below)
}
.flowOn(Dispatchers.IO)
.map { transform(it) }                // runs on caller's context
.collect { updateUI(it) }            // runs on Main

// Combining flows
combine(flow1, flow2) { a, b -> a + b }  // emits when either changes
zip(flow1, flow2) { a, b -> a to b }     // pairs corresponding elements
merge(flow1, flow2)                       // merge two flows
```

---

# SECTION 6 · SPRING BOOT WITH KOTLIN

> `[MID]` Controllers, services, repositories, configuration  
> `[SENIOR]` Coroutine support, Kotlin-specific Spring DSLs, WebFlux

---

## 6.1 Spring Boot Kotlin Setup

```kotlin
// build.gradle.kts — Kotlin DSL (preferred over Groovy)
plugins {
    kotlin("jvm")                       version "1.9.22"
    kotlin("plugin.spring")             version "1.9.22"  // open classes for Spring
    kotlin("plugin.jpa")                version "1.9.22"  // open JPA entities
    id("org.springframework.boot")      version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")  // Kotlin support
    implementation("org.jetbrains.kotlin:kotlin-reflect")                 // required by Spring
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")   // WebFlux + coroutines

    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.13.10")                          // Kotlin-friendly mocking
    testImplementation("com.ninja-squad:springmockk:4.0.2")              // @MockkBean
}

// Main entry point
@SpringBootApplication
class MyApplication

fun main(args: Array<String>) {
    runApplication<MyApplication>(*args)
}

// application.yml
/*
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USER}
    password: ${DB_PASS}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  jackson:
    default-property-inclusion: non_null
    naming_strategy: com.fasterxml.jackson.databind.PropertyNamingStrategies$SnakeCaseStrategy
*/
```

---

## 6.2 Entities, Repositories, Services

```kotlin
// JPA Entity — kotlin-plugin-jpa opens class and generates no-arg constructor
@Entity
@Table(name = "users")
class User(
    @Column(nullable = false, unique = true)
    val email: String,

    @Column(nullable = false)
    var name: String,

    @Enumerated(EnumType.STRING)
    var role: Role = Role.USER,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "created_at")
    val createdAt: Instant = Instant.now(),
) {
    // Equals/hashCode using id only (avoid data class for JPA entities)
    override fun equals(other: Any?) =
        other is User && id != 0L && id == other.id
    override fun hashCode() = id.hashCode()
}

// Repository — Spring Data JPA
interface UserRepository : JpaRepository<User, Long> {
    fun findByEmail(email: String): User?
    fun findAllByRole(role: Role): List<User>
    fun existsByEmail(email: String): Boolean

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.createdAt > :since")
    fun findActiveByRole(
        @Param("role") role: Role,
        @Param("since") since: Instant,
    ): List<User>

    @Modifying
    @Query("UPDATE User u SET u.name = :name WHERE u.id = :id")
    fun updateName(@Param("id") id: Long, @Param("name") name: String): Int
}

// DTOs with data classes (not entities)
data class CreateUserRequest(
    @field:NotBlank val name: String,
    @field:Email    val email: String,
    @field:Size(min = 8) val password: String,
)

data class UserResponse(
    val id: Long,
    val name: String,
    val email: String,
    val role: String,
    val createdAt: Instant,
)

fun User.toResponse() = UserResponse(id, name, email, role.name, createdAt)

// Service layer
@Service
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val eventPublisher: ApplicationEventPublisher,
) {
    @Transactional(readOnly = true)
    fun findById(id: Long): User =
        userRepository.findById(id).orElseThrow { UserNotFoundException(id) }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<UserResponse> =
        userRepository.findAll(pageable).map { it.toResponse() }

    fun createUser(request: CreateUserRequest): UserResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw EmailAlreadyExistsException(request.email)
        }
        val user = User(
            email = request.email,
            name  = request.name,
        )
        val saved = userRepository.save(user)
        eventPublisher.publishEvent(UserCreatedEvent(saved.id))
        return saved.toResponse()
    }

    fun deleteUser(id: Long) {
        val user = findById(id)
        userRepository.delete(user)
    }
}
```

---

## 6.3 Controllers and Error Handling

```kotlin
@RestController
@RequestMapping("/api/users")
class UserController(private val userService: UserService) {

    @GetMapping
    fun listUsers(pageable: Pageable): Page<UserResponse> =
        userService.findAll(pageable)

    @GetMapping("/{id}")
    fun getUser(@PathVariable id: Long): UserResponse =
        userService.findById(id).toResponse()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createUser(@Valid @RequestBody request: CreateUserRequest): UserResponse =
        userService.createUser(request)

    @PutMapping("/{id}")
    fun updateUser(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateUserRequest,
    ): UserResponse = userService.updateUser(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteUser(@PathVariable id: Long) = userService.deleteUser(id)
}

// Global exception handler
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(ex: UserNotFoundException): ErrorResponse =
        ErrorResponse(
            status  = 404,
            message = ex.message ?: "Not found",
            code    = "USER_NOT_FOUND",
        )

    @ExceptionHandler(EmailAlreadyExistsException::class)
    @ResponseStatus(HttpStatus.CONFLICT)
    fun handleConflict(ex: EmailAlreadyExistsException): ErrorResponse =
        ErrorResponse(status = 409, message = ex.message ?: "Conflict", code = "CONFLICT")

    @ExceptionHandler(MethodArgumentNotValidException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleValidation(ex: MethodArgumentNotValidException): ValidationErrorResponse {
        val errors = ex.bindingResult.fieldErrors
            .associate { it.field to (it.defaultMessage ?: "Invalid") }
        return ValidationErrorResponse(status = 400, errors = errors)
    }

    @ExceptionHandler(Exception::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    fun handleGeneral(ex: Exception, request: HttpServletRequest): ErrorResponse {
        log.error("Unhandled exception for ${request.requestURI}", ex)
        return ErrorResponse(status = 500, message = "Internal server error", code = "INTERNAL")
    }

    private val log = LoggerFactory.getLogger(javaClass)
}

// Custom exceptions
class UserNotFoundException(id: Long) :
    RuntimeException("User not found: $id")

class EmailAlreadyExistsException(email: String) :
    RuntimeException("Email already registered: $email")

data class ErrorResponse(val status: Int, val message: String, val code: String)
data class ValidationErrorResponse(val status: Int, val errors: Map<String, String>)

// Coroutine-based controller (Spring WebFlux or Spring MVC with coroutines)
@RestController
@RequestMapping("/api/async")
class AsyncController(private val service: AsyncService) {

    @GetMapping("/{id}")
    suspend fun get(@PathVariable id: Long): UserResponse =
        service.findUser(id)          // suspend function — no blocking

    @GetMapping
    fun stream(): Flow<UserResponse> =
        service.streamUsers()         // Flow as response — SSE
}
```

---

# SECTION 7 · KTOR (KOTLIN-NATIVE WEB FRAMEWORK)

> `[MID]` Routing, plugins, serialization  
> `[SENIOR]` Custom plugins, WebSockets, testing, Ktor client

---

## 7.1 Ktor Server

```kotlin
// build.gradle.kts
dependencies {
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("io.ktor:ktor-server-netty:2.3.7")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.7")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
    implementation("io.ktor:ktor-server-auth:2.3.7")
    implementation("io.ktor:ktor-server-auth-jwt:2.3.7")
    implementation("io.ktor:ktor-server-rate-limit:2.3.7")
    implementation("io.ktor:ktor-server-status-pages:2.3.7")
    implementation("io.ktor:ktor-server-call-logging:2.3.7")
}

// Application setup
fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        configurePlugins()
        configureRouting()
    }.start(wait = true)
}

fun Application.configurePlugins() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient   = false
            ignoreUnknownKeys = true
        })
    }

    install(CallLogging) {
        level = Level.INFO
        filter { call -> call.request.path().startsWith("/api") }
    }

    install(StatusPages) {
        exception<NotFoundException> { call, cause ->
            call.respond(HttpStatusCode.NotFound, mapOf("error" to cause.message))
        }
        exception<ValidationException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, mapOf("errors" to cause.errors))
        }
        exception<Throwable> { call, cause ->
            application.log.error("Unhandled error", cause)
            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Internal error"))
        }
    }

    install(Authentication) {
        jwt("auth-jwt") {
            realm = "myapp"
            verifier(JwtVerifier.create(algorithm, issuer, audience))
            validate { credential ->
                if (credential.payload.getClaim("userId").asLong() != null)
                    JWTPrincipal(credential.payload)
                else null
            }
            challenge { _, _ ->
                call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Token invalid"))
            }
        }
    }

    install(RateLimit) {
        register(RateLimitName("public")) {
            rateLimiter(limit = 100, refillPeriod = 1.minutes)
        }
    }
}

fun Application.configureRouting() {
    routing {
        route("/api") {
            // Public routes
            rateLimit(RateLimitName("public")) {
                route("/auth") {
                    post("/login")  { handleLogin() }
                    post("/register") { handleRegister() }
                }
            }

            // Protected routes
            authenticate("auth-jwt") {
                route("/users") {
                    get         { handleListUsers() }
                    get("/{id}") { handleGetUser() }
                    post        { handleCreateUser() }
                    put("/{id}") { handleUpdateUser() }
                    delete("/{id}") { handleDeleteUser() }
                }
            }
        }
    }
}

// Route handlers — extension functions on PipelineContext
suspend fun PipelineContext<Unit, ApplicationCall>.handleGetUser() {
    val id   = call.parameters["id"]?.toLong()
        ?: throw BadRequestException("Invalid ID")
    val user = userService.findById(id)
    call.respond(user.toResponse())
}

suspend fun PipelineContext<Unit, ApplicationCall>.handleCreateUser() {
    val request = call.receive<CreateUserRequest>()
    val user    = userService.createUser(request)
    call.respond(HttpStatusCode.Created, user)
}

// Ktor Client
val client = HttpClient(CIO) {
    install(ContentNegotiation) { json() }
    install(HttpTimeout) { requestTimeoutMillis = 30_000 }
    install(HttpRequestRetry) {
        retryOnServerErrors(maxRetries = 3)
        exponentialDelay()
    }
    install(Logging) { level = LogLevel.HEADERS }
    defaultRequest {
        url("https://api.example.com")
        header("Authorization", "Bearer $token")
    }
}

val users: List<UserResponse> = client.get("/users").body()
val created: UserResponse = client.post("/users") {
    contentType(ContentType.Application.Json)
    setBody(CreateUserRequest("Alice", "alice@example.com"))
}.body()
```

---

# SECTION 8 · TESTING

> `[MID]` JUnit 5, MockK, Spring Boot Test  
> `[SENIOR]` Coroutine testing, testcontainers, property-based testing

---

## 8.1 Unit Testing with MockK

```kotlin
import io.mockk.*
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import org.junit.jupiter.api.*
import org.junit.jupiter.api.extension.ExtendWith
import io.mockk.junit5.MockKExtension

@ExtendWith(MockKExtension::class)
class UserServiceTest {

    @MockK lateinit var userRepository: UserRepository
    @MockK lateinit var passwordEncoder: PasswordEncoder
    @MockK lateinit var eventPublisher: ApplicationEventPublisher

    @InjectMockKs
    lateinit var userService: UserService

    private val user = User(email = "alice@example.com", name = "Alice", id = 1L)

    @BeforeEach
    fun setUp() { clearAllMocks() }

    @Test
    fun `findById returns user when found`() {
        every { userRepository.findById(1L) } returns Optional.of(user)

        val result = userService.findById(1L)

        assertThat(result).isEqualTo(user)
        verify(exactly = 1) { userRepository.findById(1L) }
    }

    @Test
    fun `findById throws UserNotFoundException when not found`() {
        every { userRepository.findById(99L) } returns Optional.empty()

        assertThrows<UserNotFoundException> { userService.findById(99L) }
    }

    @Test
    fun `createUser saves and returns response`() {
        val request = CreateUserRequest("Alice", "alice@example.com", "password123")
        every { userRepository.existsByEmail(any()) } returns false
        every { userRepository.save(any()) } returns user
        every { eventPublisher.publishEvent(any()) } just Runs

        val result = userService.createUser(request)

        assertThat(result.email).isEqualTo("alice@example.com")
        verify { userRepository.save(match { it.email == "alice@example.com" }) }
        verify { eventPublisher.publishEvent(ofType<UserCreatedEvent>()) }
    }

    @Test
    fun `createUser throws when email already exists`() {
        val request = CreateUserRequest("Alice", "taken@example.com", "password123")
        every { userRepository.existsByEmail("taken@example.com") } returns true

        assertThrows<EmailAlreadyExistsException> { userService.createUser(request) }
        verify(exactly = 0) { userRepository.save(any()) }
    }

    // Argument capture
    @Test
    fun `createUser saves with correct data`() {
        val requestSlot = slot<User>()
        every { userRepository.existsByEmail(any()) } returns false
        every { userRepository.save(capture(requestSlot)) } returns user
        every { eventPublisher.publishEvent(any()) } just Runs

        userService.createUser(CreateUserRequest("Bob", "bob@x.com", "pass1234"))

        assertThat(requestSlot.captured.email).isEqualTo("bob@x.com")
        assertThat(requestSlot.captured.name).isEqualTo("Bob")
    }

    // MockK features
    // every { mock.method() } returns value        — stub return value
    // every { mock.method() } throws Exception()   — stub exception
    // every { mock.method() } just Runs            — stub Unit function
    // every { mock.method() } answers { it.invocation.args[0] }  — dynamic answer
    // verify { mock.method() }                     — verify called once
    // verify(exactly = 2) { mock.method() }        — verify call count
    // verify(atLeast = 1) { mock.method() }
    // verify(ordering = Ordering.SEQUENCE) { ... } — verify call order
    // confirmVerified(mock)                        — ensure no unexpected calls
}
```

---

## 8.2 Coroutine Testing

```kotlin
import kotlinx.coroutines.test.*
import kotlinx.coroutines.ExperimentalCoroutinesApi

@OptIn(ExperimentalCoroutinesApi::class)
class UserViewModelTest {

    // TestScope — virtual time; no real delays
    private val testDispatcher = StandardTestDispatcher()

    @BeforeEach
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @AfterEach
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadUser updates state`() = runTest {
        val repo = mockk<UserRepository> {
            coEvery { findById(1L) } returns user        // coEvery for suspend functions
        }
        val viewModel = UserViewModel(repo)

        viewModel.loadUser(1L)
        advanceUntilIdle()                               // advance virtual time

        assertThat(viewModel.state.value).isEqualTo(UserState.Success(user))
    }

    // Testing flows
    @Test
    fun `state flow emits correct values`() = runTest {
        val viewModel = CounterViewModel()

        val values = mutableListOf<Int>()
        val job = launch {
            viewModel.count.toList(values)
        }

        viewModel.increment()
        viewModel.increment()
        advanceUntilIdle()
        job.cancel()

        assertThat(values).containsExactly(0, 1, 2)
    }

    // Turbine — library for testing flows
    @Test
    fun `test flow with turbine`() = runTest {
        val repo = mockk<UserRepository>()
        coEvery { repo.streamUsers() } returns flowOf(user1, user2)
        val viewModel = UserViewModel(repo)

        viewModel.usersFlow.test {
            val first = awaitItem()
            assertThat(first).isEqualTo(user1)
            val second = awaitItem()
            assertThat(second).isEqualTo(user2)
            awaitComplete()
        }
    }

    // MockK coroutine support
    // coEvery  { suspendFn() } returns value      — stub suspending function
    // coVerify { suspendFn() }                    — verify suspending function called
    // coEvery  { suspendFn() } coAnswers { ... }  — dynamic async answer
}
```

---

## 8.3 Spring Boot Integration Tests

```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserControllerIntegrationTest {

    companion object {
        @Container
        @JvmStatic
        val postgres = PostgreSQLContainer<Nothing>("postgres:16-alpine").apply {
            withDatabaseName("testdb")
            withUsername("test")
            withPassword("test")
        }

        @DynamicPropertySource
        @JvmStatic
        fun configure(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var userRepository: UserRepository
    @MockkBean   lateinit var emailService: EmailService    // springmockk

    @BeforeEach
    fun setUp() {
        userRepository.deleteAll()
        every { emailService.sendWelcome(any()) } just Runs
    }

    @Test
    @WithMockUser(roles = ["ADMIN"])
    fun `POST users creates user and returns 201`() {
        val request = """{"name":"Alice","email":"alice@test.com","password":"Secret123!"}"""

        mockMvc.post("/api/users") {
            contentType = MediaType.APPLICATION_JSON
            content     = request
        }.andExpect {
            status { isCreated() }
            jsonPath("$.email") { value("alice@test.com") }
            jsonPath("$.name")  { value("Alice") }
            jsonPath("$.password") { doesNotExist() }
        }

        assertThat(userRepository.existsByEmail("alice@test.com")).isTrue()
    }

    @Test
    fun `GET users/:id returns 401 when unauthenticated`() {
        mockMvc.get("/api/users/1")
            .andExpect { status { isUnauthorized() } }
    }

    // WebTestClient for reactive/async
    @Autowired lateinit var webTestClient: WebTestClient

    @Test
    fun `async endpoint returns user`() {
        webTestClient.get().uri("/api/async/1")
            .exchange()
            .expectStatus().isOk
            .expectBody<UserResponse>()
            .value { assertThat(it.id).isEqualTo(1L) }
    }
}
```

---

# SECTION 9 · ANDROID KOTLIN PATTERNS

> `[MID]` ViewModel, LiveData, Room, Jetpack Compose basics  
> `[SENIOR]` Architecture patterns, MVI, Hilt, Compose side effects

---

## 9.1 ViewModel and State Management

```kotlin
// ViewModel with StateFlow
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val productRepository: ProductRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val productId = savedStateHandle.get<Long>("productId")!!

    // UI State — sealed class for all possible states
    sealed class UiState {
        object Loading : UiState()
        data class Success(val product: Product) : UiState()
        data class Error(val message: String) : UiState()
    }

    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    // UI Events — user intent
    data class UiEvent(val message: String)

    private val _events = Channel<UiEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        loadProduct()
    }

    fun loadProduct() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            try {
                val product = productRepository.getProduct(productId)
                _uiState.value = UiState.Success(product)
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun addToCart() {
        viewModelScope.launch {
            productRepository.addToCart(productId)
            _events.send(UiEvent("Added to cart!"))
        }
    }
}

// Jetpack Compose UI
@Composable
fun ProductScreen(
    viewModel: ProductViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // One-time events
    val lifecycleOwner = LocalLifecycleOwner.current
    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            viewModel.events.collect { event ->
                showSnackbar(event.message)
            }
        }
    }

    when (val state = uiState) {
        is ProductViewModel.UiState.Loading -> LoadingScreen()
        is ProductViewModel.UiState.Error   -> ErrorScreen(state.message) { viewModel.loadProduct() }
        is ProductViewModel.UiState.Success -> ProductContent(
            product    = state.product,
            onAddToCart = viewModel::addToCart,
        )
    }
}

@Composable
fun ProductContent(product: Product, onAddToCart: () -> Unit) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = product.name, style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "$${product.price}", style = MaterialTheme.typography.bodyLarge)
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onAddToCart,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Add to Cart")
        }
    }
}
```

---

## 9.2 Room Database

```kotlin
// Entity
@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: Long,
    @ColumnInfo(name = "name")  val name: String,
    @ColumnInfo(name = "price") val price: Double,
    @ColumnInfo(name = "cached_at") val cachedAt: Long = System.currentTimeMillis(),
)

// DAO
@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY name")
    fun observeAll(): Flow<List<ProductEntity>>       // Flow auto-updates on DB change

    @Query("SELECT * FROM products WHERE id = :id")
    suspend fun findById(id: Long): ProductEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(product: ProductEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(products: List<ProductEntity>)

    @Delete
    suspend fun delete(product: ProductEntity)

    @Query("DELETE FROM products WHERE cached_at < :cutoff")
    suspend fun deleteExpired(cutoff: Long)

    @Transaction
    @Query("SELECT * FROM products WHERE id = :id")
    suspend fun getProductWithOrders(id: Long): ProductWithOrders
}

// Database
@Database(
    entities = [ProductEntity::class, OrderEntity::class],
    version  = 2,
    exportSchema = true,
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun orderDao(): OrderDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database",
                )
                .addMigrations(MIGRATION_1_2)
                .build()
                .also { INSTANCE = it }
            }
    }
}

val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE products ADD COLUMN cached_at INTEGER NOT NULL DEFAULT 0")
    }
}

// Repository with offline-first pattern
class ProductRepository @Inject constructor(
    private val productDao: ProductDao,
    private val apiService: ProductApiService,
) {
    fun observeProducts(): Flow<List<Product>> =
        productDao.observeAll()
            .map { entities -> entities.map { it.toDomain() } }

    suspend fun refreshProducts() {
        val products = apiService.getProducts()
        productDao.insertAll(products.map { it.toEntity() })
    }

    suspend fun getProduct(id: Long): Product {
        val cached = productDao.findById(id)
        if (cached != null && !cached.isExpired()) return cached.toDomain()

        val fresh = apiService.getProduct(id)
        productDao.insert(fresh.toEntity())
        return fresh
    }
}
```

---

# SECTION 10 · KOTLIN MULTIPLATFORM (KMP)

> `[SENIOR]` Shared code, platform-specific implementations, Compose Multiplatform

---

## 10.1 KMP Project Structure

```kotlin
// Shared module — business logic shared across platforms
// commonMain — code shared by ALL targets
// androidMain — Android-specific implementations
// iosMain     — iOS-specific implementations
// jvmMain     — JVM/Desktop implementations
// jsMain      — JS/Web implementations

// expect / actual — platform-specific implementations
// commonMain
expect fun getCurrentTimestamp(): Long
expect class PlatformContext

expect fun createDatabase(context: PlatformContext): AppDatabase

// androidMain
actual fun getCurrentTimestamp(): Long = System.currentTimeMillis()
actual class PlatformContext(val context: Context)
actual fun createDatabase(context: PlatformContext): AppDatabase =
    Room.databaseBuilder(context.context, AppDatabase::class.java, "app.db").build()

// iosMain
actual fun getCurrentTimestamp(): Long = NSDate().timeIntervalSince1970.toLong() * 1000
actual class PlatformContext
actual fun createDatabase(context: PlatformContext): AppDatabase =
    Room.databaseBuilder(name = "app.db").build()

// Shared domain model and repository
// commonMain/kotlin/com/example/shared/domain/UserRepository.kt
class UserRepository(private val db: AppDatabase) {
    suspend fun getUsers(): List<User> = db.userDao().getAll().map { it.toDomain() }

    fun observeUsers(): Flow<List<User>> =
        db.userDao().observeAll().map { it.map { e -> e.toDomain() } }
}

// Shared ViewModel (using Decompose or custom MOKO)
class SharedViewModel(private val repository: UserRepository) {
    private val _state = MutableStateFlow<List<User>>(emptyList())
    val state = _state.asStateFlow()

    fun loadUsers() {
        // Use CommonMain coroutine scope
        coroutineScope.launch {
            _state.value = repository.getUsers()
        }
    }
}

// build.gradle.kts — KMP configuration
kotlin {
    androidTarget { compilations.all { kotlinOptions.jvmTarget = "17" } }
    iosX64(); iosArm64(); iosSimulatorArm64()
    jvm("desktop")

    sourceSets {
        commonMain.dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
            implementation("io.ktor:ktor-client-core:2.3.7")
            implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
        }
        androidMain.dependencies {
            implementation("io.ktor:ktor-client-okhttp:2.3.7")
        }
        iosMain.dependencies {
            implementation("io.ktor:ktor-client-darwin:2.3.7")
        }
    }
}
```

---

# SECTION 11 · DSLs AND ADVANCED PATTERNS

> `[SENIOR]` Type-safe builders, DSL design, extension function receivers

---

## 11.1 Building DSLs

```kotlin
// Type-safe builder DSL
@DslMarker
annotation class HtmlDsl

@HtmlDsl
class HtmlTag(val name: String) {
    private val children = mutableListOf<HtmlTag>()
    private val attributes = mutableMapOf<String, String>()
    var text: String = ""

    operator fun String.invoke(value: String) { attributes[this] = value }

    fun div(init: HtmlTag.() -> Unit) = addChild("div", init)
    fun p(init: HtmlTag.() -> Unit)   = addChild("p", init)
    fun h1(init: HtmlTag.() -> Unit)  = addChild("h1", init)
    fun a(href: String, init: HtmlTag.() -> Unit) = addChild("a", init).also {
        it.attributes["href"] = href
    }

    private fun addChild(tagName: String, init: HtmlTag.() -> Unit): HtmlTag {
        val tag = HtmlTag(tagName).apply(init)
        children.add(tag)
        return tag
    }

    fun render(sb: StringBuilder = StringBuilder(), indent: Int = 0): String {
        val attrs = attributes.entries.joinToString(" ") { (k, v) -> "$k=\"$v\"" }
        sb.append("${" ".repeat(indent)}<$name${if (attrs.isNotEmpty()) " $attrs" else ""}>\n")
        if (text.isNotEmpty()) sb.append("${" ".repeat(indent + 2)}$text\n")
        children.forEach { it.render(sb, indent + 2) }
        sb.append("${" ".repeat(indent)}</$name>\n")
        return sb.toString()
    }
}

fun html(init: HtmlTag.() -> Unit): HtmlTag = HtmlTag("html").apply(init)

// Usage
val page = html {
    div {
        h1 { text = "Welcome" }
        p  { text = "Hello, World!" }
        a("https://example.com") { text = "Click here" }
    }
}

// Query DSL
class QueryBuilder<T : Any>(private val table: String) {
    private val conditions = mutableListOf<String>()
    private var limit: Int? = null
    private val orderBy = mutableListOf<String>()

    fun where(condition: String): QueryBuilder<T> {
        conditions.add(condition)
        return this
    }

    fun whereEq(field: String, value: Any): QueryBuilder<T> =
        where("$field = '${value}'")

    fun limit(n: Int): QueryBuilder<T>    { limit = n; return this }
    fun orderBy(field: String, desc: Boolean = false): QueryBuilder<T> {
        orderBy.add("$field${if (desc) " DESC" else ""}")
        return this
    }

    fun build(): String = buildString {
        append("SELECT * FROM $table")
        if (conditions.isNotEmpty()) append(" WHERE ${conditions.joinToString(" AND ")}")
        if (orderBy.isNotEmpty())    append(" ORDER BY ${orderBy.joinToString(", ")}")
        if (limit != null)           append(" LIMIT $limit")
    }
}

fun <T : Any> query(table: String, init: QueryBuilder<T>.() -> Unit): String =
    QueryBuilder<T>(table).apply(init).build()

val sql = query<User>("users") {
    whereEq("role", "admin")
    whereEq("active", true)
    orderBy("created_at", desc = true)
    limit(10)
}

// Configuration DSL (common pattern in Spring, Ktor, etc.)
class ServerConfig {
    var host: String = "0.0.0.0"
    var port: Int    = 8080
    lateinit var database: DatabaseConfig
    val middleware = mutableListOf<String>()

    fun database(init: DatabaseConfig.() -> Unit) {
        database = DatabaseConfig().apply(init)
    }
    fun middleware(vararg names: String) { middleware.addAll(names) }
}

class DatabaseConfig {
    var url: String  = ""
    var poolSize: Int = 10
}

fun server(init: ServerConfig.() -> Unit): ServerConfig = ServerConfig().apply(init)

val config = server {
    host = "localhost"
    port = 9090
    database {
        url      = "jdbc:postgresql://localhost:5432/mydb"
        poolSize = 20
    }
    middleware("logging", "auth", "rateLimit")
}
```

---

# SECTION 12 · INTEROPERABILITY WITH JAVA

> `[MID]` Calling Java from Kotlin and vice versa  
> `[SENIOR]` Annotations for Java interop, mixed codebase strategies

---

## 12.1 Java Interop

```kotlin
// ─── Kotlin calling Java ──────────────────────────────────────────────────────
// Works mostly seamlessly; main concern is null safety

// Java returns platform type (String!) — may or may not be null
val javaString: String = JavaClass.getString()   // assume non-null (risky)
val javaString2: String? = JavaClass.getString() // treat as nullable (safe)

// SAM conversions — Java @FunctionalInterface works as lambda
val thread = Thread { println("Running") }       // Runnable → lambda
executor.submit { computeResult() }              // Callable → lambda

// Java getters/setters accessed as Kotlin properties
val file = File("/tmp/test.txt")
val name = file.name           // → file.getName()
file.setReadable(true)         // no property; keep as method call

// Java static members
val pi = Math.PI                // Java static field
val abs = Math.abs(-5)          // Java static method

// ─── Java calling Kotlin ──────────────────────────────────────────────────────

// @JvmStatic — expose companion/object function as static
class Config {
    companion object {
        @JvmStatic fun create(): Config = Config()  // Java: Config.create()
        // Without @JvmStatic: Config.Companion.create()
    }
}

// @JvmField — expose as field (no getter/setter)
class Constants {
    companion object {
        @JvmField val MAX_SIZE = 100    // Java: Constants.MAX_SIZE
        const val VERSION = "1.0.0"     // const val also exposed as static field
    }
}

// @JvmOverloads — generate overloaded methods for default parameters
class Greeter {
    @JvmOverloads
    fun greet(name: String, greeting: String = "Hello"): String =
        "$greeting, $name!"
    // Generates: greet(String) and greet(String, String)
}

// @JvmName — rename Kotlin function for Java
@JvmName("getFilteredUsers")
fun List<User>.filterActive(): List<User> = filter { it.isActive }
// Java: UserKt.getFilteredUsers(users)  instead of UserKt.filterActive(users)

// @Throws — declare checked exceptions for Java callers
@Throws(IOException::class, SQLException::class)
fun readData(): String { TODO() }

// Top-level functions — Java sees them in a class named after file
// Users.kt → UsersKt class in Java
// Override with @file:JvmName("Users")
@file:JvmName("UserUtils")
package com.example.utils

fun formatUser(user: User): String = "${user.name} <${user.email}>"
// Java: UserUtils.formatUser(user)  instead of UserUtilsKt.formatUser(user)

// Extension functions from Java — first parameter is receiver
// fun String.isPalindrome() → StringExtKt.isPalindrome(myString)

// Data classes from Java — component functions named component1, component2...
// Java cannot use destructuring; must call componentN() explicitly
```

---

# APPENDIX A — QUICK REFERENCE: TALENT SIGNALS BY LEVEL

---

## Junior-Level Signals

```
POSITIVE SIGNALS (Junior):
✓ Understands val vs var — prefers val by default
✓ Knows null safety — uses ?. and ?: instead of null checks
✓ Uses data classes for value objects — knows what's generated
✓ Understands when expressions are exhaustive (sealed, enum)
✓ Knows difference between List and MutableList
✓ Uses string templates instead of concatenation
✓ Understands that Kotlin classes are final by default
✓ Knows companion object vs object declaration
✓ Can write basic extension functions
✓ Uses named arguments and default parameters

RED FLAGS (Junior):
✗ Uses !! everywhere instead of proper null handling
✗ Creates mutable lists/maps when immutable would suffice
✗ Uses Java-style for loops instead of collection functions
✗ Ignores smart casts — does manual casting after is check
✗ Uses nullable types when non-null is possible
✗ Doesn't know difference between == and === in Kotlin
✗ Mixes data class with JPA entities (causes issues)
✗ Does not use when as expression (misses exhaustiveness checking)
✗ Calls .get() on Optional from Java instead of using idiomatic null
```

---

## Mid-Level Signals

```
POSITIVE SIGNALS (Mid):
✓ Uses sealed classes for domain modeling — knows exhaustive when
✓ Understands coroutines — can explain structured concurrency
✓ Knows Dispatchers and when to use each
✓ Writes custom extension functions for domain logic
✓ Uses sequences vs collections appropriately — knows the trade-off
✓ Applies inline functions for performance (avoids lambda overhead)
✓ Designs with delegation — by keyword, lazy, observable
✓ Understands declaration-site variance (out/in) conceptually
✓ Can explain Flow vs Channel and when to use each
✓ Knows MockK coEvery/coVerify for testing suspend functions

RED FLAGS (Mid):
✗ Uses GlobalScope — leaks coroutines, ignores structured concurrency
✗ Swallows CancellationException — breaks cooperative cancellation
✗ Calls blocking code inside coroutines without Dispatchers.IO
✗ Creates data class for JPA entity — Hibernate needs no-arg constructor
✗ Does not know about the N+1 problem in Spring Data
✗ Uses Thread.sleep() instead of delay() in coroutines
✗ Cannot explain why runBlocking should not be used on main thread in production
✗ Uses lateinit var on val — doesn't understand why it won't compile
✗ Does not understand that Flow is cold — confuses with hot streams
```

---

## Senior-Level Signals

```
POSITIVE SIGNALS (Senior):
✓ Designs type-safe DSLs with @DslMarker to prevent scope leaks
✓ Explains type erasure and when reified is needed — and its limitations
✓ Uses value classes to enforce domain type safety at zero runtime cost
✓ Designs sealed hierarchies with exhaustive when — no else branches
✓ Understands coroutine internals — continuation-passing style, state machines
✓ Designs SharedFlow vs StateFlow correctly — replay, buffer, overflow strategy
✓ Implements structured concurrency properly — custom CoroutineScope + SupervisorJob
✓ Uses contracts to give compiler smart-cast hints
✓ Knows KMP expect/actual mechanism — shares domain logic across platforms
✓ Understands Kotlin's compilation model — bytecode output, IR backend
✓ Designs proper exception propagation in coroutine hierarchies
✓ Knows @JvmStatic, @JvmField, @JvmOverloads for Java interop
✓ Avoids object expressions in performance-critical code (allocates)
✓ Uses tail recursion (tailrec) for deep recursive algorithms

RED FLAGS (Senior):
✗ Cannot explain structured concurrency — why GlobalScope is dangerous
✗ Does not know the difference between Job and SupervisorJob
✗ Designs anemic domain model in Kotlin — misses domain-driven approach
✗ Cannot explain variance — uses star projection everywhere
✗ Thinks Kotlin's List is truly immutable — it's only a read-only view
✗ Uses runBlocking in production service code — blocks thread pool threads
✗ Does not understand that inline functions increase bytecode size
✗ Uses coroutine channels as general-purpose queues without considering Flow
✗ Cannot explain the memory model implications of shared mutable state in coroutines
✗ Does not know about Kotlin contracts (kotlin.contracts) and their use cases
```

---

# APPENDIX B — KOTLIN VERSION FEATURE MATRIX

| Version | Key Features |
|---------|-------------|
| **Kotlin 1.3** | Coroutines stable, `contract` API (experimental), `when` with subject variable, inline classes (experimental), `@JvmStatic` in interfaces |
| **Kotlin 1.4** | SAM conversions for Kotlin interfaces, trailing comma, mixed named and positional args, `fun interface`, stdlib improvements (`scan`, `onEach`) |
| **Kotlin 1.5** | Value classes (stable, replaces inline classes), sealed interfaces, JVM records support, `Duration` API stable, `Char` extension functions, `String.toXxx()` extensions |
| **Kotlin 1.6** | Sealed `when` exhaustiveness, `suspend` conversion, `typeOf()` stable, `Duration` in stdlib, builder inference improvements |
| **Kotlin 1.7** | K2 compiler (alpha), underscore operator for type args, implementation via delegation improvement, `@OptIn` stable, `min/max` on `Duration` |
| **Kotlin 1.8** | `AutoCloseable` in stdlib, Java interop improvements, `KClass.java` platform types fix, `cbrt` / `TimeUnit` extensions |
| **Kotlin 1.9** | K2 compiler (beta), `Enum.entries` (replaces `values()`), `@Volatile` on constructor property, stdlib `HexFormat`, `rangeUntil` operator `..<` |
| **Kotlin 2.0** | K2 compiler stable (2x faster compilation), smart cast improvements, non-local break/continue in inline lambdas, Compose compiler plugin bundled |
| **Kotlin 2.1** | `when` guard conditions (`when (x) { is String if x.isNotEmpty() -> ... }`), multi-dollar string interpolation, nested non-local returns |

---

# APPENDIX C — COROUTINES QUICK REFERENCE

| Builder / Function | Returns | Description |
|--------------------|---------|-------------|
| `launch { }` | `Job` | Fire-and-forget; exceptions propagate to parent |
| `async { }` | `Deferred<T>` | Returns result via `await()`; exceptions on `await()` |
| `runBlocking { }` | `T` | Blocks thread; use in `main()` and tests only |
| `coroutineScope { }` | `T` | Creates child scope; cancels all children on exception |
| `supervisorScope { }` | `T` | Child failures don't cancel siblings |
| `withContext(D) { }` | `T` | Switch dispatcher; suspending (no new coroutine) |
| `withTimeout(ms) { }` | `T` | Throws `TimeoutCancellationException` on timeout |
| `withTimeoutOrNull(ms) { }` | `T?` | Returns null on timeout |
| `delay(ms)` | `Unit` | Non-blocking sleep; cancellable |
| `yield()` | `Unit` | Suspend and let other coroutines run |
| `ensureActive()` | `Unit` | Throws `CancellationException` if cancelled |
| `Job.cancel()` | | Request cancellation |
| `Job.join()` | | Suspend until job completes |
| `Job.cancelAndJoin()` | | Cancel + join |
| `Deferred.await()` | `T` | Suspend until result ready |

| Flow Operator | Type | Description |
|---------------|------|-------------|
| `collect { }` | Terminal | Collect all values |
| `first()` | Terminal | First value (throws if empty) |
| `toList()` | Terminal | Collect to List |
| `map { }` | Intermediate | Transform values |
| `filter { }` | Intermediate | Filter values |
| `take(n)` | Intermediate | First n values |
| `flatMapLatest { }` | Intermediate | Cancel previous on new emission |
| `debounce(ms)` | Intermediate | Emit only after idle period |
| `distinctUntilChanged()` | Intermediate | Emit only on change |
| `onEach { }` | Intermediate | Side effect per value |
| `catch { }` | Intermediate | Handle exceptions |
| `flowOn(D)` | Intermediate | Change upstream dispatcher |
| `shareIn(scope, started)` | Converts to SharedFlow | Make cold flow hot |
| `stateIn(scope, started, init)` | Converts to StateFlow | Make cold flow stateful |

---

# APPENDIX D — COLLECTIONS COMPLEXITY CHEAT SHEET

| Collection | Access | Add (end) | Insert (mid) | Remove | Contains |
|------------|--------|-----------|--------------|--------|----------|
| `List` (ArrayList) | O(1) | O(1)* | O(n) | O(n) | O(n) |
| `LinkedList` | O(n) | O(1) | O(1)† | O(1)† | O(n) |
| `ArrayDeque` | O(1) | O(1)* | O(n) | O(1)‡ | O(n) |
| `HashMap` | O(1) | O(1) | — | O(1) | O(1) |
| `LinkedHashMap` | O(1) | O(1) | — | O(1) | O(1) |
| `TreeMap` | O(log n) | O(log n) | — | O(log n) | O(log n) |
| `HashSet` | — | O(1) | — | O(1) | O(1) |
| `TreeSet` | — | O(log n) | — | O(log n) | O(log n) |
| `PriorityQueue` | O(1) peek | O(log n) | — | O(log n) | O(n) |

*amortized · †at known position · ‡at ends only

---

# APPENDIX E — COMMON PATTERNS AND RECIPES

```kotlin
// ─── Result type — railway-oriented programming ───────────────────────────────
sealed class Result<out T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Failure(val error: Throwable) : Result<Nothing>()

    val isSuccess get() = this is Success
    val isFailure get() = this is Failure

    fun getOrNull(): T? = (this as? Success)?.value
    fun exceptionOrNull(): Throwable? = (this as? Failure)?.error
}

fun <T> Result<T>.getOrDefault(default: T): T =
    if (this is Result.Success) value else default

fun <T, R> Result<T>.map(transform: (T) -> R): Result<R> = when (this) {
    is Result.Success -> Result.Success(transform(value))
    is Result.Failure -> this
}

fun <T, R> Result<T>.flatMap(transform: (T) -> Result<R>): Result<R> = when (this) {
    is Result.Success -> transform(value)
    is Result.Failure -> this
}

fun <T> runCatching2(block: () -> T): Result<T> = try {
    Result.Success(block())
} catch (e: Exception) {
    Result.Failure(e)
}

// ─── Builder pattern using apply/also/let/run/with ────────────────────────────
// apply  — receiver is this;  returns receiver
// also   — receiver is it;    returns receiver
// let    — receiver is it;    returns lambda result
// run    — receiver is this;  returns lambda result
// with   — receiver is this (not extension); returns lambda result

val user = User().apply {
    name  = "Alice"
    email = "alice@example.com"
    role  = Role.ADMIN
}

val validated = user.also {
    require(it.email.contains("@")) { "Invalid email" }
}

val response = user.let { u ->
    UserResponse(id = u.id, name = u.name, email = u.email)
}

// ─── Retry with coroutines ────────────────────────────────────────────────────
suspend fun <T> retry(
    times: Int = 3,
    initialDelay: Long = 100,
    factor: Double = 2.0,
    maxDelay: Long = 10_000,
    shouldRetry: (Throwable) -> Boolean = { true },
    block: suspend () -> T,
): T {
    var currentDelay = initialDelay
    repeat(times - 1) { attempt ->
        try {
            return block()
        } catch (e: CancellationException) {
            throw e                             // never retry cancellation
        } catch (e: Throwable) {
            if (!shouldRetry(e)) throw e
            delay(currentDelay)
            currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelay)
        }
    }
    return block()                              // last attempt — let exception propagate
}

// Usage
val user = retry(times = 3, shouldRetry = { it is NetworkException }) {
    apiService.getUser(id)
}

// ─── Dependency injection without framework ───────────────────────────────────
class AppContainer(private val config: AppConfig) {
    // Lazy singletons — created on first access
    val database: Database by lazy { Database(config.dbUrl) }
    val userRepository: UserRepository by lazy { UserRepositoryImpl(database) }
    val emailService: EmailService by lazy { SmtpEmailService(config.smtpHost) }
    val userService: UserService by lazy { UserService(userRepository, emailService) }
}

// ─── Scope functions for clean initialization ─────────────────────────────────
val server = NettyServer().also { server ->
    server.port  = config.port
    server.host  = config.host
}.apply {
    addRoute("/health") { respondOk() }
    addRoute("/api")    { routeApi() }
}
```

---

# APPENDIX F — KOTLIN vs JAVA QUICK COMPARISON

| Feature | Kotlin | Java |
|---------|--------|------|
| Null safety | Built-in type system (`?`) | Optional (not enforced) |
| Data classes | `data class` (auto-generated) | Records (Java 16+, less flexible) |
| Extension functions | Native | Not available |
| Coroutines | First-class (`kotlinx.coroutines`) | Virtual threads (Java 21+) |
| Sealed classes | `sealed class` / `sealed interface` | Sealed classes (Java 17+) |
| Pattern matching | `when` + smart casts | `switch` expressions (Java 21+) |
| Properties | Built-in (get/set) | Fields + manual getters/setters |
| Default parameters | Native | Method overloading |
| String templates | `"Hello $name"` | Text blocks (no interpolation) |
| Lambdas | First-class; no SAM restriction | SAM (functional interfaces only) |
| Immutability | `val` (reference); collections read-only view | `final`; Collections.unmodifiableX() |
| Type inference | Extensive (`val`, generics, lambdas) | Limited (local `var`, simple generics) |
| Operator overloading | Native | Not available |
| Checked exceptions | None (all unchecked) | Checked exceptions enforced |
| Singleton | `object` keyword | `static` members or enum |
| Class finality | Final by default | Open by default |
| Primary constructor | In class header | Separate constructor body |
| Bytecode target | JVM, JS, Native | JVM |

---

*END OF KOTLIN RAG KNOWLEDGE BASE DOCUMENT*