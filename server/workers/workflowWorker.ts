import { startWorkflowWorker } from "../services/workflowDispatchService";

let started = false;

export function bootstrapWorkflowWorker() {
  if (started) return;
  started = true;
  startWorkflowWorker();
  console.log("[Workflow Worker] Durable workflow worker started");
}
