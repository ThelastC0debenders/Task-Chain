import React, { useState, useEffect } from 'react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import * as graphService from "../services/graph"

const GraphDebugger = () => {
    const [jsonInput, setJsonInput] = useState("{}");
    const [parsedData, setParsedData] = useState<graphService.GraphData>({ knowledgeNodes: [], knowledgeEdges: [] });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        loadGraph(showCalendar)
    }, [showCalendar]) // Reload when toggle changes

    const loadGraph = async (showCal: boolean) => {
        try {
            const data = await graphService.getGraph(showCal)
            setParsedData(data)
            setJsonInput(JSON.stringify(data, null, 2))
        } catch (e: any) {
            setError(e.message)
        }
    }

    const handleSync = async () => {
        setIsLoading(true)
        try {
            await graphService.syncCalendar()
            if (!showCalendar) setShowCalendar(true) // Auto-enable view
            else await loadGraph(true) // Just reload if already enabled
        } catch (e: any) {
            setError("Sync failed: " + e.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setJsonInput(newVal);
        try {
            const parsed = JSON.parse(newVal);
            if (parsed.knowledgeNodes) { // Loose validation
                setParsedData(parsed);
                setError(null);
            }
        } catch (err) {
            // silent invalid json
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'monospace' }}>
            {/* Sidebar Editor */}
            <div style={{
                width: '350px',
                borderRight: '1px solid #333',
                background: '#111',
                color: '#eee',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '15px', background: '#222', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span>GRAPH DB</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => loadGraph(showCalendar)} style={{ cursor: 'pointer', fontSize: '10px' }}>RELOAD</button>
                            <button onClick={handleSync} disabled={isLoading} style={{ cursor: 'pointer', fontSize: '10px', color: isLoading ? 'yellow' : 'white' }}>
                                {isLoading ? 'SYNC...' : 'SYNC CAL'}
                            </button>
                        </div>
                    </div>
                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px', gap: '5px' }}>
                        <input
                            type="checkbox"
                            id="showCal"
                            checked={showCalendar}
                            onChange={(e) => setShowCalendar(e.target.checked)}
                        />
                        <label htmlFor="showCal" style={{ cursor: 'pointer' }}>Show Calendar History</label>
                    </div>
                </div>
                {error && (
                    <div style={{ padding: '10px', background: '#400', color: '#fff', fontSize: '11px' }}>
                        {error}
                    </div>
                )}
                <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                        value={jsonInput}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            height: '100%',
                            background: '#111',
                            color: '#0f0',
                            border: 'none',
                            padding: '15px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            resize: 'none',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* Main Visualization Area */}
            <div style={{ flex: 1, position: 'relative' }}>
                <KnowledgeGraph
                    nodes={parsedData.knowledgeNodes}
                    edges={parsedData.knowledgeEdges || []}
                />
            </div>
        </div>
    );
};

export default GraphDebugger;
