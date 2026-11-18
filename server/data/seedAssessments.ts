import { Assessment, type DifficultyLevel, type SkillCategory, type SkillName } from '../models/Assessment.ts';
import { Question, type ITestCase } from '../models/Question.ts';

interface SeedQuestion {
  type: 'mcq' | 'coding';
  prompt: string;
  codeSnippet?: string;
  options?: string[];
  correctOptionIndex?: number;
  starterCode?: string;
  functionName?: string;
  language?: 'javascript' | 'python' | 'sql' | 'pseudocode';
  testCases?: ITestCase[];
  rubricKeywords?: string[];
  explanation: string;
  points: number;
}

interface SeedAssessment {
  slug: string;
  title: string;
  skill: SkillName;
  category: SkillCategory;
  difficulty: DifficultyLevel;
  description: string;
  durationMinutes: number;
  passingScore: number;
  topics: string[];
  questions: SeedQuestion[];
}

export const SEED_ASSESSMENTS: SeedAssessment[] = [
  {
    slug: 'javascript-fundamentals-beginner',
    title: 'JavaScript Core Foundations',
    skill: 'JavaScript',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    description:
      'Evaluates execution context, lexical scoping, array transformations, truthiness, and basic data manipulation in ES2022.',
    durationMinutes: 15,
    passingScore: 65,
    topics: ['Scope & Hoisting', 'Array Methods', 'Type Coercion', 'Object Grouping'],
    questions: [
      {
        type: 'mcq',
        prompt: 'What does the following JavaScript snippet log to the console?',
        codeSnippet: `let count = 1;\nfunction increment() {\n  let count = 10;\n  return count + 1;\n}\nconsole.log(increment(), count);`,
        options: ['11 11', '11 1', '2 10', 'ReferenceError'],
        correctOptionIndex: 1,
        explanation:
          '`let` is block-scoped. The inner `count` shadows the outer `count` inside `increment()`, leaving the outer `count` unchanged at `1`.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt:
          'Which Array method returns a new array containing only elements that pass a predicate without mutating the original array?',
        options: ['Array.prototype.splice()', 'Array.prototype.filter()', 'Array.prototype.forEach()', 'Array.prototype.sort()'],
        correctOptionIndex: 1,
        explanation:
          '`filter()` creates a shallow copy containing elements where the callback returns truthy. `splice()` and `sort()` mutate in place.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'What is the result of `Boolean([])` and `[] == false` respectively in JavaScript?',
        options: ['false, true', 'true, false', 'true, true', 'false, false'],
        correctOptionIndex: 2,
        explanation:
          'All objects (including empty arrays) are truthy in `Boolean([])`. Under abstract equality (`==`), `[]` converts to `""`, which coerces to `0`, matching `false` (`0`).',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'Why is `const` preferred over `var` for function-scoped immutability of bindings?',
        options: [
          'const makes nested object properties deeply immutable',
          'const prevents reassignment of the binding and respects block scope',
          'const executes faster during V8 JIT compilation only',
          'var throws a SyntaxError inside async functions',
        ],
        correctOptionIndex: 1,
        explanation:
          '`const` is block-scoped and prevents rebinding the identifier, though object properties remain mutable unless frozen.',
        points: 15,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'summarizeScores',
        prompt:
          'Write a function `summarizeScores(records)` that accepts an array of `{ category: string, score: number }` objects and returns an object mapping each category to its rounded integer average score. Return `{}` for an empty array.',
        starterCode: `function summarizeScores(records) {\n  // Return an object mapping each category to its rounded average score\n  \n}`,
        testCases: [
          {
            input: [[{ category: 'js', score: 80 }, { category: 'js', score: 90 }, { category: 'db', score: 70 }]],
            expected: { js: 85, db: 70 },
            description: 'Computes rounded averages across multiple categories',
          },
          {
            input: [[{ category: 'react', score: 81 }, { category: 'react', score: 82 }]],
            expected: { react: 82 },
            description: 'Rounds fractional averages to nearest integer',
          },
          {
            input: [[]],
            expected: {},
            description: 'Handles empty input array',
          },
        ],
        explanation:
          'Accumulate sum and count per category in a map, then compute `Math.round(sum / count)` for each key.',
        points: 40,
      },
    ],
  },
  {
    slug: 'javascript-async-closures-intermediate',
    title: 'Asynchronous JavaScript & Closures',
    skill: 'JavaScript',
    category: 'Programming Fundamentals',
    difficulty: 'Intermediate',
    description:
      'Tests event loop microtask ordering, closure memory retention, promise combinators, and functional composition.',
    durationMinutes: 20,
    passingScore: 70,
    topics: ['Event Loop', 'Closures', 'Memoization', 'Promises'],
    questions: [
      {
        type: 'mcq',
        prompt: 'In what order are the console messages printed?',
        codeSnippet: `console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');`,
        options: ['A, B, C, D', 'A, D, B, C', 'A, D, C, B', 'A, C, D, B'],
        correctOptionIndex: 2,
        explanation:
          'Synchronous code (`A`, `D`) runs first, followed by the microtask queue (`Promise.then` -> `C`), and then the macrotask queue (`setTimeout` -> `B`).',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'Which statement accurately describes a JavaScript closure?',
        options: [
          'A function bundled with references to its lexical environment even after the outer function returns',
          'A class method bound exclusively with `Function.prototype.call`',
          'An isolated sandbox thread spawned by Web Workers',
          'A syntax pattern that forces garbage collection of local variables',
        ],
        correctOptionIndex: 0,
        explanation:
          'Closures capture bindings from their lexical scope so inner functions retain access after outer execution completes.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt:
          'How does `Promise.allSettled(promises)` differ from `Promise.all(promises)`?',
        options: [
          'Promise.allSettled short-circuits on the first rejection',
          'Promise.allSettled waits for all promises and resolves with status objects for both fulfilled and rejected outcomes',
          'Promise.allSettled executes promises sequentially rather than concurrently',
          'Promise.allSettled ignores fulfilled values and returns only errors',
        ],
        correctOptionIndex: 1,
        explanation:
          '`Promise.all` rejects immediately upon any single rejection, whereas `Promise.allSettled` resolves after every promise settles with `{ status, value | reason }`.',
        points: 15,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'flattenUnique',
        prompt:
          'Write a function `flattenUnique(nested)` that recursively flattens an arbitrarily nested array of numbers and returns a sorted ascending array of unique numbers.',
        starterCode: `function flattenUnique(nested) {\n  // Flatten nested arrays, deduplicate, and sort ascending\n  \n}`,
        testCases: [
          {
            input: [[[3, [1, 2]], [2, [4, [1, 5]]]]],
            expected: [1, 2, 3, 4, 5],
            description: 'Flattens deep nested arrays, deduplicates, and sorts ascending',
          },
          {
            input: [[[10, -2, 10], [-2, 0]]],
            expected: [-2, 0, 10],
            description: 'Handles negative numbers and duplicates correctly',
          },
          {
            input: [[[]]],
            expected: [],
            description: 'Returns empty array for empty nested input',
          },
        ],
        explanation:
          'Use `nested.flat(Infinity)` or recursion combined with `new Set(...)` and numeric sort `(a, b) => a - b`.',
        points: 25,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'createRateCounter',
        prompt:
          'Write a function `createRateCounter(limit)` that returns a function `hit(key)`. Each call to `hit(key)` increments the count for `key` and returns `true` if the count is `<= limit`, or `false` once it exceeds `limit`.',
        starterCode: `function createRateCounter(limit) {\n  // Return a closure function hit(key) enforcing per-key limit\n  \n}`,
        testCases: [
          {
            input: [2],
            expected: true,
            description: 'First verification check via harness wrapper',
          },
        ],
        explanation:
          'Store a `Map<string, number>` inside `createRateCounter` and increment per key inside the returned closure.',
        points: 30,
      },
    ],
  },
  {
    slug: 'javascript-systems-advanced',
    title: 'Advanced JavaScript Internals & Patterns',
    skill: 'JavaScript',
    category: 'Programming Fundamentals',
    difficulty: 'Advanced',
    description:
      'Challenges mastery of prototype chains, WeakMap caching, deep cloning with cycle handling, and deterministic concurrency.',
    durationMinutes: 25,
    passingScore: 70,
    topics: ['Prototypes', 'WeakMap', 'Deep Cloning', 'Concurrency Control'],
    questions: [
      {
        type: 'mcq',
        prompt: 'Why is `WeakMap` ideal for associating private metadata with DOM nodes or object instances?',
        options: [
          'WeakMap keys are iterable via Object.keys()',
          'WeakMap holds weak references to object keys, preventing memory leaks when objects are garbage-collected',
          'WeakMap serializes automatically to JSON',
          'WeakMap supports primitive string keys with O(1) hashing',
        ],
        correctOptionIndex: 1,
        explanation:
          'WeakMap does not prevent garbage collection of its object keys once no other references exist.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'What happens when `Object.create(null)` is used to build a lookup dictionary?',
        options: [
          'It throws a TypeError in strict mode',
          'It creates an object with no prototype chain, avoiding collisions with `toString` or `__proto__`',
          'It creates a frozen object whose properties cannot be added',
          'It inherits directly from `Map.prototype`',
        ],
        correctOptionIndex: 1,
        explanation:
          'Prototype-less objects avoid prototype pollution and inherited property lookups.',
        points: 20,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'deepCloneSafe',
        prompt:
          'Implement `deepCloneSafe(value)` that deeply clones plain objects and arrays (preserving primitives, Dates, and Arrays) while safely handling circular references without stack overflow.',
        starterCode: `function deepCloneSafe(value, seen = new WeakMap()) {\n  // Deep clone objects/arrays/Dates and handle circular references\n  \n}`,
        testCases: [
          {
            input: [{ a: 1, b: { c: [2, 3] } }],
            expected: { a: 1, b: { c: [2, 3] } },
            description: 'Clones nested plain objects and arrays',
          },
          {
            input: [[1, { x: 2 }, [3]]],
            expected: [1, { x: 2 }, [3]],
            description: 'Clones nested array structures',
          },
          {
            input: [null],
            expected: null,
            description: 'Preserves null primitive safely',
          },
        ],
        explanation:
          'Use a `WeakMap` to memoize visited object references before recursing into properties or array items.',
        points: 60,
      },
    ],
  },
  {
    slug: 'react-components-beginner',
    title: 'React Component Architecture & State',
    skill: 'React',
    category: 'Frontend Development',
    difficulty: 'Beginner',
    description:
      'Covers JSX reconciliation, props vs state, controlled inputs, key stability, and immutable state updates.',
    durationMinutes: 15,
    passingScore: 65,
    topics: ['JSX & Reconciliation', 'useState', 'List Keys', 'Controlled Inputs'],
    questions: [
      {
        type: 'mcq',
        prompt: 'Why should array indices generally NOT be used as React `key` props in dynamic lists?',
        options: [
          'React throws a runtime error whenever an integer key is passed',
          'Reordering, inserting, or deleting items changes indices, causing React to misassociate component state and DOM nodes',
          'Array indices disable CSS Flexbox layout inside list containers',
          'Keys must be globally unique UUIDs across the entire application',
        ],
        correctOptionIndex: 1,
        explanation:
          'Keys identify element identity across renders. Changing index keys corrupts local state and degrades reconciliation.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'When updating state based on the previous state value in React, which pattern is safest?',
        options: [
          'setCount(count + 1); setCount(count + 1);',
          'setCount((prev) => prev + 1);',
          'state.count += 1; setCount(state.count);',
          'useEffect(() => setCount(count + 1))',
        ],
        correctOptionIndex: 1,
        explanation:
          'Functional updater callbacks receive the latest queued state, preventing stale closures during batched updates.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'What characterizes a controlled form input in React?',
        options: [
          'Its value is managed solely by the browser DOM and read via `ref.current.value`',
          'Its value is driven by React state and updated via an `onChange` handler',
          'It bypasses synthetic events using `addEventListener`',
          'It automatically persists values to localStorage',
        ],
        correctOptionIndex: 1,
        explanation:
          'Controlled inputs maintain a single source of truth in React component state.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'What happens if you mutate an array in React state directly via `items.push(newItem); setItems(items);`?',
        options: [
          'React re-renders immediately with the new item',
          'React compares object references via `Object.is` and skips re-rendering because the reference did not change',
          'React throws a MutateStateException',
          'React performs a deep equality scan on every render',
        ],
        correctOptionIndex: 1,
        explanation:
          'State setters use `Object.is` reference equality; always pass a new array/object reference.',
        points: 15,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'toggleTaskReducer',
        prompt:
          'Implement an immutable Redux/React `useReducer` handler `toggleTaskReducer(state, action)` supporting `{ type: "ADD", title }`, `{ type: "TOGGLE", id }`, and `{ type: "REMOVE", id }` on an array of `{ id: number, title: string, done: boolean }`. For `"ADD"`, assign `id = state.length ? Math.max(...state.map(t => t.id)) + 1 : 1` and `done: false`.',
        starterCode: `function toggleTaskReducer(state, action) {\n  // Return new state array immutably based on action.type\n  \n}`,
        testCases: [
          {
            input: [[{ id: 1, title: 'Setup', done: false }], { type: 'TOGGLE', id: 1 }],
            expected: [{ id: 1, title: 'Setup', done: true }],
            description: 'Toggles task completion immutably',
          },
          {
            input: [[{ id: 1, title: 'Setup', done: false }], { type: 'ADD', title: 'Test' }],
            expected: [{ id: 1, title: 'Setup', done: false }, { id: 2, title: 'Test', done: false }],
            description: 'Appends new task with incremented ID',
          },
          {
            input: [[{ id: 1, title: 'Setup', done: false }, { id: 2, title: 'Test', done: false }], { type: 'REMOVE', id: 1 }],
            expected: [{ id: 2, title: 'Test', done: false }],
            description: 'Removes matching task by ID',
          },
        ],
        explanation:
          'Use `switch (action.type)` returning new array references via spread, `.map()`, and `.filter()`.',
        points: 40,
      },
    ],
  },
  {
    slug: 'react-hooks-performance-intermediate',
    title: 'React Hooks, Effects & Render Performance',
    skill: 'React',
    category: 'Frontend Development',
    difficulty: 'Intermediate',
    description:
      'Assesses effect cleanup, stale closures, memoization trade-offs, and derived state optimization in React applications.',
    durationMinutes: 20,
    passingScore: 70,
    topics: ['useEffect Cleanup', 'Stale Closures', 'useMemo / useCallback', 'Derived State'],
    questions: [
      {
        type: 'mcq',
        prompt: 'When should a `useEffect` hook return a cleanup function?',
        options: [
          'Only when the component unmounts once on page close',
          'Whenever the effect sets up subscriptions, timers, event listeners, or abortable fetches to prevent leaks across re-runs',
          'Every time `useState` is declared in the same component',
          'Only inside class components',
        ],
        correctOptionIndex: 1,
        explanation:
          'Cleanup runs before the next effect execution and on unmount, cancelling stale requests or listeners.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'Which scenario does NOT benefit from storing data in `useState`?',
        options: [
          'Form field text edited by the user',
          'Filtered items computed directly from `items` and `searchQuery` props/state',
          'Modal open/close toggle state',
          'Server response pagination cursor',
        ],
        correctOptionIndex: 1,
        explanation:
          'Deriving filtered data during render (or via `useMemo` if expensive) prevents synchronized state drift.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'Why can `useCallback` hurt readability without improving speed if overused?',
        options: [
          'It freezes all component props',
          'It allocates closure/dependency arrays on every render and only helps when passed to memoized children (`React.memo`) or effect dependencies',
          'It prevents React 19 concurrent rendering',
          'It causes infinite render loops automatically',
        ],
        correctOptionIndex: 1,
        explanation:
          'Without referential-equality consumers (`React.memo` or effect deps), `useCallback` adds overhead without skipping work.',
        points: 20,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'selectPaginatedItems',
        prompt:
          'Write a pure React selector helper `selectPaginatedItems(items, query, page, pageSize)` that filters `{ name: string, category: string }[]` case-insensitively by `query` matching `name` or `category`, and returns `{ items: filteredSlice, total: filteredCount, totalPages }`. Clamp `totalPages` to at least `1`.',
        starterCode: `function selectPaginatedItems(items, query, page, pageSize) {\n  // Filter case-insensitively and slice requested page\n  \n}`,
        testCases: [
          {
            input: [
              [
                { name: 'Button', category: 'UI' },
                { name: 'Table', category: 'Data' },
                { name: 'Badge', category: 'UI' },
              ],
              'ui',
              1,
              1,
            ],
            expected: {
              items: [{ name: 'Button', category: 'UI' }],
              total: 2,
              totalPages: 2,
            },
            description: 'Filters case-insensitively and slices page 1',
          },
          {
            input: [[{ name: 'Chart', category: 'Viz' }], 'xyz', 1, 5],
            expected: { items: [], total: 0, totalPages: 1 },
            description: 'Returns totalPages >= 1 when filtered set is empty',
          },
        ],
        explanation:
          'Filter with `.toLowerCase().includes(q)`, compute `totalPages = Math.max(1, Math.ceil(total / pageSize))`, and slice `(page - 1) * pageSize`.',
        points: 40,
      },
    ],
  },
  {
    slug: 'nodejs-runtime-beginner',
    title: 'Node.js Runtime & Asynchronous I/O',
    skill: 'Node.js',
    category: 'Backend Development',
    difficulty: 'Beginner',
    description:
      'Evaluates Node.js non-blocking I/O, module resolution, error-first patterns, Buffers, and async control flow.',
    durationMinutes: 15,
    passingScore: 65,
    topics: ['Non-blocking I/O', 'Streams & Buffers', 'ESM vs CJS', 'Error Handling'],
    questions: [
      {
        type: 'mcq',
        prompt: 'Why can a single Node.js process handle thousands of concurrent HTTP connections efficiently?',
        options: [
          'It spawns a new OS kernel thread for every incoming HTTP request',
          'It delegates network/file I/O to libuv and processes callbacks asynchronously on an event loop',
          'It compiles JavaScript directly to machine code ahead of time',
          'It disables TCP handshakes on persistent sockets',
        ],
        correctOptionIndex: 1,
        explanation:
          'Node.js uses libuv’s non-blocking event loop and OS async primitives (epoll/kqueue) so I/O wait does not block the main thread.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'What happens if a synchronous CPU-heavy `while` loop runs for 5 seconds inside an Express route handler?',
        options: [
          'Only that single user request slows down while others proceed normally',
          'The event loop blocks, stalling all other incoming requests on that Node process',
          'Node automatically moves the loop into a Worker Thread',
          'Express cancels the request after 100ms',
        ],
        correctOptionIndex: 1,
        explanation:
          'JavaScript execution on the main thread is single-threaded; long synchronous loops block the entire event loop.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'Which mechanism is best suited for reading a 4GB log file in Node.js without exhausting RAM?',
        options: [
          '`fs.readFileSync()`',
          '`fs.promises.readFile()`',
          '`fs.createReadStream()` piped into a Transform/Writable stream',
          '`JSON.parse()` on the file descriptor',
        ],
        correctOptionIndex: 2,
        explanation:
          'Streams process data incrementally in bounded chunks with backpressure support.',
        points: 15,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'parseNdjsonLines',
        prompt:
          'Write a Node stream chunk helper `parseNdjsonLines(chunks)` that accepts an array of UTF-8 string chunks (where a JSON line may be split across two chunks!) and returns an array of parsed JSON objects, ignoring empty lines.',
        starterCode: `function parseNdjsonLines(chunks) {\n  // Reassemble split chunks by newline and JSON.parse complete lines\n  \n}`,
        testCases: [
          {
            input: [['{"id":1}\n{"id":', '2}\n\n{"id":3}']],
            expected: [{ id: 1 }, { id: 2 }, { id: 3 }],
            description: 'Reassembles JSON lines split across stream chunks',
          },
          {
            input: [['']],
            expected: [],
            description: 'Returns empty array for empty chunks',
          },
        ],
        explanation:
          'Join or buffer incomplete trailing text between chunks, split on `\\n`, and parse non-empty lines.',
        points: 55,
      },
    ],
  },
  {
    slug: 'express-api-middleware-intermediate',
    title: 'Express.js Routing, Middleware & Security',
    skill: 'Express.js',
    category: 'Backend Development',
    difficulty: 'Intermediate',
    description:
      'Tests Express middleware execution order, centralized error propagation, JWT auth guards, and REST status semantics.',
    durationMinutes: 20,
    passingScore: 70,
    topics: ['Middleware Pipeline', 'Error Handling', 'REST Semantics', 'Security'],
    questions: [
      {
        type: 'mcq',
        prompt: 'How does Express recognize an error-handling middleware function?',
        options: [
          'By naming the function `errorHandler`',
          'By declaring exactly 4 parameters: `(err, req, res, next)`',
          'By registering it before `express.json()`',
          'By returning a rejected Promise from `app.use()`',
        ],
        correctOptionIndex: 1,
        explanation:
          'Express inspects `fn.length === 4` (`(err, req, res, next)`) to route errors passed via `next(err)`.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'Why should `GET /api/assessments/history` be registered BEFORE `GET /api/assessments/:id` in Express?',
        options: [
          'Express routes execute in reverse order',
          'Otherwise `:id` matches the literal string `"history"` and invokes the wrong handler',
          'Parametric routes only accept POST requests',
          'Router middleware strips static segments',
        ],
        correctOptionIndex: 1,
        explanation:
          'Express matches routes top-to-bottom; static paths must precede wildcard parameter routes like `/:id`.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'Which HTTP status code is most appropriate when an authenticated user lacks permission for another user’s resource?',
        options: ['401 Unauthorized', '403 Forbidden', '400 Bad Request', '422 Unprocessable Entity'],
        correctOptionIndex: 1,
        explanation:
          '401 means missing/invalid authentication; 403 means the identity is authenticated but lacks authorization.',
        points: 15,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'runMiddlewareChain',
        prompt:
          'Implement `runMiddlewareChain(middlewares, initialReq)` that simulates Express middleware execution: each middleware `(req, res, next)` may mutate `req`, set `res.status`/`res.body`, or call `next(err)`. Stop immediately if `res.sent` becomes `true` or `next(err)` is called (in which case return `{ status: 500, error: err.message }`). Otherwise return `{ status: res.status || 200, body: res.body ?? null, req }`.',
        starterCode: `function runMiddlewareChain(middlewares, initialReq) {\n  // Simulate synchronous Express middleware pipeline with error short-circuiting\n  \n}`,
        testCases: [
          {
            input: ['sequence-harness'],
            expected: { status: 200, body: { ok: 'ada' }, req: { user: 'ada' } },
            description: 'Executes middleware sequence and returns response',
          },
          {
            input: ['error-harness'],
            expected: { status: 500, error: 'Invalid token' },
            description: 'Short-circuits pipeline when next(err) is invoked',
          },
        ],
        explanation:
          'Maintain an index cursor invoking `middlewares[i](req, res, next)` while checking `res.sent` and `err`.',
        points: 55,
      },
    ],
  },
  {
    slug: 'mongodb-data-modeling-beginner',
    title: 'MongoDB CRUD, Indexing & Data Modeling',
    skill: 'MongoDB',
    category: 'Database Management',
    difficulty: 'Beginner',
    description:
      'Covers document embedding vs referencing, compound B-tree indexes, query operators, and Mongoose schema design.',
    durationMinutes: 15,
    passingScore: 65,
    topics: ['Document Modeling', 'Indexes', 'Query Operators', 'Aggregation'],
    questions: [
      {
        type: 'mcq',
        prompt: 'In MongoDB, when is embedding subdocuments inside a parent document generally preferred over referencing?',
        options: [
          'When subdocuments grow unboundedly to millions of items',
          'When the relationship is bounded (e.g., answers in a single quiz attempt) and always read together with the parent',
          'When multiple unrelated collections need foreign-key cascades',
          'When you want to exceed the 16MB BSON document limit',
        ],
        correctOptionIndex: 1,
        explanation:
          'Embedding bounded, co-accessed data enables single-read locality without `$lookup` joins.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'Given a compound index `{ userId: 1, completedAt: -1 }`, which query can efficiently use the index prefix?',
        options: [
          '`db.attempts.find({ completedAt: { $gte: date } })`',
          '`db.attempts.find({ userId: id }).sort({ completedAt: -1 })`',
          '`db.attempts.find({ skill: "React" })`',
          '`db.attempts.find({ $text: { $search: "react" } })`',
        ],
        correctOptionIndex: 1,
        explanation:
          'MongoDB compound indexes follow the Equality-Sort-Range rule and index prefix order (`userId`, then `completedAt`).',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'Why should `lean()` be used in Mongoose read-only API endpoints?',
        options: [
          'It encrypts documents at rest',
          'It returns plain JavaScript objects instead of full Mongoose hydrated documents, reducing memory and CPU overhead',
          'It disables schema indexes during queries',
          'It automatically caches results in Redis',
        ],
        correctOptionIndex: 1,
        explanation:
          '`.lean()` skips Mongoose change tracking, getters, and document hydration for faster read paths.',
        points: 15,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'aggregateSkillAverages',
        prompt:
          'Simulate a MongoDB `$group` + `$sort` aggregation pipeline in JS: given an array of attempt documents `{ skill: string, percentageScore: number, status: string }`, filter `status === "completed"`, group by `skill` computing `{ skill, avgScore, attempts }` (rounded integer `avgScore`), and sort descending by `avgScore` (tie-break alphabetically by `skill`).',
        starterCode: `function aggregateSkillAverages(docs) {\n  // Filter completed, group by skill, compute avgScore & attempts, sort desc\n  \n}`,
        testCases: [
          {
            input: [
              [
                { skill: 'MongoDB', percentageScore: 80, status: 'completed' },
                { skill: 'MongoDB', percentageScore: 90, status: 'completed' },
                { skill: 'React', percentageScore: 70, status: 'in_progress' },
                { skill: 'Node.js', percentageScore: 92, status: 'completed' },
              ],
            ],
            expected: [
              { skill: 'Node.js', avgScore: 92, attempts: 1 },
              { skill: 'MongoDB', avgScore: 85, attempts: 2 },
            ],
            description: 'Matches MongoDB $match -> $group -> $sort semantics',
          },
        ],
        explanation:
          'Filter `status === "completed"`, accumulate sum/count per skill, round averages, and sort.',
        points: 55,
      },
    ],
  },
  {
    slug: 'python-core-intermediate',
    title: 'Python Data Structures & Clean Logic',
    skill: 'Python',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    description:
      'Evaluates Python list comprehensions, dictionary hashing, mutable default argument pitfalls, and generator semantics.',
    durationMinutes: 15,
    passingScore: 65,
    topics: ['Mutable Defaults', 'Comprehensions', 'Generators', 'Dictionaries'],
    questions: [
      {
        type: 'mcq',
        prompt: 'What is the output of calling `add_item(1)` followed by `add_item(2)` on `def add_item(x, items=[]): items.append(x); return items`?',
        options: ['[1] then [2]', '[1] then [1, 2]', 'TypeError', '[] then [2]'],
        correctOptionIndex: 1,
        explanation:
          'Default argument objects are evaluated once at function definition time in Python, so `items=[]` is shared across calls.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'Why is `(x * x for x in range(10_000_000))` preferred over `[x * x for x in range(10_000_000)]` when summing values?',
        options: [
          'Generator expressions compute values lazily with O(1) memory instead of materializing a 10M-element list',
          'List comprehensions cannot be passed to `sum()`',
          'Generator expressions automatically run across multiple CPU cores',
          'List comprehensions are deprecated in Python 3.12',
        ],
        correctOptionIndex: 0,
        explanation:
          'Generator expressions yield one item at a time without allocating the entire list in memory.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'What is the average-case lookup time complexity for checking `key in my_dict` in Python?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
        correctOptionIndex: 2,
        explanation:
          'Python `dict` uses an open-addressing hash table, giving O(1) average lookup.',
        points: 20,
      },
      {
        type: 'coding',
        language: 'python',
        functionName: 'word_frequencies',
        prompt:
          'Write a Python function `def word_frequencies(text: str) -> dict[str, int]:` that splits `text` by whitespace, normalizes each token to lowercase, strips leading/trailing punctuation (`.,!?;:`), and returns a dictionary mapping each non-empty word to its occurrence count.',
        starterCode: `def word_frequencies(text: str) -> dict[str, int]:\n    # Normalize words and count frequencies\n    pass`,
        rubricKeywords: ['def word_frequencies', 'lower', 'split', 'strip', 'return'],
        explanation:
          'Iterate over `text.split()`, normalize with `.lower().strip(".,!?;:")`, skip empty strings, and increment counts in a `dict` or `collections.Counter`.',
        points: 40,
      },
    ],
  },
  {
    slug: 'dsa-algorithms-intermediate',
    title: 'Data Structures & Algorithmic Complexity',
    skill: 'Data Structures and Algorithms',
    category: 'Data Structures & Algorithms',
    difficulty: 'Intermediate',
    description:
      'Tests hash-table lookups, stack matching, asymptotic Big-O analysis, and linear-time array algorithms.',
    durationMinutes: 25,
    passingScore: 70,
    topics: ['Hash Maps', 'Stacks', 'Big-O Complexity', 'Two Pointers'],
    questions: [
      {
        type: 'mcq',
        prompt: 'What is the worst-case time complexity of searching for a target in a balanced Binary Search Tree (e.g., AVL or Red-Black tree) with `n` nodes?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctOptionIndex: 1,
        explanation:
          'Self-balancing BSTs maintain height `O(log n)`, guaranteeing logarithmic search worst-case time.',
        points: 15,
      },
      {
        type: 'mcq',
        prompt: 'Which data structure naturally enables Breadth-First Search (BFS) traversal of a graph?',
        options: ['Min-Heap', 'FIFO Queue', 'LIFO Stack', 'Disjoint Set Union'],
        correctOptionIndex: 1,
        explanation:
          'A FIFO queue visits vertices level-by-level in order of increasing edge distance from the source.',
        points: 15,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'twoSumIndices',
        prompt:
          'Write `twoSumIndices(nums, target)` in O(n) time that returns `[i, j]` (`i < j`) of the two indices whose values sum to `target`, or `[]` if no pair exists.',
        starterCode: `function twoSumIndices(nums, target) {\n  // Use a Map for O(n) single-pass lookup\n  \n}`,
        testCases: [
          {
            input: [[2, 7, 11, 15], 9],
            expected: [0, 1],
            description: 'Finds first matching pair indices',
          },
          {
            input: [[3, 2, 4], 6],
            expected: [1, 2],
            description: 'Does not reuse the same index twice',
          },
          {
            input: [[1, 2, 3], 10],
            expected: [],
            description: 'Returns empty array when no solution exists',
          },
        ],
        explanation:
          'Store `value -> index` in a `Map` while scanning `nums` once; check if `target - nums[i]` was already seen.',
        points: 35,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'isValidBrackets',
        prompt:
          'Write `isValidBrackets(str)` that returns `true` if brackets `()`, `[]`, `{}` in `str` are balanced and properly nested, and `false` otherwise.',
        starterCode: `function isValidBrackets(str) {\n  // Validate balanced brackets using a stack\n  \n}`,
        testCases: [
          { input: ['({[]})'], expected: true, description: 'Accepts valid nested brackets' },
          { input: ['([)]'], expected: false, description: 'Rejects interleaved mismatched brackets' },
          { input: ['((('], expected: false, description: 'Rejects unclosed opening brackets' },
          { input: [''], expected: true, description: 'Accepts empty string' },
        ],
        explanation:
          'Push opening brackets onto a stack and verify matching pairs on each closing bracket; stack must be empty at the end.',
        points: 35,
      },
    ],
  },
  {
    slug: 'dsa-intervals-sliding-window-advanced',
    title: 'Advanced Algorithms: Intervals & Sliding Window',
    skill: 'Data Structures and Algorithms',
    category: 'Data Structures & Algorithms',
    difficulty: 'Advanced',
    description:
      'Challenges optimal O(n log n) interval merging and O(n) sliding window substring invariants.',
    durationMinutes: 25,
    passingScore: 70,
    topics: ['Interval Merging', 'Sliding Window', 'Amortized Analysis'],
    questions: [
      {
        type: 'mcq',
        prompt: 'Why does Dynamic Array (`std::vector` / JS Array) append run in amortized O(1) time when capacity doubles on overflow?',
        options: [
          'Because resizing happens on every 2nd insert',
          'Because the geometric capacity doubling distributes the O(n) copy cost across n subsequent insertions',
          'Because arrays allocate linked list nodes',
          'Because garbage collection runs asynchronously',
        ],
        correctOptionIndex: 1,
        explanation:
          'Total copies for `n` inserts sum to `n + n/2 + n/4 + ... < 2n`, yielding `O(1)` amortized cost per append.',
        points: 20,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'mergeIntervals',
        prompt:
          'Write `mergeIntervals(intervals)` that merges all overlapping `[start, end]` intervals and returns the sorted non-overlapping list.',
        starterCode: `function mergeIntervals(intervals) {\n  // Sort by start time and merge overlapping intervals\n  \n}`,
        testCases: [
          {
            input: [[[1, 3], [2, 6], [8, 10], [15, 18]]],
            expected: [[1, 6], [8, 10], [15, 18]],
            description: 'Merges overlapping intervals cleanly',
          },
          {
            input: [[[4, 5], [1, 4]]],
            expected: [[1, 5]],
            description: 'Handles unsorted touching intervals',
          },
          {
            input: [[]],
            expected: [],
            description: 'Handles empty input',
          },
        ],
        explanation:
          'Sort intervals by `a[0] - b[0]`, then merge whenever `current[0] <= lastMerged[1]`.',
        points: 40,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'longestUniqueSubstring',
        prompt:
          'Write `longestUniqueSubstring(s)` returning the length of the longest substring without repeating characters in O(n) time.',
        starterCode: `function longestUniqueSubstring(s) {\n  // Sliding window with last-seen character map\n  \n}`,
        testCases: [
          { input: ['abcabcbb'], expected: 3, description: 'Finds "abc" of length 3' },
          { input: ['bbbbb'], expected: 1, description: 'Handles all-identical characters' },
          { input: ['pwwkew'], expected: 3, description: 'Advances left pointer past duplicate' },
          { input: [''], expected: 0, description: 'Handles empty string' },
        ],
        explanation:
          'Track last-seen character indices in a `Map` and move the window start to `Math.max(left, lastSeen + 1)`.',
        points: 40,
      },
    ],
  },
  {
    slug: 'dbms-transactions-sql-intermediate',
    title: 'DBMS Transactions, Normalization & SQL',
    skill: 'DBMS',
    category: 'Database Management',
    difficulty: 'Intermediate',
    description:
      'Evaluates ACID isolation levels, BCNF normalization, B+ tree indexing, and relational aggregation queries.',
    durationMinutes: 20,
    passingScore: 70,
    topics: ['ACID & Isolation', 'Normalization', 'B+ Trees', 'SQL Joins'],
    questions: [
      {
        type: 'mcq',
        prompt: 'Which anomaly occurs when Transaction A reads rows matching a `WHERE` range, Transaction B inserts a new matching row and commits, and Transaction A re-runs the same query seeing the new row?',
        options: ['Dirty Read', 'Phantom Read', 'Lost Update', 'Write Skew'],
        correctOptionIndex: 1,
        explanation:
          'A phantom read happens when a range predicate returns newly inserted/deleted rows from another committed transaction.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'What does Third Normal Form (3NF) eliminate beyond 2NF?',
        options: [
          'Repeating groups in a single column',
          'Partial dependencies on a composite primary key',
          'Transitive dependencies of non-key attributes on candidate keys',
          'Multi-valued dependencies',
        ],
        correctOptionIndex: 2,
        explanation:
          '3NF removes transitive functional dependencies (`Key -> A -> B`) so non-key attributes depend only on the key.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'Why are B+ Trees preferred over Hash Indexes for general relational database range queries?',
        options: [
          'Hash indexes cannot enforce uniqueness',
          'B+ Trees keep keys sorted in linked leaf pages, supporting both `=` lookups and efficient `< / > / BETWEEN` range scans',
          'B+ Trees require zero disk pages',
          'Hash indexes do not support string keys',
        ],
        correctOptionIndex: 1,
        explanation:
          'Linked leaf nodes in B+ trees allow sequential range scans after logarithmic descent.',
        points: 20,
      },
      {
        type: 'coding',
        language: 'sql',
        functionName: 'sql_top_departments',
        prompt:
          'Write a SQL query that returns `department_id` and `avg_salary` for departments that have more than 3 employees (`COUNT(*) > 3`), ordered by `avg_salary` descending.',
        starterCode: `SELECT department_id, AVG(salary) AS avg_salary\nFROM employees\n-- Complete grouping, HAVING filter, and ordering\n`,
        rubricKeywords: ['SELECT', 'GROUP BY', 'HAVING', 'COUNT', 'ORDER BY', 'DESC'],
        explanation:
          'Use `GROUP BY department_id HAVING COUNT(*) > 3 ORDER BY avg_salary DESC;` (`WHERE` cannot filter aggregate functions).',
        points: 40,
      },
    ],
  },
  {
    slug: 'computer-networks-protocols-intermediate',
    title: 'Computer Networks: TCP/IP, HTTP & DNS',
    skill: 'Computer Networks',
    category: 'Software Engineering Concepts',
    difficulty: 'Intermediate',
    description:
      'Assesses TCP 3-way handshake, congestion control, TLS/HTTPS, DNS resolution, and IPv4 subnetting.',
    durationMinutes: 20,
    passingScore: 70,
    topics: ['TCP / UDP', 'HTTP/2 & TLS', 'DNS Resolution', 'Subnetting'],
    questions: [
      {
        type: 'mcq',
        prompt: 'Why does TCP use a 3-way handshake (`SYN`, `SYN-ACK`, `ACK`) instead of a 2-way handshake?',
        options: [
          'To negotiate HTTP compression headers',
          'To synchronize sequence numbers in both directions and confirm both client and server can send and receive',
          'To encrypt the TLS certificate chain',
          'To bypass NAT firewall translation',
        ],
        correctOptionIndex: 1,
        explanation:
          'A 3-way handshake verifies bidirectional reachability and establishes initial sequence numbers for both endpoints.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'Which limitation of HTTP/1.1 multiplexing is solved by HTTP/2 streams over a single TCP connection?',
        options: [
          'DNS TTL caching',
          'Application-layer head-of-line blocking across concurrent asset requests on one connection',
          'TCP packet checksums',
          'ARP broadcast storms',
        ],
        correctOptionIndex: 1,
        explanation:
          'HTTP/2 interleaves binary frames from multiple logical streams on one connection, removing HTTP/1.1 pipeline head-of-line blocking.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'How many usable host IPv4 addresses exist in a `/26` subnet?',
        options: ['64', '62', '30', '126'],
        correctOptionIndex: 1,
        explanation:
          'A `/26` subnet leaves `32 - 26 = 6` host bits (`2^6 = 64` total addresses, minus 2 for network and broadcast = `62` usable hosts).',
        points: 20,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'sameSubnet',
        prompt:
          'Write `sameSubnet(ipA, ipB, prefixLength)` that determines whether two IPv4 dotted-quad addresses (`"192.168.1.10"`, `"192.168.1.50"`) belong to the same CIDR subnet for `prefixLength` (0–32).',
        starterCode: `function sameSubnet(ipA, ipB, prefixLength) {\n  // Convert IPv4 strings to 32-bit integers and compare masked network prefixes\n  \n}`,
        testCases: [
          { input: ['192.168.1.10', '192.168.1.60', 26], expected: true, description: 'Matches hosts inside same /26 subnet' },
          { input: ['192.168.1.10', '192.168.1.70', 26], expected: false, description: 'Distinguishes hosts across /26 boundary' },
          { input: ['10.0.0.1', '10.255.255.254', 8], expected: true, description: 'Matches /8 network prefix' },
        ],
        explanation:
          'Convert each IPv4 to an unsigned 32-bit int, compute the bitmask `prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0`, and compare `(a & mask) === (b & mask)`.',
        points: 40,
      },
    ],
  },
  {
    slug: 'operating-systems-concurrency-intermediate',
    title: 'Operating Systems: Scheduling, Memory & Locks',
    skill: 'Operating Systems',
    category: 'Software Engineering Concepts',
    difficulty: 'Intermediate',
    description:
      'Covers process vs thread isolation, virtual memory paging, deadlock Coffman conditions, and CPU scheduling.',
    durationMinutes: 20,
    passingScore: 70,
    topics: ['Processes & Threads', 'Virtual Memory', 'Deadlocks', 'CPU Scheduling'],
    questions: [
      {
        type: 'mcq',
        prompt: 'Which four conditions must ALL hold simultaneously for a resource deadlock to occur?',
        options: [
          'Starvation, Paging, Preemption, Thrashing',
          'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait',
          'Race Condition, Context Switch, Semaphore, Spinlock',
          'Paging, Segmentation, TLB Miss, Interrupt',
        ],
        correctOptionIndex: 1,
        explanation:
          'Those are the four Coffman conditions; breaking any one (such as lock ordering to prevent circular wait) prevents deadlock.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'What causes "thrashing" in a virtual memory system?',
        options: [
          'CPU cache line hits exceeding 99%',
          'Processes spend more time swapping pages between RAM and disk than executing instructions because working sets exceed physical memory',
          'Threads sharing a read-only code segment',
          'Too many TLB hits in user space',
        ],
        correctOptionIndex: 1,
        explanation:
          'When total working set size exceeds available frames, continuous page faults collapse CPU utilization.',
        points: 20,
      },
      {
        type: 'mcq',
        prompt: 'Why is a context switch between two threads of the same process faster than between two separate processes?',
        options: [
          'Threads share the same virtual address space (page tables / TLB mappings remain valid)',
          'Threads do not have their own stack or registers',
          'Threads run without OS kernel scheduling',
          'Processes cannot execute concurrently on multi-core CPUs',
        ],
        correctOptionIndex: 0,
        explanation:
          'Same-process threads share memory mappings, avoiding page table switches and TLB flushes.',
        points: 20,
      },
      {
        type: 'coding',
        language: 'javascript',
        functionName: 'roundRobinOrder',
        prompt:
          'Write `roundRobinOrder(tasks, quantum)` simulating Round-Robin CPU scheduling for tasks `[{ id: string, burst: number }]` all arriving at t=0. Return the sequence of `{ id, ran }` execution slices until all tasks finish.',
        starterCode: `function roundRobinOrder(tasks, quantum) {\n  // Simulate Round-Robin FIFO ready queue with time quantum\n  \n}`,
        testCases: [
          {
            input: [[{ id: 'P1', burst: 5 }, { id: 'P2', burst: 3 }], 2],
            expected: [
              { id: 'P1', ran: 2 },
              { id: 'P2', ran: 2 },
              { id: 'P1', ran: 2 },
              { id: 'P2', ran: 1 },
              { id: 'P1', ran: 1 },
            ],
            description: 'Schedules slices in Round-Robin FIFO order',
          },
          {
            input: [[{ id: 'A', burst: 4 }], 5],
            expected: [{ id: 'A', ran: 4 }],
            description: 'Handles burst shorter than quantum',
          },
        ],
        explanation:
          'Clone `{ ...t }` into a queue; pop front, run `Math.min(quantum, task.burst)`, push slice, and re-enqueue if `burst > 0`.',
        points: 40,
      },
    ],
  },
];

export async function ensureSeedAssessments(): Promise<void> {
  let seededCount = 0;

  for (const item of SEED_ASSESSMENTS) {
    const existing = await Assessment.findOne({ slug: item.slug });
    if (existing) {
      // Ensure pre-seeded coding test cases with empty expected {} are intact
      if (item.slug === 'javascript-fundamentals-beginner') {
        await Question.updateOne(
          { assessmentId: existing._id, functionName: 'summarizeScores' },
          {
            $set: {
              testCases: item.questions.find((q) => q.functionName === 'summarizeScores')?.testCases,
            },
          }
        );
      }
      continue;
    }

    const totalPoints = item.questions.reduce((acc, q) => acc + q.points, 0);
    const assessment = await Assessment.create({
      slug: item.slug,
      title: item.title,
      skill: item.skill,
      category: item.category,
      difficulty: item.difficulty,
      description: item.description,
      durationMinutes: item.durationMinutes,
      questionCount: item.questions.length,
      totalPoints,
      passingScore: item.passingScore,
      topics: item.topics,
    });

    const questionDocs = item.questions.map((q) => ({
      assessmentId: assessment._id,
      skill: item.skill,
      category: item.category,
      difficulty: item.difficulty,
      type: q.type,
      prompt: q.prompt,
      codeSnippet: q.codeSnippet,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      starterCode: q.starterCode,
      functionName: q.functionName,
      language: q.language || 'javascript',
      testCases: q.testCases,
      rubricKeywords: q.rubricKeywords,
      explanation: q.explanation,
      points: q.points,
      isAiSupplemented: false,
    }));

    await Question.insertMany(questionDocs);
    seededCount += 1;
  }

  if (seededCount > 0) {
    console.log(`[seed] Seeded ${seededCount} assessments (total catalog: ${SEED_ASSESSMENTS.length}).`);
  }
}
