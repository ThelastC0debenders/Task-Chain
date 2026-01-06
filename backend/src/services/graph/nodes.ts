import { ProjectState, KnowledgeNode, KnowledgeEdge } from "./state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { connectToMongo } from "../../config/mongo";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";

// Initialize LLM Lazily
const getLlm = () => new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash-001",
    temperature: 0,
});

export async function contextExtractor(state: typeof ProjectState.State) {
    const messages = state.messages;
    if (!messages.length) return {};

    const lastMessage = messages[messages.length - 1];

    // Only process if it's a user message for now
    if (lastMessage._getType() !== "human") return {};

    const llm = getLlm();

    const prompt = `
    Analyze the following message for new project entities (Nodes) or relationships (Edges).
    
    Entities can be: Feature, Bug, Decision, Document, Meeting.
    Relationships can be: ROOT_CAUSE_OF, DEBATED_IN, DECIDED_IN, RELATED_TO.
    
    Message: "${lastMessage.content}"
    
    Return ONLY a JSON object with keys "nodes" (array) and "edges" (array).
    Example:
    {
      "nodes": [{"id": "bug-123", "type": "Bug", "content": "Login failure"}],
      "edges": [{"source": "bug-123", "target": "feature-auth", "type": "RELATED_TO"}]
    }
  `;

    try {
        const result = await llm.invoke([new SystemMessage("You are a knowledge graph extractor."), new HumanMessage(prompt)]);
        const text = result.content.toString();

        // Naive JSON parsing cleanup
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonStr);

        // Save to Mongo
        const { knowledgeNodes: nodesCol, knowledgeEdges: edgesCol } = await connectToMongo();

        if (data.nodes?.length) {
            await Promise.all(data.nodes.map((n: any) =>
                nodesCol.updateOne({ id: n.id }, { $set: n }, { upsert: true })
            ));
        }

        if (data.edges?.length) {
            await edgesCol.insertMany(data.edges);
        }

        return {
            knowledgeNodes: data.nodes || [],
            knowledgeEdges: data.edges || []
        };

    } catch (error) {
        console.error("Extraction Error:", error);
        return {};
    }
}

export async function jamboardTaskLinker(state: typeof ProjectState.State) {
    // Logic: Check if the last message or state indicates a Jamboard sticky note conversion
    // For this demo, we assume the 'metadata' of the last message might contain jamboard info
    // or we scan knowledgeNodes for new "Sticky" types.

    const stickies = state.knowledgeNodes.filter(n => n.type === 'Sticky');
    const edges: KnowledgeEdge[] = [];
    const newNodes: KnowledgeNode[] = [];

    const { knowledgeEdges: edgesCol, knowledgeNodes: nodesCol } = await connectToMongo();

    for (const sticky of stickies) {
        // Generate a phantom task ID
        const taskId = `task-${new ObjectId().toHexString()}`;

        // Create Task Node
        const taskNode: KnowledgeNode = {
            id: taskId,
            type: 'KanbanCard',
            content: sticky.content, // inherit content
            metadata: { originalSticky: sticky.id }
        };
        newNodes.push(taskNode);

        // Create Edge
        const edge: KnowledgeEdge = {
            source: sticky.id,
            target: taskId,
            type: 'BECAME_TASK'
        };
        edges.push(edge);

        // Persist
        await nodesCol.updateOne({ id: taskId }, { $set: taskNode }, { upsert: true });
        await edgesCol.insertOne(edge);
    }

    return {
        knowledgeNodes: newNodes,
        knowledgeEdges: edges
    };
}

export async function graphRetriever(state: typeof ProjectState.State) {
    const query = state.intent; // e.g., "Find related docs to bug-123"
    if (!query) return {};

    const { knowledgeEdges: edgesCol } = await connectToMongo();

    // 1. Vector Search (Simulated for this code as we lack Atlas setup commands here)
    // Ideally: 
    // const initialNodes = await nodesCol.aggregate([ { $vectorSearch: ... } ]).toArray();
    // using query to find a starting node.

    // For implementation correctness with provided instructions, we will assume 
    // we found a start node ID from the query string (e.g. if query is a node ID) 
    // or usage of a simple find for this demo.
    const startNodeId = query; // Simplified for demo

    // 2. $graphLookup Aggregation
    const result = await edgesCol.aggregate([
        { $match: { source: startNodeId } },
        {
            $graphLookup: {
                from: "knowledge_edges",
                startWith: "$target",
                connectFromField: "target",
                connectToField: "source",
                as: "related_graph",
                maxDepth: 2,
                depthField: "depth"
            }
        }
    ]).toArray();

    return { searchResults: result };
}
