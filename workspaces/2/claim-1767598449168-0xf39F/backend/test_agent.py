# test_agent.py

from agent.agent import DevAgent


def main():
    print("\n" + "=" * 80)
    print("🧪 TESTING LANGGRAPH DEV AGENT")
    print("=" * 80)

    agent = DevAgent()

    while True:
        try:
            query = input("\n❓ Ask a question (or type 'exit'): ").strip()

            if query.lower() in {"exit", "quit"}:
                print("\n👋 Exiting test runner.")
                break

            result = agent.answer_question(query, verbose=True)

            print("\n" + "-" * 80)
            print("🧠 FINAL ANSWER")
            print("-" * 80)
            print(result["answer"])

            print("\n📊 CONFIDENCE")
            print(f"Score   : {result['confidence']:.2%}")
            print(f"Level   : {result['confidence_level']}")
            print(f"Strategy: {result['strategy']}")

        except KeyboardInterrupt:
            print("\n\n⛔ Interrupted by user. Exiting.")
            break

        except Exception as e:
            print("\n❌ ERROR DURING EXECUTION")
            print(e)
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
