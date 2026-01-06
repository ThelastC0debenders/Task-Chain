import { StateGraph, END, START } from "@langchain/langgraph";
import { ProjectState } from "./state";
import { contextExtractor, jamboardTaskLinker, graphRetriever } from "./nodes";

// Checks conditional edge
function shouldLink(state: typeof ProjectState.State) {
    if (state.intent === "search") {
        return "graphRetriever";
    }
    // If recent message implies jamboard action
    const lastMsg = state.messages[state.messages.length - 1];
    const content = typeof lastMsg?.content === 'string' ? lastMsg.content : "";
    if (content.includes("created sticky")) {
        return "jamboardTaskLinker";
    }

    return END;
}

const workflow = new StateGraph(ProjectState)
    .addNode("contextExtractor", contextExtractor)
    .addNode("jamboardTaskLinker", jamboardTaskLinker)
    .addNode("graphRetriever", graphRetriever)

    .addEdge(START, "contextExtractor") // Default start
    // Logic: 
    // We can actually have a router at start or after extraction
    // Here we simplify: Always extract context, then maybe link or stop.

    .addConditionalEdges(
        "contextExtractor",
        shouldLink,
        {
            jamboardTaskLinker: "jamboardTaskLinker",
            graphRetriever: "graphRetriever",
            [END]: END
        }
    )
    .addEdge("jamboardTaskLinker", END)
    .addEdge("graphRetriever", END);

export const graph = workflow.compile();
