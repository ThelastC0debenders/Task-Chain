import { ProjectState, KnowledgeNode, KnowledgeEdge } from "./state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { connectToMongo } from "../../config/mongo";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";

// Initialize LLM Lazily
const getLlm = () => new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
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
    You are a Knowledge Graph Extractor for a project management workspace. 
    Your job is to extracted structured data from the following user message.

    Extract the following types of Nodes (Entities):
    - **Decision**: Any choice made (e.g., "Use React", "Approved design").
    - **Feature**: Functionality linked to the project (e.g., "Dark Mode", "Chat").
    - **Bug**: Problems mentioned (e.g., "Login failed").
    - **Tech**: Tools/Libraries (e.g., "Next.js", "MongoDB").
    - **Meeting**: Calendar events or discussions (e.g., "Daily Standup", "Client Call").
    - **Person**: Team members mentioned.

    Extract the following Edges (Relationships):
    - **RELATES_TO**: General connection.
    - **BLOCKED_BY**: Dependency.
    - **SCHEDULED_FOR**: Linking a task/topic to a meeting.
    
    Message: "${lastMessage.content}"
    
    **RULES**:
    1. If the message mentions a technical term, CREATE A NODE for it.
    2. If the message implies a plan, CREATE A NODE for the Goal/Feature.
    3. Return valid JSON only.
    
    Example Input: "We need to fix the login bug by tomorrow's meeting."
    Example Output:
    {
      "nodes": [
        {"id": "bug-login", "type": "Bug", "content": "Login Bug"},
        {"id": "meeting-tomorrow", "type": "Meeting", "content": "Tomorrow's Meeting"}
      ],
      "edges": [
        {"source": "bug-login", "target": "meeting-tomorrow", "type": "SCHEDULED_FOR"}
      ]
    }
  `;

    try {
        const result = await llm.invoke([new SystemMessage("You are a knowledge graph extractor."), new HumanMessage(prompt)]);
        const text = result.content.toString();
        console.log("DEBUG: LLM Raw Output:", text);

        // Naive JSON parsing cleanup
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonStr);
        console.log("DEBUG: Parsed Data:", JSON.stringify(data, null, 2));

        // Save to Mongo
        const { knowledgeNodes: nodesCol, knowledgeEdges: edgesCol } = await connectToMongo();

        if (data.nodes?.length) {
            console.log(`DEBUG: Saving ${data.nodes.length} nodes...`);
            await Promise.all(data.nodes.map((n: any) =>
                nodesCol.updateOne({ id: n.id }, { $set: n }, { upsert: true })
            ));
        } else {
            console.log("DEBUG: No nodes to save.");
        }

        if (data.edges?.length) {
            console.log(`DEBUG: Saving ${data.edges.length} edges...`);
            await edgesCol.insertMany(data.edges);
        } else {
            console.log("DEBUG: No edges to save.");
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
    const { knowledgeEdges: edgesCol, knowledgeNodes: nodesCol } = await connectToMongo();

    let startNodeId = state.intent;

    // Handle generic search intent
    if (startNodeId === "search" && state.knowledgeNodes.length > 0) {
        startNodeId = state.knowledgeNodes[0].id;
    }

    if (!startNodeId || startNodeId === "search") {
        return { searchResults: { nodes: [], edges: [] } };
    }

    console.log(`DEBUG: Graph search starting at node: ${startNodeId}`);

    /**
     * STEP 1: Traverse edges (bidirectional)
     */
    const edgeResults = await edgesCol.aggregate([
        {
            $match: {
                $or: [
                    { source: startNodeId },
                    { target: startNodeId }
                ]
            }
        },
        {
            $graphLookup: {
                from: edgesCol.collectionName, // SAFER than hardcoding
                startWith: "$target",
                connectFromField: "target",
                connectToField: "source",
                as: "related_edges",
                maxDepth: 2,
                depthField: "depth"
            }
        }
    ]).toArray();

    if (!edgeResults.length) {
        return { searchResults: { nodes: [], edges: [] } };
    }

    /**
     * STEP 2: Collect all unique node IDs
     */
    const nodeIds = new Set<string>();
    nodeIds.add(startNodeId);

    const allEdges: any[] = [];

    for (const doc of edgeResults) {
        if (doc.source) nodeIds.add(doc.source);
        if (doc.target) nodeIds.add(doc.target);
        allEdges.push({ source: doc.source, target: doc.target, type: doc.type });

        for (const e of doc.related_edges || []) {
            nodeIds.add(e.source);
            nodeIds.add(e.target);
            allEdges.push({ source: e.source, target: e.target, type: e.type });
        }
    }

    /**
     * STEP 3: Fetch actual nodes
     */
    const nodes = await nodesCol.find({
        id: { $in: Array.from(nodeIds) }
    }).toArray();

    return {
        searchResults: {
            nodes,
            edges: allEdges
        }
    };
}
