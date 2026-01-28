import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const ADMIN_PASSWORD = "hafiz20070@.";

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setNotes(data);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const pass = prompt("Enter Admin Password to Upload:");
    if (pass !== ADMIN_PASSWORD) {
      alert("Unauthorized! Only Admin can upload notes.");
      return;
    }

    if (!file || !title || !subject) return alert("Please fill all fields");
    setLoading(true);
    const fileName = `${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('Study-Materials')
      .upload(fileName, file);

    if (uploadError) {
      alert("Upload Error: " + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('Study-Materials').getPublicUrl(fileName);
    await supabase.from('notes').insert([{ title, subject, file_url: publicUrlData.publicUrl }]);

    setLoading(false);
    setTitle(''); setSubject(''); setFile(null);
    fetchNotes();
    alert("MDCAT Note Uploaded Successfully!");
  };

  const deleteNote = async (id, filePath) => {
    const pass = prompt("Enter Admin Password to Delete:");
    if (pass !== ADMIN_PASSWORD) {
      alert("Unauthorized! You cannot delete notes.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      const fileName = filePath.split('/').pop();
      await supabase.storage.from('Study-Materials').remove([fileName]);
      await supabase.from('notes').delete().eq('id', id);
      fetchNotes(); 
    } catch (err) { alert("Error deleting"); }
  };

  const toggleFavorite = (note) => {
    if (favorites.find(f => f.id === note.id)) {
      setFavorites(favorites.filter(f => f.id !== note.id));
    } else {
      setFavorites([...favorites, note]);
    }
  };

  // --- SMART FILTER LOGIC (MDCAT SPECIAL) ---
  const filteredNotes = notes.filter(n => {
    const noteSub = n.subject.toLowerCase().trim();
    const search = searchTerm.toLowerCase();
    
    // Search functionality
    const matchesSearch = n.title.toLowerCase().includes(search) || noteSub.includes(search);

    if (selectedCategory === 'All') return matchesSearch;

    // Biology Logic: Handles Bio, bio, BIOLOGY, etc.
    if (selectedCategory === 'Biology') {
      return noteSub.includes('bio') && matchesSearch;
    }

    // Default Case for other subjects
    return noteSub === selectedCategory.toLowerCase() && matchesSearch;
  });

  return (
    <div style={styles.container}>
      <style>{`
        .glass-card:hover { transform: translateY(-10px) scale(1.02); background: rgba(255, 255, 255, 0.12) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .action-btn:hover { filter: brightness(1.2); transform: scale(1.1); }
        .cat-btn:hover { background: rgba(0, 212, 255, 0.4) !important; }
      `}</style>

      <div style={styles.circle1}></div>
      <div style={styles.circle2}></div>

      <header style={styles.glassHeader}>
        <h1 style={styles.logo}>🚀 MDCAT Flow</h1>
        <input 
          type="text" 
          placeholder="🔍 Search notes..." 
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchBar}
        />
      </header>

      <div style={styles.mainGrid}>
        <aside style={styles.glassSidebar}>
          <h3 style={{color: '#fff', marginBottom: '20px'}}>📤 Admin Upload</h3>
          <form onSubmit={handleUpload} style={styles.form}>
            <input style={styles.glassInput} type="text" placeholder="Title (e.g. Bio Ch 1)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input style={styles.glassInput} type="text" placeholder="Subject (Bio, Physics etc)" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <input style={{color: '#fff', fontSize: '12px'}} type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button style={styles.glassBtn} className="action-btn" type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Secure Upload'}
            </button>
          </form>
        </aside>

        <main>
          <div style={styles.categoryContainer}>
            {['All', 'Biology', 'Chemistry', 'Physics', 'English'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...styles.catBtn,
                  background: selectedCategory === cat ? 'linear-gradient(45deg, #00d4ff, #0055ff)' : 'rgba(255,255,255,0.05)',
                  border: selectedCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.1)'
                }}
                className="cat-btn"
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={styles.notesGrid}>
            {filteredNotes.map(note => (
              <div key={note.id} style={styles.glassNoteCard} className="glass-card">
                <span style={styles.badge}>{note.subject}</span>
                <h4 style={{color: '#fff', margin: '15px 0'}}>{note.title}</h4>
                <div style={styles.actions}>
                  <a href={note.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn} className="action-btn">View PDF</a>
                  <div style={{display: 'flex', gap: '15px'}}>
                    <button onClick={() => toggleFavorite(note)} style={styles.iconBtn} className="action-btn">
                      {favorites.find(f => f.id === note.id) ? '❤️' : '🤍'}
                    </button>
                    <button onClick={() => deleteNote(note.id, note.file_url)} style={styles.iconBtn} className="action-btn">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '40px', background: 'linear-gradient(135deg, #050505, #1a1a2e, #16213e)', minHeight: '100vh', position: 'relative', overflow: 'hidden', color: '#fff' },
  circle1: { position: 'absolute', top: '-50px', right: '-50px', width: '400px', height: '400px', background: 'rgba(0, 212, 255, 0.2)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 },
  circle2: { position: 'absolute', bottom: '-50px', left: '-50px', width: '400px', height: '400px', background: 'rgba(255, 0, 204, 0.15)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 },
  glassHeader: { position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(15px)', borderRadius: '25px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '40px' },
  logo: { fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #00d4ff, #ff00cc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  searchBar: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 25px', borderRadius: '30px', color: '#fff', outline: 'none', width: '350px' },
  mainGrid: { position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', gap: '40px' },
  glassSidebar: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', padding: '30px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.05)', height: 'fit-content' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  glassInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', color: '#fff', outline: 'none' },
  glassBtn: { background: 'linear-gradient(45deg, #00d4ff, #0055ff)', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
  categoryContainer: { display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' },
  catBtn: { padding: '10px 25px', borderRadius: '25px', color: '#fff', cursor: 'pointer', transition: '0.3s', fontSize: '14px', backdropFilter: 'blur(10px)' },
  notesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  glassNoteCard: { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)', padding: '25px', borderRadius: '25px', border: '1px solid rgba(255, 255, 255, 0.1)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  badge: { background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', padding: '5px 15px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  viewBtn: { textDecoration: 'none', color: '#fff', fontSize: '14px', background: 'rgba(0, 212, 255, 0.2)', padding: '8px 20px', borderRadius: '10px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }
};

export default App;
