# MySQL RAG Knowledge Base — Complete Technical Reference
## AI Interviewer Context Document | Three-Level Seniority Model

---

# SECTION 1: FUNDAMENTALS — DATA TYPES

## 1.1 Numeric Types

```sql
-- Integer types
TINYINT      -- 1 byte:  -128 to 127 (or 0 to 255 UNSIGNED)
SMALLINT     -- 2 bytes: -32768 to 32767
MEDIUMINT    -- 3 bytes: -8388608 to 8388607
INT          -- 4 bytes: -2147483648 to 2147483647
BIGINT       -- 8 bytes: -9223372036854775808 to 9223372036854775807

-- UNSIGNED doubles positive range
INT UNSIGNED -- 0 to 4294967295
BIGINT UNSIGNED -- 0 to 18446744073709551615

-- Auto-increment primary key patterns
id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY
id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY  -- use for high-volume tables

-- Display width is deprecated in MySQL 8.0 — INT(11) same as INT
-- The (11) was for display padding only, NEVER affected storage or range

-- Exact decimal — use for money, never FLOAT/DOUBLE
DECIMAL(10, 2)   -- 10 total digits, 2 after decimal. Range: -99999999.99 to 99999999.99
NUMERIC(10, 2)   -- alias for DECIMAL
-- DECIMAL stores as string internally — exact, no floating point error
-- DECIMAL(65, 30) — max precision

-- Floating point — approximate, avoid for financial data
FLOAT    -- 4 bytes, ~7 decimal digits precision
DOUBLE   -- 8 bytes, ~15 decimal digits precision

-- Why FLOAT/DOUBLE are dangerous for money:
SELECT 0.1 + 0.2;  -- 0.30000000000000004 (floating point error)
SELECT DECIMAL('0.1') + DECIMAL('0.2');  -- 0.3 (exact)

-- BIT type
BIT(1)   -- single bit: 0 or 1 (like boolean)
BIT(8)   -- 8 bits
-- Read with: SELECT b+0 FROM t; or CONV(b, 2, 10)
```

---

## 1.2 String Types

```sql
-- Fixed vs variable length
CHAR(n)        -- fixed n bytes (0-255), padded with spaces, faster for fixed-length data
VARCHAR(n)     -- variable up to n bytes (0-65535), 1-2 byte length prefix
               -- VARCHAR(255) uses 1-byte length prefix
               -- VARCHAR(256+) uses 2-byte length prefix

-- CHAR vs VARCHAR performance:
-- CHAR: faster for fixed-length data (passwords, hashes, country codes)
-- VARCHAR: better for variable-length, saves storage
-- CHAR(36) for UUID strings
-- CHAR(60) for bcrypt hashes

-- Row size limit: ~65535 bytes for all VARCHAR/CHAR columns combined
-- InnoDB actual limit: depends on row format (Compact, Dynamic, Compressed)

-- TEXT family — stored off-page for large values (Dynamic row format)
TINYTEXT     -- up to 255 bytes
TEXT         -- up to 65535 bytes (~64KB)
MEDIUMTEXT   -- up to 16777215 bytes (~16MB)
LONGTEXT     -- up to 4294967295 bytes (~4GB)

-- BLOB family — binary, no character set
TINYBLOB, BLOB, MEDIUMBLOB, LONGBLOB

-- TEXT vs VARCHAR:
-- VARCHAR can have DEFAULT value, TEXT cannot (pre MySQL 8.0.13)
-- VARCHAR is stored inline up to 768 bytes in prefix (older), TEXT always off-page
-- TEXT/BLOB cannot be fully indexed — must use prefix index: INDEX(col(100))
-- VARCHAR can be fully indexed

-- Character sets and collations
-- utf8 in MySQL is actually utf8mb3 (3 bytes max) — DOES NOT support emoji!
-- Use utf8mb4 for full Unicode including emoji (4 bytes max)
-- Common mistake: CREATE TABLE ... DEFAULT CHARSET=utf8 — BREAKS emoji storage

CREATE TABLE messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    -- Wrong: CHARACTER SET utf8
    -- Right:
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
);

-- Collations affect sorting and comparison
-- utf8mb4_unicode_ci: case-insensitive, accent-insensitive, Unicode-aware
-- utf8mb4_bin: binary, case-sensitive, exact byte comparison
-- utf8mb4_0900_ai_ci: MySQL 8.0, Unicode 9.0, better performance (default in 8.0)

-- Check current defaults
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- ENUM and SET
ENUM('active', 'inactive', 'pending')  -- single value from list, stored as 1-2 bytes
SET('read', 'write', 'execute')        -- multiple values from list, stored as bitmask

-- ENUM gotchas:
-- ALTER TABLE to add ENUM value requires rebuild in older MySQL (not in 8.0 if adding at end)
-- Invalid ENUM value: stores empty string ('' — the "error enum value") in non-strict mode
-- Comparison is by ordinal position, not alphabetical
-- Can cause migration headaches — often better to use VARCHAR + CHECK constraint

-- JSON type (MySQL 5.7.8+)
JSON  -- stored as binary JSON, validated on insert, efficient access

CREATE TABLE products (
    id INT PRIMARY KEY,
    attributes JSON,
    tags JSON
);

INSERT INTO products VALUES (1,
    '{"color": "red", "size": "M", "price": 29.99}',
    '["sale", "new"]'
);

SELECT attributes->>'$.color' FROM products;     -- "red" (unquoted string)
SELECT attributes->'$.price' FROM products;      -- 29.99
SELECT JSON_EXTRACT(attributes, '$.color');      -- "red" (quoted)
```

---

## 1.3 Date and Time Types

```sql
-- Date/time types
DATE         -- YYYY-MM-DD, range: 1000-01-01 to 9999-12-31, 3 bytes
TIME         -- HH:MM:SS[.fraction], range: -838:59:59.000000 to 838:59:59.000000
DATETIME     -- YYYY-MM-DD HH:MM:SS[.fraction], 5-8 bytes, no timezone
TIMESTAMP    -- UNIX timestamp internally, range: 1970-01-01 to 2038-01-19, 4-7 bytes
YEAR         -- YYYY, 1 byte

-- DATETIME vs TIMESTAMP — CRITICAL DIFFERENCE
-- TIMESTAMP: stored in UTC, converted to/from server timezone on read/write
-- DATETIME: stores exactly what you give it, no timezone conversion

-- TIMESTAMP gotcha: 2038 problem — wraps at 2038-01-19 03:14:07 UTC
-- Use DATETIME if you need dates beyond 2038

-- Fractional seconds (MySQL 5.6.4+)
DATETIME(3)    -- milliseconds: 2023-01-15 10:30:00.123
DATETIME(6)    -- microseconds: 2023-01-15 10:30:00.123456
TIMESTAMP(3)   -- milliseconds

-- Auto-update timestamps
created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)

-- Common datetime operations
SELECT NOW();                           -- current datetime (server timezone)
SELECT UTC_TIMESTAMP();                 -- UTC time always
SELECT CURDATE();                       -- current date
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d'); -- "2023-01-15"
SELECT DATEDIFF('2023-12-31', '2023-01-01');  -- 364
SELECT DATE_ADD(NOW(), INTERVAL 7 DAY);
SELECT DATE_ADD(NOW(), INTERVAL 3 MONTH);
SELECT TIMESTAMPDIFF(MINUTE, start_time, end_time);
SELECT UNIX_TIMESTAMP(created_at);     -- to unix timestamp
SELECT FROM_UNIXTIME(1673827200);      -- from unix timestamp
SELECT EXTRACT(YEAR FROM created_at);
SELECT WEEK(created_at, 1);            -- ISO week number

-- Timezone handling
SET time_zone = '+00:00';  -- set session timezone to UTC
SET GLOBAL time_zone = '+00:00';
-- Best practice: store server in UTC, convert in application layer
```

---

# SECTION 2: DDL — CREATING AND MANAGING TABLES

## 2.1 CREATE TABLE Deep Dive

```sql
-- Complete table definition example
CREATE TABLE orders (
    -- Primary key
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Foreign keys
    user_id     BIGINT UNSIGNED NOT NULL,
    product_id  BIGINT UNSIGNED NOT NULL,

    -- Business columns
    status      ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled')
                    NOT NULL DEFAULT 'pending',
    quantity    INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price  DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes       TEXT,
    metadata    JSON,

    -- Audit columns
    created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                    ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at  DATETIME(3) NULL DEFAULT NULL,  -- soft delete

    -- Constraints
    PRIMARY KEY (id),
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orders_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_unit_price CHECK (unit_price >= 0),

    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_status_created (status, created_at),
    INDEX idx_created_at (created_at)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci
ROW_FORMAT=DYNAMIC;

-- Generated (computed) columns
ALTER TABLE orders ADD COLUMN
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED;
-- STORED: computed and stored on disk, can be indexed
-- VIRTUAL: computed on read, not stored, cannot be indexed (default)

-- Invisible columns (MySQL 8.0.23+)
ALTER TABLE users ADD COLUMN
    internal_flag TINYINT(1) INVISIBLE DEFAULT 0;
-- Not shown in SELECT *, must reference explicitly

-- Column compression (MySQL 8.0 + InnoDB)
-- Large VARCHAR/BLOB columns compressed automatically with ROW_FORMAT=COMPRESSED

-- Partitioning — divide large tables
CREATE TABLE logs (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NOT NULL,
    message    TEXT,
    PRIMARY KEY (id, created_at)  -- partition key must be in PK
)
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION pmax  VALUES LESS THAN MAXVALUE
);

-- Partition pruning: WHERE created_at >= '2023-01-01' only scans p2023+
```

---

## 2.2 ALTER TABLE

```sql
-- Column operations
ALTER TABLE users
    ADD COLUMN phone VARCHAR(20) NULL AFTER email,
    ADD COLUMN age TINYINT UNSIGNED NULL,
    MODIFY COLUMN name VARCHAR(200) NOT NULL,
    CHANGE COLUMN old_name new_name VARCHAR(100),
    DROP COLUMN deprecated_col,
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN status DROP DEFAULT;

-- Index operations
ALTER TABLE users
    ADD INDEX idx_email (email),
    ADD UNIQUE INDEX uq_username (username),
    ADD FULLTEXT INDEX ft_name (name),
    DROP INDEX idx_old_name,
    RENAME INDEX idx_old TO idx_new;  -- MySQL 5.7+

-- ALTER TABLE in MySQL — LOCKS and PERFORMANCE
-- Small tables: instant, OK
-- Large tables (millions of rows): potential problems

-- ALGORITHM options:
-- INSTANT: metadata only, no table rebuild (MySQL 8.0, limited operations)
-- INPLACE: no full table copy, may still block briefly
-- COPY: full table rebuild, heavy I/O, long lock

-- Online DDL with pt-online-schema-change or gh-ost for large tables:
-- These tools create a shadow table and use triggers to sync changes

-- Check if operation supports INSTANT/INPLACE:
ALTER TABLE users ADD COLUMN new_col INT NULL, ALGORITHM=INSTANT;
ALTER TABLE users ADD INDEX idx_email (email), ALGORITHM=INPLACE, LOCK=NONE;
ALTER TABLE users MODIFY COLUMN name VARCHAR(500), ALGORITHM=COPY;  -- rebuilds table

-- InnoDB supports most online DDL since MySQL 5.7/8.0
-- Operations that always require COPY (full rebuild):
-- Changing column data type, removing primary key, changing ROW_FORMAT

-- RENAME TABLE
RENAME TABLE old_name TO new_name;
RENAME TABLE old_name TO schema2.new_name;  -- move between schemas

-- TRUNCATE TABLE — faster than DELETE, resets AUTO_INCREMENT
TRUNCATE TABLE large_table;  -- DDL, cannot be rolled back in same transaction
-- vs DELETE FROM large_table; -- DML, can be rolled back, slow for large tables
```

---

# SECTION 3: DML — QUERYING AND MODIFYING DATA

## 3.1 SELECT — Comprehensive

```sql
-- Basic SELECT structure (logical processing order):
-- FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT

SELECT
    u.id,
    u.name,
    u.email,
    COUNT(o.id)          AS order_count,
    SUM(o.total_price)   AS total_spent,
    MAX(o.created_at)    AS last_order_date,
    AVG(o.total_price)   AS avg_order_value
FROM users u
    INNER JOIN orders o ON o.user_id = u.id
    LEFT JOIN user_addresses ua ON ua.user_id = u.id AND ua.is_primary = 1
WHERE
    u.created_at >= '2023-01-01'
    AND u.status = 'active'
    AND o.status NOT IN ('cancelled', 'pending')
GROUP BY
    u.id, u.name, u.email  -- must include all non-aggregate SELECT columns
HAVING
    COUNT(o.id) >= 5        -- filter on aggregate — WHERE runs before GROUP BY
    AND SUM(o.total_price) > 100
ORDER BY
    total_spent DESC,
    u.name ASC
LIMIT 20 OFFSET 0;          -- pagination: page 1

-- JOIN types
INNER JOIN  -- only matching rows in both tables
LEFT JOIN   -- all rows from left + matching from right (NULL if no match)
RIGHT JOIN  -- all rows from right + matching from left (rarely used, prefer LEFT JOIN)
CROSS JOIN  -- Cartesian product (use carefully — rows × rows)
-- Note: MySQL doesn't have FULL OUTER JOIN — simulate with UNION:
SELECT * FROM a LEFT JOIN b ON a.id = b.a_id
UNION
SELECT * FROM a RIGHT JOIN b ON a.id = b.a_id WHERE a.id IS NULL;

-- Self join
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Multiple conditions in JOIN
LEFT JOIN user_settings us
    ON us.user_id = u.id
    AND us.key = 'notifications'
    AND us.value = 'enabled'
-- Moving filter into JOIN condition vs WHERE:
-- In LEFT JOIN: ON condition filters joined rows but keeps left-side rows
-- In LEFT JOIN: WHERE condition filters AFTER join (turns LEFT into INNER)

-- Subqueries
SELECT * FROM users
WHERE id IN (
    SELECT DISTINCT user_id FROM orders WHERE status = 'cancelled'
);

-- Correlated subquery (runs once per outer row — often slow)
SELECT name,
    (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count
FROM users u;

-- EXISTS vs IN vs JOIN performance:
-- EXISTS: stops at first match, good for large subquery results
-- IN: materializes the subquery result, good for small result sets
-- JOIN: usually most efficient when with proper indexes

SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'shipped');

-- UNION and UNION ALL
SELECT id, name FROM customers
UNION ALL  -- keeps duplicates (faster — no dedup step)
SELECT id, name FROM vendors;

SELECT id, name FROM customers
UNION     -- removes duplicates (requires sort/hash)
SELECT id, name FROM vendors;

-- CTEs (Common Table Expressions) — MySQL 8.0+
WITH active_users AS (
    SELECT id, name, email
    FROM users
    WHERE status = 'active' AND created_at >= '2023-01-01'
),
user_orders AS (
    SELECT user_id, COUNT(*) AS cnt, SUM(total_price) AS total
    FROM orders
    WHERE status = 'delivered'
    GROUP BY user_id
)
SELECT
    au.name,
    au.email,
    COALESCE(uo.cnt, 0)   AS order_count,
    COALESCE(uo.total, 0) AS lifetime_value
FROM active_users au
LEFT JOIN user_orders uo ON uo.user_id = au.id
ORDER BY uo.total DESC;

-- Recursive CTEs (MySQL 8.0+)
WITH RECURSIVE category_tree AS (
    -- Anchor: top-level categories
    SELECT id, name, parent_id, 0 AS depth, CAST(name AS CHAR(1000)) AS path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive: children
    SELECT c.id, c.name, c.parent_id, ct.depth + 1, CONCAT(ct.path, ' > ', c.name)
    FROM categories c
    INNER JOIN category_tree ct ON ct.id = c.parent_id
)
SELECT * FROM category_tree ORDER BY path;
```

---

## 3.2 Window Functions (MySQL 8.0+)

```sql
-- Window functions — aggregate over a "window" without collapsing rows

-- ROW_NUMBER, RANK, DENSE_RANK
SELECT
    name,
    department,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
    RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rank_in_dept,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank,
    PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS pct_rank,
    NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;

-- RANK vs DENSE_RANK vs ROW_NUMBER
-- Salaries: 100, 90, 90, 80
-- ROW_NUMBER: 1, 2, 3, 4
-- RANK:       1, 2, 2, 4   (gap after tie)
-- DENSE_RANK: 1, 2, 2, 3   (no gap)

-- LAG and LEAD — access previous/next rows
SELECT
    date,
    revenue,
    LAG(revenue, 1, 0)  OVER (ORDER BY date) AS prev_day_revenue,
    LEAD(revenue, 1, 0) OVER (ORDER BY date) AS next_day_revenue,
    revenue - LAG(revenue, 1, 0) OVER (ORDER BY date) AS day_over_day_change
FROM daily_revenue;

-- FIRST_VALUE, LAST_VALUE, NTH_VALUE
SELECT
    name,
    department,
    salary,
    FIRST_VALUE(name)  OVER (PARTITION BY department ORDER BY salary DESC) AS top_earner,
    LAST_VALUE(name)   OVER (
        PARTITION BY department
        ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS bottom_earner  -- LAST_VALUE requires explicit frame for correct result!
FROM employees;

-- Running totals and moving averages
SELECT
    date,
    amount,
    SUM(amount) OVER (ORDER BY date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
    AVG(amount) OVER (ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7day,
    SUM(amount) OVER (PARTITION BY YEAR(date), MONTH(date)) AS monthly_total
FROM transactions;

-- Frame specifications:
-- ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- classic running total
-- ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING           -- centered 3-row window
-- RANGE BETWEEN INTERVAL 7 DAY PRECEDING AND CURRENT ROW  -- date-based window

-- Get top N per group (common interview problem)
SELECT * FROM (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
) ranked
WHERE rn <= 3;  -- top 3 per department

-- Gaps and islands (consecutive sequences)
SELECT
    user_id,
    MIN(login_date) AS streak_start,
    MAX(login_date) AS streak_end,
    COUNT(*) AS streak_length
FROM (
    SELECT
        user_id,
        login_date,
        DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER
            (PARTITION BY user_id ORDER BY login_date) DAY) AS grp
    FROM user_logins
) grouped
GROUP BY user_id, grp
ORDER BY streak_length DESC;
```

---

## 3.3 INSERT, UPDATE, DELETE Patterns

```sql
-- INSERT patterns
INSERT INTO users (name, email, status) VALUES ('Alice', 'alice@example.com', 'active');

-- Multi-row insert (much faster than individual inserts)
INSERT INTO users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com'),
    ('Charlie', 'charlie@example.com');

-- INSERT IGNORE — silently ignore duplicate key errors
INSERT IGNORE INTO users (email) VALUES ('duplicate@example.com');
-- Warning: also silently ignores other errors — use carefully

-- INSERT ... ON DUPLICATE KEY UPDATE (upsert)
INSERT INTO page_views (page_id, view_date, count)
VALUES (1, '2023-01-15', 1)
ON DUPLICATE KEY UPDATE
    count = count + 1,
    updated_at = NOW();

-- REPLACE INTO — DELETE + INSERT (dangerous: loses data if has FK children)
-- Avoid in most cases — use ON DUPLICATE KEY UPDATE instead

-- INSERT ... SELECT
INSERT INTO archived_orders (SELECT * FROM orders WHERE created_at < '2022-01-01');

-- UPDATE patterns
UPDATE users
SET
    status = 'inactive',
    updated_at = NOW()
WHERE
    last_login < DATE_SUB(NOW(), INTERVAL 1 YEAR)
    AND status = 'active';

-- UPDATE with JOIN
UPDATE orders o
    INNER JOIN users u ON u.id = o.user_id
SET
    o.shipping_address = u.default_address,
    o.updated_at = NOW()
WHERE o.shipping_address IS NULL;

-- UPDATE with CASE
UPDATE products
SET price = CASE
    WHEN category = 'electronics' THEN price * 0.9
    WHEN category = 'clothing'    THEN price * 0.85
    ELSE price * 0.95
END
WHERE sale_active = 1;

-- DELETE patterns
DELETE FROM users WHERE status = 'deleted' AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- DELETE with JOIN
DELETE o FROM orders o
    INNER JOIN users u ON u.id = o.user_id
WHERE u.status = 'banned';

-- Batch delete — avoid locking huge tables for minutes
-- Delete in chunks to minimize lock contention
DELIMITER //
CREATE PROCEDURE delete_old_logs()
BEGIN
    DECLARE done BOOLEAN DEFAULT FALSE;
    REPEAT
        DELETE FROM logs
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
        LIMIT 1000;  -- small batches

        IF ROW_COUNT() < 1000 THEN
            SET done = TRUE;
        END IF;

        DO SLEEP(0.01);  -- tiny sleep to release locks
    UNTIL done END REPEAT;
END //
DELIMITER ;
```

---

# SECTION 4: INDEXES — DEEP DIVE

## 4.1 Index Types and Internals

```sql
-- InnoDB uses B+Tree for most indexes
-- B+Tree: all data in leaf nodes, internal nodes are routing keys
-- Search: O(log n), Range scan: O(log n + k) where k = result rows

-- PRIMARY KEY — clustered index
-- InnoDB physically orders data rows by PK
-- Every secondary index stores the PK value as a pointer to the data row
-- Good PK: small, sequential (INT/BIGINT AUTO_INCREMENT)
-- Bad PK: UUID v4 (random — causes page fragmentation)
-- UUID v7: time-ordered UUIDs — better for primary keys if UUID needed

-- Secondary indexes
CREATE INDEX idx_email ON users(email);                    -- B+Tree
CREATE UNIQUE INDEX uq_email ON users(email);              -- unique B+Tree
CREATE FULLTEXT INDEX ft_content ON articles(content);    -- inverted index
CREATE SPATIAL INDEX sp_location ON places(coordinates);  -- R-Tree

-- Prefix indexes — for TEXT/BLOB or to save space on long VARCHAR
CREATE INDEX idx_url ON pages(url(100));  -- index first 100 bytes
-- Selectivity matters: longer prefix = more selective but larger index

-- Composite indexes — column order MATTERS critically
CREATE INDEX idx_user_status_created ON orders(user_id, status, created_at);

-- This index is useful for:
-- WHERE user_id = 1
-- WHERE user_id = 1 AND status = 'active'
-- WHERE user_id = 1 AND status = 'active' AND created_at > '2023-01-01'
-- WHERE user_id = 1 AND created_at > '2023-01-01'  (partial — user_id only used)

-- This index is NOT useful for:
-- WHERE status = 'active'  (doesn't start with leading column)
-- WHERE created_at > '2023-01-01'  (skips user_id and status)

-- Leftmost prefix rule: composite index on (A, B, C) can be used as:
-- (A), (A,B), (A,B,C) — but NOT (B), (C), (B,C), (A,C)

-- Covering index — index contains all columns needed for query
-- Query doesn't need to access actual row data (no "back to table lookup")
CREATE INDEX idx_covering ON orders(user_id, status, total_price, created_at);
-- SELECT total_price, created_at FROM orders WHERE user_id=1 AND status='active'
-- — fully covered by index! "Using index" in EXPLAIN

-- Index on expression (MySQL 8.0+)
CREATE INDEX idx_lower_email ON users((LOWER(email)));
-- Now: WHERE LOWER(email) = 'alice@example.com' can use index
-- Without this, wrapping column in function defeats index usage!

-- Partial/filtered index (MySQL doesn't support natively, but can simulate)
-- MySQL 8.0 functional indexes are the closest alternative

-- Index skip scan (MySQL 8.0+)
-- Can use composite index even without leading column in some cases
-- Optimizer breaks index into sub-ranges per distinct value of first column
-- Only beneficial when first column has very few distinct values
```

---

## 4.2 EXPLAIN and Query Analysis

```sql
-- EXPLAIN shows execution plan
EXPLAIN SELECT u.name, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id;

-- EXPLAIN output columns:
-- id:            query block number (same number = same subquery level)
-- select_type:   SIMPLE, PRIMARY, SUBQUERY, DERIVED, UNION, DEPENDENT SUBQUERY
-- table:         table being accessed
-- partitions:    which partitions accessed
-- type:          access method (quality ranking):
--                system > const > eq_ref > ref > range > index > ALL
-- possible_keys: indexes that could be used
-- key:           index actually chosen
-- key_len:       bytes of index used (longer = more columns used)
-- ref:           what the index is compared to (const, table.column)
-- rows:          estimated rows examined
-- filtered:      % of rows passing WHERE after index
-- Extra:         important details

-- Access type meanings:
-- system:  single row (special case of const)
-- const:   at most 1 row (PK = ?, UNIQUE = ?)
-- eq_ref:  join uses PK or UNIQUE NOT NULL index
-- ref:     non-unique index lookup
-- range:   index range scan (>, <, BETWEEN, IN, LIKE 'prefix%')
-- index:   full index scan (all index pages, no data pages)
-- ALL:     full table scan — almost always bad on large tables

-- Extra column values:
-- "Using index":        covering index — no table access needed
-- "Using where":        filter applied after index
-- "Using temporary":    needs temp table (often GROUP BY, ORDER BY, DISTINCT)
-- "Using filesort":     sort can't use index — done in memory or disk
-- "Using join buffer":  join without index — inefficient
-- "Impossible WHERE":   condition always false (e.g., id = 1 AND id = 2)
-- "Select tables optimized away": aggregate with no rows possible

-- EXPLAIN FORMAT=JSON — more detail
EXPLAIN FORMAT=JSON SELECT ...;

-- EXPLAIN ANALYZE (MySQL 8.0.18+) — actually executes and shows real stats
EXPLAIN ANALYZE SELECT ...;
-- Shows: actual rows vs estimated, actual time, loops

-- SHOW WARNINGS after EXPLAIN — see optimizer-transformed query
EXPLAIN SELECT ...;
SHOW WARNINGS;  -- shows how MySQL rewrote the query

-- Index hints — force or ignore specific indexes
SELECT * FROM users USE INDEX (idx_email) WHERE email = 'alice@example.com';
SELECT * FROM users FORCE INDEX (idx_email) WHERE email = 'alice@example.com';
SELECT * FROM users IGNORE INDEX (idx_email) WHERE email = 'alice@example.com';

-- When optimizer ignores an index:
-- Estimated table scan cheaper than index (small table, many rows returned)
-- Statistics are stale: ANALYZE TABLE users; -- updates statistics
-- Index not usable due to type mismatch, function on column, implicit conversion
```

---

## 4.3 Index Design Patterns

```sql
-- PATTERN 1: The index must match the WHERE → GROUP BY → ORDER BY sequence
-- Query:
SELECT user_id, status, SUM(amount) AS total
FROM transactions
WHERE user_id = 123
  AND status = 'completed'
GROUP BY user_id, status
ORDER BY total DESC;

-- Ideal index: (user_id, status) — covers WHERE and GROUP BY
-- ORDER BY total is on computed value — can't be indexed here

-- PATTERN 2: Range condition stops index usage for subsequent columns
-- Index: (user_id, created_at, status)
-- Query: WHERE user_id = 1 AND created_at > '2023-01-01' AND status = 'active'
-- Index usage: user_id (eq) + created_at (range) -- status NOT used after range!
-- Better index for this: (user_id, status, created_at)
-- WHERE user_id = 1 AND status = 'active' AND created_at > '2023-01-01'
-- All three columns used: user_id (eq) + status (eq) + created_at (range)

-- PATTERN 3: Index for ORDER BY — avoid filesort
-- Query: WHERE status = 'active' ORDER BY created_at DESC LIMIT 10
-- Index: (status, created_at) — used for both WHERE and ORDER BY!
-- Without this index: full scan + filesort

-- PATTERN 4: Count queries
-- SELECT COUNT(*) — uses any covering index (usually the smallest one)
-- SELECT COUNT(col) — must check col for NULL, slightly different
-- SELECT COUNT(DISTINCT col) — cannot use covering index easily

-- PATTERN 5: OR in WHERE — often prevents index use
-- Bad:  WHERE status = 'active' OR user_id = 5
-- Sometimes optimizer uses index merge, but usually prefer UNION:
SELECT * FROM users WHERE status = 'active'
UNION ALL
SELECT * FROM users WHERE user_id = 5 AND status != 'active';

-- PATTERN 6: LIKE pattern matching
-- LIKE 'prefix%' — CAN use index (range scan)
-- LIKE '%suffix' — CANNOT use index (full scan) — use FULLTEXT instead
-- LIKE '%middle%' — CANNOT use index

-- PATTERN 7: Implicit type conversion destroys index usage
-- users.id is INT, but:
SELECT * FROM users WHERE id = '123';  -- MySQL converts '123' to INT — index works
SELECT * FROM users WHERE phone = 12345;  -- phone is VARCHAR! Converts all rows — no index!
-- Always match data types in comparisons!

-- PATTERN 8: Function on indexed column prevents index use
SELECT * FROM users WHERE YEAR(created_at) = 2023;  -- no index on created_at!
-- Fix: range instead of function
SELECT * FROM users WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01';

-- Index cardinality — check selectivity
SELECT
    COUNT(DISTINCT status) AS status_cardinality,      -- low (few values)
    COUNT(DISTINCT user_id) AS user_cardinality,       -- high (many values)
    COUNT(*) AS total_rows
FROM orders;

-- High cardinality = good index candidate (email, user_id, product_id)
-- Low cardinality = bad standalone index (status, boolean, gender)
-- Low cardinality columns work well as secondary columns in composite index
SHOW INDEX FROM orders;  -- shows cardinality estimate
```

---

# SECTION 5: TRANSACTIONS AND LOCKING

## 5.1 Transaction Isolation Levels

```sql
-- ACID properties:
-- Atomicity: all or nothing
-- Consistency: valid state to valid state
-- Isolation: concurrent transactions don't interfere
-- Durability: committed data persists

-- Isolation levels (SQL standard)
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;  -- InnoDB default
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Problems and which levels prevent them:
--                          Dirty Read  Non-Repeatable Read  Phantom Read
-- READ UNCOMMITTED:         YES         YES                  YES
-- READ COMMITTED:           NO          YES                  YES
-- REPEATABLE READ:          NO          NO                   NO (InnoDB: MVCC)
-- SERIALIZABLE:             NO          NO                   NO

-- Dirty Read: reading uncommitted data from another transaction
-- Non-repeatable Read: same SELECT returns different rows in same transaction
-- Phantom Read: new rows appear in range query due to another commit

-- InnoDB REPEATABLE READ is special:
-- Uses MVCC (Multi-Version Concurrency Control) to prevent phantoms for consistent reads
-- But locking reads (SELECT ... FOR UPDATE) still can see phantoms without gap locks

-- Transaction basics
START TRANSACTION;  -- or: BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- Rollback on error
START TRANSACTION;
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    -- something fails...
ROLLBACK;

-- Savepoints
START TRANSACTION;
    INSERT INTO audit_log (event) VALUES ('process start');
    SAVEPOINT sp1;
    -- risky operations
    UPDATE accounts SET balance = 0 WHERE id = 1;
    ROLLBACK TO SAVEPOINT sp1;  -- undo risky part
    INSERT INTO audit_log (event) VALUES ('process failed safely');
COMMIT;

-- autocommit — each statement is its own transaction by default
SET autocommit = 0;  -- disable: statements need explicit COMMIT
SET autocommit = 1;  -- enable (default)

-- Implicit commit: DDL statements (CREATE, ALTER, DROP, TRUNCATE) cause implicit commit!
-- Cannot rollback DDL in MySQL (unlike PostgreSQL)
```

---

## 5.2 Locking

```sql
-- InnoDB lock types
-- Shared lock (S): allows other S locks, blocks X locks — "I'm reading this"
-- Exclusive lock (X): blocks all other locks — "I'm modifying this"
-- Intention locks (IS, IX): table-level, signals intent to acquire row locks

-- Row-level locks
SELECT * FROM orders WHERE id = 1 FOR SHARE;     -- shared lock (S) — MySQL 8.0
SELECT * FROM orders WHERE id = 1 LOCK IN SHARE MODE; -- equivalent, older syntax
SELECT * FROM orders WHERE id = 1 FOR UPDATE;    -- exclusive lock (X)
SELECT * FROM orders WHERE id = 1 FOR UPDATE SKIP LOCKED;  -- skip locked rows
SELECT * FROM orders WHERE id = 1 FOR UPDATE NOWAIT;       -- fail immediately if locked

-- FOR UPDATE use case: optimistic locking flow
START TRANSACTION;
    SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
    -- other session cannot update/delete/lock this row now
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- Gap locks — lock gaps between index values (REPEATABLE READ)
-- Prevents phantom reads in range queries
SELECT * FROM orders WHERE user_id BETWEEN 5 AND 10 FOR UPDATE;
-- Locks rows with user_id 5-10 AND the gaps (prevents INSERT of user_id=7)

-- Next-key locks = gap lock + row lock (InnoDB default in RR)
-- Combination prevents phantom reads

-- Table locks
LOCK TABLES users READ;   -- shared table lock
LOCK TABLES users WRITE;  -- exclusive table lock
UNLOCK TABLES;

-- MyISAM only supports table-level locking (no row locks)
-- InnoDB uses row-level locks (table locks via LOCK TABLES bypass InnoDB's locking)

-- Deadlock — circular wait
-- Session 1: LOCK row A, then tries to LOCK row B
-- Session 2: LOCK row B, then tries to LOCK row A → DEADLOCK

-- InnoDB detects deadlocks and rolls back smaller transaction
-- SHOW ENGINE INNODB STATUS \G  -- shows last deadlock info

-- Prevent deadlocks:
-- 1. Access tables/rows in consistent order
-- 2. Keep transactions short and small
-- 3. Use lower isolation level if possible
-- 4. Add proper indexes (fewer rows locked)

-- Lock wait timeout
SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';  -- default 50 seconds
SET SESSION innodb_lock_wait_timeout = 5;  -- reduce for responsive applications

-- Check current locks and waits (MySQL 8.0)
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;
SELECT * FROM information_schema.INNODB_TRX;  -- active transactions
```

---

## 5.3 MVCC — Multi-Version Concurrency Control

```sql
-- MVCC: each row has hidden system columns:
-- DB_TRX_ID: transaction ID that last modified the row
-- DB_ROLL_PTR: pointer to undo log entry for previous version
-- DB_ROW_ID: internal row ID (if no PK or unique key)

-- How consistent read works:
-- On START TRANSACTION, InnoDB creates a "read view" (snapshot)
-- Read view contains: current transaction ID, list of active transaction IDs
-- When reading a row: if modified by a newer transaction → go to undo log for older version
-- Result: readers don't block writers, writers don't block readers

-- Undo log: history of row changes for MVCC and rollback
-- Purge thread: cleans up old undo log entries after no transaction needs them
-- Long-running transactions prevent undo log purge → undo tablespace grows!

-- History list length (HLL) — how backed up undo log is
SHOW ENGINE INNODB STATUS \G
-- Look for: "History list length X" — should be < 1000
-- High HLL = long-running transactions or high write load

-- Read view and REPEATABLE READ:
-- Session 1: START TRANSACTION; SELECT * FROM orders;  -- sees 100 rows
-- Session 2: INSERT INTO orders ...; COMMIT;
-- Session 1: SELECT * FROM orders;  -- still sees 100 rows (consistent snapshot)
-- Session 1: SELECT * FROM orders FOR UPDATE;  -- sees 101 rows (locking read bypasses MVCC)

-- READ COMMITTED:
-- Each statement gets a fresh read view
-- Sees committed data from other transactions between statements
-- More performant (less undo log dependency)
-- Used by many apps (e.g., Postgres uses RC variant)
```

---

# SECTION 6: STORED PROCEDURES AND FUNCTIONS

## 6.1 Stored Procedures

```sql
DELIMITER //

CREATE PROCEDURE transfer_funds(
    IN  from_account_id BIGINT,
    IN  to_account_id   BIGINT,
    IN  amount          DECIMAL(10,2),
    OUT success         TINYINT,
    OUT error_message   VARCHAR(255)
)
BEGIN
    DECLARE from_balance DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET success = 0;
        GET DIAGNOSTICS CONDITION 1 error_message = MESSAGE_TEXT;
    END;

    START TRANSACTION;

    -- Lock both rows in consistent order to prevent deadlock
    SELECT balance INTO from_balance
    FROM accounts
    WHERE id = LEAST(from_account_id, to_account_id)
    FOR UPDATE;

    SELECT balance INTO from_balance
    FROM accounts
    WHERE id = from_account_id
    FOR UPDATE;

    IF from_balance < amount THEN
        ROLLBACK;
        SET success = 0;
        SET error_message = 'Insufficient funds';
        LEAVE;  -- exit the BEGIN...END block
    END IF;

    UPDATE accounts SET balance = balance - amount WHERE id = from_account_id;
    UPDATE accounts SET balance = balance + amount WHERE id = to_account_id;

    INSERT INTO transactions (from_id, to_id, amount, type, created_at)
    VALUES (from_account_id, to_account_id, amount, 'transfer', NOW());

    COMMIT;
    SET success = 1;
    SET error_message = '';
END //

DELIMITER ;

-- Call procedure
CALL transfer_funds(1, 2, 100.00, @success, @error);
SELECT @success, @error;

-- Variables in procedures
DECLARE v_count INT DEFAULT 0;
DECLARE v_name VARCHAR(100);

-- Control flow
IF condition THEN
    -- statements
ELSEIF other THEN
    -- statements
ELSE
    -- statements
END IF;

CASE v_status
    WHEN 'active' THEN SET v_label = 'Active User';
    WHEN 'inactive' THEN SET v_label = 'Inactive User';
    ELSE SET v_label = 'Unknown';
END CASE;

-- Loops
WHILE v_count < 10 DO
    SET v_count = v_count + 1;
END WHILE;

REPEAT
    SET v_count = v_count + 1;
UNTIL v_count >= 10 END REPEAT;

loop_label: LOOP
    IF v_count >= 10 THEN LEAVE loop_label; END IF;
    SET v_count = v_count + 1;
END LOOP loop_label;

-- Cursors — iterate result sets
DELIMITER //
CREATE PROCEDURE process_users()
BEGIN
    DECLARE done BOOLEAN DEFAULT FALSE;
    DECLARE v_id INT;
    DECLARE v_email VARCHAR(255);

    DECLARE cur CURSOR FOR
        SELECT id, email FROM users WHERE status = 'active';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    fetch_loop: LOOP
        FETCH cur INTO v_id, v_email;
        IF done THEN LEAVE fetch_loop; END IF;

        -- Process each row
        CALL send_notification(v_id, v_email);
    END LOOP;
    CLOSE cur;
END //
DELIMITER ;
```

---

## 6.2 Functions and Triggers

```sql
-- Stored function — returns a single value
DELIMITER //
CREATE FUNCTION calculate_tax(
    amount DECIMAL(10,2),
    rate   DECIMAL(5,4)
) RETURNS DECIMAL(10,2)
DETERMINISTIC
NO SQL
BEGIN
    RETURN ROUND(amount * rate, 2);
END //
DELIMITER ;

SELECT calculate_tax(100.00, 0.0875);  -- 8.75

-- DETERMINISTIC: same inputs always give same output (can be cached, affects replication)
-- NO SQL: no SQL statements (READS SQL DATA, MODIFIES SQL DATA for others)

-- User-defined functions vs stored procedures:
-- Functions: return single value, can be used in SELECT/WHERE/HAVING
-- Procedures: no return value (use OUT params), called with CALL

-- Triggers — auto-execute on DML events
DELIMITER //
CREATE TRIGGER orders_before_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    -- Validate
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be positive';
    END IF;

    -- Set computed values
    SET NEW.total_price = NEW.quantity * NEW.unit_price;
END //

CREATE TRIGGER orders_after_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
    END IF;
END //
DELIMITER ;

-- Trigger limitations:
-- Cannot call stored procedures that do a COMMIT/ROLLBACK
-- Cannot use transactions within triggers
-- Can affect performance — hidden logic
-- Cannot be created on temporary tables
-- Trigger fires per-row, NOT per-statement (unlike PostgreSQL)

-- SIGNAL — raise custom errors
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Custom error';
-- SQLSTATE '45000' = user-defined exception (safe to use)
-- RESIGNAL re-raises current condition in HANDLER

-- Events — scheduled tasks (MySQL Event Scheduler)
SET GLOBAL event_scheduler = ON;

CREATE EVENT cleanup_old_sessions
ON SCHEDULE EVERY 1 HOUR
STARTS NOW()
DO
    DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL 1 DAY;

CREATE EVENT daily_report
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 02:00:00'
DO
    CALL generate_daily_report();
```

---

# SECTION 7: QUERY OPTIMIZATION

## 7.1 Query Optimizer Internals

```sql
-- MySQL optimizer: Cost-based optimizer (CBO)
-- Makes decisions based on:
-- 1. Statistics (index cardinality, table row count)
-- 2. Cost model (I/O costs, CPU costs)
-- 3. Available indexes
-- 4. Join type hints

-- Cost constants (mysql.server_cost, mysql.engine_cost tables)
SELECT * FROM mysql.server_cost;
SELECT * FROM mysql.engine_cost;

-- Key optimizer behaviors:
-- 1. Index selection: chooses index with lowest estimated cost
-- 2. Join order: tries different orderings for small numbers of tables
-- 3. Subquery transformation: often converts IN to EXISTS or JOIN
-- 4. Condition pushdown: moves WHERE conditions closer to table access
-- 5. Covering index optimization: avoids table lookups when possible

-- optimizer_switch — enable/disable optimizer features
SELECT @@optimizer_switch;
SET optimizer_switch = 'index_merge=on,index_merge_union=on';

-- Important switches:
-- index_merge: combine multiple indexes per table
-- mrr: multi-range read optimization (sequential I/O for range scans)
-- batched_key_access: optimize join with index lookups
-- block_nested_loop: use join buffer for non-indexed joins (old; hash join in 8.0)
-- hash_join: hash join algorithm (MySQL 8.0)
-- skip_scan: index skip scan

-- Statistics management
ANALYZE TABLE users;                    -- update statistics
ANALYZE TABLE users, orders, products;  -- multiple tables

-- Check table statistics
SELECT
    table_name,
    table_rows,
    data_length,
    index_length,
    data_free
FROM information_schema.TABLES
WHERE table_schema = 'mydb'
ORDER BY data_length DESC;

-- Histogram statistics (MySQL 8.0+)
-- More accurate stats for non-indexed columns
ANALYZE TABLE orders UPDATE HISTOGRAM ON status WITH 10 BUCKETS;
ANALYZE TABLE orders UPDATE HISTOGRAM ON created_at WITH 100 BUCKETS;
ANALYZE TABLE orders DROP HISTOGRAM ON old_column;

SELECT * FROM information_schema.COLUMN_STATISTICS
WHERE table_name = 'orders';

-- Hash join (MySQL 8.0.18+)
-- When joining tables without appropriate index, uses hash join instead of nested loop
-- Much faster for large table joins without indexes
-- EXPLAIN shows: "Hash join" in Extra column
```

---

## 7.2 Optimization Techniques

```sql
-- 1. SELECT only needed columns — avoid SELECT *
-- Bad: SELECT * FROM users;
-- Good: SELECT id, name, email FROM users;
-- Reason: more I/O, can't use covering index, sends more data over network

-- 2. Use LIMIT for large result sets
SELECT * FROM events ORDER BY created_at DESC LIMIT 100;

-- 3. Efficient pagination — avoid large OFFSET
-- Bad: LIMIT 10 OFFSET 1000000 — scans and discards 1M rows!
SELECT * FROM orders ORDER BY id LIMIT 10 OFFSET 1000000;

-- Good: keyset/cursor pagination
SELECT * FROM orders WHERE id > :last_seen_id ORDER BY id LIMIT 10;
-- Fast regardless of page number — always O(log n)

-- 4. Avoid N+1 query pattern (in ORM context)
-- Bad: SELECT user for each order (N+1 queries)
-- Good: JOIN or IN clause to load all needed data at once

-- 5. Use appropriate JOIN vs subquery
-- Subquery (slower — scanned once per outer row):
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE status='pending');

-- JOIN equivalent (usually faster):
SELECT DISTINCT u.*
FROM users u
INNER JOIN orders o ON o.user_id = u.id AND o.status = 'pending';

-- EXISTS (stops at first match — often best):
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'pending');

-- 6. GROUP BY optimization
-- Loose index scan: if GROUP BY columns match index prefix
-- Tight index scan: reads only needed index entries
-- Temp table + filesort: slowest — avoid by creating proper index

-- 7. COUNT optimization
SELECT COUNT(*) FROM users;                    -- fastest — uses any index
SELECT COUNT(*) FROM users WHERE status='a';   -- uses index on status
SELECT COUNT(email) FROM users;               -- must check for NULL — slightly slower
SELECT COUNT(DISTINCT email) FROM users;      -- requires dedup — slower, may need temp table

-- 8. ORDER BY optimization
-- Sort uses index when: ORDER BY columns match index (same direction)
-- Index: (status, created_at)
-- ORDER BY status, created_at  → uses index
-- ORDER BY status DESC, created_at DESC  → uses index (reverse scan)
-- ORDER BY status ASC, created_at DESC  → CANNOT use this index (mixed direction)

-- MySQL 8.0: descending indexes
CREATE INDEX idx_status_created_desc ON orders(status ASC, created_at DESC);
-- Now both ASC/DESC combos can use index

-- 9. Temporary tables for complex queries
CREATE TEMPORARY TABLE tmp_user_stats
    SELECT user_id, COUNT(*) AS cnt, SUM(amount) AS total
    FROM orders
    WHERE status = 'completed'
    GROUP BY user_id;

CREATE INDEX tmp_idx ON tmp_user_stats(user_id);

SELECT u.name, ts.cnt, ts.total
FROM users u
INNER JOIN tmp_user_stats ts ON ts.user_id = u.id;

DROP TEMPORARY TABLE tmp_user_stats;

-- 10. Query cache (deprecated in MySQL 8.0, removed)
-- Was problematic due to cache invalidation on any write to table
-- Application-level cache (Redis, Memcached) is much better

-- 11. Slow query log — identify queries to optimize
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- log queries > 1 second
SET GLOBAL log_queries_not_using_indexes = ON;
SHOW VARIABLES LIKE 'slow_query_log_file';

-- Analyze slow query log with pt-query-digest or mysqldumpslow
```

---

# SECTION 8: SCHEMA DESIGN PATTERNS

## 8.1 Normalization and Denormalization

```sql
-- First Normal Form (1NF): atomic values, no repeating groups
-- Violation: storing comma-separated tags in one column
-- Wrong:
CREATE TABLE articles (
    id INT PRIMARY KEY,
    title VARCHAR(255),
    tags VARCHAR(500)  -- "mysql,database,sql" -- 1NF violation!
);

-- Correct:
CREATE TABLE articles (id INT PRIMARY KEY, title VARCHAR(255));
CREATE TABLE tags (id INT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE article_tags (article_id INT, tag_id INT, PRIMARY KEY(article_id, tag_id));

-- Second Normal Form (2NF): no partial dependencies (for composite PKs)
-- 3NF: no transitive dependencies
-- BCNF, 4NF, 5NF: stricter normalization levels (rarely needed)

-- Denormalization — intentional violation for performance
-- Tradeoff: data redundancy vs query performance
-- When to denormalize:
-- 1. Hot read path with expensive JOIN
-- 2. Aggregate that's read frequently, written infrequently
-- 3. Sharded databases where JOINs across shards are impossible

-- Example: denormalize order total
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,  -- denormalized (could compute from items)
    item_count INT NOT NULL               -- denormalized
);
-- Must update via trigger or application when order_items change

-- Materialized summary table pattern
CREATE TABLE user_stats (
    user_id    BIGINT PRIMARY KEY,
    order_count INT NOT NULL DEFAULT 0,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_order_at DATETIME,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Maintain via triggers or batch job
-- Queries against user_stats: no JOIN, instant reads

-- EAV (Entity-Attribute-Value) anti-pattern
-- Tempting for "flexible schemas" — almost always a mistake
CREATE TABLE product_attributes (
    product_id INT,
    attribute_name VARCHAR(100),
    attribute_value VARCHAR(500)
);
-- Problems: can't enforce types, indexes useless, JOINs nightmare, no constraints

-- Better alternatives to EAV:
-- 1. JSON column (MySQL 5.7+): typed, queryable, indexable via generated columns
-- 2. Separate tables per attribute type (polymorphic tables)
-- 3. Wide table with nullable columns (if attributes are known)
-- 4. Separate schema per tenant (multi-tenant SaaS)
```

---

## 8.2 Common Schema Patterns

```sql
-- Soft delete pattern
CREATE TABLE users (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    deleted_at DATETIME NULL DEFAULT NULL,
    INDEX idx_deleted (deleted_at)
);

-- Soft delete queries (must always filter):
SELECT * FROM users WHERE deleted_at IS NULL;

-- Unique index that allows multiple soft-deleted:
CREATE UNIQUE INDEX uq_email_active ON users(email, deleted_at);
-- Problem: multiple NULLs allowed? MySQL allows multiple NULL in unique index!
-- Works correctly for soft delete

-- Alternative: use deleted=0/1 with partial unique index (MySQL 8.0+):
CREATE UNIQUE INDEX uq_email_active ON users(email) WHERE deleted_at IS NULL;
-- MySQL doesn't support filtered indexes directly — simulate with generated column:
ALTER TABLE users ADD COLUMN is_deleted TINYINT(1) GENERATED ALWAYS AS
    (IF(deleted_at IS NULL, 0, 1)) VIRTUAL;
CREATE UNIQUE INDEX uq_email_not_deleted ON users(email, is_deleted);

-- Audit log pattern
CREATE TABLE audit_log (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    table_name  VARCHAR(64) NOT NULL,
    record_id   BIGINT NOT NULL,
    action      ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values  JSON,
    new_values  JSON,
    changed_by  BIGINT NULL,  -- user ID
    changed_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB;

-- Hierarchical data — adjacency list
CREATE TABLE categories (
    id        INT PRIMARY KEY,
    name      VARCHAR(100),
    parent_id INT NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);
-- Simple to maintain, recursive CTE for traversal

-- Nested sets — alternative for frequent tree traversal
CREATE TABLE categories_nested (
    id    INT PRIMARY KEY,
    name  VARCHAR(100),
    lft   INT NOT NULL,
    rgt   INT NOT NULL,
    depth INT NOT NULL DEFAULT 0,
    INDEX idx_lft_rgt (lft, rgt)
);
-- Get all descendants: WHERE lft BETWEEN parent.lft AND parent.rgt
-- Expensive to maintain (many updates on insert/move), fast to read

-- Closure table — best for frequent traversal + flexible queries
CREATE TABLE category_paths (
    ancestor_id   INT NOT NULL,
    descendant_id INT NOT NULL,
    depth         INT NOT NULL DEFAULT 0,
    PRIMARY KEY (ancestor_id, descendant_id)
);
-- Insert requires adding a row for each ancestor
-- Get all descendants: SELECT descendant_id FROM paths WHERE ancestor_id = ?
-- Get all ancestors: SELECT ancestor_id FROM paths WHERE descendant_id = ?

-- Time-series pattern
CREATE TABLE metrics (
    metric_name VARCHAR(100) NOT NULL,
    recorded_at DATETIME(3) NOT NULL,
    value       DOUBLE NOT NULL,
    labels      JSON,
    PRIMARY KEY (metric_name, recorded_at),
    INDEX idx_recorded (recorded_at)
)
PARTITION BY RANGE (UNIX_TIMESTAMP(recorded_at)) (
    PARTITION p202301 VALUES LESS THAN (UNIX_TIMESTAMP('2023-02-01')),
    PARTITION p202302 VALUES LESS THAN (UNIX_TIMESTAMP('2023-03-01'))
    -- Add monthly
);
-- Partition pruning: WHERE recorded_at BETWEEN ... only scans relevant partitions
-- DROP PARTITION: instant deletion of old data (no DELETE needed)
```

---

# SECTION 9: REPLICATION AND HIGH AVAILABILITY

## 9.1 MySQL Replication

```sql
-- Binary log (binlog) — foundation of replication
-- Records all changes to data (DDL and DML)
-- Used for: replication, point-in-time recovery, CDC (Change Data Capture)

SHOW VARIABLES LIKE 'log_bin';         -- binlog enabled?
SHOW VARIABLES LIKE 'binlog_format';   -- ROW, STATEMENT, MIXED
SHOW BINARY LOGS;                      -- list binlog files
SHOW MASTER STATUS;                    -- current binlog position

-- Binlog formats:
-- STATEMENT: logs SQL statements — smaller log, but non-deterministic functions risk
-- ROW: logs actual row changes — larger log, accurate, required for some features
-- MIXED: STATEMENT by default, ROW when needed (deprecated path)
-- MySQL 8.0 default: ROW format

-- Replication setup
-- On primary:
CREATE USER 'replica'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'replica'@'%';
FLUSH PRIVILEGES;

-- On replica:
CHANGE MASTER TO
    MASTER_HOST = '10.0.0.1',
    MASTER_USER = 'replica',
    MASTER_PASSWORD = 'password',
    MASTER_LOG_FILE = 'mysql-bin.000001',
    MASTER_LOG_POS = 154;
START SLAVE;
SHOW SLAVE STATUS \G

-- GTID replication (Global Transaction ID) — MySQL 5.6+
-- Each transaction gets a unique ID: server_uuid:transaction_id
-- Easier failover — no need to track binlog positions
-- On primary: gtid_mode=ON, enforce_gtid_consistency=ON
CHANGE MASTER TO
    MASTER_AUTO_POSITION = 1;  -- GTID-based, no file/position needed

-- Replication types:
-- Async: primary commits, replica catches up eventually — data loss possible
-- Semi-sync: primary waits for at least one replica ACK before returning to client
-- Sync: primary waits for all replicas — very slow, not used in MySQL

-- Semi-sync replication (plugin)
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = 1;
SET GLOBAL rpl_semi_sync_master_timeout = 1000;  -- 1s timeout (falls back to async)

-- Replica lag
SHOW SLAVE STATUS \G
-- Seconds_Behind_Master: replication lag in seconds
-- Exec_Master_Log_Pos vs Read_Master_Log_Pos: read ahead vs execution position

-- Read scaling with replicas
-- Route reads to replica, writes to primary
-- Application must handle replication lag (stale reads)
-- Solutions: read-your-writes (route to primary for own updates), version timestamps

-- Group Replication (MySQL 5.7.17+) — multi-primary or single-primary
-- Built-in distributed consensus (Paxos-based)
-- Automatic failover, conflict detection
-- Foundation for InnoDB Cluster
```

---

## 9.2 InnoDB Cluster and High Availability

```sql
-- InnoDB Cluster components:
-- MySQL Group Replication: synchronous replication between 3+ nodes
-- MySQL Shell: admin interface
-- MySQL Router: application connection routing

-- ProxySQL — high-performance MySQL proxy
-- Connection pooling (saves OS threads)
-- Query routing: write to primary, read from replicas
-- Query rules: rewrite, block, cache, route
-- Statistics and monitoring

-- Galera Cluster (Percona XtraDB Cluster / MariaDB)
-- Synchronous multi-master replication
-- Any node can accept writes
-- wsrep (Write Set REPlication) protocol
-- Flow control: slow node slows all nodes
-- Good for: high availability, no lag, simpler architecture
-- Limitations: large write-heavy workloads, write certification conflicts

-- Connection pooling patterns
-- Without pooling: each request opens/closes DB connection (~100ms overhead)
-- With pooling: connections reused, latency drops to ~1ms
-- PgBouncer equivalent for MySQL: ProxySQL, MySQL Router

-- Key HA metrics:
-- RPO (Recovery Point Objective): max data loss acceptable (e.g., 0 seconds)
-- RTO (Recovery Time Objective): max downtime acceptable (e.g., 30 seconds)
-- Semi-sync replication: RPO near-zero, RTO ~30-60 seconds with orchestrator
-- Group Replication: RPO zero, RTO ~5-30 seconds

-- Orchestrator — topology management and automatic failover
-- Monitors replication topology
-- Performs safe failover when primary fails
-- Prevents split-brain scenarios
```

---

# SECTION 10: PERFORMANCE TUNING — SERVER LEVEL

## 10.1 InnoDB Buffer Pool

```sql
-- Buffer pool — most critical MySQL performance tuning parameter
-- Caches data pages and index pages in memory
-- Hit rate should be > 99% for good performance

SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
-- Recommended: 70-80% of available RAM for dedicated MySQL server
SET GLOBAL innodb_buffer_pool_size = 8 * 1024 * 1024 * 1024;  -- 8GB

-- Buffer pool instances — reduce contention on large buffer pools
SHOW VARIABLES LIKE 'innodb_buffer_pool_instances';
-- Recommended: 1 per GB of buffer pool, up to 64

-- Buffer pool hit rate
SELECT
    (1 - (physical_reads / (block_reads_count))) * 100 AS hit_rate_pct
FROM (
    SELECT
        sum(VARIABLE_VALUE) physical_reads
    FROM performance_schema.global_status
    WHERE VARIABLE_NAME IN ('Innodb_buffer_pool_reads')
) a
CROSS JOIN (
    SELECT
        sum(VARIABLE_VALUE) block_reads_count
    FROM performance_schema.global_status
    WHERE VARIABLE_NAME IN ('Innodb_buffer_pool_read_requests')
) b;

-- Or simpler:
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_%';
-- Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests = miss rate

-- Other critical InnoDB settings
SHOW VARIABLES LIKE 'innodb_log_file_size';
-- Redo log — larger = fewer checkpoints, better write performance
-- Recommendation: 1-4GB, or 25% of buffer pool size

SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
-- 1 (default, ACID): flush and sync on every commit — safe, slower
-- 2: flush on commit, sync every second — risk 1s data loss on crash
-- 0: sync every second — risk up to 1s data loss on crash or server restart

SHOW VARIABLES LIKE 'innodb_flush_method';
-- O_DIRECT: bypass OS page cache — recommended for dedicated DB servers

SHOW VARIABLES LIKE 'innodb_io_capacity';
-- I/O operations per second (IOPS) available — set to actual disk IOPS
-- SSD: 5000-50000, HDD: 100-200

-- Key MySQL server variables
SHOW VARIABLES LIKE 'max_connections';      -- default 151 — set based on expected concurrency
SHOW VARIABLES LIKE 'thread_stack';         -- per-thread stack size
SHOW VARIABLES LIKE 'sort_buffer_size';     -- per-session sort buffer
SHOW VARIABLES LIKE 'join_buffer_size';     -- per-join buffer
SHOW VARIABLES LIKE 'tmp_table_size';       -- max size of in-memory temp table
SHOW VARIABLES LIKE 'max_heap_table_size';  -- max size of MEMORY table

-- Connection management
SHOW STATUS LIKE 'Threads_connected';       -- current connections
SHOW STATUS LIKE 'Threads_running';         -- currently executing queries
SHOW STATUS LIKE 'Max_used_connections';    -- peak connections since start

-- Process list — see what's running
SHOW FULL PROCESSLIST;
SELECT * FROM information_schema.PROCESSLIST;
-- Kill a stuck query:
KILL QUERY 1234;   -- kill just the query
KILL CONNECTION 1234;  -- kill the connection too
```

---

## 10.2 Performance Schema and Sys Schema

```sql
-- Performance Schema — detailed instrumentation (MySQL 5.6+, fully on in 5.7+)
-- Instruments: threads, statements, waits, I/O, memory, transactions

-- Top 10 slowest queries
SELECT
    DIGEST_TEXT,
    COUNT_STAR AS exec_count,
    AVG_TIMER_WAIT / 1e12 AS avg_seconds,
    SUM_TIMER_WAIT / 1e12 AS total_seconds,
    MAX_TIMER_WAIT / 1e12 AS max_seconds,
    SUM_ROWS_EXAMINED AS rows_examined,
    SUM_ROWS_SENT AS rows_sent
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- Table I/O statistics
SELECT
    object_schema,
    object_name,
    count_read,
    count_write,
    count_fetch,
    sum_timer_wait / 1e12 AS total_wait_seconds
FROM performance_schema.table_io_waits_summary_by_table
ORDER BY sum_timer_wait DESC
LIMIT 20;

-- Memory usage by event
SELECT
    event_name,
    current_alloc,
    total_alloc
FROM sys.memory_by_host_by_current_bytes
ORDER BY current_alloc DESC;

-- Sys schema — friendly views on Performance Schema
SELECT * FROM sys.schema_unused_indexes;         -- indexes never used since restart
SELECT * FROM sys.schema_redundant_indexes;      -- duplicate/redundant indexes
SELECT * FROM sys.statements_with_full_table_scans;  -- queries doing full scans
SELECT * FROM sys.statements_with_temp_tables;   -- queries using temp tables
SELECT * FROM sys.statements_with_sorting;       -- queries using filesort
SELECT * FROM sys.user_summary;                  -- per-user statistics
SELECT * FROM sys.innodb_buffer_stats_by_table;  -- buffer pool usage per table

-- Index usage statistics (important!)
SELECT * FROM sys.schema_index_statistics
ORDER BY rows_selected DESC;

-- Unused indexes — candidates for removal
SELECT *
FROM sys.schema_unused_indexes
WHERE object_schema NOT IN ('mysql', 'performance_schema', 'sys', 'information_schema');
```

---

# SECTION 11: SECURITY

## 11.1 User Management and Privileges

```sql
-- User creation (MySQL 8.0)
CREATE USER 'app_user'@'10.0.0.%'
    IDENTIFIED BY 'strong_password_here'
    PASSWORD EXPIRE INTERVAL 90 DAY
    FAILED_LOGIN_ATTEMPTS 5
    PASSWORD_LOCK_TIME 2;  -- lock for 2 days after 5 failures

-- Authentication plugins
CREATE USER 'user'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'password';
-- caching_sha2_password: default in MySQL 8.0 — secure, fast
-- mysql_native_password: legacy, less secure (SHA-1 based)
-- auth_socket / unix_socket: OS user authentication (no password)

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'app_user'@'10.0.0.%';
GRANT SELECT ON mydb.users TO 'readonly_user'@'%';
GRANT ALL PRIVILEGES ON mydb.* TO 'admin'@'localhost';
GRANT REPLICATION SLAVE ON *.* TO 'replica'@'10.0.0.5';

-- Column-level privileges
GRANT SELECT (id, name, email) ON mydb.users TO 'limited_user'@'%';
-- Cannot see salary column

-- Principle of least privilege — app user should have only what it needs
-- Web app: SELECT, INSERT, UPDATE, DELETE on specific tables
-- Migration user: DDL privileges
-- Reporting user: SELECT only
-- Never grant: SUPER, PROCESS, FILE, SHUTDOWN to application users

-- Revoke
REVOKE INSERT ON mydb.* FROM 'app_user'@'10.0.0.%';
REVOKE ALL PRIVILEGES ON mydb.* FROM 'user'@'%';

-- Show grants
SHOW GRANTS FOR 'app_user'@'10.0.0.%';

-- Roles (MySQL 8.0+)
CREATE ROLE 'app_read', 'app_write', 'app_admin';
GRANT SELECT ON mydb.* TO 'app_read';
GRANT INSERT, UPDATE, DELETE ON mydb.* TO 'app_write';
GRANT ALL ON mydb.* TO 'app_admin';

GRANT 'app_read', 'app_write' TO 'web_user'@'%';
SET DEFAULT ROLE 'app_read', 'app_write' TO 'web_user'@'%';

-- SSL/TLS enforcement
CREATE USER 'secure_user'@'%' IDENTIFIED BY 'password' REQUIRE SSL;
-- Or require specific cipher:
-- REQUIRE X509, CIPHER 'DHE-RSA-AES256-SHA'

-- SQL injection prevention (application side)
-- NEVER: "SELECT * FROM users WHERE id = " + userId  -- injection!
-- ALWAYS: prepared statements / parameterized queries
-- In MySQL procedure, use PREPARE + EXECUTE with parameters:
SET @sql = 'SELECT * FROM users WHERE id = ?';
PREPARE stmt FROM @sql;
SET @id = 42;
EXECUTE stmt USING @id;
DEALLOCATE PREPARE stmt;

-- Audit plugin (Enterprise) or community alternatives:
-- MariaDB Audit Plugin, Percona Audit Log Plugin
-- McMySQL Audit: logs all queries to file
```

---

# SECTION 12: BACKUP AND RECOVERY

## 12.1 Backup Strategies

```bash
# Logical backup — mysqldump
mysqldump -u root -p mydb > backup.sql
mysqldump -u root -p mydb users orders > partial.sql      # specific tables
mysqldump -u root -p --all-databases > full_backup.sql
mysqldump -u root -p --single-transaction mydb > backup.sql  # InnoDB: consistent snapshot
# --single-transaction: uses START TRANSACTION to get consistent view (no lock)
# --master-data=2: includes binlog position as comment (for PITR)
# --routines: include stored procedures/functions
# --triggers: include triggers (default)
# --events: include events

# Restore
mysql -u root -p mydb < backup.sql

# Physical backup — Percona XtraBackup (hot backup, no lock)
xtrabackup --backup --target-dir=/backup/full --user=root --password=pass
xtrabackup --prepare --target-dir=/backup/full
xtrabackup --copy-back --target-dir=/backup/full

# mysqlpump (parallel dump, MySQL 5.7+)
mysqlpump -u root -p --parallel-schemas=4 mydb > backup.sql

# mydumper (parallel, community tool)
mydumper -u root -p pass -B mydb -o /backup/mydb/

# Binary log backup — for Point-In-Time Recovery (PITR)
mysqlbinlog mysql-bin.000001 > binlog.sql
mysqlbinlog mysql-bin.000001 | mysql -u root -p  # replay binlog

# PITR workflow:
# 1. Restore last full backup
# 2. Replay binlogs from that point up to desired time
mysqlbinlog --start-datetime="2023-01-15 00:00:00" \
            --stop-datetime="2023-01-15 14:30:00" \
            mysql-bin.000001 mysql-bin.000002 | mysql -u root -p
```

```sql
-- Backup table using SELECT INTO OUTFILE
SELECT * FROM users
INTO OUTFILE '/tmp/users_backup.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- Restore with LOAD DATA INFILE
LOAD DATA INFILE '/tmp/users_backup.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
-- LOAD DATA LOCAL INFILE — load from client machine (requires local_infile=ON)
```

---

# SECTION 13: JSON AND FULL-TEXT SEARCH

## 13.1 JSON Functions

```sql
-- JSON creation
SELECT JSON_OBJECT('name', 'Alice', 'age', 30);
-- {"name": "Alice", "age": 30}

SELECT JSON_ARRAY(1, 2, 3, 'four');
-- [1, 2, 3, "four"]

-- JSON extraction
SELECT data->'$.name'            FROM products;  -- "Alice" (quoted)
SELECT data->>'$.name'           FROM products;  -- Alice (unquoted)
SELECT JSON_EXTRACT(data, '$.tags[0]') FROM products;  -- first tag
SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.name')) FROM products;

-- JSON modification
UPDATE products SET data = JSON_SET(data, '$.price', 29.99);
UPDATE products SET data = JSON_INSERT(data, '$.new_field', 'value');  -- only if not exists
UPDATE products SET data = JSON_REPLACE(data, '$.price', 19.99);     -- only if exists
UPDATE products SET data = JSON_REMOVE(data, '$.old_field');

-- JSON array operations
SELECT JSON_LENGTH(tags) FROM products;             -- array length
SELECT JSON_CONTAINS(tags, '"sale"') FROM products; -- contains value?
SELECT JSON_SEARCH(tags, 'one', 'sale') FROM products;  -- find path
UPDATE products SET tags = JSON_ARRAY_APPEND(tags, '$', 'new_tag');
UPDATE products SET tags = JSON_ARRAY_INSERT(tags, '$[0]', 'first');

-- Indexing JSON values via generated column
ALTER TABLE products ADD COLUMN price_indexed DECIMAL(10,2)
    GENERATED ALWAYS AS (data->>'$.price') STORED;
CREATE INDEX idx_price ON products(price_indexed);

-- Now: WHERE data->>'$.price' > 100  -- can use index!
-- Without generated column: full table scan

-- JSON_TABLE — convert JSON array to rows (MySQL 8.0+)
SELECT *
FROM orders,
JSON_TABLE(
    order_items,
    '$[*]' COLUMNS (
        product_id INT PATH '$.product_id',
        quantity   INT PATH '$.quantity',
        price  DECIMAL(10,2) PATH '$.price'
    )
) AS items;

-- Multi-value indexes on JSON arrays (MySQL 8.0.17+)
CREATE TABLE products (
    id INT PRIMARY KEY,
    tags JSON
);
CREATE INDEX idx_tags ON products((CAST(tags AS CHAR(100) ARRAY)));
-- WHERE JSON_CONTAINS(tags, '"sale"') can now use index
-- WHERE 'sale' MEMBER OF (tags) can use index
```

---

## 13.2 Full-Text Search

```sql
-- Full-text index
CREATE TABLE articles (
    id      INT PRIMARY KEY,
    title   VARCHAR(255),
    content LONGTEXT,
    FULLTEXT INDEX ft_article (title, content)
) ENGINE=InnoDB;  -- InnoDB supports FULLTEXT since MySQL 5.6

-- Natural language mode (default)
SELECT *, MATCH(title, content) AGAINST ('mysql optimization') AS relevance
FROM articles
WHERE MATCH(title, content) AGAINST ('mysql optimization');

-- Results ranked by relevance score
-- Minimum word length: ft_min_word_len (default 4) — shorter words ignored!
-- Maximum word length: ft_max_word_len

-- Boolean mode — more control
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST (
    '+mysql -beginner performance "query optimization"'
    IN BOOLEAN MODE
);
-- +word:  must contain
-- -word:  must NOT contain
-- "phrase": exact phrase
-- word*:  wildcard suffix
-- ~word:  lower relevance
-- >word <word: higher/lower relevance in ranking

-- Query expansion mode (searches more broadly)
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST ('mysql' WITH QUERY EXPANSION);
-- First finds relevant rows, then finds related words, searches again

-- FULLTEXT limitations:
-- Minimum word length filtering (4 chars by default)
-- Stopwords (common words ignored: the, is, are, etc.)
-- No stemming in standard MySQL (elasticsearch has this)
-- Only works with char/text columns
-- InnoDB FT built differently from MyISAM (no ft_min_word_len for InnoDB, uses innodb_ft_min_token_size)

-- innodb_ft_min_token_size (default 3) — minimum token length for InnoDB FT
-- innodb_ft_stopword_table — custom stopword table

-- Elasticsearch/Sphinx are better for:
-- Complex search, faceting, stemming, multilingual search
-- Fuzzy matching, typo tolerance
-- Large-scale text search
```

---

# SECTION 14: ADVANCED MYSQL FEATURES

## 14.1 Partitioning

```sql
-- Partition types
-- RANGE: based on column range
-- LIST: based on specific column values
-- HASH: based on hash of expression (even distribution)
-- KEY: similar to HASH but uses MySQL hash function

-- RANGE partitioning (most common for time-series)
CREATE TABLE sales (
    id         INT NOT NULL AUTO_INCREMENT,
    sale_date  DATE NOT NULL,
    amount     DECIMAL(10,2),
    PRIMARY KEY (id, sale_date)  -- partition key must be in PK!
)
PARTITION BY RANGE (YEAR(sale_date)) (
    PARTITION p2021 VALUES LESS THAN (2022),
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION pmax  VALUES LESS THAN MAXVALUE
);

-- Add partition
ALTER TABLE sales ADD PARTITION (PARTITION p2024 VALUES LESS THAN (2025));

-- Drop old partition (fast! instant data removal)
ALTER TABLE sales DROP PARTITION p2021;

-- REORGANIZE PARTITION (split/merge)
ALTER TABLE sales REORGANIZE PARTITION pmax INTO (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION pmax  VALUES LESS THAN MAXVALUE
);

-- LIST partitioning
CREATE TABLE orders (
    id     INT NOT NULL,
    region VARCHAR(20) NOT NULL,
    PRIMARY KEY (id, region)
)
PARTITION BY LIST COLUMNS (region) (
    PARTITION p_us VALUES IN ('US', 'CA', 'MX'),
    PARTITION p_eu VALUES IN ('UK', 'DE', 'FR'),
    PARTITION p_asia VALUES IN ('JP', 'CN', 'KR')
);

-- HASH partitioning (even distribution, no partition pruning)
CREATE TABLE users (
    id    INT NOT NULL,
    name  VARCHAR(100),
    PRIMARY KEY (id)
)
PARTITION BY HASH(id) PARTITIONS 8;

-- Partition pruning verification
EXPLAIN SELECT * FROM sales WHERE sale_date = '2023-06-15';
-- partitions: p2023 — only one partition scanned!

-- Partition information
SELECT * FROM information_schema.PARTITIONS
WHERE table_schema = 'mydb' AND table_name = 'sales';

-- Maintenance
ALTER TABLE sales ANALYZE PARTITION p2023;
ALTER TABLE sales OPTIMIZE PARTITION p2023;
ALTER TABLE sales CHECK PARTITION ALL;
ALTER TABLE sales REPAIR PARTITION ALL;
```

---

## 14.2 Spatial Data Types

```sql
-- Geometry types
POINT, LINESTRING, POLYGON, MULTIPOINT, MULTILINESTRING, MULTIPOLYGON, GEOMETRYCOLLECTION

-- Create table with spatial column
CREATE TABLE locations (
    id       INT PRIMARY KEY,
    name     VARCHAR(100),
    location POINT NOT NULL SRID 4326,  -- SRID 4326 = WGS84 (GPS coordinates)
    area     POLYGON SRID 4326,
    SPATIAL INDEX idx_location (location)
);

-- Insert spatial data
INSERT INTO locations (name, location)
VALUES ('Office', ST_GeomFromText('POINT(-73.935242 40.730610)', 4326));

-- Spatial functions
SELECT
    name,
    ST_X(location) AS longitude,
    ST_Y(location) AS latitude,
    ST_Distance_Sphere(location, ST_GeomFromText('POINT(-73.93 40.73)', 4326)) AS distance_meters
FROM locations
ORDER BY distance_meters
LIMIT 10;

-- Find locations within radius (1km)
SELECT name
FROM locations
WHERE ST_Distance_Sphere(
    location,
    ST_GeomFromText('POINT(-73.935242 40.730610)', 4326)
) < 1000;  -- 1000 meters

-- Find locations within polygon
SELECT name
FROM locations
WHERE ST_Contains(
    ST_GeomFromText('POLYGON((-74 40.7, -73.9 40.7, -73.9 40.8, -74 40.8, -74 40.7))', 4326),
    location
);
```

---

# SECTION 15: INTERVIEW QUESTIONS AND PATTERNS BY LEVEL

## Level 1 (Junior) — Expected Knowledge

```sql
-- Q: What's the difference between WHERE and HAVING?
-- A: WHERE filters rows BEFORE grouping, HAVING filters AFTER grouping
-- WHERE cannot reference aggregate functions
-- HAVING can reference aggregate functions

-- Q: What are the different JOIN types?
-- INNER JOIN: matching rows only
-- LEFT JOIN: all from left + matching from right
-- Cross JOIN: every row with every row

-- Q: What is a primary key vs unique key?
-- PK: NOT NULL, unique, one per table, clustered index in InnoDB
-- UNIQUE: can have NULLs (multiple NULLs allowed), many per table, secondary index

-- Q: What is an index and why use it?
-- Speeds up data retrieval (B+Tree structure for InnoDB)
-- Tradeoff: faster reads, slower writes, more storage
-- Full table scan O(n) vs index O(log n)

-- Q: Difference between DELETE, TRUNCATE, DROP?
-- DELETE: DML, row-by-row, can rollback, fires triggers, slow on large tables
-- TRUNCATE: DDL, drops and recreates table, cannot rollback, fast, resets AUTO_INCREMENT
-- DROP: DDL, removes entire table structure and data

-- Q: What is NULL and how to handle it?
SELECT * FROM users WHERE email IS NULL;     -- correct
SELECT * FROM users WHERE email = NULL;      -- WRONG — always false!
SELECT COALESCE(email, 'no-email') FROM users;  -- replace NULL
SELECT IFNULL(email, 'no-email') FROM users;    -- MySQL-specific
-- NULL propagates: NULL + anything = NULL, NULL = NULL is NULL (not TRUE)

-- Q: What is AUTO_INCREMENT?
CREATE TABLE t (id INT AUTO_INCREMENT PRIMARY KEY);
INSERT INTO t VALUES ();  -- id assigned automatically
SELECT LAST_INSERT_ID();  -- get last auto-increment value
-- Note: gaps can occur (from rolled-back transactions, DELETE) — don't rely on sequential!

-- Q: Difference between CHAR and VARCHAR?
-- CHAR(n): fixed length, padded with spaces, max 255 chars, faster for fixed-length
-- VARCHAR(n): variable length, prefix stores length, max 65535 bytes, efficient for variable
```

---

## Level 2 (Mid) — Expected Knowledge

```sql
-- Q: Explain EXPLAIN output and what to look for
-- Look for: type=ALL (full scan), Using filesort, Using temporary
-- Want: type=ref or better, Using index (covering), no filesort

-- Q: What is a covering index?
-- Index that contains all columns needed by query
-- Query doesn't need to access table data rows — fastest possible index access
CREATE INDEX idx_covering ON orders(user_id, status, created_at, total_price);
SELECT status, created_at, total_price FROM orders WHERE user_id = 1;
-- "Using index" in EXPLAIN — fully covered!

-- Q: What is the N+1 problem?
-- ORM fetches parent rows, then runs N queries for each child
-- Fix: use JOIN, or SELECT ... WHERE id IN (...) to batch fetch

-- Q: Explain MVCC
-- Multi-Version Concurrency Control — each transaction sees consistent snapshot
-- Readers don't block writers, writers don't block readers
-- Implemented via undo log — old versions preserved until no longer needed

-- Q: How to paginate efficiently?
-- Bad: LIMIT 10 OFFSET 100000  (scans 100010 rows, discards 100000)
-- Good: WHERE id > last_seen_id LIMIT 10  (keyset pagination, always fast)

-- Q: What causes table locks vs row locks?
-- Table locks: MyISAM always, LOCK TABLES, ALTER TABLE, DDL
-- Row locks (InnoDB): UPDATE/DELETE with proper index
-- No index on WHERE: may lock more rows or full table!
-- Deadlock: circular lock dependency — InnoDB auto-detects and rolls back one

-- Q: What is the difference between UNION and UNION ALL?
-- UNION: removes duplicates (requires sort/hash — slower)
-- UNION ALL: keeps all rows (no dedup — faster, use when duplicates not possible)

-- Q: How do window functions differ from GROUP BY?
-- GROUP BY: collapses rows into groups (one output row per group)
-- Window functions: compute over a window but keep all rows
SELECT name, salary, AVG(salary) OVER (PARTITION BY dept) AS dept_avg FROM employees;
-- Returns all employees WITH their dept average — no row collapsing

-- Q: What is the difference between DATETIME and TIMESTAMP?
-- TIMESTAMP: stored UTC, auto-converts to server timezone, max 2038
-- DATETIME: stored as-is, no timezone conversion, max 9999
```

---

## Level 3 (Senior) — Expected Knowledge

```sql
-- Q: How does the InnoDB B+Tree index work internally?
-- B+Tree: all data in leaf nodes, internal nodes hold routing keys
-- Leaf nodes doubly-linked — efficient range scans
-- PK (clustered index): leaf nodes contain actual row data
-- Secondary indexes: leaf nodes contain PK value (then do table lookup)
-- Double lookup: secondary index → find PK → primary index → find row
-- Covering index eliminates the second lookup

-- Q: How would you design for 1 billion rows?
-- 1. Partitioning: range partition by date for time-series, easy old data removal
-- 2. Archival: move old data to archive table or cold storage
-- 3. Sharding: horizontal partition across multiple servers (application level or Vitess)
-- 4. Read replicas: scale reads
-- 5. Proper indexes: avoid full scans at all costs
-- 6. Summary/aggregate tables: precompute expensive calculations
-- 7. Column store (ClickHouse, BigQuery) for analytics workloads

-- Q: How does MySQL handle deadlocks?
-- Detection: wait-for graph analysis (cycle = deadlock)
-- Resolution: automatically roll back transaction with lowest cost (usually fewer rows locked)
-- Prevention: always access tables/rows in same order
-- Monitoring: SHOW ENGINE INNODB STATUS \G

-- Q: Explain the difference between optimistic and pessimistic locking
-- Pessimistic: lock before read (SELECT ... FOR UPDATE), blocks concurrent access
-- Optimistic: read without lock, check version on write (application-level)
-- Optimistic is better for low-contention; pessimistic for high-contention

-- Q: How do you tune a slow query?
-- 1. EXPLAIN ANALYZE — see actual execution plan
-- 2. Check for full table scans (type=ALL)
-- 3. Check rows examined vs rows returned ratio
-- 4. Add/modify indexes based on WHERE, JOIN, ORDER BY, GROUP BY columns
-- 5. Check for implicit type conversions, functions on indexed columns
-- 6. Consider query rewrite (avoid DISTINCT, EXISTS vs IN, etc.)
-- 7. Update statistics: ANALYZE TABLE
-- 8. Consider schema changes (denormalization, generated columns)
-- 9. Check server metrics: buffer pool hit rate, I/O wait

-- Q: How does replication work, and what are its failure modes?
-- Binlog-based: primary writes to binlog, replica reads and replays
-- Failures: replica lag, network partition, primary crash before semi-sync ACK
-- GTID: simplifies failover, prevents applying same transaction twice
-- Split-brain: both nodes think they're primary — prevent with proper fencing

-- Q: When would you use MySQL vs a different database?
-- MySQL good for: OLTP, web applications, known data model, transactional workloads
-- Consider Postgres: better standard compliance, JSON support, more data types, extensions
-- Consider ClickHouse: analytics, OLAP, columnar storage, massive aggregations
-- Consider Redis: caching, session, pub/sub, not primary storage
-- Consider Cassandra: massive write throughput, multi-region, no complex queries
-- Consider Elasticsearch: full-text search, log analysis
```

---

# SECTION 16: TALENT SIGNALS REFERENCE TABLE

```
LEVEL 1 — JUNIOR SIGNALS:
+ Knows all basic data types and when to use them (INT vs BIGINT, CHAR vs VARCHAR, DATETIME vs TIMESTAMP)
+ Can write SELECTs with JOINs, WHERE, GROUP BY, ORDER BY, LIMIT
+ Understands difference between WHERE and HAVING
+ Knows what an index is and basic purpose (speed up reads)
+ Understands PRIMARY KEY vs UNIQUE KEY vs INDEX
+ Can write basic INSERT, UPDATE, DELETE statements
+ Knows what a transaction is (BEGIN/COMMIT/ROLLBACK)
+ Can use aggregates: COUNT, SUM, AVG, MIN, MAX
+ Understands NULL behavior (IS NULL, COALESCE)
+ Knows INNER JOIN vs LEFT JOIN

JUNIOR RED FLAGS:
- Selects * in production queries ("it's easier")
- Doesn't know what an index is or why it matters
- Uses floating point (FLOAT/DOUBLE) for money columns
- Stores dates as VARCHAR strings
- Doesn't understand NULL propagation (NULL = NULL is not true)
- No concept of character sets (uses utf8 instead of utf8mb4)
- Writes queries without WHERE clause on UPDATE/DELETE

LEVEL 2 — MID SIGNALS:
+ Can read and interpret EXPLAIN output
+ Understands composite index column ordering (leftmost prefix rule)
+ Knows covering index and when it applies
+ Understands why functions on indexed columns kill index usage
+ Can identify N+1 query problems
+ Understands transaction isolation levels (knows InnoDB defaults to REPEATABLE READ)
+ Can write window functions (ROW_NUMBER, LAG, running totals)
+ Knows when UNION vs UNION ALL
+ Understands MVCC conceptually (readers don't block writers)
+ Can write stored procedures with error handling
+ Knows about slow query log and how to enable it
+ Can diagnose and fix basic deadlocks
+ Understands soft delete patterns and their index implications
+ Can use CTEs and recursive CTEs for hierarchical data

MID RED FLAGS:
- Uses SELECT * in JOINs
- Doesn't know about LIMIT with large OFFSET performance issue
- Can't explain why an index isn't being used
- Doesn't know difference between TRUNCATE and DELETE
- No awareness of lock contention issues
- Writes correlated subqueries without considering performance

LEVEL 3 — SENIOR SIGNALS:
+ Understands InnoDB B+Tree internals (clustered vs secondary index, double lookup)
+ Can design schemas for billions of rows (partitioning, archival, sharding considerations)
+ Understands MVCC in depth (undo log, history list, long transaction impact)
+ Designs indexes for complex queries (covering, composite with range column last)
+ Knows GC equivalent: undo log purge and why long transactions are dangerous
+ Can diagnose deadlocks using SHOW ENGINE INNODB STATUS
+ Understands buffer pool sizing and monitoring hit rates
+ Knows when to use optimistic vs pessimistic locking
+ Can reason about replication lag and its impact on applications
+ Understands ACID vs eventual consistency tradeoffs
+ Can evaluate tradeoffs: MySQL vs Postgres vs ClickHouse vs Cassandra
+ Knows performance_schema and sys schema for diagnosis
+ Can design multi-tenancy schemas (shared, schema-per-tenant, DB-per-tenant)
+ Understands foreign key locking behavior and when to remove FK constraints
+ Can argue for/against denormalization with specific tradeoff reasoning
+ Knows the 2038 TIMESTAMP problem and its implications
+ Can design zero-downtime schema migrations (Online DDL, gh-ost/pt-osc)

SENIOR RED FLAGS:
- Over-normalizes without considering query patterns
- Adds indexes to every column "just in case"
- Doesn't think about lock contention in concurrent write scenarios
- Can't explain why query plan changed after data growth
- No consideration of index maintenance overhead on write-heavy tables
- Doesn't know about connection pooling implications
- "Just add more RAM" as only answer to performance issues

STAFF/PRINCIPAL SIGNALS:
+ Designs sharding strategy with awareness of hotspot, cross-shard query limitations
+ Can reason about CAP theorem in MySQL HA setups (InnoDB Cluster vs async replication)
+ Understands semi-sync replication RPO/RTO tradeoffs at specific failure scenarios
+ Has designed multi-region MySQL setups with conflict resolution strategies
+ Can evaluate when MySQL is the wrong tool for the job with specific alternatives
+ Knows ProxySQL/MySQL Router configuration and query routing strategies
+ Can reason about GTID replication and its edge cases
+ Understands binlog as CDC source (Debezium, Maxwell) for event streaming
+ Has opinion on ORM vs query builder vs raw SQL at scale, with data to back it up
+ Can design observability strategy: what to measure, alert on, dashboard
```

---

# SECTION 17: QUICK REFERENCE — COMMON RECIPES

## Frequently Used Patterns

```sql
-- 1. Get top N per group
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC) AS rn
    FROM products
) t WHERE rn <= 5;

-- 2. Running total
SELECT date, amount,
    SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM daily_sales;

-- 3. Detect duplicate rows
SELECT email, COUNT(*) AS cnt FROM users GROUP BY email HAVING cnt > 1;

-- 4. Delete duplicates, keep one
DELETE u1 FROM users u1
    INNER JOIN users u2 ON u1.email = u2.email AND u1.id > u2.id;

-- 5. Find missing rows (gaps in sequences)
SELECT a.id + 1 AS gap_start
FROM users a
LEFT JOIN users b ON b.id = a.id + 1
WHERE b.id IS NULL;

-- 6. Pivot rows to columns
SELECT
    user_id,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM orders
GROUP BY user_id;

-- 7. Upsert (insert or update)
INSERT INTO page_views (page_id, view_date, count)
VALUES (1, CURDATE(), 1)
ON DUPLICATE KEY UPDATE count = count + 1;

-- 8. Conditional aggregation
SELECT
    COUNT(*) AS total,
    COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_count,
    SUM(CASE WHEN amount > 100 THEN amount ELSE 0 END) AS high_value_total
FROM orders;

-- 9. Find nth record
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn
    FROM employees
) t WHERE rn = 3;  -- 3rd highest salary

-- 10. Recursive hierarchy traversal (MySQL 8.0+)
WITH RECURSIVE tree AS (
    SELECT id, name, parent_id, 0 AS level FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, t.level + 1
    FROM categories c INNER JOIN tree t ON t.id = c.parent_id
)
SELECT REPEAT('  ', level), name FROM tree ORDER BY level, name;

-- 11. Safe update with row count check
UPDATE orders SET status = 'cancelled' WHERE user_id = 123 AND status = 'pending';
SELECT ROW_COUNT();  -- number of rows actually updated

-- 12. Copy table structure only
CREATE TABLE orders_backup LIKE orders;

-- 13. Copy table with data
CREATE TABLE orders_backup AS SELECT * FROM orders;
-- Note: doesn't copy indexes or constraints!

-- 14. Median calculation
SELECT AVG(salary) AS median FROM (
    SELECT salary FROM employees
    ORDER BY salary
    LIMIT 2 - (SELECT COUNT(*) FROM employees) % 2
    OFFSET (SELECT (COUNT(*) - 1) / 2 FROM employees)
) sub;

-- 15. Date-based summary with zero fill for missing dates
WITH RECURSIVE date_range AS (
    SELECT DATE('2023-01-01') AS dt
    UNION ALL
    SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM date_range WHERE dt < '2023-01-31'
)
SELECT dr.dt, COALESCE(SUM(o.total_price), 0) AS daily_revenue
FROM date_range dr
LEFT JOIN orders o ON DATE(o.created_at) = dr.dt AND o.status = 'completed'
GROUP BY dr.dt
ORDER BY dr.dt;

-- 16. Check table size
SELECT
    table_name,
    ROUND(data_length/1024/1024, 2) AS data_mb,
    ROUND(index_length/1024/1024, 2) AS index_mb,
    ROUND((data_length+index_length)/1024/1024, 2) AS total_mb,
    table_rows AS estimated_rows
FROM information_schema.TABLES
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC;

-- 17. Show all foreign keys for a table
SELECT
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 18. Kill all long-running queries
SELECT CONCAT('KILL QUERY ', ID, ';')
FROM information_schema.PROCESSLIST
WHERE COMMAND != 'Sleep'
    AND TIME > 60
    AND USER != 'replication';

-- 19. Generate series of numbers (MySQL 8.0+)
WITH RECURSIVE nums AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM nums WHERE n < 100
)
SELECT n FROM nums;

-- 20. Rank without window functions (MySQL 5.7)
SELECT
    name,
    salary,
    (SELECT COUNT(DISTINCT salary) FROM employees e2 WHERE e2.salary >= e1.salary) AS rank_val
FROM employees e1
ORDER BY salary DESC;
```

---

# SECTION 18: MYSQL VERSION HISTORY AND KEY FEATURES

```
MySQL 5.5 (2010): InnoDB as default engine, Performance Schema introduced
MySQL 5.6 (2013): Online DDL improvements, FULLTEXT for InnoDB, GTID replication,
                  Index condition pushdown (ICP), Multi-Range Read (MRR)
MySQL 5.7 (2015): JSON data type, Generated columns, Multi-source replication,
                  Group Replication (experimental), sys schema, Better optimizer,
                  Improved password security, InnoDB buffer pool online resize

MySQL 8.0 (2018): MAJOR RELEASE
  - Window functions (ROW_NUMBER, RANK, LAG, LEAD, etc.)
  - CTEs and Recursive CTEs
  - Roles and role-based access control
  - Invisible indexes
  - Descending indexes
  - Enhanced JSON (JSON_TABLE, JSON_ARRAYAGG, JSON_OBJECTAGG)
  - Atomic DDL (DDL is now transactional — all-or-nothing)
  - UTF8MB4 as default character set
  - caching_sha2_password as default auth plugin
  - Hash join (8.0.18)
  - EXPLAIN ANALYZE (8.0.18)
  - Multi-value indexes on JSON arrays (8.0.17)
  - Histogram statistics
  - Resource groups
  - Clone plugin (online backup)
  - Redo log online resize
  - INSTANT ADD COLUMN
  - SET PERSIST for config variables
  - Skip locked / NOWAIT

MySQL 8.0.x Notable:
  8.0.13: DEFAULT expressions, expressions in CHECK constraints
  8.0.17: Multi-value JSON indexes, MEMBER OF operator
  8.0.18: Hash join, EXPLAIN ANALYZE
  8.0.19: TABLE and VALUES statements
  8.0.22: Asynchronous query execution
  8.0.23: Invisible columns, GSIPB improvements
  8.0.27: Redo log sizing improvements

MySQL 8.4 (2024): LTS release
  - Simplified CHANGE REPLICATION SOURCE syntax
  - mysqlbinlog --require-row-format
  - Performance improvements
  - Removed deprecated features (mysql_native_password disabled by default!)

MySQL 9.0 (2024): Innovation release
  - JavaScript stored programs (preliminary)
  - VECTOR data type (for AI/ML embeddings)
  - Further AI/ML integration plans

KEY DEPRECATED/REMOVED:
- Query cache: removed in 8.0
- mysql_native_password: disabled by default in 8.4
- MyISAM: still exists but not recommended for new tables
- Zero dates (0000-00-00): stricter SQL modes warn/error
- GROUP BY implicit sorting: removed in 8.0
- utf8 as alias for utf8mb4: clarified (utf8 still means utf8mb3 in 8.0)
```

---

*End of MySQL RAG Knowledge Base Document*
*Total sections: 18 | Coverage: Junior through Staff | Includes: Data types, indexes, query optimization, transactions/locking, stored procedures, replication, performance tuning, security, backup, JSON, partitioning, window functions, schema design patterns, talent signals*
