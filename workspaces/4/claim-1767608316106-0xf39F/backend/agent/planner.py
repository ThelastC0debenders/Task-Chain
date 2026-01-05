class Plan:
    def __init__(self, strategy, tools_needed, reasoning, confidence_threshold):
        self.strategy = strategy
        self.tools_needed = tools_needed
        self.reasoning = reasoning
        self.confidence_threshold = confidence_threshold


class Planner:
    def plan(self, query: str, context: str, metadata: dict) -> Plan:
        quality = metadata.get("context_quality", "limited")

        if quality == "limited":
            return Plan("uncertain", ["express_uncertainty"], "Context limited", 0.4)

        if "summary" in query.lower() or "summarize" in query.lower():
            return Plan(
                "summarize",
                ["llm_summarize"],   # 🔁 new tool
                "LLM-based summary requested",
                0.7
            )

        if "change" in query.lower():
            return Plan("explain_change", ["extract_changes"], "Change explanation", 0.75)

        return Plan("direct", [], "Direct answer", 0.8)
