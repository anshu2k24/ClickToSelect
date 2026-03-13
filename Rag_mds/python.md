# PYTHON — FULL-SPECTRUM RAG KNOWLEDGE BASE

> Structured for AI Interviewer · Three-Level Contextual Model · Junior → Mid → Senior  
> Topics: Core Syntax · Data Structures · OOP · Functional · Async · Concurrency · Memory · CPython Internals · Performance · Architecture · Packaging · Testing · Security · Patterns

---

# SECTION 1 · CORE SYNTAX & LANGUAGE FUNDAMENTALS

> `[JUNIOR]` Basic building blocks — syntax, types, control flow, functions

---

## 1.1 Variables, Binding, and Name Resolution (LEGB)

Python uses dynamic typing. A variable is a name bound to an object, not a typed memory slot. The binding is created by assignment; reassignment rebinds the name. Python's scoping rule is LEGB: **Local → Enclosing → Global → Built-in**.

```python
x = "global"

def outer():
    x = "enclosing"
    def inner():
        # x = "local"   # uncommenting makes inner x local
        print(x)         # reads from enclosing if local absent
    inner()

outer()   # → "enclosing"
print(x)  # → "global"
```

**`global` keyword:** declares intent to reassign a module-level name inside a function. Without it, assignment creates a new local binding.  
**`nonlocal` keyword:** targets the nearest enclosing (non-global) scope. Introduced in Python 3.

```python
counter = 0
def increment():
    global counter
    counter += 1

def make_counter():
    count = 0
    def inc():
        nonlocal count
        count += 1
        return count
    return inc
```

> ⚑ **Mutation vs rebinding:** `lst.append(x)` mutates — no keyword needed. `lst = lst + [x]` rebinds — needs `global`/`nonlocal`.

---

## 1.2 Built-in Data Types — Comprehensive Reference

### Numeric Types

```python
# int — arbitrary precision, no overflow
2**100  # → 1267650600228229401496703205376

# float — IEEE 754 double (64-bit)
0.1 + 0.2  # → 0.30000000000000004  (NOT 0.3)
import sys
sys.float_info.epsilon  # → 2.220446049250313e-16

# complex
z = 3 + 4j
abs(z)   # → 5.0  (Euclidean distance from origin)

# Decimal — arbitrary precision decimal (no float rounding)
from decimal import Decimal, getcontext
getcontext().prec = 50
Decimal("0.1") + Decimal("0.2")  # → Decimal('0.3')

# Fraction — exact rational arithmetic
from fractions import Fraction
Fraction(1, 3) + Fraction(1, 6)  # → Fraction(1, 2)

# bool — subclass of int!
True + True   # → 2
isinstance(True, int)  # → True
```

### Strings

`str` is immutable, Unicode (UTF-8 encoded). Indexing is O(1). Slicing creates a new string. String interning: CPython interns short strings that look like identifiers.

```python
s = "hello world"
s[0]          # → "h"
s[-1]         # → "d"
s[2:7]        # → "llo w"
s[::2]        # → "hlowrd"   (every other char)
s[::-1]       # → "dlrow olleh"  (reverse)

# f-strings (Python 3.6+) — compiled at parse time, fastest
name, val = "pi", 3.14159
f"Value of {name} = {val:.2f}"  # → "Value of pi = 3.14"
f"{val!r}"    # repr()  |  {val!s} = str()  |  {val!a} = ascii()

# Useful string methods
"  hello  ".strip()        # → "hello"
"hello".center(11, "-")    # → "---hello---"
",".join(["a","b","c"])    # → "a,b,c"
"aabba".replace("a","x",2) # → "xxbba"  (max 2 replacements)
"hello world".split()      # → ["hello", "world"]

# String interning
a = "hello"
b = "hello"
a is b  # → True  (interned)
c = "hello world"
d = "hello world"
c is d  # → False  (not interned, has space)
```

### Lists

Mutable, ordered, O(1) append/pop from end, O(n) insert/delete from middle. Internally a dynamic array of pointers (`PyObject*`). Growth factor ~1.125x when resizing.

```python
lst = [1, 2, 3, 4, 5]
lst.append(6)          # O(1) amortized
lst.insert(2, 99)      # O(n) — shifts right
lst.pop()              # O(1) — removes last
lst.pop(0)             # O(n) — removes first → use deque
lst.extend([7, 8])     # O(k) where k = len of added
lst.sort(key=lambda x: -x)   # in-place Timsort O(n log n)
sorted(lst)            # returns new list, original unchanged

# List comprehensions — faster than map/filter in CPython
squares = [x**2 for x in range(10) if x % 2 == 0]

# Nested comprehension
matrix = [[i*j for j in range(1,4)] for i in range(1,4)]

# Unpacking
a, *b, c = [1, 2, 3, 4, 5]  # a=1, b=[2,3,4], c=5
```

### Tuples

Immutable, ordered. Slightly faster than lists (fixed size, less overhead). Used as hashable composite keys in dicts. Named tuples add field access without class overhead.

```python
from collections import namedtuple
Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
p.x, p.y         # → 3, 4
p._asdict()      # → {'x': 3, 'y': 4}

# typing.NamedTuple — supports type hints
from typing import NamedTuple
class Vector(NamedTuple):
    x: float
    y: float
    z: float = 0.0
```

### Dictionaries

Python 3.7+: dicts are ordered (insertion order preserved). Implemented as hash tables. Average O(1) get/set/delete. Hash collision handled by open addressing with probing. Load factor kept below 2/3.

```python
d = {"a": 1, "b": 2, "c": 3}
d.get("z", 0)             # → 0  (default if missing)
d.setdefault("d", 4)      # inserts and returns 4
d.pop("a", None)          # removes "a", returns None if missing

# Dictionary comprehension
sq = {x: x**2 for x in range(5)}

# Merging (Python 3.9+)
d1 = {"a": 1}; d2 = {"b": 2}
merged = d1 | d2            # → {"a": 1, "b": 2}
d1 |= d2                    # in-place merge

# dict unpacking
def func(**kwargs): ...
func(**d1, **d2)

# defaultdict
from collections import defaultdict
dd = defaultdict(list)
dd["key"].append(1)        # no KeyError on missing key

# Counter
from collections import Counter
c = Counter("abracadabra")
c.most_common(3)  # → [('a', 5), ('b', 2), ('r', 2)]
```

### Sets

Unordered, unique elements. Hash table without values. Average O(1) add/discard/lookup. Set operations: union `|`, intersection `&`, difference `-`, symmetric_difference `^`.

```python
s1 = {1, 2, 3, 4}
s2 = {3, 4, 5, 6}
s1 & s2   # → {3, 4}          intersection
s1 | s2   # → {1,2,3,4,5,6}   union
s1 - s2   # → {1, 2}           difference
s1 ^ s2   # → {1, 2, 5, 6}    symmetric difference
s1 <= s2  # subset check
frozenset([1,2,3])  # immutable, hashable, usable as dict key
```

---

## 1.3 Control Flow

```python
# if / elif / else
grade = 85
label = "A" if grade >= 90 else "B" if grade >= 80 else "C"

# for / while
for i, val in enumerate(["a","b","c"], start=1):
    print(i, val)

for k, v in {"x":1,"y":2}.items():
    print(k, "->", v)

# for ... else (runs if loop completes without break)
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            break
    else:
        print(n, "is prime")

# walrus operator := (Python 3.8+)
while chunk := f.read(8192):
    process(chunk)

data = [1, -2, 3, -4, 5]
positives = [y for x in data if (y := abs(x)) > 2]
```

---

## 1.4 Functions — Deep Dive

Functions are first-class objects. They are instances of the `function` type, have `__code__`, `__globals__`, `__defaults__`, `__annotations__` attributes.

```python
# Positional, keyword, default, *args, **kwargs, keyword-only
def func(pos1, pos2, /, normal, *, kw_only, **kwargs):
    # pos1, pos2: positional-only (Python 3.8+, before /)
    # normal: positional or keyword
    # kw_only: keyword-only (after *)
    pass

# Argument unpacking at call site
def add(a, b, c): return a + b + c
add(*[1,2,3])                    # positional unpack
add(**{"a":1,"b":2,"c":3})       # keyword unpack

# Default arg gotcha — mutable default evaluated ONCE at def time
def bad(lst=[]):
    lst.append(1)
    return lst
bad()  # → [1]
bad()  # → [1, 1]  ← BUG! shared across calls

def good(lst=None):
    if lst is None: lst = []
    lst.append(1)
    return lst

# Closures
def make_multiplier(n):
    def multiply(x):
        return x * n    # n captured by reference
    return multiply

double = make_multiplier(2)
double(5)  # → 10

# Late binding in closures — classic bug
funcs = [lambda x: x*i for i in range(5)]
funcs[0](1)  # → 4, NOT 0  (all lambdas see final i=4)

# Fix with default argument
funcs = [lambda x, i=i: x*i for i in range(5)]
funcs[0](1)  # → 0

# functools utilities
from functools import partial, reduce, lru_cache, cache

@lru_cache(maxsize=128)
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

@cache  # Python 3.9+, unbounded cache = functools.lru_cache(maxsize=None)
def expensive(x):
    return x ** 2

add5 = partial(add, b=5)   # partial application
product = reduce(lambda a, b: a*b, [1,2,3,4,5])  # → 120
```

---

## 1.5 Comprehensions and Generators

Generators are lazy iterators. They produce values on demand using `yield`, consuming O(1) memory regardless of sequence length. Generator expressions use `()` instead of `[]`.

```python
# Generator function
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

gen = fibonacci()
[next(gen) for _ in range(8)]  # → [0,1,1,2,3,5,8,13]

# Generator expression
total = sum(x**2 for x in range(1000000))  # O(1) memory

# yield from — delegating to sub-generator
def chain(*iterables):
    for it in iterables:
        yield from it

list(chain([1,2],[3,4],[5]))  # → [1,2,3,4,5]

# send() — coroutine-style generator
def accumulator():
    total = 0
    while True:
        value = yield total
        if value is None: break
        total += value

acc = accumulator()
next(acc)         # prime the generator (advance to first yield)
acc.send(10)      # → 10
acc.send(20)      # → 30

# itertools — the generator toolkit
import itertools
itertools.chain([1,2],[3,4])          # lazy concatenation
itertools.islice(fibonacci(), 10)     # take first 10
itertools.takewhile(lambda x: x<100, fibonacci())
itertools.groupby(sorted_data, key=lambda x: x["dept"])
itertools.product("AB", repeat=3)    # cartesian product
itertools.combinations([1,2,3,4], 2) # C(4,2)=6 pairs
itertools.permutations([1,2,3])      # 3! = 6
```

---

# SECTION 2 · OBJECT-ORIENTED PROGRAMMING

> `[JUNIOR]` Classes, instances, inheritance  
> `[MID]` Dunder methods, descriptors, metaclasses, MRO  
> `[SENIOR]` Metaclass internals, `__slots__`, object model, descriptor protocol

---

## 2.1 Classes, Instances, and the Object Model

Everything in Python is an object — including classes. A class is an instance of `type` (its metaclass). Instance attribute lookup: `instance.__dict__` → `class.__dict__` → bases (MRO).

```python
class Animal:
    # class variable — shared across all instances
    kingdom = "Animalia"
    _count = 0

    def __init__(self, name: str, sound: str):
        # instance variables — per-object
        self.name = name
        self.sound = sound
        Animal._count += 1

    def speak(self) -> str:
        return f"{self.name} says {self.sound}"

    @classmethod
    def count(cls) -> int:
        return cls._count

    @staticmethod
    def is_animal(obj) -> bool:
        return isinstance(obj, Animal)

    def __repr__(self):
        return f"Animal(name={self.name!r}, sound={self.sound!r})"

    def __str__(self):
        return self.name

dog = Animal("Rex", "woof")
dog.speak()     # → "Rex says woof"
Animal.count()  # → 1
```

---

## 2.2 Inheritance and MRO (C3 Linearization)

Python uses C3 linearization to compute Method Resolution Order for multiple inheritance. The MRO guarantees monotonicity and local precedence order. Use `super()` to delegate — it follows the MRO, not the immediate parent class.

```python
class A:
    def method(self): return "A"

class B(A):
    def method(self): return "B->" + super().method()

class C(A):
    def method(self): return "C->" + super().method()

class D(B, C):
    def method(self): return "D->" + super().method()

D.mro()
# → [D, B, C, A, object]

D().method()
# → "D->B->C->A"  (follows MRO, each super() goes to next in line)

# Mixins — horizontal composition via multiple inheritance
class JSONMixin:
    def to_json(self):
        import json
        return json.dumps(self.__dict__)

class LogMixin:
    def log(self, msg):
        print(f"[{self.__class__.__name__}] {msg}")

class Service(LogMixin, JSONMixin):
    def __init__(self, name):
        self.name = name

svc = Service("auth")
svc.log("started")
svc.to_json()   # → '{"name": "auth"}'
```

---

## 2.3 Dunder Methods (Magic Methods)

Python's data model: objects express behavior by implementing dunder methods. This is duck typing + protocol-based polymorphism. No interfaces needed.

```python
class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    # String representation
    def __repr__(self): return f"Vector({self.x}, {self.y})"
    def __str__(self):  return f"({self.x}, {self.y})"

    # Arithmetic
    def __add__(self, other): return Vector(self.x+other.x, self.y+other.y)
    def __sub__(self, other): return Vector(self.x-other.x, self.y-other.y)
    def __mul__(self, scalar): return Vector(self.x*scalar, self.y*scalar)
    def __rmul__(self, scalar): return self.__mul__(scalar)   # 3 * v
    def __neg__(self): return Vector(-self.x, -self.y)
    def __abs__(self): return (self.x**2 + self.y**2)**0.5

    # Comparison
    def __eq__(self, other): return self.x == other.x and self.y == other.y
    def __lt__(self, other): return abs(self) < abs(other)
    def __hash__(self): return hash((self.x, self.y))  # needed when __eq__ defined

    # Container protocol
    def __len__(self): return 2
    def __getitem__(self, idx): return (self.x, self.y)[idx]
    def __iter__(self): return iter((self.x, self.y))
    def __contains__(self, val): return val in (self.x, self.y)

    # Callable
    def __call__(self, scale): return self * scale

    # Context manager
    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb): return False

    # Boolean
    def __bool__(self): return bool(self.x or self.y)

v = Vector(3, 4)
abs(v)           # → 5.0
2 * v            # → Vector(6, 8)
list(v)          # → [3, 4]
3 in v           # → True
v(2)             # → Vector(6, 8)
```

---

## 2.4 Properties and Descriptors

Descriptors are objects that define `__get__`, `__set__`, `__delete__`. They power properties, classmethods, staticmethods, and slots. A **data descriptor** defines `__set__` (or `__delete__`); **non-data** only defines `__get__`. Lookup order: data descriptors > instance `__dict__` > non-data descriptors.

```python
# property — the canonical data descriptor
class Temperature:
    def __init__(self, celsius=0):
        self._celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("Below absolute zero!")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self._celsius * 9/5 + 32

# Custom descriptor
class ValidatedInt:
    def __set_name__(self, owner, name):
        self.name = name
        self.private = f"_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None: return self
        return getattr(obj, self.private, None)

    def __set__(self, obj, value):
        if not isinstance(value, int):
            raise TypeError(f"{self.name} must be int")
        setattr(obj, self.private, value)

class Config:
    port = ValidatedInt()
    timeout = ValidatedInt()

    def __init__(self, port, timeout):
        self.port = port
        self.timeout = timeout

cfg = Config(8080, 30)
cfg.port = "bad"   # → TypeError
```

---

## 2.5 `__slots__` and Memory Optimization

By default, instances store attributes in a `__dict__` (hash table). `__slots__` replaces `__dict__` with fixed-offset C struct fields, saving ~50-70 bytes per instance and providing faster attribute access.

```python
import sys

class WithDict:
    def __init__(self, x, y):
        self.x, self.y = x, y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x, self.y = x, y

sys.getsizeof(WithDict(1,2))    # ~48 bytes + dict overhead ~240 bytes
sys.getsizeof(WithSlots(1,2))   # ~56 bytes  (no dict)

# Slots with inheritance — parent must also define slots
class Base:
    __slots__ = ("id",)

class Child(Base):
    __slots__ = ("name",)   # inherits id slot, adds name slot
    # if Child omits __slots__, it will have __dict__ anyway

# Caveat: slots break pickle unless __getstate__/__setstate__ defined
# Caveat: multiple inheritance with non-empty __slots__ is tricky
```

---

## 2.6 Metaclasses

> `[SENIOR]` Metaclass internals — class creation pipeline

A metaclass is the class of a class. `type` is the default metaclass. `class MyClass: ...` is syntactic sugar for `MyClass = type('MyClass', (bases,), namespace)`. The metaclass controls `__new__` (creates class object), `__init__` (initializes class), and `__prepare__` (creates namespace dict).

```python
class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self):
        self.connected = False

db1 = Database()
db2 = Database()
db1 is db2  # → True

# Class creation pipeline
class Meta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        # Returns namespace dict. Can return OrderedDict, custom dict.
        print(f"Preparing namespace for {name}")
        return super().__prepare__(name, bases, **kwargs)

    def __new__(mcs, name, bases, namespace, **kwargs):
        print(f"Creating class {name}")
        return super().__new__(mcs, name, bases, namespace)

    def __init__(cls, name, bases, namespace, **kwargs):
        print(f"Initializing class {name}")
        super().__init__(name, bases, namespace)

# __init_subclass__ — lightweight metaclass alternative (Python 3.6+)
class Plugin:
    _registry = {}

    def __init_subclass__(cls, plugin_name=None, **kwargs):
        super().__init_subclass__(**kwargs)
        if plugin_name:
            Plugin._registry[plugin_name] = cls

class AuthPlugin(Plugin, plugin_name="auth"):
    pass

Plugin._registry  # → {"auth": AuthPlugin}
```

---

# SECTION 3 · DECORATORS & CONTEXT MANAGERS

> `[MID]` Decorator patterns, functools, contextlib  
> `[SENIOR]` Decorator factories, class decorators, `__enter__`/`__exit__` protocol

---

## 3.1 Decorator Mechanics

A decorator is a callable that takes a callable and returns a callable. `@decorator` is syntactic sugar for `func = decorator(func)`. Decorators should use `functools.wraps` to preserve the wrapped function's metadata (`__name__`, `__doc__`, `__annotations__`).

```python
import functools, time, logging

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

# Decorator factory — decorator that takes arguments
def retry(max_attempts=3, exceptions=(Exception,), delay=0.5):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    time.sleep(delay * (2 ** attempt))  # exponential backoff
            raise last_exc
        return wrapper
    return decorator

@retry(max_attempts=5, exceptions=(ConnectionError,), delay=0.1)
def fetch_data(url):
    ...

# Class-based decorator — supports state
class RateLimit:
    def __init__(self, calls_per_second):
        self.min_interval = 1.0 / calls_per_second
        self.last_called = 0.0

    def __call__(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            now = time.monotonic()
            elapsed = now - self.last_called
            if elapsed < self.min_interval:
                time.sleep(self.min_interval - elapsed)
            self.last_called = time.monotonic()
            return func(*args, **kwargs)
        return wrapper

@RateLimit(calls_per_second=10)
def api_call(): ...

# Stacking decorators — applied bottom-up
@timer
@retry(max_attempts=3)
def download(url): ...
# equivalent to: download = timer(retry(max_attempts=3)(download))
```

---

## 3.2 Context Managers

Context managers implement `__enter__` (called on entering `with` block, return value bound to `as` variable) and `__exit__` (called on exit, receives `exc_type`, `exc_val`, `exc_tb`; return `True` suppresses exception).

```python
# Class-based context manager
class ManagedResource:
    def __init__(self, name):
        self.name = name
        self.resource = None

    def __enter__(self):
        self.resource = acquire(self.name)
        return self.resource

    def __exit__(self, exc_type, exc_val, exc_tb):
        release(self.resource)
        if exc_type is ValueError:
            return True   # suppress ValueError
        return False      # propagate other exceptions

# contextlib.contextmanager — generator-based
from contextlib import contextmanager, asynccontextmanager, suppress

@contextmanager
def timer_ctx(label=""):
    start = time.perf_counter()
    try:
        yield  # code inside 'with' block runs here
    finally:
        print(f"{label}: {time.perf_counter()-start:.4f}s")

with timer_ctx("query"):
    result = db.execute(sql)

# suppress — silently ignore exceptions
with suppress(FileNotFoundError):
    os.remove("temp.txt")

# ExitStack — dynamic context manager stacking
from contextlib import ExitStack

files = ["a.txt", "b.txt", "c.txt"]
with ExitStack() as stack:
    handles = [stack.enter_context(open(f)) for f in files]
    # all files closed on exit regardless of exceptions

# Async context manager
@asynccontextmanager
async def db_transaction(conn):
    async with conn.begin():
        try:
            yield conn
        except Exception:
            await conn.rollback()
            raise
```

---

# SECTION 4 · PYTHON TYPING SYSTEM

> `[MID]` Type hints, Protocol, TypeVar, Generic  
> `[SENIOR]` Covariance, contravariance, TypeGuard, ParamSpec, Concatenate

---

## 4.1 Type Hints and Annotations

Type hints (PEP 484+) are not enforced at runtime (use `enforce` or `beartype` for that). They are metadata for static analysis tools (mypy, pyright, pylance). `from __future__ import annotations` makes all annotations strings (deferred evaluation, PEP 563).

```python
from __future__ import annotations
from typing import (
    Any, Optional, Union, Literal, Final,
    TypeVar, Generic, Protocol, overload,
    Callable, Iterator, Generator,
    TypedDict, NamedTuple
)
from collections.abc import Sequence, Mapping, Iterable

# Basic annotations
def greet(name: str, count: int = 1) -> str:
    return (name + "! ") * count

# Optional vs Union
def find(items: list[str], target: str) -> str | None:  # Python 3.10+
    ...
# Older style:
def find_old(items: list[str], target: str) -> Optional[str]:  # = Union[str, None]
    ...

# TypeVar — generic placeholder
T = TypeVar("T")
S = TypeVar("S", str, bytes)     # constrained TypeVar

def first(items: list[T]) -> T:
    return items[0]

# Generic class
class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

# TypedDict
class UserData(TypedDict):
    id: int
    name: str
    email: str | None

# Protocol — structural subtyping (duck typing with type safety)
class Drawable(Protocol):
    def draw(self) -> None: ...
    def resize(self, factor: float) -> None: ...

def render(obj: Drawable) -> None:   # no inheritance needed
    obj.draw()

class Circle:
    def draw(self): ...        # satisfies Drawable protocol
    def resize(self, f): ...   # without inheriting from it

render(Circle())  # type-check passes

# Literal types
Mode = Literal["read", "write", "append"]
def open_file(path: str, mode: Mode) -> None: ...

# Final — cannot be reassigned
MAX_SIZE: Final = 1000

# Callable with full signature
Handler = Callable[[str, int], bool]

# ParamSpec — preserves parameter types through decorators (Python 3.10+)
from typing import ParamSpec
P = ParamSpec("P")

def logged(func: Callable[P, T]) -> Callable[P, T]:
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper
```

> ⚑ `TypeGuard` (Python 3.10+) narrows types in conditional branches. `isinstance()` automatically narrows in `if` blocks for mypy.

---

# SECTION 5 · EXCEPTIONS, ERROR HANDLING, & LOGGING

> `[JUNIOR]` try/except/finally, raising exceptions  
> `[MID]` Custom exceptions, exception chaining, logging hierarchy  
> `[SENIOR]` Exception design, structured logging, sys.exc_info, tracebacks

---

## 5.1 Exception Hierarchy and Handling

```python
# Full exception hierarchy excerpt:
# BaseException
#   SystemExit, KeyboardInterrupt, GeneratorExit
#   Exception
#     ArithmeticError: ZeroDivisionError, OverflowError, FloatingPointError
#     LookupError: IndexError, KeyError
#     TypeError, ValueError, AttributeError, NameError
#     OSError: FileNotFoundError, PermissionError, TimeoutError, ConnectionError
#     RuntimeError: RecursionError, NotImplementedError
#     StopIteration, StopAsyncIteration
#     Warning (not errors)

try:
    result = int(input("Enter number: "))
    x = 10 / result
except (ValueError, ZeroDivisionError) as e:
    print(f"Input error: {e}")
except OSError as e:
    print(f"OS error [{e.errno}]: {e.strerror}")
else:
    print(f"Success: {x}")   # only if no exception
finally:
    print("Always runs")      # cleanup

# Re-raising with context
try:
    db.connect()
except psycopg2.Error as e:
    raise RuntimeError("DB connection failed") from e   # chaining
    # __cause__ = explicit chain (from e)
    # __context__ = implicit chain (was handling e when this was raised)
    # raise RuntimeError("...") from None  # suppresses implicit context

# Exception groups (Python 3.11+)
try:
    raise ExceptionGroup("multiple failures", [
        ValueError("bad value"),
        TypeError("bad type"),
    ])
except* ValueError as eg:
    print(f"Value errors: {eg.exceptions}")
except* TypeError as eg:
    print(f"Type errors: {eg.exceptions}")
```

---

## 5.2 Custom Exceptions

```python
class AppError(Exception):
    """Base for all application exceptions."""

class ValidationError(AppError):
    def __init__(self, field: str, message: str, value=None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"Validation failed for '{field}': {message}")

class NotFoundError(AppError):
    def __init__(self, resource: str, id: int | str):
        self.resource = resource
        self.id = id
        super().__init__(f"{resource} with id={id!r} not found")

# Usage
try:
    raise ValidationError("email", "invalid format", value="notanemail")
except ValidationError as e:
    print(e.field)   # "email"
    print(str(e))    # "Validation failed for 'email': invalid format"
```

---

## 5.3 Logging

```python
import logging
import logging.config
import json
from datetime import datetime

# Basic setup
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

# Logger hierarchy: root → app → app.module → app.module.submodule
# propagate=True (default): child loggers send records to parent handlers

# Structured logging with JSON
class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

# dictConfig — production-grade config
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {"()": JSONFormatter},
        "console": {"format": "%(levelname)s: %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "console"},
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "app.log",
            "maxBytes": 10_000_000,
            "backupCount": 5,
            "formatter": "json",
        },
    },
    "root": {"level": "INFO", "handlers": ["console", "file"]},
}

logging.config.dictConfig(LOGGING_CONFIG)
```

---

# SECTION 6 · ITERATORS, GENERATORS & THE ITERATION PROTOCOL

> `[JUNIOR]` for loops, iterables  
> `[MID]` Custom iterators, generators, itertools  
> `[SENIOR]` Generator internals, coroutine protocol, send/throw/close

---

## 6.1 Iteration Protocol

An **iterable** implements `__iter__` returning an **iterator**. An iterator implements `__iter__` (returns self) and `__next__` (returns next item or raises `StopIteration`). `for` loops call `iter()` then repeatedly call `next()`.

```python
class CountUp:
    def __init__(self, start, stop):
        self.current = start
        self.stop = stop

    def __iter__(self):     # makes it both iterable AND iterator
        return self

    def __next__(self):
        if self.current >= self.stop:
            raise StopIteration
        val = self.current
        self.current += 1
        return val

list(CountUp(1, 5))  # → [1, 2, 3, 4]

# Separate iterable and iterator
class InfiniteCounter:
    """Iterable — creates a new iterator each time"""
    def __init__(self, start=0):
        self.start = start

    def __iter__(self):
        return InfiniteCounterIterator(self.start)

class InfiniteCounterIterator:
    """Iterator — stateful, one-use"""
    def __init__(self, current):
        self.current = current

    def __iter__(self): return self

    def __next__(self):
        val = self.current
        self.current += 1
        return val
```

---

## 6.2 Generator Internals

A generator function (contains `yield`) returns a generator object. It is both an iterator and an iterable. The frame is suspended at each `yield` and resumed on `next()`. Generator objects have `gi_frame`, `gi_code`, `gi_running` attributes.

```python
import inspect

def gen_func():
    print("Starting")
    x = yield 1       # yields 1, receives sent value into x
    print(f"Got {x}")
    yield 2
    print("Done")

g = gen_func()
print(inspect.isgenerator(g))   # True
print(g.gi_frame is not None)   # True (frame alive while suspended)

next(g)         # prints "Starting", yields 1
g.send(42)      # resumes, x=42, prints "Got 42", yields 2
next(g)         # prints "Done", raises StopIteration

# throw() — inject exception into generator
def safe_gen():
    try:
        yield 1
        yield 2
    except ValueError:
        yield -1    # handle it, continue

g = safe_gen()
next(g)           # → 1
g.throw(ValueError, "bad")  # → -1
next(g)           # → StopIteration

# close() — throws GeneratorExit (triggers finally)
def resource_gen():
    try:
        yield "data"
    finally:
        print("cleanup")  # runs on close()

g = resource_gen()
next(g)
g.close()   # prints "cleanup"
```

---

# SECTION 7 · ASYNC / AWAIT & CONCURRENCY

> `[MID]` asyncio basics, async/await, tasks, event loop  
> `[SENIOR]` Event loop internals, uvloop, cancellation, structured concurrency, GIL implications

---

## 7.1 asyncio Fundamentals

asyncio is a single-threaded cooperative concurrency model. An event loop runs coroutines. A coroutine is defined with `async def` and suspends with `await`. Concurrency is achieved by scheduling multiple coroutines and switching at `await` points.

```python
import asyncio
import aiohttp
import time

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [asyncio.create_task(fetch(session, url)) for url in urls]
        return await asyncio.gather(*tasks)

# asyncio.gather vs asyncio.wait
# gather: returns results in order, cancels all on first exception by default
# wait: returns (done, pending) sets, fine-grained control

# Timeout
async def with_timeout():
    try:
        async with asyncio.timeout(5.0):    # Python 3.11+
            result = await slow_operation()
    except asyncio.TimeoutError:
        return None

# Event, Lock, Queue
async def producer(queue):
    for i in range(5):
        await asyncio.sleep(0.1)
        await queue.put(i)
    await queue.put(None)  # sentinel

async def consumer(queue):
    while True:
        item = await queue.get()
        if item is None: break
        print(f"Consumed {item}")
        queue.task_done()

async def pipeline():
    queue = asyncio.Queue(maxsize=10)
    await asyncio.gather(producer(queue), consumer(queue))
```

---

## 7.2 Event Loop Internals & Performance

> `[SENIOR]` Deep understanding required for system design interviews

The event loop maintains a **ready queue** (callbacks to run immediately) and a **selector** (I/O events). Each iteration: run ready callbacks → poll I/O (epoll/kqueue/IOCP) → schedule I/O callbacks → run scheduled callbacks. `uvloop` replaces the default event loop with a libuv-based implementation, achieving ~2-4x speedup.

```python
import asyncio
import uvloop  # pip install uvloop

# Replace default event loop with uvloop
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

# Low-level event loop API
loop = asyncio.get_event_loop()
loop.call_soon(callback)           # runs in current iteration
loop.call_later(delay, callback)   # runs after delay seconds
loop.call_at(when, callback)       # runs at absolute time
loop.run_in_executor(None, blocking_func, *args)  # thread pool

# Subclassing Protocol for custom transports
class EchoServerProtocol(asyncio.Protocol):
    def connection_made(self, transport):
        self.transport = transport

    def data_received(self, data):
        self.transport.write(data)

    def connection_lost(self, exc):
        pass

# asyncio.Runner (Python 3.11+)
with asyncio.Runner() as runner:
    result = runner.run(main())
```

---

## 7.3 Threading, Multiprocessing, and the GIL

> `[SENIOR]` GIL mechanics, when to use each concurrency model

The **GIL** (Global Interpreter Lock) in CPython prevents multiple threads from executing Python bytecode simultaneously. **I/O-bound tasks:** threading is fine (GIL released during I/O). **CPU-bound tasks:** use multiprocessing (separate processes, no GIL) or C extensions that release the GIL.

```python
import threading
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# Threading — good for I/O-bound
def io_task(n):
    import time; time.sleep(n); return n

with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(io_task, i) for i in range(10)]
    results = [f.result() for f in futures]

# Thread synchronization
lock = threading.Lock()
rlock = threading.RLock()        # reentrant — same thread can acquire multiple times
event = threading.Event()        # for signaling
semaphore = threading.Semaphore(3)  # limit concurrent access

# Multiprocessing — good for CPU-bound
def cpu_task(data):
    return sum(x**2 for x in data)

with ProcessPoolExecutor(max_workers=multiprocessing.cpu_count()) as executor:
    chunks = [range(i, i+1000) for i in range(0, 10000, 1000)]
    results = list(executor.map(cpu_task, chunks))

# Shared memory (Python 3.8+)
from multiprocessing import shared_memory
shm = shared_memory.SharedMemory(create=True, size=1024)
# attach in another process: shm2 = shared_memory.SharedMemory(name=shm.name)

# multiprocessing.Pool with initializer
def init_worker():
    global db_conn
    db_conn = create_connection()

with multiprocessing.Pool(processes=4, initializer=init_worker) as pool:
    results = pool.map(process_item, items)

# GIL internals:
# - Released every sys.getswitchinterval() seconds (default 5ms)
# - Released during I/O system calls, sleep, subprocess
# - numpy/pandas/scipy operations often release GIL in C extensions
# - Free-threaded CPython (PEP 703) in Python 3.13+ as opt-in
```

---

# SECTION 8 · MEMORY MODEL & CPYTHON INTERNALS

> `[SENIOR]` CPython object model, reference counting, GC, memory layout

---

## 8.1 Reference Counting and Garbage Collection

CPython uses **reference counting** as the primary memory management strategy. Each `PyObject` has an `ob_refcnt` field. When `refcnt` reaches 0, the object is immediately deallocated (deterministic). Reference cycles are handled by the **cyclic garbage collector** (generational, Bacon-Rajan-Collins algorithm).

```python
import sys
import gc

x = [1, 2, 3]
sys.getrefcount(x)   # → 2 (x + getrefcount's arg)

y = x
sys.getrefcount(x)   # → 3

del y
sys.getrefcount(x)   # → 2

# Reference cycle — not collected by refcount alone
a = []
a.append(a)   # a references itself
del a         # refcnt → 1 (still referenced by itself), not freed!
gc.collect()  # cyclic GC finds and collects it

# GC generations
gc.get_threshold()   # → (700, 10, 10) — gen0 threshold, gen1, gen2
gc.get_count()       # current object counts per generation
gc.collect(generation=2)  # full collection

# Weakrefs — reference without incrementing refcnt
import weakref

class Node:
    def __init__(self, val):
        self.val = val
        self._parent = None

    @property
    def parent(self): return self._parent() if self._parent else None

    @parent.setter
    def parent(self, node):
        self._parent = weakref.ref(node) if node else None

# Object pool / flyweight to reduce allocations
class PointPool:
    _pool: dict[tuple, 'Point'] = {}

    def __new__(cls, x, y):
        key = (x, y)
        if key not in cls._pool:
            obj = super().__new__(cls)
            cls._pool[key] = obj
        return cls._pool[key]
```

---

## 8.2 CPython Bytecode and the Eval Loop

```python
import dis

def add(a, b):
    return a + b

dis.dis(add)
# Outputs:
#  2           0 LOAD_FAST                0 (a)
#              2 LOAD_FAST                1 (b)
#              4 BINARY_OP               0 (+)
#              6 RETURN_VALUE

# Code object attributes
code = add.__code__
code.co_varnames    # ('a', 'b') — local var names
code.co_consts      # (None,)
code.co_flags       # bitmask of CO_* flags
code.co_stacksize   # max eval stack depth needed

# Bytecode is interpreted in Python/ceval.c
# LOAD_FAST: push from fastlocals array (O(1) indexed array, not dict)
# LOAD_GLOBAL: lookup in globals dict (hash table)
# LOAD_DEREF: lookup in cell/free variable (closure)

# Python 3.11+ "Specializing Adaptive Interpreter"
# Bytecode instructions are specialized at runtime:
# LOAD_ATTR → LOAD_ATTR_MODULE (cached offset lookup)
# BINARY_OP + (int,int) → BINARY_OP_ADD_INT (avoids type dispatch)
```

---

## 8.3 Small Integer Cache, String Interning, Tuple Caching

```python
# Small integer cache: [-5, 256] are pre-allocated singletons
a = 256; b = 256
a is b   # → True

a = 257; b = 257
a is b   # → False  (in separate statements)
# BUT: a = b = 257; a is b → True (same literal in same bytecode)

# String interning
import sys
sys.intern("hello")    # force intern a string

# intern happens automatically for:
# - compile-time string constants
# - strings that look like identifiers (no spaces, no special chars)

# Tuple and list caching
# CPython caches empty tuple: () is () → True
# Free list for tuples up to 20 elements (recycled allocation)
# Lists have a free list of 80 items

# None, True, False are singletons
assert None is None
assert True is True
```

---

# SECTION 9 · PERFORMANCE OPTIMIZATION

> `[MID]` Profiling, basic optimizations  
> `[SENIOR]` Algorithmic complexity, JIT, C extensions, numpy vectorization

---

## 9.1 Profiling

```python
# cProfile — deterministic profiling
import cProfile, pstats, io

pr = cProfile.Profile()
pr.enable()
# ... code to profile ...
pr.disable()

stream = io.StringIO()
ps = pstats.Stats(pr, stream=stream).sort_stats("cumulative")
ps.print_stats(20)   # top 20 by cumulative time

# line_profiler — line-by-line timing
# pip install line-profiler
# @profile decorator, run with: kernprof -l -v script.py

# memory_profiler — memory usage line by line
# pip install memory-profiler
# @profile decorator

# tracemalloc — built-in memory tracing
import tracemalloc
tracemalloc.start()
# ... code ...
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics("lineno")
for stat in top_stats[:10]:
    print(stat)

# timeit — micro-benchmarking
import timeit
timeit.timeit("x = [i**2 for i in range(100)]", number=10000)
# IPython/Jupyter: %timeit, %%timeit
```

---

## 9.2 Optimization Techniques

```python
# 1. Use local variables in hot loops (LOAD_FAST > LOAD_GLOBAL)
import math
def sin_sum_slow(lst):
    return sum(math.sin(x) for x in lst)

def sin_sum_fast(lst):
    _sin = math.sin    # bind to local
    return sum(_sin(x) for x in lst)

# 2. Avoid attribute lookup in tight loops
def distances_fast(points, origin):
    ox, oy = origin.x, origin.y   # extract once
    return [((p.x-ox)**2 + (p.y-oy)**2)**0.5 for p in points]

# 3. numpy vectorization — avoid Python loops for numeric work
import numpy as np

data = list(range(1_000_000))
arr = np.array(data)
result_fast = arr ** 2                   # ~1ms vs ~100ms Python loop

# 4. String concatenation — use join, not +=
# Bad: O(n²) due to immutable string copies
s = ""; 
for word in words: s += word + " "

# Good: O(n)
s = " ".join(words)

# 5. Set lookups vs list lookups
haystack_set = set(range(10000))
# x in haystack_list: O(n)
# x in haystack_set:  O(1)

# 6. collections.deque for queue operations
from collections import deque
q = deque()
q.appendleft(x)   # O(1) ← list.insert(0, x) is O(n)
q.popleft()       # O(1) ← list.pop(0) is O(n)

# 7. Numba JIT
from numba import jit
@jit(nopython=True)
def fast_sum(arr):
    total = 0.0
    for x in arr:
        total += x
    return total

# 8. Cython — write Python, compile to C
# Add type annotations to .pyx files, run cythonize()

# 9. ctypes / cffi — call C libraries directly
import ctypes
lib = ctypes.CDLL("libm.so.6")
lib.sqrt.restype = ctypes.c_double
lib.sqrt(ctypes.c_double(2.0))
```

---

# SECTION 10 · TESTING

> `[JUNIOR]` unittest, basic assertions  
> `[MID]` pytest, fixtures, mocking, parametrize  
> `[SENIOR]` Test architecture, property-based testing, mutation testing

---

## 10.1 pytest Fundamentals and Advanced Fixtures

```python
import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock

# Basic test
def test_addition():
    assert 1 + 1 == 2

# Fixtures — dependency injection for tests
@pytest.fixture
def db_connection():
    conn = create_test_db()
    yield conn          # provide to test
    conn.rollback()     # teardown
    conn.close()

@pytest.fixture(scope="module")  # shared across module
def expensive_resource():
    resource = setup_once()
    yield resource
    teardown(resource)

# Autouse fixture — applied to all tests in scope
@pytest.fixture(autouse=True)
def reset_state():
    State.reset()
    yield
    State.reset()

# Parametrize
@pytest.mark.parametrize("input,expected", [
    ("hello", 5),
    ("", 0),
    ("a" * 100, 100),
])
def test_strlen(input, expected):
    assert len(input) == expected

# Exception testing
def test_raises():
    with pytest.raises(ValueError, match="must be positive"):
        validate(-1)

# Mocking
def test_service(monkeypatch):
    mock_db = MagicMock()
    mock_db.query.return_value = [{"id": 1, "name": "test"}]
    monkeypatch.setattr("myapp.service.db", mock_db)

    result = service.get_users()
    mock_db.query.assert_called_once_with("SELECT * FROM users")
    assert len(result) == 1

# Async test
@pytest.mark.asyncio
async def test_async_service():
    mock_http = AsyncMock()
    mock_http.get.return_value.json.return_value = {"status": "ok"}

    with patch("myapp.client.http", mock_http):
        result = await client.health_check()

    assert result["status"] == "ok"
```

---

## 10.2 Property-Based Testing with Hypothesis

> `[SENIOR]` Finds edge cases you wouldn't think to test

```python
from hypothesis import given, settings, assume
from hypothesis import strategies as st

@given(st.lists(st.integers()))
def test_sort_idempotent(lst):
    # Sorting twice is same as sorting once
    assert sorted(sorted(lst)) == sorted(lst)

@given(st.integers(), st.integers())
def test_add_commutative(a, b):
    assert add(a, b) == add(b, a)

@given(st.text(min_size=1))
def test_encode_decode_roundtrip(s):
    encoded = encode(s)
    decoded = decode(encoded)
    assert decoded == s

# Custom strategies
user_strategy = st.builds(
    User,
    name=st.text(min_size=1, max_size=50),
    age=st.integers(min_value=0, max_value=150),
    email=st.emails(),
)

@given(user_strategy)
def test_user_validation(user):
    result = validate_user(user)
    assert result.is_valid or result.errors
```

---

# SECTION 11 · DATA STRUCTURES & ALGORITHMS (PYTHON-SPECIFIC)

> `[JUNIOR]` Standard library data structures  
> `[MID]` heapq, bisect, custom sorting  
> `[SENIOR]` Time/space complexity, algorithmic design trade-offs

---

## 11.1 Collections Module Deep Dive

```python
from collections import (
    deque, Counter, defaultdict, OrderedDict,
    ChainMap, UserDict, UserList
)

# deque — O(1) both ends, O(n) middle
d = deque([1,2,3], maxlen=5)   # maxlen: auto-discards old items
d.appendleft(0)   # O(1)
d.rotate(2)       # rotate right by 2
d.rotate(-2)      # rotate left by 2

# Counter arithmetic
c1 = Counter("aabbc")
c2 = Counter("bccdd")
c1 + c2   # → Counter({'c':3,'b':3,'a':2,'d':2})
c1 - c2   # → Counter({'a':2,'b':1}) — subtract, keep positives only
c1 & c2   # → Counter({'b':2,'c':1}) — intersection (min)
c1 | c2   # → Counter({'a':2,'b':2,'c':3,'d':2}) — union (max)

# OrderedDict — useful for LRU cache without lru_cache
class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)   # remove LRU (first item)

# ChainMap — layered dict lookups (like scope resolution)
defaults = {"color": "red", "size": 10}
overrides = {"color": "blue"}
combined = ChainMap(overrides, defaults)
combined["color"]   # → "blue"  (overrides first)
combined["size"]    # → 10      (from defaults)
```

---

## 11.2 heapq and Priority Queue

```python
import heapq

# Min-heap (CPython only supports min-heap natively)
heap = [5, 3, 1, 4, 2]
heapq.heapify(heap)      # O(n) in-place
heapq.heappush(heap, 0)  # O(log n)
heapq.heappop(heap)      # O(log n) → 0

# Max-heap: negate values
max_heap = [-x for x in [5, 3, 1, 4, 2]]
heapq.heapify(max_heap)
-heapq.heappop(max_heap)   # → 5

# Priority queue with tuples (sorted by first element)
tasks = []
heapq.heappush(tasks, (3, "low priority task"))
heapq.heappush(tasks, (1, "high priority task"))
heapq.heappush(tasks, (2, "medium priority task"))
heapq.heappop(tasks)   # → (1, "high priority task")

# Handle priority ties with a counter
import itertools
counter = itertools.count()
heapq.heappush(tasks, (1, next(counter), "another high priority"))

# Merge sorted iterables
merged = list(heapq.merge([1,3,5], [2,4,6], [0,7,9]))

# N largest/smallest
heapq.nlargest(3, data, key=lambda x: x["score"])
heapq.nsmallest(3, data, key=lambda x: x["score"])
# Note: for n ≈ len(data), use sorted(); for n << len(data), heapq.n* is faster
```

---

## 11.3 bisect — Binary Search

```python
import bisect

sorted_list = [1, 3, 5, 7, 9, 11]

bisect.bisect_left(sorted_list, 5)    # → 2 (insert before existing)
bisect.bisect_right(sorted_list, 5)   # → 3 (insert after existing)
bisect.insort_left(sorted_list, 4)    # inserts 4 in sorted position

# Use case: grade lookup O(log n)
breakpoints = [60, 70, 80, 90]
grades = ["F", "D", "C", "B", "A"]
def grade(score):
    return grades[bisect.bisect(breakpoints, score)]

# Implement sorted container
class SortedList:
    def __init__(self): self._data = []
    def add(self, x): bisect.insort(self._data, x)
    def __contains__(self, x):
        i = bisect.bisect_left(self._data, x)
        return i < len(self._data) and self._data[i] == x
```

---

# SECTION 12 · DATABASE & ORM PATTERNS

> `[MID]` SQLAlchemy ORM, connection pooling, query optimization  
> `[SENIOR]` N+1 problem, lazy vs eager loading, connection pool sizing, query plan analysis

---

## 12.1 SQLAlchemy Core and ORM

```python
from sqlalchemy import (
    create_engine, Column, Integer, String, ForeignKey,
    select, func, text, Index
)
from sqlalchemy.orm import (
    Session, relationship, selectinload, joinedload,
    DeclarativeBase, mapped_column, Mapped
)
from sqlalchemy.pool import QueuePool
import contextlib

# Engine with connection pool
engine = create_engine(
    "postgresql+psycopg2://user:pass@host/db",
    poolclass=QueuePool,
    pool_size=10,          # persistent connections
    max_overflow=20,       # extra connections when pool exhausted
    pool_pre_ping=True,    # validate connections before use (detects stale)
    pool_recycle=3600,     # recycle connections every hour
    echo=False,
)

# Modern declarative models (SQLAlchemy 2.0+)
class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
        Index("ix_users_name_age", "name", "age"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    orders: Mapped[list["Order"]] = relationship(back_populates="user")

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    total: Mapped[float]
    user: Mapped["User"] = relationship(back_populates="orders")

# N+1 Problem — THE most common ORM performance bug
# BAD: N+1 — issues 1 query for users, then 1 per user for orders
with Session(engine) as session:
    users = session.execute(select(User)).scalars().all()
    for user in users:
        print(user.orders)   # lazy loads EACH user's orders separately

# GOOD: Eager loading
with Session(engine) as session:
    # joinedload: single JOIN query
    stmt = select(User).options(joinedload(User.orders))
    # selectinload: 2 queries (users, then orders WHERE user_id IN (...))
    stmt = select(User).options(selectinload(User.orders))
    users = session.execute(stmt).unique().scalars().all()

# Bulk operations
with Session(engine) as session:
    session.bulk_insert_mappings(User, [{"name": n, "email": e} for n,e in data])
    # SQLAlchemy 2.0:
    session.execute(User.__table__.insert(), [{"name": n} for n in names])
```

---

# SECTION 13 · DESIGN PATTERNS IN PYTHON

> `[MID]` Common GoF patterns, Pythonic implementations  
> `[SENIOR]` Pattern trade-offs, anti-patterns, SOLID in Python

---

## 13.1 Creational Patterns

```python
# Factory Method
class Shape:
    @classmethod
    def create(cls, shape_type: str) -> 'Shape':
        registry = {"circle": Circle, "rect": Rectangle, "tri": Triangle}
        cls_type = registry.get(shape_type)
        if not cls_type:
            raise ValueError(f"Unknown shape: {shape_type}")
        return cls_type()

# Abstract Factory
from abc import ABC, abstractmethod

class Button(ABC):
    @abstractmethod
    def render(self): ...

class WindowsButton(Button):
    def render(self): return "<win-btn>"

class MacButton(Button):
    def render(self): return "<mac-btn>"

# Builder — fluent interface
class QueryBuilder:
    def __init__(self): self._parts = {"select": "*", "where": [], "limit": None}

    def select(self, *cols):
        self._parts["select"] = ", ".join(cols)
        return self   # fluent interface

    def where(self, condition):
        self._parts["where"].append(condition)
        return self

    def limit(self, n):
        self._parts["limit"] = n
        return self

    def build(self):
        sql = f"SELECT {self._parts['select']} FROM table"
        if self._parts["where"]:
            sql += " WHERE " + " AND ".join(self._parts["where"])
        if self._parts["limit"]:
            sql += f" LIMIT {self._parts['limit']}"
        return sql

query = QueryBuilder().select("id","name").where("age > 18").limit(10).build()
```

---

## 13.2 Structural Patterns

```python
# Proxy
class ExpensiveResource:
    def load(self): return "heavy data"

class LazyProxy:
    def __init__(self): self._resource = None

    def load(self):
        if self._resource is None:
            self._resource = ExpensiveResource()
        return self._resource.load()

# Adapter
class OldAPI:
    def get_data(self): return {"key": "value"}

class NewAPIAdapter:
    def __init__(self, old): self._old = old
    def fetch(self): return list(self._old.get_data().items())

# Decorator pattern (GoF, not Python @decorator)
class Coffee:
    def cost(self): return 1.0
    def description(self): return "Coffee"

class MilkDecorator:
    def __init__(self, component): self._comp = component
    def cost(self): return self._comp.cost() + 0.5
    def description(self): return self._comp.description() + " + Milk"
```

---

## 13.3 Behavioral Patterns

```python
# Observer / Event system
from collections import defaultdict
from typing import Callable

class EventEmitter:
    def __init__(self):
        self._handlers: defaultdict[str, list[Callable]] = defaultdict(list)

    def on(self, event: str, handler: Callable):
        self._handlers[event].append(handler)
        return lambda: self._handlers[event].remove(handler)  # unsubscribe

    def emit(self, event: str, *args, **kwargs):
        for handler in list(self._handlers[event]):
            handler(*args, **kwargs)

bus = EventEmitter()
unsub = bus.on("user.created", lambda u: send_welcome_email(u))
bus.emit("user.created", user)
unsub()   # unsubscribe

# Command pattern
class Command(ABC):
    @abstractmethod
    def execute(self): ...
    @abstractmethod
    def undo(self): ...

# Strategy
class Sorter:
    def __init__(self, strategy: Callable):
        self._strategy = strategy

    def sort(self, data):
        return self._strategy(data)

quick_sorter = Sorter(sorted)
merge_sorter = Sorter(lambda d: merge_sort(d))

# Chain of Responsibility
class Handler:
    def __init__(self, next_handler=None):
        self._next = next_handler

    def handle(self, request):
        if self._next:
            return self._next.handle(request)
        return None
```

---

# SECTION 14 · PACKAGING, ENVIRONMENTS & PROJECT STRUCTURE

> `[MID]` pyproject.toml, virtual environments, pip  
> `[SENIOR]` Package publishing, dependency resolution, reproducible builds

---

## 14.1 Modern Python Project Structure

```toml
# pyproject.toml (PEP 517/518/621)
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mypackage"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.100",
    "sqlalchemy>=2.0",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = ["pytest", "mypy", "ruff"]
test = ["pytest", "pytest-asyncio", "hypothesis"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.mypy]
strict = true
python_version = "3.11"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

```
# Recommended project layout (src layout)
myproject/
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── core/
│       ├── api/
│       └── models/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── pyproject.toml
├── README.md
└── Dockerfile
```

---

## 14.2 Virtual Environments and Dependency Management

```bash
# venv (built-in)
python -m venv .venv
source .venv/bin/activate    # Unix
.venv\Scripts\activate       # Windows
pip install -e ".[dev]"      # editable install with dev deps

# pip-compile (pip-tools) — deterministic requirements
pip-compile pyproject.toml -o requirements.txt
pip-compile pyproject.toml --extra dev -o requirements-dev.txt
pip-sync requirements.txt

# uv — ultra-fast package installer (Rust-based, drop-in pip replacement)
uv pip install fastapi
uv pip sync requirements.txt
uv run python script.py

# poetry
poetry add fastapi
poetry add --group dev pytest
poetry lock             # generates poetry.lock (lockfile)
poetry install
poetry build            # builds wheel + sdist
poetry publish
```

---

# SECTION 15 · WEB FRAMEWORKS — FASTAPI & DJANGO

> `[MID]` Request/response cycle, routing, middleware, ORM integration  
> `[SENIOR]` Dependency injection architecture, async vs sync, ASGI, performance tuning

---

## 15.1 FastAPI — Modern Async API Framework

```python
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Annotated

app = FastAPI(title="My API", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    import time
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.perf_counter() - start)
    return response

# Pydantic models
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(pattern=r'^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$')
    age: int = Field(ge=0, le=150)

    @validator("email")
    def email_lowercase(cls, v):
        return v.lower()

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    class Config:
        from_attributes = True   # ORM mode

# Dependency injection
async def get_db():
    async with DBSession() as db:
        yield db

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    user = await db.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(data: UserCreate, db: DB, bg: BackgroundTasks):
    existing = await db.query(User).filter_by(email=data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(**data.dict())
    db.add(user); await db.commit(); await db.refresh(user)
    bg.add_task(send_welcome_email, user.email)
    return user
```

---

## 15.2 ASGI, Starlette, and Deployment

> `[SENIOR]` ASGI protocol, uvicorn, gunicorn configuration

```python
# ASGI interface — async callable(scope, receive, send)
# scope: dict with type, method, path, headers, etc.
# receive: async callable returning messages (body, disconnect)
# send: async callable to send response parts

# Raw ASGI app
async def app(scope, receive, send):
    assert scope["type"] == "http"
    await send({"type": "http.response.start", "status": 200,
                "headers": [[b"content-type", b"text/plain"]]})
    await send({"type": "http.response.body", "body": b"Hello"})
```

```bash
# uvicorn config
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# gunicorn + uvicorn workers (production pattern)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Connection pool sizing formula (rough guide):
# workers = 2 * cpu_cores + 1
# db pool_size per worker = total_db_connections / workers
# If 100 max DB connections, 4 workers → pool_size=20, max_overflow=5 per worker
```

---

# SECTION 16 · SECURITY

> `[MID]` Common vulnerabilities, input validation, secrets management  
> `[SENIOR]` OWASP Top 10, cryptographic choices, secure coding patterns

---

## 16.1 Common Python Security Issues

```python
import secrets
import hashlib
import hmac
from cryptography.fernet import Fernet
import base64, os

# 1. Secret generation — use secrets module, NOT random
token = secrets.token_urlsafe(32)     # 256-bit URL-safe token
hex_token = secrets.token_hex(16)     # 128-bit hex
pin = secrets.randbelow(10000)        # [0, 10000)

# 2. Password hashing — use bcrypt/argon2, NOT sha256
import bcrypt
password = b"user_password"
hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
bcrypt.checkpw(password, hashed)   # → True

# Or argon2-cffi (preferred, OWASP recommended)
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)
hash_ = ph.hash("password")
ph.verify(hash_, "password")

# 3. HMAC for message authentication
key = secrets.token_bytes(32)
msg = b"important data"
mac = hmac.new(key, msg, hashlib.sha256).hexdigest()
# Verify — timing-safe comparison
hmac.compare_digest(mac, received_mac)   # prevents timing attacks

# 4. SQL injection prevention — ALWAYS use parameterized queries
# BAD:
cursor.execute(f"SELECT * FROM users WHERE name = '{user_input}'")
# GOOD:
cursor.execute("SELECT * FROM users WHERE name = %s", (user_input,))

# 5. Command injection prevention
import subprocess
# BAD:
os.system(f"ls {user_input}")
# GOOD:
subprocess.run(["ls", user_input], capture_output=True, check=True)

# 6. Path traversal prevention
import pathlib
SAFE_ROOT = pathlib.Path("/app/uploads").resolve()

def safe_open(filename: str):
    path = (SAFE_ROOT / filename).resolve()
    if not str(path).startswith(str(SAFE_ROOT)):
        raise PermissionError("Path traversal detected")
    return open(path)

# 7. Pickle deserialization — NEVER unpickle untrusted data
# Use JSON, msgpack, or protobuf instead

# 8. Environment variables for secrets (12-factor)
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]   # raises if missing (explicit)
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
```

---

# SECTION 17 · ARCHITECTURAL PATTERNS & SYSTEM DESIGN

> `[SENIOR]` Domain-driven design, event-driven architecture, CQRS, hexagonal architecture

---

## 17.1 Clean Architecture in Python

```python
# Domain layer — pure Python, no framework imports
from dataclasses import dataclass, field
from typing import Protocol
import uuid
from datetime import datetime

@dataclass
class UserId:
    value: str = field(default_factory=lambda: str(uuid.uuid4()))

@dataclass
class User:
    id: UserId
    name: str
    email: str
    created_at: datetime = field(default_factory=datetime.utcnow)

    def rename(self, new_name: str) -> None:
        if not new_name.strip():
            raise ValueError("Name cannot be empty")
        self.name = new_name

# Repository protocol (port)
class UserRepository(Protocol):
    async def find_by_id(self, user_id: UserId) -> User | None: ...
    async def find_by_email(self, email: str) -> User | None: ...
    async def save(self, user: User) -> None: ...
    async def delete(self, user_id: UserId) -> None: ...

# Use case / application service
class CreateUserUseCase:
    def __init__(self, user_repo: UserRepository, event_bus: EventBus):
        self._repo = user_repo
        self._bus = event_bus

    async def execute(self, name: str, email: str) -> User:
        existing = await self._repo.find_by_email(email)
        if existing:
            raise ConflictError(f"Email {email!r} already registered")
        user = User(id=UserId(), name=name, email=email)
        await self._repo.save(user)
        await self._bus.publish(UserCreated(user_id=user.id, email=user.email))
        return user

# Infrastructure adapter (driven port)
class SQLAlchemyUserRepository:
    def __init__(self, session: Session):
        self._session = session

    async def find_by_id(self, user_id: UserId) -> User | None:
        row = await self._session.get(UserModel, user_id.value)
        return self._to_domain(row) if row else None

    async def save(self, user: User) -> None:
        model = self._to_model(user)
        await self._session.merge(model)
```

---

## 17.2 Event-Driven Architecture

```python
# Domain events
from dataclasses import dataclass, field

@dataclass(frozen=True)
class DomainEvent:
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    occurred_at: datetime = field(default_factory=datetime.utcnow)

@dataclass(frozen=True)
class UserCreated(DomainEvent):
    user_id: str
    email: str

# Async event bus
class AsyncEventBus:
    def __init__(self):
        self._handlers: dict[type, list[Callable]] = defaultdict(list)

    def subscribe(self, event_type: type, handler: Callable):
        self._handlers[event_type].append(handler)

    async def publish(self, event: DomainEvent):
        handlers = self._handlers.get(type(event), [])
        await asyncio.gather(*[h(event) for h in handlers])

# Transactional outbox pattern
# 1. Write event to outbox table in same DB transaction as domain change
# 2. Separate worker polls outbox, publishes to broker, marks sent
class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str]
    payload: Mapped[str]   # JSON
    published: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime]

async def save_with_outbox(session, user, event):
    session.add(user)
    session.add(OutboxEvent(
        event_type=type(event).__name__,
        payload=json.dumps(asdict(event)),
        created_at=datetime.utcnow()
    ))
    await session.commit()   # atomic: user + outbox event
```

---

## 17.3 CQRS — Command Query Responsibility Segregation

> `[SENIOR]` Trade-off: consistency vs performance

CQRS separates **read models** (queries, optimized for display) from **write models** (commands, optimized for invariant enforcement). Enables independent scaling of reads and writes. Trade-offs: eventual consistency on read side; more code; only worth it when read and write loads are dramatically different.

```python
# Command side — domain model, strong consistency
class PlaceOrderCommand:
    user_id: str
    items: list[dict]
    payment_token: str

class PlaceOrderHandler:
    async def handle(self, cmd: PlaceOrderCommand) -> str:
        user = await self._user_repo.find(cmd.user_id)
        order = Order.create(user=user, items=cmd.items)
        await self._order_repo.save(order)
        await self._bus.publish(OrderPlaced(order_id=order.id))
        return order.id

# Query side — read model, eventual consistency, optimized SQL
class OrderSummaryQuery:
    async def get_user_orders(self, user_id: str) -> list[dict]:
        sql = """
            SELECT o.id, o.total, o.status, COUNT(oi.id) as item_count,
                   u.name as user_name
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN users u ON o.user_id = u.id
            WHERE o.user_id = :user_id
            GROUP BY o.id, u.name
            ORDER BY o.created_at DESC
        """
        result = await self._db.execute(text(sql), {"user_id": user_id})
        return result.mappings().all()

# Trade-offs:
# + Read models can be cached aggressively (Redis, memcached)
# + Write models enforce business rules without performance compromise
# + Independent scaling: read replicas for queries, primary for commands
# - Eventual consistency: query model may lag behind write model
# - More code, more cognitive overhead
# - Not needed for most CRUD apps
```

---

# SECTION 18 · FUNCTIONAL PROGRAMMING IN PYTHON

> `[MID]` map/filter/reduce, partial application, immutability  
> `[SENIOR]` Functor/Monad patterns, point-free style, functional error handling

---

## 18.1 Functional Tools

```python
from functools import reduce, partial
from operator import add, mul, itemgetter, attrgetter
# pip install toolz
from toolz import pipe, curry, compose, memoize

# partial application
power_of_2 = partial(pow, 2)
power_of_2(10)  # → 1024

# operator module — functional versions of operators
reduce(add, [1,2,3,4])   # → 10

# toolz — functional pipeline
@curry
def add(x, y): return x + y

add5 = add(5)   # curried, partially applied
add5(3)         # → 8

result = pipe(
    [1, 2, 3, 4, 5],
    partial(filter, lambda x: x > 2),
    partial(map, lambda x: x**2),
    list
)   # → [9, 16, 25]

# itemgetter / attrgetter — function factories
data = [{"name": "Bob", "age": 30}, {"name": "Alice", "age": 25}]
sorted(data, key=itemgetter("age"))   # sort by age

# Functional error handling — Result/Either monad pattern
class Result:
    def __init__(self, value=None, error=None):
        self.value = value
        self.error = error
        self.ok = error is None

    @classmethod
    def success(cls, value): return cls(value=value)

    @classmethod
    def failure(cls, error): return cls(error=error)

    def map(self, func):
        if not self.ok: return self
        try:
            return Result.success(func(self.value))
        except Exception as e:
            return Result.failure(e)

    def flat_map(self, func):
        if not self.ok: return self
        return func(self.value)

# Usage
result = (Result.success(user_input)
          .map(parse_int)
          .map(lambda n: n * 2)
          .flat_map(save_to_db))
```

---

# APPENDIX A — QUICK REFERENCE: TALENT SIGNALS BY LEVEL

---

## Junior-Level Signals

```
POSITIVE SIGNALS (Junior):
✓ Understands variable scoping (knows what NameError, UnboundLocalError mean)
✓ Uses list/dict comprehensions instead of manual loops
✓ Knows difference between mutable and immutable types
✓ Handles exceptions with try/except (not bare except:)
✓ Uses f-strings, not % formatting or .format()
✓ Knows list.append() vs list.extend()
✓ Uses enumerate() and zip() instead of index loops
✓ Writes docstrings on functions

RED FLAGS (Junior):
✗ Uses mutable default arguments (def func(lst=[]): ...)
✗ Uses == to compare to None (should be is None)
✗ Catches Exception or BaseException broadly with bare except
✗ Uses global variables extensively
✗ Writes deeply nested loops instead of helper functions
✗ Can't explain the difference between = (assignment) and == (equality)
✗ Doesn't know why 0.1 + 0.2 != 0.3
```

---

## Mid-Level Signals

```
POSITIVE SIGNALS (Mid):
✓ Designs with classes, knows when NOT to use a class
✓ Writes generators for large data processing (memory efficiency)
✓ Uses context managers for resource management
✓ Writes pytest fixtures and uses parametrize
✓ Understands asyncio basics — knows it's single-threaded cooperative
✓ Uses type hints consistently, runs mypy
✓ Configures logging properly with dictConfig
✓ Knows when to use defaultdict, Counter, deque vs list/dict
✓ Can explain N+1 query problem and how to fix it
✓ Uses dataclasses for data containers

RED FLAGS (Mid):
✗ Calls asyncio.sleep(0) in a sync function to "make it async"
✗ Uses threads for CPU-bound work (thinks it bypasses GIL)
✗ Writes __init__.py with star imports
✗ Uses print() for logging in production code
✗ Doesn't know what sys.getswitchinterval() does
✗ Can't distinguish between eager loading and lazy loading in ORMs
✗ Uses string formatting in SQL queries (SQL injection risk)
```

---

## Senior-Level Signals

```
POSITIVE SIGNALS (Senior):
✓ Discusses CPython internals (bytecode, GIL release points, refcount)
✓ Knows when Python is the bottleneck vs I/O or DB (measures first)
✓ Designs repositories and use cases separately (clean architecture)
✓ Understands event loop blocking — won't put CPU work in async function
✓ Designs for observability: structured logging, metrics, traces
✓ Discusses trade-offs: lru_cache invalidation, connection pool sizing
✓ Knows __slots__ impact on memory and why it breaks pickle
✓ Can reason about memory layout (C struct vs dict overhead)
✓ Understands metaclass use cases AND when to avoid them
✓ Discusses transactional outbox, saga pattern for distributed systems
✓ Explains why Hypothesis finds bugs integration tests miss
✓ Uses TypeVar covariance/contravariance correctly
✓ Knows Python 3.11+ specializing adaptive interpreter

RED FLAGS (Senior):
✗ Recommends microservices for a team of 3 (premature complexity)
✗ Uses pickle over network boundaries with untrusted data
✗ Can't explain why print(0.1 + 0.2) != 0.3
✗ Doesn't know the difference between __new__ and __init__
✗ Uses multiprocessing.Pool inside async code (deadlock risk)
✗ Stores secrets in code or version control
✗ Treats "it works on my machine" as sufficient testing
✗ Can't describe what happens when an asyncio Task is cancelled
✗ Designs monolithic functions >100 lines without justification
```

---

# APPENDIX B — PYTHON VERSION FEATURE MATRIX

| Version | Key Features |
|---------|-------------|
| **3.6** | f-strings, variable annotations, async generators, `__init_subclass__` |
| **3.7** | `dataclasses`, dict ordered by insertion, `breakpoint()`, postponed annotations |
| **3.8** | walrus operator `:=`, positional-only params `/`, f-string `=` debug |
| **3.9** | `dict \|=` merge, `list[str]` type hints (no need for `List`), `str.removeprefix/removesuffix` |
| **3.10** | `match/case` (structural pattern matching), `X \| Y` union type hints, parenthesized context managers |
| **3.11** | `ExceptionGroup`, `except*`, `asyncio.timeout()`, `tomllib`, `Self` type, `LiteralString`, ~25% faster |
| **3.12** | `@override`, `TypeVarTuple`, `Unpack`, `@dataclass(slots=True)`, improved error messages |
| **3.13** | Free-threaded CPython (PEP 703, experimental), JIT compiler (experimental), improved REPL |

---

# APPENDIX C — COMMON ALGORITHM COMPLEXITIES IN PYTHON

| Data Structure | Operation | Average | Worst |
|----------------|-----------|---------|-------|
| `list` | append | O(1)* | O(n) |
| `list` | insert(0, x) | O(n) | O(n) |
| `list` | pop() | O(1)* | O(1) |
| `list` | pop(0) | O(n) | O(n) |
| `list` | `x in list` | O(n) | O(n) |
| `list` | sort() | O(n log n) | O(n log n) |
| `list` | slice `[i:j]` | O(k) | O(k) |
| `dict` | get/set/del | O(1) | O(n)† |
| `dict` | `x in dict` | O(1) | O(n)† |
| `dict` | copy | O(n) | O(n) |
| `set` | add/remove | O(1) | O(n)† |
| `set` | `x in set` | O(1) | O(n)† |
| `set` | union `\|` | O(n+m) | O(n+m) |
| `set` | intersection `&` | O(min(n,m)) | O(n·m) |
| `deque` | appendleft/popleft | O(1) | O(1) |
| `deque` | access middle | O(n) | O(n) |
| `heapq` | heappush/pop | O(log n) | O(log n) |
| `heapq` | heapify | O(n) | O(n) |
| `str` | len() | O(1) | O(1) |
| `str` | `x in str` | O(n) | O(n) |
| `str` | join(list) | O(n) | O(n) |
| `str` | `+` | O(n) | O(n) |

> `*` amortized — occasional O(n) reallocation  
> `†` Hash collisions degrade to O(n) — extremely rare in practice

---

# APPENDIX D — STRUCTURAL PATTERN MATCHING (Python 3.10+)

```python
# match/case — structural pattern matching
def process_command(command):
    match command.split():
        case ["quit"]:
            return "Quitting"
        case ["go", direction]:
            return f"Going {direction}"
        case ["go", direction, speed] if speed in ("fast", "slow"):
            return f"Going {direction} at {speed} speed"
        case ["pick", "up", item]:
            return f"Picking up {item}"
        case _:
            return f"Unknown command: {command}"

# Matching data structures
def describe(point):
    match point:
        case (0, 0):
            return "Origin"
        case (x, 0):
            return f"X-axis at {x}"
        case (0, y):
            return f"Y-axis at {y}"
        case (x, y):
            return f"Point at ({x}, {y})"

# Matching class instances
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

def classify(shape):
    match shape:
        case Point(x=0, y=0):
            return "origin"
        case Point(x=x, y=0):
            return f"x-axis point at {x}"
        case Point(x=0, y=y):
            return f"y-axis point at {y}"
        case Point():
            return "some point"
        case _:
            return "not a point"

# Matching with guards
match value:
    case int(n) if n < 0:
        print("negative int")
    case int(n) if n == 0:
        print("zero")
    case int(n):
        print(f"positive int: {n}")
    case float(f):
        print(f"float: {f}")
    case str(s) if len(s) > 10:
        print("long string")
    case [*items] if len(items) > 5:
        print(f"long list: {len(items)} items")
```

---

# APPENDIX E — DATACLASSES IN DEPTH

```python
from dataclasses import dataclass, field, asdict, astuple, replace, fields
from typing import ClassVar

@dataclass(order=True, frozen=True)
class Point:
    # frozen=True: immutable, generates __hash__
    # order=True: generates __lt__, __le__, __gt__, __ge__
    x: float
    y: float

    def distance_from_origin(self) -> float:
        return (self.x**2 + self.y**2) ** 0.5

@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    tags: list[str] = field(default_factory=list)  # mutable default!
    _internal: str = field(default="", repr=False, compare=False)

    # Class variable — not a dataclass field
    instances: ClassVar[int] = 0

    def __post_init__(self):
        # Called after __init__ — validation, derived fields
        Config.instances += 1
        if self.port < 1 or self.port > 65535:
            raise ValueError(f"Invalid port: {self.port}")
        object.__setattr__(self, "host", self.host.lower())

# Utility functions
cfg = Config(host="LOCALHOST", port=8080, tags=["web", "api"])
asdict(cfg)       # → {"host": "localhost", "port": 8080, "tags": [...]}
astuple(cfg)      # → ("localhost", 8080, ["web", "api"], "")
replace(cfg, port=9090)  # creates modified copy (like named tuple _replace)
fields(cfg)       # → tuple of Field objects with metadata

# @dataclass(slots=True) — Python 3.10+
@dataclass(slots=True)
class SlottedPoint:
    x: float
    y: float
# Automatically generates __slots__ = ('x', 'y')
```

---

# APPENDIX F — COMMON INTERVIEW CODE PATTERNS

```python
# --- Fibonacci variants ---

# Recursive with memoization
from functools import lru_cache
@lru_cache(maxsize=None)
def fib(n: int) -> int:
    if n < 2: return n
    return fib(n-1) + fib(n-2)

# Iterative — O(1) space
def fib_iter(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

# Generator — infinite sequence
def fib_gen():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# --- Two-pointer ---
def two_sum_sorted(nums: list[int], target: int) -> tuple[int, int]:
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target: return left, right
        elif s < target: left += 1
        else: right -= 1
    return -1, -1

# --- Sliding window ---
def max_sum_subarray(nums: list[int], k: int) -> int:
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        max_sum = max(max_sum, window_sum)
    return max_sum

# --- BFS / DFS on graph ---
from collections import deque

def bfs(graph: dict[str, list[str]], start: str) -> list[str]:
    visited = set()
    queue = deque([start])
    order = []
    while queue:
        node = queue.popleft()
        if node in visited: continue
        visited.add(node)
        order.append(node)
        queue.extend(graph.get(node, []))
    return order

def dfs(graph: dict[str, list[str]], start: str) -> list[str]:
    visited = set()
    order = []
    def _dfs(node):
        if node in visited: return
        visited.add(node)
        order.append(node)
        for neighbor in graph.get(node, []):
            _dfs(neighbor)
    _dfs(start)
    return order

# --- Binary search ---
def binary_search(arr: list[int], target: int) -> int:
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2   # avoids overflow (though not needed in Python)
        if arr[mid] == target: return mid
        elif arr[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1

# --- Anagram check ---
from collections import Counter
def is_anagram(s: str, t: str) -> bool:
    return Counter(s) == Counter(t)

# --- Valid parentheses ---
def is_valid(s: str) -> bool:
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack[-1] != pairs[ch]:
            return False
        else:
            stack.pop()
    return not stack

# --- Merge intervals ---
def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
```

---

*END OF PYTHON RAG KNOWLEDGE BASE DOCUMENT*