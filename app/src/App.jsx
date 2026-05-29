import React, { useState, useEffect } from 'react';
import { Briefcase, User, Activity, Command, Search, Sparkles, Send, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('jeff');
  const [sessionLog, setSessionLog] = useState('Loading logs...');
  const [fileContent, setFileContent] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'jeff', text: 'Welcome back. Your empire is ready.\n\nI have loaded the system parameters. Coprem is active. How can I assist you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');

  // Fetch Session Log from backend
  useEffect(() => {
    fetch('http://localhost:3001/api/session-log')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSessionLog(data.content);
        } else {
          setSessionLog('Error loading logs.');
        }
      })
      .catch(err => setSessionLog('Backend not connected.'));
  }, []);

  const loadFile = (path, tabName) => {
    setActiveTab(tabName);
    setFileContent('Loading...');
    fetch(`http://localhost:3001/api/file?path=${encodeURIComponent(path)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFileContent(data.content);
        } else {
          setFileContent(`Error: ${data.error}`);
        }
      })
      .catch(err => setFileContent('Failed to load file.'));
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // Add user msg
    const newHistory = [...chatHistory, { role: 'user', text: inputValue }];
    setChatHistory(newHistory);
    setInputValue('');
    
    // Simulate Jeff's response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'jeff', 
        text: 'Received. I am routing this request to the appropriate department for analysis. Please wait...' 
      }]);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="glass-panel sidebar">
        <div className="brand-title">Coprem</div>
        
        <div className="nav-section">
          <div className="nav-title"><Activity size={14}/> SYSTEM</div>
          <div 
            className={`nav-item ${activeTab === 'jeff' ? 'active' : ''}`}
            onClick={() => setActiveTab('jeff')}
          >
            <Command size={16}/> Jeff (CEO)
          </div>
          <div 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => loadFile('เปรม_profile.md', 'profile')}
          >
            <User size={16}/> Master Profile
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-title" style={{color: 'var(--job-accent)'}}><Briefcase size={14}/> JOB PILLAR</div>
          <div 
            className={`nav-item ${activeTab === 'dept_marketing' ? 'job-active' : ''}`}
            onClick={() => loadFile('system/job/dept_marketing.md', 'dept_marketing')}
          >
            Dept: Marketing
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-title" style={{color: 'var(--accent)'}}><User size={14}/> PERSONAL PILLAR</div>
          <div 
            className={`nav-item ${activeTab === 'eilinaire' ? 'active' : ''}`}
            onClick={() => loadFile('projects/brands/eilinaire/README.md', 'eilinaire')}
          >
            Eilinaire
          </div>
          <div 
            className={`nav-item ${activeTab === 'peabuntid' ? 'active' : ''}`}
            onClick={() => loadFile('projects/brands/peabuntid/README.md', 'peabuntid')}
          >
            Peabuntid
          </div>
          <div 
            className={`nav-item ${activeTab === 'ego_era' ? 'active' : ''}`}
            onClick={() => loadFile('projects/ego_era/ego_era_bible.md', 'ego_era')}
          >
            EGO ERA Novel
          </div>
          <div 
            className={`nav-item ${activeTab === 'music' ? 'active' : ''}`}
            onClick={() => loadFile('projects/music/songwriting_sandbox.md', 'music')}
          >
            Music Production
          </div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="glass-panel main-area">
        {activeTab === 'jeff' ? (
          <>
            <div className="main-header">
              <h2>Command Center: Jeff</h2>
              <div className="jeff-status">
                <span className="status-dot"></span> Jeff Online
              </div>
            </div>
            
            <div className="chat-container">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`message ${msg.role === 'jeff' ? 'msg-jeff' : 'msg-user'}`}>
                  {msg.role === 'jeff' && <div style={{fontWeight:'bold', marginBottom:'6px', color:'var(--accent)', display:'flex', alignItems:'center', gap:'6px'}}><Sparkles size={14}/> Jeff</div>}
                  <div style={{whiteSpace: 'pre-wrap'}}>{msg.text}</div>
                </div>
              ))}
            </div>

            <div className="input-area">
              <textarea 
                className="chat-input" 
                placeholder="Instruct Jeff... (Press Enter to send)"
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              ></textarea>
              <button className="send-btn" onClick={handleSend}><Send size={16}/></button>
            </div>
          </>
        ) : (
          <>
            <div className="main-header">
              <h2 style={{display:'flex', alignItems:'center', gap:'8px'}}><FileText size={18}/> Document Viewer</h2>
            </div>
            <div className="chat-container markdown-body" style={{padding: '20px'}}>
              <ReactMarkdown>{fileContent}</ReactMarkdown>
            </div>
          </>
        )}
      </div>

      {/* LOG PANEL */}
      <div className="glass-panel log-panel">
        <h3><Activity size={18}/> Session History</h3>
        <div className="log-content markdown-body">
           <ReactMarkdown>{sessionLog}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default App;
