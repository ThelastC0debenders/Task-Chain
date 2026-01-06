import { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

export interface KnowledgeNode {
    id: string;
    type: string;
    content: string;
    metadata?: Record<string, any>;
}

export interface KnowledgeEdge {
    source: string;
    target: string;
    type: "ROOT_CAUSE_OF" | "DEBATED_IN" | "DECIDED_IN" | "BECAME_TASK" | "EVOLVED_FROM" | "RELATED_TO";
    metadata?: Record<string, any>;
}

export const ProjectState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),
    knowledgeNodes: Annotation<KnowledgeNode[]>({
        reducer: (curr, update) => [...curr, ...update],
        default: () => [],
    }),
    knowledgeEdges: Annotation<KnowledgeEdge[]>({
        reducer: (curr, update) => [...curr, ...update],
        default: () => [],
    }),
    // Temporary field to trigger search or linking
    intent: Annotation<string | null>({
        reducer: (curr, update) => update,
        default: () => null,
    }),
    // For search results
    searchResults: Annotation<any[]>({
        reducer: (curr, update) => update,
        default: () => [],
    })
});
