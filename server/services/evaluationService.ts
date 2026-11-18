import vm from 'node:vm';
import type { IQuestion } from '../models/Question.ts';
import type { IAttemptAnswer } from '../models/AssessmentAttempt.ts';

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => deepEqual(item, b[idx]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(
      (k) =>
        Object.prototype.hasOwnProperty.call(b, k) &&
        deepEqual(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k]
        )
    );
  }
  return false;
}

function evaluateJavaScriptCoding(
  question: IQuestion,
  submittedCode: string
): Omit<IAttemptAnswer, 'questionId' | 'questionType' | 'selectedOptionIndex' | 'submittedCode'> {
  const fnName = question.functionName;
  const maxPoints = question.points;
  const code = (submittedCode || '').trim();

  if (!code || code === (question.starterCode || '').trim()) {
    return {
      isCorrect: false,
      earnedPoints: 0,
      maxPoints,
      evaluationNote: 'No solution code was submitted.',
      testResults: [],
    };
  }

  if (!fnName) {
    return {
      isCorrect: false,
      earnedPoints: 0,
      maxPoints,
      evaluationNote: 'Question function harness is missing.',
      testResults: [],
    };
  }

  // Special harness for closure-based rate counter
  if (fnName === 'createRateCounter') {
    try {
      const script = new vm.Script(
        `"use strict";\n${code}\n;(() => {
          if (typeof createRateCounter !== 'function') throw new Error('createRateCounter function not defined');
          const hit = createRateCounter(2);
          if (typeof hit !== 'function') throw new Error('createRateCounter must return a function');
          const r1 = hit('u1');
          const r2 = hit('u1');
          const r3 = hit('u1');
          const r4 = hit('u2');
          return [r1, r2, r3, r4];
        })();`
      );
      const result = script.runInNewContext({}, { timeout: 400 }) as unknown[];
      const expected = [true, true, false, true];
      const passed = deepEqual(result, expected);
      return {
        isCorrect: passed,
        earnedPoints: passed ? maxPoints : 0,
        maxPoints,
        evaluationNote: passed
          ? 'Closure enforces per-key rate limits accurately.'
          : `Expected [true, true, false, true] across sequential hits, got ${JSON.stringify(result)}.`,
        testResults: [
          {
            description: 'Enforces per-key limit=2 across independent keys',
            passed,
            expected: JSON.stringify(expected),
            actual: JSON.stringify(result),
          },
        ],
      };
    } catch (err) {
      return {
        isCorrect: false,
        earnedPoints: 0,
        maxPoints,
        evaluationNote: err instanceof Error ? err.message : 'Execution error',
        testResults: [
          {
            description: 'Closure execution check',
            passed: false,
            actual: err instanceof Error ? err.message : 'Runtime error',
          },
        ],
      };
    }
  }

  // Special harness for Express middleware simulator (test cases contain functions!)
  if (fnName === 'runMiddlewareChain') {
    try {
      const script = new vm.Script(
        `"use strict";\n${code}\n;(() => {
          if (typeof runMiddlewareChain !== 'function') throw new Error('runMiddlewareChain function not defined');
          const out1 = runMiddlewareChain([
            (req, _res, next) => { req.user = 'ada'; next(); },
            (req, res) => { res.status = 200; res.body = { ok: req.user }; res.sent = true; }
          ], {});
          const out2 = runMiddlewareChain([
            (_req, _res, next) => { next(new Error('Invalid token')); },
            (_req, res) => { res.status = 200; res.body = { ok: true }; res.sent = true; }
          ], {});
          return { out1, out2 };
        })();`
      );
      const { out1, out2 } = script.runInNewContext({}, { timeout: 400 }) as {
        out1: unknown;
        out2: unknown;
      };
      const pass1 = deepEqual(out1, {
        status: 200,
        body: { ok: 'ada' },
        req: { user: 'ada' },
      });
      const pass2 = deepEqual(out2, { status: 500, error: 'Invalid token' });
      const passedCount = (pass1 ? 1 : 0) + (pass2 ? 1 : 0);
      const earnedPoints = Math.round((passedCount / 2) * maxPoints);
      return {
        isCorrect: passedCount === 2,
        earnedPoints,
        maxPoints,
        evaluationNote: `${passedCount}/2 middleware pipeline checks passed.`,
        testResults: [
          {
            description: 'Executes middleware sequence and returns response',
            passed: pass1,
            expected: '{"status":200,"body":{"ok":"ada"},"req":{"user":"ada"}}',
            actual: JSON.stringify(out1),
          },
          {
            description: 'Short-circuits pipeline when next(err) is invoked',
            passed: pass2,
            expected: '{"status":500,"error":"Invalid token"}',
            actual: JSON.stringify(out2),
          },
        ],
      };
    } catch (err) {
      return {
        isCorrect: false,
        earnedPoints: 0,
        maxPoints,
        evaluationNote: err instanceof Error ? err.message : 'Execution error',
        testResults: [
          {
            description: 'Middleware chain execution',
            passed: false,
            actual: err instanceof Error ? err.message : 'Runtime error',
          },
        ],
      };
    }
  }

  const testCases = question.testCases || [];
  if (testCases.length === 0) {
    return {
      isCorrect: false,
      earnedPoints: 0,
      maxPoints,
      evaluationNote: 'No test cases configured for this coding question.',
      testResults: [],
    };
  }

  const testResults: Array<{
    description: string;
    passed: boolean;
    actual?: string;
    expected?: string;
  }> = [];

  for (const tc of testCases) {
    try {
      const serializedArgs = JSON.stringify(tc.input);
      const script = new vm.Script(
        `"use strict";\n${code}\n;(() => {
          if (typeof ${fnName} !== 'function') {
            throw new Error('Function "${fnName}" is not defined');
          }
          const __args = ${serializedArgs};
          return ${fnName}(...__args);
        })();`
      );
      const actual = script.runInNewContext({}, { timeout: 400 });
      const passed = deepEqual(actual, tc.expected);
      testResults.push({
        description: tc.description,
        passed,
        expected: JSON.stringify(tc.expected),
        actual: JSON.stringify(actual),
      });
    } catch (err) {
      testResults.push({
        description: tc.description,
        passed: false,
        expected: JSON.stringify(tc.expected),
        actual: err instanceof Error ? err.message : 'Runtime error',
      });
    }
  }

  const passedCount = testResults.filter((r) => r.passed).length;
  const ratio = passedCount / testResults.length;
  const earnedPoints = Math.round(ratio * maxPoints);

  return {
    isCorrect: passedCount === testResults.length,
    earnedPoints,
    maxPoints,
    evaluationNote: `${passedCount}/${testResults.length} unit tests passed.`,
    testResults,
  };
}

function evaluateRubricCoding(
  question: IQuestion,
  submittedCode: string
): Omit<IAttemptAnswer, 'questionId' | 'questionType' | 'selectedOptionIndex' | 'submittedCode'> {
  const maxPoints = question.points;
  const code = (submittedCode || '').trim();
  if (!code || code === (question.starterCode || '').trim()) {
    return {
      isCorrect: false,
      earnedPoints: 0,
      maxPoints,
      evaluationNote: 'No solution code was submitted.',
      testResults: [],
    };
  }

  const keywords = question.rubricKeywords || [];
  if (keywords.length === 0) {
    const hasSubstance = code.length > 25;
    return {
      isCorrect: hasSubstance,
      earnedPoints: hasSubstance ? maxPoints : 0,
      maxPoints,
      evaluationNote: hasSubstance
        ? 'Submitted solution passed structural validation.'
        : 'Submitted solution is too brief.',
      testResults: [],
    };
  }

  const normalized = code.toLowerCase();
  const testResults = keywords.map((kw) => {
    const matched = normalized.includes(kw.toLowerCase());
    return {
      description: `Includes required construct: ${kw}`,
      passed: matched,
      expected: kw,
      actual: matched ? 'Present' : 'Missing',
    };
  });

  const matchedCount = testResults.filter((t) => t.passed).length;
  const ratio = matchedCount / keywords.length;
  const earnedPoints = Math.round(ratio * maxPoints);

  return {
    isCorrect: matchedCount === keywords.length,
    earnedPoints,
    maxPoints,
    evaluationNote: `${matchedCount}/${keywords.length} structural & semantic checks passed.`,
    testResults,
  };
}

export function evaluateAnswer(
  question: IQuestion,
  submission: { selectedOptionIndex?: number | null; submittedCode?: string }
): IAttemptAnswer {
  if (question.type === 'mcq') {
    const selected =
      typeof submission.selectedOptionIndex === 'number'
        ? submission.selectedOptionIndex
        : null;
    const isCorrect =
      selected !== null && selected === question.correctOptionIndex;

    return {
      questionId: question._id,
      questionType: 'mcq',
      selectedOptionIndex: selected,
      isCorrect,
      earnedPoints: isCorrect ? question.points : 0,
      maxPoints: question.points,
      evaluationNote:
        selected === null
          ? 'Unanswered'
          : isCorrect
          ? 'Correct answer'
          : 'Incorrect option selected',
    };
  }

  const code = submission.submittedCode || '';
  const result =
    question.language === 'javascript' &&
    ((question.testCases && question.testCases.length > 0) ||
      question.functionName === 'createRateCounter' ||
      question.functionName === 'runMiddlewareChain')
      ? evaluateJavaScriptCoding(question, code)
      : evaluateRubricCoding(question, code);

  return {
    questionId: question._id,
    questionType: 'coding',
    submittedCode: code,
    ...result,
  };
}
