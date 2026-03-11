/**
 * Parallel Task Executor
 * Handles parallel execution of tasks with proper error handling and retry logic
 */

export interface ParallelTask<T = any> {
  id: string;
  name: string;
  fn: () => Promise<T>;
  retries?: number;
  timeout?: number;
}

export interface TaskResult<T = any> {
  id: string;
  name: string;
  success: boolean;
  data?: T;
  error?: string;
  retryCount: number;
  duration: number;
}

/**
 * Execute multiple tasks in parallel with error handling and retry logic
 */
export async function executeParallel<T = any>(
  tasks: ParallelTask<T>[],
  options?: {
    maxConcurrency?: number;
    stopOnError?: boolean;
  }
): Promise<TaskResult<T>[]> {
  const maxConcurrency = options?.maxConcurrency ?? tasks.length;
  const stopOnError = options?.stopOnError ?? false;
  const results: TaskResult<T>[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = executeTask(task).then((result) => {
      results.push(result);
      if (stopOnError && !result.success) {
        throw new Error(`Task ${task.name} failed: ${result.error}`);
      }
    });

    executing.push(promise);

    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Execute a single task with retry logic
 */
async function executeTask<T = any>(task: ParallelTask<T>): Promise<TaskResult<T>> {
  const startTime = Date.now();
  const maxRetries = task.retries ?? 3;
  let lastError: Error | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<T>((_, reject) => {
        const timeout = task.timeout ?? 300000; // 5 minutes default
        setTimeout(() => reject(new Error(`Task timeout after ${timeout}ms`)), timeout);
      });

      const result = await Promise.race([task.fn(), timeoutPromise]);

      return {
        id: task.id,
        name: task.name,
        success: true,
        data: result,
        retryCount,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount = attempt;

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(
          `[Parallel] Task ${task.name} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return {
    id: task.id,
    name: task.name,
    success: false,
    error: lastError?.message ?? "Unknown error",
    retryCount,
    duration: Date.now() - startTime,
  };
}

/**
 * Execute tasks in sequence (one after another)
 */
export async function executeSequential<T = any>(
  tasks: ParallelTask<T>[],
  options?: {
    stopOnError?: boolean;
  }
): Promise<TaskResult<T>[]> {
  const stopOnError = options?.stopOnError ?? false;
  const results: TaskResult<T>[] = [];

  for (const task of tasks) {
    const result = await executeTask(task);
    results.push(result);

    if (stopOnError && !result.success) {
      throw new Error(`Task ${task.name} failed: ${result.error}`);
    }
  }

  return results;
}

/**
 * Execute tasks with dependencies (DAG - Directed Acyclic Graph)
 */
export interface DependentTask<T = any> extends ParallelTask<T> {
  dependsOn?: string[]; // Task IDs this task depends on
}

export async function executeDependentTasks<T = any>(
  tasks: DependentTask<T>[],
  options?: {
    stopOnError?: boolean;
  }
): Promise<TaskResult<T>[]> {
  const stopOnError = options?.stopOnError ?? false;
  const results = new Map<string, TaskResult<T>>();
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const completed = new Set<string>();
  const inProgress = new Set<string>();

  async function executeTaskWithDeps(taskId: string): Promise<TaskResult<T>> {
    if (completed.has(taskId)) {
      return results.get(taskId)!;
    }

    if (inProgress.has(taskId)) {
      throw new Error(`Circular dependency detected for task ${taskId}`);
    }

    const task = taskMap.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    inProgress.add(taskId);

    // Execute dependencies first
    if (task.dependsOn && task.dependsOn.length > 0) {
      const depResults = await Promise.all(
        task.dependsOn.map((depId) => executeTaskWithDeps(depId))
      );

      // Check if any dependency failed
      if (stopOnError && depResults.some((r) => !r.success)) {
        throw new Error(`Dependency failed for task ${taskId}`);
      }
    }

    const result = await executeTask(task);
    results.set(taskId, result);
    completed.add(taskId);
    inProgress.delete(taskId);

    return result;
  }

  const allResults: TaskResult<T>[] = [];
  for (const task of tasks) {
    const result = await executeTaskWithDeps(task.id);
    allResults.push(result);
  }

  return allResults;
}

/**
 * Wait for a task to complete with polling
 */
export async function waitForCompletion<T = any>(
  checkFn: () => Promise<{ completed: boolean; data?: T; error?: string }>,
  options?: {
    maxAttempts?: number;
    delayMs?: number;
    timeout?: number;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 600; // 10 minutes with 1s interval
  const delayMs = options?.delayMs ?? 1000;
  const timeout = options?.timeout ?? 600000; // 10 minutes

  const startTime = Date.now();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for task completion after ${timeout}ms`);
    }

    try {
      const result = await checkFn();

      if (result.completed) {
        if (result.error) {
          throw new Error(result.error);
        }
        return result.data as T;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      throw new Error(`Error checking task completion: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  throw new Error(`Task did not complete within ${maxAttempts} attempts`);
}
