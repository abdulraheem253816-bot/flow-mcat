import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchFavorites(session.user.id);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchFavorites(session.user.id);
      else setFavorites([]);
    });
    fetchNotes();
    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const fetchNotes = async () => {
    const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
    if (!error) setNotes(data);
  };

  const fetchFavorites = async (userId) => {
    const { data, error } = await supabase.from('favorites').select('note_id, notes (*)').eq('user_id', userId);
    if (!error && data) {
      const favNotes = data.map(f => f.notes).filter(n => n !== null);
      setFavorites(favNotes);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { first_name: firstName, last_name: lastName } }
        });
        if (error) alert(error.message);
        else alert("Registration Successful! Please check email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
      }
    } catch (err) { alert("An error occurred."); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const pass = prompt("Enter Admin Password:");
    if (pass !== ADMIN_PASSWORD) return alert("Unauthorized!");
    setLoading(true);
    const fileName = `${Date.now()}_${file.name}`;
    await supabase.storage.from('Study-Materials').upload(fileName, file);
    const { data: publicUrlData } = supabase.storage.from('Study-Materials').getPublicUrl(fileName);
    await supabase.from('notes').insert([{ title, subject, file_url: publicUrlData.publicUrl }]);
    setLoading(false);
    setTitle(''); setSubject(''); setFile(null);
    fetchNotes();
  };

  const toggleFavorite = async (note) => {
    if (!session) return alert("Login First!");
    const isFav = favorites.find(f => f.id === note.id);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('note_id', note.id);
      setFavorites(favorites.filter(f => f.id !== note.id));
    } else {
      await supabase.from('favorites').insert([{ user_id: session.user.id, note_id: note.id }]);
      setFavorites([...favorites, note]);
    }
  };

  const filteredNotes = notes.filter(n => {
    const noteSub = n.subject.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = n.title.toLowerCase().includes(search) || noteSub.includes(search);
    if (selectedCategory === 'Favorites') return favorites.some(fav => fav.id === n.id) && matchesSearch;
    if (selectedCategory === 'All') return matchesSearch;
    const subMatch = { 'Biology': 'bio', 'Physics': 'phy', 'Chemistry': 'chem', 'English': 'eng' };
    return noteSub.includes(subMatch[selectedCategory] || selectedCategory.toLowerCase()) && matchesSearch;
  });

  const NeonBackground = () => (
    <div className="fog-container">
      <div className="fog-circle blue"></div>
      <div className="fog-circle pink"></div>
      <div className="fog-circle cyan"></div>
    </div>
  );

  if (!session) {
    return (
      <div className="auth-wrapper">
        <NeonBackground />
        <div className="auth-card" style={styles.authCard}>
          <h2 style={{color:'#fff', marginBottom:'30px', fontWeight:'700'}}>{isSignUp ? 'Create Account' : 'Student Login'}</h2>
          <form onSubmit={handleAuth} style={styles.form}>
            {isSignUp && (
              <div className="auth-name-row" style={{display:'flex', gap:'10px'}}>
                <input style={styles.authInput} placeholder="First Name" onChange={(e)=>setFirstName(e.target.value)} required />
                <input style={styles.authInput} placeholder="Last Name" onChange={(e)=>setLastName(e.target.value)} required />
              </div>
            )}
            <input style={styles.authInput} type="email" placeholder="Email" onChange={(e)=>setEmail(e.target.value)} required />
            <input style={styles.authInput} type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} required />
            
            <div style={{display:'flex', justifyContent:'center', marginTop:'15px'}}>
              <button className="neon-glow-btn" type="submit">
                {loading ? '...' : (isSignUp ? 'Sign Up' : 'Login')}
              </button>
            </div>
          </form>
          <p onClick={() => setIsSignUp(!isSignUp)} style={{color:'rgba(255,255,255,0.6)', cursor:'pointer', marginTop:'25px', fontSize:'13px'}}>
            {isSignUp ? 'Already have an account? Login' : 'New student? Create an account'}
          </p>
        </div>

        <style>{`
          .auth-wrapper { height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; background: #000; overflow: hidden; position: relative; }
          .fog-container { position: absolute; width: 100%; height: 100%; filter: blur(80px); z-index: 0; pointer-events: none; }
          .fog-circle { position: absolute; border-radius: 50%; opacity: 0.5; animation: move-fog 20s infinite alternate ease-in-out; }
          .blue { width: 600px; height: 600px; background: #0055ff; top: -10%; left: -10%; }
          .pink { width: 500px; height: 500px; background: #ff00cc; bottom: -10%; right: -5%; animation-delay: -5s; }
          .cyan { width: 400px; height: 400px; background: #00d4ff; bottom: 20%; left: 10%; animation-delay: -10s; }
          @keyframes move-fog { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(150px, 100px) scale(1.3); } }
          .neon-glow-btn { width: 140px; background: linear-gradient(45deg, #00d4ff, #ff00cc); box-shadow: 0 0 15px rgba(0, 212, 255, 0.7); border: none; padding: 12px; border-radius: 25px; color: white; font-weight: bold; cursor: pointer; transition: 0.4s; }
          .neon-glow-btn:hover { box-shadow: 0 0 30px rgba(0, 212, 255, 1), 0 0 50px rgba(255, 0, 204, 0.6); transform: translateY(-2px); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container" style={styles.container}>
      <NeonBackground />
      <header className="app-header" style={styles.glassHeader}>
        <h1 style={styles.logo}>🚀 MDCAT Flow</h1>
        <div className="header-right" style={{display:'flex', gap:'15px'}}>
          <input className="search-hover search-bar" type="text" placeholder="🔍 Search (bio, phy...)" onChange={(e)=>setSearchTerm(e.target.value)} style={styles.searchBar} />
          <button onClick={() => supabase.auth.signOut()} className="logout-hover logout-btn" style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <div className="main-layout" style={styles.mainGrid}>
        <aside className="sidebar" style={styles.glassSidebar}>
          <h3 style={{color:'#fff', marginBottom:'15px'}}>📤 Admin Upload</h3>
          <form onSubmit={handleUpload} style={styles.form}>
            <input className="input-hover" style={styles.glassInput} placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
            <input className="input-hover" style={styles.glassInput} placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} />
            <input type="file" style={{color:'#fff', fontSize:'12px'}} onChange={(e)=>setFile(e.target.files[0])} />
            <button className="upload-glow" style={styles.glassBtn} type="submit">Upload Now</button>
          </form>
        </aside>

        <main className="content-area">
          <div className="category-tabs" style={styles.categoryContainer}>
            {['All', 'Biology', 'Chemistry', 'Physics', 'English', 'Favorites'].map(cat => (
              <button key={cat} onClick={()=>setSelectedCategory(cat)} 
                className={cat === 'Favorites' ? "fav-btn-glow" : ""}
                style={{...styles.catBtn, background: selectedCategory === cat ? 'linear-gradient(45deg, #00d4ff, #0055ff)' : 'rgba(255,255,255,0.1)', border: cat === 'Favorites' ? '1px solid #ff00cc' : 'none'}}>
                {cat === 'Favorites' ? `❤️ Saved (${favorites.length})` : cat}
              </button>
            ))}
          </div>
          <div className="notes-grid" style={styles.notesGrid}>
            {filteredNotes.map(note => (
              <div key={note.id} className="note-card" style={styles.glassNoteCard}>
                <span className="subject-badge-glow" style={styles.badge}>{note.subject}</span>
                <h4 style={{color:'#fff', margin:'10px 0'}}>{note.title}</h4>
                <div style={styles.actions}>
                  <a href={note.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>View PDF</a>
                  <button onClick={()=>toggleFavorite(note)} style={styles.iconBtn}>{favorites.find(f=>f.id===note.id)?'❤️':'🤍'}</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <style>{`
        .fog-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; filter: blur(100px); z-index: -1; pointer-events: none; background: #000; }
        .fog-circle { position: absolute; border-radius: 50%; opacity: 0.4; animation: move-fog 25s infinite alternate ease-in-out; }
        .blue { width: 800px; height: 800px; background: #0055ff; top: -20%; left: -10%; }
        .pink { width: 700px; height: 700px; background: #ff00cc; bottom: -10%; right: -10%; animation-delay: -7s; }
        .cyan { width: 600px; height: 600px; background: #00d4ff; top: 40%; left: 30%; animation-delay: -12s; }
        @keyframes move-fog { 0% { transform: translate(0, 0) rotate(0deg); } 100% { transform: translate(200px, 150px) rotate(90deg); } }

        /* Glowing Subject Badge */
        .subject-badge-glow { box-shadow: 0 0 10px #00d4ff; border: 1px solid #00d4ff; font-weight: bold; }
        
        /* Glowing Favorites Button */
        .fav-btn-glow { box-shadow: 0 0 15px rgba(255, 0, 204, 0.5); transition: 0.3s; }
        .fav-btn-glow:hover { box-shadow: 0 0 25px rgba(255, 0, 204, 0.8); }

        .note-card:hover { transform: translateY(-5px); box-shadow: 0 0 20px rgba(0, 212, 255, 0.6); border-color: #00d4ff !important; transition: 0.3s; }
        .search-hover:hover, .input-hover:hover { border-color: #00d4ff !important; box-shadow: 0 0 10px rgba(0, 212, 255, 0.2); transition: 0.3s; }
        .logout-hover:hover { background: #ff4d4d !important; color: #fff !important; box-shadow: 0 0 15px rgba(255, 77, 77, 0.4); transition: 0.3s; }
        .upload-glow:hover { box-shadow: 0 0 15px #00d4ff; transform: translateY(-2px); transition: 0.3s; }

        @media (max-width: 768px) {
          .app-container { padding: 15px !important; }
          .app-header { flex-direction: column !important; padding: 15px !important; gap: 15px; text-align: center; }
          .header-right { width: 100%; flex-direction: column; gap: 10px !important; }
          .search-bar { width: 100% !important; }
          .logout-btn { width: 100%; }
          .main-layout { grid-template-columns: 1fr !important; gap: 20px !important; }
          .sidebar { order: -1; padding: 20px !important; }
          .notes-grid { grid-template-columns: 1fr !important; }
          .auth-card { width: 90% !important; padding: 25px !important; }
          .auth-name-row { flex-direction: column; gap: 10px !important; }
          .category-tabs { padding-bottom: 10px; margin-bottom: 15px !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { padding:'40px', background:'transparent', minHeight:'100vh', position:'relative', zIndex:'1' },
  glassHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(15px)', borderRadius:'20px', marginBottom:'30px', border:'1px solid rgba(255,255,255,0.1)' },
  logo: { fontSize:'24px', background:'linear-gradient(to right, #00d4ff, #ff00cc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:'bold' },
  searchBar: { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'10px 20px', borderRadius:'20px', color:'#fff', width:'300px', outline:'none' },
  logoutBtn: { background:'rgba(255,0,0,0.1)', color:'#ff4d4d', border:'1px solid rgba(255,77,77,0.2)', padding:'8px 18px', borderRadius:'15px', cursor:'pointer', fontWeight:'bold' },
  mainGrid: { display:'grid', gridTemplateColumns:'280px 1fr', gap:'25px' },
  glassSidebar: { background:'rgba(0,0,0,0.5)', backdropFilter:'blur(15px)', padding:'25px', borderRadius:'25px', height:'fit-content', border:'1px solid rgba(255,255,255,0.1)' },
  form: { display:'flex', flexDirection:'column', gap:'12px' },
  glassInput: { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'12px', borderRadius:'12px', color:'#fff', outline:'none' },
  glassBtn: { background:'linear-gradient(45deg, #00d4ff, #0055ff)', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' },
  categoryContainer: { display:'flex', gap:'10px', marginBottom:'25px', overflowX:'auto' },
  catBtn: { padding:'10px 22px', borderRadius:'20px', border:'none', color:'#fff', cursor:'pointer', whiteSpace:'nowrap' },
  notesGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'20px' },
  // Darkened Card Styles
  glassNoteCard: { background:'rgba(0,0,0,0.6)', backdropFilter:'blur(15px)', padding:'22px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.15)' },
  badge: { background:'rgba(0,212,255,0.2)', color:'#00d4ff', padding:'4px 12px', borderRadius:'12px', fontSize:'11px' },
  actions: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'15px' },
  viewBtn: { textDecoration:'none', color:'#fff', background:'rgba(255,255,255,0.1)', padding:'8px 15px', borderRadius:'10px', fontSize:'12px' },
  iconBtn: { background:'none', border:'none', cursor:'pointer', fontSize:'20px' },
  authCard: { background:'rgba(0,0,0,0.6)', backdropFilter:'blur(20px)', padding:'50px', borderRadius:'40px', border:'1px solid rgba(255,255,255,0.1)', width:'420px', textAlign:'center', position:'relative', zIndex:'10' },
  authInput: { width:'100%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', padding:'15px', borderRadius:'15px', color:'#fff', marginBottom:'5px', outline:'none' }
};

export default App;     
