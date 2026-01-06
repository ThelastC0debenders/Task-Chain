import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/taskchain_knowledge";
const client = new MongoClient(uri);

let db: Db;
let knowledgeNodes: Collection;
let knowledgeEdges: Collection;

export async function connectToMongo() {
    if (db) return { db, knowledgeNodes, knowledgeEdges };

    try {
        await client.connect();
        console.log("Connected to MongoDB for Knowledge Graph");
        db = client.db();
        knowledgeNodes = db.collection('knowledge_nodes');
        knowledgeEdges = db.collection('knowledge_edges');

        // Ensure indexes
        await knowledgeNodes.createIndex({ id: 1 }, { unique: true });
        await knowledgeEdges.createIndex({ source: 1, target: 1, type: 1 });
        await knowledgeEdges.createIndex({ source: 1 });

        return { db, knowledgeNodes, knowledgeEdges };
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        throw error;
    }
}

export { client, knowledgeNodes, knowledgeEdges };
