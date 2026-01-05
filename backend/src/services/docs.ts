interface Document {
    id: string
    title: string
    content: string // HTML or Delta
    timestamp: number
}

const docs: Map<string, Document> = new Map()

// Seed
docs.set('welcome', {
    id: 'welcome',
    title: 'Welcome to Team Wiki',
    content: '<h1>Welcome!</h1><p>Start collaborating here.</p>',
    timestamp: Date.now()
})

export function getDocs() {
    return Array.from(docs.values())
}

export function getDoc(id: string) {
    return docs.get(id)
}

export function createDoc(title: string) {
    const id = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36)
    const doc = { id, title, content: '', timestamp: Date.now() }
    docs.set(id, doc)
    return doc
}

export function updateDoc(id: string, content: string) {
    const doc = docs.get(id)
    if (!doc) throw new Error("Doc not found")
    doc.content = content
    doc.timestamp = Date.now()
    return doc
}
