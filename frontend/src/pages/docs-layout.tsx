import { useEffect, useState } from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import * as docsService from "../services/docs"

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

    return (
        <div style={{ height: '100vh', display: 'flex', backgroundColor: '#f5f5f5', color: '#333' }}>
            <div style={{ width: '250px', backgroundColor: '#fff', borderRight: '1px solid #ddd', padding: '20px' }}>
                <h3 style={{ marginBottom: '20px' }}>Wiki / Docs</h3>
                <button onClick={handleCreate} style={{ width: '100%', padding: '8px', marginBottom: '20px' }}>+ New Doc</button>
                <div>
                    {docs.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => setActiveDoc(doc)}
                            style={{
                                padding: '8px', cursor: 'pointer',
                                backgroundColor: activeDoc?.id === doc.id ? '#eef' : 'transparent',
                                borderRadius: '4px'
                            }}
                        >
                            📄 {doc.title}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeDoc ? (
                    <>
                        <div style={{ padding: '20px', backgroundColor: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                            <h2>{activeDoc.title}</h2>
                            <button onClick={handleSave} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px' }}>Save</button>
                        </div>
                        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', minHeight: '80vh', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <ReactQuill theme="snow" value={content} onChange={setContent} style={{ height: '100%', minHeight: '600px' }} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: 40 }}>Select a document</div>
                )}
            </div>
        </div>
    )
}

export default DocsLayout
