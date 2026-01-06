import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

// Lazy initialization
const getLlm = () => new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    maxOutputTokens: 1024,
});

export async function analyzeWhiteboardImage(base64Image: string) {
    try {
        const llm = getLlm();

        // Remove header if present (e.g., "data:image/png;base64,")
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const message = new HumanMessage({
            content: [
                {
                    type: "text",
                    text: `You are a Project Management AI Assistant. Analyze this whiteboard sketch.
                    
                    Determine if the user has drawn:
                    1. A **Kanban Board** (columns like To Do, Doing, Done).
                    2. A **Specific Task** (a note or shape describing a piece of work).
                    3. A **User Flow** or Diagram.
                    
                    Return a JSON object ONLY with this structure:
                    {
                        "type": "kanban" | "task" | "flow" | "unknown",
                        "confidence": number (0-1),
                        "data": {
                            "title": string (suggested title),
                            "description": string (summary of content),
                            "columns": string[] (if kanban, e.g. ["To Do", "Done"]),
                            "steps": string[] (if flow)
                        }
                    }
                    
                    Do not return markdown formatting, just the raw JSON string.`
                },
                {
                    type: "image_url",
                    image_url: `data:image/png;base64,${cleanBase64}`
                }
            ]
        });

        const result = await llm.invoke([message]);
        const text = result.content.toString().replace(/```json/g, "").replace(/```/g, "").trim();

        console.log("DEBUG: Whiteboard Analysis Result:", text);

        return JSON.parse(text);

    } catch (error) {
        console.error("Whiteboard Analysis Error:", error);
        return { type: "unknown", confidence: 0, error: "Failed to analyze image" };
    }
}
