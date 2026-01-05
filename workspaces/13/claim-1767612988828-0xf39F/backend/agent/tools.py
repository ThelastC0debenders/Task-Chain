import os
from dotenv import load_dotenv
from llm.gemini_client import GeminiClient

load_dotenv()

class Tools:
    def __init__(self):
        self.llm = GeminiClient()
    def llm_summarize(self, query: str, context: str) -> str:
        prompt = f"""
            You are a senior software engineer.

            Task:
            Summarize the following retrieved code context for the user query.

            User query:     
            {query}

            Retrieved context (may include multiple files):
            {context[:3000]}

            Rules:
            - Focus on the main functionality and structure
            - Do NOT invent files or behavior
            - If context is noisy or mixed, summarize the dominant purpose
            - If context does not clearly answer the query, say so
            - Output plain text (no JSON)
        """

        return self.llm.generate(prompt)


    def extract_key_points(self, text: str, num_points: int):
        lines = [l for l in text.split("\n") if l.strip()]
        return lines[:num_points]

    def extract_changes(self, text: str):
        changes = []
        for line in text.split("\n"):
            if line.startswith("+"):
                changes.append({"type": "add", "file": "unknown"})
            elif line.startswith("-"):
                changes.append({"type": "remove", "file": "unknown"})
        return changes

    def compare_versions(self, old: str, new: str):
        return "Differences detected" if old != new else "No differences"

    def express_uncertainty(self, query: str, context: str, reason: str):
        return f"I may be mistaken, but {reason.lower()}.\n\n"
