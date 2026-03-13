# MongoDB Technical Interviewer Knowledge Base

## Document Metadata

**Technology:** MongoDB
**Versions covered:** 3.6 (sessions/transactions), 4.0 (multi-document ACID transactions), 4.2 (distributed transactions), 4.4 (hedged reads, union), 5.0 (versioned API, time-series), 6.0 (encrypted fields, change stream pre/post images), 7.0 (Atlas Vector Search GA, compound wildcard indexes), 8.0 (queryable encryption GA, Streams)
**Assessment model:** Three-Level Contextual (L1 Junior / L2 Mid / L3 Senior)
**Purpose:** AI interviewer signal detection — not pedagogy

---

## Seniority Model

**L1 — Junior:** Works under guidance, day-scoped tasks, follows patterns.
Signal phrase: "I implemented the feature as instructed."
Assessment focus: CRUD operations, basic querying, index awareness, schema design basics, driver usage patterns.

**L2 — Mid:** Works independently, week/month-scoped tasks.
Signal phrase: "I chose this pattern for better performance / scalability / consistency."
Assessment focus: Aggregation pipeline, index strategy, schema design trade-offs, replication, sharding concepts, write concern/read preference, transactions.

**L3 — Senior:** Takes ambiguous requirements, considers system-wide long-term impact.
Signal phrase: "We should avoid that pattern — it causes collection scans at scale, kills oplog throughput, and the hotspot on the shard key will cap us at 50k ops/s regardless of how many shards we add."
Assessment focus: Internals (WiredTiger, oplog, journal), failure mode reasoning, scalability limits, cost/performance trade-offs, operational concerns, cross-cutting architectural decisions.

---

## 1. Data Model and Document Structure

### Mechanics

MongoDB stores data as BSON (Binary JSON) documents. BSON extends JSON with additional types: `Date`, `ObjectId`, `Decimal128`, `BinData`, `Timestamp`, `Int32`, `Int64`, `Double`, `Regex`, `Code`, `MinKey`, `MaxKey`. Documents live in collections. Collections live in databases. No schema enforcement by default — schema validation is opt-in via JSON Schema validators.

**BSON type codes matter for queries and indexes:** a field holding a string `"5"` and an integer `5` are different BSON types and will not match each other in equality queries. A field that holds different BSON types across documents can be indexed — MongoDB uses the BSON comparison order.

**BSON comparison order (for mixed-type fields):**
`MinKey < Null < Numbers (int/long/double/decimal) < Symbol < String < Object < Array < BinData < ObjectId < Boolean < Date < Timestamp < Regex < MaxKey`

```javascript
// DOCUMENT STRUCTURE AND FIELD TYPES
db.users.insertOne({
  _id:       ObjectId("507f1f77bcf86cd799439011"),  // default: auto-generated ObjectId
  name:      "Alice",                                 // string
  age:       30,                                      // int32
  score:     9.8,                                     // double
  balance:   NumberDecimal("19.99"),                  // Decimal128 — use for money
  createdAt: new Date(),                              // ISODate
  tags:      ["admin", "user"],                       // array
  address: {                                          // embedded document
    street: "123 Main St",
    city:   "Springfield",
    zip:    "12345"
  },
  metadata:  null                                     // explicit null
});

// OBJECTID STRUCTURE: 12 bytes
// [0-3]:   4-byte Unix timestamp (seconds) — monotonically increasing
// [4-8]:   5-byte random value (process-unique)
// [9-11]:  3-byte incrementing counter
// ObjectId is NOT a UUID — it encodes creation time
// ObjectId("507f1f77bcf86cd799439011").getTimestamp()  → ISODate("2012-10-17T20:46:31Z")

// Consequence: _id ObjectId is approximately insertion-ordered
// Sorting by _id is approximately sorting by insert time (not exact — clock skew)
// Using ObjectId as shard key causes hotspot on the latest shard (all writes go to newest chunk)

// NUMBERLONG vs plain integers in the shell
db.counters.insertOne({ n: NumberLong("9007199254740993") }); // safe beyond JS MAX_SAFE_INTEGER
db.counters.insertOne({ n: 9007199254740993 });               // DANGER: JS loses precision first

// NESTED DOCUMENT FIELD ACCESS with dot notation
db.users.find({ "address.city": "Springfield" });       // dot notation for nested fields
db.users.find({ "tags": "admin" });                     // array equality: matches if array CONTAINS the value
db.users.find({ "tags": ["admin", "user"] });           // matches EXACT array (order matters)
db.users.find({ "tags.0": "admin" });                   // positional: first element is "admin"

// DOCUMENT SIZE LIMIT: 16MB per document
// This is a hard limit. Single documents exceeding 16MB must use GridFS.
// Hitting this limit in practice: unbounded arrays growing on a single document (anti-pattern)
// Example anti-pattern: storing all user events in an array on the user document

// FIELD NAMING RESTRICTIONS:
// - Cannot start with $ (reserved for operators)
// - Cannot contain . (dot notation separator)
// - _id is reserved for the primary key
// - Field names are case-sensitive
```

**L1 SIGNAL:** Must know BSON types and why `NumberDecimal` matters for financial data. Must know dot notation for nested field queries. Must know array query behavior (contains vs exact match). Must know the 16MB document limit.

**L1 RED FLAGS:**
- Uses `double` for monetary values instead of `Decimal128` — precision errors for financial data
- Does not know `"tags": "admin"` matches documents where the array contains "admin"
- Does not know what ObjectId encodes — calls it "just a UUID"
- Does not know the 16MB document limit or its implications

**L2 SIGNAL:** Must know BSON comparison order for mixed-type fields. Must know ObjectId timestamp encoding and why it makes ObjectId a poor shard key. Must know the difference between querying for array element vs querying for exact array. Must understand `NumberLong` vs JavaScript number precision limits.

**L2 RED FLAGS:**
- Cannot explain why `ObjectId` is an anti-pattern as a shard key (write hotspot)
- Does not know `NumberDecimal` vs `NumberLong` vs `double` and when each is appropriate
- Confused by array query semantics — cannot predict what `{"tags": "admin"}` matches
- Does not know BSON comparison order — cannot explain what happens when a field holds different types across documents

**L3 SIGNAL:** Must know: (1) BSON serialization overhead — BSON is not space-efficient; embeds field names in every document (no column compression like Parquet). For high-cardinality collections with many short field names, abbreviated field names (`"n"` instead of `"name"`) reduce storage and I/O. (2) Document padding: WiredTiger does not do document-level padding (MMAPv1 did) — updates that grow a document require a full document rewrite. (3) Array fields with many elements hurt update performance — each update to an array element requires rewriting the entire document. (4) The 16MB limit creates a natural pressure toward normalization for unbounded data, but the right answer is capped arrays + bucketing pattern, not normalization to a relational model.

---

## 2. CRUD Operations and Query Operators

### Mechanics

MongoDB's query language is expression-based, not declarative SQL. Queries are documents themselves. Operators use `$` prefix. The query engine uses the query shape (structure without values) for query plan caching.

```javascript
// =====================
// CREATE
// =====================
db.col.insertOne({ name: "Alice", age: 30 });          // returns { acknowledged, insertedId }
db.col.insertMany([{ name: "Bob" }, { name: "Carol" }], {
  ordered: false  // continue on error (default: true = stop on first error)
});
// ordered: false inserts all valid documents even if some fail
// ordered: true (default) stops at first error — subsequent documents NOT attempted

// =====================
// READ — query operators
// =====================
// Comparison
db.col.find({ age: { $eq: 30 } });          // equal (same as { age: 30 })
db.col.find({ age: { $ne: 30 } });          // not equal
db.col.find({ age: { $gt: 25, $lt: 35 } }); // range — AND within same field
db.col.find({ age: { $gte: 25 } });
db.col.find({ age: { $in: [25, 30, 35] } }); // in set
db.col.find({ age: { $nin: [25, 30] } });    // not in set

// Logical
db.col.find({ $and: [{ age: { $gt: 25 } }, { name: "Alice" }] });
db.col.find({ $or: [{ age: 25 }, { age: 30 }] });
// Implicit AND (same field): { age: { $gt: 25, $lt: 35 } }
// Implicit AND (different fields): { age: { $gt: 25 }, name: "Alice" }
// $or requires explicit operator and creates separate index scans per branch

db.col.find({ age: { $not: { $gt: 25 } } });  // NOT: same as $lte 25
db.col.find({ $nor: [{ age: 25 }, { name: "Alice" }] });  // neither condition

// Element
db.col.find({ phone: { $exists: true } });   // field exists (even if null)
db.col.find({ phone: { $exists: false } });  // field does not exist
db.col.find({ age: { $type: "int" } });      // BSON type check
db.col.find({ age: { $type: 16 } });         // BSON type by code (16 = int32)
// $type is useful for finding type-inconsistency bugs in data

// Array operators
db.col.find({ tags: { $all: ["admin", "user"] } });   // contains ALL specified values
db.col.find({ scores: { $size: 3 } });                 // array has exactly 3 elements
db.col.find({ scores: { $elemMatch: { $gt: 80, $lt: 90 } } }); // single element satisfies ALL conditions
// $elemMatch vs multiple conditions on array:
db.col.find({ scores: { $gt: 80, $lt: 90 } });
// ^ matches doc where SOME element > 80 AND SOME element < 90 (can be different elements)
db.col.find({ scores: { $elemMatch: { $gt: 80, $lt: 90 } } });
// ^ matches doc where A SINGLE element is both > 80 AND < 90

// Evaluation
db.col.find({ name: /^Alice/i });                           // regex (caution: full scan if not anchored)
db.col.find({ name: { $regex: "^Alice", $options: "i" } }); // equivalent
db.col.find({ $expr: { $gt: ["$revenue", "$cost"] } });     // compare two fields in same doc
db.col.find({ $where: "this.age > 25" });                   // JavaScript execution — AVOID in production

// PROJECTION: include/exclude fields
db.col.find({}, { name: 1, age: 1 });            // include name and age (+ _id by default)
db.col.find({}, { name: 1, age: 1, _id: 0 });   // exclude _id
db.col.find({}, { password: 0 });                // exclude password, include everything else
// Cannot mix include (1) and exclude (0) except for _id — one or the other

// Array projection
db.col.find({ scores: { $gt: 80 } }, { "scores.$": 1 });  // $ returns first matching element
db.col.find({}, { scores: { $slice: 5 } });                 // first 5 elements
db.col.find({}, { scores: { $slice: -5 } });                // last 5 elements
db.col.find({}, { scores: { $slice: [10, 5] } });           // skip 10, return 5

// =====================
// UPDATE
// =====================
// Update operators — always use these, never replace the document accidentally
db.col.updateOne(
  { _id: id },                    // filter
  {
    $set:   { name: "Bob", "address.city": "Portland" },  // set specific fields
    $unset: { tempField: "" },    // remove field
    $inc:   { views: 1, likes: 1 }, // increment numerically
    $mul:   { score: 1.1 },       // multiply
    $min:   { lowestScore: 50 },  // set only if new value is less than current
    $max:   { highScore: 99 },    // set only if new value is greater than current
    $push:  { tags: "newTag" },   // append to array
    $pull:  { tags: "oldTag" },   // remove all matching values from array
    $addToSet: { tags: "unique" }, // push only if not already present
    $pop:   { queue: 1 },         // remove last element (1) or first element (-1)
    $rename: { oldName: "newName" }, // rename field
    $currentDate: { updatedAt: true } // set to current date
  },
  { upsert: true }  // insert if no match found
);

// Array update modifiers
db.col.updateOne(
  { _id: id, "scores.subject": "math" },          // match array element
  { $set: { "scores.$.grade": "A" } }              // $ = positional — updates matched element
);
// $[]: update all elements
// $[<identifier>]: filtered positional — update elements matching arrayFilters
db.col.updateOne(
  { _id: id },
  { $inc: { "scores.$[elem].points": 10 } },
  { arrayFilters: [{ "elem.points": { $gt: 80 } }] }
);

// replaceOne: replaces ENTIRE document (keeps _id) — dangerous, often unintended
db.col.replaceOne({ _id: id }, { name: "New Doc" });
// After: document has ONLY _id and name — all other fields lost

// findOneAndUpdate: atomic read-modify-write
const updated = db.col.findOneAndUpdate(
  { _id: id },
  { $inc: { counter: 1 } },
  { returnDocument: "after",  // "before" returns pre-update state
    upsert: true,
    projection: { counter: 1 } }
);

// =====================
// DELETE
// =====================
db.col.deleteOne({ _id: id });    // deletes first matching document
db.col.deleteMany({ age: { $lt: 18 } });   // deletes all matching
// No TRUNCATE equivalent — deleteMany({}) is slow for large collections
// For emptying a collection: db.col.drop() (also removes indexes — often what you want)

// findOneAndDelete: returns the deleted document atomically
const deleted = db.col.findOneAndDelete({ status: "pending" });
```

**L1 SIGNAL:** Must use `$set` in updates — not replace. Must know `$inc`, `$push`, `$pull`. Must know projection include vs exclude rule. Must distinguish `$elemMatch` from bare array field conditions.

**L1 RED FLAGS:**
- Writes `db.col.updateOne(filter, { name: "Bob" })` — replaces the document instead of using `$set`
- Does not know `$exists` — writes queries that check for null when the field may not exist
- Mixes include and exclude projections — confused when compiler errors appear
- Does not know `ordered: false` in `insertMany` for bulk insertion robustness

**L2 SIGNAL:** Must know `$expr` for cross-field comparisons. Must know the difference between `$push` and `$addToSet`. Must know `findOneAndUpdate` for atomic read-modify operations. Must know positional operator `$` and filtered positional `$[identifier]`. Must know `replaceOne` replaces the entire document.

**L2 RED FLAGS:**
- Uses `find()` + manual check + `update()` (two round trips) where `findOneAndUpdate` would be atomic
- Does not know `$currentDate` — manually sets `updatedAt: new Date()` in application code (race condition risk)
- Does not know `$addToSet` — uses `$push` and queries first to avoid duplicates (not atomic)
- Cannot explain when to use `$pull` vs `$pop` vs `$unset` on array fields

**L3 SIGNAL:** Must know: (1) `$where` executes JavaScript on the server — disables query optimizer, bypasses indexes, single-threaded per mongod — never in production. (2) Regex queries without anchors (`^`) cause collection scans even with an index. (3) `$in` with a large array (>1000 values) can be slower than multiple targeted queries due to index scan overhead. (4) Update operators are parsed as a single atomic document write in WiredTiger — field-level atomicity within a single document is guaranteed. (5) `$push` with `$each` + `$sort` + `$slice` is the idiomatic pattern for maintaining a capped sorted array (e.g., top-10 leaderboard per document) — all in a single atomic operation.

---

## 3. Indexing — Strategy, Types, and Internals

### Mechanics

MongoDB's indexes are B-tree structures (WiredTiger uses B+-trees). Every index is a separate B+-tree stored on disk, maintained on every write that touches indexed fields. Indexes accelerate reads at the cost of write amplification and storage. The query planner evaluates candidate index plans and caches the winning plan per query shape.

**Index types available:**
- Single field
- Compound (multiple fields, order and sort direction matter)
- Multikey (automatically created when indexing an array field)
- Text (inverted index for full-text search)
- Geospatial (2d, 2dsphere)
- Hashed (for hash-based sharding)
- Sparse (only indexes documents that have the field)
- Partial (only indexes documents matching a filter expression)
- TTL (time-to-live: automatically deletes documents)
- Wildcard (indexes all fields or a subtree)
- Compound wildcard (7.0+)

```javascript
// INDEX CREATION
db.users.createIndex({ email: 1 });              // ascending single field
db.users.createIndex({ createdAt: -1 });          // descending
db.users.createIndex({ email: 1 }, { unique: true });  // unique constraint
db.users.createIndex({ email: 1 }, { sparse: true });  // only index docs with email field
// Sparse + unique: allows multiple docs without the field (only one null allowed with non-sparse unique)

// COMPOUND INDEX: field ORDER and SORT DIRECTION both matter
db.orders.createIndex({ status: 1, createdAt: -1 });
// This index supports:
//   find({ status: "pending" })                           ← uses prefix
//   find({ status: "pending" }).sort({ createdAt: -1 }) ← full index
//   find({ status: "pending" }).sort({ createdAt: 1 })  ← uses index, reversal ok
// This index DOES NOT efficiently support:
//   find({ createdAt: { $gt: yesterday } })              ← non-prefix, causes full index scan or COLLSCAN
//   find({}).sort({ status: 1, createdAt: 1 })          ← direction mismatch on createdAt

// ESR RULE: Equality → Sort → Range
// Most selective equality fields first, then sort fields, then range fields
// WRONG order:
db.orders.createIndex({ createdAt: -1, status: 1, userId: 1 });
// CORRECT order for: find({ status: "active", userId: X }).sort({ createdAt: -1 })
db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 });
//  userId: equality (most selective), status: equality, createdAt: sort

// EXPLAIN: understand query execution
const plan = db.orders.find({ status: "pending" }).explain("executionStats");
// Key fields to check:
plan.queryPlanner.winningPlan.stage;          // "IXSCAN" (index scan) or "COLLSCAN" (collection scan)
plan.executionStats.totalDocsExamined;        // should be close to totalDocsReturned
plan.executionStats.totalKeysExamined;        // index keys scanned
plan.executionStats.executionTimeMillis;      // actual execution time
plan.executionStats.nReturned;                // documents returned

// BAD: totalDocsExamined >> nReturned — index selectivity is poor or wrong index used
// GOOD: totalDocsExamined ≈ nReturned — efficient index usage

// MULTIKEY INDEX: auto-created when field contains an array
db.users.createIndex({ tags: 1 });  // automatically multikey if tags is an array
// Multikey limitation: compound index cannot have TWO multikey fields from the same document
// (one array field per compound index — prevents index key explosion)
db.products.createIndex({ categories: 1, tags: 1 });
// If categories AND tags are both arrays → index creation fails

// TTL INDEX: automatic document expiration
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Documents are deleted when current time > expiresAt + 0 seconds
// TTL deletion runs every 60 seconds (background thread) — not exact
// TTL requires a Date field; works per-document, not collection-level

db.logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // expire after 24h

// PARTIAL INDEX: index only a subset of documents
db.orders.createIndex(
  { status: 1, createdAt: -1 },
  { partialFilterExpression: { status: { $in: ["pending", "processing"] } } }
);
// Only indexes documents with pending or processing status
// Smaller index = faster writes, less memory
// Query MUST include the partial filter condition to use this index
db.orders.find({ status: "pending" }).sort({ createdAt: -1 });   // USES partial index
db.orders.find({ createdAt: { $gt: yesterday } });                // DOES NOT use it

// TEXT INDEX: inverted index for full-text search
db.articles.createIndex({ title: "text", body: "text" }, { weights: { title: 10, body: 1 } });
db.articles.find({ $text: { $search: "mongodb performance" } });  // tokenizes, stems, stops
db.articles.find(
  { $text: { $search: "\"exact phrase\"" } },  // phrase search with quotes
  { score: { $meta: "textScore" } }             // get relevance score
).sort({ score: { $meta: "textScore" } });

// Only ONE text index per collection
// Text search does NOT support: prefix/suffix matching, regex, per-field search without full text index
// For production search: prefer Atlas Search (Lucene-backed) over text indexes

// HASHED INDEX: for hash-based sharding, supports only equality (not range)
db.users.createIndex({ userId: "hashed" });
// Cannot use hashed index for range queries or sorting

// WILDCARD INDEX: index all fields or a subtree (useful for arbitrary dynamic schemas)
db.products.createIndex({ "$**": 1 });                     // all fields
db.products.createIndex({ "metadata.$**": 1 });            // only metadata subtree
// Wildcard index supports single-field equality and range queries
// Cannot replace compound indexes — no compound wildcard until 7.0
// Write overhead: indexes every field — expensive for large documents

// COMPOUND WILDCARD INDEX (7.0+)
db.products.createIndex({ category: 1, "attributes.$**": 1 });
// Fixed field (category) + wildcard for dynamic attributes

// INDEX STATS
db.users.aggregate([{ $indexStats: {} }]);
// Shows: accesses (how many times each index was used), since (when stats were reset)
// Indexes with 0 accesses are candidates for removal — unused indexes waste write throughput
```

**L1 SIGNAL:** Must know single-field and compound index creation. Must use `explain()` to verify index usage. Must know the 16MB document limit doesn't affect index size. Must know `unique` and `sparse` options. Must know TTL indexes.

**L1 RED FLAGS:**
- Does not know `explain()` — cannot verify whether a query uses an index
- Creates a new index for every query without understanding compound index prefix rules
- Does not know `unique: true` creates a uniqueness constraint (thinks it only speeds up queries)
- Does not know TTL indexes — implements document expiration with a cron job that calls `deleteMany`

**L2 SIGNAL:** Must explain the ESR rule (Equality-Sort-Range). Must know compound index prefix rules — a compound index on `{a,b,c}` supports queries on `{a}`, `{a,b}`, `{a,b,c}` but NOT `{b}`, `{b,c}`, `{c}` alone. Must know partial indexes and when they save memory and write overhead. Must explain multikey index limitations (one array field per compound index). Must use `$indexStats` to identify unused indexes.

**L2 RED FLAGS:**
- Cannot explain compound index prefix rule — believes a compound index on `{a,b}` helps a query on `{b}` alone
- Does not know the ESR ordering rule — creates indexes with range fields before sort fields
- Does not know partial indexes — creates full indexes on rarely-queried subsets
- Cannot read `explain()` output — does not know what `COLLSCAN` means or how to fix it

**L3 SIGNAL:** Must know: (1) Index intersection (MongoDB can use two indexes for a single query) — rare and often slower than a single compound index due to the cost of intersecting two B+-tree results. (2) Index build process: foreground index builds block all operations (< MongoDB 4.2); background builds don't block but are slower; 4.2+ all index builds are "hybrid" — brief collection locks at start and end, non-blocking during scan. (3) Index on an array field creates one index entry per array element — document with 100-element array creates 100 index entries; large arrays cause index bloat. (4) Covered queries: query satisfied entirely from index data, no document fetch — requires that all fields in the query and projection are in the index. (5) `hint()` to force a specific index — useful when the query planner chooses suboptimally. (6) Index key size limit: 1024 bytes in MongoDB < 4.2; removed in 4.2+ (unlimited key size). (7) Hashed index cannot be used with `$gt`, `$lt`, range queries, or sorting — equality only.

---

## 4. Aggregation Pipeline

### Mechanics

The aggregation pipeline is MongoDB's primary data transformation and analytics tool. It processes documents through an ordered sequence of stages. Each stage transforms the data stream. Pipeline stages are executed server-side; the optimizer may reorder certain stages for efficiency. Since MongoDB 4.2, pipelines are available in update operations.

```javascript
// COMMON PIPELINE STAGES AND THEIR MECHANICS

// $match: filter documents (same as find query — supports all query operators)
// OPTIMIZATION: $match early to reduce documents flowing to later stages
// $match before $unwind dramatically reduces documents to unwind
{ $match: { status: "active", createdAt: { $gte: ISODate("2024-01-01") } } }

// $project: reshape documents — include, exclude, compute new fields
{ $project: {
    name: 1,                           // include
    password: 0,                       // exclude
    fullName: { $concat: ["$firstName", " ", "$lastName"] },  // computed
    ageGroup: { $cond: { if: { $gte: ["$age", 18] }, then: "adult", else: "minor" } },
    year: { $year: "$createdAt" }      // date extract
}}

// $addFields: add fields without removing existing ones (unlike $project)
{ $addFields: { totalItems: { $size: "$items" }, isVip: { $gt: ["$spent", 1000] } } }

// $group: aggregate by key — SQL GROUP BY equivalent
{ $group: {
    _id: "$status",                         // group key (null = group all into one)
    count:   { $sum: 1 },                   // count documents
    total:   { $sum: "$amount" },           // sum field
    average: { $avg: "$amount" },           // average
    max:     { $max: "$amount" },
    min:     { $min: "$amount" },
    items:   { $push: "$item" },            // accumulate into array (memory concern!)
    unique:  { $addToSet: "$category" },    // unique values array
    first:   { $first: "$name" },           // first value in group
    last:    { $last: "$name" }             // last value in group (after sort)
}}

// $sort: sort documents
{ $sort: { amount: -1, name: 1 } }
// Optimization: $sort after $group is efficient if grouping reduces doc count
// $sort BEFORE $group or $match may use an index — $sort standalone uses collection sort

// $limit and $skip (for pagination)
{ $limit: 20 }
{ $skip: 40 }
// Pipeline pagination: [{ $match }, { $sort }, { $skip: offset }, { $limit: pageSize }]
// PROBLEM: $skip scans and discards all skipped documents — slow for large offsets
// BETTER: keyset pagination using $match on last seen _id

// $lookup: left outer join to another collection
{ $lookup: {
    from:         "inventory",       // foreign collection
    localField:   "item",            // field in current documents
    foreignField: "sku",             // field in foreign collection
    as:           "inventoryData"    // name of output array field
}}
// Result: inventoryData is an array of matched documents (empty array if no match)

// $lookup with pipeline (4.0+): full pipeline on joined collection, supports conditions
{ $lookup: {
    from: "orders",
    let:  { userId: "$_id", minAmount: 100 },   // expose local fields to pipeline
    pipeline: [
      { $match: { $expr: {
          $and: [
            { $eq:  ["$$userId", "$customerId"] },   // $$var = let variable, $field = from-collection field
            { $gte: ["$amount", "$$minAmount"] }
          ]
      }}},
      { $sort: { createdAt: -1 } },
      { $limit: 5 }
    ],
    as: "recentLargeOrders"
}}

// $unwind: deconstruct array into separate documents (one doc per array element)
{ $unwind: "$tags" }
// { tags: ["a","b","c"] } → three documents with tags: "a", "b", "c"
// { $unwind: { path: "$tags", includeArrayIndex: "tagIndex", preserveNullAndEmpty: true } }
// preserveNullAndEmpty: keep documents where tags is null/missing/empty array

// $facet: multiple parallel aggregations in a single pipeline pass
{ $facet: {
    byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
    priceRange: [{ $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }],
    total: [{ $count: "count" }]
}}
// Returns single document with byStatus, priceRange, total fields
// Use for: search result facets, dashboard stats in one round trip

// $bucket and $bucketAuto
{ $bucket: {
    groupBy: "$age",
    boundaries: [0, 18, 30, 50, 65, 100],  // must be ascending, N boundaries = N-1 buckets
    default: "other",                        // for values outside boundaries
    output: { count: { $sum: 1 }, avgScore: { $avg: "$score" } }
}}
{ $bucketAuto: { groupBy: "$price", buckets: 5 } }  // auto-compute bucket boundaries

// $count
{ $count: "total" }   // adds a single document: { total: N }
// Equivalent to: [{ $group: { _id: null, total: { $sum: 1 } } }, { $project: { _id: 0, total: 1 } }]

// $sortByCount: group by expression, sort by count descending
{ $sortByCount: "$category" }  // equivalent to $group + $sort by count

// $replaceRoot: make a subdocument the new root
{ $replaceRoot: { newRoot: "$address" } }   // promote address subdoc to root level
{ $replaceWith: "$userProfile" }             // alias for $replaceRoot

// $merge: write pipeline results to a collection (4.2+)
{ $merge: {
    into: "monthly_summary",
    on: ["year", "month"],       // unique key fields for matching
    whenMatched: "merge",        // merge, replace, keepExisting, fail, or pipeline
    whenNotMatched: "insert"
}}
// Use for: incrementally updating aggregated summary collections

// $out: write all results to a new collection (replaces entirely)
{ $out: "collection_name" }  // atomically replaces collection at end of pipeline

// $unionWith: combine documents from another collection (4.4+)
{ $unionWith: { coll: "archived_orders", pipeline: [{ $match: { year: 2023 } }] } }

// WINDOW FUNCTIONS ($setWindowFields, 5.0+)
{ $setWindowFields: {
    partitionBy: "$department",
    sortBy: { salary: -1 },
    output: {
        rank:        { $rank: {} },
        denseRank:   { $denseRank: {} },
        runningSalary: { $sum: "$salary", window: { documents: ["unbounded", "current"] } },
        movingAvg:   { $avg: "$salary", window: { documents: [-2, 0] } }  // 3-doc moving avg
    }
}}

// PIPELINE OPTIMIZATION HINTS:
// 1. $match and $sort early — can use indexes, reduces document flow
// 2. $project early to reduce document size flowing through pipeline
// 3. $group reduces document count — put computations after $group to avoid per-doc overhead
// 4. $lookup is expensive — filter before joining, limit joined results with pipeline form
// 5. $unwind before $group if grouping on array elements
// 6. Use allowDiskUse: true for pipelines exceeding 100MB memory limit
db.orders.aggregate(pipeline, { allowDiskUse: true });
```

**L1 SIGNAL:** Must write pipelines with `$match`, `$group`, `$project`, `$sort`. Must know `$lookup` for joins. Must know `$unwind` for arrays. Must understand that pipeline stages process in order and that `$match` early improves performance.

**L1 RED FLAGS:**
- Cannot write a basic `$group` with `$sum` and `$avg`
- Does not know `$lookup` — fetches related documents with separate queries in application code
- Puts `$sort` before `$match` — does not know early `$match` reduces processed documents
- Does not know `allowDiskUse: true` — pipeline fails on large datasets without it

**L2 SIGNAL:** Must know `$facet` for parallel aggregations (single pass, multiple results). Must use `$lookup` with pipeline form for filtered joins. Must know `$merge` vs `$out`. Must know `$unwind` with `preserveNullAndEmpty`. Must know `$bucket` for histogram-style grouping. Must explain pipeline optimization strategies (early `$match`/`$project`, reduce doc size before expensive stages).

**L2 RED FLAGS:**
- Cannot write a `$lookup` with the pipeline form (using `let`/`$$variable`)
- Does not know `$facet` — makes multiple separate aggregation queries for dashboard stats
- Cannot explain why `$match` placement matters for performance
- Uses `$out` when `$merge` would be appropriate for incremental updates

**L3 SIGNAL:** Must know: (1) Pipeline memory limit: each stage has a 100MB RAM limit by default — `allowDiskUse: true` spills to disk, which can be 10-100x slower. (2) `$group` with `$push` can exceed memory limits if arrays grow unbounded — use `$topN` (5.0+) or `$firstN`/`$lastN` accumulators with limits. (3) `$lookup` performs a separate query per document in the pipeline — N documents = N separate collection scans unless the joined collection has an index on the `foreignField`. Always verify with `explain()`. (4) `$unwind` on a large array creates a document explosion — 1 doc with 1000-element array becomes 1000 docs; a `$match` before `$unwind` with a filter on the array field first can dramatically reduce this. (5) `$setWindowFields` (5.0) enables rank, running totals, moving averages natively — previously required complex multi-pass aggregations or application-side computation. (6) Change streams use aggregation pipeline syntax for filtering — the same `$match` and `$project` operators apply.

---

## 5. Schema Design Patterns

### Mechanics

MongoDB's flexible schema is not "schemaless" — every production system has an implicit schema. The question is whether it's enforced, and where design decisions are made. Schema design in MongoDB optimizes for the **query pattern** (how data is read and written), not for data normalization. The fundamental choice is **embedding vs referencing**.

```javascript
// EMBEDDING: store related data in the same document
// Use when: data is accessed together, one-to-few relationship, subdoc doesn't exceed document limit
{
  _id: ObjectId("..."),
  name: "Alice",
  address: {           // embedded: address is always fetched with user, never alone
    street: "123 Main St",
    city: "Springfield"
  },
  phoneNumbers: [      // embedded array: few items, fetched with user
    { type: "home", number: "555-1234" },
    { type: "work", number: "555-5678" }
  ]
}

// REFERENCING: store _id of related document
// Use when: data is accessed independently, one-to-many (large many), many-to-many
{
  _id: ObjectId("userId"),
  name: "Alice",
  departmentId: ObjectId("deptId")  // reference — department has many users, fetched separately
}
// Requires application-side join ($lookup in aggregation, or two queries)

// ONE-TO-ONE: usually embed
// ONE-TO-FEW (user has a few addresses): embed array
// ONE-TO-MANY (blog post has many comments): reference (comments collection) or hybrid
// ONE-TO-SQUILLIONS (server has millions of log entries): ALWAYS reference
// MANY-TO-MANY: reference with array of _ids on one side, or join collection

// PATTERN 1: BUCKET PATTERN — group time-series data into time-based documents
// Problem: millions of sensor readings, one document per reading = index bloat, slow aggregation
// Solution: bucket N readings per document
{
  _id: ObjectId(),
  sensorId: "sensor_01",
  timestamp: ISODate("2024-01-01T00:00:00Z"),  // start of bucket period (e.g., 1 hour)
  measurements: [
    { t: ISODate("2024-01-01T00:01:23Z"), temp: 22.5, humidity: 45 },
    { t: ISODate("2024-01-01T00:02:10Z"), temp: 22.7, humidity: 44 },
    // ... up to 200 readings per bucket
  ],
  count: 200,
  avgTemp: 22.6,   // pre-computed summary — avoids unwind for dashboard
  minTemp: 21.0,
  maxTemp: 24.1
}
// Reduces document count by 200x, pre-computed summaries speed dashboard queries
// MongoDB 5.0+ has native time-series collection type that does this automatically

// PATTERN 2: OUTLIER PATTERN — handle documents that break the usual pattern
// Problem: most blog posts have <50 comments, but viral posts have 100,000
// Embedding works for most, but outliers break 16MB limit
{
  _id: ObjectId("postId"),
  title: "My Post",
  body: "...",
  comments: [ /* first 100 comments embedded */ ],
  hasMoreComments: true,   // flag: true = overflow documents exist
  commentCount: 100234
}
// Overflow in separate comments collection when hasMoreComments = true
// 99% of documents are fast (embedded), outliers handled separately

// PATTERN 3: COMPUTED PATTERN — pre-compute expensive aggregations
// Problem: dashboard shows total orders, revenue, avg order value — expensive to compute live
// Solution: maintain pre-computed summary document, update on write
{
  _id: "daily:2024-01-15",
  date: ISODate("2024-01-15"),
  totalOrders:   1523,
  totalRevenue:  NumberDecimal("45234.50"),
  avgOrderValue: NumberDecimal("29.70"),
  topProducts:   [/* pre-computed */]
}
// Update on each order: { $inc: { totalOrders: 1, totalRevenue: orderAmount } }
// Cost: extra write per order. Benefit: dashboard reads are O(1)

// PATTERN 4: EXTENDED REFERENCE PATTERN — duplicate frequently-accessed fields from referenced doc
// Problem: showing order list requires customer name — requires $lookup on every page load
// Solution: duplicate name (and only name) into the order document
{
  _id: ObjectId("orderId"),
  customerId: ObjectId("customerId"),
  customerName: "Alice Smith",   // duplicated from customer — denormalized
  customerEmail: "alice@x.com",  // duplicated — only the fields we always need with order
  items: [...],
  total: 99.99
}
// Trade-off: if customer changes name, order history is stale (usually acceptable for orders)
// Only duplicate fields that: are needed with the parent, change rarely

// PATTERN 5: SUBSET PATTERN — store hot and cold data separately
// Problem: product catalog has 500-field documents, but most queries only use 10 fields
// Solution: main collection has top 10 fields, details collection has the rest
// products (hot): { _id, name, price, imageUrl, rating, inStock, category }
// products_detail (cold): { _id /* same as products._id */, fullDescription, specs, reviews, ... }
// Most API calls hit only products collection; detail page hits both

// PATTERN 6: TREE PATTERNS for hierarchical data
// Method 1: Parent Reference (simple, navigation expensive)
{ _id: "leaf", parentId: "branch" }

// Method 2: Array of Ancestors (fast ancestor lookups, updates expensive)
{ _id: "leaf", ancestors: ["root", "branch", "twig"], parent: "twig" }
db.tree.find({ ancestors: "root" })  // all descendants of root

// Method 3: Materialized Paths (flexible, regex-based subtree queries)
{ _id: "leaf", path: ",root,branch,twig,leaf," }
db.tree.find({ path: /,branch,/ })  // all nodes under branch

// Method 4: Nested Sets (fast subtree reads, expensive tree modifications)
{ _id: "leaf", left: 7, right: 8 }
db.tree.find({ left: { $gt: 2 }, right: { $lt: 9 } })  // subtree

// SCHEMA VALIDATION: enforce structure at the database level
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "createdAt"],
      properties: {
        name:      { bsonType: "string", minLength: 1, maxLength: 100 },
        email:     { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
        age:       { bsonType: "int", minimum: 0, maximum: 150 },
        createdAt: { bsonType: "date" }
      },
      additionalProperties: true  // allow extra fields
    }
  },
  validationLevel:  "strict",  // or "moderate": only validates inserts and updates, not pre-existing
  validationAction: "error"    // or "warn": log but don't reject
});
```

**L1 SIGNAL:** Must explain embedding vs referencing and the one-to-few vs one-to-many decision. Must know schema validation exists. Must know the bucket pattern for time-series data at a conceptual level.

**L1 RED FLAGS:**
- Normalizes MongoDB data like a relational DB — separate collection for everything with foreign keys
- Does not know embedding exists — stores all related data as references requiring joins
- Cannot explain why the 16MB limit matters for schema design
- Does not know schema validation is possible in MongoDB

**L2 SIGNAL:** Must explain the computed pattern and when to use it (expensive aggregations on hot read paths). Must know the extended reference pattern and its staleness trade-off. Must know the outlier pattern for handling data distribution skew. Must use `$jsonSchema` for schema validation with required fields and type constraints. Must know tree representation patterns and trade-offs.

**L2 RED FLAGS:**
- Does not know the computed pattern — runs expensive aggregations on every dashboard load
- Does not know the extended reference pattern — does a `$lookup` on every order list request
- Cannot explain the embedding vs referencing trade-off beyond "NoSQL doesn't have joins"
- Does not know `validationLevel` and `validationAction` — thinks MongoDB schema validation is binary

**L3 SIGNAL:** Must know: (1) The schema versioning pattern: add a `schemaVersion` field to documents, migrate lazily on read (update to new schema on each document access). Avoids big-bang migrations that lock the collection. (2) The polymorphic pattern: multiple document types in one collection with a `type` discriminator — valid when objects share many attributes and are queried together. (3) "Schema design is query design" — the right schema is the one that makes your most frequent and most latency-sensitive queries fastest. (4) Normalization vs denormalization trade-off at scale: denormalized data improves read performance but creates write amplification (update in multiple places) and eventual consistency between copies. (5) Time-series collections (5.0+): automatically apply bucket pattern, compress measurements, support specialized indexes — use instead of manual bucket pattern for new projects.

---

## 6. Replication — Replica Sets

### Mechanics

A replica set is a group of mongod processes that maintain the same dataset. One node is elected primary; the rest are secondaries. Data is replicated via the oplog (operations log) — a capped collection in the `local` database. All writes go to the primary; reads can be directed to secondaries with appropriate read preference.

**Oplog characteristics:**
- Capped collection: fixed size, oldest entries overwritten
- Idempotent operations: each oplog entry can be replayed multiple times safely
- Oplog on each secondary lags behind primary based on network and load

```javascript
// REPLICA SET ARCHITECTURE
// Primary: accepts all writes, can be read
// Secondary: replicates from primary via oplog, can serve reads with readPreference
// Arbiter: votes in elections, holds no data, does not serve reads
// Hidden: replicates data, does not serve client reads, invisible to drivers
// Delayed: replicates with a configurable lag — for operational disaster recovery

// Recommended: odd number of data-bearing members (3 or 5)
// to ensure a majority for elections without arbiter complications

// WRITE CONCERN: how many nodes must acknowledge a write
// Default since 5.0: { w: "majority" } — wait for majority of nodes to commit
db.col.insertOne(doc, {
  writeConcern: {
    w: "majority",  // majority of voting nodes (recommended)
    j: true,        // wait for journal write (fsync to disk) on each node
    wtimeout: 5000  // fail after 5s if not enough nodes respond
  }
});
// w: 0  — fire and forget, no acknowledgment (danger: silent data loss)
// w: 1  — primary acknowledged (default pre-5.0: data can be lost on primary failover)
// w: 2  — 2 nodes acknowledged
// w: "majority" — recommended: survives primary failover without data loss
// j: false — data in RAM only, lost if mongod crashes before next journal flush (every 100ms)
// j: true  — data persisted to journal on each acknowledging node

// READ PREFERENCE: which nodes to read from
db.col.find({}).readPref("primary");         // default: only primary (strong consistency)
db.col.find({}).readPref("primaryPreferred"); // primary if available, else secondary
db.col.find({}).readPref("secondary");        // secondaries only (may be stale)
db.col.find({}).readPref("secondaryPreferred"); // secondary if available, else primary
db.col.find({}).readPref("nearest");          // lowest network latency (may be secondary)

// READ CONCERN: consistency guarantee for reads
// "local"     — may read uncommitted (default for reads without transaction)
// "available" — may read orphaned chunks during migrations (weakest)
// "majority"  — only reads data committed to a majority (requires primaryPreferred+ or primary)
// "linearizable" — reads reflect all prior majority writes (slowest, single doc reads only)
// "snapshot"  — consistent snapshot across the entire transaction

// CAUSAL CONSISTENCY: sessions track "afterClusterTime" to ensure reads see prior writes
const session = db.getMongo().startSession({ causalConsistency: true });
const coll = session.getDatabase("test").getCollection("orders");
coll.insertOne({ _id: 1, status: "pending" });
// Subsequent reads in same session guaranteed to see this write, even on secondaries

// ELECTION PROCESS
// Heartbeat timeout: 10 seconds (default) before candidate initiates election
// Election requires majority of voting members
// Priority: higher priority wins election (0 = never become primary, e.g., hidden/arbiter)
// Election takes ~12 seconds by default (electionTimeoutMillis = 10000)
// During election: writes fail (primary unavailable), reads can still go to secondary

// OPLOG OPERATIONS AND LIMITATIONS
// The oplog records every document mutation as an idempotent operation
// ops: "i" (insert), "u" (update), "d" (delete), "c" (command)
// Updates are recorded as the RESULT (new full document or specific field changes)
// Large transactions write entire oplog entry at commit — huge transactions = huge oplog entries
// Oplog window: time period covered by the oplog = oplog size / write throughput
// If secondary falls behind and primary's oplog window doesn't cover the gap → ROLLBACK required

// Verify oplog window:
rs.printReplicationInfo();
// Shows: oplog size, time range covered — if window is <24h, increase oplog size

// REPLICA SET STATUS
rs.status();    // shows all members, state, lag, oplog window
rs.conf();      // replica set configuration
rs.stepDown();  // force primary to step down (for maintenance)

// INITIAL SYNC: new member copies all data from an existing member
// For large datasets (hundreds of GB): use rsync/snapshot + oplog tailing to minimize sync time
// initial sync scans entire collection — can impact source member performance
```

**L1 SIGNAL:** Must know replica set purpose (high availability, redundancy). Must know primary vs secondary. Must know write concern `majority` is recommended. Must know read preference options at a conceptual level.

**L1 RED FLAGS:**
- Does not know write concern exists — thinks all writes are automatically safe
- Confused about read from secondary meaning stale data is possible
- Does not know what the oplog is
- Cannot explain what happens during a primary failover/election

**L2 SIGNAL:** Must explain the trade-off between write concern levels (`w:1` vs `w:majority`) in terms of data safety vs latency. Must explain read preference use cases (secondary for analytics, primary for consistent reads). Must explain causal consistency and when it's needed. Must know election mechanics and their impact on application availability. Must know oplog window and why it matters for replication lag.

**L2 RED FLAGS:**
- Does not know `j: true` and why a write acknowledged by RAM-only is at risk
- Cannot explain when to use `secondary` read preference vs `primary` — treats them as purely performance choices
- Does not know causal consistency — designs systems where reads don't see their own writes
- Cannot explain election timeout and what applications should do during the window

**L3 SIGNAL:** Must know: (1) Rollback risk: with `w:1` write concern, if primary crashes after acknowledging but before replicating, the write is rolled back when the old primary rejoins. The rolled-back write goes to a rollback file — not automatically applied. (2) Oplog is an idempotent log — update operations are stored as the net change, not the original operation, which enables safe replay. (3) Change streams consume the oplog — aggressive change stream watchers on busy collections can increase oplog retention requirements. (4) The "two members + arbiter" anti-pattern: an arbiter contributes to election majority but holds no data — with only 2 data members, losing either data member AND the primary is catastrophic (data loss). Best: 3 data-bearing members. (5) `majority` read concern requires all reads to check that data is committed on a majority — adds latency and cannot be used with `secondary` read preference unless using sessions. (6) Retryable writes (3.6+): driver retries write once on network error — requires idempotent write concern, which means `w:1` with retryable writes is not actually idempotent without extra application logic.

---

## 7. Sharding — Architecture and Patterns

### Mechanics

Sharding distributes data across multiple replica sets (shards). A sharded cluster consists of: shards (data-bearing replica sets), mongos routers (query routers, stateless), and config servers (store cluster metadata, replica set). The shard key determines how data is distributed.

**Shard key selection is permanent** (prior to MongoDB 5.0 — `reshardCollection` added in 5.0 allows changing shard key). A poor shard key causes hotspots, uneven data distribution, and scattered queries — all major production problems.

```javascript
// SHARDING A COLLECTION
sh.enableSharding("mydb");
db.adminCommand({
  shardCollection: "mydb.orders",
  key: { customerId: 1 }   // shard key
});

// SHARD KEY PROPERTIES
// Cardinality: high cardinality = many possible shard key values = fine-grained distribution
//   LOW cardinality example: { status: 1 } — only 3-5 values → max 3-5 chunks → max 3-5 shards useful
//   HIGH cardinality example: { customerId: 1 } — millions of distinct values → good

// Write distribution: should spread writes across all shards
//   BAD: monotonically increasing key (ObjectId, timestamp) → all writes hit newest chunk → hotspot
//   GOOD: { userId: 1 } or { hashed_id: "hashed" } → writes distributed across all shards

// Query isolation: ideally every query includes the shard key → targeted to one shard
//   If query omits shard key → broadcast query → hits ALL shards → expensive

// SHARD KEY STRATEGIES
// Strategy 1: Hashed sharding — guaranteed uniform write distribution
db.adminCommand({ shardCollection: "mydb.events", key: { _id: "hashed" } });
// Pros: no hotspot, even distribution
// Cons: range queries always broadcast (cannot range-query a hashed field), chunk splits are random

// Strategy 2: Ranged sharding with compound key — supports targeted range queries
db.adminCommand({ shardCollection: "mydb.orders", key: { customerId: 1, createdAt: 1 } });
// All orders for customerId 123 are co-located → targeted query
// Time range queries also targeted when combined with customerId filter
// Cons: if most queries are by time across all customers → still broadcast

// Strategy 3: Zoned sharding — pin data to specific shards by key range
// Use case: geo-compliance (EU data on EU shards), hot/cold tiering
sh.addTagRange("mydb.users", { region: "EU", _id: MinKey }, { region: "EU", _id: MaxKey }, "eu_shard");
sh.addTagRange("mydb.users", { region: "US", _id: MinKey }, { region: "US", _id: MaxKey }, "us_shard");

// CHUNK MECHANICS
// Default chunk size: 128MB
// MongoDB splits chunks when they exceed the target size
// MongoDB moves chunks between shards (balancer) to equalize data distribution
// Balancer runs in background — can impact performance during migrations
// To disable balancer during maintenance:
sh.stopBalancer();
sh.startBalancer();
sh.getBalancerState();

// BROADCAST vs TARGETED QUERIES
// Targeted: query includes shard key → mongos routes to single shard
// Broadcast: query omits shard key → mongos queries ALL shards, merges results
// Broadcast query on a 10-shard cluster: 10x more work, 10x more latency
// Verify: explain({ verbosity: "executionStats" }) on a sharded collection
// Look for: "winningPlan.stage" = "SINGLE_SHARD" vs "SHARD_MERGE"

// SCATTER-GATHER (broadcast) example:
db.orders.find({ amount: { $gt: 100 } });   // no shard key → hits all shards

// TARGETED example:
db.orders.find({ customerId: 123, amount: { $gt: 100 } });   // customerId in shard key → one shard

// JUMBO CHUNKS: chunks that cannot be split because all documents share the same shard key value
// Example: shard key = { country: 1 }, and 30% of documents have country = "US"
// All "US" documents must be in the same chunk — cannot split it further
// Cannot be balanced (balancer can't move a chunk larger than chunk size limit)
// Prevention: high-cardinality shard key, compound key with unique second field

// RESHARDING (5.0+): change shard key without dropping and recreating collection
db.adminCommand({
  reshardCollection: "mydb.orders",
  key: { region: 1, customerId: 1 }  // new shard key
});
// Runs in background — copies data to new distribution
// Can take hours for large collections
// Application continues to work during resharding

// MONGOS ROUTER BEHAVIOR
// mongos is stateless — can run many instances for load balancing and HA
// mongos caches shard metadata — periodically refreshes from config servers
// stale metadata: mongos sends query to wrong shard → shard returns "StaleShardVersion" error → mongos re-routes
// Application drivers handle StaleShardVersion transparently via retry

// AGGREGATION ON SHARDED COLLECTIONS
// Most pipeline stages run on each shard (shard merger on mongos or a random shard)
// $group, $sort, $limit may require merge phase on mongos — creates bottleneck
// $out and $merge: runs on a specific shard chosen by mongos
// $lookup on sharded collections: joining a sharded collection is restricted
//   (cannot do $lookup where the joined collection's join field is the shard key's non-prefix)
```

**L1 SIGNAL:** Must explain the purpose of sharding (horizontal scale beyond single replica set). Must know what a shard key is. Must know hashed vs ranged sharding at a conceptual level. Must know mongos is a router.

**L1 RED FLAGS:**
- Thinks sharding automatically improves performance for all queries — does not know broadcast queries exist
- Cannot explain what a shard key is
- Does not know that a poor shard key choice causes a hotspot
- Thinks more shards always = more performance

**L2 SIGNAL:** Must explain the shard key selection criteria (cardinality, write distribution, query isolation). Must know the hotspot problem with monotonically increasing keys (ObjectId, timestamp). Must know hashed sharding and its trade-offs (no range queries). Must explain broadcast vs targeted queries and their performance difference. Must know jumbo chunks and how they occur.

**L2 RED FLAGS:**
- Recommends `_id: ObjectId` as shard key without knowing about write hotspots
- Cannot explain why a low-cardinality shard key limits the number of useful shards
- Does not know the balancer exists or that it can impact performance
- Cannot explain why a query without the shard key hits all shards

**L3 SIGNAL:** Must know: (1) Shard key is immutable per document in MongoDB < 5.0; 5.0+ allows document shard key updates if the key is not the `_id`. (2) Scatter-gather at scale: a broadcast query on a 20-shard cluster with P99 latency of 5ms per shard has a P99 of ~5ms (parallel) plus merge overhead — but if any one shard is slow (stragglers), the whole query waits. Hedged reads (4.4+) mitigate straggler issues. (3) Config server replica set: if all config servers are unavailable, the cluster becomes read-only (cannot change metadata). (4) Shard key compound design for time-series at scale: `{ deviceId: 1, timestamp: 1 }` — device-level monotonic writes are fine (each device is its own mini-hotspot, and load is distributed across devices). (5) The `moveChunk` command blocks reads briefly during migration "critical section" — on collections with very high write throughput, chunk migrations can cause latency spikes. (6) Transactions across shards require 2PC (two-phase commit) coordinated by mongos — significantly more overhead than single-shard transactions.

---

## 8. Transactions — ACID Guarantees

### Mechanics

MongoDB supports multi-document ACID transactions since 4.0 (single replica set) and distributed transactions across shards since 4.2. Transactions use snapshot isolation (read your own writes within transaction, consistent snapshot view). All or nothing: transaction either commits or rolls back entirely. WiredTiger provides document-level locking; transactions can conflict.

```javascript
// SINGLE-DOCUMENT OPERATIONS ARE ALWAYS ATOMIC
// No transaction needed for:
db.accounts.updateOne(
  { _id: accountId },
  { $inc: { balance: -100 } }   // atomic — either happens or doesn't
);
// Also atomic: findOneAndUpdate, insertOne, deleteOne

// MULTI-DOCUMENT TRANSACTION (4.0+)
const session = db.getMongo().startSession();
session.startTransaction({
  readConcern:  { level: "snapshot" },     // consistent snapshot for all reads in transaction
  writeConcern: { w: "majority", j: true } // writes must be majority-committed
});
try {
  const accounts = session.getDatabase("bank").getCollection("accounts");
  accounts.updateOne(
    { _id: "alice", balance: { $gte: 100 } },
    { $inc: { balance: -100 } },
    { session }  // MUST pass session to every operation in the transaction
  );
  accounts.updateOne(
    { _id: "bob" },
    { $inc: { balance: 100 } },
    { session }
  );
  session.commitTransaction();
} catch (err) {
  session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}

// TRANSACTION LIMITATIONS
// Time limit: 60 seconds by default (transactionLifetimeLimitSeconds)
// Operations within a transaction must complete within this window
// Pinned to a single mongos for the duration (if sharded) — affects load balancing

// WHAT CANNOT BE DONE IN A TRANSACTION:
// - Create or drop collections
// - Create or drop indexes
// - Use $out in aggregation (use $merge instead — works in transactions)
// - Call admin commands (createUser, etc.)
// - Operations on collections in the admin, local, or config databases

// WRITE CONFLICTS: two transactions modify the same document
// MongoDB uses optimistic concurrency for transactions
// If transaction A and transaction B both try to write the same document:
// First committer wins; second gets a WriteConflict error
// Correct pattern: retry on WriteConflict
const MAX_RETRIES = 5;
async function transferWithRetry(fromId, toId, amount) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const session = client.startSession();
    try {
      session.startTransaction();
      await accounts.updateOne({ _id: fromId }, { $inc: { balance: -amount } }, { session });
      await accounts.updateOne({ _id: toId },   { $inc: { balance: amount  } }, { session });
      await session.commitTransaction();
      return;  // success
    } catch (err) {
      await session.abortTransaction();
      if (err.hasErrorLabel("TransientTransactionError") ||
          err.hasErrorLabel("UnknownTransactionCommitResult")) {
        continue;  // retry
      }
      throw err;   // non-retryable error
    } finally {
      session.endSession();
    }
  }
  throw new Error("Transaction failed after max retries");
}

// ERROR LABELS FOR RETRY LOGIC:
// "TransientTransactionError"  — safe to retry entire transaction (network error, write conflict)
// "UnknownTransactionCommitResult" — commit result unknown (network error on commit)
//   → retry just the commit (commitTransaction), do NOT retry the whole transaction
//   → if commit actually succeeded on retry, operation is idempotent and safe

// TRANSACTION PERFORMANCE CONSIDERATIONS
// Transactions hold locks on modified documents for their duration
// Long transactions increase lock contention and block other operations
// WiredTiger snapshot isolation: each transaction gets a point-in-time snapshot
//   → readers don't block writers, writers don't block readers (MVCC)
//   → but: two transactions writing the same doc = conflict

// Transactions on sharded clusters (4.2+):
// Use 2-phase commit across shards — 3-5x slower than single-shard transactions
// Network round-trips between mongos, shards, and config server for each 2PC step
// Recommendation: keep transactions to single shard when possible (use shard key in filter)

// TRANSACTION vs SINGLE DOCUMENT ATOMIC OPERATIONS
// Single doc atomic ops should be STRONGLY PREFERRED where possible
// Design schema to make common operations single-document:
//   Transfer between sub-accounts: store both balances in same document
//   { _id: "alice", accounts: { checking: 1000, savings: 5000 } }
//   db.users.updateOne({ _id: "alice" }, { $inc: { "accounts.checking": -100, "accounts.savings": 100 } })
//   ← single atomic operation, no transaction needed

// WHEN TO USE TRANSACTIONS:
// - Multiple collections must be updated atomically
// - Pattern requires reading a value and writing based on it (conditional update) when atomicity required
//   (though findOneAndUpdate handles the simple case)
// - Saga/workflow patterns requiring rollback on failure
// WHEN NOT TO USE TRANSACTIONS:
// - Single document updates (always atomic, much faster)
// - When eventual consistency is acceptable
// - When you can redesign the schema for single-document atomicity
```

**L1 SIGNAL:** Must know single-document operations are always atomic. Must know transactions exist and when to use them. Must pass `session` to every operation in a transaction.

**L1 RED FLAGS:**
- Does not know that single-document `updateOne` is already atomic — uses a transaction for it
- Forgets to pass `session` to collection operations — operations run outside the transaction
- Does not call `abortTransaction()` on error — transaction held open until server-side timeout
- Cannot explain what "ACID" means for MongoDB transactions

**L2 SIGNAL:** Must know the TransientTransactionError vs UnknownTransactionCommitResult retry distinction. Must know transaction time limit (60s). Must know what operations cannot be performed inside transactions. Must prefer single-document atomic operations over transactions where possible. Must explain WiredTiger optimistic concurrency and WriteConflict errors.

**L2 RED FLAGS:**
- Does not know the difference between the two error labels for retry
- Uses transactions for everything instead of single-document atomic operations
- Does not know `$out` cannot be used inside a transaction
- Cannot explain write conflict and how to handle it

**L3 SIGNAL:** Must know: (1) Distributed transactions (4.2+) use 2-phase commit — prepare phase locks all shards, commit phase confirms. Failure between prepare and commit leaves participants in "prepared" state until coordinator resolves. This is transparent to the application but has a significant performance cost. (2) Transaction throughput is limited by the coordinator shard — a single coordinator managing many distributed transactions creates a bottleneck. Designing to avoid distributed transactions (co-locating related data on same shard) is the correct architectural answer. (3) Oplog entries for multi-document transactions are applied atomically — the entire transaction appears as a single oplog entry, which means secondary replication latency includes the entire transaction duration. (4) MVCC in WiredTiger: each transaction gets a snapshot of the committed data at the time it starts — long-running transactions retain a snapshot that prevents WiredTiger from reclaiming old versions of modified documents (checkpoint pressure). (5) Read-your-writes within a transaction: `readConcern: "snapshot"` provides a consistent view of all operations within the session, including within-transaction writes — but the snapshot is taken at transaction start, so concurrent commits from other transactions are not visible.
ENDOFFILE
---

## 9. WiredTiger Storage Engine Internals

### Mechanics

WiredTiger (WT) has been MongoDB's default storage engine since 3.2. It provides document-level concurrency control, MVCC (Multi-Version Concurrency Control), compression, and an in-memory cache separate from the OS page cache. Understanding WT internals is required for diagnosing performance issues, capacity planning, and explaining why certain operations are expensive.

```javascript
// WIREDTIGER ARCHITECTURE
// Cache: in-memory working set (default: 50% of RAM, min 256MB)
//   Configure: storage.wiredTiger.engineConfig.cacheSizeGB: 4
// Journal: write-ahead log (WAL) on disk — ensures durability
//   Flush: every 100ms (default) or on write concern j:true
// Checkpoints: full data snapshot every 60 seconds (default)
//   Between checkpoint and last journal entry = recoverable window
// Compression: snappy (default, fast), zlib (more compression), none, zstd (4.2+)

// CACHE BEHAVIOR
// Documents read from disk → decompressed → stored in WT cache (uncompressed)
// Dirty pages (modified) → written to disk at checkpoint and journal flush
// Eviction: WT evicts dirty pages from cache when cache is full
//   Eviction threshold (eviction_target): 80% of cache (default) → eviction starts
//   Eviction checkpoint trigger: 95% → aggressive eviction, can impact application latency
// Cache pressure symptoms: high "cache dirty bytes" in serverStatus, slow writes

// DOCUMENT-LEVEL LOCKING
// WiredTiger uses optimistic concurrency:
//   1. Transaction reads doc (takes no lock)
//   2. Transaction prepares to modify doc (acquires intent lock)
//   3. Conflict: another transaction modified same doc after our snapshot → WriteConflict
//   4. Win: commit with CAS (compare-and-swap at storage level)

// MVCC: Multiple Version Concurrency Control
// Every write creates a new version of the document
// Old versions retained until:
//   - No open snapshot requires them (oldest snapshot timestamp advances)
//   - Or: WiredTiger checkpoint commits them
// Long-running transactions prevent old version cleanup → cache/disk bloat ("WT hazard")

// COMPRESSION
// Collection data: snappy compressed on disk by default
// Index data: prefix compression by default
// Journal: snappy compressed
// To see compression ratio:
db.runCommand({ collStats: "myCollection" }).wiredTiger.creationString;
// Actual size comparison:
const stats = db.col.stats();
stats.size;              // uncompressed logical size
stats.storageSize;       // compressed size on disk
stats.totalIndexSize;    // total index size on disk

// SERVERSTATUTS: key performance indicators
const ss = db.serverStatus();
ss.wiredTiger.cache["bytes currently in the cache"];      // current cache usage
ss.wiredTiger.cache["maximum bytes configured"];           // total cache available
ss.wiredTiger.cache["bytes read into cache"];              // reads from disk → cache
ss.wiredTiger.cache["bytes written from cache"];           // cache → disk (dirty page writes)
ss.wiredTiger.cache["pages evicted by application threads"]; // application blocking on eviction (BAD)
ss.wiredTiger.transaction["transaction checkpoint total time (msecs)"]; // checkpoint duration
ss.wiredTiger.concurrentTransactions.write.available;      // available write tickets
ss.wiredTiger.concurrentTransactions.read.available;       // available read tickets

// TICKET CONCURRENCY MODEL
// WiredTiger limits concurrent operations via tickets:
//   Write tickets: 128 by default (wiredTigerConcurrentWriteTransactions)
//   Read tickets: 128 by default (wiredTigerConcurrentReadTransactions)
// When tickets exhausted: operations queue and wait
// Symptom: high "queued" in currentOp(), slow operations, tickets near 0 in serverStatus
// Fix: investigate what's holding tickets (long-running ops), increase tickets (temporary),
//   or reduce load (root cause)

// CHECKPOINT IMPACT
// Every 60 seconds: WT takes a checkpoint — writes all dirty pages to disk
// During checkpoint: write throughput may dip due to disk I/O saturation
// Large dirty cache before checkpoint → long checkpoint → potential for spike
// Monitor: wiredTiger.transaction.checkpoint duration in serverStatus

// COLLECTION AND INDEX SCAN COST
// Index scan: reads index B+-tree leaf pages (compressed, small, often cached)
// Document fetch (non-covered query): each document requires a separate I/O
//   if not in cache (random access, cache-miss intensive)
// Covered query: entirely from index (no document fetch) — fastest possible
```

**L3 SIGNAL:** Must know WiredTiger cache sizing and eviction thresholds. Must know what MVCC means and why long-running transactions prevent version cleanup. Must know the ticket concurrency model and how to diagnose ticket exhaustion. Must know checkpoint behavior and how it affects write latency. Must read `serverStatus().wiredTiger` to diagnose performance problems.

**L3 RED FLAGS:**
- Cannot explain MVCC in WiredTiger — does not know why long transactions hurt
- Does not know WiredTiger ticket model — cannot diagnose "operations queuing" issues
- Does not know checkpoints happen every 60s — cannot explain periodic write latency spikes
- Cannot explain the relationship between WT cache size, working set size, and performance

---

## 10. Change Streams

### Mechanics

Change streams (3.6+) provide a real-time ordered stream of data change notifications. Built on the oplog. Available on collections, databases, or entire deployments. Deliver change events with at-least-once semantics; idempotent consumers are required. Use resume tokens to survive application restarts.

```javascript
// BASIC CHANGE STREAM
const stream = db.collection("orders").watch();
stream.on("change", (change) => {
  console.log(change.operationType);   // insert, update, replace, delete, invalidate
  console.log(change.documentKey);     // { _id: ObjectId("...") }
  console.log(change.fullDocument);    // full new document (for insert/replace; update requires option)
  console.log(change.updateDescription); // for updates: { updatedFields, removedFields }
});

// UPDATE EVENTS: only send changed fields by default (not full document)
// To get full document on updates, request it explicitly:
const stream = db.collection("orders").watch([], {
  fullDocument: "updateLookup"  // fetches current document state on every change event
  // Warning: "updateLookup" is a separate read after the change — not point-in-time consistent
  // The document may have changed again between the oplog entry and the lookup
});

// MongoDB 6.0+: pre and post images
// Enable on collection:
db.runCommand({ collMod: "orders", changeStreamPreAndPostImages: { enabled: true } });
// Then in watch:
const stream = db.collection("orders").watch([], {
  fullDocument: "whenAvailable",           // post-image: document after the change
  fullDocumentBeforeChange: "whenAvailable" // pre-image: document before the change
});
// Pre/post images are stored in a separate system collection, purged after configurable TTL

// FILTERING CHANGE STREAMS with aggregation pipeline
const stream = db.collection("orders").watch([
  { $match: {
    operationType: { $in: ["insert", "update"] },
    "fullDocument.status": "shipped",          // filter on document content
    "ns.coll": "orders"                        // filter by collection name
  }},
  { $project: {
    operationType: 1,
    "fullDocument.orderId": 1,
    "fullDocument.customerId": 1
  }}
]);

// RESUME TOKENS: survive application restart
let resumeToken = null;
const stream = db.collection("orders").watch([], {
  resumeAfter: resumeToken,    // resume from where we left off
  // OR: startAfter: resumeToken  (4.2+: can start after a delete event's resume token)
  // OR: startAtOperationTime: Timestamp(...)  (start from a specific oplog time)
});
stream.on("change", (change) => {
  resumeToken = change._id;   // save the resume token (to Redis, DB, etc.)
  processChange(change);      // idempotent processing required
});

// CHANGE STREAMS ON REPLICA SETS vs SHARDED CLUSTERS
// Replica set: change stream reads from primary's oplog
// Sharded cluster: change stream opens streams on ALL shards, merges results
//   → more oplog consumers, more resource usage, ordering is global (more expensive)

// CHANGE STREAM INVALIDATION EVENTS
// operationType: "invalidate" — the collection was dropped or renamed
// After invalidate: stream is closed, cannot be resumed
// Application must handle: catch invalidate, re-establish stream after collection recreated

// AT-LEAST-ONCE DELIVERY
// If application crashes after processing but before saving resume token → re-delivery on restart
// Consumer MUST be idempotent — the same change event may be processed multiple times
// Pattern: upsert based on documentKey._id + operation timestamp

// RESOURCE CONSIDERATIONS
// Each change stream = one cursor on the source (collection/database/deployment level)
// Watch at deployment level: opens streams on ALL collections — very resource intensive
// Prefer: per-collection change streams, filter aggressively at $match stage
// Oplog retention: change streams require oplog to not roll over resume token window
//   If oplog rolls over past resume token: stream dies, cannot resume (need to resync)
```

**L2 SIGNAL:** Must know change streams for real-time event processing. Must know resume tokens for reliability. Must use aggregation pipeline to filter change streams. Must know `fullDocument: "updateLookup"` and its consistency limitation.

**L2 RED FLAGS:**
- Does not save resume tokens — stream restart means missed events
- Uses `updateLookup` without understanding the consistency gap
- Opens a deployment-level change stream for one collection — wastes resources
- Does not handle the `invalidate` event — application breaks silently on collection drop

**L3 SIGNAL:** Must know: (1) Change streams are built on the oplog — if the oplog window expires (oplog is full and rolls over), the change stream's resume token becomes invalid and the stream cannot be recovered without a full re-read. (2) Pre/post images (6.0) are stored in a system collection with configurable expiry — storing large documents as pre/post images can consume significant disk space. (3) The `startAtOperationTime` option uses the cluster time — for cross-collection consistency when starting multiple change streams. (4) Change stream event ordering: within a single collection is guaranteed; across multiple collections in a sharded deployment is globally ordered by cluster time (expensive — requires timestamp comparison across all shards). (5) Change streams require `readConcern: "majority"` on the replica set (implicit) — this means the replica set must not have majority write concern disabled.

---

## 11. Atlas Search and Full-Text Search

### Mechanics

MongoDB offers two full-text search options: the native `$text` operator (inverted index, limited), and Atlas Search (Lucene-based, full-featured, Atlas only). For production full-text search, Atlas Search is the correct answer in 2024.

```javascript
// NATIVE TEXT INDEX: simple full-text search
db.articles.createIndex({ title: "text", body: "text" });
db.articles.find({ $text: { $search: "mongodb performance" } });

// Limitations of native text indexes:
// - One text index per collection
// - No relevance ranking options (just textScore)
// - No fuzzy matching, autocomplete, facets, synonyms
// - No language-aware stemming control
// - No geospatial + text combined scoring
// - Limited to English and a few other languages with proper stemming

// ATLAS SEARCH: Lucene-powered, defined as search indexes in Atlas UI or API
// Search index definition (Atlas, not regular MongoDB)
{
  "name": "default",
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": { "type": "string", "analyzer": "lucene.standard" },
      "body":  { "type": "string", "analyzer": "lucene.english" },
      "price": { "type": "number" },
      "category": { "type": "stringFacet" }   // for facet counts
    }
  }
}

// ATLAS SEARCH AGGREGATION STAGE: $search (must be first stage in pipeline)
db.products.aggregate([
  { $search: {
      index: "default",
      text: {
        query: "wireless headphones",
        path:  ["title", "description"],   // which fields to search
        fuzzy: { maxEdits: 1 }             // fuzzy matching: allow 1 edit distance
      }
  }},
  { $addFields: { score: { $meta: "searchScore" } } },  // relevance score
  { $match: { price: { $lt: 200 } } },                   // post-filter (after search)
  { $sort: { score: -1 } },
  { $limit: 10 }
]);

// COMPOUND QUERY: combine must/should/mustNot clauses
{ $search: {
    compound: {
      must:    [{ text: { query: "laptop", path: "title" } }],
      should:  [{ text: { query: "gaming", path: "body", score: { boost: { value: 2 } } } }],
      mustNot: [{ text: { query: "refurbished", path: "title" } }],
      filter:  [{ range: { path: "price", gte: 500, lte: 2000 } }]  // no score impact
    }
}}

// AUTOCOMPLETE
db.products.aggregate([
  { $search: {
      autocomplete: {
        query: "wir",
        path: "title",
        fuzzy: { maxEdits: 1 },
        tokenOrder: "sequential"
      }
  }},
  { $limit: 5 },
  { $project: { title: 1, _id: 0 } }
]);
// Requires field indexed as type: "autocomplete" with nGram tokenizer

// FACETS with Atlas Search
db.products.aggregate([
  { $searchMeta: {   // $searchMeta: returns only metadata (no documents)
      facet: {
        operator: { text: { query: "laptop", path: "title" } },
        facets: {
          categoryFacet: { type: "string", path: "category", numBuckets: 5 },
          priceFacet:    { type: "number", path: "price", boundaries: [0, 100, 500, 1000], default: "other" }
        }
      }
  }}
]);

// ATLAS VECTOR SEARCH (6.0 preview, 7.0 GA): semantic similarity search
// Index definition:
{
  "fields": [{
    "type":        "vector",
    "path":        "embedding",
    "numDimensions": 1536,          // OpenAI ada-002: 1536 dimensions
    "similarity":  "cosine"          // or: dotProduct, euclidean
  }]
}

// $vectorSearch aggregation stage
db.docs.aggregate([
  { $vectorSearch: {
      index:        "vector_index",
      path:         "embedding",
      queryVector:  [0.1, 0.2, ...],  // 1536-element float array
      numCandidates: 100,             // HNSW candidate pool size
      limit:        10                // return top 10
  }},
  { $project: { title: 1, score: { $meta: "vectorSearchScore" } } }
]);
// Hybrid search: combine $vectorSearch + $search with Reciprocal Rank Fusion (RRF)
```

**L2 SIGNAL:** Must know the limitations of native text indexes. Must know Atlas Search exists and when to recommend it over native text indexes. Must know `$search` must be the first pipeline stage.

**L2 RED FLAGS:**
- Recommends native text index for production full-text search — unaware of its severe limitations
- Does not know Atlas Search runs on Lucene
- Cannot explain when Atlas Vector Search would be used vs regular full-text search
- Puts `$match` before `$search` (invalid — `$search` must be first)

**L3 SIGNAL:** Must know: (1) Atlas Search indexes are updated asynchronously — search results may lag behind operational data by seconds (eventual consistency between Atlas Search and operational cluster). (2) `$search` runs on dedicated Lucene indexes, not the MongoDB query engine — the document still needs to be fetched from the collection for non-indexed fields. (3) `$searchMeta` vs `$search`: `$searchMeta` returns only facet counts and metadata without documents — more efficient for facet-only calls. (4) Hybrid search combining vector search with BM25 text search using Reciprocal Rank Fusion (RRF) — the standard approach for RAG applications. (5) `numCandidates` in `$vectorSearch` controls the HNSW graph traversal breadth — higher = better recall but slower. Typical starting point: `numCandidates = 10 * limit`.

---

## 12. Performance Monitoring and Diagnostics

### Mechanics

MongoDB provides several built-in tools for monitoring and diagnosing performance issues. Understanding which tool surfaces which information is required for production operations.

```javascript
// CURRENT OPERATIONS: find slow/blocking operations
db.currentOp({ active: true, secs_running: { $gt: 5 } });
// Fields to examine:
// - op: "query", "update", "command", "insert", "getmore"
// - ns: namespace (db.collection)
// - secs_running: how long it's been running
// - planSummary: "COLLSCAN" (problem!) or "IXSCAN { field: 1 }"
// - waitingForLock: true (blocked by another operation)
// - opid: operation ID — use to kill it

db.killOp(opid);   // kill a specific operation

// SLOW QUERY LOG
// mongod logs queries slower than slowOpThresholdMs (default: 100ms)
// View: /var/log/mongodb/mongod.log or Atlas Performance Advisor
// Configure:
db.setProfilingLevel(1, { slowms: 50 });   // log queries > 50ms
db.setProfilingLevel(2);                   // log ALL operations (development only — high overhead)
db.setProfilingLevel(0);                   // disable profiling

// SYSTEM PROFILER: queries stored in system.profile collection
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 }).limit(20);
// Fields: op, ns, command, millis, planSummary, keysExamined, docsExamined, nreturned

// EXPLAIN: query execution analysis
// Three verbosity modes:
db.col.find(query).explain();                    // "queryPlanner" — plan without executing
db.col.find(query).explain("executionStats");    // execute and show stats
db.col.find(query).explain("allPlansExecution"); // execute all candidate plans

// Key executionStats fields:
{
  executionStats: {
    executionTimeMillis: 5,
    totalDocsExamined: 100,    // should ≈ nReturned for good index usage
    totalKeysExamined: 100,    // index keys scanned
    nReturned: 100,
    executionStages: {
      stage: "IXSCAN",         // COLLSCAN = collection scan = problem
      indexName: "status_1",
      direction: "forward",
      // FETCH stage: means documents were fetched (not a covered query)
    }
  }
}

// IMPORTANT EXPLAIN STAGES:
// COLLSCAN: full collection scan — needs index
// IXSCAN: index scan — good
// FETCH: fetch documents from collection after index lookup — OK if necessary
// SORT: in-memory sort — needs index if on large dataset or sort is slow
// SORT_KEY_GENERATOR: building sort keys — needed without sort index
// LIMIT: limiting results
// SKIP: skipping results — expensive if skipping many docs (keyset pagination preferred)
// PROJECTION: projecting fields
// SHARD_MERGE: merging results from multiple shards — indicates broadcast query

// QUERY PLAN CACHE: MongoDB caches winning plans per query shape
db.col.getPlanCache().list();    // show all cached plans
db.col.getPlanCache().clear();   // clear plan cache (forces replanning)
// Plan cache key = query shape (structure + operators, not values)
// Plans are re-evaluated after: 1000 writes to collection, index added/removed, mongod restart

// SERVERSTATUTS: comprehensive server metrics
const ss = db.serverStatus();
ss.opcounters;              // ops/sec: insert, query, update, delete, getmore, command
ss.connections.current;     // current connections
ss.connections.available;   // available connection slots
ss.globalLock.currentQueue; // { total, readers, writers } — queued operations
ss.mem.resident;            // resident memory (MB)
ss.mem.virtual;             // virtual memory (MB)
ss.repl.lag;                // secondary lag (on secondary nodes)

// MONGOTOP: top-like view of collection-level activity
// mongotop 5  → update every 5 seconds, shows read/write time per collection

// MONGOSTAT: server-level metrics over time
// mongostat --host localhost:27017 1  → print stats every second

// ATLAS PERFORMANCE ADVISOR (Atlas only)
// Automatically analyzes slow queries and recommends indexes
// Shows: inefficient queries, suggested indexes, impact estimation
// Creates indexes with one click in Atlas UI

// CONNECTION POOL MONITORING
// Application drivers maintain a connection pool to mongod/mongos
// Pool size default: 100 connections max per driver instance
// Monitor: too many connections = mongod overloaded
// Max connections by tier:
//   M0 (free): 500 total connections
//   M10: 1500 total connections
//   M30: 3000 total connections
// Each connection: ~1MB memory on mongod — 5000 connections = 5GB memory just for connections
```

**L2 SIGNAL:** Must use `explain("executionStats")` to diagnose query performance. Must know `db.currentOp()` for finding slow operations. Must know profiling levels. Must interpret COLLSCAN vs IXSCAN in explain output.

**L2 RED FLAGS:**
- Cannot read explain output — does not know what COLLSCAN means
- Does not know `currentOp()` — cannot find what's blocking the database
- Leaves profiling at level 2 in production — extreme performance overhead
- Cannot explain what `docsExamined >> nReturned` indicates (poor index selectivity)

**L3 SIGNAL:** Must know: (1) Query plan cache: plans are cached by query shape — a cache miss forces plan evaluation (expensive if many candidate indexes). After adding an index, clear the plan cache to force re-evaluation. (2) `allPlansExecution` verbosity runs all candidate plans simultaneously (up to the winning plan threshold) — useful for understanding why the planner chose suboptimally. (3) Connection pool saturation: if all connections are in use, new requests queue — visible in `globalLock.currentQueue` and driver-side timeouts. (4) WiredTiger cache usage: if WT cache dirty bytes > eviction trigger threshold, application threads start doing eviction work (visible in `pages evicted by application threads`) — this directly causes query latency spikes. (5) Secondary lag monitoring: oplog replication lag on secondaries causes stale reads and indicates the secondary can't keep up with write throughput. Causes: insufficient secondary CPU/IO, network latency, large operations.

---

## 13. Security

### Mechanics

MongoDB security is layered: authentication (who are you), authorization (what can you do), network isolation, encryption at rest, encryption in transit, and field-level encryption. Default MongoDB installation has NO authentication — requires explicit configuration.

```javascript
// AUTHENTICATION
// Enable in mongod.conf:
// security:
//   authorization: enabled

// Create admin user first (before enabling auth):
use admin;
db.createUser({
  user: "admin",
  pwd:  "securePassword",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase"]
});

// BUILT-IN ROLES (least privilege principle):
// read:               read all collections in a database
// readWrite:          read + write all collections
// dbAdmin:            admin operations (indexes, stats) but no data access
// userAdmin:          manage users and roles (but no data access)
// dbOwner:            all of above for one database
// readAnyDatabase:    read all databases
// readWriteAnyDatabase: read+write all databases
// userAdminAnyDatabase: manage users across all databases
// dbAdminAnyDatabase: admin all databases
// clusterAdmin:       full cluster admin (sharding, replication, serverStatus)
// root:               full admin access (avoid for application accounts)

// APPLICATION USER: minimum necessary privileges
db.createUser({
  user: "appUser",
  pwd:  "appPassword",
  roles: [{ role: "readWrite", db: "appdb" }]  // only what the app needs
});

// FIELD-LEVEL ENCRYPTION (Queryable Encryption, 7.0 GA)
// Encrypts specific fields client-side before sending to server
// Server never sees plaintext — encrypted at rest AND in transit
// Supports equality queries on encrypted fields (using structured encryption)
// Cannot: range queries, sort, or aggregate on Queryable Encryption fields (as of 8.0)
// Requires: MongoDB 7.0+, enterprise/Atlas, driver-side configuration

// CONNECTION STRING WITH TLS:
"mongodb://user:pass@host:27017/db?tls=true&tlsCAFile=/path/to/ca.pem&authSource=admin"

// IP ALLOWLISTING (Atlas): restrict connections to known IP ranges
// VPC Peering / Private Link (Atlas): avoid public internet entirely

// AUDIT LOG: track who did what
// mongod.conf:
// auditLog:
//   destination: file
//   format: JSON
//   path: /var/log/mongodb/auditLog.json
//   filter: '{ atype: { $in: ["authenticate", "createCollection", "dropCollection", "createUser"] } }'

// NETWORK ENCRYPTION
// TLS 1.2+ required by default in modern MongoDB deployments
// TLS between: client↔mongod, mongod↔mongod (internal), mongos↔config servers
// Certificate management: CA, server certs, optional client certs (mutual TLS)
```

**L1 SIGNAL:** Must know authentication must be explicitly enabled. Must know built-in roles and least-privilege principle. Must know TLS for data in transit.

**L1 RED FLAGS:**
- Does not know MongoDB requires manual authentication enablement (ships with auth off)
- Gives applications the `root` role instead of `readWrite`
- Does not know TLS configuration is separate from authentication

**L2 SIGNAL:** Must know field-level encryption and its query limitations. Must explain audit logging for compliance requirements. Must design least-privilege roles for application service accounts.

**L3 SIGNAL:** Must know: (1) Queryable Encryption (7.0 GA) uses structured encryption — enables equality search on encrypted fields without the server learning the plaintext. It uses different keys per document per field (insert) and a special index structure. (2) The key management hierarchy: Customer Master Key (KMS-hosted) → Data Encryption Key (DEK, stored in MongoDB) → field encryption. (3) SCRAM authentication protocol (default): SCRAM-SHA-256 since MongoDB 4.0 (replaces SCRAM-SHA-1). LDAP integration for enterprise. (4) Role inheritance: custom roles can inherit from built-in roles — build a `readWriteNoDelete` custom role for applications that should not delete data.

---

## 14. Time-Series Collections (5.0+)

### Mechanics

Time-series collections (5.0+) are optimized for time-ordered measurement data. MongoDB automatically applies the bucket pattern internally, with specialized storage and indexes. Designed for IoT, metrics, events, financial tick data.

```javascript
// CREATE TIME-SERIES COLLECTION
db.createCollection("sensorReadings", {
  timeseries: {
    timeField:   "timestamp",     // required: the Date field for time ordering
    metaField:   "sensorId",      // optional: field used for bucketing (group related measurements)
    granularity: "minutes"        // "seconds", "minutes", "hours" — controls bucket size
  },
  expireAfterSeconds: 86400 * 30  // optional: TTL on the collection (rolling 30-day window)
});

// INSERT TIME-SERIES DATA (same as regular insert)
db.sensorReadings.insertMany([
  { timestamp: new Date(), sensorId: "sensor_01", temperature: 22.5, humidity: 45 },
  { timestamp: new Date(), sensorId: "sensor_01", temperature: 22.6, humidity: 44 },
  { timestamp: new Date(), sensorId: "sensor_02", temperature: 18.0, humidity: 60 },
]);

// QUERY TIME-SERIES: works with standard aggregation pipeline
db.sensorReadings.aggregate([
  { $match: {
      sensorId: "sensor_01",
      timestamp: { $gte: ISODate("2024-01-01"), $lt: ISODate("2024-01-02") }
  }},
  { $group: {
      _id: {
        hour: { $hour: "$timestamp" },
        sensor: "$sensorId"
      },
      avgTemp: { $avg: "$temperature" },
      maxTemp: { $max: "$temperature" }
  }}
]);

// TIME-SERIES ADVANTAGES over manual bucket pattern:
// - Automatic bucketing and compression (typically 90%+ compression ratio)
// - Specialized column-based storage (store field values contiguously, not row-based)
// - No need to manually manage bucket boundaries or overflow documents
// - Built-in TTL without separate TTL index
// - Automatic specialized indexes on timeField and metaField
// - Query optimization aware of the internal bucket structure

// LIMITATIONS:
// - Cannot update or delete individual measurements (only delete whole buckets via query)
//   (6.0+ added limited delete support)
// - No secondary indexes except on metaField and timeField
// - Documents in time-series cannot have custom _id values
// - Cannot shard a time-series collection (as of 6.0 — sharding added in Atlas in later versions)
```

---

## 15. MongoDB Aggregation Operators Cheat Sheet

```javascript
// ARITHMETIC OPERATORS
{ $add:      ["$price", "$tax"] }          // add fields or literals
{ $subtract: ["$total", "$discount"] }
{ $multiply: ["$qty", "$price"] }
{ $divide:   ["$revenue", "$cost"] }
{ $mod:      ["$counter", 10] }            // modulo
{ $abs:      "$temperature" }              // absolute value
{ $ceil:     "$score" }
{ $floor:    "$score" }
{ $round:    ["$price", 2] }               // round to 2 decimal places
{ $pow:      ["$base", 2] }                // exponentiation
{ $sqrt:     "$variance" }

// STRING OPERATORS
{ $concat:      ["$first", " ", "$last"] }
{ $substr:      ["$name", 0, 5] }          // substring(str, start, length)
{ $toLower:     "$name" }
{ $toUpper:     "$name" }
{ $trim:        { input: "$name" } }
{ $ltrim:       { input: "$name" } }
{ $rtrim:       { input: "$name" } }
{ $split:       ["$path", "/"] }           // split string → array
{ $strLenCP:    "$name" }                  // length in Unicode code points
{ $strLenBytes: "$name" }                  // length in bytes
{ $regexMatch:  { input: "$email", regex: "@example\\.com$" } }  // boolean
{ $regexFind:   { input: "$text", regex: "\\d+" } }              // first match
{ $regexFindAll:{ input: "$text", regex: "\\d+" } }              // all matches

// DATE OPERATORS
{ $year:        "$createdAt" }
{ $month:       "$createdAt" }             // 1-12
{ $dayOfMonth:  "$createdAt" }             // 1-31
{ $dayOfWeek:   "$createdAt" }             // 1 (Sunday) - 7 (Saturday)
{ $hour:        "$createdAt" }             // 0-23
{ $minute:      "$createdAt" }
{ $second:      "$createdAt" }
{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "America/New_York" } }
{ $dateTrunc:   { date: "$ts", unit: "hour" } }  // truncate to start of hour (5.0+)
{ $dateAdd:     { startDate: "$ts", unit: "day", amount: 7 } }  // add 7 days (5.0+)
{ $dateDiff:    { startDate: "$start", endDate: "$end", unit: "hour" } }  // diff in hours (5.0+)

// ARRAY OPERATORS
{ $size:        "$tags" }                  // array length
{ $arrayElemAt: ["$scores", 0] }          // element at index (negative = from end)
{ $first:       "$scores" }               // first element (5.0+; or $arrayElemAt: [..., 0])
{ $last:        "$scores" }               // last element
{ $slice:       ["$items", 0, 5] }        // slice(array, skip, limit)
{ $filter: {
    input: "$scores",
    as:    "score",
    cond:  { $gte: ["$$score", 80] }
}}
{ $map: {
    input: "$items",
    as:    "item",
    in:    { $multiply: ["$$item.price", "$$item.qty"] }
}}
{ $reduce: {
    input:        "$scores",
    initialValue: 0,
    in:           { $add: ["$$value", "$$this"] }  // sum all scores
}}
{ $zip: { inputs: ["$keys", "$values"] } } // zip two arrays together
{ $concatArrays: ["$array1", "$array2"] }  // concatenate arrays
{ $setUnion:     ["$a", "$b"] }            // union (dedup)
{ $setIntersection: ["$a", "$b"] }         // intersection
{ $setDifference:   ["$a", "$b"] }         // elements in a not in b
{ $in:           ["$field", "$array"] }    // element in array (aggregation context)
{ $indexOfArray: ["$array", "value"] }     // index of value (-1 if not found)
{ $reverseArray: "$items" }                // reverse array order
{ $sortArray: { input: "$items", sortBy: { price: -1 } } }  // sort array (5.2+)

// CONDITIONAL OPERATORS
{ $cond: { if: { $gte: ["$age", 18] }, then: "adult", else: "minor" } }
{ $cond: [condition, thenVal, elseVal] }   // shorthand
{ $ifNull:  ["$phone", "N/A"] }            // if null or missing, use default
{ $switch: {
    branches: [
      { case: { $lt: ["$score", 60] },  then: "F" },
      { case: { $lt: ["$score", 70] },  then: "D" },
      { case: { $lt: ["$score", 80] },  then: "C" },
      { case: { $lt: ["$score", 90] },  then: "B" },
    ],
    default: "A"
}}

// TYPE CONVERSION OPERATORS
{ $toString:   "$age" }
{ $toInt:      "$strField" }
{ $toLong:     "$strField" }
{ $toDouble:   "$strField" }
{ $toDecimal:  "$strField" }
{ $toDate:     "$isoStringField" }
{ $toBool:     "$numericField" }
{ $convert: { input: "$field", to: "int", onError: 0, onNull: 0 } }
{ $type:    "$field" }                     // returns BSON type name string

// ACCUMULATOR OPERATORS (in $group and $setWindowFields)
{ $sum:         "$amount" }
{ $avg:         "$score" }
{ $min:         "$price" }
{ $max:         "$price" }
{ $push:        "$item" }                  // accumulate into array (all values)
{ $addToSet:    "$category" }              // unique values array
{ $first:       "$name" }                  // first value in group
{ $last:        "$name" }                  // last value in group
{ $stdDevPop:   "$score" }                 // population standard deviation
{ $stdDevSamp:  "$score" }                 // sample standard deviation
{ $count:       {} }                       // count documents in group (5.0+)
{ $topN:        { n: 5, sortBy: { score: -1 }, output: "$name" } }      // top N (5.2+)
{ $bottomN:     { n: 5, sortBy: { score: 1  }, output: "$name" } }      // bottom N (5.2+)
{ $firstN:      { n: 3, input: "$score" } }                              // first N values
{ $lastN:       { n: 3, input: "$score" } }                              // last N values
{ $maxN:        { n: 3, input: "$score" } }                              // top N max values
{ $minN:        { n: 3, input: "$score" } }                              // bottom N min values
{ $mergeObjects:"$attributes" }            // merge array of objects into single object
```

---

## 16. MongoDB Gotcha Cheat Sheet

| Scenario / Code | Behavior | Explanation |
|---|---|---|
| `db.col.updateOne(filter, { name: "Bob" })` | Replaces document with `{ name: "Bob" }` | Forgot `$set` — document replaced, all fields lost except `_id` |
| `db.col.find({ tags: "admin" })` | Matches docs where tags array CONTAINS "admin" | Array equality check is "contains", not exact match |
| `db.col.find({ tags: ["admin", "user"] })` | Matches EXACT array `["admin", "user"]` (order matters) | Brackets mean exact match including order |
| `{ scores: { $gt: 80, $lt: 90 } }` (array) | Matches if ANY element > 80 AND ANY element < 90 (different elements OK) | Need `$elemMatch` for single-element constraint |
| `ObjectId` as shard key | All writes go to newest chunk — hotspot | ObjectId is monotonically increasing → range sharding always appends to last chunk |
| `TTL index fires late` | TTL deletion runs every ~60 seconds, not exactly at expiry | Background thread — not real-time expiry |
| `db.col.drop()` vs `db.col.deleteMany({})` | `drop()` removes collection + indexes; `deleteMany({})` is slow for large collections | For emptying large collections, `drop()` + `createCollection()` + `createIndex()` is faster |
| `$lookup` without index on `foreignField` | Each document causes a separate full collection scan on joined collection | Always index `foreignField` in the joined collection |
| `$text` query without text index | Error: text index required | `$text` requires a text index — not just a regular string index |
| `regex` query without `^` anchor | Full collection scan even with index | Unanchored regex cannot use index prefix scans |
| `find({}).sort({ createdAt: -1 }).limit(1)` | May be slow without index | Needs index on `createdAt` to avoid full sort |
| `"majority"` write concern + single node replica set | Write never completes (times out) | "majority" needs majority of voting members to acknowledge |
| `w: 0` write concern | Silent data loss possible | Fire-and-forget: no acknowledgment, no error on failure |
| Transactions on standalone `mongod` | Not supported | Transactions require replica sets (or sharded cluster) |
| `$unwind` on array with 1000 elements | Produces 1000 documents per input document | Memory explosion — filter before unwind |
| `$group` with `$push` on large sets | May exceed 100MB RAM limit | Use `$topN`/limit or `allowDiskUse: true` |
| Change stream after oplog rollover | Stream dies, resume token invalid | Must monitor oplog window; resize oplog for active streams |
| `db.col.find()` returns cursor (shell) | Shell auto-iterates 20 results (`it` for more) | In drivers, cursor must be explicitly iterated or closed |
| `NumberDecimal("0.1") + NumberDecimal("0.2")` | `0.3` (correct) | Decimal128 exact arithmetic — unlike IEEE 754 double |
| `0.1 + 0.2` (JavaScript in shell) | `0.30000000000000004` | JavaScript uses IEEE 754 double — use `NumberDecimal` for money |
| Index on `{ a: 1, b: 1 }` | Does NOT help query on `{ b: 1 }` alone | Must use index prefix — `a` is required for prefix usage |
| `insertMany` with `ordered: true` (default) | Stops on first error, does not attempt remaining docs | Use `ordered: false` for bulk inserts where partial success is OK |
| `replaceOne` with only filter + update doc | Replaces entire document (keeps `_id`) | Use `updateOne` + `$set` for field-level updates |
| `$where: "this.field > value"` | Full collection scan, JavaScript execution, very slow | Never in production — use `$expr: { $gt: ["$field", value] }` |
| Reading from secondary with `readPreference: "secondary"` | May return stale data | Replication lag means secondaries can be behind primary by seconds |
| Compound index on two array fields | Index creation fails | Cannot have two multikey (array) fields in one compound index |
| `findOne` vs `find().limit(1)` | Functionally equivalent — `findOne` is syntactic sugar | `findOne` returns document or null; `find().limit(1)` returns cursor |
| Aggregation without `allowDiskUse: true` on large data | Fails with "exceeded memory limit for $sort/$group" | Each pipeline stage has 100MB RAM limit by default |
| `new Date()` in aggregation `$addFields` on every doc | Uses time of query, not document insertion time | Use `$currentDate` in update operations for per-document timestamps |

---

## 17. Signal Reference Matrix

| Topic | L1 Junior Signal | L2 Mid Signal | L3 Senior Signal |
|---|---|---|---|
| CRUD Operations | `$set`, `$inc`, `$push`, `$pull` correctly; basic projections | `findOneAndUpdate`, `$expr`, `$elemMatch` vs bare array conditions | `$where` avoidance, atomic update pattern design, bulk write optimization |
| Indexes | Creates basic indexes; knows `unique`, `TTL` | ESR rule, partial/sparse indexes, `explain()` interpretation, `$indexStats` | Index intersection, covered queries, multikey limitations, plan cache behavior |
| Aggregation | `$match`, `$group`, `$project`, `$sort` | `$facet`, `$lookup` pipeline form, `$merge`, stage optimization order | Memory limits, `$lookup` N+1, `$unwind` explosion, `$setWindowFields` |
| Schema Design | Embedding vs referencing basics | Computed, extended reference, outlier, bucket patterns | Schema versioning, polymorphic pattern, query-driven design, time-series collections |
| Replication | Primary/secondary, write concern concept | `w:majority` vs `w:1` trade-off, read preferences, election mechanics | Oplog window sizing, rollback risk, causal consistency, retryable writes |
| Sharding | Purpose, shard key concept | Hotspot problem, hashed vs ranged, broadcast vs targeted | Jumbo chunks, balancer impact, cross-shard transactions, zone sharding |
| Transactions | Exists, single-doc is always atomic | Retry logic, error labels, what can't be done in transactions | 2PC distributed, optimistic concurrency, MVCC snapshot, oplog entry size |
| WiredTiger | GC not applicable to Rust ... cache exists | Cache sizing, eviction thresholds, compression | MVCC version cleanup, ticket model, checkpoint impact, cache pressure diagnosis |
| Change Streams | Basic watch, event types | Resume tokens, pre/post images, filtering with pipeline | Oplog retention requirements, at-least-once delivery, invalidation handling |
| Security | Auth must be enabled, basic roles | Least privilege, TLS, field-level encryption concept | Queryable Encryption internals, audit logging, SCRAM protocol |
| Performance | `explain()` basics, COLLSCAN = bad | `currentOp()`, profiling levels, plan cache | WiredTiger serverStatus deep-dive, connection pool saturation, eviction diagnosis |
| Atlas Search | Text index exists, `$text` basics | Atlas Search vs native text, `$search` stage rules | Async index lag, hybrid search, `$searchMeta` vs `$search`, HNSW tuning |
| Time-Series | 5.0 feature exists | Bucket pattern, granularity, metaField, TTL | Column storage internals, compression ratios, delete limitations, sharding support |

---

## 18. Red Flag Signals

### L1 Junior Red Flags — disqualifying for any MongoDB role

1. Writes `db.col.updateOne(filter, { field: "value" })` instead of `db.col.updateOne(filter, { $set: { field: "value" } })` — replaces the entire document, data loss.
2. Does not know `$set`, `$inc`, `$push` — only knows `insertOne` / `deleteOne` / `replaceOne`.
3. Uses floating-point `double` for monetary values instead of `Decimal128` — financial precision errors.
4. Does not know what `explain()` is — cannot verify whether a query uses an index.
5. Thinks MongoDB is "schemaless" so schema design doesn't matter — no understanding of query-driven design.
6. Does not know the 16MB document limit and its implications.
7. Uses `$where` with JavaScript in queries — does not know it bypasses indexes and is a full scan.
8. Cannot write a basic aggregation pipeline with `$match`, `$group`, `$project`.
9. Does not know `TTL` indexes — implements document expiration with application-side cron jobs.
10. Thinks reading from a secondary is identical to reading from primary — does not know about replication lag.

### L2 Mid Red Flags — concern signals for independent contributor role

1. Cannot explain the ESR (Equality-Sort-Range) compound index ordering rule — creates indexes in wrong order.
2. Uses `ObjectId` as shard key without knowing it creates a write hotspot.
3. Does not know `findOneAndUpdate` — uses separate `find()` + `update()` (two round trips, not atomic).
4. Cannot write a `$lookup` with the pipeline form (`let`/`pipeline`) — limited to simple equality lookups.
5. Does not know `w: "majority"` write concern and its importance for data durability — uses `w: 1` (default pre-5.0).
6. Cannot explain `broadcast vs targeted` queries for a sharded collection.
7. Uses `$group` with `$push` on unbounded arrays in aggregation — does not know about the 100MB memory limit.
8. Does not know about the computed pattern — runs expensive aggregations on every dashboard request instead of pre-computing.
9. Cannot explain what a change stream resume token is or why it's required.
10. Uses native `$text` index for production full-text search without knowing Atlas Search exists.

### L3 Senior Red Flags — disqualifying for senior/architect role

1. Cannot explain WiredTiger's MVCC model and why long-running transactions cause cache pressure.
2. Recommends "just add more shards" for performance without diagnosing whether the problem is a hotspot, broadcast queries, or something else entirely.
3. Does not know oplog window sizing and cannot explain what happens when a change stream's resume token expires.
4. Cannot explain the difference between `TransientTransactionError` and `UnknownTransactionCommitResult` retry behavior.
5. Designs a schema without considering the query pattern — normalizes MongoDB data like a relational database.
6. Cannot explain why distributed transactions (cross-shard) are significantly more expensive than single-shard transactions.
7. Unaware of index build impact (4.2+ hybrid builds vs pre-4.2 blocking foreground builds) — schedules index creation on production without understanding the impact.
8. Gives all application service accounts the `root` role — no awareness of least-privilege principle or role design.
9. Cannot diagnose connection pool exhaustion — does not know how to monitor connections or that each connection consumes ~1MB on mongod.
10. Treats all read workloads as needing the same read preference — does not know when `secondary` read preference is appropriate (analytics, reporting) vs when it's dangerous (reads-after-writes, financial operations).

---

## 19. Senior Differentiator Questions with Expected Answer Outlines

### Question 1: Schema Design Under Load
> "You're building a notification system. Each user has notifications. Users can have between 0 and 500,000 notifications over their lifetime. Notifications are read, archived, or deleted. Users see their most recent 20 unread notifications. Design the MongoDB schema."

**Strong answer covers:**
- 500,000 notifications per user embedded in one document → exceeds 16MB limit (classic outlier problem)
- Separate `notifications` collection with `userId` field + index on `{ userId: 1, createdAt: -1, status: 1 }`
- For the "20 most recent unread" query: `{ userId: X, status: "unread" }` sort by `createdAt` desc, limit 20 — fully covered by the compound index
- Extended reference pattern: duplicate `userName` and `userAvatar` into notification document to avoid lookup on every notification list
- Soft delete pattern: `status: "deleted"` instead of actual delete — allows undo, tombstone pattern; use partial index on `{ status: "unread" }` to avoid scanning deleted/archived
- Pre-compute unread count in user document (`$inc` on notification write) so unread badge is O(1) lookup — computed pattern
- TTL or archival strategy: move archived notifications after 90 days to cold storage collection
- Sharding consideration: `userId` as shard key — co-locates all user's notifications on one shard (targeted queries)

**Weak answer:** "Store notifications as an array in the user document." — ignores 16MB limit and array growth.

---

### Question 2: Performance Investigation
> "An aggregation query that calculates monthly revenue by product category runs in 50ms during development (100k documents) but takes 45 seconds in production (80 million documents). The query hasn't changed. Walk me through diagnosing and fixing this."

**Strong answer covers:**
- Step 1: Run `explain("executionStats")` in production — check if it's `COLLSCAN` (no index) or `IXSCAN` (index but poor selectivity)
- Check: does the `$match` stage come first? If not, add it as the first stage to filter before the `$group`
- Check: are `$match` fields indexed? The filter fields (`date range`, `category`) need a compound index in ESR order
- Check: `totalDocsExamined` vs `nReturned` — large ratio means poor index selectivity or missing index
- Check: `allowDiskUse: true` — without it, aggregation fails if intermediate data > 100MB
- Check: `$group` stage memory — with 80M documents, `$group` may exceed 100MB even with allowDiskUse
- Solution A (short-term): Add compound index on `{ createdAt: 1, category: 1 }` or `{ category: 1, createdAt: 1 }` depending on which field filters more documents
- Solution B (structural): Computed pattern — pre-aggregate monthly summaries into a `monthly_revenue` collection with `$merge` triggered on each order write. Dashboard reads from the summary collection (O(1)).
- Solution C (for reporting): If this is a reporting query (not user-facing), offload to Atlas Data Federation or secondary node with lower read preference to avoid impacting primary

**Weak answer:** "Add an index on `createdAt`." — incomplete, doesn't address aggregation stage ordering or pre-computation.

---

### Question 3: Replication and Consistency
> "Your application writes a user record and immediately redirects the user to their profile page, which reads the same record. In production (3-node replica set), the profile page sometimes shows 'User not found.' Why, and how do you fix it?"

**Strong answer covers:**
- Root cause: write went to primary with `w: 1` (or `w: "majority"`), redirect sends next request to a secondary via `readPreference: "secondary"` or `"secondaryPreferred"`, secondary hasn't replicated the write yet — typically 1-50ms replication lag
- Fix 1 (simplest): use `readPreference: "primary"` for user profile reads — always reads from primary, no lag. Trade-off: primary takes all load
- Fix 2 (causal consistency): use a MongoDB session with `causalConsistency: true`. The driver tracks `afterClusterTime` and ensures subsequent reads (even on secondary) reflect all prior writes from the same session
- Fix 3 (application-level): after successful write, include the returned `_id` in the redirect URL and read by `_id` with `readPreference: "primary"` for the first read only
- Fix 4 (write concern): ensure the write uses `w: "majority"` — but this alone doesn't fix the problem if reads go to secondaries that lag behind even after majority commit
- Discuss: causal consistency adds latency overhead (secondary must wait for `afterClusterTime` to advance), so it should be scoped to the session/operation that needs it, not applied globally

**Weak answer:** "Use primary read preference everywhere." — fixes the bug but doesn't understand the trade-offs or causal consistency option.

---

### Question 4: Shard Key Selection
> "You're designing a multi-tenant SaaS application. Each tenant has 1 to 100,000 documents. You have 50 tenants today and expect 10,000 in 2 years. Most queries are scoped to a single tenant. Propose and justify a shard key."

**Strong answer covers:**
- `tenantId` as shard key: all queries include `tenantId` → targeted queries (no broadcast). Simple, intuitive.
  - Problem: with 50 tenants today, only 50 possible key values = max 50 chunks = max 50 useful shards. Low cardinality early on.
  - Problem: large tenants (100k docs) create large chunks; tiny tenants create small chunks → uneven distribution. Potentially jumbo chunks for large tenants.
- `{ tenantId: 1, _id: 1 }` compound shard key: higher cardinality (tenantId + document ID), still targeted for tenant queries, documents for one tenant are co-located (tenantId range on same shard)
  - Better than `tenantId` alone: avoids low-cardinality jumbo chunk problem
- `{ tenantId: "hashed" }`: uniform distribution even with few tenants, but cannot do range queries within a tenant's data. All tenants' data is scattered.
- Zoned sharding: pin large tenants to dedicated shards, small tenants to shared shards — complex but correct for enterprise-tier isolation
- Recommendation: `{ tenantId: 1, _id: 1 }` for most cases; zone sharding for large enterprise tenants
- Mention: reshardCollection (5.0) allows changing shard key if initial choice proves wrong — reduces permanence risk

**Weak answer:** "Use `_id` as shard key." — hashed `_id` is generic default but loses query isolation (all tenant queries are broadcast).

---

### Question 5: Operational Architecture at Scale
> "A critical MongoDB collection has 2 billion documents, receives 50,000 writes/sec, and must support queries on multiple fields. Index builds are taking 8+ hours and are blocking other maintenance. How do you approach this?"

**Strong answer covers:**
- Index build behavior: MongoDB 4.2+ uses hybrid index builds — only brief read/write locks at start and end, non-blocking during the scan. 8+ hours is expected for 2B documents, not a blocking problem in 4.2+. If pre-4.2, this would actually block writes.
- Monitor build progress: `db.currentOp({ "command.createIndexes": { $exists: true } })` — shows `percentComplete`
- Minimize build impact: build on a secondary first, then step down primary and let old primary become secondary and build. Rolling index builds.
- 50k writes/sec with many indexes: each write updates ALL indexes. With N indexes, write throughput cost = N * (index B-tree insert cost). Audit unused indexes with `$indexStats` — drop indexes with 0 accesses.
- Partial indexes: if many queries only access recent data (e.g., last 30 days), a partial index on `{ status: 1, createdAt: 1 }` with `partialFilterExpression: { createdAt: { $gte: "30 days ago" } }` is much smaller and faster to build and maintain.
- Sharding: 2B documents at 50k writes/sec — if on a replica set, this is near the limit of what a single RS can handle. Should evaluate horizontal scaling via sharding.
- Write concern impact: `w: "majority"` at 50k writes/sec with 3 nodes means significant network synchronization overhead. Consider whether any writes can tolerate `w: 1` for throughput improvement.
- Background jobs: run index builds during off-peak hours (lower write rate reduces build time and contention)

**Weak answer:** "Disable indexes and add them back." — shows no understanding of hybrid builds or rolling builds.

---

## 20. MongoDB-Specific: Atlas Architecture

### Mechanics

MongoDB Atlas is the managed cloud service. Understanding its architecture and limitations is required for L2/L3 assessment in 2024, as the majority of new MongoDB deployments use Atlas.

```javascript
// ATLAS CLUSTER TIERS AND LIMITS
// M0 (free tier):  512MB storage, shared, no sharding, limited connections
// M10 ($57/mo):    10GB storage, dedicated, backups, up to 1500 connections
// M30 ($190/mo):   40GB storage, dedicated NVMe, sharding available
// M200 ($2800/mo): 1.9TB NVMe SSD, high IOPS

// ATLAS LIVE MIGRATION: migrate from self-hosted to Atlas
// Uses mongomirror — tails oplog, syncs data continuously, minimal downtime

// ATLAS ONLINE ARCHIVE: move cold data to S3-compatible object storage
// Queries transparently span both Atlas cluster (hot) and Online Archive (cold)
// Uses Data Federation layer for query routing
// Configure: after 30 days of no access → archive automatically

// ATLAS TRIGGERS: database triggers on collection change events
// Trigger type: database (change stream), scheduled (cron), authentication
// Runs Atlas Functions (serverless JavaScript)
// Use case: react to writes, send notifications, audit log to external system

// ATLAS APP SERVICES (formerly Realm):
// - Device Sync: offline-first mobile sync with Atlas
// - Data API: HTTP REST API directly to Atlas collections (no custom backend)
// - GraphQL API: auto-generated GraphQL schema from Atlas collections

// ATLAS SEARCH: Lucene-based full-text search (covered in Section 11)

// ATLAS VECTOR SEARCH: similarity search for AI/ML applications (covered in Section 11)

// ATLAS STREAM PROCESSING (8.0): stream processing on MongoDB change streams and Kafka
// Define pipelines that transform streaming data using MQL aggregation syntax
// Materialized views: continuously updated views from stream processing results

// MULTI-REGION AND GLOBAL CLUSTERS
// Global Clusters: shard data by geographic region (zone sharding)
// Read local + Write local: low latency reads and writes in user's region
// Requires: zone-based shard key (e.g., { region: 1, customerId: 1 })
// Data residency compliance: EU data stays in EU region (GDPR)

// ATLAS BACKUP
// Continuous cloud backup: every 1 hour (M10+), every 6 hours (M30+)
// Point-in-time restore: any point in the last N days
// Snapshot export to S3

// PERFORMANCE ADVISOR (Atlas)
// Automatically identifies slow queries and recommends indexes
// Analyzes query patterns from logs
// One-click index creation from UI
// Important: don't blindly accept all suggestions — validate with explain()
```

**L2 SIGNAL:** Must know Atlas cluster tiers and their limitations. Must know Atlas Search vs native text. Must know Atlas Triggers for reactive architecture.

**L3 SIGNAL:** Must know: (1) Atlas Online Archive trade-offs: queries spanning hot + cold data are slower due to Data Federation query routing overhead. Not suitable for latency-sensitive queries. (2) Atlas Streams (8.0) for stateful stream processing — alternative to Kafka Streams for MongoDB-native event processing. (3) Global Cluster shard key design must include the zone field (region) as the leading field — this is a constraint, not a choice. (4) Performance Advisor recommendations should be validated: it recommends indexes based on observed queries but doesn't know your write volume — an index that speeds a rare query may slow common writes significantly.

---

*End of MongoDB Technical Interviewer Knowledge Base — optimized for semantic chunking on `##` section boundaries. Covers MongoDB 3.6 through 8.0, all 20 mandatory sections plus MongoDB-specific sections (WiredTiger internals, Change Streams, Atlas Search/Vector Search, Time-Series, Atlas Architecture).*