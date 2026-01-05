import re
from collections import defaultdict
from typing import List


class ContextBuilder:
    def build_prompt_context(self, raw_docs: List[dict]) -> str:
        if not raw_docs:
            return ""

        grouped = defaultdict(list)

        # -------------------------
        # GROUP BY FILE
        # -------------------------
        for doc in raw_docs:
            text = doc.get("text", "").strip()
            path = self._extract_file_path(text) or "unknown"
            grouped[path].append(text)

        # -------------------------
        # BUILD CONTEXT
        # -------------------------
        parts = [
            "Here are the most relevant snippets from the LIVE codebase.",
            "Snippets are grouped by file to preserve structure.\n"
        ]

        for file_path, chunks in grouped.items():
            parts.append(f"FILE: {file_path}")

            for i, chunk in enumerate(chunks, 1):
                parts.append(f"```")
                parts.append(chunk)
                parts.append(f"```")

            parts.append("")  # spacing

        return "\n".join(parts)

    # =========================
    # FILE PATH EXTRACTION
    # =========================
    def _extract_file_path(self, text: str) -> str:
        """
        Handles:
        - # File: path
        - File path:
        - Source:
        - watched_folder/.../file.ext
        """
        patterns = [
            r'#\s*[Ff]ile:\s*(.+)',
            r'[Ff]ile\s*[Pp]ath:\s*(.+)',
            r'[Ss]ource:\s*(.+)',
            r'(watched_folder/[^\s"\']+\.[a-zA-Z0-9]+)',
            r'([\w\-/]+\.(py|js|ts|md|json|yaml|yml|txt))',
        ]

        for p in patterns:
            m = re.search(p, text[:300])
            if m:
                return m.group(1).strip()

        return None
