export interface AuditResult {
    score: number
    issues: {
        severity: "low" | "medium" | "high" | "critical"
        message: string
        line?: string
    }[]
    summary: string
}

export function analyzeCode(diff: string): AuditResult {
    const issues: AuditResult["issues"] = []
    let score = 100

    if (!diff) {
        return { score: 100, issues: [], summary: "No changes to analyze." }
    }

    const lines = diff.split("\n")

    for (const line of lines) {
        // Only look at added lines
        if (!line.startsWith("+")) continue

        const content = line.substring(1).toLowerCase()

        if (content.includes("console.log")) {
            issues.push({ severity: "low", message: "Debug statement found: console.log", line: line.substring(1).trim() })
            score -= 5
        }

        if (content.includes("todo") || content.includes("fixme")) {
            issues.push({ severity: "low", message: "Pending task comment found", line: line.substring(1).trim() })
            score -= 2
        }

        if (content.match(/password|secret|apikey|bearer/)) {
            // Simple heuristic for hardcoded secrets
            if (content.includes("process.env")) {
                // Likely safe
            } else {
                issues.push({ severity: "critical", message: "Possible hardcoded secret detected", line: line.substring(1).trim() })
                score -= 20
            }
        }

        if (content.includes("any")) {
            issues.push({ severity: "medium", message: "Avoid using 'any' type", line: line.substring(1).trim() })
            score -= 5
        }
    }
//cap score
    // Cap score
    score = Math.max(0, Math.min(100, score))

    let summary = "Code looks great! Ready to merge."
    if (score < 80) summary = "Several issues found. Please review."
    if (score < 50) summary = "Critical issues detected. Do not merge."

    return { score, issues, summary }
}
