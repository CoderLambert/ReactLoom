✔ official sources bind a snapshot to an immutable upstream file (1.145222ms)
✔ homepage checks distinguish unknown from blocked and validate safe addresses (0.224994ms)
✔ SheetJS canonical forge binds its actual README to the exact repository and commit (0.577428ms)
✔ README links resolve against the pinned upstream folder and local anchors remain local (0.173423ms)
✔ actual clsx README anchors target rendered headings including h4 (4.028144ms)
✖ scoped package README folders retain exact encoded upstream identity (0.874741ms)
ℹ tests 6
ℹ suites 0
ℹ pass 5
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 50.302451

✖ failing tests:

test at packages/library-lab/tests/official-sources.test.mjs:134:1
✖ scoped package README folders retain exact encoded upstream identity (0.874741ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  
  + [
  +   'invalid official README metadata'
  + ]
  - []
  
      at TestContext.<anonymous> (file:///home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/tests/official-sources.test.mjs:141:10)
      at Test.runInAsyncScope (node:async_hooks:226:14)
      at Test.run (node:internal/test_runner/test:1402:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:974:18)
      at Test.postRun (node:internal/test_runner/test:1542:19)
      at Test.run (node:internal/test_runner/test:1467:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:974:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: [ 'invalid official README metadata' ],
    expected: [],
    operator: 'deepStrictEqual',
    diff: 'simple'
  }
