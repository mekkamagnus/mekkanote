/**
 * TaskEither Utility Tests
 * Comprehensive testing of core functional programming utilities
 */

import { assertEquals, assert, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts"
import { TaskEither, Either } from "../../utils/task-either.ts"

// Test TaskEither core functionality
Deno.test("TaskEither - of should create successful TaskEither", async () => {
  const task = TaskEither.of(42)
  const result = await task.run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, 42)
  }
})

Deno.test("TaskEither - left should create failed TaskEither", async () => {
  const error = "test error"
  const task = TaskEither.left(error)
  const result = await task.run()
  
  assert(result.isLeft())
  if (result.isLeft()) {
    assertEquals(result.value, error)
  }
})

Deno.test("TaskEither - tryCatch should handle successful operations", async () => {
  const task = TaskEither.tryCatch(
    async () => "success",
    (error) => `Error: ${error}`
  )
  const result = await task.run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, "success")
  }
})

Deno.test("TaskEither - tryCatch should handle failed operations", async () => {
  const task = TaskEither.tryCatch(
    async () => { throw new Error("test error") },
    (error) => `Caught: ${(error as Error).message}`
  )
  const result = await task.run()
  
  assert(result.isLeft())
  if (result.isLeft()) {
    assertEquals(result.value, "Caught: test error")
  }
})

// Test TaskEither chaining with map
Deno.test("TaskEither - map should transform successful values", async () => {
  const task = TaskEither.of(10)
    .map(x => x * 2)
    .map(x => x.toString())
  
  const result = await task.run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, "20")
  }
})

Deno.test("TaskEither - map should preserve errors", async () => {
  const task = TaskEither.left("error")
    .map(x => x * 2)
    .map(x => x.toString())
  
  const result = await task.run()
  
  assert(result.isLeft())
  if (result.isLeft()) {
    assertEquals(result.value, "error")
  }
})

// Test TaskEither chaining with flatMap
Deno.test("TaskEither - flatMap should chain successful operations", async () => {
  const task = TaskEither.of(5)
    .flatMap(x => TaskEither.of(x * 2))
    .flatMap(x => TaskEither.of(x + 1))
  
  const result = await task.run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, 11)
  }
})

Deno.test("TaskEither - flatMap should short-circuit on error", async () => {
  const task = TaskEither.of(5)
    .flatMap(x => TaskEither.left("error in chain"))
    .flatMap(x => TaskEither.of(x + 1)) // Should not execute
  
  const result = await task.run()
  
  assert(result.isLeft())
  if (result.isLeft()) {
    assertEquals(result.value, "error in chain")
  }
})

// Test error recovery
Deno.test("TaskEither - recover should handle errors", async () => {
  const task = TaskEither.left("original error")
    .recover(error => TaskEither.of(`recovered from: ${error}`))
  
  const result = await task.run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, "recovered from: original error")
  }
})

Deno.test("TaskEither - recover should not affect successful values", async () => {
  const task = TaskEither.of("success")
    .recover(error => TaskEither.of("should not execute"))
  
  const result = await task.run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, "success")
  }
})

// Test orElse functionality
Deno.test("TaskEither - orElse should provide alternative on error", async () => {
  const task = TaskEither.left("error")
    .orElse(() => TaskEither.of("alternative"))
  
  const result = await task.run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, "alternative")
  }
})

Deno.test("TaskEither - orElse should not affect successful values", async () => {
  const task = TaskEither.of("original")
    .orElse(() => TaskEither.of("alternative"))
  
  const result = await task.run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, "original")
  }
})

// Test parallel execution with all
Deno.test("TaskEither - all should combine successful tasks", async () => {
  const tasks = [
    TaskEither.of(1),
    TaskEither.of(2),
    TaskEither.of(3)
  ]
  
  const result = await TaskEither.all(tasks).run()
  
  assert(result.isRight())
  if (result.isRight()) {
    assertEquals(result.value, [1, 2, 3])
  }
})

Deno.test("TaskEither - all should fail if any task fails", async () => {
  const tasks = [
    TaskEither.of(1),
    TaskEither.left("error"),
    TaskEither.of(3)
  ]
  
  const result = await TaskEither.all(tasks).run()
  
  assert(result.isLeft())
  if (result.isLeft()) {
    assertEquals(result.value, "error")
  }
})

// Test utility functions
Deno.test("TaskEither - delay should add timing", async () => {
  const startTime = Date.now()
  const task = TaskEither.of("value").delay(100)
  const result = await task.run()
  const endTime = Date.now()
  
  assert(result.isRight())
  assert(endTime - startTime >= 100)
  if (result.isRight()) {
    assertEquals(result.value, "value")
  }
})

Deno.test("TaskEither - timeout should fail on timeout", async () => {
  const task = TaskEither.tryCatch(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return "should not complete"
    },
    (error) => `Error: ${error}`
  ).timeout(100)
  
  const result = await task.run()
  
  assert(result.isLeft())
  if (result.isLeft()) {
    assert(result.value.includes("timeout"))
  }
})

Deno.test("TaskEither - retry should retry on failure", async () => {
  let attempts = 0
  const task = TaskEither.tryCatch(
    async () => {
      attempts++
      if (attempts < 3) {
        throw new Error("not yet")
      }
      return "success on third try"
    },
    (error) => `Error: ${(error as Error).message}`
  ).retry(3)
  
  const result = await task.run()
  
  assert(result.isRight())
  assertEquals(attempts, 3)
  if (result.isRight()) {
    assertEquals(result.value, "success on third try")
  }
})

// Test file operations utilities
Deno.test("TaskEither - file operations should work with TaskEither", async () => {
  const testFile = "/tmp/taskether-test.txt"
  const content = "test content"
  
  // Write file
  const writeResult = await TaskEither.writeFile(testFile, content).run()
  assert(writeResult.isRight())
  
  // Read file
  const readResult = await TaskEither.readFile(testFile).run()
  assert(readResult.isRight())
  if (readResult.isRight()) {
    assertEquals(readResult.value, content)
  }
  
  // Cleanup
  try {
    await Deno.remove(testFile)
  } catch {
    // Ignore cleanup errors
  }
})

// Test JSON operations
Deno.test("TaskEither - JSON operations should handle parsing", async () => {
  const data = { name: "test", value: 42 }
  const jsonString = JSON.stringify(data)
  
  const parseResult = await TaskEither.parseJSON(jsonString).run()
  
  assert(parseResult.isRight())
  if (parseResult.isRight()) {
    assertEquals(parseResult.value, data)
  }
})

Deno.test("TaskEither - JSON operations should handle parse errors", async () => {
  const invalidJson = "{ invalid json"
  
  const parseResult = await TaskEither.parseJSON(invalidJson).run()
  
  assert(parseResult.isLeft())
  if (parseResult.isLeft()) {
    assert(parseResult.value.includes("JSON"))
  }
})

// Test Either utility
Deno.test("Either - should create right values", () => {
  const either = Either.right(42)
  
  assert(either.isRight())
  assert(!either.isLeft())
  if (either.isRight()) {
    assertEquals(either.value, 42)
  }
})

Deno.test("Either - should create left values", () => {
  const either = Either.left("error")
  
  assert(either.isLeft())
  assert(!either.isRight())
  if (either.isLeft()) {
    assertEquals(either.value, "error")
  }
})

Deno.test("Either - map should transform right values", () => {
  const either = Either.right(10).map(x => x * 2)
  
  assert(either.isRight())
  if (either.isRight()) {
    assertEquals(either.value, 20)
  }
})

Deno.test("Either - map should preserve left values", () => {
  const either = Either.left("error").map(x => x * 2)
  
  assert(either.isLeft())
  if (either.isLeft()) {
    assertEquals(either.value, "error")
  }
})