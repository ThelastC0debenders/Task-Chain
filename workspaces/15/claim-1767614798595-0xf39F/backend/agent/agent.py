# from pathway_engine.query.retriever import PathwayRetriever
# from pathway_engine.query.context_builder import ContextBuilder
# from llm.gemini_client import GeminiClient
# demo
# class DevAgent:
#     def __init__(self):
#         self.retriever = PathwayRetriever()
#         self.builder = ContextBuilder()
#         self.llm = GeminiClient()
#its working
#     def answer_question(self, user_query: str):
#         # 1. Retrieve
#         raw_docs = self.retriever.retrieve(user_query)
        
#         # 2. Build Context
#         context = self.builder.build_prompt_context(raw_docs)

#         # 🔥 DEBUG: Print the first 500 characters of context
#         # print("\n--- [DEBUG] CONTEXT SENT TO GEMINI ---")
#         # print(context[:500] if context else "⚠️ CONTEXT IS EMPTY!")
#         # print("--------------------------------------\n")

#         # ✅ FIX: Proper indentation - exit early if no context
#         if not context or context.strip() == "":
#             return "I found relevant files, but they appear to be empty or unreadable."
        
#         # ✅ This is now at the correct indentation level
#         # 3. ASK GEMINI
#         system_msg = "You are a 'Live Code Agent'. Answer only using the provided snippets. If unsure, say 'The current codebase state doesn't specify this'."
        
#         full_prompt = f"User Question: {user_query}\n\nLive Context:\n{context}"
        
#         return self.llm.generate(full_prompt, system_instruction=system_msg)

# # Test it
# if __name__ == "__main__":
#     agent = DevAgent()
#     print("Agent Result:", agent.answer_question("How is the file loading handled?"))

# agent.py
"""
DevAgent - LangGraph-based Agentic System
"""

from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage

import operator
import operator
import json
import re

from pathway_engine.query.retriever import PathwayRetriever
from pathway_engine.query.context_builder import ContextBuilder
from llm.gemini_client import GeminiClient
from agent.planner import Planner
from agent.tools import Tools
from agent.confidence import ConfidenceAssessor


# ============================================================================
# STATE DEFINITION
# ============================================================================


class AgentState(TypedDict):
    query: str

    explanation: str
    code: str
    instruction: str

    raw_docs: list
    context: str
    metadata: dict

    strategy: str
    plan_reasoning: str
    tools_needed: list

    tool_results: dict

    answer: str

    confidence_score: float
    confidence_level: str
    confidence_reasoning: str
    should_hedge: bool

    final_answer: str

    messages: Annotated[list, operator.add]


# ============================================================================
# AGENT
# ============================================================================

class DevAgent:
    def __init__(self):
        self.retriever = PathwayRetriever()
        self.builder = ContextBuilder()
        self.llm = GeminiClient()
        self.planner = Planner()
        self.tools = Tools()
        self.confidence_assessor = ConfidenceAssessor()

        self.graph = self._build_graph()

        print("[AGENT] 🤖 LangGraph DevAgent initialized")
        print("[AGENT] 📊 Graph structure:")
        print("[AGENT]    observe → plan → route → [tools] → generate → assess → format")

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        workflow.add_node("observe", self.observe_node)
        workflow.add_node("plan", self.plan_node)
        workflow.add_node("use_tools", self.tools_node)
        workflow.add_node("generate", self.generate_node)
        workflow.add_node("assess_confidence", self.assess_node)
        workflow.add_node("format_output", self.format_node)

        workflow.set_entry_point("observe")
        workflow.add_edge("observe", "plan")

        workflow.add_conditional_edges(
            "plan",
            self.should_use_tools,
            {
                "use_tools": "use_tools",
                "skip_tools": "generate"
            }
        )

        workflow.add_edge("use_tools", "generate")
        workflow.add_edge("generate", "assess_confidence")
        workflow.add_edge("assess_confidence", "format_output")
        workflow.add_edge("format_output", END)

        return workflow.compile()

    # ========================= NODES =========================

    def observe_node(self, state: AgentState) -> AgentState:
        print("\n" + "="*70)
        print("🔍 STEP 1: OBSERVE")
        print("="*70)
        print(f"📝 Query: {state['query']}")

        print("🔎 Retrieving relevant documents...")
        raw_docs = self.retriever.retrieve(state['query'])

        print("📚 Building context from documents...")
        context = self.builder.build_prompt_context(raw_docs)

        metadata = {
            "num_sources": len(raw_docs),
            "total_chars": len(context),
            "context_quality": "good" if len(context) > 500 else "limited"
        }

        print(f"✅ Retrieved {metadata['num_sources']} sources ({metadata['total_chars']} chars)")
        print(f"📊 Context quality: {metadata['context_quality']}")
        print(f"📄 Preview: {context[:150]}...")

        return {
            **state,
            "raw_docs": raw_docs,
            "context": context,
            "metadata": metadata,
            "messages": [f"[OBSERVE] Retrieved {len(raw_docs)} sources"]
        }

    def plan_node(self, state: AgentState) -> AgentState:
        print("\n" + "="*70)
        print("🧠 STEP 2: PLAN")
        print("="*70)

        print("🤔 Analyzing query type and context quality...")
        plan = self.planner.plan(
            query=state['query'],
            context=state['context'],
            metadata=state['metadata']
        )

        print(f"📋 Strategy selected: {plan.strategy}")
        print(f"🛠️  Tools needed: {plan.tools_needed if plan.tools_needed else 'None'}")
        print(f"💡 Reasoning: {plan.reasoning}")
        print(f"🎯 Confidence threshold: {plan.confidence_threshold:.2f}")

        return {
            **state,
            "strategy": plan.strategy,
            "plan_reasoning": plan.reasoning,
            "tools_needed": plan.tools_needed,
            "messages": [f"[PLAN] Strategy: {plan.strategy}"]
        }

    def should_use_tools(self, state: AgentState) -> Literal["use_tools", "skip_tools"]:
        if state['tools_needed']:
            print("\n🔀 ROUTING: Tools needed → use_tools")
            return "use_tools"
        else:
            print("\n🔀 ROUTING: No tools needed → skip_tools")
            return "skip_tools"

    def tools_node(self, state: AgentState) -> AgentState:
        print("\n" + "="*70)
        print("🛠️  STEP 3: USE TOOLS")
        print("="*70)

        tool_results = {}

        for tool_name in state['tools_needed']:
            print(f"\n⚙️  Executing tool: {tool_name}")

            if tool_name == "llm_summarize":
                result = self.tools.llm_summarize(
                    state["query"],
                    state["context"]
                )
                tool_results["summary"] = result

            elif tool_name == "extract_key_points":
                result = self.tools.extract_key_points(state['context'], 5)
                tool_results['key_points'] = result

            elif tool_name == "extract_changes":
                result = self.tools.extract_changes(state['context'])
                tool_results['changes'] = result

            elif tool_name == "compare_versions":
                sources = state['context'].split("FILE #")[1:]
                if len(sources) >= 2:
                    result = self.tools.compare_versions(sources[0], sources[1])
                    tool_results['comparison'] = result

            elif tool_name == "express_uncertainty":
                result = self.tools.express_uncertainty(
                    state['query'],
                    state['context'],
                    state['plan_reasoning']
                )
                tool_results['uncertainty_response'] = result

        return {
            **state,
            "tool_results": tool_results,
            "messages": [f"[TOOLS] Executed {len(state['tools_needed'])} tools"]
        }

    def generate_node(self, state: AgentState) -> AgentState:
        print("\n" + "="*70)
        print("💬 STEP 4: GENERATE")
        print("="*70)

        strategy = state['strategy']

        if strategy == "summarize" and "summary" in state.get("tool_results", {}):
            answer = state["tool_results"]["summary"]

            return {
                **state,
                "answer": answer,
                "explanation": answer,
                "code": "",
                "instruction": "",
                "messages": ["[GENERATE] Summary from Gemini tool"]
            }

        if strategy == "uncertain" and "uncertainty_response" in state.get('tool_results', {}):
            answer = state['tool_results']['uncertainty_response']
            code = ""
            instruction = ""
        else:
            prompt = f"""User Question: {state['query']}

Live Context:
{state['context'][:2000]}

You are a technical expert. Provide a structured response.
Respond ONLY in valid JSON format with the following keys:
- "explanation": The main answer text (can use Markdown).
- "code": Relevant code snippets from the context or generated examples.
- "instruction": Specific action items, warnings, or next steps.

Ensure the JSON is valid and properly escaped.
"""
            raw_answer = self.llm.generate(prompt)
            
            # Attempt to parse JSON
            try:
                # Clean up potential markdown fences
                clean_json = raw_answer.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)
                answer = data.get("explanation", raw_answer)
                code = data.get("code", "")
                instruction = data.get("instruction", "")
            except Exception as e:
                print(f"[GENERATE] ⚠️ JSON parse failed: {e}. Fallback to raw text.")
                answer = raw_answer
                code = ""
                instruction = ""

        print(f"✅ Answer generated ({len(answer)} chars)")
        return {
            **state,
            "answer": answer,
            "explanation": answer,
            "code": code,
            "instruction": instruction,
            "messages": [f"[GENERATE] Generated structured response"]
        }

    def assess_node(self, state: AgentState) -> AgentState:
        print("\n" + "="*70)
        print("📊 STEP 5: ASSESS CONFIDENCE")
        print("="*70)

        confidence = self.confidence_assessor.assess(
            state['query'],
            state['context'],
            state['answer'],
            state['metadata']
        )
        print(f"🔍 Confidence score: {confidence.score:.2%} ({confidence.level})")
        print(f"📝 Reasoning: {confidence.reasoning}")
        print(f"⚠️  Should hedge: {'Yes' if confidence.should_hedge else 'No'}")
        print("✅ Confidence assessment complete")

        return {
            **state,
            "confidence_score": confidence.score,
            "confidence_level": confidence.level,
            "confidence_reasoning": confidence.reasoning,
            "should_hedge": confidence.should_hedge,
            "messages": [f"[ASSESS] Confidence: {confidence.score:.2%}"]
        }

    def format_node(self, state: AgentState) -> AgentState:
        print("\n" + "="*70)
        print("✨ STEP 6: FORMAT OUTPUT")
        print("="*70)

        if state['should_hedge']:
            hedge = self.confidence_assessor.get_hedge_phrase(state['confidence_level'])
            final_answer = hedge + state['answer']
        else:
            final_answer = state['answer']

        return {
            **state,
            "final_answer": final_answer,
            "messages": ["[FORMAT] Output finalized"]
        }

    # ========================= PUBLIC =========================

    def answer_question(self, query: str, verbose: bool = True) -> dict:
        initial_state = {"query": query, "messages": []}
        final_state = self.graph.invoke(initial_state)

        result = {
            "explanation": final_state.get('explanation', final_state['final_answer']),
            "code": final_state.get('code', ''),
            "instruction": final_state.get('instruction', ''),
            "confidence": final_state['confidence_score'],
            "confidence_level": final_state['confidence_level'],
            "strategy": final_state['strategy'],
            "metadata": {
                "num_sources": final_state['metadata']['num_sources'],
                "tools_used": list(final_state.get('tool_results', {}).keys()),
                "confidence_factors": final_state.get('confidence_reasoning', '')
            },
            "sources": [],
            "trace": final_state['messages'] if verbose else []
        }

        # ✅ NOW populate sources BEFORE returning
        for i, doc in enumerate(final_state.get('raw_docs', [])):
            print(f"\n[SOURCES DEBUG] Doc #{i} type:", type(doc))
            if isinstance(doc, dict):
                print("[SOURCES DEBUG] Dict keys:", doc.keys())
                print("[SOURCES DEBUG] Metadata:", doc.get("metadata"))
                content = doc.get('text', doc.get('page_content', ''))
                meta = doc.get('metadata', {})
            else:
                print("[SOURCES DEBUG] page_content exists:", hasattr(doc, "page_content"))
                print("[SOURCES DEBUG] metadata exists:", hasattr(doc, "metadata"))
                print("[SOURCES DEBUG] metadata value:", getattr(doc, "metadata", None))
                content = getattr(doc, 'page_content', '')
                meta = getattr(doc, 'metadata', {})

            file_name = meta.get('path', 'unknown')
            chunk_id = meta.get('chunk_id', '?')

            result["sources"].append({
                "file": file_name,
                "lines": f"Chunk {chunk_id}",
                "text": content[:120] + "..."
            })

        return result
        #hello
# demo work