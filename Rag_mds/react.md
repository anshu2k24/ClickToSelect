# REACT — FULL-SPECTRUM RAG KNOWLEDGE BASE

> Structured for AI Interviewer · Three-Level Contextual Model · Junior → Mid → Senior  
> Topics: JSX · Components · Props · State · Hooks · Context · Refs · Effects · Performance · Patterns · Routing · State Management · Testing · Architecture · Concurrent Features · TypeScript

---

# SECTION 1 · JSX & COMPONENT FUNDAMENTALS

> `[JUNIOR]` JSX syntax, rendering, component anatomy, props, lists

---

## 1.1 JSX Basics

```jsx
// JSX — syntactic sugar over React.createElement()
// This:
const element = <h1 className="title">Hello, {name}</h1>;

// Compiles to:
const element = React.createElement("h1", { className: "title" }, "Hello, ", name);

// JSX rules
// 1. One root element (or Fragment)
return (
  <div>
    <h1>Title</h1>
    <p>Paragraph</p>
  </div>
);

// 2. Fragments — avoid extra DOM nodes
return (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);
// Long form: <React.Fragment key="k">...</React.Fragment> — supports key prop

// 3. className, not class; htmlFor, not for
<label htmlFor="email" className="label">Email</label>

// 4. Self-closing tags must close
<img src={url} alt="photo" />
<input type="text" />

// 5. JavaScript expressions in {}
<p>{isLoggedIn ? "Welcome" : "Please log in"}</p>
<ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>

// 6. Conditional rendering
{isVisible && <Modal />}
{error ? <ErrorBanner message={error} /> : null}

// 7. Style — object with camelCase properties
<div style={{ backgroundColor: "blue", fontSize: 16, marginTop: "8px" }}>

// 8. Spread props
const buttonProps = { type: "button", disabled: false };
<button {...buttonProps}>Click me</button>

// 9. Children
<Container>
  <p>This is a child</p>
</Container>

// 10. Comments in JSX
{/* This is a JSX comment */}
```

---

## 1.2 Functional Components

```jsx
// Functional component — the modern standard
function Greeting({ name, age }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age >= 18 && <p>You are an adult.</p>}
    </div>
  );
}

// Arrow function variant
const Greeting = ({ name, age }) => (
  <div>
    <h1>Hello, {name}!</h1>
  </div>
);

// Default props
function Button({ label = "Click Me", variant = "primary", onClick }) {
  return <button className={`btn btn-${variant}`} onClick={onClick}>{label}</button>;
}

// Destructuring with rename and defaults
function Profile({ user: { name, avatar, bio = "No bio available" } }) {
  return (
    <div>
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{bio}</p>
    </div>
  );
}

// Component as value
const components = {
  success: SuccessAlert,
  error: ErrorAlert,
  warning: WarningAlert,
};
function Alert({ type, message }) {
  const Component = components[type];
  return <Component message={message} />;
}

// Returning null — render nothing
function ConditionalBanner({ show, message }) {
  if (!show) return null;
  return <div className="banner">{message}</div>;
}
```

---

## 1.3 Props

```jsx
// Props are read-only — NEVER mutate props
// Parent controls what data the child receives

// Passing various prop types
<Component
  string="hello"
  number={42}
  boolean={true}
  booleanShorthand          // same as boolean={true}
  array={[1, 2, 3]}
  object={{ key: "value" }}
  func={() => console.log("clicked")}
  jsxElement={<span>Inline JSX</span>}
  nullValue={null}           // renders nothing
/>

// children prop — anything between opening and closing tags
function Card({ title, children, footer }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="body">{children}</div>
      {footer && <div className="footer">{footer}</div>}
    </div>
  );
}
<Card title="My Card" footer={<button>Action</button>}>
  <p>Card content here</p>
</Card>

// Prop drilling — passing props through multiple layers (see Context for solution)
// GrandParent → Parent → Child → GrandChild (all pass userId)

// Render props — pass a function as prop that returns JSX
function DataProvider({ render, url }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetch(url).then(r => r.json()).then(setData); }, [url]);
  return render(data);
}
<DataProvider url="/api/users" render={data => data ? <UserList users={data} /> : <Spinner />} />

// Component as prop (component injection)
function Layout({ Header, Sidebar, children }) {
  return (
    <div className="layout">
      <Header />
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

---

## 1.4 Lists and Keys

```jsx
// Keys help React identify which items changed — must be unique among siblings
// Keys do NOT get passed as props — use a separate id prop if needed

// GOOD: stable, unique ID from data
const list = users.map(user => (
  <UserCard key={user.id} user={user} />
));

// BAD: index as key (causes bugs when list reorders or items are inserted/deleted)
const list = users.map((user, index) => (
  <UserCard key={index} user={user} /> // avoid
));

// OK: index as key ONLY when list is static and never reordered
const staticList = ["a", "b", "c"].map((item, i) => (
  <li key={i}>{item}</li>
));

// Filtering + mapping
const activeUsers = users
  .filter(u => u.isActive)
  .map(u => <UserRow key={u.id} user={u} />);

// Nested lists — keys unique within their own list, not globally
function CategoryList({ categories }) {
  return categories.map(cat => (
    <div key={cat.id}>
      <h3>{cat.name}</h3>
      <ul>
        {cat.items.map(item => (
          <li key={item.id}>{item.name}</li>  // key scoped to this ul
        ))}
      </ul>
    </div>
  ));
}

// Fragment with key (only long-form Fragment supports key)
function TermsTable({ terms }) {
  return (
    <dl>
      {terms.map(({ id, word, definition }) => (
        <React.Fragment key={id}>
          <dt>{word}</dt>
          <dd>{definition}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
```

---

# SECTION 2 · STATE AND LIFECYCLE

> `[JUNIOR]` useState basics, event handling  
> `[MID]` Complex state, lifting state, derived state, useReducer  
> `[SENIOR]` State co-location, state machines, Zustand/Redux patterns

---

## 2.1 useState

```jsx
import { useState } from "react";

// Primitive state
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>  {/* functional update */}
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Always use functional update when new state depends on previous state
// BUGGY: setCount(count + 1) in async code may use stale count
// CORRECT:
const increment = () => setCount(prev => prev + 1);

// Object state — must spread, not mutate
function Form() {
  const [form, setForm] = useState({ name: "", email: "", age: 0 });

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <form>
      <input value={form.name} onChange={handleChange("name")} />
      <input value={form.email} onChange={handleChange("email")} />
    </form>
  );
}

// Array state — never mutate; return new arrays
function TodoList() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) =>
    setTodos(prev => [...prev, { id: Date.now(), text, done: false }]);

  const toggleTodo = (id) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const removeTodo = (id) =>
    setTodos(prev => prev.filter(t => t.id !== id));
}

// Lazy initial state — function runs only once
const [data, setData] = useState(() => JSON.parse(localStorage.getItem("data") ?? "null"));

// Multiple state variables vs one object
// Rule: split state that changes independently; group state that always changes together
const [isLoading, setIsLoading] = useState(false);  // independent
const [error, setError] = useState(null);            // independent
const [user, setUser] = useState(null);              // independent

// vs grouping
const [position, setPosition] = useState({ x: 0, y: 0 });  // always changes together
```

---

## 2.2 useReducer

```jsx
import { useReducer } from "react";

// useReducer — for complex state logic or multiple related state values
// (state, action) => newState

const initialState = {
  todos: [],
  filter: "all",   // "all" | "active" | "completed"
  loading: false,
};

function todosReducer(state, action) {
  switch (action.type) {
    case "ADD_TODO":
      return { ...state, todos: [...state.todos, { id: Date.now(), text: action.payload, done: false }] };
    case "TOGGLE_TODO":
      return {
        ...state,
        todos: state.todos.map(t => t.id === action.payload ? { ...t, done: !t.done } : t),
      };
    case "REMOVE_TODO":
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };
    case "SET_FILTER":
      return { ...state, filter: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
      // Or: throw new Error(`Unknown action type: ${action.type}`);
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todosReducer, initialState);

  const addTodo = (text) => dispatch({ type: "ADD_TODO", payload: text });
  const toggleTodo = (id) => dispatch({ type: "TOGGLE_TODO", payload: id });
  const setFilter = (filter) => dispatch({ type: "SET_FILTER", payload: filter });

  const visibleTodos = state.todos.filter(t => {
    if (state.filter === "active") return !t.done;
    if (state.filter === "completed") return t.done;
    return true;
  });

  return (/* ... */);
}

// Lazy initialization for useReducer
function init(initialCount) {
  return { count: initialCount };
}
const [state, dispatch] = useReducer(reducer, initialCount, init);
// init(initialCount) called once to compute initial state

// When to use useReducer vs useState:
// useState:    simple values, independent state slices
// useReducer:  complex transitions, multiple related fields, next state depends on previous
//              in complex ways, when you'd write many setter functions
```

---

## 2.3 Lifting State and Derived State

```jsx
// Lifting state — move state to common ancestor when siblings need to share it
// Child A and Child B both need the same data → lift to Parent

function Parent() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <ItemList items={items} selected={selected} onSelect={setSelected} />
      <ItemDetail item={selected} />
    </>
  );
}

// Derived state — compute from existing state/props; do NOT duplicate in state
// BAD: keeping derived value in state causes sync bugs
function BadComponent({ items }) {
  const [count, setCount] = useState(items.length); // duplicated, gets stale!
  // ...
}

// GOOD: compute inline
function GoodComponent({ items }) {
  const count = items.length;              // derived — always in sync
  const completed = items.filter(i => i.done); // derived
  // ...
}

// When you think you need getDerivedStateFromProps:
// 1. Reset child state when prop changes → use key prop
// 2. Compute value from prop → derive it during render
// 3. Store previous value → use useRef pattern

// Resetting state with key prop
function ProfilePage({ userId }) {
  return <Profile key={userId} userId={userId} />;
  // When userId changes, Profile unmounts and remounts — state reset
}

// Preserving state for different content
// Using key to force re-mount when content identity changes
<ChatRoom key={roomId} roomId={roomId} />
```

---

# SECTION 3 · HOOKS

> `[JUNIOR]` useState, useEffect basics  
> `[MID]` useCallback, useMemo, useRef, useContext, custom hooks  
> `[SENIOR]` Hook internals, dependency analysis, custom hook patterns, use() hook

---

## 3.1 useEffect

```jsx
import { useEffect, useState } from "react";

// useEffect — synchronize with external systems (network, DOM, subscriptions)

// 1. No dependency array — runs after every render
useEffect(() => {
  document.title = `Count: ${count}`;
});

// 2. Empty array — runs once after mount
useEffect(() => {
  const id = analytics.init();
  return () => analytics.cleanup(id);  // cleanup on unmount
}, []);

// 3. With dependencies — runs when dependencies change
useEffect(() => {
  if (!userId) return;
  setLoading(true);
  fetch(`/api/users/${userId}`)
    .then(r => r.json())
    .then(data => { setUser(data); setLoading(false); })
    .catch(err => { setError(err); setLoading(false); });
}, [userId]);  // re-runs when userId changes

// Cleanup function — returned from effect
// Runs: before re-running effect, and on unmount
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(r => r.json())
    .then(setData)
    .catch(err => { if (err.name !== "AbortError") setError(err); });

  return () => controller.abort();  // cancel request if component unmounts/deps change
}, [url]);

// Subscriptions
useEffect(() => {
  const subscription = store.subscribe(handler);
  return () => subscription.unsubscribe();
}, [store]);

// Event listeners
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [handleResize]);

// COMMON MISTAKES:
// 1. Missing dependency — causes stale closures
useEffect(() => {
  setCount(count + 1); // count is stale if not in deps
}, []);  // BUG: count not in array

// 2. Object/function dependency causing infinite loop
const options = { page: 1 };  // new object every render
useEffect(() => { fetch(options); }, [options]);  // infinite loop!
// Fix: move object inside effect, or useMemo, or use primitives

// 3. Race condition — stale setState after unmount
useEffect(() => {
  let cancelled = false;
  fetchUser(id).then(user => {
    if (!cancelled) setUser(user);
  });
  return () => { cancelled = true; };
}, [id]);
```

---

## 3.2 useCallback and useMemo

```jsx
import { useCallback, useMemo } from "react";

/*
 * useMemo    — memoize expensive computed value
 * useCallback — memoize function reference (same as useMemo(() => fn, deps))
 *
 * Only add these when you have a MEASURED performance problem, or when:
 * - Function is a dependency of useEffect / passed to memoized child
 * - Computation is demonstrably expensive (>1ms)
 */

// useMemo — cache computed value
function ProductList({ products, searchQuery, sortOrder }) {
  const filtered = useMemo(() => {
    return products
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => sortOrder === "asc" ? a.price - b.price : b.price - a.price);
  }, [products, searchQuery, sortOrder]);

  return filtered.map(p => <ProductCard key={p.id} product={p} />);
}

// useCallback — stable function reference for memoized children
const Parent = () => {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState("light");

  // Without useCallback: new function every render → MemoChild always re-renders
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);  // stable — no deps that change

  return (
    <>
      <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>Toggle theme</button>
      <MemoChild onClick={handleClick} />  {/* won't re-render on theme change */}
    </>
  );
};

const MemoChild = React.memo(({ onClick }) => {
  console.log("MemoChild rendered");
  return <button onClick={onClick}>Click</button>;
});

// useMemo for expensive computations
const primes = useMemo(() => computePrimesUpTo(limit), [limit]);
const chartData = useMemo(() => transformRawData(rawData), [rawData]);

// ANTI-PATTERN: memoizing cheap operations
const doubled = useMemo(() => value * 2, [value]); // unnecessary — just compute inline

// When useCallback is NOT needed:
// - Passing to a non-memoized component (memo/PureComponent is what makes it useful)
// - The function is never a useEffect dependency
// - The computation is cheap and re-creating it is fine
```

---

## 3.3 useRef

```jsx
import { useRef, useEffect } from "react";

// useRef — two use cases:
// 1. Access DOM nodes
// 2. Persist mutable values across renders WITHOUT triggering re-render

// DOM access
function TextInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();  // focus on mount
  }, []);

  return <input ref={inputRef} type="text" />;
}

// Persisting mutable values — interval IDs, previous values, etc.
function Timer() {
  const [time, setTime] = useState(0);
  const intervalRef = useRef(null);

  const start = () => {
    intervalRef.current = setInterval(() => setTime(t => t + 1), 1000);
  };
  const stop = () => clearInterval(intervalRef.current);

  useEffect(() => () => clearInterval(intervalRef.current), []);  // cleanup

  return (
    <div>
      <p>{time}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}

// Storing previous value
function usePrevious(value) {
  const prevRef = useRef(undefined);
  useEffect(() => { prevRef.current = value; });  // update after render
  return prevRef.current;  // returns previous render's value
}

// Tracking if component is mounted (avoid setState after unmount)
function useIsMounted() {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  return isMounted;
}

// forwardRef — forward ref to a child's DOM node
const FancyInput = React.forwardRef(function FancyInput({ label, ...props }, ref) {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
    </div>
  );
});
// Usage:
const ref = useRef(null);
<FancyInput ref={ref} label="Email" type="email" />;
ref.current.focus();

// useImperativeHandle — expose limited API via ref
const VideoPlayer = React.forwardRef(function VideoPlayer(props, ref) {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play:  () => videoRef.current.play(),
    pause: () => videoRef.current.pause(),
    seek:  (time) => { videoRef.current.currentTime = time; },
  }));

  return <video ref={videoRef} src={props.src} />;
});
```

---

## 3.4 useContext

```jsx
import { createContext, useContext, useState, useMemo } from "react";

// createContext — create a context with default value
const ThemeContext = createContext("light");  // default value used when no Provider

// Provider — wraps tree that needs access
function App() {
  const [theme, setTheme] = useState("light");
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <Header />
      <Main />
    </ThemeContext.Provider>
  );
}

// Consumer — useContext hook
function Header() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <header className={`header-${theme}`}>
      <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>
    </header>
  );
}

// Custom hook wrapping context — preferred pattern
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth().then(u => { setUser(u); setLoading(false); });
  }, []);

  const login = useCallback(async (creds) => {
    const u = await authService.login(creds);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Context performance — every consumer re-renders when context value changes
// Optimization: split into multiple contexts by update frequency
const UserContext    = createContext(null);   // changes rarely
const SettingsContext = createContext(null);  // changes often
// Consumers of UserContext won't re-render when settings change
```

---

## 3.5 Custom Hooks

```jsx
// Custom hooks — reusable stateful logic; must start with "use"

// useFetch — generic data fetching
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data  => { if (!cancelled) { setData(data); setLoading(false); } })
      .catch(err  => { if (!cancelled && err.name !== "AbortError") { setError(err); setLoading(false); } });

    return () => { cancelled = true; controller.abort(); };
  }, [url]);

  return { data, loading, error };
}
// Usage:
const { data: user, loading, error } = useFetch(`/api/users/${id}`);

// useLocalStorage — synchronized with localStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setItem = useCallback((newValue) => {
    const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
    setValue(valueToStore);
    localStorage.setItem(key, JSON.stringify(valueToStore));
  }, [key, value]);

  return [value, setItem];
}

// useDebounce
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// useEventListener
function useEventListener(eventName, handler, element = window) {
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);

  useEffect(() => {
    if (!element?.addEventListener) return;
    const listener = (e) => handlerRef.current(e);
    element.addEventListener(eventName, listener);
    return () => element.removeEventListener(eventName, listener);
  }, [eventName, element]);
}

// useMediaQuery
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}
const isMobile = useMediaQuery("(max-width: 768px)");
```

---

## 3.6 Additional Hooks

```jsx
import { useId, useTransition, useDeferredValue, useInsertionEffect, useLayoutEffect } from "react";

// useLayoutEffect — like useEffect but fires synchronously after DOM mutation, before paint
// Use for: reading layout (getBoundingClientRect), synchronous DOM mutations
// WARNING: SSR — useLayoutEffect runs on client only (use useEffect with SSR guard)
useLayoutEffect(() => {
  const { width } = ref.current.getBoundingClientRect();
  setWidth(width);  // synchronous measurement
}, []);

// useId — generate stable unique IDs for accessibility (React 18+)
function FormField({ label }) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </>
  );
}

// useTransition — mark state updates as non-urgent (React 18+)
// Non-urgent updates can be interrupted by urgent ones (typing, clicking)
function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e) => {
    setQuery(e.target.value);                   // urgent — update input immediately
    startTransition(() => {
      setResults(expensiveSearch(e.target.value)); // non-urgent — can be deferred
    });
  };

  return (
    <>
      <input value={query} onChange={handleSearch} />
      {isPending ? <Spinner /> : <ResultsList results={results} />}
    </>
  );
}

// useDeferredValue — defer updating a part of the UI (React 18+)
// Similar to debounce but React-aware (defers when busy)
function ProductList({ searchQuery }) {
  const deferredQuery = useDeferredValue(searchQuery);
  const isStale = searchQuery !== deferredQuery;

  const filtered = useMemo(
    () => products.filter(p => p.name.includes(deferredQuery)),
    [deferredQuery]
  );

  return (
    <div style={{ opacity: isStale ? 0.7 : 1 }}>
      {filtered.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

// use() hook (React 19) — read resources (Promises, Context) inside render
// Suspense integration
import { use } from "react";

function UserProfile({ userPromise }) {
  const user = use(userPromise);  // suspends until resolved
  return <div>{user.name}</div>;
}
// Wrap in <Suspense fallback={<Spinner />}> in parent
```

---

# SECTION 4 · COMPONENT PATTERNS

> `[MID]` Composition, HOCs, render props  
> `[SENIOR]` Compound components, controlled/uncontrolled, headless UI, component API design

---

## 4.1 Composition Patterns

```jsx
// Composition over inheritance — always prefer in React

// Specialization via composition
function Dialog({ title, content, actions }) {
  return (
    <div className="dialog">
      <h2>{title}</h2>
      <div className="dialog-body">{content}</div>
      <div className="dialog-actions">{actions}</div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <Dialog
      title="Confirm"
      content={<p>{message}</p>}
      actions={
        <>
          <button onClick={onConfirm}>Yes</button>
          <button onClick={onCancel}>No</button>
        </>
      }
    />
  );
}

// Slot pattern — named children via props
function Layout({ header, sidebar, children, footer }) {
  return (
    <div className="layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}
<Layout
  header={<Navbar />}
  sidebar={<Nav />}
  footer={<Footer />}
>
  <DashboardContent />
</Layout>

// Higher Order Components (HOC) — wraps component, adds behavior
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Redirect to="/login" />;
    return <Component {...props} user={user} />;
  };
}
const ProtectedDashboard = withAuth(Dashboard);

// HOC naming convention — displayName for DevTools
AuthenticatedComponent.displayName = `withAuth(${Component.displayName ?? Component.name})`;

// HOC pitfalls:
// - Wrapping order matters
// - Refs don't pass through (need forwardRef)
// - DevTools harder to read
// Modern alternative: custom hooks that return data/behavior
function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate("/login"); }, [user, loading]);
  return { user, loading };
}
```

---

## 4.2 Compound Components

```jsx
// Compound components — share implicit state via Context
// API: <Select> <Select.Option> </Select>

const SelectContext = createContext(null);

function Select({ children, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = React.Children.toArray(children)
    .find(child => child.props.value === value);

  const ctx = useMemo(() => ({
    value, onChange, isOpen, setIsOpen,
  }), [value, onChange, isOpen]);

  return (
    <SelectContext.Provider value={ctx}>
      <div className="select" onClick={() => setIsOpen(o => !o)}>
        <span>{selectedOption?.props.children ?? "Select..."}</span>
        {isOpen && (
          <ul className="select-dropdown">{children}</ul>
        )}
      </div>
    </SelectContext.Provider>
  );
}

function Option({ value, children }) {
  const { value: selected, onChange, setIsOpen } = useContext(SelectContext);
  return (
    <li
      className={value === selected ? "selected" : ""}
      onClick={(e) => { e.stopPropagation(); onChange(value); setIsOpen(false); }}
    >
      {children}
    </li>
  );
}

Select.Option = Option;

// Usage — expressive, reads naturally
<Select value={country} onChange={setCountry}>
  <Select.Option value="us">United States</Select.Option>
  <Select.Option value="uk">United Kingdom</Select.Option>
  <Select.Option value="ca">Canada</Select.Option>
</Select>
```

---

## 4.3 Controlled vs Uncontrolled Components

```jsx
// Controlled — React controls the value; single source of truth
function ControlledInput() {
  const [value, setValue] = useState("");

  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
}
// Pros: full control, instant validation, programmatic updates
// Cons: more boilerplate, slightly more renders

// Uncontrolled — DOM controls the value; ref to read it
function UncontrolledInput() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(inputRef.current.value);  // read on demand
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="initial" />
      <button type="submit">Submit</button>
    </form>
  );
}
// Pros: less code, good for simple forms, file inputs must be uncontrolled
// Cons: harder to validate on change, harder to reset programmatically

// Hybrid — controlled with default via key reset
function ResettableForm({ onSubmit }) {
  const [key, setKey] = useState(0);
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    onSubmit(value);
    setKey(k => k + 1);  // forces re-mount, resetting uncontrolled fields
    setValue("");
  };

  return <form key={key}>{/* form fields */}</form>;
}

// File input — always uncontrolled
<input type="file" ref={fileRef} accept="image/*" />
const file = fileRef.current.files[0];
```

---

# SECTION 5 · PERFORMANCE OPTIMIZATION

> `[MID]` React.memo, code splitting, lazy loading  
> `[SENIOR]` Reconciliation internals, fiber, concurrent features, profiling

---

## 5.1 React.memo and Memoization

```jsx
// React.memo — skip re-render if props haven't changed (shallow comparison)
const ExpensiveList = React.memo(function ExpensiveList({ items, onItemClick }) {
  console.log("ExpensiveList rendered");
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onItemClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

// Custom comparison function
const MemoComponent = React.memo(
  function Component({ user, timestamp }) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id
  // Return true = same (skip render), false = different (re-render)
);

// When React.memo is NOT enough:
// - If parent re-renders with new object/array/function prop → memo fails
// - Solution: useCallback for functions, useMemo for objects/arrays

// Full memoization example
function Parent({ userId }) {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState("all");

  const { data: user } = useFetch(`/api/users/${userId}`);

  const handleSelect = useCallback((id) => {
    console.log("selected", id);
  }, []);  // stable reference

  const filteredItems = useMemo(() => {
    return user?.items?.filter(item =>
      filter === "all" || item.status === filter
    ) ?? [];
  }, [user?.items, filter]);  // stable reference

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoItemList items={filteredItems} onSelect={handleSelect} />
    </>
  );
}
// MemoItemList won't re-render when count changes (items and onSelect are stable)
```

---

## 5.2 Code Splitting and Lazy Loading

```jsx
import { lazy, Suspense } from "react";

// React.lazy — dynamic import for code splitting
const Dashboard  = lazy(() => import("./pages/Dashboard"));
const Settings   = lazy(() => import("./pages/Settings"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

// Suspense — fallback while lazy component loads
function App() {
  return (
    <Router>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/"         element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/admin"     element={<AdminPanel />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// Named exports with lazy — wrap in default export shim
const UserList = lazy(() =>
  import("./UserList").then(module => ({ default: module.UserList }))
);

// Preloading — kick off import before user navigates
const DashboardModule = import("./Dashboard"); // starts loading
const Dashboard = lazy(() => DashboardModule); // lazy reads from cache

// Conditional heavy component loading
function ConditionalHeavy({ showChart }) {
  const Chart = useMemo(() =>
    showChart ? lazy(() => import("./HeavyChart")) : null,
    [showChart]
  );

  return (
    <>
      {showChart && Chart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <Chart data={chartData} />
        </Suspense>
      )}
    </>
  );
}

// Error boundaries with Suspense (class component required for error boundaries)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    reportError(error, info.componentStack);
  }

  render() {
    if (this.state.hasError)
      return this.props.fallback ?? <div>Something went wrong.</div>;
    return this.props.children;
  }
}

<ErrorBoundary fallback={<ErrorPage />}>
  <Suspense fallback={<Spinner />}>
    <HeavyPage />
  </Suspense>
</ErrorBoundary>
```

---

## 5.3 Reconciliation and Fiber

```
React Reconciliation — how React decides what to update in the DOM

Virtual DOM:
- React maintains a lightweight in-memory tree (virtual DOM)
- On state/props change, React renders new virtual DOM
- Diff algorithm (O(n)) compares old vs new virtual DOM
- Only changed DOM nodes are updated

Fiber architecture (React 16+):
- Fiber: internal unit of work — one per component instance
- Enables:
  - Incremental rendering: split work into chunks
  - Prioritization: urgent updates (user input) before low-priority (data fetching)
  - Pause, abort, resume rendering
  - Concurrent features: Transitions, Suspense

Diffing heuristics:
1. Different element type → unmount old, mount new (discard subtree state)
   <div> → <span> means full subtree re-creates

2. Same element type → update attributes only
   <div className="a"> → <div className="b"> updates className only

3. Lists — use keys to match old/new elements
   Without keys: React updates all items when one is removed from middle
   With stable keys: React correctly adds/removes only the changed item

Render vs Commit phases:
- Render (Reconciler): pure, interruptible — builds fiber tree, calculates changes
- Commit (Renderer): synchronous, DOM mutations, layout effects, lifecycle methods

Re-render triggers:
1. setState / dispatch called
2. Context value changes
3. Parent re-renders (by default, all children re-render)
4. Force update
```

---

# SECTION 6 · STATE MANAGEMENT

> `[MID]` Context + useReducer, Zustand basics  
> `[SENIOR]` Redux Toolkit, Zustand, Jotai, Recoil — trade-offs and selection criteria

---

## 6.1 Context + useReducer (Built-in Solution)

```jsx
// Scalable built-in state management for medium apps

// store.js
const StoreContext = createContext(null);
const DispatchContext = createContext(null);

const initialState = {
  cart: { items: [], total: 0 },
  user: null,
  ui: { sidebarOpen: false, theme: "light" },
};

function rootReducer(state, action) {
  return {
    cart: cartReducer(state.cart, action),
    user: userReducer(state.user, action),
    ui: uiReducer(state.ui, action),
  };
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, initialState);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StoreContext.Provider value={state}>
        {children}
      </StoreContext.Provider>
    </DispatchContext.Provider>
  );
}

// Split state and dispatch to avoid unnecessary re-renders
export const useStore = () => useContext(StoreContext);
export const useDispatch = () => useContext(DispatchContext);

// Selector hook — components only re-render when their slice changes
export function useCart() {
  return useStore().cart;
}
```

---

## 6.2 Zustand

```jsx
import { create } from "zustand";
import { persist, devtools, subscribeWithSelector } from "zustand/middleware";

// Basic store
const useCounterStore = create((set, get) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
  reset:     () => set({ count: 0 }),
  double:    () => set({ count: get().count * 2 }),  // get() reads current state
}));

// Usage — select only what you need to minimize re-renders
function Counter() {
  const count     = useCounterStore(state => state.count);
  const increment = useCounterStore(state => state.increment);
  return <button onClick={increment}>{count}</button>;
}

// Slice pattern for complex stores
const createCartSlice = (set, get) => ({
  cart: { items: [], total: 0 },
  addItem: (item) => set(state => ({
    cart: {
      items: [...state.cart.items, item],
      total: state.cart.total + item.price,
    }
  })),
  removeItem: (id) => set(state => {
    const item = state.cart.items.find(i => i.id === id);
    return {
      cart: {
        items: state.cart.items.filter(i => i.id !== id),
        total: state.cart.total - (item?.price ?? 0),
      }
    };
  }),
});

const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
});

const useStore = create(
  devtools(
    persist(
      (...args) => ({
        ...createCartSlice(...args),
        ...createUserSlice(...args),
      }),
      { name: "app-store", partialize: (state) => ({ user: state.user }) }
    )
  )
);
```

---

## 6.3 Redux Toolkit

```jsx
import { createSlice, createAsyncThunk, configureStore } from "@reduxjs/toolkit";
import { useSelector, useDispatch } from "react-redux";

// createAsyncThunk — handles async with pending/fulfilled/rejected
export const fetchUser = createAsyncThunk(
  "users/fetchById",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.fetchUser(userId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

// createSlice — generates actions and reducer
const usersSlice = createSlice({
  name: "users",
  initialState: { entities: {}, ids: [], loading: false, error: null },

  reducers: {
    userAdded(state, action) {
      const user = action.payload;
      state.entities[user.id] = user;  // Immer: direct mutation is OK here
      state.ids.push(user.id);
    },
    userUpdated(state, action) {
      const { id, changes } = action.payload;
      Object.assign(state.entities[id], changes);
    },
    userRemoved(state, action) {
      const id = action.payload;
      delete state.entities[id];
      state.ids = state.ids.filter(i => i !== id);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload;
        state.entities[user.id] = user;
        if (!state.ids.includes(user.id)) state.ids.push(user.id);
      })
      .addCase(fetchUser.rejected,  (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message;
      });
  },
});

export const { userAdded, userUpdated, userRemoved } = usersSlice.actions;

// Selectors
export const selectUserById = (id) => (state) => state.users.entities[id];
export const selectAllUsers = (state) => state.users.ids.map(id => state.users.entities[id]);

// Store
const store = configureStore({
  reducer: { users: usersSlice.reducer, /* other slices */ },
});

// Component
function UserProfile({ userId }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUserById(userId));
  const loading = useSelector(state => state.users.loading);

  useEffect(() => { dispatch(fetchUser(userId)); }, [dispatch, userId]);

  if (loading) return <Spinner />;
  if (!user) return null;
  return <div>{user.name}</div>;
}
```

---

# SECTION 7 · ROUTING (React Router v6)

> `[MID]` Route definitions, navigation, params  
> `[SENIOR]` Data loading, loaders, actions, error boundaries, nested routes

---

## 7.1 React Router v6

```jsx
import { BrowserRouter, Routes, Route, Link, NavLink,
         useNavigate, useParams, useLocation, useSearchParams,
         Outlet, Navigate } from "react-router-dom";

// Basic routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/about"   element={<About />} />
        <Route path="/users"   element={<UserList />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/users/:id/edit" element={<EditUser />} />
        <Route path="*"        element={<NotFound />} />  {/* catch-all */}
      </Routes>
    </BrowserRouter>
  );
}

// Nested routes + Outlet
function UsersLayout() {
  return (
    <div className="users-layout">
      <aside><UserNav /></aside>
      <main><Outlet /></main>  {/* child routes render here */}
    </div>
  );
}

<Routes>
  <Route path="/users" element={<UsersLayout />}>
    <Route index element={<UserList />} />          {/* /users */}
    <Route path=":id" element={<UserDetail />} />   {/* /users/123 */}
    <Route path=":id/edit" element={<EditUser />} /> {/* /users/123/edit */}
    <Route path="new" element={<NewUser />} />       {/* /users/new */}
  </Route>
</Routes>

// Route params
function UserDetail() {
  const { id } = useParams();
  const { data: user } = useFetch(`/api/users/${id}`);
  return user ? <UserCard user={user} /> : <Spinner />;
}

// Search params (query string)
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "all";
  const page = parseInt(searchParams.get("page") ?? "1");

  const updateFilter = (cat) =>
    setSearchParams({ category: cat, page: "1" });

  return (/* ... */);
}

// Navigation
function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? "/dashboard";

  const handleLogin = async (creds) => {
    await auth.login(creds);
    navigate(from, { replace: true });  // replace = no back button to login
  };
}

// Navigation with state
navigate("/checkout", { state: { items: cart } });
const { items } = useLocation().state ?? {};

// Protected route pattern
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// NavLink — active styling
<NavLink
  to="/dashboard"
  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
>
  Dashboard
</NavLink>
```

---

# SECTION 8 · FORMS

> `[MID]` Controlled forms, validation, React Hook Form  
> `[SENIOR]` Complex form state, field arrays, schema validation, form libraries

---

## 8.1 React Hook Form

```jsx
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema validation with Zod
const schema = z.object({
  name:  z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  age:   z.number().min(18, "Must be 18+").max(120),
  role:  z.enum(["admin", "user", "guest"]),
  tags:  z.array(z.object({ value: z.string().min(1) })).min(1, "Add at least one tag"),
});

type FormData = z.infer<typeof schema>;

function UserForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", age: 18, role: "user", tags: [] },
    mode: "onChange",  // validate on change; "onBlur" | "onSubmit" | "all"
  });

  const { fields, append, remove } = useFieldArray({ control, name: "tags" });

  const watchedRole = watch("role");

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    reset();
  });

  return (
    <form onSubmit={handleFormSubmit}>
      <div>
        <input {...register("name")} placeholder="Name" />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div>
        <input {...register("email")} type="email" placeholder="Email" />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      <div>
        <input {...register("age", { valueAsNumber: true })} type="number" />
        {errors.age && <span className="error">{errors.age.message}</span>}
      </div>

      {/* Controller — for third-party UI components */}
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <Select {...field} options={["admin", "user", "guest"]} />
        )}
      />

      {/* Dynamic fields */}
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`tags.${index}.value`)} placeholder="Tag" />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ value: "" })}>Add Tag</button>
      {errors.tags && <span className="error">{errors.tags.message}</span>}

      <button type="submit" disabled={isSubmitting || !isDirty || !isValid}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

---

# SECTION 9 · TESTING

> `[MID]` React Testing Library, Jest, basic testing patterns  
> `[SENIOR]` Testing philosophy, MSW, integration tests, Playwright, testing custom hooks

---

## 9.1 React Testing Library

```jsx
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "./mocks/server"; // MSW server
import { rest } from "msw";

// Core philosophy: test behavior, not implementation
// Query priority: getByRole > getByLabelText > getByPlaceholderText > getByText > getByTestId

describe("LoginForm", () => {
  test("renders email and password fields", () => {
    render(<LoginForm onLogin={jest.fn()} />);

    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  test("shows validation errors for empty submission", async () => {
    const user = userEvent.setup();
    render(<LoginForm onLogin={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test("calls onLogin with credentials on valid submit", async () => {
    const user = userEvent.setup();
    const onLogin = jest.fn().mockResolvedValue({ token: "abc" });

    render(<LoginForm onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/email/i), "alice@test.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith({ email: "alice@test.com", password: "secret123" });
    });
  });

  test("displays error message on login failure", async () => {
    const user = userEvent.setup();
    const onLogin = jest.fn().mockRejectedValue(new Error("Invalid credentials"));

    render(<LoginForm onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/email/i), "alice@test.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid credentials/i);
  });
});

// Async queries
await screen.findByText(/loading/i);       // waitFor + getBy combined
await screen.findByRole("heading");        // good for after data loads

// Query variants
screen.getByText()     // throws if not found
screen.queryByText()   // returns null if not found (use for asserting absence)
screen.findByText()    // async, waits for element

// Mock Service Worker (MSW) — intercept real requests
server.use(
  rest.get("/api/users/:id", (req, res, ctx) => {
    return res(ctx.json({ id: req.params.id, name: "Alice" }));
  })
);

// Testing custom hooks — renderHook
import { renderHook, act } from "@testing-library/react";

test("useCounter increments", () => {
  const { result } = renderHook(() => useCounter(0));
  expect(result.current.count).toBe(0);

  act(() => { result.current.increment(); });
  expect(result.current.count).toBe(1);
});

// Custom render with providers
function renderWithProviders(ui, { preloadedState, ...options } = {}) {
  const store = configureStore({ reducer: rootReducer, preloadedState });
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <Router>{children}</Router>
        </ThemeProvider>
      </Provider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
```

---

# SECTION 10 · TYPESCRIPT WITH REACT

> `[MID]` Component typing, prop types, generics  
> `[SENIOR]` Advanced generics, discriminated unions, utility types, type narrowing

---

## 10.1 Typing React Components

```tsx
// Props interface
interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  // Extend HTML button attributes
  className?: string;
}

// Extend HTML element props — preferred for component wrappers
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

// React.FC vs explicit return type
// React.FC adds children implicitly (pre-React 18) — now discouraged
// Prefer explicit:
function Button({ label, variant = "primary", onClick }: ButtonProps): JSX.Element {
  return <button className={`btn btn-${variant}`} onClick={onClick}>{label}</button>;
}

// Generic components
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string | number;
}

function Select<T>({ options, value, onChange, getLabel, getValue }: SelectProps<T>) {
  return (
    <select
      value={value ? getValue(value).toString() : ""}
      onChange={e => {
        const selected = options.find(o => getValue(o).toString() === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {options.map(o => (
        <option key={getValue(o)} value={getValue(o)}>{getLabel(o)}</option>
      ))}
    </select>
  );
}

// Event handler types
const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
  setValue(e.target.value);
};

const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
  e.preventDefault();
};

// Discriminated union props — mutually exclusive prop sets
type AlertProps =
  | { type: "success"; message: string }
  | { type: "error"; message: string; retry?: () => void }
  | { type: "warning"; message: string; actions: React.ReactNode };

function Alert(props: AlertProps) {
  if (props.type === "error") {
    // TypeScript knows retry is available here
    return <div className="error">{props.message} {props.retry && <button onClick={props.retry}>Retry</button>}</div>;
  }
  return <div className={props.type}>{props.message}</div>;
}

// useRef types
const inputRef = useRef<HTMLInputElement>(null);     // DOM ref, initially null
const valueRef = useRef<number>(0);                  // mutable value, not null

// useState types
const [user, setUser] = useState<User | null>(null);
const [count, setCount] = useState(0);               // inferred as number

// Custom hook return type
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  // ...
}
```

---

# SECTION 11 · CONCURRENT REACT AND SUSPENSE

> `[SENIOR]` Concurrent mode, Suspense data fetching, streaming SSR, React Server Components

---

## 11.1 Suspense and Concurrent Features

```jsx
// Suspense — declarative loading states
// Component "suspends" by throwing a Promise; React catches it, shows fallback

// Data fetching with Suspense (React 18+ with compatible libraries)
// Works out of the box with: React Query, SWR, Relay, Next.js

// React Query + Suspense
import { useSuspenseQuery } from "@tanstack/react-query";

function UserProfile({ userId }) {
  // Suspends while loading — no loading state needed
  const { data: user } = useSuspenseQuery({
    queryKey: ["users", userId],
    queryFn: () => api.fetchUser(userId),
  });
  return <div>{user.name}</div>;
}

// Parent handles loading and error
function App() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Waterfall vs parallel loading
// BAD: waterfall — each suspends sequentially
function Sequential() {
  return (
    <Suspense fallback={<Spinner />}>
      <User />       {/* loads, THEN: */}
        <Posts />    {/* loads, THEN: */}
          <Comments /> {/* loads */}
    </Suspense>
  );
}

// GOOD: parallel — multiple Suspense or preload
function Parallel() {
  return (
    <>
      <Suspense fallback={<UserSkeleton />}>   <User />    </Suspense>
      <Suspense fallback={<PostsSkeleton />}>  <Posts />   </Suspense>
      <Suspense fallback={<CommentsSkeleton />}><Comments /></Suspense>
    </>
  );
}

// Transitions — keep old UI while new content loads
function TabPanel({ tab }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState(tab);

  const switchTab = (newTab) => {
    startTransition(() => setActiveTab(newTab));
  };

  return (
    <div style={{ opacity: isPending ? 0.6 : 1 }}>
      <Suspense fallback={<TabSkeleton />}>
        <TabContent tab={activeTab} />  {/* suspends on first render of new tab */}
      </Suspense>
    </div>
  );
}
```

---

## 11.2 React Server Components (RSC)

```jsx
// React Server Components (Next.js 13+ App Router)
// Server Components: render on server, no client JS, can use async/await directly
// Client Components: run on client (and server for SSR), have state/effects

// Server Component (default in App Router)
// app/users/page.tsx
async function UsersPage() {
  const users = await db.query("SELECT * FROM users");  // direct DB access!
  return (
    <main>
      <h1>Users</h1>
      {users.map(user => (
        <UserCard key={user.id} user={user} />  // UserCard can also be Server Component
      ))}
    </main>
  );
}

// Client Component — opt-in with "use client"
"use client";
import { useState } from "react";

function AddUserButton({ onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add User</button>
      {isOpen && <AddUserModal onClose={() => setIsOpen(false)} onAdd={onAdd} />}
    </>
  );
}

// Composition: Server Component renders Client Component with Server data
// Server Component
async function UserListPage() {
  const users = await fetchUsers();
  return (
    <div>
      <UserList users={users} />          {/* Server Component: no JS */}
      <AddUserButton onAdd={addUser} />   {/* Client Component: has interactivity */}
    </div>
  );
}

// Rules:
// ✓ Server Components CAN import Client Components
// ✗ Client Components CANNOT import Server Components
// ✓ Server Components CAN pass Server Components as children/props to Client Components
// ✗ Server Components CANNOT use hooks, event handlers, browser APIs
// ✓ Client Components CAN pass data down to Server Components via props... wait no
//   — once you're in Client Component tree, children are also Client unless explicitly split

// Server Actions (React 19 / Next.js App Router)
"use server";

async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  await db.users.create({ data: { name } });
  revalidatePath("/users");
}

// Client usage
<form action={createUser}>
  <input name="name" />
  <button type="submit">Create</button>
</form>
```

---

# SECTION 12 · ARCHITECTURAL PATTERNS

> `[SENIOR]` Feature-based architecture, micro-frontends, design systems

---

## 12.1 Project Structure

```
Feature-based structure (recommended for medium/large apps):
src/
├── app/                    # App-level setup (router, store, providers)
│   ├── App.tsx
│   ├── store.ts
│   └── providers.tsx
├── features/               # Feature modules — co-locate everything
│   ├── auth/
│   │   ├── components/     # AuthForm, LoginButton, etc.
│   │   ├── hooks/          # useAuth, useLogin
│   │   ├── api/            # authApi, endpoints
│   │   ├── store/          # authSlice, selectors
│   │   ├── types/          # User, Credentials
│   │   └── index.ts        # public API — only export what others need
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── products/
├── shared/                 # Truly shared code
│   ├── components/         # Button, Input, Modal, Table
│   ├── hooks/              # useDebounce, useFetch, useLocalStorage
│   ├── utils/              # formatDate, parseError
│   └── types/              # common types
├── pages/                  # Route-level components (thin shells)
│   ├── Home.tsx
│   └── Dashboard.tsx
└── assets/

// Public API pattern — features expose barrel exports
// features/auth/index.ts
export { AuthProvider, useAuth } from "./hooks/useAuth";
export { LoginForm } from "./components/LoginForm";
export type { User, AuthState } from "./types";
// Internal implementation files are NOT exported — encapsulation
```

---

## 12.2 Component API Design Principles

```jsx
/*
 * Good component API design principles:
 *
 * 1. Principle of Least Surprise — behave predictably
 * 2. Minimal surface area — expose only what's needed
 * 3. Progressive disclosure — simple by default, powerful when needed
 * 4. Composition over configuration — accept JSX over complex config objects
 */

// BAD: complex configuration object
<Table
  config={{
    columns: [{ id: "name", render: (row) => row.name, sortable: true }],
    pagination: { pageSize: 20 },
    selection: { enabled: true, mode: "multi" },
  }}
  data={users}
/>

// GOOD: compositional API
<Table data={users} onSelect={setSelected}>
  <Table.Column id="name" header="Name" sortable>
    {row => <strong>{row.name}</strong>}
  </Table.Column>
  <Table.Column id="email" header="Email" />
  <Table.Pagination pageSize={20} />
  <Table.Selection mode="multi" />
</Table>

// Headless UI pattern — behavior without styles (Radix UI, Headless UI)
// Separate logic from presentation
function Dropdown({ children, ...props }) {
  // All keyboard navigation, ARIA, state management
  // Zero styling — user brings their own
  return <DropdownPrimitive.Root {...props}>{children}</DropdownPrimitive.Root>;
}

// Inversion of control — pass behavior in, don't dictate it
// BAD: component decides what happens
function SearchInput({ onSearch }) {
  const [query, setQuery] = useState("");
  useEffect(() => { onSearch(query); }, [query, onSearch]); // decides WHEN to search
}

// GOOD: caller controls
function SearchInput({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}
// Caller decides: debounce, when to trigger search, etc.
```

---

# APPENDIX A — QUICK REFERENCE: TALENT SIGNALS BY LEVEL

---

## Junior-Level Signals

```
POSITIVE SIGNALS (Junior):
✓ Knows to use key prop in lists and that index is often wrong
✓ Never mutates state directly — always returns new objects/arrays
✓ Uses .equals()... wait, wrong language — uses === for comparisons
✓ Knows useState and useEffect; can explain the dependency array
✓ Understands the difference between props and state
✓ Lifts state to common ancestor when siblings need it
✓ Uses conditional rendering (&&, ternary) correctly
✓ Handles events via onClick={handler}, not onClick={handler()}
✓ Knows React.Fragment avoids wrapper divs

RED FLAGS (Junior):
✗ Mutates state: state.items.push(item); setState(state);
✗ Uses array index as key in dynamic lists
✗ Calls setState during render (causes infinite loop)
✗ Passes inline functions to onClick without understanding re-renders
✗ Confuses controlled and uncontrolled inputs
✗ Uses document.getElementById or direct DOM manipulation
✗ Doesn't clean up subscriptions/intervals in useEffect
✗ Misses dependencies in useEffect and gets stale closures
```

---

## Mid-Level Signals

```
POSITIVE SIGNALS (Mid):
✓ Understands when to use useCallback and useMemo (and when NOT to)
✓ Designs components with composition — avoids prop drilling via Context
✓ Writes custom hooks to encapsulate and reuse stateful logic
✓ Knows React.memo and when it actually helps
✓ Can explain the difference between useEffect and useLayoutEffect
✓ Understands controlled vs uncontrolled components trade-offs
✓ Uses useReducer for complex state logic
✓ Knows how to handle async in useEffect (cleanup, race conditions)
✓ Tests components with RTL — queries by role/label, not implementation
✓ Understands stale closure problem and how functional updates fix it

RED FLAGS (Mid):
✗ Puts everything in a single global context (performance killer)
✗ Wraps every function in useCallback "just in case"
✗ Doesn't know what React.memo actually compares (shallow equality)
✗ Fetches data in components without handling cleanup/cancellation
✗ Writes tests that query by class name or DOM structure
✗ Can't explain why useEffect with an empty array only runs once
✗ Doesn't understand why inline object props break memo
✗ Uses useEffect to sync state that could be derived
```

---

## Senior-Level Signals

```
POSITIVE SIGNALS (Senior):
✓ Explains React Fiber — render phase vs commit phase, interruptible rendering
✓ Designs component APIs for composability (slots, compound components, headless)
✓ Knows when Context causes performance problems and how to solve them
✓ Uses useTransition and useDeferredValue for concurrent UX
✓ Understands SSR, hydration mismatches, and RSC boundaries
✓ Architects feature-based folder structure — encapsulation via barrel exports
✓ Knows React reconciliation — same type update vs new type remount
✓ Designs state co-location — minimum necessary state, closest possible ancestor
✓ Evaluates state management trade-offs: Zustand vs Redux vs Context+Reducer
✓ Uses MSW for realistic API mocking in tests
✓ Understands Suspense boundaries and streaming SSR
✓ Can explain React 18 automatic batching and opt-out
✓ Knows the key prop as a reset mechanism — not just for lists

RED FLAGS (Senior):
✗ Can't explain why double rendering happens in React.StrictMode
✗ Recommends class components or lifecycle methods for new code
✗ Uses Redux for everything including local UI state
✗ Can't distinguish when a re-render is actually a problem
✗ Doesn't understand hydration — ships different server/client HTML
✗ Ignores bundle size — ships entire library for one utility function
✗ Puts business logic in components instead of hooks/services
✗ Tests implementation details — checks state values, not user-visible output
✗ Doesn't know the rendering waterfall implications of Suspense placement
✗ Overuses useEffect — uses it for state derivation and event handling
```

---

# APPENDIX B — REACT VERSION FEATURE MATRIX

| Version | Key Features |
|---------|-------------|
| **React 16** | Fiber rewrite, Error Boundaries, Portals, Fragments, `render` returning arrays/strings, `createRef` |
| **React 16.3** | New Context API (`createContext`), `getDerivedStateFromProps`, `createRef`, `forwardRef`, StrictMode |
| **React 16.6** | `React.memo`, `React.lazy`, `Suspense` for code splitting, `contextType` |
| **React 16.8** | **Hooks** — `useState`, `useEffect`, `useContext`, `useReducer`, `useCallback`, `useMemo`, `useRef`, `useImperativeHandle`, `useLayoutEffect`, `useDebugValue` |
| **React 17** | No new features for devs; new JSX transform (no import needed), event delegation on root, gradual upgrades |
| **React 18** | Concurrent rendering, automatic batching, `createRoot`, `useTransition`, `useDeferredValue`, `useId`, `useSyncExternalStore`, `useInsertionEffect`, Suspense SSR streaming, `startTransition` |
| **React 19** | `use()` hook, Server Components (stable), Server Actions, `useOptimistic`, `useFormStatus`, `useActionState`, ref as prop (no forwardRef), improved error messages, `Document Metadata` support |

---

# APPENDIX C — HOOKS QUICK REFERENCE

| Hook | Purpose | Key Notes |
|------|---------|-----------|
| `useState` | Local state | Use functional update when new state depends on old |
| `useEffect` | Sync with external systems | Return cleanup; deps must be complete |
| `useLayoutEffect` | Sync DOM measurement | Fires before paint; avoid for SSR |
| `useReducer` | Complex state logic | Prefer over useState for multiple related values |
| `useContext` | Consume context | Every context change re-renders consumer |
| `useCallback` | Memoize function | Only useful if function is dep or passed to memo'd child |
| `useMemo` | Memoize value | Only for expensive computations or referential stability |
| `useRef` | DOM access / mutable value | Changes don't trigger re-render |
| `useImperativeHandle` | Customize ref API | Use with `forwardRef` |
| `useId` | Unique IDs | Stable across server/client for accessibility |
| `useTransition` | Mark non-urgent updates | `isPending` while transitioning |
| `useDeferredValue` | Defer UI update | Like debounce but React-aware |
| `useSyncExternalStore` | Subscribe to external stores | For library authors; correct for concurrent mode |
| `useInsertionEffect` | CSS-in-JS injection | Fires before DOM mutations; library use only |
| `use` (React 19) | Read Promises/Context in render | Integrates with Suspense |

---

# APPENDIX D — PERFORMANCE CHECKLIST

```
RENDERING PERFORMANCE:
□ Is React.memo applied to expensive components with stable props?
□ Are callback props wrapped in useCallback when passed to memo'd children?
□ Are expensive computations wrapped in useMemo?
□ Are inline object/array props causing memo breakage? (move outside or memoize)
□ Is Context split into high-frequency and low-frequency contexts?
□ Are large lists virtualized? (react-window, react-virtual)
□ Is key prop stable and unique (not array index in dynamic lists)?

BUNDLE PERFORMANCE:
□ Are route-level components lazy-loaded?
□ Are heavy libraries code-split or dynamically imported?
□ Are tree-shakeable imports used? (import { x } from 'lib' vs import lib from 'lib')
□ Is bundle analyzed? (webpack-bundle-analyzer, vite rollup-plugin-visualizer)

DATA FETCHING PERFORMANCE:
□ Are requests deduplicated? (React Query, SWR)
□ Are stale requests cancelled on unmount/dep change?
□ Is data prefetched on hover/focus for likely navigation?
□ Are N+1 requests batched?

MEASUREMENT:
□ React DevTools Profiler used before optimizing
□ Are renders measured in production mode? (dev adds overhead)
□ Is Lighthouse/Web Vitals checked? (FCP, LCP, INP, CLS)
```

---

# APPENDIX E — COMMON ANTI-PATTERNS

```jsx
// 1. State mutation
const [items, setItems] = useState([]);
items.push(newItem);          // BUG: mutates state directly
setItems(items);              // React may not re-render — same reference

// FIX:
setItems(prev => [...prev, newItem]);

// 2. Derived state in useState
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => {
  setFilteredItems(items.filter(i => i.active)); // duplicated, syncs on delay
}, [items]);

// FIX: derive during render
const filteredItems = items.filter(i => i.active);

// 3. useEffect for event handling
useEffect(() => {
  if (submitted) {
    sendForm(formData);
  }
}, [submitted]); // useEffect is for synchronizing — not responding to events

// FIX: handle in event handler
const handleSubmit = () => sendForm(formData);

// 4. Object/function in deps causing infinite loop
useEffect(() => {
  fetchData({ filter });  // new object every render
}, [{ filter }]);         // new dep every render = infinite loop

// FIX: use primitive in deps
useEffect(() => { fetchData({ filter }); }, [filter]);

// 5. Missing key in list
items.map(item => <Item name={item.name} />);  // React can't track identity

// FIX:
items.map(item => <Item key={item.id} name={item.name} />);

// 6. Calling hooks conditionally
if (user) {
  const [data, setData] = useState(null);  // ILLEGAL — violates Rules of Hooks
}

// FIX: hooks always called at top level, condition inside
const [data, setData] = useState(null);
useEffect(() => { if (user) fetchData().then(setData); }, [user]);

// 7. Async useEffect without cleanup
useEffect(async () => {  // BAD: async effect, can't return cleanup
  const data = await fetchData();
  setData(data);
}, [id]);

// FIX:
useEffect(() => {
  let cancelled = false;
  fetchData().then(d => { if (!cancelled) setData(d); });
  return () => { cancelled = true; };
}, [id]);

// 8. Spreading all props onto DOM elements
function Button({ loading, variant, ...rest }) {
  return <button loading={loading} {...rest}>...</button>;  // loading is non-standard HTML attr
}
// FIX: don't pass non-DOM props to DOM elements
function Button({ loading, variant, ...rest }) {
  return <button {...rest} disabled={loading}>{loading ? "..." : rest.children}</button>;
}
```

---

# APPENDIX F — INTERVIEW CODING PATTERNS

```jsx
// Implement a debounced search
function SearchBox({ onSearch }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => { onSearch(debouncedQuery); }, [debouncedQuery, onSearch]);

  return <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." />;
}

// Implement a generic data table with sorting
function DataTable({ columns, data }) {
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const sorted = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const val = (a[sortConfig.key] < b[sortConfig.key]) ? -1 : 1;
      return sortConfig.dir === "asc" ? val : -val;
    });
  }, [data, sortConfig]);

  const requestSort = useCallback((key) => {
    setSortConfig(prev =>
      prev.key === key && prev.dir === "asc"
        ? { key, dir: "desc" }
        : { key, dir: "asc" }
    );
  }, []);

  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} onClick={() => requestSort(col.key)} style={{ cursor: "pointer" }}>
              {col.label} {sortConfig.key === col.key ? (sortConfig.dir === "asc" ? "↑" : "↓") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => (
          <tr key={row.id ?? i}>
            {columns.map(col => <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Implement infinite scroll
function InfiniteList({ fetchPage }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) setPage(p => p + 1); },
      { threshold: 0.5 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    setLoading(true);
    fetchPage(page).then(({ data, hasMore: more }) => {
      setItems(prev => [...prev, ...data]);
      setHasMore(more);
      setLoading(false);
    });
  }, [page, fetchPage]);

  return (
    <div>
      {items.map(item => <ItemCard key={item.id} item={item} />)}
      {loading && <Spinner />}
      <div ref={sentinelRef} />
    </div>
  );
}

// Implement a modal with portal
function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal aria-labelledby="modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 id="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
```

---

*END OF REACT RAG KNOWLEDGE BASE DOCUMENT*