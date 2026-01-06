import React, { useState } from 'react';
import { X, Link as LinkIcon, FileText, UploadCloud } from 'lucide-react';

interface SubmitProofModalProps {
    taskId: string;
    taskTitle: string;
    onClose: () => void;
    onSubmit: (description: string, link: string) => Promise<void>;
    loading?: boolean;
}

export const SubmitProofModal: React.FC<SubmitProofModalProps> = ({ taskId, taskTitle, onClose, onSubmit, loading }) => {
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !link) return;
        onSubmit(description, link);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Submit Proof of Work</h2>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>

                <div style={styles.content}>
                    <div style={styles.taskInfo}>
                        <span style={styles.label}>TASK</span>
                        <span style={styles.value}>#{taskId} • {taskTitle}</span>
                    </div>

                    <p style={styles.instruction}>
                        Provide evidence of your contribution. This will be anchored on-chain and verified by the protocol.
                    </p>

                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.field}>
                            <label style={styles.label}>DESCRIPTION / NOTES</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what you built..."
                                style={styles.textarea}
                                required
                            />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>PROOF LINK (PR / COMMIT / DEMO)</label>
                            <div style={styles.inputWrapper}>
                                <LinkIcon size={16} color="#666" style={styles.inputIcon} />
                                <input
                                    type="url"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    placeholder="https://github.com/..."
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !description || !link}
                            style={{ ...styles.submitBtn, opacity: (loading || !description || !link) ? 0.5 : 1 }}
                        >
                            {loading ? (
                                <span style={styles.flexCenter}><UploadCloud size={16} /> ANCHORING PROOF...</span>
                            ) : (
                                <span style={styles.flexCenter}><FileText size={16} /> SUBMIT & COMPLETE</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const styles: any = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
    },
    modal: {
        background: '#0f0f0f',
        border: '1px solid #333',
        borderRadius: '12px',
        width: '450px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', monospace",
    },
    header: {
        padding: '20px',
        borderBottom: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#111',
    },
    title: {
        margin: 0,
        fontSize: '16px',
        color: '#fff',
        fontWeight: 'bold',
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: '#666',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
    },
    content: {
        padding: '24px',
    },
    taskInfo: {
        background: '#1a1a1a',
        padding: '10px 16px',
        borderRadius: '6px',
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        fontSize: '13px',
    },
    value: {
        color: '#fff',
        fontWeight: 'bold',
    },
    instruction: {
        color: '#888',
        fontSize: '13px',
        marginBottom: '24px',
        lineHeight: '1.5',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '11px',
        color: '#555',
        fontWeight: 'bold',
        letterSpacing: '1px',
    },
    textarea: {
        background: '#0a0a0a',
        border: '1px solid #333',
        borderRadius: '6px',
        padding: '12px',
        color: '#fff',
        fontSize: '14px',
        minHeight: '80px',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: '12px',
        zIndex: 1,
    },
    input: {
        background: '#0a0a0a',
        border: '1px solid #333',
        borderRadius: '6px',
        padding: '12px 12px 12px 40px',
        color: '#fff',
        fontSize: '14px',
        width: '100%',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    },
    submitBtn: {
        background: '#00ff88',
        border: 'none',
        borderRadius: '6px',
        padding: '14px',
        color: '#000',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        marginTop: '10px',
        transition: 'all 0.2s',
    },
    flexCenter: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    }
}
