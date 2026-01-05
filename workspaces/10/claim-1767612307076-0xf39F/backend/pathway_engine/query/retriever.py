import re
from typing import List, Optional
from pathway.xpacks.llm.vector_store import VectorStoreClient


class PathwayRetriever:
    def __init__(self, host="127.0.0.1", port=8765):
        self.client = VectorStoreClient(host=host, port=port)

    # =========================
    # PUBLIC ENTRY
    # =========================
    def retrieve(self, query: str, k: int = 5) -> List[dict]:
        print(f"[RETRIEVER] Searching for: '{query}'")

        file_intent = self._detect_file_intent(query)

        # 🔒 STRONG FILE INTENT → HARD LOCK
        if file_intent:
            print(f"[RETRIEVER] 🎯 File intent detected: {file_intent}")

            results = self.client.query(query, k=k * 6)
            locked = self._lock_to_file(results, file_intent)

            if locked:
                print(f"[RETRIEVER] 🔒 Locked to {file_intent} ({len(locked)} chunks)")
                self._debug_results(locked)
                return locked[:k]

            print(f"[RETRIEVER] ⚠️ File intent detected but no clean match. Falling back carefully.")

        # 🧠 SOFT SEMANTIC SEARCH
        results = self.client.query(query, k=k)
        print(f"[RETRIEVER] ✅ Semantic results: {len(results)}")
        self._debug_results(results)
        return results

    # =========================
    # FILE INTENT DETECTION
    # =========================
    def _detect_file_intent(self, query: str) -> Optional[str]:
        """
        Detects explicit or implicit file references.
        """
        q = query.lower()

        # Explicit filenames
        explicit = re.findall(r'\b([\w\-/]+\.[a-z0-9]+)\b', q)
        if explicit:
            return explicit[0]

        # Common implicit files
        implicit_map = {
            "readme": "README.md",
            "license": "LICENSE",
            "dockerfile": "Dockerfile",
            "makefile": "Makefile",
            "package json": "package.json",
            "requirements": "requirements.txt",
        }

        for key, fname in implicit_map.items():
            if key in q:
                return fname

        return None

    # =========================
    # FILE LOCKING
    def _lock_to_file(self, results: list, target: str) -> list:
        target_lower = target.lower()
        locked = []

        for r in results:
            meta = r.get("metadata", {})
            path = meta.get("path", "").lower()

            # HARD GUARANTEE: match only real file origin
            if path.endswith(target_lower):
                locked.append(r)

        return locked

    def _matches_file(self, text: str, target: str) -> bool:
        """
        Robust file matching:
        - full path
        - basename
        - quoted
        - header-style markers
        """
        base = target.split("/")[-1]

        patterns = [
            rf'file:\s*.*{re.escape(base)}',
            rf'["\'].*{re.escape(base)}["\']',
            rf'\b{re.escape(base)}\b',
            rf'\b{re.escape(base.replace(".md", ""))}\b',
        ]

        return any(re.search(p, text) for p in patterns)

    # =========================
    # DEBUGGING
    # =========================
    def _debug_results(self, results: List[dict], limit: int = 3):
        if not results:
            return

        print(f"\n[RETRIEVER DEBUG] Showing top {min(limit, len(results))} results")
        for i, r in enumerate(results[:limit]):
            text = r.get("text", "")
            dist = r.get("dist", "N/A")

            file_match = re.search(r'FILE.*?:\s*(.+?)(?:\n|```)', text)
            file_name = file_match.group(1) if file_match else "unknown"

            print(f"  #{i+1} → {file_name} (dist={dist})")
