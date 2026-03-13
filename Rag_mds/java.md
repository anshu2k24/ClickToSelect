# JAVA — FULL-SPECTRUM RAG KNOWLEDGE BASE

> Structured for AI Interviewer · Three-Level Contextual Model · Junior → Mid → Senior  
> Topics: Core Syntax · OOP · Collections · Generics · Concurrency · JVM Internals · Memory · Streams · Functional · Spring · Testing · Design Patterns · Microservices · Performance · Security

---

# SECTION 1 · CORE SYNTAX & LANGUAGE FUNDAMENTALS

> `[JUNIOR]` Variables, types, operators, control flow, methods

---

## 1.1 Primitive Types and Variables

```java
// Primitive types — stored by value on stack (or inlined in objects)
byte    b  = 127;           // 8-bit signed: -128 to 127
short   s  = 32767;         // 16-bit signed
int     i  = 2_147_483_647; // 32-bit signed (underscore separators: Java 7+)
long    l  = 9_223_372_036_854_775_807L; // 64-bit signed — suffix L required
float   f  = 3.14f;         // 32-bit IEEE 754 — suffix f required
double  d  = 3.14159265358979; // 64-bit IEEE 754 — default for decimal literals
char    c  = 'A';           // 16-bit Unicode UTF-16 code unit
boolean ok = true;          // true or false — NOT 0/1

// Integer literals
int hex  = 0xFF;            // hexadecimal
int bin  = 0b1010_1010;     // binary (Java 7+)
int oct  = 0755;            // octal

// Widening and narrowing
double d2 = i;              // widening: implicit, safe
int    i2 = (int) d;        // narrowing: explicit cast, may lose data
byte   by = (byte) 200;     // → -56 (overflow wraps)

// Wrapper types — autoboxing/unboxing (Java 5+)
Integer boxed   = 42;       // autoboxing: Integer.valueOf(42)
int     unboxed = boxed;    // unboxing: boxed.intValue()

// Integer cache: -128 to 127 are cached singletons
Integer a = 127, b2 = 127;
a == b2;    // → true  (same cached object)
Integer c2 = 128, d3 = 128;
c2 == d3;   // → false (different objects — ALWAYS use .equals())

// var — local variable type inference (Java 10+)
var list    = new ArrayList<String>();  // inferred as ArrayList<String>
var message = "Hello";                  // inferred as String
// var cannot be used for fields, method params, or return types
```

---

## 1.2 Strings

```java
// String — immutable, stored in String Pool (heap)
String s1 = "hello";           // string literal — goes into pool
String s2 = new String("hello"); // new heap object — bypasses pool (avoid)
String s3 = "hello";

s1 == s3     // → true  (same pool object)
s1 == s2     // → false (s2 is separate heap object)
s1.equals(s2) // → true  (content comparison — ALWAYS use equals())

// String Pool and interning
String s4 = s2.intern();  // move s2 into pool; s4 == s1 → true

// String methods
s1.length()                      // → 5
s1.charAt(1)                     // → 'e'
s1.substring(1, 3)               // → "el"  [start, end)
s1.indexOf("ll")                 // → 2
s1.contains("ell")               // → true
s1.startsWith("hel")             // → true
s1.toUpperCase()                 // → "HELLO"
s1.trim()                        // removes leading/trailing whitespace
s1.strip()                       // Java 11+: Unicode-aware trim
s1.isBlank()                     // Java 11+: true if empty or only whitespace
s1.repeat(3)                     // Java 11+: "hellohellohello"
"a,b,c".split(",")               // → ["a","b","c"]
String.join("-", "a","b","c")    // → "a-b-c"
String.format("Hello %s %d", name, age)

// String comparison — ALWAYS use equals(), never ==
"Hello".equals(s1)               // null-safe direction: literal on left avoids NPE
Objects.equals(s1, s2)           // null-safe: handles null on both sides

// StringBuilder — mutable, not thread-safe, use for building strings
StringBuilder sb = new StringBuilder();
sb.append("Hello").append(", ").append("World"); // chaining
sb.insert(5, "!").delete(0, 5).reverse();
sb.toString();

// StringJoiner (Java 8+)
StringJoiner sj = new StringJoiner(", ", "[", "]");
sj.add("a"); sj.add("b"); sj.add("c");
sj.toString();  // → "[a, b, c]"

// Text blocks (Java 15+)
String json = """
        {
            "name": "Alice",
            "age": 30
        }
        """;  // leading whitespace stripped based on closing """

// String.formatted (Java 15+)
String msg = "Hello %s".formatted("World");
```

---

## 1.3 Control Flow

```java
// Enhanced for (for-each) — works on arrays and Iterables
for (String item : list) { process(item); }

// Switch expression (Java 14+)
int day = 3;
String name = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    default -> "Unknown";
};

// Switch expression with yield
String result = switch (status) {
    case "OK"    -> "Success";
    case "FAIL"  -> "Failure";
    default      -> {
        log("Unknown: " + status);
        yield "Unknown";   // yield returns value from block
    }
};

// Pattern matching for instanceof (Java 16+)
if (obj instanceof String s) {
    // s is already cast — no explicit cast needed
    System.out.println(s.toUpperCase());
}

// Labeled break/continue
outer:
for (int i = 0; i < 5; i++) {
    for (int j = 0; j < 5; j++) {
        if (i + j == 6) break outer;
    }
}

// try-with-resources (Java 7+)
try (InputStream in = Files.newInputStream(path);
     OutputStream out = Files.newOutputStream(dest)) {
    in.transferTo(out);
}  // both closed automatically even on exception
// Resources must implement AutoCloseable
```

---

## 1.4 Arrays

```java
// Declaration and initialization
int[]    arr1 = new int[5];          // zero-initialized
int[]    arr2 = {1, 2, 3, 4, 5};     // inline initialization
int[][]  matrix = new int[3][4];     // 2D array
int[][]  jagged = new int[3][];      // jagged array — each row different length

// Array operations
Arrays.sort(arr2);                   // in-place sort — dual-pivot quicksort
Arrays.binarySearch(arr2, 3);        // requires sorted array
Arrays.fill(arr1, 42);               // fill with value
Arrays.copyOf(arr2, 10);             // copy, extending with zeros if needed
Arrays.copyOfRange(arr2, 1, 4);      // copy range [1, 4)
Arrays.equals(arr1, arr2);           // element-wise comparison
Arrays.toString(arr2);               // "[1, 2, 3, 4, 5]"

// Array → List
List<String> list = Arrays.asList("a", "b", "c");  // fixed size, backed by array
List<String> list2 = new ArrayList<>(Arrays.asList("a", "b")); // mutable copy
List<Integer> list3 = List.of(1, 2, 3);  // Java 9+: immutable
```

---

## 1.5 Methods and Varargs

```java
// Method overloading — same name, different parameter types/count
int add(int a, int b)     { return a + b; }
double add(double a, double b) { return a + b; }

// Varargs — must be last parameter; received as array
int sum(int... nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}
sum(1, 2, 3);      // → 6
sum(new int[]{1,2,3}); // array also accepted

// Pass-by-value semantics
// Primitives: copy of value
// Objects: copy of reference (not a copy of the object)
void tryModify(int x, StringBuilder sb) {
    x = 99;              // does NOT affect caller's x
    sb.append("!");      // DOES affect caller's sb (same object)
    sb = new StringBuilder(); // does NOT affect caller's sb
}
```

---

# SECTION 2 · OBJECT-ORIENTED PROGRAMMING

> `[JUNIOR]` Classes, inheritance, interfaces  
> `[MID]` Abstract classes, enums, sealed classes, record types  
> `[SENIOR]` SOLID principles, composition over inheritance, design trade-offs

---

## 2.1 Classes and Objects

```java
public class BankAccount {
    // Fields
    private final String id;        // final = set once (in constructor or declaration)
    private double balance;
    private static int totalAccounts = 0;  // class-level state

    // Constructor
    public BankAccount(String id, double initialBalance) {
        this.id = id;
        this.balance = initialBalance;
        totalAccounts++;
    }

    // Static factory method — preferred over constructors for complex creation
    public static BankAccount of(String id) {
        return new BankAccount(id, 0.0);
    }

    // Instance methods
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        this.balance += amount;
    }

    public boolean withdraw(double amount) {
        if (amount > balance) return false;
        balance -= amount;
        return true;
    }

    // Getters — no setters for immutable fields
    public double getBalance()  { return balance; }
    public String getId()       { return id; }
    public static int getTotalAccounts() { return totalAccounts; }

    // Object methods to always override together
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BankAccount that)) return false;  // pattern matching
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() { return Objects.hash(id); }

    @Override
    public String toString() { return "BankAccount{id=" + id + ", balance=" + balance + "}"; }
}
```

---

## 2.2 Inheritance and Polymorphism

```java
// Abstract class — partial implementation, cannot be instantiated
public abstract class Shape {
    protected String color;

    public Shape(String color) { this.color = color; }

    // Abstract method — subclasses MUST implement
    public abstract double area();
    public abstract double perimeter();

    // Concrete method — shared implementation
    public void describe() {
        System.out.printf("%s %s: area=%.2f%n", color, getClass().getSimpleName(), area());
    }
}

public class Circle extends Shape {
    private final double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override public double area()      { return Math.PI * radius * radius; }
    @Override public double perimeter() { return 2 * Math.PI * radius; }
}

// Covariant return type — Java allows narrowing return type in override
public class ColoredShape extends Shape {
    @Override
    public ColoredShape someMethod() { ... }  // return type narrows
}

// final class — cannot be subclassed (e.g., String, Integer)
public final class ImmutablePoint {
    private final int x, y;
    public ImmutablePoint(int x, int y) { this.x = x; this.y = y; }
}
```

---

## 2.3 Interfaces

```java
// Interface — pure contract; all methods public abstract by default
public interface Drawable {
    void draw();              // implicitly public abstract
    double getArea();

    // Default method (Java 8+) — provides default implementation
    default String describe() {
        return "Drawable with area " + getArea();
    }

    // Static method (Java 8+)
    static Drawable empty() {
        return () -> {};
    }

    // Private method (Java 9+) — shared helper for default methods
    private void logDraw() {
        System.out.println("Drawing " + getClass().getSimpleName());
    }

    // Constants — implicitly public static final
    int MAX_SIZE = 1000;
}

// Functional interface — exactly one abstract method (target for lambdas)
@FunctionalInterface
public interface Transformer<T, R> {
    R transform(T input);

    // Default and static methods don't count toward the one-abstract-method rule
    default <V> Transformer<T, V> andThen(Transformer<R, V> after) {
        return t -> after.transform(this.transform(t));
    }
}

// Multiple interface implementation
public class Canvas implements Drawable, Serializable, Cloneable {
    @Override public void draw() { ... }
    @Override public double getArea() { return width * height; }
}
```

---

## 2.4 Enums

```java
// Basic enum — each constant is an instance of the enum class
public enum Day {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY;

    public boolean isWeekend() {
        return this == SATURDAY || this == SUNDAY;
    }
}

// Enum with fields and constructor
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS  (4.869e+24, 6.0518e6),
    EARTH  (5.976e+24, 6.37814e6);

    private final double mass;    // kg
    private final double radius;  // meters

    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    static final double G = 6.67300E-11;
    double surfaceGravity() { return G * mass / (radius * radius); }
    double surfaceWeight(double otherMass) { return otherMass * surfaceGravity(); }
}

// Enum methods
Day.MONDAY.name()      // → "MONDAY"
Day.MONDAY.ordinal()   // → 0 (avoid relying on ordinal — fragile)
Day.valueOf("FRIDAY")  // → Day.FRIDAY
Day.values()           // → Day[] of all constants

// Enum in switch
Day today = Day.WEDNESDAY;
switch (today) {
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> System.out.println("Weekday");
    case SATURDAY, SUNDAY -> System.out.println("Weekend");
}

// EnumSet / EnumMap — very efficient (bitmask / array backed)
EnumSet<Day> weekend = EnumSet.of(Day.SATURDAY, Day.SUNDAY);
EnumMap<Day, String> schedule = new EnumMap<>(Day.class);
schedule.put(Day.MONDAY, "Stand-up meeting");
```

---

## 2.5 Records (Java 16+)

```java
// Record — immutable data carrier; auto-generates constructor, accessors, equals, hashCode, toString
public record Point(double x, double y) {

    // Compact canonical constructor — validation
    public Point {
        if (Double.isNaN(x) || Double.isNaN(y))
            throw new IllegalArgumentException("Coordinates cannot be NaN");
    }

    // Custom method
    public double distanceTo(Point other) {
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    // Can define static factory, static fields, static methods
    public static Point origin() { return new Point(0, 0); }
}

// Usage
Point p = new Point(3.0, 4.0);
p.x()          // → 3.0  (accessor, not getX())
p.y()          // → 4.0
p.distanceTo(Point.origin())  // → 5.0

// Records can implement interfaces
public record Range(int start, int end) implements Comparable<Range> {
    public Range { if (start > end) throw new IllegalArgumentException(); }

    @Override
    public int compareTo(Range other) { return Integer.compare(this.start, other.start); }
}
```

---

## 2.6 Sealed Classes (Java 17+)

```java
// Sealed class — restricts which classes can extend it
public sealed class Shape permits Circle, Rectangle, Triangle {
    public abstract double area();
}

public final class Circle extends Shape {
    private final double radius;
    public Circle(double radius) { this.radius = radius; }
    @Override public double area() { return Math.PI * radius * radius; }
}

public final class Rectangle extends Shape {
    private final double width, height;
    public Rectangle(double w, double h) { this.width = w; this.height = h; }
    @Override public double area() { return width * height; }
}

public non-sealed class Triangle extends Shape {  // can be further extended
    @Override public double area() { ... }
}

// Pattern matching with sealed classes — compiler knows all cases
double describeArea(Shape shape) {
    return switch (shape) {
        case Circle c    -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t  -> t.area();
        // no default needed — compiler verifies exhaustiveness
    };
}
```

---

# SECTION 3 · GENERICS

> `[MID]` Type parameters, bounds, wildcards  
> `[SENIOR]` Type erasure, PECS, bridge methods, reification

---

## 3.1 Generic Classes and Methods

```java
// Generic class
public class Pair<A, B> {
    private final A first;
    private final B second;

    public Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    public A getFirst()  { return first; }
    public B getSecond() { return second; }

    public <C> Pair<B, C> append(C third) {  // generic method
        return new Pair<>(second, third);
    }

    public static <X, Y> Pair<X, Y> of(X x, Y y) {
        return new Pair<>(x, y);
    }
}

// Bounded type parameters
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}

// Multiple bounds
public <T extends Comparable<T> & Serializable> void process(T item) { }

// Recursive bounds — self-referential generics
public <T extends Comparable<T>> T clamp(T value, T min, T max) {
    if (value.compareTo(min) < 0) return min;
    if (value.compareTo(max) > 0) return max;
    return value;
}
```

---

## 3.2 Wildcards and PECS

```java
/*
 * PECS — Producer Extends, Consumer Super
 * ? extends T — use when you PRODUCE (read) values
 * ? super T   — use when you CONSUME (write) values
 * ?           — use when you do neither
 */

// Producer: read from the collection — use extends
double sumList(List<? extends Number> list) {
    double sum = 0;
    for (Number n : list) sum += n.doubleValue();  // can only read as Number
    return sum;
}
sumList(new ArrayList<Integer>());   // works
sumList(new ArrayList<Double>());    // works

// Consumer: write to the collection — use super
void addNumbers(List<? super Integer> list) {
    list.add(1); list.add(2); list.add(3);  // can write Integer
    // Object o = list.get(0);  // can only read as Object
}
addNumbers(new ArrayList<Integer>());   // works
addNumbers(new ArrayList<Number>());    // works
addNumbers(new ArrayList<Object>());    // works

// Collections.copy — classic PECS example
// public static <T> void copy(List<? super T> dest, List<? extends T> src)

// Unbounded wildcard — read as Object only
void printAll(List<?> list) {
    for (Object o : list) System.out.println(o);
}
```

---

## 3.3 Type Erasure

```java
/*
 * Type erasure: generic type parameters are removed at compile time.
 * At runtime, List<String> and List<Integer> are both just List.
 * Implications:
 * 1. Cannot use instanceof with generic types: obj instanceof List<String> → compile error
 * 2. Cannot create generic arrays: new T[10] → compile error
 * 3. Cannot use primitives as type arguments: List<int> → compile error (use List<Integer>)
 * 4. Cannot catch generic exceptions
 */

// Type erasure in action
List<String>  ls = new ArrayList<>();
List<Integer> li = new ArrayList<>();
ls.getClass() == li.getClass()  // → true — both are ArrayList at runtime

// Workarounds
// 1. Class<T> token for runtime type operations
public class TypeSafeCache<T> {
    private final Class<T> type;
    private final Map<String, Object> cache = new HashMap<>();

    public TypeSafeCache(Class<T> type) { this.type = type; }

    public void put(String key, T value) { cache.put(key, value); }
    public T get(String key) { return type.cast(cache.get(key)); }
}

// 2. TypeToken pattern (Guava / Jackson)
// new TypeReference<List<String>>() {} captures generic type at runtime

// 3. Bridge methods — compiler generates for covariant overrides
class StringList extends ArrayList<String> {
    @Override
    public boolean add(String s) { ... }
    // Compiler generates bridge: boolean add(Object o) { return add((String)o); }
}
```

---

# SECTION 4 · COLLECTIONS FRAMEWORK

> `[JUNIOR]` ArrayList, HashMap, basic usage  
> `[MID]` LinkedHashMap, TreeMap, PriorityQueue, Collections utility  
> `[SENIOR]` ConcurrentHashMap, CopyOnWriteArrayList, complexity trade-offs, implementation internals

---

## 4.1 List Implementations

```java
// ArrayList — dynamic array, O(1) get, O(n) insert/delete middle
List<String> list = new ArrayList<>(initialCapacity); // default 10
list.add("a");
list.add(0, "first");         // O(n) — shifts right
list.remove(0);               // O(n) — shifts left
list.get(2);                  // O(1)
list.set(1, "new");           // O(1)
list.contains("a");           // O(n) linear scan
Collections.sort(list);       // Timsort: O(n log n)
list.subList(1, 3);           // view — changes reflect in original

// LinkedList — doubly linked list, O(1) insert/delete at known position
Deque<String> deque = new LinkedList<>();
deque.addFirst("head");
deque.addLast("tail");
deque.pollFirst();   // remove and return head, or null
deque.peekLast();    // look at tail without removing

// Immutable lists (Java 9+)
List<String> immutable = List.of("a", "b", "c");  // null-hostile, no duplicates
List<String> copy = List.copyOf(existing);         // defensive copy

// Unmodifiable vs Immutable
List<String> unmod = Collections.unmodifiableList(existing);  // view: underlying can change
// List.of() is truly immutable — no changes possible ever
```

---

## 4.2 Map Implementations

```java
// HashMap — hash table, O(1) avg get/put, unordered
// Internal: array of Entry buckets; each bucket is linked list or red-black tree (Java 8+)
// Load factor: default 0.75; resize (×2) when (size > capacity * loadFactor)
// After resize: rehash all entries; TREEIFY_THRESHOLD=8: bucket becomes tree
Map<String, Integer> map = new HashMap<>(16, 0.75f);
map.put("key", 1);
map.getOrDefault("missing", 0);     // → 0
map.putIfAbsent("key", 99);         // only puts if key absent
map.computeIfAbsent("k", k -> k.length()); // compute and store if absent
map.merge("key", 1, Integer::sum);  // merge: add 1 to existing value
map.compute("key", (k, v) -> v == null ? 1 : v + 1);

// Iteration
map.forEach((k, v) -> System.out.println(k + "=" + v));
for (Map.Entry<String, Integer> e : map.entrySet()) {
    System.out.println(e.getKey() + "=" + e.getValue());
}

// LinkedHashMap — preserves insertion order (or access order for LRU)
Map<String, Integer> ordered = new LinkedHashMap<>();
// LRU cache via LinkedHashMap
Map<String, Integer> lruCache = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Integer> eldest) {
        return size() > 100;  // evict when over 100 entries
    }
};

// TreeMap — red-black tree, O(log n) get/put, sorted by key
Map<String, Integer> sorted = new TreeMap<>();        // natural order
Map<String, Integer> byLen  = new TreeMap<>(Comparator.comparingInt(String::length));
sorted.firstKey();   // smallest key
sorted.lastKey();    // largest key
sorted.headMap("k"); // submap with keys < "k"
sorted.tailMap("k"); // submap with keys >= "k"

// EnumMap — array-backed, most efficient map for enum keys
EnumMap<Day, String> schedule = new EnumMap<>(Day.class);
```

---

## 4.3 Set Implementations

```java
// HashSet — backed by HashMap, O(1) avg add/contains/remove
Set<String> set = new HashSet<>();
set.add("a"); set.add("b");
set.contains("a");  // O(1) avg

// LinkedHashSet — insertion-ordered HashSet
Set<String> orderedSet = new LinkedHashSet<>();

// TreeSet — sorted set, O(log n), backed by TreeMap
NavigableSet<Integer> treeSet = new TreeSet<>();
treeSet.floor(5);    // largest element ≤ 5
treeSet.ceiling(5);  // smallest element ≥ 5
treeSet.higher(5);   // strictly greater than 5
treeSet.headSet(5);  // elements < 5
treeSet.subSet(2, true, 8, false); // [2, 8)

// Set operations
Set<String> union = new HashSet<>(set1);
union.addAll(set2);

Set<String> intersection = new HashSet<>(set1);
intersection.retainAll(set2);

Set<String> difference = new HashSet<>(set1);
difference.removeAll(set2);
```

---

## 4.4 Queue and Deque

```java
// Queue — FIFO
Queue<Integer> queue = new LinkedList<>();
queue.offer(1);      // add to tail, returns false if full (vs add() throws)
queue.poll();        // remove head, returns null if empty (vs remove() throws)
queue.peek();        // view head without removing

// ArrayDeque — array-based deque, faster than LinkedList for most use cases
Deque<Integer> deque = new ArrayDeque<>();
deque.offerFirst(1);  // add to front
deque.offerLast(2);   // add to back
deque.pollFirst();    // remove from front
deque.pollLast();     // remove from back
deque.peekFirst();    // view front
deque.peekLast();     // view back

// PriorityQueue — min-heap by default, O(log n) offer/poll, O(1) peek
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<String>  byLen   = new PriorityQueue<>(Comparator.comparingInt(String::length));

minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
minHeap.poll();   // → 1 (minimum)
minHeap.peek();   // → 3 (next minimum, no removal)

// Priority queue with custom objects
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    Comparator.comparingInt(Task::getPriority)
              .thenComparing(Task::getCreatedAt)
);
```

---

## 4.5 Concurrent Collections

> `[SENIOR]` Thread-safe collections without external locking

```java
// ConcurrentHashMap — segment-level locking (Java 8: lock-striping on bins)
// No null keys or values; atomic operations
ConcurrentHashMap<String, Integer> concurrent = new ConcurrentHashMap<>();
concurrent.putIfAbsent("key", 1);
concurrent.computeIfAbsent("key", k -> expensiveCompute(k));
concurrent.merge("count", 1, Integer::sum);  // atomic increment

// CopyOnWriteArrayList — snapshot on write, fast reads, slow writes
// Best for: few writes, many reads; iterate without ConcurrentModificationException
CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>();
cowList.add("listener1");
// iterator sees a frozen snapshot — never throws ConcurrentModificationException

// BlockingQueue — for producer-consumer
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);  // bounded
queue.put(task);         // blocks if full
queue.take();            // blocks if empty
queue.offer(task, 100, TimeUnit.MILLISECONDS); // timeout offer
queue.poll(100, TimeUnit.MILLISECONDS);         // timeout poll

// ArrayBlockingQueue — bounded, array-backed
// LinkedBlockingQueue — optionally bounded, linked-node backed
// PriorityBlockingQueue — unbounded priority queue
// SynchronousQueue — no internal capacity; direct handoff between threads
// DelayQueue — elements available only after their delay expires

// ConcurrentSkipListMap — sorted, concurrent (log n), no locking
ConcurrentSkipListMap<String, Integer> skipMap = new ConcurrentSkipListMap<>();
```

---

# SECTION 5 · FUNCTIONAL PROGRAMMING & STREAMS

> `[MID]` Lambdas, functional interfaces, basic streams  
> `[SENIOR]` Stream internals, spliterators, custom collectors, parallel streams

---

## 5.1 Lambdas and Functional Interfaces

```java
// Built-in functional interfaces (java.util.function)
Function<String, Integer> strLen = String::length;     // T → R
Function<String, String>  upper  = String::toUpperCase;
Function<String, String>  composed = upper.andThen(s -> s + "!");
composed.apply("hello");  // → "HELLO!"

Consumer<String>  printer = System.out::println;       // T → void
Supplier<String>  hello   = () -> "Hello";             // () → T
Predicate<String> nonEmpty = s -> !s.isEmpty();        // T → boolean
BiFunction<String, Integer, String> repeat = (s, n) -> s.repeat(n);

// Predicate composition
Predicate<String> startsWithA = s -> s.startsWith("A");
Predicate<String> longerThan3 = s -> s.length() > 3;
Predicate<String> combined = startsWithA.and(longerThan3);
Predicate<String> either   = startsWithA.or(longerThan3);
Predicate<String> notA     = startsWithA.negate();

// Method references
// Static:           ClassName::staticMethod
// Instance (bound): instance::instanceMethod
// Instance (unbound): ClassName::instanceMethod
// Constructor:      ClassName::new

Function<String, Integer> parse  = Integer::parseInt;    // static
Consumer<String>          print  = System.out::println;  // instance (bound)
Function<String, Integer> length = String::length;       // instance (unbound)
Supplier<ArrayList<String>> maker = ArrayList::new;      // constructor

// UnaryOperator, BinaryOperator — specializations
UnaryOperator<String>   trim    = String::trim;
BinaryOperator<Integer> add     = Integer::sum;
IntUnaryOperator        square  = x -> x * x;  // primitive specializations avoid boxing
```

---

## 5.2 Stream API

```java
import java.util.stream.*;

List<String> names = List.of("Alice", "Bob", "Charlie", "Dave", "Anna");

// Pipeline: source → intermediate ops (lazy) → terminal op (triggers evaluation)
List<String> result = names.stream()
    .filter(s -> s.startsWith("A"))    // intermediate — lazy
    .map(String::toUpperCase)           // intermediate — lazy
    .sorted()                           // intermediate — lazy, stateful
    .limit(5)                           // intermediate — short-circuit
    .collect(Collectors.toList());      // terminal — triggers pipeline

// Creating streams
Stream.of("a", "b", "c")
Stream.empty()
Arrays.stream(array)
collection.stream()
collection.parallelStream()
Stream.iterate(0, n -> n + 1)          // infinite: 0, 1, 2, ...
Stream.iterate(0, n -> n < 100, n -> n + 1)  // Java 9+: with predicate
Stream.generate(Math::random)           // infinite supplier
IntStream.range(0, 10)                  // 0 to 9
IntStream.rangeClosed(1, 10)            // 1 to 10

// Terminal operations
long count       = stream.count();
Optional<String> first = stream.findFirst();
Optional<String> any   = stream.findAny();   // better for parallel
boolean allMatch = stream.allMatch(p);
boolean anyMatch = stream.anyMatch(p);
boolean noneMatch = stream.noneMatch(p);
Optional<String> min = stream.min(Comparator.naturalOrder());
Optional<String> max = stream.max(Comparator.naturalOrder());
String[] arr = stream.toArray(String[]::new);
String joined = stream.collect(Collectors.joining(", ", "[", "]"));

// Reduction
int sum = IntStream.rangeClosed(1, 100).sum();
OptionalInt max2 = IntStream.of(1,2,3).max();
int product = Stream.of(1,2,3,4,5).reduce(1, (a,b) -> a*b);

// Collectors
Map<Boolean, List<String>> partitioned =
    names.stream().collect(Collectors.partitioningBy(s -> s.length() > 3));

Map<Integer, List<String>> grouped =
    names.stream().collect(Collectors.groupingBy(String::length));

Map<Integer, Long> countByLength =
    names.stream().collect(Collectors.groupingBy(String::length, Collectors.counting()));

Map<String, Integer> toMap =
    names.stream().collect(Collectors.toMap(s -> s, String::length));

// flatMap — flatten nested streams
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4));
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());

// Collector.toUnmodifiableList() (Java 10+)
List<String> immutable = names.stream()
    .filter(s -> s.length() > 3)
    .collect(Collectors.toUnmodifiableList());
```

---

## 5.3 Optional

```java
// Optional — container for potentially null value; forces explicit null handling
Optional<String> opt = Optional.of("value");       // throws NPE if null
Optional<String> nullable = Optional.ofNullable(s); // wraps null safely
Optional<String> empty = Optional.empty();

// Usage
opt.isPresent()         // → true
opt.isEmpty()           // Java 11+: true if empty
opt.get()               // throws NoSuchElementException if empty — avoid
opt.orElse("default")   // return value or default
opt.orElseGet(() -> computeDefault())   // lazy default
opt.orElseThrow(IllegalStateException::new)  // throw if empty
opt.ifPresent(System.out::println)      // consume if present
opt.ifPresentOrElse(System.out::println, () -> System.out.println("empty")); // Java 9+

// Transforming
opt.map(String::toUpperCase)    // → Optional<String>
opt.flatMap(s -> findUser(s))   // → Optional<User> (avoids Optional<Optional<User>>)
opt.filter(s -> s.length() > 3)

// Common antipattern — avoid:
if (opt.isPresent()) { use(opt.get()); }  // bad: use ifPresent or map instead

// Recommended pattern
String result = findUser(id)
    .map(User::getEmail)
    .filter(email -> email.contains("@"))
    .orElse("no-reply@example.com");
```

---

## 5.4 Parallel Streams

> `[SENIOR]` When to use, pitfalls, ForkJoinPool

```java
// Parallel stream — uses ForkJoinPool.commonPool() by default
long count = LongStream.rangeClosed(1, 1_000_000)
    .parallel()
    .filter(n -> isPrime(n))
    .count();

// When parallel is beneficial:
// ✓ Large data sets (>10,000 elements typically)
// ✓ CPU-bound, stateless operations
// ✓ SIZED source (ArrayList, array) — not LinkedList
// ✓ Operations that don't require ordering

// When parallel hurts:
// ✗ Small datasets (overhead > gain)
// ✗ I/O-bound operations (thread starvation in commonPool)
// ✗ Stateful lambdas with shared mutable state
// ✗ Operations requiring ordering (forEachOrdered, findFirst — synchronization overhead)

// Custom ForkJoinPool (avoids polluting commonPool)
ForkJoinPool pool = new ForkJoinPool(4);
List<Integer> result = pool.submit(() ->
    list.parallelStream()
        .filter(n -> n % 2 == 0)
        .collect(Collectors.toList())
).get();
pool.shutdown();

// Thread-safe collectors
// Collectors.toList() is safe for parallel
// Custom collectors must be concurrent-safe

// Spliterator — parallel stream splitting strategy
// ArrayList: O(1) split by index — excellent parallel performance
// LinkedList: O(n) split — poor parallel performance
```

---

# SECTION 6 · EXCEPTIONS AND ERROR HANDLING

> `[JUNIOR]` try/catch/finally, checked vs unchecked  
> `[MID]` Custom exceptions, exception chaining, multi-catch  
> `[SENIOR]` Exception design, performance, checked exception controversy

---

## 6.1 Exception Hierarchy

```
Throwable
├── Error (unchecked — JVM-level, don't catch)
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── AssertionError
└── Exception
    ├── RuntimeException (unchecked — programming errors)
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   ├── IllegalStateException
    │   ├── IndexOutOfBoundsException
    │   ├── UnsupportedOperationException
    │   ├── ClassCastException
    │   ├── ArithmeticException
    │   └── ConcurrentModificationException
    └── (checked — must declare or handle)
        ├── IOException
        │   ├── FileNotFoundException
        │   └── SocketException
        ├── SQLException
        ├── ParseException
        └── InterruptedException
```

---

## 6.2 Exception Handling Patterns

```java
// Multi-catch (Java 7+)
try {
    process();
} catch (IOException | SQLException e) {
    log.error("Data error", e);
    throw new DataException("Processing failed", e);  // exception chaining
}

// try-with-resources — AutoCloseable resources
try (Connection conn = dataSource.getConnection();
     PreparedStatement stmt = conn.prepareStatement(SQL)) {
    // both closed in reverse order even if exceptions thrown
    return stmt.executeQuery();
} catch (SQLException e) {
    throw new RepositoryException("Query failed", e);
}

// Custom exception hierarchy
public class AppException extends RuntimeException {
    private final ErrorCode code;

    public AppException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public AppException(ErrorCode code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public ErrorCode getCode() { return code; }
}

public class UserNotFoundException extends AppException {
    private final String userId;

    public UserNotFoundException(String userId) {
        super(ErrorCode.USER_NOT_FOUND, "User not found: " + userId);
        this.userId = userId;
    }
    public String getUserId() { return userId; }
}

// Effective exception handling rules
// 1. Never swallow exceptions silently
try { ... } catch (Exception e) { }   // BAD: silent swallow

// 2. Log with full stack trace OR wrap and rethrow — not both
catch (Exception e) {
    log.error("Failed", e);     // log here
    throw new AppException(e);  // OR rethrow (not both — duplicate logs)
}

// 3. Don't use exceptions for flow control
// BAD: try { Integer.parseInt(s); return true; } catch (NumberFormatException e) { return false; }
// GOOD: use a utility method or regex check

// 4. Checked vs unchecked debate
// Checked: forces caller to handle; good for recoverable errors (file not found)
// Unchecked: no boilerplate; good for programming errors (illegal arg, NPE)
// Modern Java favors unchecked; Spring, modern APIs use RuntimeException exclusively
```

---

# SECTION 7 · CONCURRENCY

> `[MID]` Thread creation, synchronized, volatile  
> `[SENIOR]` Java Memory Model, happens-before, Lock, Executor, CompletableFuture, virtual threads

---

## 7.1 Thread Basics

```java
// Creating threads
Thread t1 = new Thread(() -> System.out.println("Running"));
t1.start();   // NOT t1.run() — run() calls on current thread!

// Thread states: NEW → RUNNABLE → BLOCKED/WAITING/TIMED_WAITING → TERMINATED

// Thread lifecycle methods
t1.join();                 // wait for t1 to finish
t1.join(1000);             // wait at most 1 second
Thread.sleep(500);         // sleep current thread (throws InterruptedException)
Thread.yield();            // hint to scheduler to yield CPU
Thread.currentThread();    // reference to current thread
t1.interrupt();            // request interruption
t1.isInterrupted();        // check interrupted flag
Thread.interrupted();      // check AND clear interrupted flag

// Handling interruption
public void doWork() throws InterruptedException {
    while (!Thread.currentThread().isInterrupted()) {
        doUnit();
        Thread.sleep(100);  // throws InterruptedException if interrupted
    }
}

// NEVER swallow InterruptedException without restoring the flag
catch (InterruptedException e) {
    Thread.currentThread().interrupt();  // restore flag
    throw new RuntimeException("Interrupted", e);
}
```

---

## 7.2 Synchronization and Locks

```java
// synchronized — intrinsic lock (monitor)
public class Counter {
    private int count = 0;

    public synchronized void increment() { count++; }  // locks on 'this'
    public synchronized int getCount()   { return count; }

    // synchronized block — more granular
    public void update(int delta) {
        synchronized (this) {
            count += delta;
        }
    }

    // synchronized static method — locks on Class object
    public static synchronized void staticMethod() { }
}

// volatile — visibility guarantee (not atomicity for compound ops)
private volatile boolean running = true;   // all threads see latest value
// running = false is visible to other threads without synchronization
// BUT: running++ is NOT atomic — use AtomicBoolean

// java.util.concurrent.locks
ReentrantLock lock = new ReentrantLock(fair=false);
lock.lock();
try {
    // critical section
} finally {
    lock.unlock();  // ALWAYS unlock in finally
}

// tryLock — non-blocking attempt
if (lock.tryLock(100, TimeUnit.MILLISECONDS)) {
    try { doWork(); } finally { lock.unlock(); }
} else {
    handleTimeout();
}

// ReadWriteLock — multiple readers OR one writer
ReadWriteLock rwLock = new ReentrantReadWriteLock();
Lock readLock  = rwLock.readLock();
Lock writeLock = rwLock.writeLock();

readLock.lock();
try { return data; } finally { readLock.unlock(); }

writeLock.lock();
try { data = newData; } finally { writeLock.unlock(); }

// StampedLock (Java 8+) — optimistic reads
StampedLock sl = new StampedLock();
long stamp = sl.tryOptimisticRead();
double x = this.x; double y = this.y;
if (!sl.validate(stamp)) {  // someone wrote — fall back to read lock
    stamp = sl.readLock();
    try { x = this.x; y = this.y; } finally { sl.unlockRead(stamp); }
}
```

---

## 7.3 Java Memory Model and Happens-Before

> `[SENIOR]` The foundation for correct concurrent code

```java
/*
 * Java Memory Model (JMM): defines when writes by one thread
 * are visible to reads by another thread.
 *
 * Happens-Before (HB) relationships:
 * 1. Program order: each action HB the next action in the same thread
 * 2. Monitor unlock HB subsequent lock of the same monitor
 * 3. volatile write HB subsequent volatile read of the same variable
 * 4. Thread.start() HB any action in the started thread
 * 5. Thread.join() — all actions in thread HB join() returning
 * 6. Transitive: if A HB B and B HB C, then A HB C
 *
 * Without HB, the compiler/CPU can reorder operations:
 * - CPU can reorder independent instructions
 * - Compiler can cache values in registers
 * - Memory hierarchy (L1/L2/L3/RAM) creates visibility delays
 */

// Double-checked locking — ONLY correct with volatile
public class Singleton {
    private static volatile Singleton instance;  // volatile required!

    public static Singleton getInstance() {
        if (instance == null) {                 // first check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {         // second check (with lock)
                    instance = new Singleton(); // volatile write establishes HB
                }
            }
        }
        return instance;
    }
}

// Safe publication via final fields
public class ImmutableHolder {
    public final int x;
    public ImmutableHolder(int x) { this.x = x; }
    // After constructor completes, all threads see correct x
    // This is the JMM guarantee for final fields
}

// Atomics — lock-free, based on CAS (Compare-And-Swap)
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();           // atomic i++
counter.compareAndSet(expected, update); // CAS: set if current == expected

AtomicReference<Node> head = new AtomicReference<>();
AtomicLong timestamp = new AtomicLong(System.currentTimeMillis());

// LongAdder — better than AtomicLong for high-contention counters
LongAdder adder = new LongAdder();
adder.increment();   // striped: each thread updates its own cell
adder.sum();         // sum all cells
```

---

## 7.4 Executor Framework

```java
// ExecutorService — manages thread pool
ExecutorService fixedPool    = Executors.newFixedThreadPool(4);
ExecutorService cachedPool   = Executors.newCachedThreadPool();   // unbounded, 60s keepalive
ExecutorService singleThread = Executors.newSingleThreadExecutor();
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);

// Submit tasks
Future<Integer> future = executor.submit(() -> compute());
future.get();                        // blocking wait
future.get(5, TimeUnit.SECONDS);     // with timeout
future.isDone();
future.cancel(mayInterruptIfRunning);

// invokeAll — submit all, wait for all
List<Callable<Integer>> tasks = List.of(() -> 1, () -> 2, () -> 3);
List<Future<Integer>> futures = executor.invokeAll(tasks);

// invokeAny — submit all, return first successful
Integer first = executor.invokeAny(tasks);

// Proper shutdown
executor.shutdown();                  // no new tasks; let running ones finish
executor.awaitTermination(30, TimeUnit.SECONDS);
executor.shutdownNow();               // interrupt running tasks

// Custom ThreadPoolExecutor
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    4,                               // corePoolSize
    16,                              // maximumPoolSize
    60L, TimeUnit.SECONDS,           // keepAliveTime
    new LinkedBlockingQueue<>(1000), // workQueue
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy() // rejection policy
);
// Rejection policies: AbortPolicy (throws), CallerRunsPolicy, DiscardPolicy, DiscardOldestPolicy

// Scheduled tasks
scheduled.schedule(task, 5, TimeUnit.SECONDS);
scheduled.scheduleAtFixedRate(task, 0, 1, TimeUnit.SECONDS);     // fixed rate
scheduled.scheduleWithFixedDelay(task, 0, 1, TimeUnit.SECONDS);  // fixed delay
```

---

## 7.5 CompletableFuture

```java
// Async computation pipeline
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> fetchUser(userId))            // runs in ForkJoinPool
    .thenApply(user -> user.getEmail())              // transform result (sync)
    .thenApplyAsync(email -> enrich(email), executor) // transform (async, custom pool)
    .thenCompose(email -> sendEmail(email))          // flatMap — returns CF<T>
    .exceptionally(ex -> "fallback@example.com");    // handle exception

// Combining futures
CompletableFuture<User>   userFuture    = fetchUserAsync(id);
CompletableFuture<Order>  orderFuture   = fetchOrderAsync(id);
CompletableFuture<Profile> profileFuture = userFuture.thenCombine(
    orderFuture,
    (user, order) -> buildProfile(user, order)
);

// allOf — wait for all
CompletableFuture<Void> all = CompletableFuture.allOf(cf1, cf2, cf3);
all.thenRun(() -> System.out.println("All done"));

// anyOf — first to complete
CompletableFuture<Object> any = CompletableFuture.anyOf(cf1, cf2, cf3);

// Timeout (Java 9+)
cf.orTimeout(5, TimeUnit.SECONDS)
  .completeOnTimeout("default", 3, TimeUnit.SECONDS)

// whenComplete — runs always, sees result or exception
cf.whenComplete((result, ex) -> {
    if (ex != null) log.error("Failed", ex);
    else log.info("Result: " + result);
});
```

---

## 7.6 Virtual Threads (Java 21)

> `[SENIOR]` Project Loom — lightweight concurrency at scale

```java
/*
 * Virtual threads: JVM-managed lightweight threads (not OS threads)
 * - Millions of virtual threads per JVM (vs thousands of platform threads)
 * - Cheap to create and block (don't consume OS thread while blocked)
 * - JVM mounts/unmounts them on carrier (platform) threads
 * - Best for I/O-bound workloads (HTTP, database, file)
 * - NOT beneficial for CPU-bound work
 */

// Create virtual thread
Thread vt = Thread.ofVirtual().start(() -> doWork());

// Virtual thread per task executor
try (ExecutorService vte = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> futures = IntStream.range(0, 10_000)
        .mapToObj(i -> vte.submit(() -> httpCall(i)))
        .toList();
    // 10,000 concurrent HTTP calls without 10,000 OS threads
}

// Thread.sleep() on virtual thread: mounts off carrier — doesn't block OS thread
// synchronized blocks pinning: if virtual thread blocks inside synchronized,
//   carrier thread is pinned (use ReentrantLock instead in hot paths)

// Structured concurrency (Java 21 preview → 22 API)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<User>   user   = scope.fork(() -> fetchUser(id));
    Future<Orders> orders = scope.fork(() -> fetchOrders(id));
    scope.join().throwIfFailed();
    return new Page(user.resultNow(), orders.resultNow());
}
```

---

# SECTION 8 · JVM INTERNALS

> `[MID]` Class loading, JIT compilation  
> `[SENIOR]` GC algorithms, memory areas, HotSpot internals, JVM tuning

---

## 8.1 JVM Memory Areas

```
JVM Memory Structure:
┌─────────────────────────────────────────────────────────────┐
│  Heap (shared across all threads)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Young Generation                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │   │
│  │  │  Eden    │  │ Survivor │  │ Survivor (To)    │ │   │
│  │  │  Space   │  │ (From)   │  │                  │ │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Old Generation (Tenured)                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────┐  ┌──────────────────────────────┐
│  Metaspace (class meta)  │  │  Code Cache (JIT compiled)   │
└──────────────────────────┘  └──────────────────────────────┘
Per-thread:
┌────────────┐  ┌───────────────┐  ┌─────────────────────────┐
│  JVM Stack │  │  Native Stack │  │  Program Counter (PC)   │
└────────────┘  └───────────────┘  └─────────────────────────┘
```

```
JVM Stack — per thread:
- Stack frames pushed on method call, popped on return
- Each frame: local variables array, operand stack, constant pool reference
- StackOverflowError when stack depth exceeded (recursive calls)

Heap:
- Eden: new objects allocated here (bump pointer allocation in TLAB)
- Minor GC: collects Eden + From Survivor, copies live objects to To Survivor
- Promotion: objects surviving N GC cycles promoted to Old Gen
- Major/Full GC: collects Old Gen (STW — Stop The World)

Metaspace (Java 8+, replaced PermGen):
- Class metadata, method bytecode, constant pools
- Grows dynamically (unlike PermGen which had fixed size)
- OutOfMemoryError if unbounded — set -XX:MaxMetaspaceSize
```

---

## 8.2 Garbage Collection

```
GC Algorithms:

Serial GC (-XX:+UseSerialGC):
- Single-threaded; stop-the-world for both minor and major GC
- Good for: small heaps, single-core, batch jobs

Parallel GC (-XX:+UseParallelGC, default before Java 9):
- Multi-threaded minor and major GC; stop-the-world
- High throughput, longer pauses
- Good for: batch processing, throughput-critical applications

G1GC (-XX:+UseG1GC, default Java 9-20):
- Heap divided into equal-sized regions (~2000 regions)
- Concurrent marking, concurrent evacuation
- Predictable pause goals: -XX:MaxGCPauseMillis=200
- Good for: large heaps (>6GB), latency-sensitive

ZGC (-XX:+UseZGC, production Java 15+):
- Sub-millisecond pause times regardless of heap size
- Concurrent relocation using colored pointers + load barriers
- -XX:+ZGenerational (Java 21+): generational ZGC
- Good for: very large heaps, ultra-low latency

Shenandoah (-XX:+UseShenandoahGC):
- Similar to ZGC — concurrent compaction
- Lower throughput than G1, lower latency
```

```bash
# Common GC flags
-Xms512m                    # initial heap size
-Xmx4g                      # maximum heap size
-XX:+UseG1GC               # use G1 collector
-XX:MaxGCPauseMillis=200    # target max pause (G1)
-XX:G1HeapRegionSize=16m    # G1 region size
-XX:+PrintGCDetails         # GC logging (old style)
-Xlog:gc*:file=gc.log       # GC logging (modern, Java 9+)
-XX:+HeapDumpOnOutOfMemoryError # dump heap on OOM
-XX:HeapDumpPath=/tmp/heap.hprof
```

---

## 8.3 Class Loading

```java
/*
 * Class loading delegation model (parent-first):
 * Bootstrap ClassLoader → Extension/Platform → Application → Custom
 *
 * Bootstrap: loads rt.jar / JDK modules (null parent by convention)
 * Platform:  loads modules (jdk.* packages)
 * Application: loads classpath / module-path
 *
 * Class loading phases:
 * 1. Loading   — find bytecode, create Class object
 * 2. Linking
 *    a. Verification — verify bytecode is valid
 *    b. Preparation  — allocate static fields, set to defaults
 *    c. Resolution   — resolve symbolic references
 * 3. Initialization — run static initializers, assign static field values
 */

// Custom ClassLoader
public class PluginClassLoader extends URLClassLoader {
    public PluginClassLoader(URL[] urls) {
        super(urls, Thread.currentThread().getContextClassLoader());
    }

    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        // Child-first delegation for plugin isolation
        try {
            Class<?> loaded = findLoadedClass(name);
            if (loaded != null) return loaded;
            return findClass(name);  // look in our URLs first
        } catch (ClassNotFoundException e) {
            return super.loadClass(name, resolve);  // fallback to parent
        }
    }
}

// Static initializers — run once when class first loaded
public class Config {
    private static final Map<String, String> DEFAULTS;
    static {
        DEFAULTS = new HashMap<>();
        DEFAULTS.put("timeout", "30");
        DEFAULTS.put("retry", "3");
    }
}
```

---

## 8.4 JIT Compilation

```
HotSpot JIT:
- Tiered compilation (default):
  Level 0: Interpreted
  Level 1: C1 (simple JIT — fast compile, basic opts)
  Level 2: C1 (with counters)
  Level 3: C1 (with profiling)
  Level 4: C2 (aggressive optimization — deoptimize when assumption violated)

Optimizations performed:
- Inlining: replace method calls with method body
- Loop unrolling: expand loop body to reduce branch overhead
- Dead code elimination: remove unreachable code
- Escape analysis: stack-allocate objects that don't escape method
- Lock elision: remove synchronization on non-escaped objects
- Intrinsics: replace method calls with CPU instructions (e.g., Arrays.copyOf → SIMD)
- On-stack replacement (OSR): switch from interpreted to compiled mid-loop

JVM flags for JIT tuning:
-XX:+PrintCompilation            view JIT compilation events
-XX:CompileThreshold=10000       call count before JIT (default)
-XX:+AggressiveOpts              enable experimental optimizations
-Djava.compiler=NONE             disable JIT (interpreter only)
```

---

# SECTION 9 · DESIGN PATTERNS IN JAVA

> `[MID]` GoF patterns with Java idioms  
> `[SENIOR]` Pattern trade-offs, when NOT to use, modern Java alternatives

---

## 9.1 Creational Patterns

```java
// Builder — for objects with many optional fields
public class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final String body;
    private final int timeoutMs;

    private HttpRequest(Builder b) {
        this.method    = Objects.requireNonNull(b.method, "method required");
        this.url       = Objects.requireNonNull(b.url, "url required");
        this.headers   = Collections.unmodifiableMap(new HashMap<>(b.headers));
        this.body      = b.body;
        this.timeoutMs = b.timeoutMs;
    }

    public static class Builder {
        private String method;
        private String url;
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeoutMs = 30_000;

        public Builder method(String method) { this.method = method; return this; }
        public Builder url(String url)       { this.url = url; return this; }
        public Builder header(String k, String v) { headers.put(k, v); return this; }
        public Builder body(String body)     { this.body = body; return this; }
        public Builder timeout(int ms)       { this.timeoutMs = ms; return this; }
        public HttpRequest build()           { return new HttpRequest(this); }
    }
}
HttpRequest req = new HttpRequest.Builder()
    .method("POST").url("https://api.example.com/users")
    .header("Content-Type", "application/json")
    .body("{\"name\":\"Alice\"}").timeout(5000).build();

// Singleton — prefer enum singletons
public enum Registry {
    INSTANCE;
    private final Map<String, Object> store = new ConcurrentHashMap<>();
    public void register(String key, Object value) { store.put(key, value); }
    public Object get(String key) { return store.get(key); }
}

// Factory Method
public interface NotificationSender {
    void send(String message);

    static NotificationSender forChannel(String channel) {
        return switch (channel) {
            case "email" -> new EmailSender();
            case "sms"   -> new SmsSender();
            case "push"  -> new PushSender();
            default -> throw new IllegalArgumentException("Unknown channel: " + channel);
        };
    }
}
```

---

## 9.2 Structural Patterns

```java
// Decorator — add behavior without subclassing
public interface DataSource {
    void write(String data);
    String read();
}

public class FileDataSource implements DataSource {
    private final String filename;
    public FileDataSource(String filename) { this.filename = filename; }
    @Override public void write(String data) { Files.writeString(Path.of(filename), data); }
    @Override public String read() { return Files.readString(Path.of(filename)); }
}

// Abstract decorator
public abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrapped;
    protected DataSourceDecorator(DataSource wrapped) { this.wrapped = wrapped; }
    @Override public void write(String data) { wrapped.write(data); }
    @Override public String read()           { return wrapped.read(); }
}

public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource wrapped) { super(wrapped); }
    @Override public void write(String data) { super.write(encrypt(data)); }
    @Override public String read()           { return decrypt(super.read()); }
}

public class CompressionDecorator extends DataSourceDecorator {
    public CompressionDecorator(DataSource wrapped) { super(wrapped); }
    @Override public void write(String data) { super.write(compress(data)); }
    @Override public String read()           { return decompress(super.read()); }
}

// Stacked: compress then encrypt
DataSource source = new EncryptionDecorator(
    new CompressionDecorator(new FileDataSource("data.txt")));
source.write("sensitive data");

// Proxy — lazy loading, access control, logging
public class LazyServiceProxy implements Service {
    private Service delegate;
    private final Supplier<Service> factory;

    public LazyServiceProxy(Supplier<Service> factory) { this.factory = factory; }

    private Service delegate() {
        if (delegate == null) delegate = factory.get();
        return delegate;
    }

    @Override public String execute(String cmd) { return delegate().execute(cmd); }
}
```

---

## 9.3 Behavioral Patterns

```java
// Strategy — interchangeable algorithms
@FunctionalInterface
public interface SortStrategy<T> {
    void sort(List<T> list, Comparator<T> comparator);
}

SortStrategy<Integer> quickSort  = (list, cmp) -> Collections.sort(list, cmp);
SortStrategy<Integer> bubbleSort = (list, cmp) -> { /* ... */ };

public class DataSorter<T> {
    private SortStrategy<T> strategy = (list, cmp) -> Collections.sort(list, cmp); // default

    public void setStrategy(SortStrategy<T> strategy) { this.strategy = strategy; }
    public void sort(List<T> list, Comparator<T> cmp) { strategy.sort(list, cmp); }
}

// Observer — event-driven with modern Java
public class EventBus {
    private final Map<Class<?>, List<Consumer<Object>>> handlers = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <T> void subscribe(Class<T> type, Consumer<T> handler) {
        handlers.computeIfAbsent(type, k -> new CopyOnWriteArrayList<>())
                .add(e -> handler.accept((T) e));
    }

    public void publish(Object event) {
        List<Consumer<Object>> eventHandlers = handlers.getOrDefault(event.getClass(), List.of());
        eventHandlers.forEach(h -> h.accept(event));
    }
}

// Command — encapsulate operation as object
@FunctionalInterface
public interface Command {
    void execute();

    static Command compose(Command... commands) {
        return () -> { for (Command c : commands) c.execute(); };
    }
}

// Chain of responsibility — request processing pipeline
public abstract class Handler {
    private Handler next;

    public Handler setNext(Handler next) { this.next = next; return next; }

    public boolean handle(Request request) {
        if (next != null) return next.handle(request);
        return false;
    }
}

public class AuthHandler extends Handler {
    @Override
    public boolean handle(Request req) {
        if (!req.hasValidToken()) { req.reject(401); return false; }
        return super.handle(req);
    }
}
```

---

# SECTION 10 · TESTING

> `[MID]` JUnit 5, Mockito, AssertJ  
> `[SENIOR]` Test architecture, test doubles taxonomy, contract testing, mutation testing

---

## 10.1 JUnit 5

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.*;
import org.junit.jupiter.params.provider.*;

@DisplayName("UserService Tests")
class UserServiceTest {

    private UserService service;
    private UserRepository mockRepo;

    @BeforeEach
    void setUp() {
        mockRepo = Mockito.mock(UserRepository.class);
        service = new UserService(mockRepo);
    }

    @AfterEach void tearDown()  { Mockito.reset(mockRepo); }
    @BeforeAll static void initAll() { /* once before all tests */ }
    @AfterAll  static void tearDownAll() { /* once after all tests */ }

    @Test
    @DisplayName("Should return user when found")
    void findUser_WhenExists_ReturnsUser() {
        // Arrange
        User expected = new User("1", "Alice");
        when(mockRepo.findById("1")).thenReturn(Optional.of(expected));

        // Act
        User result = service.findUser("1");

        // Assert
        assertThat(result).isEqualTo(expected);
        verify(mockRepo).findById("1");
    }

    @Test
    void findUser_WhenNotFound_ThrowsException() {
        when(mockRepo.findById(any())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findUser("99"))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("99");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "\t"})
    void createUser_WithBlankName_ThrowsException(String name) {
        assertThatThrownBy(() -> service.createUser(name, "email@test.com"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @CsvSource({ "Alice, alice@test.com", "Bob, bob@test.com" })
    void createUser_ValidInput_ReturnsUser(String name, String email) {
        User user = service.createUser(name, email);
        assertThat(user.getName()).isEqualTo(name);
        assertThat(user.getEmail()).isEqualTo(email);
    }

    @ParameterizedTest
    @MethodSource("provideUserData")
    void processUser_WithVariousInputs(String name, int age, boolean expected) {
        assertThat(service.isEligible(name, age)).isEqualTo(expected);
    }

    static Stream<Arguments> provideUserData() {
        return Stream.of(
            Arguments.of("Alice", 25, true),
            Arguments.of("Bob",   15, false),
            Arguments.of("Carol", 18, true)
        );
    }

    @Test
    @Disabled("Flaky — pending JIRA-123 fix")
    void sometimesFlaky() { }

    @Test
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void shouldCompleteInTime() throws InterruptedException {
        service.processWithTimeout();
    }
}
```

---

## 10.2 Mockito

```java
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

// Creating mocks
UserRepository mockRepo = mock(UserRepository.class);
UserRepository spyRepo  = spy(new RealRepository()); // wrap real object

// Stubbing
when(mockRepo.findById("1")).thenReturn(Optional.of(user));
when(mockRepo.findById(anyString())).thenReturn(Optional.empty());
when(mockRepo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
when(mockRepo.count()).thenReturn(100L).thenReturn(101L); // sequential returns
doThrow(new DataAccessException("DB error")).when(mockRepo).delete(any());
doNothing().when(mockRepo).delete(any());  // for void methods

// Argument matchers
any(User.class)
anyString(), anyInt(), anyList()
eq("exact")           // exact match
argThat(user -> user.getAge() > 18)  // custom matcher
isNull(), isNotNull()

// Verification
verify(mockRepo).findById("1");
verify(mockRepo, times(2)).findById(any());
verify(mockRepo, never()).delete(any());
verify(mockRepo, atLeast(1)).findById(any());
verify(mockRepo, timeout(100)).save(any()); // async verification

// ArgumentCaptor — capture what was passed
ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
verify(mockRepo).save(captor.capture());
User saved = captor.getValue();
assertThat(saved.getName()).isEqualTo("Alice");

// InOrder verification
InOrder inOrder = inOrder(mockRepo, emailService);
inOrder.verify(mockRepo).save(any());
inOrder.verify(emailService).sendWelcome(any());

// @Mock, @InjectMocks with @ExtendWith(MockitoExtension.class)
@ExtendWith(MockitoExtension.class)
class ServiceTest {
    @Mock UserRepository repo;
    @Mock EmailService emailService;
    @InjectMocks UserService service;  // injects above mocks
}
```

---

# SECTION 11 · SPRING FRAMEWORK

> `[MID]` IoC/DI, Spring MVC, Spring Data  
> `[SENIOR]` Application context internals, AOP, transaction management, Boot auto-configuration

---

## 11.1 Dependency Injection and IoC

```java
// Component scanning and bean definition
@Component   // generic Spring component
@Service     // business logic layer (semantic alias for @Component)
@Repository  // data access layer (also translates DB exceptions to Spring exceptions)
@Controller  // MVC controller
@RestController  // @Controller + @ResponseBody

// Bean definition in configuration class
@Configuration
public class AppConfig {

    @Bean
    @Scope("singleton")  // default
    public DataSource dataSource(
            @Value("${db.url}") String url,
            @Value("${db.username}") String username) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        return new HikariDataSource(config);
    }

    @Bean
    @Scope("prototype")  // new instance each time requested
    public HttpClient httpClient() {
        return HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }
}

// Dependency injection — constructor injection preferred
@Service
public class UserService {
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final EventPublisher eventPublisher;

    // Constructor injection: immutable, testable, no @Autowired needed (Spring 4.3+)
    public UserService(UserRepository userRepo,
                       EmailService emailService,
                       EventPublisher eventPublisher) {
        this.userRepo       = userRepo;
        this.emailService   = emailService;
        this.eventPublisher = eventPublisher;
    }
}

// @Qualifier for disambiguation
@Autowired
@Qualifier("primaryDataSource")
private DataSource dataSource;

// @Profile — activate beans for specific environments
@Configuration
@Profile("dev")
public class DevConfig {
    @Bean DataSource dataSource() { return new H2DataSource(); }
}

// @Conditional
@Bean
@ConditionalOnProperty(name = "feature.flag.enabled", havingValue = "true")
public FeatureService featureService() { return new FeatureServiceImpl(); }
```

---

## 11.2 Spring MVC / REST

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<Page<UserDto>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.findUsers(page, size, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable String id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createUser(@Valid @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public UserDto updateUser(@PathVariable String id,
                               @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
    }
}

// Global exception handler
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(UserNotFoundException ex) {
        return new ErrorResponse("USER_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> new FieldError(fe.getField(), fe.getDefaultMessage()))
            .toList();
        return new ValidationErrorResponse("VALIDATION_FAILED", errors);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneral(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception for {}", req.getRequestURI(), ex);
        return new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    }
}
```

---

## 11.3 Spring Data JPA

```java
// Repository interface — Spring Data generates implementation
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    List<User> findByAgeGreaterThan(int age);

    @Query("SELECT u FROM User u WHERE u.status = :status ORDER BY u.createdAt DESC")
    Page<User> findByStatus(@Param("status") UserStatus status, Pageable pageable);

    @Query(value = "SELECT * FROM users WHERE department = ?1", nativeQuery = true)
    List<User> findByDepartmentNative(String department);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.status = :status WHERE u.lastLoginAt < :cutoff")
    int deactivateInactiveUsers(@Param("status") UserStatus status,
                                 @Param("cutoff") LocalDateTime cutoff);

    // Projections — fetch only needed columns
    List<UserSummary> findAllProjectedBy();
}

// Projection interface
interface UserSummary {
    String getId();
    String getName();
    String getEmail();
}

// Entity
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true)
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Version  // optimistic locking
    private Long version;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Order> orders = new ArrayList<>();
}
```

---

## 11.4 Spring Transactions

```java
/*
 * @Transactional — Spring manages begin/commit/rollback
 * Default: rollback on RuntimeException, NOT on checked exceptions
 * Propagation behaviors:
 *   REQUIRED (default) — join existing or create new
 *   REQUIRES_NEW       — always create new (suspend existing)
 *   SUPPORTS           — use existing if present, else non-transactional
 *   MANDATORY          — must exist, throw if none
 *   NOT_SUPPORTED      — suspend existing, run non-transactionally
 *   NEVER              — must NOT exist, throw if present
 *   NESTED             — savepoint within existing transaction
 *
 * Isolation levels:
 *   READ_UNCOMMITTED — dirty reads possible
 *   READ_COMMITTED   — no dirty reads; phantoms/non-repeatable possible (most DBs default)
 *   REPEATABLE_READ  — no dirty reads/non-repeatable; phantoms possible
 *   SERIALIZABLE     — fully isolated; slowest
 */

@Service
@Transactional(readOnly = true)  // default for all methods in this class
public class OrderService {

    @Transactional  // override: readOnly=false for write operations
    public Order createOrder(CreateOrderRequest request) {
        User user = userRepo.findById(request.getUserId())
            .orElseThrow(() -> new UserNotFoundException(request.getUserId()));

        Order order = new Order(user, request.getItems());
        Order saved = orderRepo.save(order);

        eventPublisher.publish(new OrderCreatedEvent(saved.getId()));
        return saved;
    }

    @Transactional(rollbackFor = PaymentException.class) // rollback on checked exception
    public void processPayment(String orderId) throws PaymentException {
        // ...
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void auditLog(String action) {
        // runs in its own transaction — committed even if outer tx rolls back
        auditRepo.save(new AuditLog(action, LocalDateTime.now()));
    }
}

// Self-invocation problem: @Transactional has no effect when called from same class
// Solution: inject self, use AspectJ weaving, or refactor to separate class
```

---

# SECTION 12 · JAVA MODULES (JPMS — Java 9+)

> `[SENIOR]` Module system, strong encapsulation, dependency management at module level

---

## 12.1 Module Declarations

```java
// module-info.java — root of module source
module com.example.myapp {
    // Declare dependencies
    requires java.base;           // implicit — always included
    requires java.sql;
    requires java.logging;
    requires transitive java.xml; // transitive: consumers of myapp also get java.xml

    // Export packages (strong encapsulation — only exported packages are accessible)
    exports com.example.myapp.api;
    exports com.example.myapp.model;

    // Export only to specific modules (qualified export)
    exports com.example.myapp.internal to com.example.tests;

    // Open for reflection (e.g., Spring DI, Jackson, JPA)
    opens com.example.myapp.entities to hibernate.core, com.fasterxml.jackson.databind;

    // Provide and use services (ServiceLoader)
    provides com.example.spi.Parser with com.example.myapp.JsonParser;
    uses com.example.spi.Validator;
}

// Key benefits of modules:
// 1. Strong encapsulation: internal packages not accessible from outside
// 2. Reliable configuration: missing modules = startup error, not runtime ClassNotFoundException
// 3. Reduced attack surface: restricted reflection
// 4. jlink: create custom JRE with only required modules
// 5. Performance: smaller classpath scanning
```

---

# SECTION 13 · I/O AND NIO

> `[MID]` Files API, Paths, streams  
> `[SENIOR]` NIO.2, FileSystem, AsynchronousFileChannel, WatchService

---

## 13.1 Modern File I/O (NIO.2)

```java
import java.nio.file.*;

Path path = Path.of("/data/config.json");          // Java 11+
Path path2 = Paths.get("/data", "config.json");    // Java 7+

// Reading
String content   = Files.readString(path);          // Java 11+
List<String> lines = Files.readAllLines(path, UTF_8);
byte[] bytes     = Files.readAllBytes(path);
Stream<String> lineStream = Files.lines(path);      // lazy, must close

// Writing
Files.writeString(path, content);                    // Java 11+
Files.write(path, bytes);
Files.write(path, lines, StandardOpenOption.APPEND);

// Copying/moving
Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING);
Files.move(src, dst, StandardCopyOption.ATOMIC_MOVE);

// Directory operations
Files.createDirectories(path);  // creates all parents
Files.delete(path);             // throws if not found
Files.deleteIfExists(path);
Files.exists(path);
Files.isDirectory(path);
Files.size(path);
Files.getLastModifiedTime(path);

// Walk directory
Files.walk(dirPath)
     .filter(Files::isRegularFile)
     .filter(p -> p.toString().endsWith(".java"))
     .forEach(System.out::println);

// Find matching files
Files.find(dirPath, maxDepth,
    (p, attr) -> attr.isRegularFile() && p.toString().endsWith(".log"))
    .forEach(p -> processLog(p));

// WatchService — monitor filesystem changes
WatchService watcher = FileSystems.getDefault().newWatchService();
dirPath.register(watcher, ENTRY_CREATE, ENTRY_MODIFY, ENTRY_DELETE);

WatchKey key;
while ((key = watcher.take()) != null) {
    for (WatchEvent<?> event : key.pollEvents()) {
        Path changed = dirPath.resolve((Path) event.context());
        System.out.println(event.kind() + " " + changed);
    }
    key.reset();
}
```

---

# SECTION 14 · PERFORMANCE OPTIMIZATION

> `[SENIOR]` JVM profiling, GC tuning, allocation reduction, benchmarking

---

## 14.1 Profiling and Benchmarking

```java
// JMH — Java Microbenchmark Harness (the only correct way to benchmark Java)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@Fork(2)
public class StringConcatBenchmark {

    @Param({"10", "100", "1000"})
    int size;

    String[] data;

    @Setup
    public void setup() {
        data = new String[size];
        Arrays.fill(data, "hello");
    }

    @Benchmark
    public String stringPlus() {
        String result = "";
        for (String s : data) result += s;
        return result;
    }

    @Benchmark
    public String stringBuilder() {
        StringBuilder sb = new StringBuilder();
        for (String s : data) sb.append(s);
        return sb.toString();
    }

    @Benchmark
    public String streamJoin() {
        return String.join("", data);
    }
}
// Run: java -jar benchmarks.jar -rf json

// Profiling tools
// JFR (Java Flight Recorder) — built-in, low overhead (~1-2%)
jcmd <pid> JFR.start duration=60s filename=recording.jfr
// Or: -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=app.jfr

// Async-profiler — sampling profiler, CPU + allocation + locks
// ./profiler.sh -d 30 -f flame.html <pid>

// JVisualVM — GUI profiler (included in JDK)
// IntelliJ Profiler — integrated CPU + allocation profiling
```

---

## 14.2 Common Performance Patterns

```java
// 1. Avoid unnecessary object creation in hot paths
// BAD: creates new String[] every call
void process() { sort(new String[]{"c","a","b"}); }

// GOOD: reuse or use primitives
private static final int[] SIZES = {10, 20, 30};

// 2. String concatenation in loops
// BAD: O(n²)
String result = "";
for (String s : items) result += s + ",";

// GOOD: O(n)
String result = String.join(",", items);

// 3. Collections pre-sizing
// BAD: multiple resizes
List<String> list = new ArrayList<>();
for (int i = 0; i < 10000; i++) list.add(process(i));

// GOOD: one allocation
List<String> list = new ArrayList<>(10000);

// 4. Lazy initialization for expensive resources
private volatile Service service;
public Service getService() {
    if (service == null) {
        synchronized (this) {
            if (service == null) service = new ExpensiveService();
        }
    }
    return service;
}

// 5. Use primitive streams for numeric work (avoid boxing)
int[] ints = {1, 2, 3, 4, 5};
int sum = IntStream.of(ints).sum();  // no Integer boxing
// vs Stream.of(ints) which would need Stream<int[]>

// 6. Iterable vs iterator vs indexed loop
// For ArrayList: indexed loop ≈ iterator (both fast)
// For LinkedList: indexed loop O(n²) — always use iterator/for-each

// 7. intern() for frequently compared strings
String key = readFromDb().intern();  // pooled, allows == comparison

// 8. Object pooling for expensive-to-create objects
// Apache Commons Pool, or manual
Queue<Connection> pool = new ConcurrentLinkedQueue<>();
Connection conn = pool.poll();
if (conn == null) conn = createConnection();
try { use(conn); } finally { pool.offer(conn); }  // return to pool
```

---

# SECTION 15 · SECURITY IN JAVA

> `[MID]` Common vulnerabilities, secure coding  
> `[SENIOR]` Cryptography API, secure defaults, OWASP Java

---

## 15.1 Secure Coding Patterns

```java
// 1. SQL Injection — ALWAYS use PreparedStatement
// VULNERABLE:
String sql = "SELECT * FROM users WHERE name = '" + name + "'";
stmt.execute(sql);  // NEVER

// SAFE:
PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users WHERE name = ?");
pstmt.setString(1, name);

// 2. Secure random — use java.security.SecureRandom, never java.util.Random for security
SecureRandom sr = new SecureRandom();
byte[] token = new byte[32];
sr.nextBytes(token);
String tokenHex = HexFormat.of().formatHex(token);  // Java 17+

// 3. Password hashing — use slow hash functions
// Never: MD5, SHA-1, even SHA-256 for passwords (too fast)
// Use: BCrypt, Argon2, SCrypt via libraries
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12); // cost=12
String hash = encoder.encode(rawPassword);
encoder.matches(rawPassword, hash);  // constant-time comparison

// 4. MessageDigest for non-password hashing
MessageDigest md = MessageDigest.getInstance("SHA-256");
byte[] digest = md.digest(data.getBytes(StandardCharsets.UTF_8));

// 5. HMAC — message authentication
Mac mac = Mac.getInstance("HmacSHA256");
SecretKeySpec key = new SecretKeySpec(keyBytes, "HmacSHA256");
mac.init(key);
byte[] signature = mac.doFinal(message);
// Constant-time comparison (prevent timing attacks):
MessageDigest.isEqual(expected, signature);

// 6. AES Encryption
SecretKey aesKey = KeyGenerator.getInstance("AES").generateKey();
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");  // GCM: authenticated encryption
GCMParameterSpec parameterSpec = new GCMParameterSpec(128, iv);  // 128-bit auth tag
cipher.init(Cipher.ENCRYPT_MODE, aesKey, parameterSpec);
byte[] ciphertext = cipher.doFinal(plaintext);

// 7. Input validation
// Whitelist approach
private static final Pattern SAFE_FILENAME = Pattern.compile("^[a-zA-Z0-9_.-]{1,255}$");
if (!SAFE_FILENAME.matcher(filename).matches())
    throw new IllegalArgumentException("Invalid filename");

// Path traversal prevention
Path safePath = Path.of(baseDir).resolve(userInput).normalize().toAbsolutePath();
if (!safePath.startsWith(Path.of(baseDir).toAbsolutePath()))
    throw new SecurityException("Path traversal detected");

// 8. XXE (XML External Entity) prevention
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

---

# SECTION 16 · ARCHITECTURAL PATTERNS IN JAVA

> `[SENIOR]` Hexagonal architecture, event sourcing, CQRS, microservices patterns

---

## 16.1 Hexagonal Architecture (Ports and Adapters)

```java
// Domain — pure Java, no framework dependencies
public class Order {
    private final OrderId id;
    private final CustomerId customerId;
    private final List<OrderItem> items;
    private OrderStatus status;

    public Order(CustomerId customerId, List<OrderItem> items) {
        this.id = OrderId.generate();
        this.customerId = customerId;
        this.items = new ArrayList<>(items);
        this.status = OrderStatus.PENDING;
        validate();
    }

    private void validate() {
        if (items.isEmpty()) throw new DomainException("Order must have at least one item");
    }

    public void confirm() {
        if (status != OrderStatus.PENDING) throw new DomainException("Can only confirm pending orders");
        this.status = OrderStatus.CONFIRMED;
    }

    public Money total() {
        return items.stream().map(OrderItem::subtotal).reduce(Money.ZERO, Money::add);
    }
}

// Port (inbound — use case interface)
public interface PlaceOrderUseCase {
    OrderId placeOrder(PlaceOrderCommand command);
}

// Port (outbound — repository interface)
public interface OrderRepository {
    void save(Order order);
    Optional<Order> findById(OrderId id);
}

// Application service (implements inbound port, uses outbound ports)
@UseCase
public class PlaceOrderService implements PlaceOrderUseCase {
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final DomainEventPublisher eventPublisher;

    public PlaceOrderService(OrderRepository orderRepo,
                              CustomerRepository customerRepo,
                              DomainEventPublisher eventPublisher) {
        this.orderRepository    = orderRepo;
        this.customerRepository = customerRepo;
        this.eventPublisher     = eventPublisher;
    }

    @Override
    @Transactional
    public OrderId placeOrder(PlaceOrderCommand cmd) {
        Customer customer = customerRepository.findById(cmd.getCustomerId())
            .orElseThrow(() -> new CustomerNotFoundException(cmd.getCustomerId()));
        customer.ensureCanPlaceOrder();

        Order order = new Order(customer.getId(), cmd.getItems());
        orderRepository.save(order);
        eventPublisher.publish(new OrderPlacedEvent(order.getId(), customer.getId()));
        return order.getId();
    }
}

// Adapter (inbound — REST adapter)
@RestController
public class OrderController {
    private final PlaceOrderUseCase placeOrderUseCase;

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody PlaceOrderRequest req) {
        PlaceOrderCommand cmd = PlaceOrderRequestMapper.toCommand(req);
        OrderId orderId = placeOrderUseCase.placeOrder(cmd);
        return ResponseEntity.created(URI.create("/orders/" + orderId)).body(new OrderResponse(orderId));
    }
}

// Adapter (outbound — JPA adapter)
@Repository
public class JpaOrderRepository implements OrderRepository {
    private final OrderJpaRepo jpaRepo;
    private final OrderMapper mapper;

    @Override public void save(Order order) {
        jpaRepo.save(mapper.toEntity(order));
    }

    @Override public Optional<Order> findById(OrderId id) {
        return jpaRepo.findById(id.getValue()).map(mapper::toDomain);
    }
}
```

---

## 16.2 CQRS and Event Sourcing

```java
// Command — mutates state
public record PlaceOrderCommand(CustomerId customerId, List<OrderItem> items) {}
public record CancelOrderCommand(OrderId orderId, String reason) {}

// Query — reads state, no mutation
public record GetOrderQuery(OrderId orderId) {}
public record GetCustomerOrdersQuery(CustomerId customerId, int page, int size) {}

// Command handler — write side
@CommandHandler
public class OrderCommandHandler {
    @HandleCommand
    public OrderId handle(PlaceOrderCommand cmd) {
        Order order = new Order(cmd.customerId(), cmd.items());
        eventStore.append(order.getId(), order.drainEvents());
        return order.getId();
    }
}

// Event Sourcing — store events, not current state
@Entity
public class OrderAggregate {
    private OrderId id;
    private OrderStatus status;
    private List<OrderItem> items;
    private long version;

    // Apply events to rebuild state
    public void apply(OrderPlacedEvent event) {
        this.id     = event.orderId();
        this.items  = event.items();
        this.status = OrderStatus.PENDING;
    }

    public void apply(OrderConfirmedEvent event) {
        this.status = OrderStatus.CONFIRMED;
    }

    // Rebuild from event stream
    public static OrderAggregate reconstitute(List<DomainEvent> events) {
        OrderAggregate order = new OrderAggregate();
        for (DomainEvent event : events)
            order.apply(event);
        return order;
    }
}

// Read model (query side) — projection
@EventListener
public class OrderSummaryProjection {
    private final OrderSummaryRepository readRepo;

    @TransactionalEventListener(phase = AFTER_COMMIT)
    public void on(OrderPlacedEvent event) {
        readRepo.save(new OrderSummary(
            event.orderId(), event.customerId(), event.total(), OrderStatus.PENDING));
    }

    @TransactionalEventListener(phase = AFTER_COMMIT)
    public void on(OrderConfirmedEvent event) {
        readRepo.updateStatus(event.orderId(), OrderStatus.CONFIRMED);
    }
}
```

---

# APPENDIX A — QUICK REFERENCE: TALENT SIGNALS BY LEVEL

---

## Junior-Level Signals

```
POSITIVE SIGNALS (Junior):
✓ Understands primitive vs reference types, knows Integer cache gotcha
✓ Uses .equals() for String/Object comparison (never ==)
✓ Knows difference between ArrayList and LinkedList (and when to use each)
✓ Handles checked exceptions correctly (doesn't swallow silently)
✓ Understands null — checks before dereferencing
✓ Uses StringBuilder for string concatenation in loops
✓ Overrides equals() AND hashCode() together
✓ Understands access modifiers (private, protected, public, package)
✓ Knows what final means on classes, methods, variables

RED FLAGS (Junior):
✗ Uses == to compare Strings
✗ Ignores exception messages (catch(Exception e) { })
✗ Doesn't know difference between List.add() and add(index, element)
✗ Forgets to call super() in constructor
✗ Thinks HashMap is sorted
✗ Doesn't know what NullPointerException means
✗ Uses raw types (List instead of List<String>)
✗ Doesn't understand that arrays have fixed size
```

---

## Mid-Level Signals

```
POSITIVE SIGNALS (Mid):
✓ Knows HashMap internals — hash, bucket, load factor, treeification
✓ Understands generics and PECS (Producer Extends, Consumer Super)
✓ Uses streams fluently — knows when to use flatMap vs map
✓ Understands volatile — knows it's visibility, not atomicity
✓ Knows synchronized vs Lock, when to use each
✓ Can explain difference between Comparable and Comparator
✓ Designs with interfaces — depends on abstractions
✓ Knows difference between checked and unchecked exceptions
✓ Uses Optional correctly — never optional.get() without check
✓ Understands @Transactional propagation and rollback behavior
✓ Knows why you should use constructor injection in Spring

RED FLAGS (Mid):
✗ Doesn't know what type erasure means
✗ Uses Collections.synchronizedList and thinks it's fully thread-safe for compound ops
✗ Writes mutable Singletons (global state)
✗ Can't explain the N+1 query problem
✗ Uses Thread.stop() or Thread.suspend() (deprecated for reason)
✗ Calls wait()/notify() without understanding the monitor protocol
✗ Doesn't understand that parallel streams can be slower for small lists
```

---

## Senior-Level Signals

```
POSITIVE SIGNALS (Senior):
✓ Explains Java Memory Model and happens-before relationships
✓ Understands G1 vs ZGC trade-offs for different workloads
✓ Can tune JVM flags: heap sizes, GC algorithm, thread pool
✓ Knows escape analysis and when JVM stack-allocates objects
✓ Designs with virtual threads correctly (knows pinning, structured concurrency)
✓ Understands double-checked locking requires volatile (and why)
✓ Can explain ForkJoinPool work-stealing algorithm
✓ Knows tiered compilation and JIT inlining heuristics
✓ Designs hexagonal architecture — domain independent of frameworks
✓ Explains CQRS and event sourcing trade-offs (consistency, complexity)
✓ Understands @Transactional self-invocation problem
✓ Uses JMH for benchmarking (not System.currentTimeMillis())
✓ Knows ConcurrentHashMap's compute() methods are atomic
✓ Understands ABA problem in lock-free algorithms
✓ Knows the difference between liveness (progress) and safety (correctness)

RED FLAGS (Senior):
✗ Uses synchronized everywhere without considering contention
✗ Can't explain why double-checked locking without volatile is broken
✗ Recommends premature microservice decomposition
✗ Doesn't understand class loader isolation (e.g., in OSGi, servlet containers)
✗ Uses Object.finalize() for cleanup (deprecated, unpredictable)
✗ Doesn't know what JFR is or how to use it
✗ Thinks more threads = more throughput (ignores Amdahl's Law)
✗ Ignores the JVM's JIT warmup in benchmarks
✗ Designs anemic domain model — puts all logic in services
✗ Can't explain why G1 pauses increase with heap fragmentation
```

---

# APPENDIX B — JAVA VERSION FEATURE MATRIX

| Version | Key Features |
|---------|-------------|
| **Java 8** | Lambdas, Stream API, Optional, default/static interface methods, `java.time` (JSR-310), CompletableFuture improvements, Nashorn JS engine, method references, Collectors |
| **Java 9** | Module system (JPMS), JShell REPL, `List.of()`/`Map.of()`/`Set.of()`, `Stream.takeWhile`/`dropWhile`/`iterate`, `Optional.stream()`, `Process API`, reactive streams (Flow API) |
| **Java 10** | `var` (local variable type inference), `List.copyOf`, `Collectors.toUnmodifiable*`, performance improvements (G1 parallel full GC) |
| **Java 11** | `String::strip`, `isBlank`, `lines`, `repeat`, `Files.readString`/`writeString`, HTTP Client standardized, `var` in lambda, running single-file programs |
| **Java 14** | Switch expressions (standard), records (preview), pattern matching instanceof (preview), helpful NPE messages |
| **Java 15** | Text blocks (standard), sealed classes (preview), ZGC production-ready |
| **Java 16** | Records (standard), pattern matching instanceof (standard), Stream.toList(), Vector API incubator |
| **Java 17** | Sealed classes (standard), pattern matching switch (preview), JEP 356 (enhanced pseudo-random), strong encapsulation of JDK internals (LTS) |
| **Java 19** | Virtual threads (preview), structured concurrency (incubator), record patterns (preview) |
| **Java 21** | Virtual threads (standard), structured concurrency (preview), record patterns, pattern matching switch (standard), sequenced collections, String templates (preview), unnamed classes (preview) (LTS) |
| **Java 22** | Unnamed variables (`_`), statements before `super()`, Stream gatherers (preview) |
| **Java 23** | Primitive types in patterns, module imports, flexible constructor bodies |

---

# APPENDIX C — COLLECTIONS COMPLEXITY CHEAT SHEET

| Collection | get | add | remove | contains | Notes |
|------------|-----|-----|--------|----------|-------|
| `ArrayList` | O(1) | O(1)* | O(n) | O(n) | *amortized; tail ops fast |
| `LinkedList` | O(n) | O(1) | O(1)† | O(n) | †at known position |
| `ArrayDeque` | O(1) | O(1)* | O(1)* | O(n) | Fast stack/queue |
| `HashMap` | O(1) | O(1) | O(1) | O(1) | avg; O(n) worst |
| `LinkedHashMap` | O(1) | O(1) | O(1) | O(1) | insertion order |
| `TreeMap` | O(log n) | O(log n) | O(log n) | O(log n) | sorted |
| `HashSet` | — | O(1) | O(1) | O(1) | backed by HashMap |
| `TreeSet` | — | O(log n) | O(log n) | O(log n) | sorted |
| `PriorityQueue` | O(1) peek | O(log n) | O(log n) | O(n) | min-heap |
| `ConcurrentHashMap` | O(1) | O(1) | O(1) | O(1) | thread-safe |
| `CopyOnWriteArrayList` | O(1) | O(n) | O(n) | O(n) | read-optimized |

---

# APPENDIX D — COMMON INTERVIEW PATTERNS IN JAVA

```java
// Two-pointer technique
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) return new int[]{map.get(complement), i};
        map.put(nums[i], i);
    }
    return new int[]{};
}

// Sliding window
public int maxSumSubarray(int[] nums, int k) {
    int windowSum = 0, maxSum = 0;
    for (int i = 0; i < k; i++) windowSum += nums[i];
    maxSum = windowSum;
    for (int i = k; i < nums.length; i++) {
        windowSum += nums[i] - nums[i - k];
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}

// BFS
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left  != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}

// DFS
public boolean hasPath(Map<Integer, List<Integer>> graph, int src, int dst) {
    Set<Integer> visited = new HashSet<>();
    return dfs(graph, src, dst, visited);
}
private boolean dfs(Map<Integer, List<Integer>> graph, int node, int dst, Set<Integer> visited) {
    if (node == dst) return true;
    visited.add(node);
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor) && dfs(graph, neighbor, dst, visited))
            return true;
    }
    return false;
}

// LRU Cache with LinkedHashMap
public class LRUCache {
    private final int capacity;
    private final LinkedHashMap<Integer, Integer> cache;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new LinkedHashMap<>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
                return size() > capacity;
            }
        };
    }

    public int get(int key) { return cache.getOrDefault(key, -1); }
    public void put(int key, int value) { cache.put(key, value); }
}

// Fibonacci — stream approach
Stream.iterate(new long[]{0, 1}, f -> new long[]{f[1], f[0] + f[1]})
      .limit(10).map(f -> f[0]).forEach(System.out::println);

// Group anagrams
Map<String, List<String>> groupAnagrams(String[] strs) {
    return Arrays.stream(strs)
        .collect(Collectors.groupingBy(s -> {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            return new String(chars);
        }));
}

// Merge intervals
int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, Comparator.comparingInt(a -> a[0]));
    List<int[]> merged = new ArrayList<>();
    for (int[] interval : intervals) {
        if (merged.isEmpty() || merged.get(merged.size()-1)[1] < interval[0]) {
            merged.add(interval);
        } else {
            merged.get(merged.size()-1)[1] = Math.max(merged.get(merged.size()-1)[1], interval[1]);
        }
    }
    return merged.toArray(new int[0][]);
}
```

---

# APPENDIX E — JAVA MEMORY TUNING QUICK REFERENCE

```bash
# Heap sizing
-Xms2g -Xmx8g              # initial and max heap; set equal to avoid resize pauses
-XX:NewRatio=3              # Old:New = 3:1
-XX:SurvivorRatio=8         # Eden:Survivor = 8:1 (per survivor)

# G1GC tuning
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200    # soft target; G1 adjusts heap regions to meet this
-XX:G1HeapRegionSize=16m    # region size (1m-32m, power of 2)
-XX:G1NewSizePercent=20     # min young gen size %
-XX:G1MaxNewSizePercent=60  # max young gen size %
-XX:G1ReservePercent=10     # headroom to reduce promotion failure risk
-XX:ConcGCThreads=4         # concurrent GC threads (separate from STW threads)

# ZGC tuning
-XX:+UseZGC
-XX:+ZGenerational          # Java 21+: generational ZGC
-XX:ZAllocationSpikeTolerance=2.0   # multiplier for allocation spike headroom

# Metaspace
-XX:MetaspaceSize=256m      # initial metaspace size (avoids early GC)
-XX:MaxMetaspaceSize=512m   # cap metaspace to prevent unbounded growth

# GC logging (Java 9+)
-Xlog:gc*:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=5,filesize=20m

# Diagnostics
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heap.hprof
-XX:ErrorFile=/tmp/hs_err.log

# Thread stack
-Xss512k                    # stack size per thread (default 512k-1m)
                            # reduce for apps with thousands of threads

# Compiler
-XX:ReservedCodeCacheSize=256m   # JIT code cache; increase if compiler disabled warning
-XX:+TieredCompilation            # default in Java 8+
```

---

# APPENDIX F — LAMBDA AND STREAM QUICK REFERENCE

```java
// Common Collectors
Collectors.toList()                  // mutable list
Collectors.toUnmodifiableList()      // immutable list (Java 10+)
Collectors.toSet()
Collectors.toMap(keyFn, valueFn)
Collectors.toMap(keyFn, valueFn, mergeFunction)   // handle duplicate keys
Collectors.groupingBy(classifier)
Collectors.groupingBy(classifier, downstream)      // grouping with downstream collector
Collectors.partitioningBy(predicate)               // Map<Boolean, List<T>>
Collectors.counting()
Collectors.summingInt(fn)
Collectors.averagingDouble(fn)
Collectors.joining()
Collectors.joining(delimiter)
Collectors.joining(delimiter, prefix, suffix)
Collectors.toCollection(TreeSet::new)              // into specific collection

// Comparator chaining
Comparator<Person> byAgeAndName = Comparator
    .comparingInt(Person::getAge)
    .thenComparing(Person::getName)
    .reversed();

// Collector for custom grouping
Map<Department, DoubleSummaryStatistics> salaryStats = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.summarizingDouble(Employee::getSalary)
    ));

// Custom Collector
Collector<String, StringBuilder, String> toStringCollector = Collector.of(
    StringBuilder::new,               // supplier
    StringBuilder::append,            // accumulator
    StringBuilder::append,            // combiner (for parallel)
    StringBuilder::toString           // finisher
);

// peek — for debugging (doesn't consume stream)
list.stream()
    .peek(e -> System.out.println("Before filter: " + e))
    .filter(e -> e.length() > 3)
    .peek(e -> System.out.println("After filter: " + e))
    .collect(Collectors.toList());

// Short-circuit operations
anyMatch   // stops at first match
allMatch   // stops at first non-match
findFirst  // stops at first element
limit(n)   // stops after n elements
takeWhile  // Java 9+: stops when predicate false
```

---

*END OF JAVA RAG KNOWLEDGE BASE DOCUMENT*