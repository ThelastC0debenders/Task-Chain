import { Router } from "express";
import { graph } from "../services/graph/workflow";
import { HumanMessage } from "@langchain/core/messages";

const router = Router();

router.post("/chat", async (req, res) => {
    try {
        const { message, history } = req.body;
        // history could be passed as state messages

        // For simplicity, we just take the new message and assume stateless or limited history for now
        // In a real app, you'd load conversation history
        const input = {
            messages: [new HumanMessage(message)],
            intent: req.body.intent // e.g. "search"
        };

        const result = await graph.invoke(input);

        // Extract useful output
        // The state has "messages" (response from LLM presumably if we added a response node, 
        // but here we only have contextExtractor etc.)
        // We should probably return the "knowledgeNodes" or "searchResults"

        res.json({
            graphState: result
        });
    } catch (error) {
        console.error("Graph Error:", error);
        res.status(500).json({ error: "Graph processing failed" });
    }
});

export default router;
