import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getDb, saveDb } from "../shared/api/local-db";

const server = new Server({
  name: "task-manager-mcp",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_all_data",
      description: "Get all tasks and agents in the project",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "pickup_task",
      description: "Assign a TODO task to an IDLE agent and move it to IN_PROGRESS",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          agentId: { type: "string" }
        },
        required: ["taskId", "agentId"]
      }
    },
    {
      name: "update_task_status",
      description: "Update the status of a task (e.g. to IN_REVIEW or DONE)",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] }
        },
        required: ["taskId", "status"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const db = await getDb();

  if (request.params.name === "get_all_data") {
    return { content: [{ type: "text", text: JSON.stringify(db, null, 2) }] };
  }

  if (request.params.name === "pickup_task") {
    const { taskId, agentId } = request.params.arguments as { taskId: string, agentId: string };
    const task = db.tasks.find(t => t.id === taskId);
    const agent = db.agents.find(a => a.id === agentId);
    
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    task.status = "IN_PROGRESS";
    task.assigneeId = agent.id;
    task.updatedAt = new Date().toISOString();

    agent.status = "WORKING";
    agent.currentTaskId = task.id;
    agent.lastActiveAt = new Date().toISOString();

    await saveDb(db);
    return { content: [{ type: "text", text: `Task ${taskId} picked up by ${agentId}. Status set to IN_PROGRESS.` }] };
  }

  if (request.params.name === "update_task_status") {
    const { taskId, status } = request.params.arguments as { taskId: string, status: any };
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = status;
    task.updatedAt = new Date().toISOString();

    // If done or review, free the agent
    if (status === "DONE" || status === "IN_REVIEW") {
       const agent = db.agents.find(a => a.id === task.assigneeId);
       if (agent) {
           agent.status = "IDLE";
           agent.currentTaskId = undefined;
           agent.lastActiveAt = new Date().toISOString();
       }
    }

    await saveDb(db);
    return { content: [{ type: "text", text: `Task ${taskId} status updated to ${status}.` }] };
  }

  throw new Error("Unknown tool");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Task Manager custom MCP Server is running over stdio");
}

main().catch(console.error);
