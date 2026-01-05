class ConfidenceResult:
    def __init__(self, score, level, reasoning, should_hedge, factors):
        self.score = score
        self.level = level
        self.reasoning = reasoning
        self.should_hedge = should_hedge
        self.factors = factors

class ConfidenceAssessor:
    def assess(self, query, context, answer, metadata):
        context_len = len(context)
        num_sources = metadata.get("num_sources", 0)

        # Context coverage (0–1)
        coverage = min(context_len / 5000, 1.0)

        # Source diversity penalty
        source_factor = min(num_sources / 3, 1.0)

        # Uncertainty signals in answer
        uncertainty_markers = [
            "might be",
            "possibly",
            "not sure",
            "unclear",
            "cannot determine",
            "depends"
        ]
        uncertainty_penalty = any(m in answer.lower() for m in uncertainty_markers)

        score = coverage * 0.6 + source_factor * 0.4

        if uncertainty_penalty:
            score *= 0.7

        level = (
            "high" if score >= 0.8
            else "medium" if score >= 0.5
            else "low"
        )

        return ConfidenceResult(
            score=round(score, 2),
            level=level,
            reasoning="Based on context coverage, source diversity, and answer certainty",
            should_hedge=(level != "high"),
            factors={
                "coverage": coverage,
                "sources": source_factor,
                "uncertainty_penalty": uncertainty_penalty
            }
        )
    def get_hedge_phrase(self, level):
        if level == "high":
            return ""
        if level == "medium":
            return "This may not be fully accurate, but "
        return "I might be mistaken, but "

