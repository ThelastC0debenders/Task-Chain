import { useState } from "react";
import axios from "axios";
import { Send, Share2, Database } from "lucide-react";

const GraphDebugger = () => {
    const [input, setInput] = useState("");
    const [intent, setIntent] = useState("context");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input) return;
        setLoading(true);
        try {
            // Adjust port if needed, assuming backend runs on 5001 based on .env
            const res = await axios.post("http://localhost:5001/graph/chat", {
                message: input,
                intent: intent
            });
            setResult(res.data);
        } catch (error) {
            console.error(error);
            setResult({ error: "Failed to fetch from graph API" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 bg-gray-50 min-h-screen text-gray-800 font-sans">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-indigo-600">
                <Share2 /> Knowledge Graph Debugger
            </h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
                <div className="flex gap-4 mb-4">
                    <input
                        className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Type a message (e.g. 'We decided to use MongoDB for storage')"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <select
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                        value={intent}
                        onChange={e => setIntent(e.target.value)}
                    >
                        <option value="context">Extract Context</option>
                        <option value="search">Search Graph</option>
                    </select>
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? "Processing..." : <><Send size={18} /> Send</>}
                    </button>
                </div>

                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm min-h-[300px] overflow-auto">
                    {result ? (
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                    ) : (
                        <div className="text-gray-500 italic flex flex-col items-center justify-center h-full gap-2">
                            <Database size={24} />
                            <span>Graph response will appear here...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GraphDebugger;
