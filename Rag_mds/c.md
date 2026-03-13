# C — FULL-SPECTRUM RAG KNOWLEDGE BASE

> Structured for AI Interviewer · Three-Level Contextual Model · Junior → Mid → Senior  
> Topics: Core Syntax · Pointers · Memory Management · Data Structures · Preprocessor · Compilation · Concurrency · Systems Programming · Undefined Behavior · Performance · Embedded · OS Internals · Secure Coding

---

# SECTION 1 · CORE SYNTAX & LANGUAGE FUNDAMENTALS

> `[JUNIOR]` Variables, types, operators, control flow, functions

---

## 1.1 Data Types and Storage Classes

```c
/* Fundamental types — sizes are platform-dependent (use stdint.h for fixed sizes) */
char     c = 'A';       /* 1 byte, signed or unsigned (implementation-defined) */
short    s = 100;       /* at least 16 bits */
int      i = 42;        /* at least 16 bits, usually 32 on modern platforms */
long     l = 100000L;   /* at least 32 bits */
long long ll = 1LL << 40; /* at least 64 bits */
float    f = 3.14f;     /* IEEE 754 single precision */
double   d = 3.14159;   /* IEEE 754 double precision */
long double ld = 3.14L; /* extended precision (80-bit on x86) */
_Bool    b = 1;         /* C99; use stdbool.h for bool/true/false */

/* Fixed-width types — always use these for portability */
#include <stdint.h>
int8_t   i8  = -127;
uint8_t  u8  = 255;
int16_t  i16 = -32768;
uint16_t u16 = 65535;
int32_t  i32 = -2147483648;
uint32_t u32 = 4294967295U;
int64_t  i64 = -9223372036854775807LL;
uint64_t u64 = 18446744073709551615ULL;

/* intptr_t / uintptr_t — integer type guaranteed to hold a pointer */
intptr_t  ip = (intptr_t)some_pointer;
uintptr_t up = (uintptr_t)some_pointer;

/* size_t — result of sizeof, array indexing, memory sizes */
size_t n = sizeof(int);        /* always unsigned */
ssize_t sn = read(fd, buf, n); /* signed size, POSIX */

/* ptrdiff_t — difference between two pointers */
ptrdiff_t diff = ptr2 - ptr1;
```

```c
/* Storage classes */
auto int x = 5;       /* default for local vars, stack-allocated */
register int r = 0;   /* hint to compiler: use register (often ignored today) */
static int s = 0;     /* persists across function calls; file-scope = internal linkage */
extern int g;         /* declares variable defined in another translation unit */

/* Type qualifiers */
const int MAX = 100;          /* value cannot be modified */
volatile int hw_reg = 0;      /* compiler must not optimize away reads/writes */
restrict int *p;               /* C99: pointer is the only alias to the memory (optimization hint) */
_Atomic int counter = 0;      /* C11: atomic operations, no data race */

/* const correctness */
const int *ptr1;        /* pointer to const int — can't modify *ptr1 */
int *const ptr2 = &x;   /* const pointer to int — can't modify ptr2 itself */
const int *const ptr3;  /* const pointer to const int — neither modifiable */
```

---

## 1.2 Operators and Expressions

```c
/* Arithmetic */
int a = 10, b = 3;
a / b    /* → 3   (integer division truncates toward zero) */
a % b    /* → 1   (modulo; result sign matches dividend in C99+) */
-7 % 3   /* → -1  in C99+ (NOT 2!) */

/* Bitwise operators — essential for systems programming */
a & b    /* AND  — 1010 & 0011 = 0010 */
a | b    /* OR   — 1010 | 0011 = 1011 */
a ^ b    /* XOR  — 1010 ^ 0011 = 1001 */
~a       /* NOT  — ~1010 = ...11110101 (bitwise complement) */
a << 2   /* left shift by 2 = multiply by 4 */
a >> 1   /* right shift by 1; for signed: arithmetic shift (impl-defined in C, well-defined in C99 for non-negative) */

/* Common bit tricks */
x & (x - 1)        /* clear lowest set bit */
x & (-x)           /* isolate lowest set bit */
x | (x - 1)        /* set all bits below lowest set bit */
!(x & (x - 1))     /* check if x is a power of 2 (x > 0) */
(x ^ y) < 0        /* check if x and y have different signs */

/* Compound assignment */
a += 5; a -= 3; a *= 2; a /= 4; a %= 3;
a &= 0xFF; a |= 0x01; a ^= 0x10; a <<= 2; a >>= 1;

/* Comma operator — evaluates left, discards, returns right */
int v = (a = 3, b = 4, a + b);   /* v = 7 */

/* Ternary */
int max = (a > b) ? a : b;

/* sizeof — evaluated at compile time (mostly) */
sizeof(int)      /* size in bytes */
sizeof arr       /* size of whole array (NOT pointer!) */
sizeof arr / sizeof arr[0]  /* number of elements */

/* Sequence points and UB */
/* UNDEFINED: i = i++;  or  a[i] = i++ */
/* OK: i++; j = i;  or use comma operator carefully */
```

---

## 1.3 Control Flow

```c
/* switch — fall-through is intentional, always add break or comment */
switch (cmd) {
    case 'q':
        quit();
        break;
    case 'h':
    case '?':              /* fall-through intentional */
        help();
        break;
    default:
        fprintf(stderr, "Unknown command: %c\n", cmd);
        break;
}

/* Labeled break via goto — only legitimate goto use in C */
for (int i = 0; i < N; i++) {
    for (int j = 0; j < M; j++) {
        if (matrix[i][j] == target)
            goto found;
    }
}
found:
    printf("Found or not found\n");

/* do-while — always executes body at least once */
do {
    c = getchar();
} while (c != '\n' && c != EOF);
```

---

## 1.4 Functions

```c
/* Function declaration vs definition */
int add(int a, int b);          /* declaration (prototype) */
int add(int a, int b) {         /* definition */
    return a + b;
}

/* Variadic functions */
#include <stdarg.h>
int sum(int count, ...) {
    va_list args;
    va_start(args, count);
    int total = 0;
    for (int i = 0; i < count; i++)
        total += va_arg(args, int);
    va_end(args);
    return total;
}
sum(3, 10, 20, 30);   /* → 60 */

/* Inline functions (C99) */
static inline int max(int a, int b) {
    return a > b ? a : b;
}

/* Function pointers */
int (*fp)(int, int) = add;   /* pointer to function taking 2 ints, returning int */
fp(3, 4);                    /* call through pointer */

/* Array of function pointers — dispatch table */
typedef int (*handler_t)(const char *);
handler_t handlers[256] = {0};
handlers['q'] = quit_handler;
handlers['h'] = help_handler;

/* Passing functions to other functions */
void qsort(void *base, size_t nmemb, size_t size,
           int (*compar)(const void *, const void *));

int cmp_int(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);   /* WARNING: can overflow for extreme values */
    /* Safe version: */
    int x = *(int*)a, y = *(int*)b;
    return (x > y) - (x < y);
}
int arr[] = {5, 3, 1, 4, 2};
qsort(arr, 5, sizeof(int), cmp_int);
```

---

## 1.5 Arrays and Strings

```c
/* Arrays */
int a[5] = {1, 2, 3, 4, 5};
int b[5] = {0};            /* zero-initialize all elements */
int c[] = {1, 2, 3};       /* size inferred: 3 */
int matrix[3][4] = {{0}};  /* 2D array, zero-initialized */

/* Array decay to pointer */
void func(int *arr, size_t n);  /* array passed as pointer — size lost */
func(a, 5);

/* Variable-length arrays (VLAs) — C99, optional in C11, avoid in practice */
void fill(int n, int arr[n]) { /* VLA parameter */ }

/* Strings — null-terminated char arrays */
char str1[] = "hello";       /* {'h','e','l','l','o','\0'} — on stack */
char *str2 = "hello";        /* pointer to string literal — READ ONLY */
/* str2[0] = 'H';  ← UNDEFINED BEHAVIOR — string literal in rodata */

/* Safe string operations */
#include <string.h>
size_t len = strlen(str1);           /* O(n) — counts to null terminator */
strcpy(dest, src);                   /* UNSAFE: no bounds check */
strncpy(dest, src, sizeof(dest)-1);  /* safer but doesn't guarantee null termination */
dest[sizeof(dest)-1] = '\0';         /* always null-terminate manually */

/* Preferred: use snprintf for safe string building */
char buf[256];
snprintf(buf, sizeof(buf), "Hello, %s! You are %d.", name, age);

/* strtok — modifies the string, not reentrant */
char line[] = "a,b,c,d";
char *token = strtok(line, ",");
while (token != NULL) {
    printf("%s\n", token);
    token = strtok(NULL, ",");  /* continue parsing same string */
}
/* Reentrant version: strtok_r (POSIX) */
char *saveptr;
token = strtok_r(line, ",", &saveptr);

/* String comparison */
strcmp(s1, s2)    /* 0 if equal, <0 if s1<s2, >0 if s1>s2 */
strncmp(s1, s2, n) /* compare first n chars */
strcasecmp(s1, s2) /* case-insensitive (POSIX) */
```

---

# SECTION 2 · POINTERS — THE HEART OF C

> `[JUNIOR]` Basic pointer syntax, address-of, dereference  
> `[MID]` Pointer arithmetic, arrays of pointers, function pointers  
> `[SENIOR]` Aliasing, restrict, pointer provenance, void*, generic functions

---

## 2.1 Pointer Basics and Arithmetic

```c
int x = 42;
int *p = &x;       /* p holds address of x */
*p = 100;          /* dereference: x is now 100 */
printf("%p\n", (void*)p);  /* print address; cast to void* for printf */

/* Pointer arithmetic — operates in units of pointed-to type */
int arr[] = {10, 20, 30, 40, 50};
int *p = arr;      /* points to arr[0] */
*(p + 2)           /* → 30, same as arr[2] */
p++;               /* p now points to arr[1] */
p += 3;            /* p now points to arr[4] */

/* Pointer difference — result is ptrdiff_t */
int *end = arr + 5;
ptrdiff_t count = end - arr;   /* → 5 */

/* Pointer comparison */
p < end   /* valid if both point into same array (or one past end) */

/* NULL pointer */
int *null_ptr = NULL;   /* 0-value pointer, comparing to NULL is valid */
if (null_ptr != NULL) { /* always check before dereferencing */ }
/* Dereferencing NULL → undefined behavior (usually segfault) */

/* void pointer — generic pointer, no arithmetic allowed */
void *vp = malloc(100);
int *ip = (int*)vp;     /* explicit cast required */
memcpy(vp, src, 100);   /* memcpy/memset work with void* */
```

---

## 2.2 Pointer to Pointer, Arrays of Pointers

```c
/* Pointer to pointer */
int x = 5;
int *p = &x;
int **pp = &p;
**pp = 10;         /* x is now 10 */

/* Common use: modify pointer from within function */
void allocate(int **ptr, int size) {
    *ptr = malloc(size * sizeof(int));
}
int *arr = NULL;
allocate(&arr, 10);

/* Array of strings */
const char *colors[] = {"red", "green", "blue"};
colors[1]          /* → "green" */
colors[1][0]       /* → 'g' */

/* argv — classic array of pointers to strings */
int main(int argc, char *argv[]) {
    /* argv[0] = program name, argv[argc] = NULL sentinel */
    for (int i = 1; i < argc; i++)
        printf("arg[%d] = %s\n", i, argv[i]);
    return 0;
}

/* Pointer to array (vs array of pointers) */
int arr[5] = {1,2,3,4,5};
int (*p_arr)[5] = &arr;   /* pointer to array of 5 ints */
(*p_arr)[2]               /* → 3 */

/* 2D array passing — preserves column dimension */
void process(int (*grid)[4], int rows) { /* pointer to array of 4 ints */ }
int matrix[3][4];
process(matrix, 3);
```

---

## 2.3 const Correctness with Pointers

```c
int x = 10;
const int cx = 20;

int *p1 = &x;              /* mutable ptr to mutable int */
const int *p2 = &x;        /* mutable ptr to const int (can't change *p2) */
const int *p3 = &cx;       /* must use this for const objects */
int *const p4 = &x;        /* const ptr to mutable int (can't change p4) */
const int *const p5 = &cx; /* const ptr to const int */

/* Function parameters — use const for input-only pointers */
size_t strlen_safe(const char *s) {
    size_t len = 0;
    while (*s++) len++;
    return len;
}

/* const-correct linked list traversal */
const struct Node *find(const struct Node *head, int val) {
    while (head && head->val != val)
        head = head->next;
    return head;
}
```

---

## 2.4 Strict Aliasing and restrict

> `[SENIOR]` Critical for understanding compiler optimizations and subtle bugs

```c
/*
 * Strict aliasing rule (C99): compiler assumes two pointers of different types
 * do NOT alias (point to same memory). Violating this is UB.
 * Exception: char* can alias anything.
 */

/* UNDEFINED BEHAVIOR — type punning via pointer cast */
float f = 3.14f;
int i = *(int*)&f;   /* UB: violates strict aliasing */

/* CORRECT — use memcpy or union for type punning */
float f = 3.14f;
int i;
memcpy(&i, &f, sizeof(f));   /* well-defined */

/* Union type punning (C99 allows this, C++ does not) */
union FloatBits {
    float f;
    uint32_t bits;
} u = {.f = 3.14f};
uint32_t bits = u.bits;   /* valid in C */

/*
 * restrict (C99): promise to compiler that this pointer is the ONLY way
 * to access the pointed-to memory in this scope.
 * Enables vectorization and other optimizations.
 */
void vec_add(float *restrict dst,
             const float *restrict src1,
             const float *restrict src2,
             size_t n) {
    for (size_t i = 0; i < n; i++)
        dst[i] = src1[i] + src2[i];
    /* compiler can now vectorize without alias analysis */
}
/* memcpy signature uses restrict: */
void *memcpy(void *restrict dest, const void *restrict src, size_t n);
/* memmove does NOT use restrict — handles overlapping regions */
```

---

# SECTION 3 · MEMORY MANAGEMENT

> `[JUNIOR]` malloc/free, stack vs heap  
> `[MID]` Memory layout, alignment, custom allocators  
> `[SENIOR]` Allocator internals, memory pools, arena allocators, valgrind, sanitizers

---

## 3.1 Stack vs Heap

```c
/*
 * STACK: automatic storage duration
 * - Allocated/freed automatically at scope entry/exit
 * - Fast: just moves stack pointer
 * - Limited size (typically 1-8 MB)
 * - Cannot return pointer to local variable
 */
void func() {
    int x = 42;          /* stack */
    char buf[1024];      /* stack — 1KB */
    int arr[100];        /* stack — 400 bytes */
}   /* all freed here */

/* DANGER: returning pointer to local */
int *bad(void) {
    int x = 10;
    return &x;   /* UNDEFINED BEHAVIOR — x is gone after return */
}

/*
 * HEAP: dynamic storage duration
 * - Allocated with malloc/calloc/realloc, freed with free
 * - Persists until explicitly freed
 * - Larger (limited by virtual address space)
 * - Slower (bookkeeping, fragmentation)
 */
int *good(void) {
    int *p = malloc(sizeof(int));
    if (p == NULL) return NULL;   /* ALWAYS check malloc return */
    *p = 10;
    return p;   /* caller must free */
}
```

---

## 3.2 malloc, calloc, realloc, free

```c
#include <stdlib.h>

/* malloc — allocates size bytes, uninitialized */
int *arr = malloc(n * sizeof(int));
if (arr == NULL) { perror("malloc"); exit(EXIT_FAILURE); }

/* calloc — allocates n*size bytes, zero-initialized */
int *zeroed = calloc(n, sizeof(int));

/* realloc — resize allocation */
int *bigger = realloc(arr, 2*n * sizeof(int));
if (bigger == NULL) {
    /* arr is still valid — don't overwrite arr before checking */
    free(arr);
    return NULL;
}
arr = bigger;

/* free — release memory; sets variable to NULL to avoid dangling pointer */
free(arr);
arr = NULL;   /* defensive: prevents double-free or use-after-free UB */

/* Common mistakes */
/* 1. Memory leak — forgetting to free */
void leak() {
    int *p = malloc(100);
    return;   /* p leaked */
}

/* 2. Double free — UB, usually crashes */
free(p);
free(p);   /* UB */

/* 3. Use after free — UB */
free(p);
*p = 5;    /* UB */

/* 4. Buffer overflow — UB */
int *a = malloc(5 * sizeof(int));
a[5] = 1;  /* UB — out of bounds */

/* 5. Mismatched malloc/free */
int arr_stack[10];
free(arr_stack);   /* UB — not a heap pointer */

/* sizeof idiom — correct and type-safe */
int *p = malloc(n * sizeof *p);   /* sizeof *p = sizeof(int), no cast needed in C */
```

---

## 3.3 Memory Layout of a C Program

```
High address
┌─────────────────────────────┐
│  Kernel space (not mapped)  │
├─────────────────────────────┤
│  Stack  (grows downward ↓)  │  local variables, return addresses, args
│  ...                        │
│                             │
│  ...                        │
│  Heap   (grows upward ↑)    │  malloc/calloc/realloc
├─────────────────────────────┤
│  BSS segment                │  uninitialized global/static vars (zero-filled)
├─────────────────────────────┤
│  Data segment               │  initialized global/static vars
├─────────────────────────────┤
│  Text segment (rodata)      │  machine code, string literals (read-only)
└─────────────────────────────┘
Low address

Segment details:
- text:  read-only, executable; string literals live here
- data:  read-write; int global = 5; lives here
- bss:   read-write; int global; lives here (no space in file, zero at runtime)
- heap:  managed by allocator (ptmalloc2, jemalloc, tcmalloc, etc.)
- stack: managed by CPU/OS; each thread gets its own stack
```

---

## 3.4 Alignment and padding

```c
/* Struct padding — compiler inserts padding to satisfy alignment */
struct Padded {
    char  c;    /* 1 byte  + 3 bytes padding */
    int   i;    /* 4 bytes */
    char  c2;   /* 1 byte  + 7 bytes padding */
    double d;   /* 8 bytes */
};  /* total: 24 bytes (not 14) */

struct Packed {
    double d;   /* 8 bytes */
    int    i;   /* 4 bytes */
    char   c;   /* 1 byte  + 3 bytes padding */
    char   c2;  /* in same padding area */
};  /* total: 16 bytes — reordering saves 8 bytes! */

/* __attribute__((packed)) — disable padding (use with care: unaligned access = UB/slow) */
struct __attribute__((packed)) Wire {
    uint8_t  type;
    uint32_t length;
    uint8_t  data[1];
};

/* Alignment queries */
#include <stdalign.h>
alignof(double)           /* typically 8 */
_Alignas(16) float vec[4]; /* align to 16-byte boundary (SIMD) */

/* aligned_alloc (C11) */
void *buf = aligned_alloc(64, 1024);  /* 64-byte aligned, 1024-byte buffer */
free(buf);

/* posix_memalign (POSIX) */
void *ptr;
posix_memalign(&ptr, 64, 1024);
```

---

## 3.5 Memory Pool and Arena Allocator

> `[SENIOR]` Zero-overhead allocation for performance-critical code

```c
/* Arena allocator — bump pointer, no individual frees */
typedef struct Arena {
    uint8_t *base;
    size_t   used;
    size_t   capacity;
} Arena;

Arena arena_create(size_t capacity) {
    return (Arena){
        .base     = malloc(capacity),
        .used     = 0,
        .capacity = capacity,
    };
}

void *arena_alloc(Arena *a, size_t size, size_t align) {
    /* round up used to alignment */
    size_t aligned = (a->used + align - 1) & ~(align - 1);
    if (aligned + size > a->capacity) return NULL;
    a->used = aligned + size;
    return a->base + aligned;
}

void arena_reset(Arena *a) { a->used = 0; }   /* O(1) free all */
void arena_destroy(Arena *a) { free(a->base); a->base = NULL; }

/* Usage — entire request/frame processed, then reset */
Arena frame_arena = arena_create(1024 * 1024);   /* 1MB */
MyStruct *s = arena_alloc(&frame_arena, sizeof(MyStruct), alignof(MyStruct));
int *data    = arena_alloc(&frame_arena, 1000 * sizeof(int), alignof(int));
/* ... process ... */
arena_reset(&frame_arena);   /* free everything in one shot */

/* Object pool — fixed-size, O(1) alloc/free */
#define POOL_SIZE 1024
typedef struct Pool {
    char   buf[POOL_SIZE][sizeof(MyObj)];
    int    free_list[POOL_SIZE];
    int    free_head;
    int    count;
} Pool;

void pool_init(Pool *p) {
    p->free_head = 0;
    for (int i = 0; i < POOL_SIZE - 1; i++)
        p->free_list[i] = i + 1;
    p->free_list[POOL_SIZE-1] = -1;
}

MyObj *pool_alloc(Pool *p) {
    if (p->free_head == -1) return NULL;
    int idx = p->free_head;
    p->free_head = p->free_list[idx];
    return (MyObj*)p->buf[idx];
}

void pool_free(Pool *p, MyObj *obj) {
    int idx = (int)((char(*)[sizeof(MyObj)])obj - p->buf);
    p->free_list[idx] = p->free_head;
    p->free_head = idx;
}
```

---

## 3.6 Memory Debugging Tools

```c
/* Valgrind — detect memory errors at runtime */
/* valgrind --leak-check=full --track-origins=yes ./program */
/* Detects: memory leaks, use-after-free, use of uninitialized memory,
            double free, invalid reads/writes */

/* AddressSanitizer (ASan) — compile-time instrumentation, much faster */
/* gcc -fsanitize=address -fno-omit-frame-pointer -g */
/* Detects: heap/stack/global buffer overflow, use-after-free, use-after-scope */

/* UndefinedBehaviorSanitizer (UBSan) */
/* gcc -fsanitize=undefined */
/* Detects: signed integer overflow, null pointer dereference, misaligned access,
            invalid enum values, out-of-bounds array access */

/* ThreadSanitizer (TSan) */
/* gcc -fsanitize=thread */
/* Detects: data races, lock order violations */

/* MemorySanitizer (MSan) — clang only */
/* clang -fsanitize=memory */
/* Detects: use of uninitialized memory */

/* Typical debug build flags */
/* gcc -g -O0 -Wall -Wextra -Wpedantic \
        -fsanitize=address,undefined \
        -fno-omit-frame-pointer \
        -o program source.c */
```

---

# SECTION 4 · STRUCTS, UNIONS, ENUMS, AND BITFIELDS

> `[JUNIOR]` Struct declaration and access  
> `[MID]` Flexible array members, designated initializers, opaque types  
> `[SENIOR]` Tagged unions, bitfields, ABI stability, cache-line alignment

---

## 4.1 Structs

```c
/* Declaration and definition */
struct Point {
    double x;
    double y;
};

typedef struct Point Point;     /* avoid writing 'struct' everywhere */

/* Or combine: */
typedef struct {
    double x;
    double y;
} Vec2;

/* Initialization */
Vec2 v1 = {3.0, 4.0};                  /* positional */
Vec2 v2 = {.x = 3.0, .y = 4.0};       /* designated initializer (C99) */
Vec2 v3 = {0};                          /* zero-initialize all fields */
Vec2 v4 = (Vec2){.x = 1.0, .y = 2.0}; /* compound literal */

/* Access */
v1.x         /* direct member access */
Vec2 *pv = &v1;
pv->x        /* pointer member access (arrow = dereference + dot) */
(*pv).x      /* equivalent */

/* Struct copy — memberwise shallow copy */
Vec2 copy = v1;   /* entire struct copied */

/* Flexible array member (C99) — must be last member */
typedef struct {
    size_t len;
    int    data[];   /* flexible array member */
} IntArray;

IntArray *arr = malloc(sizeof(IntArray) + n * sizeof(int));
arr->len = n;
arr->data[0] = 42;
```

---

## 4.2 Unions

```c
/* Union — all members share the same memory */
typedef union {
    int    i;
    float  f;
    char   bytes[4];
} Word;

Word w;
w.i = 0x41424344;
printf("%c%c%c%c\n", w.bytes[0], w.bytes[1], w.bytes[2], w.bytes[3]);
/* Output depends on endianness */

/* Tagged union — the safe pattern for variant types */
typedef enum { TYPE_INT, TYPE_FLOAT, TYPE_STRING } Tag;

typedef struct {
    Tag tag;
    union {
        int    i;
        float  f;
        char  *s;
    } value;
} Variant;

void print_variant(const Variant *v) {
    switch (v->tag) {
        case TYPE_INT:    printf("int: %d\n",   v->value.i); break;
        case TYPE_FLOAT:  printf("float: %f\n", v->value.f); break;
        case TYPE_STRING: printf("str: %s\n",   v->value.s); break;
    }
}

/* Endianness detection via union */
union { uint32_t i; uint8_t b[4]; } endian = {0x01020304};
int is_big_endian = (endian.b[0] == 1);
```

---

## 4.3 Enums and Bitfields

```c
/* Enum */
typedef enum {
    STATE_IDLE    = 0,
    STATE_RUNNING = 1,
    STATE_PAUSED  = 2,
    STATE_DONE    = 3,
} State;
/* enum values are int in C; underlying type is implementation-defined */

/* Bit flags — use #define or enum with power-of-2 values */
typedef enum {
    PERM_NONE    = 0,
    PERM_READ    = 1 << 0,   /* 0x01 */
    PERM_WRITE   = 1 << 1,   /* 0x02 */
    PERM_EXEC    = 1 << 2,   /* 0x04 */
    PERM_ALL     = PERM_READ | PERM_WRITE | PERM_EXEC,
} Permission;

Permission p = PERM_READ | PERM_WRITE;
if (p & PERM_READ) { /* has read permission */ }
p |= PERM_EXEC;      /* grant execute */
p &= ~PERM_WRITE;    /* revoke write */
p ^= PERM_EXEC;      /* toggle execute */

/* Bitfields — pack multiple small values into one word */
typedef struct {
    unsigned int red   : 5;   /* 5 bits: 0-31 */
    unsigned int green : 6;   /* 6 bits: 0-63 */
    unsigned int blue  : 5;   /* 5 bits: 0-31 */
} RGB565;

RGB565 color = {.red = 31, .green = 0, .blue = 0};   /* red */

/* WARNING: bitfield layout (padding, ordering) is implementation-defined
   Never use bitfields for network protocols or file formats */
```

---

## 4.4 Opaque Types and Information Hiding

> `[MID/SENIOR]` Key pattern for C module encapsulation

```c
/* header: mymodule.h */
typedef struct MyHandle MyHandle;   /* opaque — clients see only pointer */

MyHandle *myhandle_create(const char *name);
int       myhandle_do(MyHandle *h, int value);
void      myhandle_destroy(MyHandle *h);

/* implementation: mymodule.c */
#include "mymodule.h"
struct MyHandle {
    char  name[64];
    int   state;
    FILE *log;
};

MyHandle *myhandle_create(const char *name) {
    MyHandle *h = calloc(1, sizeof *h);
    if (!h) return NULL;
    snprintf(h->name, sizeof h->name, "%s", name);
    return h;
}

void myhandle_destroy(MyHandle *h) {
    if (!h) return;
    if (h->log) fclose(h->log);
    free(h);
}
```

---

# SECTION 5 · PREPROCESSOR

> `[JUNIOR]` #include, #define, #ifdef  
> `[MID]` Macro pitfalls, X-macros, include guards  
> `[SENIOR]` Token pasting, stringification, computed includes, macro hygiene

---

## 5.1 Macros — Complete Reference

```c
/* Object-like macros */
#define PI 3.14159265358979323846
#define MAX_BUFFER 4096
#define VERSION "1.2.3"

/* Function-like macros — pitfalls */
#define SQUARE(x) x*x             /* WRONG: SQUARE(1+2) → 1+2*1+2 = 5, not 9 */
#define SQUARE(x) ((x)*(x))       /* BETTER: but evaluates x twice */
#define MAX(a,b)  ((a)>(b)?(a):(b))  /* evaluates a,b twice — bad for MAX(i++, j++) */

/* Safe macro hygiene */
#define SAFE_SQUARE(x) ({ __typeof__(x) _x = (x); _x * _x; })  /* GCC/Clang extension */
/* Or use inline functions — no double evaluation, type safe */

/* Stringification with # */
#define STRINGIFY(x) #x
STRINGIFY(hello)    /* → "hello" */
STRINGIFY(1+2)      /* → "1+2"   */

/* Token pasting with ## */
#define CONCAT(a, b) a##b
CONCAT(var, 1)      /* → var1 */
CONCAT(get_, name)  /* → get_name */

/* Multi-line macros — always use do { } while(0) */
#define LOG_ERROR(fmt, ...) do {                        \
    fprintf(stderr, "[ERROR] %s:%d: " fmt "\n",         \
            __FILE__, __LINE__, ##__VA_ARGS__);          \
} while(0)

/* Without do-while, if (x) LOG_ERROR("msg"); else foo(); breaks */

/* Variadic macros (C99) */
#define DEBUG(fmt, ...) fprintf(stderr, fmt "\n", ##__VA_ARGS__)
#define TRACE(...)      fprintf(stderr, __VA_ARGS__)

/* X-macro pattern — generate parallel code from one data source */
#define ERROR_CODES \
    X(OK,           0,  "Success")                \
    X(ERR_NOMEM,   -1,  "Out of memory")          \
    X(ERR_IO,      -2,  "I/O error")              \
    X(ERR_INVAL,   -3,  "Invalid argument")       \

/* Generate enum */
typedef enum {
#define X(name, val, msg) name = val,
    ERROR_CODES
#undef X
} ErrorCode;

/* Generate string table */
static const char *error_messages[] = {
#define X(name, val, msg) [name - (-3)] = msg,   /* adjust for negative values */
    ERROR_CODES
#undef X
};

/* Generate to_string function */
const char *error_to_string(ErrorCode e) {
    switch (e) {
#define X(name, val, msg) case name: return msg;
        ERROR_CODES
#undef X
        default: return "Unknown error";
    }
}
```

---

## 5.2 Conditional Compilation

```c
/* Include guards — prevent double inclusion */
#ifndef MYHEADER_H
#define MYHEADER_H
/* ... header content ... */
#endif /* MYHEADER_H */

/* #pragma once — non-standard but universally supported alternative */
#pragma once

/* Platform detection */
#ifdef _WIN32
    #define PLATFORM "Windows"
    #include <windows.h>
#elif defined(__APPLE__)
    #define PLATFORM "macOS"
    #include <sys/types.h>
#elif defined(__linux__)
    #define PLATFORM "Linux"
    #include <unistd.h>
#else
    #error "Unsupported platform"
#endif

/* Architecture detection */
#if defined(__x86_64__) || defined(_M_X64)
    #define ARCH_64BIT
#elif defined(__i386__) || defined(_M_IX86)
    #define ARCH_32BIT
#elif defined(__aarch64__)
    #define ARCH_ARM64
#endif

/* Compiler detection */
#if defined(__GNUC__) && !defined(__clang__)
    #define COMPILER_GCC
    #define GCC_VERSION (__GNUC__ * 10000 + __GNUC_MINOR__ * 100 + __GNUC_PATCHLEVEL__)
#elif defined(__clang__)
    #define COMPILER_CLANG
#elif defined(_MSC_VER)
    #define COMPILER_MSVC
#endif

/* Debug vs Release */
#ifdef NDEBUG
    #define ASSERT(x) ((void)0)   /* release: no-op */
#else
    #define ASSERT(x) do {                                    \
        if (!(x)) {                                           \
            fprintf(stderr, "Assertion failed: %s\n"         \
                    "  File: %s, Line: %d\n",                 \
                    #x, __FILE__, __LINE__);                  \
            abort();                                          \
        }                                                     \
    } while(0)
#endif

/* _Static_assert (C11) — compile-time assertions */
_Static_assert(sizeof(int) == 4, "Expected 32-bit int");
_Static_assert(sizeof(void*) >= 4, "Pointer must be at least 32 bits");
```

---

# SECTION 6 · COMPILATION MODEL AND LINKING

> `[MID]` Translation units, linkage, compilation pipeline  
> `[SENIOR]` ABI, symbol visibility, LTO, PIC/PIE, dynamic linking internals

---

## 6.1 Compilation Pipeline

```
Source file (.c)
    │
    ▼ Preprocessor (cpp)
    │  - Expand macros
    │  - Process #include, #ifdef, etc.
    │  - Remove comments
    │  → Produces: preprocessed source (.i)
    │
    ▼ Compiler (cc1)
    │  - Parse → AST
    │  - Semantic analysis
    │  - Optimization passes (O0/O1/O2/O3/Os/Oz)
    │  → Produces: assembly (.s)
    │
    ▼ Assembler (as)
    │  - Translate assembly → machine code
    │  - Unresolved symbols become relocations
    │  → Produces: object file (.o / .obj)
    │
    ▼ Linker (ld)
    │  - Combine object files
    │  - Resolve symbols (find definition for each use)
    │  - Relocate addresses
    │  - Link against libraries (.a / .so / .dll)
    │  → Produces: executable or shared library
```

```bash
# Explicit pipeline
gcc -E source.c -o source.i      # preprocess only
gcc -S source.i -o source.s      # compile to assembly
gcc -c source.s -o source.o      # assemble to object
gcc source.o -o program           # link

# Common compilation flags
gcc -std=c11          # C11 standard
gcc -Wall -Wextra     # enable warnings
gcc -Wpedantic        # strict standards compliance warnings
gcc -Werror           # treat warnings as errors
gcc -O2               # optimization level 2
gcc -g                # include debug info (DWARF)
gcc -pg               # enable gprof profiling
gcc -march=native     # optimize for current CPU
gcc -fPIC             # position-independent code (for .so)
gcc -shared           # build shared library
gcc -static           # link statically
gcc -flto             # link-time optimization
```

---

## 6.2 Linkage and Scope

```c
/* Linkage rules */

/* External linkage — visible across all translation units */
int global_var = 0;              /* external by default */
void public_func(void) { }       /* external by default */
extern int other_file_var;       /* declaration of external variable */

/* Internal linkage — visible only within translation unit */
static int file_private = 0;    /* static at file scope = internal linkage */
static void helper(void) { }    /* not visible to other .c files */

/* No linkage — local variables */
void func(void) {
    int local = 0;        /* no linkage */
    static int persist;   /* no linkage BUT static storage duration */
}

/* Inline functions in headers */
/* C99: inline without static → external linkage, must have exactly one extern definition */
/* Best practice: static inline in headers */
static inline int square(int x) { return x * x; }

/* Symbol visibility (GCC/Clang extension) */
__attribute__((visibility("default")))  void exported(void);    /* ELF default */
__attribute__((visibility("hidden")))   void internal_use(void); /* not exported */

/* Or use a visibility macro in headers */
#ifdef BUILDING_MYLIB
    #define API __attribute__((visibility("default")))
#else
    #define API
#endif
API void mylib_func(void);
```

---

## 6.3 Static and Dynamic Libraries

```bash
# Create static library (.a)
gcc -c module1.c -o module1.o
gcc -c module2.c -o module2.o
ar rcs libmylib.a module1.o module2.o
# Link: gcc main.c -L. -lmylib -o program

# Create shared library (.so)
gcc -fPIC -c module.c -o module.o
gcc -shared -o libmylib.so module.o
# Link: gcc main.c -L. -lmylib -Wl,-rpath,. -o program
# Runtime: LD_LIBRARY_PATH=. ./program
# Or: ldconfig

# Inspect objects
nm libmylib.a          # list symbols
objdump -d program     # disassemble
readelf -a program     # ELF headers, sections, symbols
ldd program            # list dynamic dependencies
```

---

# SECTION 7 · DATA STRUCTURES IN C

> `[JUNIOR]` Arrays, basic linked list  
> `[MID]` Generic containers, hash tables, trees  
> `[SENIOR]` Cache-conscious design, intrusive lists, lock-free structures

---

## 7.1 Linked Lists

```c
/* Singly linked list */
typedef struct Node {
    int          data;
    struct Node *next;
} Node;

/* Prepend — O(1) */
Node *prepend(Node *head, int val) {
    Node *n = malloc(sizeof *n);
    if (!n) return head;
    n->data = val;
    n->next = head;
    return n;
}

/* Append — O(n) without tail pointer */
Node *append(Node *head, int val) {
    Node *n = malloc(sizeof *n);
    if (!n) return head;
    n->data = val; n->next = NULL;
    if (!head) return n;
    Node *cur = head;
    while (cur->next) cur = cur->next;
    cur->next = n;
    return head;
}

/* Delete node by value — O(n) */
Node *delete_val(Node *head, int val) {
    Node dummy = {0, head};
    Node *prev = &dummy;
    while (prev->next) {
        if (prev->next->data == val) {
            Node *to_free = prev->next;
            prev->next = to_free->next;
            free(to_free);
            break;
        }
        prev = prev->next;
    }
    return dummy.next;
}

/* Reverse — O(n) */
Node *reverse(Node *head) {
    Node *prev = NULL, *curr = head, *next;
    while (curr) {
        next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

/* Intrusive list — node embedded in the data structure */
typedef struct ListNode {
    struct ListNode *prev;
    struct ListNode *next;
} ListNode;

typedef struct {
    int      id;
    char     name[64];
    ListNode list_node;   /* intrusive link */
} Employee;

/* Get container from embedded node — Linux kernel style */
#define container_of(ptr, type, member) \
    ((type*)((char*)(ptr) - offsetof(type, member)))

Employee *emp = container_of(node_ptr, Employee, list_node);
```

---

## 7.2 Hash Table

```c
/* Open addressing with linear probing */
#define HT_CAPACITY 1024
#define HT_LOAD_MAX 0.7

typedef struct {
    char    *key;    /* NULL = empty, (char*)1 = tombstone */
    int      value;
} HTEntry;

typedef struct {
    HTEntry *entries;
    size_t   capacity;
    size_t   count;
} HashTable;

/* FNV-1a hash function */
static uint32_t hash_fnv1a(const char *key) {
    uint32_t h = 2166136261u;
    while (*key) {
        h ^= (uint8_t)*key++;
        h *= 16777619u;
    }
    return h;
}

HTEntry *ht_find(HashTable *ht, const char *key) {
    uint32_t h = hash_fnv1a(key) % ht->capacity;
    for (size_t i = 0; i < ht->capacity; i++) {
        size_t idx = (h + i) % ht->capacity;
        HTEntry *e = &ht->entries[idx];
        if (e->key == NULL) return NULL;            /* empty: not found */
        if (e->key == (char*)1) continue;           /* tombstone: skip */
        if (strcmp(e->key, key) == 0) return e;     /* found */
    }
    return NULL;
}

void ht_insert(HashTable *ht, const char *key, int value) {
    if ((double)ht->count / ht->capacity > HT_LOAD_MAX)
        ht_resize(ht, ht->capacity * 2);
    uint32_t h = hash_fnv1a(key) % ht->capacity;
    for (size_t i = 0; i < ht->capacity; i++) {
        size_t idx = (h + i) % ht->capacity;
        HTEntry *e = &ht->entries[idx];
        if (e->key == NULL || e->key == (char*)1) {
            e->key = strdup(key);
            e->value = value;
            ht->count++;
            return;
        }
        if (strcmp(e->key, key) == 0) {
            e->value = value;
            return;
        }
    }
}
```

---

## 7.3 Generic Containers via void*

```c
/* Generic dynamic array */
typedef struct {
    void  *data;
    size_t count;
    size_t capacity;
    size_t elem_size;
} Vector;

Vector vec_create(size_t elem_size) {
    return (Vector){
        .data      = NULL,
        .count     = 0,
        .capacity  = 0,
        .elem_size = elem_size,
    };
}

void vec_push(Vector *v, const void *elem) {
    if (v->count >= v->capacity) {
        size_t new_cap = v->capacity ? v->capacity * 2 : 8;
        void *new_data = realloc(v->data, new_cap * v->elem_size);
        if (!new_data) { perror("realloc"); exit(1); }
        v->data = new_data;
        v->capacity = new_cap;
    }
    memcpy((char*)v->data + v->count * v->elem_size, elem, v->elem_size);
    v->count++;
}

void *vec_get(const Vector *v, size_t idx) {
    if (idx >= v->count) return NULL;
    return (char*)v->data + idx * v->elem_size;
}

/* Usage */
Vector v = vec_create(sizeof(int));
int x = 42;
vec_push(&v, &x);
int *p = vec_get(&v, 0);   /* → 42 */
```

---

# SECTION 8 · FILE I/O AND SYSTEM CALLS

> `[JUNIOR]` fopen/fclose/fread/fwrite  
> `[MID]` Buffered vs unbuffered I/O, error handling  
> `[SENIOR]` POSIX file descriptors, mmap, epoll, non-blocking I/O

---

## 8.1 Standard I/O (stdio)

```c
#include <stdio.h>
#include <errno.h>
#include <string.h>

/* Open/close */
FILE *f = fopen("file.txt", "r");   /* "r","w","a","rb","wb","r+","w+" */
if (!f) {
    fprintf(stderr, "fopen: %s\n", strerror(errno));
    return -1;
}
fclose(f);

/* Read/write */
char buf[256];
size_t n = fread(buf, 1, sizeof(buf), f);
fwrite(buf, 1, n, stdout);

/* Line-oriented */
char line[1024];
while (fgets(line, sizeof(line), f)) {
    line[strcspn(line, "\n")] = '\0';   /* strip newline */
    process(line);
}

/* Formatted I/O */
int x; float y; char s[32];
fscanf(f, "%d %f %31s", &x, &y, s);   /* always limit string width */
fprintf(f, "x=%d y=%.2f s=%s\n", x, y, s);

/* Binary I/O */
uint32_t header;
fread(&header, sizeof(header), 1, f);
/* NOTE: byte order (endianness) must be handled explicitly */
header = ntohl(header);   /* network to host byte order (POSIX) */

/* Seeking */
fseek(f, 0, SEEK_END);
long size = ftell(f);
fseek(f, 0, SEEK_SET);

/* In-memory I/O */
FILE *mem = fmemopen(buffer, sizeof(buffer), "r");  /* POSIX */

/* Error checking */
if (ferror(f)) { clearerr(f); /* or handle */ }
if (feof(f))   { /* end of file */ }
```

---

## 8.2 POSIX File Descriptors

```c
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>

/* Low-level open/read/write/close */
int fd = open("file.txt", O_RDONLY);
if (fd < 0) { perror("open"); return -1; }

char buf[4096];
ssize_t n;
while ((n = read(fd, buf, sizeof(buf))) > 0) {
    write(STDOUT_FILENO, buf, n);
}
if (n < 0) perror("read");
close(fd);

/* Creating/writing */
int fd = open("out.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);

/* Non-blocking I/O */
int fd = open("/dev/tty", O_RDWR | O_NONBLOCK);
int flags = fcntl(fd, F_GETFL);
fcntl(fd, F_SETFL, flags | O_NONBLOCK);

ssize_t n = read(fd, buf, sizeof(buf));
if (n < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) {
    /* no data available right now */
}

/* File descriptor duplication */
dup(fd)         /* duplicate fd to lowest available fd */
dup2(fd, 1)     /* duplicate fd to stdout */

/* File status */
struct stat st;
fstat(fd, &st);
st.st_size    /* file size */
st.st_mode    /* type and permissions */
S_ISREG(st.st_mode)   /* is regular file? */
S_ISDIR(st.st_mode)   /* is directory? */
```

---

## 8.3 Memory-Mapped Files (mmap)

> `[SENIOR]` Zero-copy I/O, shared memory, demand paging

```c
#include <sys/mman.h>
#include <sys/stat.h>

/* Map file into memory */
int fd = open("large_file.bin", O_RDONLY);
struct stat st;
fstat(fd, &st);

void *map = mmap(NULL, st.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
if (map == MAP_FAILED) { perror("mmap"); exit(1); }
close(fd);   /* fd can be closed after mmap */

/* Access directly as array — OS handles page faults */
uint8_t *data = map;
process_header(data, st.st_size);

/* Cleanup */
munmap(map, st.st_size);

/* Shared memory between processes */
int fd = shm_open("/myshm", O_CREAT | O_RDWR, 0600);
ftruncate(fd, 4096);
void *shm = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

/* mmap flags */
MAP_PRIVATE    /* copy-on-write — changes not written to file */
MAP_SHARED     /* changes written to file */
MAP_ANONYMOUS  /* not backed by file — zero-initialized anonymous memory */
MAP_HUGETLB    /* use huge pages (2MB/1GB) for large allocations */

/* POSIX — alternative to malloc for large blocks */
void *buf = mmap(NULL, size, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
/* munmap instead of free */

/* msync — flush changes to disk */
msync(map, length, MS_SYNC);     /* synchronous flush */
msync(map, length, MS_ASYNC);    /* asynchronous flush */

/* madvise — hint to kernel about access pattern */
madvise(map, length, MADV_SEQUENTIAL);   /* prefetch aggressively */
madvise(map, length, MADV_RANDOM);       /* no prefetch */
madvise(map, length, MADV_WILLNEED);     /* prefetch this range now */
madvise(map, length, MADV_DONTNEED);     /* page out this range */
```

---

# SECTION 9 · CONCURRENCY IN C

> `[MID]` pthreads, mutexes, condition variables  
> `[SENIOR]` Memory model (C11), atomics, lock-free programming, cache coherence

---

## 9.1 POSIX Threads (pthreads)

```c
#include <pthread.h>

/* Thread creation */
typedef struct { int id; double *data; size_t n; } ThreadArgs;

void *worker(void *arg) {
    ThreadArgs *a = arg;
    double sum = 0;
    for (size_t i = 0; i < a->n; i++) sum += a->data[i];
    double *result = malloc(sizeof(double));
    *result = sum;
    return result;
}

pthread_t tid;
ThreadArgs args = {.id=0, .data=data, .n=N};
int rc = pthread_create(&tid, NULL, worker, &args);
if (rc != 0) { fprintf(stderr, "pthread_create: %s\n", strerror(rc)); }

double *result;
pthread_join(tid, (void**)&result);
printf("Sum: %f\n", *result);
free(result);

/* Mutex — mutual exclusion */
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

pthread_mutex_lock(&lock);
/* critical section */
critical_section();
pthread_mutex_unlock(&lock);

/* Always unlock in error paths too */
void safe_func(void) {
    pthread_mutex_lock(&lock);
    if (error_condition) {
        pthread_mutex_unlock(&lock);   /* must unlock before return */
        return;
    }
    do_work();
    pthread_mutex_unlock(&lock);
}

/* Recursive mutex */
pthread_mutexattr_t attr;
pthread_mutexattr_init(&attr);
pthread_mutexattr_settype(&attr, PTHREAD_MUTEX_RECURSIVE);
pthread_mutex_t rlock;
pthread_mutex_init(&rlock, &attr);

/* Read-write lock */
pthread_rwlock_t rwlock = PTHREAD_RWLOCK_INITIALIZER;
pthread_rwlock_rdlock(&rwlock);    /* multiple readers allowed */
pthread_rwlock_wrlock(&rwlock);    /* exclusive writer */
pthread_rwlock_unlock(&rwlock);

/* Condition variable */
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t  cond  = PTHREAD_COND_INITIALIZER;
int             ready = 0;

/* Consumer */
pthread_mutex_lock(&mutex);
while (!ready)                       /* ALWAYS use while, not if */
    pthread_cond_wait(&cond, &mutex); /* atomically unlock + sleep */
do_work();
pthread_mutex_unlock(&mutex);

/* Producer */
pthread_mutex_lock(&mutex);
ready = 1;
pthread_cond_signal(&cond);   /* wake one waiter */
/* pthread_cond_broadcast(&cond);  wake all waiters */
pthread_mutex_unlock(&mutex);
```

---

## 9.2 C11 Atomics and Memory Model

> `[SENIOR]` Understanding memory ordering is critical for lock-free code

```c
#include <stdatomic.h>

/* Atomic types */
_Atomic int  counter = 0;
atomic_int   flag    = ATOMIC_VAR_INIT(0);
atomic_bool  running = ATOMIC_VAR_INIT(true);

/* Basic operations */
atomic_fetch_add(&counter, 1);   /* counter++ atomically */
atomic_fetch_sub(&counter, 1);   /* counter-- atomically */
atomic_load(&counter);           /* atomic read */
atomic_store(&counter, 0);       /* atomic write */
atomic_exchange(&flag, 1);       /* swap, return old value */

/* Compare-and-swap — the foundation of lock-free algorithms */
int expected = 0;
int desired  = 1;
/* Returns true if exchange succeeded */
bool ok = atomic_compare_exchange_strong(&flag, &expected, desired);
/* If failed, expected is updated with current value */

/* Memory ordering — controls visibility of OTHER memory operations */
atomic_load_explicit(&x, memory_order_relaxed);   /* no ordering guarantee */
atomic_load_explicit(&x, memory_order_acquire);   /* no reads/writes can move before */
atomic_store_explicit(&x, v, memory_order_release); /* no reads/writes can move after */
atomic_thread_fence(memory_order_seq_cst);          /* full fence */

/*
 * Memory order summary:
 * relaxed:   just atomicity, no ordering of surrounding ops
 * acquire:   reads after this can't be reordered before
 * release:   writes before this can't be reordered after
 * acq_rel:   both acquire and release
 * seq_cst:   total sequential consistency (default, most expensive)
 *
 * Typical pattern: store(release) in producer, load(acquire) in consumer
 * This creates a "happens-before" relationship across threads.
 */

/* Spinlock implemented with atomics */
typedef struct { atomic_flag locked; } Spinlock;

void spinlock_init(Spinlock *sl)    { atomic_flag_clear(&sl->locked); }
void spinlock_lock(Spinlock *sl)    {
    while (atomic_flag_test_and_set_explicit(&sl->locked, memory_order_acquire))
        ; /* spin — consider adding cpu_relax() / _mm_pause() for hyperthreading */
}
void spinlock_unlock(Spinlock *sl)  {
    atomic_flag_clear_explicit(&sl->locked, memory_order_release);
}

/* Lock-free stack (Treiber stack) */
typedef struct StackNode { int val; struct StackNode *next; } StackNode;
typedef struct { _Atomic(StackNode*) top; } LFStack;

void lf_push(LFStack *s, StackNode *n) {
    StackNode *old_top;
    do {
        old_top = atomic_load_explicit(&s->top, memory_order_relaxed);
        n->next = old_top;
    } while (!atomic_compare_exchange_weak_explicit(
        &s->top, &old_top, n,
        memory_order_release, memory_order_relaxed));
}

/* WARNING: ABA problem — CAS-based lock-free structures need careful design */
/* Solutions: tagged pointers, hazard pointers, RCU, epoch-based reclamation */
```

---

# SECTION 10 · UNDEFINED BEHAVIOR

> `[SENIOR]` UB is not just a bug — it gives the compiler license to do anything

---

## 10.1 Catalog of Undefined Behavior

```c
/*
 * Undefined Behavior (UB): the C standard places no constraints on what
 * happens. The compiler can assume UB never occurs and optimize accordingly.
 * This causes security vulnerabilities, silent data corruption, crashes.
 */

/* 1. Signed integer overflow — compiler assumes it never happens */
int max = INT_MAX;
int overflow = max + 1;   /* UB — may "optimize away" overflow checks */
/* Safe: use unsigned, or check before: if (max > INT_MAX - 1) handle_overflow(); */

/* 2. Null pointer dereference */
int *p = NULL;
*p = 5;   /* UB — usually SIGSEGV but not guaranteed */

/* 3. Use after free */
int *p = malloc(4); free(p); *p = 1;   /* UB */

/* 4. Buffer overflow */
int arr[5]; arr[5] = 0;   /* UB — out of bounds write */
int arr[5]; int x = arr[5];   /* UB — out of bounds read */

/* 5. Uninitialized local variable */
int x;
printf("%d\n", x);   /* UB — can be anything; MSan detects this */

/* 6. Strict aliasing violation */
float f = 3.14f;
int *ip = (int*)&f;   /* UB — type mismatch (except char*) */
*ip;                   /* UB */

/* 7. Data race (C11) */
/* Two threads reading and writing same variable without synchronization = UB */

/* 8. Modifying string literal */
char *s = "hello";
s[0] = 'H';   /* UB — string literals in rodata */

/* 9. Shifting by negative or >= width */
int x = 1;
x << -1;    /* UB */
x << 32;    /* UB for 32-bit int */
x << 31;    /* UB for signed int (result would overflow) */

/* 10. Division by zero */
int x = 5 / 0;   /* UB for integers; for floats: inf/nan (IEEE 754) */

/* 11. Left shift of negative number */
(-1) << 1;   /* UB */

/* 12. Pointer to local variable escapes scope */
int *bad(void) { int x = 5; return &x; }   /* UB when dereferenced */

/* 13. memcpy with overlapping src/dst */
int arr[10];
memcpy(arr, arr+1, 8);   /* UB — use memmove for overlapping */

/* 14. Calling free() on non-heap pointer */
int arr[10];
free(arr);   /* UB */

/* 15. Accessing union member other than last-written (C++) but OK in C */
```

---

## 10.2 Implementation-Defined Behavior

```c
/* Unlike UB, implementation-defined behavior is defined by the compiler,
   just not by the standard. Not portable. */

/* 1. Size of int, long, pointer */
sizeof(int)    /* 4 on most 32/64-bit systems, but could be 2 */
sizeof(long)   /* 4 on Windows 64-bit, 8 on Linux 64-bit */
sizeof(void*)  /* 4 on 32-bit, 8 on 64-bit */

/* 2. char signed-ness */
char c = 200;   /* may be -56 (signed char) or 200 (unsigned char) */
/* Solution: use signed char or unsigned char explicitly */

/* 3. Right shift of signed integer */
int x = -4;
x >> 1;   /* arithmetic shift (sign-extension) on most platforms, but not guaranteed */
/* Use: (unsigned)x >> 1 for logical shift */

/* 4. Conversion from float to int truncates (rounds toward zero) */
(int)3.9   /* → 3 */
(int)-3.9  /* → -3 */

/* 5. Struct padding — compiler inserts padding for alignment */
/* offsetof(struct S, field) gives actual byte offset */
```

---

# SECTION 11 · SIGNALS AND PROCESS MANAGEMENT

> `[MID]` signal(), sigaction, fork, exec  
> `[SENIOR]` Signal safety, async-signal-safe functions, process groups, wait semantics

---

## 11.1 Signal Handling

```c
#include <signal.h>
#include <unistd.h>

/* Old-style — avoid: signal() has implementation-defined behavior on reentry */
signal(SIGINT, SIG_IGN);   /* ignore Ctrl-C */
signal(SIGTERM, handler);  /* register handler */

/* Modern: sigaction — portable, consistent behavior */
void handler(int sig) {
    /* ASYNC-SIGNAL-SAFE FUNCTIONS ONLY:
       write(), _exit(), kill(), signal(), sigprocmask()
       NO: printf, malloc, free, any stdio, pthread_mutex_lock */
    const char msg[] = "Caught signal\n";
    write(STDOUT_FILENO, msg, sizeof(msg)-1);   /* write() is async-signal-safe */
}

struct sigaction sa = {
    .sa_handler = handler,
    .sa_flags   = SA_RESTART,   /* restart interrupted syscalls */
};
sigemptyset(&sa.sa_mask);       /* don't block extra signals */
sigaddset(&sa.sa_mask, SIGTERM); /* block SIGTERM while handling SIGINT */
sigaction(SIGINT, &sa, NULL);

/* Common pattern: set a volatile flag, check in main loop */
static volatile sig_atomic_t g_running = 1;

void handle_sigterm(int sig) { g_running = 0; }   /* only write sig_atomic_t */

/* Main loop */
while (g_running) {
    do_work();
}

/* Block signals */
sigset_t mask;
sigemptyset(&mask);
sigaddset(&mask, SIGINT);
sigaddset(&mask, SIGTERM);
pthread_sigmask(SIG_BLOCK, &mask, NULL);   /* thread-safe */
/* sigprocmask for single-threaded */
```

---

## 11.2 Process Creation

```c
#include <unistd.h>
#include <sys/wait.h>

/* fork — create child process */
pid_t pid = fork();
if (pid < 0) {
    perror("fork"); exit(1);
} else if (pid == 0) {
    /* Child process — has copy of parent's memory (copy-on-write) */
    /* File descriptors are inherited */
    execl("/bin/ls", "ls", "-la", NULL);   /* replace child with ls */
    perror("execl"); exit(1);              /* only reached if exec fails */
} else {
    /* Parent process */
    int status;
    pid_t child = waitpid(pid, &status, 0);   /* wait for specific child */
    if (WIFEXITED(status))
        printf("Child exited with %d\n", WEXITSTATUS(status));
    else if (WIFSIGNALED(status))
        printf("Child killed by signal %d\n", WTERMSIG(status));
}

/* exec family */
execl("/bin/prog", "prog", "arg1", NULL);     /* explicit args, full path */
execv("/bin/prog", argv);                      /* array of args */
execlp("prog", "prog", "arg1", NULL);          /* search PATH */
execvp("prog", argv);                          /* array of args, search PATH */
execve("/bin/prog", argv, envp);               /* explicit env */

/* Pipe — unidirectional IPC */
int pipefd[2];
pipe(pipefd);   /* pipefd[0]=read end, pipefd[1]=write end */

pid = fork();
if (pid == 0) {
    /* Child: read from pipe */
    close(pipefd[1]);   /* close write end */
    char buf[256];
    ssize_t n = read(pipefd[0], buf, sizeof(buf));
    close(pipefd[0]);
    exit(0);
} else {
    /* Parent: write to pipe */
    close(pipefd[0]);   /* close read end */
    write(pipefd[1], "hello", 5);
    close(pipefd[1]);   /* EOF to child */
    waitpid(pid, NULL, 0);
}
```

---

# SECTION 12 · NETWORKING IN C

> `[MID]` BSD sockets, TCP client/server  
> `[SENIOR]` Non-blocking sockets, epoll, multiplexing, scatter-gather I/O

---

## 12.1 BSD Sockets

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>

/* TCP server */
int server_fd = socket(AF_INET, SOCK_STREAM, 0);

/* Allow port reuse after crash */
int opt = 1;
setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
setsockopt(server_fd, SOL_SOCKET, SO_REUSEPORT, &opt, sizeof(opt));

struct sockaddr_in addr = {
    .sin_family      = AF_INET,
    .sin_addr.s_addr = INADDR_ANY,
    .sin_port        = htons(8080),
};
bind(server_fd, (struct sockaddr*)&addr, sizeof(addr));
listen(server_fd, SOMAXCONN);   /* backlog */

while (1) {
    struct sockaddr_in client_addr;
    socklen_t len = sizeof(client_addr);
    int client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &len);

    char ip[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &client_addr.sin_addr, ip, sizeof(ip));
    printf("Connection from %s:%d\n", ip, ntohs(client_addr.sin_port));

    handle_client(client_fd);
    close(client_fd);
}

/* TCP client with getaddrinfo (IPv4/IPv6 agnostic) */
struct addrinfo hints = {
    .ai_family   = AF_UNSPEC,
    .ai_socktype = SOCK_STREAM,
};
struct addrinfo *res;
int rc = getaddrinfo("example.com", "80", &hints, &res);
if (rc != 0) { fprintf(stderr, "%s\n", gai_strerror(rc)); }

int fd = socket(res->ai_family, res->ai_socktype, 0);
connect(fd, res->ai_addr, res->ai_addrlen);
freeaddrinfo(res);

/* Send/recv with full handling */
ssize_t send_all(int fd, const void *buf, size_t len) {
    size_t sent = 0;
    while (sent < len) {
        ssize_t n = send(fd, (char*)buf + sent, len - sent, MSG_NOSIGNAL);
        if (n <= 0) return n;
        sent += n;
    }
    return sent;
}
```

---

## 12.2 epoll — Scalable I/O Multiplexing

> `[SENIOR]` The foundation of high-performance event-driven servers

```c
#include <sys/epoll.h>

#define MAX_EVENTS 64

int epfd = epoll_create1(EPOLL_CLOEXEC);

/* Add server socket */
struct epoll_event ev = {
    .events  = EPOLLIN,
    .data.fd = server_fd,
};
epoll_ctl(epfd, EPOLL_CTL_ADD, server_fd, &ev);

/* Set client sockets non-blocking */
void set_nonblocking(int fd) {
    int flags = fcntl(fd, F_GETFL);
    fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

/* Event loop */
struct epoll_event events[MAX_EVENTS];
while (running) {
    int n = epoll_wait(epfd, events, MAX_EVENTS, -1 /* timeout ms, -1=infinite */);
    for (int i = 0; i < n; i++) {
        if (events[i].data.fd == server_fd) {
            /* Accept new connection */
            int client_fd = accept4(server_fd, NULL, NULL, SOCK_NONBLOCK | SOCK_CLOEXEC);
            ev.events   = EPOLLIN | EPOLLET;  /* edge-triggered */
            ev.data.fd  = client_fd;
            epoll_ctl(epfd, EPOLL_CTL_ADD, client_fd, &ev);
        } else {
            /* Read from client */
            handle_client_data(events[i].data.fd);
        }
    }
}

/*
 * Level-triggered (LT, default): epoll_wait returns as long as fd is ready
 * Edge-triggered (ET, EPOLLET):  only returns when state changes (ready→not ready→ready)
 * ET requires reading all available data (until EAGAIN) on each event
 * ET is faster but harder to implement correctly
 */
```

---

# SECTION 13 · PERFORMANCE AND OPTIMIZATION

> `[MID]` Compiler flags, basic optimization  
> `[SENIOR]` Cache effects, SIMD, branch prediction, profiling

---

## 13.1 Cache Effects

```c
/*
 * Cache hierarchy (typical x86-64):
 * L1:  32KB per core, ~4 cycles latency
 * L2:  256KB per core, ~12 cycles
 * L3:  8-32MB shared, ~40 cycles
 * RAM: ~200 cycles
 *
 * Cache line: 64 bytes — smallest unit of data transfer
 */

/* Row-major vs column-major traversal */
#define N 1024
int matrix[N][N];

/* FAST — row-major (sequential, cache friendly) */
for (int i = 0; i < N; i++)
    for (int j = 0; j < N; j++)
        matrix[i][j] = i + j;

/* SLOW — column-major (stride N, cache thrashing) */
for (int j = 0; j < N; j++)
    for (int i = 0; i < N; i++)
        matrix[i][j] = i + j;

/* Structure of Arrays (SoA) vs Array of Structures (AoS) */

/* AoS — poor cache utilization when processing one field */
typedef struct { float x, y, z, w; } Particle;   /* 16 bytes */
Particle particles[10000];
for (int i = 0; i < 10000; i++)
    particles[i].x += 1.0f;   /* loads 16 bytes, uses 4 → 75% waste */

/* SoA — excellent cache utilization */
typedef struct {
    float x[10000];   /* all x values contiguous */
    float y[10000];
    float z[10000];
    float w[10000];
} ParticlesSoA;
/* x += 1.0f loop touches only x[] — 100% cache utilization */
/* Also enables auto-vectorization */

/* False sharing — two threads writing different vars in same cache line */
struct { int a; int b; } shared;   /* a and b in same cache line */
/* Thread 1 writes a, Thread 2 writes b → cache line ping-pong */

/* Fix: pad to cache line size */
struct {
    int a;
    char _pad1[64 - sizeof(int)];
    int b;
    char _pad2[64 - sizeof(int)];
} padded;
/* Or: __attribute__((aligned(64))) */

/* Prefetching */
__builtin_prefetch(addr, 0, 3);   /* prefetch for read, high temporal locality */
__builtin_prefetch(addr, 1, 0);   /* prefetch for write, low temporal locality */
```

---

## 13.2 SIMD and Compiler Intrinsics

```c
/* Auto-vectorization — let compiler do it */
/* -O2 -march=native -ffast-math enables most auto-vectorization */
void add_arrays(float *restrict dst, const float *restrict a,
                const float *restrict b, int n) {
    for (int i = 0; i < n; i++)
        dst[i] = a[i] + b[i];   /* compiler will vectorize with -O2 */
}

/* Manual SIMD — SSE/AVX intrinsics */
#include <immintrin.h>

void add_arrays_avx(float *restrict dst, const float *restrict a,
                    const float *restrict b, int n) {
    int i = 0;
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);
        __m256 vb = _mm256_loadu_ps(&b[i]);
        __m256 vc = _mm256_add_ps(va, vb);
        _mm256_storeu_ps(&dst[i], vc);
    }
    for (; i < n; i++) dst[i] = a[i] + b[i];   /* scalar tail */
}

/* Compiler hints */
__builtin_expect(condition, expected)   /* branch prediction hint */
if (__builtin_expect(ptr != NULL, 1)) { /* likely not null */ }
if (__builtin_expect(err != 0, 0))    { /* unlikely error */   }
__builtin_unreachable();               /* tell compiler this can't be reached */
```

---

## 13.3 Profiling and Benchmarking

```bash
# gprof — function-level profiling
gcc -pg -O2 source.c -o program
./program
gprof program gmon.out | head -50

# perf — hardware counter profiling (Linux)
perf stat ./program                   # CPU stats: cycles, cache-misses, etc.
perf record -g ./program              # sampling profiler
perf report                           # interactive report
perf annotate                         # source-level annotation

# Specific events
perf stat -e cache-references,cache-misses,cycles,instructions ./program

# Cachegrind (valgrind) — cache simulation
valgrind --tool=cachegrind ./program
cg_annotate cachegrind.out.*

# LLDB / GDB timing
(gdb) set pagination off
(gdb) run
```

---

# SECTION 14 · SECURE CODING IN C

> `[MID]` Common vulnerabilities  
> `[SENIOR]` Exploit mitigations, secure APIs, CERT C coding standard

---

## 14.1 Buffer Overflows and Safe String Handling

```c
/* NEVER USE — unsafe functions */
gets(buf);           /* no bounds: use fgets() */
strcpy(dst, src);    /* no bounds: use strncpy or strlcpy */
strcat(dst, src);    /* no bounds: use strncat or strlcat */
sprintf(buf, ...);   /* no bounds: use snprintf */
scanf("%s", buf);    /* no bounds: use scanf("%255s", buf) */

/* Safe replacements */
fgets(buf, sizeof(buf), stdin);                    /* reads at most sizeof-1 chars */
snprintf(buf, sizeof(buf), "%s", user_input);      /* always null-terminates */
strncat(dst, src, sizeof(dst) - strlen(dst) - 1); /* explicit limit */

/* strlcpy / strlcat (BSD, glibc 2.38+) */
strlcpy(dst, src, sizeof(dst));          /* always null-terminates, returns strlen(src) */
strlcat(dst, src, sizeof(dst));          /* always null-terminates */

/* Safe integer operations */
#include <limits.h>
/* Addition overflow check */
if (a > INT_MAX - b) /* overflow */ ;
/* Multiplication overflow check */
if (a != 0 && b > INT_MAX / a) /* overflow */ ;
/* Unsigned addition */
uint32_t sum = (uint32_t)a + (uint32_t)b;   /* wraps, well-defined */

/* Format string vulnerabilities */
printf(user_input);          /* VULNERABLE: user_input = "%n" writes memory */
printf("%s", user_input);    /* SAFE: user input treated as data, not format */
```

---

## 14.2 Integer Overflow, Sign Confusion

```c
/* Integer truncation */
size_t len = get_length();   /* could be 4GB */
uint16_t truncated = len;    /* silently truncated! */

/* Sign conversion */
int  n  = -1;
size_t s = n;   /* wraps to SIZE_MAX on unsigned conversion */
if (s > 100) {} /* always true! -1 > 100 as unsigned */

/* TOCTOU (Time of Check Time of Use) */
if (access("file", R_OK) == 0) {   /* check */
    /* attacker can swap file here */
    fd = open("file", O_RDONLY);    /* use — different file! */
}
/* Fix: open first, then check with fstat */

/* Integer promotion pitfalls */
uint8_t a = 200, b = 200;
uint8_t sum = a + b;   /* a+b = 400 (int), then truncated to 144 */

/* Avoid: divide by zero */
if (divisor == 0) handle_error();
result = numerator / divisor;

/* Heap metadata corruption via off-by-one */
char *buf = malloc(10);
buf[10] = 0;   /* writes into heap metadata → heap corruption */
```

---

## 14.3 Exploit Mitigations

```
ASLR (Address Space Layout Randomization):
  - OS randomizes base addresses of stack, heap, libraries
  - Prevents hardcoded address attacks
  - compile with -fPIE, link with -pie for executables

Stack Canaries:
  - gcc -fstack-protector-all
  - Places random value before return address
  - Checked before function return; abort on mismatch

NX/DEP (No-Execute / Data Execution Prevention):
  - Stack and heap marked non-executable
  - Prevents shellcode execution in data memory
  - Default on modern Linux (PT_GNU_STACK)

RELRO (Relocation Read-Only):
  - gcc -Wl,-z,relro,-z,now
  - Full RELRO: GOT table made read-only after startup
  - Prevents GOT overwrites

FORTIFY_SOURCE:
  - gcc -D_FORTIFY_SOURCE=2 -O2
  - Adds bounds-checked wrappers for stdio/string functions
  - Compile-time and runtime checks

SafeStack (clang):
  - clang -fsanitize=safe-stack
  - Separates unsafe stack (arrays, VLAs) from safe stack (return addrs)
```

---

# SECTION 15 · EMBEDDED AND SYSTEMS PROGRAMMING

> `[SENIOR]` Memory-mapped I/O, volatile, interrupt handlers, linker scripts

---

## 15.1 Memory-Mapped I/O and volatile

```c
/*
 * On embedded systems, hardware registers are memory-mapped.
 * Must use volatile to prevent compiler from optimizing away reads/writes.
 */

/* Register definitions — bare metal ARM Cortex-M style */
#define GPIOA_BASE  0x40020000UL
#define GPIOA_MODER (*(volatile uint32_t*)(GPIOA_BASE + 0x00))
#define GPIOA_ODR   (*(volatile uint32_t*)(GPIOA_BASE + 0x14))

/* Set pin PA5 as output */
GPIOA_MODER &= ~(3 << (5*2));   /* clear bits 11:10 */
GPIOA_MODER |=  (1 << (5*2));   /* set mode = output */

/* Toggle LED */
GPIOA_ODR ^= (1 << 5);

/* Without volatile, compiler may cache register value in a CPU register
   and never re-read it — causing bugs with hardware that changes values */

/* Spinwait on hardware flag */
volatile uint32_t *STATUS = (volatile uint32_t*)0x40000000;
while (!(*STATUS & 0x01))   /* wait for READY bit */
    ;   /* compiler cannot optimize this away because of volatile */

/* struct-based register map */
typedef struct {
    volatile uint32_t MODER;    /* offset 0x00 */
    volatile uint32_t OTYPER;   /* offset 0x04 */
    volatile uint32_t OSPEEDR;  /* offset 0x08 */
    volatile uint32_t PUPDR;    /* offset 0x0C */
    volatile uint32_t IDR;      /* offset 0x10 */
    volatile uint32_t ODR;      /* offset 0x14 */
} GPIO_TypeDef;

#define GPIOA ((GPIO_TypeDef*)0x40020000UL)
GPIOA->ODR |= (1 << 5);   /* set PA5 high */
```

---

## 15.2 Interrupt Service Routines

```c
/* ISR constraints:
 * - Must be fast — interrupts other ISRs (unless nested)
 * - No blocking calls, no dynamic allocation
 * - Communication via volatile globals or ring buffers
 * - Stack is limited (often <512 bytes total for ISRs)
 */

/* GCC interrupt attribute (ARM Cortex-M) */
__attribute__((interrupt("IRQ")))
void USART1_IRQHandler(void) {
    if (USART1->SR & USART_SR_RXNE) {
        uint8_t data = (uint8_t)(USART1->DR & 0xFF);
        ring_buffer_push(&rx_buf, data);   /* lock-free ring buffer */
    }
}

/* Volatile flag pattern */
static volatile uint8_t timer_tick = 0;

void TIM2_IRQHandler(void) {
    TIM2->SR &= ~TIM_SR_UIF;   /* clear interrupt flag */
    timer_tick = 1;
}

/* Main loop checks flag */
while (1) {
    if (timer_tick) {
        timer_tick = 0;
        do_periodic_work();
    }
}

/* Critical section (disable/enable interrupts) */
__disable_irq();    /* set PRIMASK on ARM — disables all interrupts */
/* critical section */
__enable_irq();     /* clear PRIMASK */

/* Lock-free ring buffer for ISR/main communication */
typedef struct {
    uint8_t  buf[256];
    uint8_t  head;   /* written by ISR */
    uint8_t  tail;   /* read by main */
} RingBuffer;        /* power-of-2 size → modulo = mask */

void rb_push(volatile RingBuffer *rb, uint8_t val) {
    rb->buf[rb->head] = val;
    rb->head = (rb->head + 1) & 0xFF;
}

bool rb_pop(volatile RingBuffer *rb, uint8_t *val) {
    if (rb->head == rb->tail) return false;
    *val = rb->buf[rb->tail];
    rb->tail = (rb->tail + 1) & 0xFF;
    return true;
}
```

---

## 15.3 Linker Scripts

```ld
/* Linker script excerpt — ARM Cortex-M bare metal */
MEMORY {
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
    RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

SECTIONS {
    .text : {
        *(.vectors)       /* interrupt vector table first */
        *(.text)          /* code */
        *(.text.*)
        *(.rodata)        /* read-only data (string literals, const) */
        _etext = .;
    } > FLASH

    .data : {
        _sdata = .;
        *(.data)          /* initialized global/static vars */
        _edata = .;
    } > RAM AT > FLASH    /* stored in FLASH, loaded to RAM at startup */

    .bss : {
        _sbss = .;
        *(.bss)           /* uninitialized globals — zeroed by startup code */
        *(COMMON)
        _ebss = .;
    } > RAM

    _stack_top = ORIGIN(RAM) + LENGTH(RAM);
}
```

---

# SECTION 16 · DESIGN PATTERNS IN C

> `[MID]` Common patterns: state machine, observer, strategy  
> `[SENIOR]` Object-oriented C, vtable simulation, module pattern

---

## 16.1 Object-Oriented C via vtables

```c
/* Simulating polymorphism with function pointers in structs */
typedef struct Shape Shape;

typedef struct {
    double (*area)(const Shape *self);
    double (*perimeter)(const Shape *self);
    void   (*draw)(const Shape *self);
    void   (*destroy)(Shape *self);
} ShapeVTable;

struct Shape {
    const ShapeVTable *vtable;   /* pointer to virtual function table */
};

/* Convenience macros */
#define shape_area(s)       ((s)->vtable->area(s))
#define shape_perimeter(s)  ((s)->vtable->perimeter(s))
#define shape_draw(s)       ((s)->vtable->draw(s))
#define shape_destroy(s)    ((s)->vtable->destroy(s))

/* Circle implementation */
typedef struct {
    Shape  base;     /* must be first — enables safe cast to Shape* */
    double radius;
} Circle;

static double circle_area(const Shape *self) {
    const Circle *c = (const Circle*)self;
    return 3.14159265 * c->radius * c->radius;
}
static double circle_perimeter(const Shape *self) {
    const Circle *c = (const Circle*)self;
    return 2 * 3.14159265 * c->radius;
}
static void circle_draw(const Shape *self) {
    const Circle *c = (const Circle*)self;
    printf("Circle(r=%.2f)\n", c->radius);
}
static void circle_destroy(Shape *self) { free(self); }

static const ShapeVTable circle_vtable = {
    .area      = circle_area,
    .perimeter = circle_perimeter,
    .draw      = circle_draw,
    .destroy   = circle_destroy,
};

Circle *circle_new(double radius) {
    Circle *c = malloc(sizeof *c);
    if (!c) return NULL;
    c->base.vtable = &circle_vtable;
    c->radius = radius;
    return c;
}

/* Polymorphic usage */
Shape *shapes[3] = {
    (Shape*)circle_new(5.0),
    (Shape*)rect_new(3.0, 4.0),
    (Shape*)triangle_new(3.0, 4.0, 5.0),
};
for (int i = 0; i < 3; i++) {
    shape_draw(shapes[i]);
    printf("  area = %.2f\n", shape_area(shapes[i]));
    shape_destroy(shapes[i]);
}
```

---

## 16.2 State Machine

```c
/* Enum-driven state machine */
typedef enum {
    ST_IDLE, ST_CONNECTING, ST_CONNECTED, ST_ERROR, ST_CLOSED
} ConnState;

typedef enum {
    EV_CONNECT, EV_DATA, EV_ERROR, EV_DISCONNECT, EV_RESET
} ConnEvent;

typedef struct Connection {
    ConnState  state;
    int        fd;
    char       buf[4096];
    size_t     buf_len;
} Connection;

typedef ConnState (*TransitionFn)(Connection*, ConnEvent);

ConnState handle_idle(Connection *c, ConnEvent ev) {
    switch (ev) {
        case EV_CONNECT: return do_connect(c) ? ST_CONNECTING : ST_ERROR;
        default:         return ST_IDLE;
    }
}

ConnState handle_connected(Connection *c, ConnEvent ev) {
    switch (ev) {
        case EV_DATA:       process_data(c); return ST_CONNECTED;
        case EV_DISCONNECT: close(c->fd); return ST_CLOSED;
        case EV_ERROR:      return ST_ERROR;
        default:            return ST_CONNECTED;
    }
}

/* Transition table */
TransitionFn transitions[5] = {
    [ST_IDLE]       = handle_idle,
    [ST_CONNECTING] = handle_connecting,
    [ST_CONNECTED]  = handle_connected,
    [ST_ERROR]      = handle_error,
    [ST_CLOSED]     = handle_closed,
};

void conn_dispatch(Connection *c, ConnEvent ev) {
    c->state = transitions[c->state](c, ev);
}
```

---

## 16.3 Module Pattern and Dependency Injection

```c
/* Logger module with injectable backend */
typedef struct {
    void (*log)(void *ctx, int level, const char *msg);
    void *ctx;
} Logger;

/* File logger implementation */
static void file_log(void *ctx, int level, const char *msg) {
    FILE *f = ctx;
    const char *levels[] = {"DEBUG","INFO","WARN","ERROR"};
    fprintf(f, "[%s] %s\n", levels[level], msg);
}

Logger logger_file(FILE *f) {
    return (Logger){ .log = file_log, .ctx = f };
}

/* Null logger (discard all) */
static void null_log(void *ctx, int level, const char *msg) { (void)ctx; (void)level; (void)msg; }
Logger logger_null(void) { return (Logger){ .log = null_log, .ctx = NULL }; }

/* Service that uses logger via DI */
typedef struct {
    Logger logger;
    int    db_fd;
} Service;

Service service_create(Logger logger, int db_fd) {
    return (Service){ .logger = logger, .db_fd = db_fd };
}

void service_do_work(Service *s) {
    s->logger.log(s->logger.ctx, 1, "Starting work");
    /* ... */
}
```

---

# SECTION 17 · C STANDARD LIBRARY DEEP DIVE

> `[JUNIOR]` stdio, string.h, stdlib.h  
> `[MID]` math.h, time.h, setjmp, qsort/bsearch  
> `[SENIOR]` Locale, errno semantics, reentrant functions, C11 additions

---

## 17.1 stdlib.h

```c
#include <stdlib.h>

/* Numeric conversions */
int    atoi("42")            /* no error detection — avoid */
long   strtol(str, &end, 10) /* base 10; end points after parsed portion */
double strtod(str, &end)

/* Error detection with strtol */
char *endptr;
errno = 0;
long val = strtol(str, &endptr, 10);
if (errno == ERANGE)           /* overflow */
    handle_overflow();
if (endptr == str)             /* no digits parsed */
    handle_invalid();
if (*endptr != '\0')           /* trailing non-numeric chars */
    handle_trailing();

/* Random numbers */
srand(time(NULL));     /* seed once at startup */
int r = rand() % 100;  /* [0, 99] — biased! use for non-critical only */

/* Unbiased random in range [0, n) */
int rand_range(int n) {
    int limit = RAND_MAX - (RAND_MAX % n);
    int r;
    do { r = rand(); } while (r >= limit);
    return r % n;
}

/* For cryptographic randomness: getrandom() (Linux), arc4random() (BSD/macOS) */
#include <sys/random.h>
getrandom(buf, sizeof(buf), 0);

/* Environment */
getenv("PATH")             /* get env var; returns NULL if not set */
putenv("VAR=value")        /* set env var (deprecated, modifies string) */
setenv("VAR", "value", 1)  /* preferred (POSIX) */
unsetenv("VAR")

/* Program exit */
exit(EXIT_SUCCESS)    /* flush stdio, run atexit handlers, exit */
_exit(0)              /* raw syscall: no stdio flush, no atexit */
abort()               /* raise SIGABRT, generate core dump */
atexit(cleanup_func)  /* register function to call on exit */
```

---

## 17.2 string.h

```c
#include <string.h>

/* Memory functions */
memset(ptr, 0, n)           /* fill n bytes with value (0 for zero-init) */
memcpy(dst, src, n)         /* copy n bytes; src/dst must NOT overlap */
memmove(dst, src, n)        /* copy n bytes; handles overlap safely */
memcmp(a, b, n)             /* compare n bytes; returns 0 if equal */
memchr(ptr, ch, n)          /* find first occurrence of ch in n bytes */

/* String functions */
strlen(s)                   /* O(n): count chars to null terminator */
strcmp(a, b)                /* compare: 0=equal, <0, >0 */
strncmp(a, b, n)            /* compare first n chars */
strchr(s, c)                /* find first 'c' in s */
strrchr(s, c)               /* find last 'c' in s */
strstr(haystack, needle)    /* find substring */
strdup(s)                   /* malloc + strcpy; must free */
strndup(s, n)               /* malloc + strncpy(n) + null terminate */

/* Safe string building */
int written = snprintf(buf, sizeof(buf), "Hello %s at %d", name, port);
if (written < 0 || written >= (int)sizeof(buf))
    /* truncated or error */;
```

---

## 17.3 setjmp/longjmp

```c
#include <setjmp.h>

/* Non-local goto — used for error handling in C */
/* WARNING: dangerous if not used carefully; destroys local context */

jmp_buf env;

void inner(void) {
    /* ... */
    if (error) longjmp(env, 1);   /* jump back to setjmp, returns 1 */
}

int main(void) {
    if (setjmp(env) == 0) {
        inner();   /* normal execution */
    } else {
        /* error recovery — jumped here by longjmp */
        fprintf(stderr, "Error occurred\n");
    }
    return 0;
}

/* WARNING: longjmp does NOT call destructors (C++ only) or run cleanup
   Local variables in the jumped-over frames are inaccessible
   Only use for catching fatal errors or implementing coroutines/fibers
   Variables that need to survive must be volatile */

volatile int preserved;   /* volatile ensures value is correct after longjmp */
```

---

# SECTION 18 · ADVANCED C PATTERNS

> `[SENIOR]` Generic programming, compiler extensions, X-macros, computed gotos

---

## 18.1 Generic Programming via _Generic (C11)

```c
/* _Generic — compile-time type dispatch */
#define abs_val(x) _Generic((x), \
    int:    abs(x),              \
    long:   labs(x),             \
    float:  fabsf(x),            \
    double: fabs(x),             \
    default: abs(x)              \
)

abs_val(3.14)   /* → fabs(3.14)  */
abs_val(-3)     /* → abs(-3)     */

/* Type-safe min/max */
#define min(a, b) _Generic((a), \
    int:    min_int,            \
    float:  min_float,          \
    double: min_double          \
)(a, b)

/* Type-safe print */
#define print_val(x) _Generic((x),        \
    int:          printf("%d\n", (x)),     \
    unsigned int: printf("%u\n", (x)),     \
    float:        printf("%f\n", (x)),     \
    double:       printf("%lf\n", (x)),    \
    char*:        printf("%s\n", (x)),     \
    const char*:  printf("%s\n", (x))      \
)
```

---

## 18.2 Computed Gotos (GCC Extension)

```c
/* Computed gotos — direct threaded code for interpreters */
/* Labels are first-class values with &&label syntax */

static void *dispatch_table[] = {
    &&lbl_OP_ADD, &&lbl_OP_SUB, &&lbl_OP_MUL,
    &&lbl_OP_PUSH, &&lbl_OP_POP, &&lbl_OP_HALT,
};

#define DISPATCH() goto *dispatch_table[*ip++]

int interpret(uint8_t *bytecode) {
    uint8_t *ip = bytecode;
    int stack[256], sp = 0;

    DISPATCH();   /* start */

lbl_OP_ADD:  stack[sp-2] += stack[--sp]; DISPATCH();
lbl_OP_SUB:  stack[sp-2] -= stack[--sp]; DISPATCH();
lbl_OP_MUL:  stack[sp-2] *= stack[--sp]; DISPATCH();
lbl_OP_PUSH: stack[sp++] = *ip++;         DISPATCH();
lbl_OP_POP:  sp--;                         DISPATCH();
lbl_OP_HALT: return stack[sp-1];
}
/* ~20-30% faster than switch for interpreters due to better branch prediction */
```

---

## 18.3 Defer Emulation via Cleanup Attribute

```c
/* GCC/Clang: __attribute__((cleanup(func))) */
/* func called with pointer to variable when it goes out of scope */

static void free_ptr(void **p) {
    if (*p) { free(*p); *p = NULL; }
}
static void close_fd(int *fd) {
    if (*fd >= 0) { close(*fd); *fd = -1; }
}
static void close_file(FILE **f) {
    if (*f) { fclose(*f); *f = NULL; }
}

#define defer_free  __attribute__((cleanup(free_ptr)))
#define defer_fd    __attribute__((cleanup(close_fd)))
#define defer_file  __attribute__((cleanup(close_file)))

void example(void) {
    defer_free char *buf = malloc(1024);
    defer_fd   int   fd  = open("file.txt", O_RDONLY);
    defer_file FILE *f   = fopen("out.txt", "w");

    if (!buf || fd < 0 || !f) return;   /* cleanup runs even on early return */

    /* ... use buf, fd, f ... */
}   /* buf freed, fd closed, f closed — automatically */
```

---

# APPENDIX A — QUICK REFERENCE: TALENT SIGNALS BY LEVEL

---

## Junior-Level Signals

```
POSITIVE SIGNALS (Junior):
✓ Knows the difference between stack and heap allocation
✓ Always checks return value of malloc/calloc
✓ Uses sizeof correctly (sizeof *ptr, not sizeof(int))
✓ Frees every malloc (no leaks in simple code)
✓ Understands pointer syntax: *, &, ->, []
✓ Uses const for pointer parameters that shouldn't be modified
✓ Knows null termination of strings
✓ Sets pointers to NULL after free

RED FLAGS (Junior):
✗ Returns pointer to local variable
✗ Uses gets() or unbounded strcpy()
✗ Ignores return value of malloc
✗ Confuses array and pointer (thinks sizeof(arr) == sizeof(ptr))
✗ Uses == to compare strings (should use strcmp)
✗ Writes buffer overflows in string handling
✗ Forgets to free memory
✗ Double-frees (frees same pointer twice)
```

---

## Mid-Level Signals

```
POSITIVE SIGNALS (Mid):
✓ Uses opaque types / information hiding correctly
✓ Understands and applies const-correctness with pointers
✓ Knows struct padding — reorders fields to save memory
✓ Can implement a generic container with void*
✓ Writes reentrant functions (no static locals for state)
✓ Uses snprintf instead of sprintf everywhere
✓ Understands the difference between .a and .so
✓ Knows when to use static inline vs macro
✓ Uses sigaction instead of signal()
✓ Understands FILE vs fd (buffered vs unbuffered I/O)
✓ Properly initializes structs with {0} or designated initializers

RED FLAGS (Mid):
✗ Uses global mutable state for everything
✗ Doesn't understand translation units and linkage
✗ Uses strtok in multi-threaded code (not reentrant)
✗ Mixes file descriptors and FILE* without understanding
✗ Doesn't know what restrict does
✗ Can't explain the difference between memcpy and memmove
✗ Uses typedef to hide pointer types (typedef Foo* FooPtr — confusing)
```

---

## Senior-Level Signals

```
POSITIVE SIGNALS (Senior):
✓ Understands and avoids undefined behavior (can enumerate 10+ cases)
✓ Knows strict aliasing — uses memcpy for type punning
✓ Designs arena/pool allocators for performance-critical paths
✓ Understands C11 memory model and uses atomics correctly
✓ Can reason about cache effects (SoA vs AoS, false sharing)
✓ Writes ISR-safe code (volatile, async-signal-safe functions only)
✓ Knows ASLR, stack canaries, RELRO, NX — can explain each
✓ Understands linker script sections (.text, .data, .bss)
✓ Uses restrict correctly to enable vectorization
✓ Can explain ABA problem in lock-free structures
✓ Knows the difference between LT and ET in epoll
✓ Designs vtable-based polymorphism in C
✓ Can read and interpret disassembly for performance bugs
✓ Understands when to use mmap vs malloc for large buffers

RED FLAGS (Senior):
✗ Can't explain what the compiler can do with signed overflow
✗ Doesn't know about false sharing / cache-line contention
✗ Uses pthread_mutex inside a signal handler
✗ Doesn't know the ABI of their platform
✗ Claims C has no memory safety problems if you're "careful"
✗ Uses longjmp without understanding what it destroys
✗ Doesn't understand why POSIX requires async-signal-safe functions
✗ Can't explain what ASLR or stack canaries protect against
✗ Doesn't know the difference between SC_SEQ_CST and relaxed ordering
```

---

# APPENDIX B — C STANDARD VERSION FEATURE MATRIX

| Version | Key Features |
|---------|-------------|
| **C89/C90** | Original standard. No `//` comments, `int` implicit return, `void*` casts required |
| **C99** | `//` comments, `_Bool`, VLAs, designated initializers, `restrict`, `inline`, `stdint.h`, `stdbool.h`, `snprintf`, mixed declarations and code, flexible array members, compound literals |
| **C11** | `_Generic`, `_Static_assert`, `_Noreturn`, `_Alignas`/`_Alignof`, `stdatomic.h` (C11 memory model), `threads.h`, `_Thread_local`, anonymous structs/unions, `fopen`  with `"x"` mode, `aligned_alloc` |
| **C17/C18** | Bug-fix release. No new features. Deprecations: `gets` officially removed, various functions deprecated |
| **C23** | `bool`/`true`/`false` as keywords (no stdbool.h needed), `nullptr`, `constexpr`, `typeof`, `#elifdef`/`#elifndef`, `[[deprecated]]`/`[[nodiscard]]`/`[[noreturn]]` attributes, `_BitInt(N)`, `memset_explicit` (secure erase) |

---

# APPENDIX C — COMMON ALGORITHM COMPLEXITIES IN C

| Data Structure | Operation | Average | Notes |
|----------------|-----------|---------|-------|
| Array | Access | O(1) | Direct index |
| Array | Search | O(n) | Linear scan |
| Array (sorted) | Search | O(log n) | bsearch / bisect |
| Array | Insert/delete middle | O(n) | Shifts elements |
| Linked list | Prepend | O(1) | With head pointer |
| Linked list | Append | O(n) / O(1) | With/without tail pointer |
| Linked list | Search | O(n) | Linear scan |
| Hash table | Get/Set/Del | O(1) avg | O(n) worst on collision |
| BST (balanced) | Get/Set/Del | O(log n) | AVL/Red-Black |
| Heap | Push/Pop | O(log n) | Priority queue |
| Heap | Heapify | O(n) | Build from array |
| qsort | Sort | O(n log n) | Typically introsort |

---

# APPENDIX D — GCC/CLANG COMPILER ATTRIBUTES REFERENCE

```c
/* Function attributes */
__attribute__((noreturn))       void die(const char *msg);     /* function never returns */
__attribute__((pure))           int compute(int x);            /* no side effects, result depends only on args+globals */
__attribute__((const))          int square(int x);             /* stricter pure: no global reads */
__attribute__((malloc))         void* my_alloc(size_t n);      /* return is unaliased heap pointer */
__attribute__((warn_unused_result)) int must_check(void);      /* warn if return ignored */
__attribute__((deprecated))     void old_api(void);            /* warn on use */
__attribute__((deprecated("use new_api() instead"))) void old(void);
__attribute__((noinline))       void debug_dump(void);         /* don't inline this */
__attribute__((always_inline))  int fast_path(int x);          /* always inline this */
__attribute__((visibility("hidden"))) void internal(void);     /* not exported from DSO */
__attribute__((constructor))    void on_load(void);            /* run before main() */
__attribute__((destructor))     void on_unload(void);          /* run after main() */
__attribute__((sentinel))       void varargs_func(int n, ...); /* last arg must be NULL */
__attribute__((format(printf, 2, 3))) void logf(int lvl, const char *fmt, ...);

/* Variable/type attributes */
__attribute__((packed))         struct Wire { ... };            /* no padding */
__attribute__((aligned(64)))    float vec[8];                  /* 64-byte alignment */
__attribute__((section(".mydata"))) int special = 0;           /* place in custom section */
__attribute__((unused))         int maybe_unused_var;          /* suppress unused warning */
__attribute__((used))           static int keep_this;          /* prevent linker removal */

/* Builtin hints */
__builtin_expect(x, 1)         /* likely: x is usually 1 */
__builtin_expect(x, 0)         /* unlikely: x is usually 0 */
__builtin_unreachable()        /* tell compiler this path is never reached */
__builtin_trap()               /* emit trap instruction (abort/crash) */
__builtin_popcount(x)          /* count set bits */
__builtin_clz(x)               /* count leading zeros */
__builtin_ctz(x)               /* count trailing zeros */
__builtin_bswap32(x)           /* byte-swap 32-bit int */
__builtin_bswap64(x)           /* byte-swap 64-bit int */
```

---

# APPENDIX E — COMMON INTERVIEW PATTERNS IN C

```c
/* Reverse a string in-place */
void reverse(char *s) {
    char *end = s + strlen(s) - 1;
    while (s < end) {
        char tmp = *s; *s++ = *end; *end-- = tmp;
    }
}

/* Count set bits (popcount) */
int popcount(unsigned int x) {
    int count = 0;
    while (x) { count += x & 1; x >>= 1; }
    return count;
}
/* Brian Kernighan's trick: */
int popcount_fast(unsigned int x) {
    int c = 0;
    while (x) { x &= x - 1; c++; }   /* clears lowest set bit each iteration */
    return c;
}

/* Check power of 2 */
int is_power_of_2(unsigned int x) {
    return x > 0 && (x & (x - 1)) == 0;
}

/* Fibonacci iterative */
long long fib(int n) {
    if (n <= 1) return n;
    long long a = 0, b = 1, c;
    for (int i = 2; i <= n; i++) { c = a + b; a = b; b = c; }
    return b;
}

/* Binary search */
int binary_search(const int *arr, int n, int target) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

/* Merge sort */
void merge(int *arr, int l, int m, int r) {
    int n1 = m - l + 1, n2 = r - m;
    int L[n1], R[n2];
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2)
        arr[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}
void merge_sort(int *arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        merge_sort(arr, l, m);
        merge_sort(arr, m+1, r);
        merge(arr, l, m, r);
    }
}

/* Swap without temp (XOR trick) — only for distinct variables */
#define XOR_SWAP(a, b) do { (a) ^= (b); (b) ^= (a); (a) ^= (b); } while(0)
/* NOTE: undefined if a and b are the same variable */

/* Safe swap */
#define SWAP(a, b) do { __typeof__(a) _t = (a); (a) = (b); (b) = _t; } while(0)

/* Circular buffer */
typedef struct {
    int  buf[256];
    int  head, tail, count;
} CircBuf;

bool cb_push(CircBuf *cb, int val) {
    if (cb->count == 256) return false;
    cb->buf[cb->head] = val;
    cb->head = (cb->head + 1) & 255;
    cb->count++;
    return true;
}
bool cb_pop(CircBuf *cb, int *val) {
    if (cb->count == 0) return false;
    *val = cb->buf[cb->tail];
    cb->tail = (cb->tail + 1) & 255;
    cb->count--;
    return true;
}

/* Endianness conversion */
uint32_t swap32(uint32_t x) {
    return ((x & 0xFF000000) >> 24) |
           ((x & 0x00FF0000) >>  8) |
           ((x & 0x0000FF00) <<  8) |
           ((x & 0x000000FF) << 24);
}

/* Align up to power of 2 */
size_t align_up(size_t n, size_t align) {
    return (n + align - 1) & ~(align - 1);
}
/* Requires align to be power of 2 */
```

---

# APPENDIX F — ERRNO AND ERROR HANDLING PATTERNS

```c
#include <errno.h>
#include <string.h>

/*
 * errno:
 * - Thread-local (POSIX: errno is a macro expanding to per-thread storage)
 * - Set by failing syscalls and many library functions
 * - NOT automatically reset to 0; must be checked immediately after failure
 * - Check ONLY when a function returns an error indicator (-1, NULL, etc.)
 */

/* CORRECT: check return value first, then errno */
ssize_t n = read(fd, buf, sizeof(buf));
if (n < 0) {
    int saved_errno = errno;   /* save before any other call */
    fprintf(stderr, "read: %s (errno=%d)\n", strerror(saved_errno), saved_errno);
    return -saved_errno;       /* common: return negative errno */
}

/* WRONG: checking errno without checking return value */
read(fd, buf, sizeof(buf));
if (errno != 0) { /* WRONG: errno may be set from earlier call */ }

/* Common errno values */
EPERM    /* Operation not permitted */
ENOENT   /* No such file or directory */
ESRCH    /* No such process */
EINTR    /* Interrupted by signal — MUST handle this! */
EIO      /* I/O error */
ENOMEM   /* Out of memory */
EACCES   /* Permission denied */
EBUSY    /* Device or resource busy */
EEXIST   /* File exists */
EINVAL   /* Invalid argument */
ENOSPC   /* No space left on device */
EPIPE    /* Broken pipe */
EAGAIN   /* Resource temporarily unavailable (non-blocking) */
EWOULDBLOCK /* Same as EAGAIN on Linux */
ETIMEDOUT  /* Connection timed out */
EINPROGRESS /* Operation in progress (non-blocking connect) */

/* Restarting interrupted system calls */
ssize_t read_all(int fd, void *buf, size_t n) {
    size_t total = 0;
    while (total < n) {
        ssize_t r = read(fd, (char*)buf + total, n - total);
        if (r < 0) {
            if (errno == EINTR) continue;   /* retry on signal interrupt */
            return -errno;
        }
        if (r == 0) break;   /* EOF */
        total += r;
    }
    return total;
}

/* perror — print error message with errno description */
if (fd < 0) { perror("open"); exit(EXIT_FAILURE); }

/* strerror_r — thread-safe version */
char errbuf[128];
strerror_r(errno, errbuf, sizeof(errbuf));
```

---

*END OF C RAG KNOWLEDGE BASE DOCUMENT*