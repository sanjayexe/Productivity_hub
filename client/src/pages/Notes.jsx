import { useState, useEffect } from 'react';
import axios from 'axios';

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const fetchNotes = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const { data } = await axios.get('http://localhost:5000/api/notes', config);
            setNotes(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const addNote = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.post('http://localhost:5000/api/notes', { title, content }, config);
            setTitle('');
            setContent('');
            fetchNotes();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="animate-fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Notes</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3>Create Note</h3>
                    <form onSubmit={addNote}>
                         <div style={{ marginBottom: '1rem' }}>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                placeholder="Title" 
                                required 
                                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, fontSize: '1.2rem', paddingLeft: 0 }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <textarea 
                                value={content} 
                                onChange={(e) => setContent(e.target.value)} 
                                placeholder="Start typing..." 
                                required 
                                rows="4"
                                style={{ background: 'transparent', border: 'none', resize: 'vertical', paddingLeft: 0 }}
                            />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button type="submit" className="btn-primary">Save Note</button>
                        </div>
                    </form>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {notes.map(note => (
                    <div key={note._id} className="card" style={{ background: '#334155' }}>
                        <h4 style={{ marginTop: 0 }}>{note.title}</h4>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{note.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notes;
