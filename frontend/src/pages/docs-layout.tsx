import { useEffect, useState } from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import * as docsService from "../services/docs"
import { socket } from "../services/socket"
import { FileText, Save, Plus, File, Shield } from "lucide-react"

const DocsLayout = () => {
    const [docs, setDocs] = useState<any[]>([])
    const [activeDoc, setActiveDoc] = useState<any | null>(null)
    const [content, setContent] = useState("")

    useEffect(() => {
        loadDocs()
    }, [])

    useEffect(() => {
        if (activeDoc) {
            setContent(activeDoc.content)
        }
    }, [activeDoc])

    const loadDocs = async () => {
        try {
            const list = await docsService.getDocs()
            setDocs(list)
            if (list.length > 0 && !activeDoc) setActiveDoc(list[0])
        } catch (e) { console.error(e) }
    }

    const handleCreate = async () => {
        const title = prompt("Doc Title:")
        if (title) {
            const doc = await docsService.createDoc(title)
            loadDocs()
            setActiveDoc(doc)
        }
    }

    const handleSave = async () => {
        if (activeDoc) {
            await docsService.updateDoc(activeDoc.id, content)
            alert("Saved!")
        }
    }

    useEffect(() => {
        if (activeDoc?.id) {
            socket.emit("join_doc", activeDoc.id)
            console.log("Joined doc room:", activeDoc.id)
        }
    }, [activeDoc?.id])

    useEffect(() => {
        socket.on("doc_updated", (data: { docId: string, content: string }) => {
            if (activeDoc && data.docId === activeDoc.id) {
                if (data.content !== content) {
                    setContent(data.content)
                }
            }
        })
        return () => { socket.off("doc_updated") }
    }, [activeDoc, content])

    const handleChange = (val: string, delta: any, source: string) => {
        setContent(val)
        if (source === 'user' && activeDoc) {
            socket.emit("doc_change", { docId: activeDoc.id, content: val })
        }
    }

    return (
        <div style={styles.container}>
            {/* Quill Dark Mode Overrides */}
            <style>{`
                .ql-toolbar {
                    background: #080808;
                    border-color: #1a1a1a !important;
                    color: #e0e0e0;
                    border-top-left-radius: 6px;
                    border-top-right-radius: 6px;
                }
                .ql-container {
                    background: #050505;
                    border-color: #1a1a1a !important;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 14px;
                    color: #e0e0e0;
                    border-bottom-left-radius: 6px;
                    border-bottom-right-radius: 6px;
                }
                .ql-editor {
                    min-height: 600px;
                }
                .ql-stroke {
                    stroke: #e0e0e0 !important;
                }
                .ql-fill {
                    fill: #e0e0e0 !important;
                }
                .ql-picker {
                    color: #e0e0e0 !important;
                }
                .ql-picker-options {
                    background-color: #080808 !important;
                    border-color: #1a1a1a !important;
                }
                .ql-picker-option {
                    color: #e0e0e0 !important;
                }
            `}</style>

            {/* Sidebar */}
            <div style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <Shield size={16} color="#00ff88" />
                    <span>TEAM WIKI</span>
                </div>
                <div style={{ padding: '0 15px 15px 15px' }}>
                    <button onClick={handleCreate} style={styles.newDocBtn}>
                        <Plus size={14} /> NEW DOCUMENT
                    </button>
                </div>
                <div style={styles.docList}>
                    {docs.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => setActiveDoc(doc)}
                            style={{
                                ...styles.docItem,
                                ...(activeDoc?.id === doc.id ? styles.docItemActive : {})
                            }}
                        >
                            <FileText size={14} color={activeDoc?.id === doc.id ? "#00ff88" : "#666"} />
                            <span style={styles.docTitle}>{doc.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                {activeDoc ? (
                    <>
                        <div style={styles.header}>
                            <div>
                                <div style={styles.docMeta}>DOCUMENTATION // V1.0</div>
                                <div style={styles.headerTitle}>
                                    {activeDoc.title}
                                </div>
                            </div>
                            <button onClick={handleSave} style={styles.saveBtn}>
                                <Save size={16} /> SAVE CHANGES
                            </button>
                        </div>
                        <div style={styles.editorWrapper}>
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={handleChange}
                                style={{ height: '100%' }}
                            />
                        </div>
                    </>
                ) : (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>
                            <File size={40} strokeWidth={1} />
                        </div>
                        <h3>Select a document</h3>
                        <p>Choose a file from the sidebar to view or edit</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const styles: any = {
    container: {
        height: '100vh',
        display: 'flex',
        backgroundColor: '#050505',
        color: '#e0e0e0',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    },
    sidebar: {
        width: '280px',
        backgroundColor: '#080808',
        borderRight: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
    },
    sidebarHeader: {
        height: '70px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 20px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '20px',
    },
    newDocBtn: {
        width: '100%',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        border: '1px solid #00ff88',
        color: '#00ff88',
        padding: '10px',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        transition: 'all 0.2s',
        marginBottom: '10px',
        fontFamily: 'inherit',
    },
    docList: {
        flex: 1,
        padding: '0 10px',
        overflowY: 'auto',
    },
    docItem: {
        padding: '10px 12px',
        cursor: 'pointer',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '4px',
        color: '#888',
        fontSize: '13px',
        transition: 'all 0.2s',
        border: '1px solid transparent',
    },
    docItemActive: {
        backgroundColor: 'rgba(0, 255, 136, 0.05)',
        color: '#fff',
        border: '1px solid rgba(0, 255, 136, 0.1)',
    },
    docTitle: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#050505',
    },
    header: {
        height: '70px',
        padding: '0 30px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#080808',
    },
    docMeta: {
        fontSize: '10px',
        color: '#00ff88',
        marginBottom: '4px',
        letterSpacing: '1px',
    },
    headerTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#fff',
        lineHeight: 1,
    },
    saveBtn: {
        backgroundColor: '#00ff88',
        color: '#000',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'inherit',
    },
    editorWrapper: {
        flex: 1,
        padding: '40px',
        overflowY: 'auto',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
    },
    emptyState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#444',
        gap: '10px',
    },
    emptyIcon: {
        opacity: 0.2,
        marginBottom: '10px',
    }
}

export default DocsLayout
