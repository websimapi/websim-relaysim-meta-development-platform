import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { network } from './relay-net.js';
import { store } from './store.js';

// --- Icons (Remix Icon classes mapping) ---
const Icons = {
    Files: "ri-file-code-line",
    Search: "ri-search-line",
    Git: "ri-git-branch-line",
    Debug: "ri-bug-line",
    Extensions: "ri-puzzle-2-line",
    Settings: "ri-settings-3-line",
    Account: "ri-user-3-line",
    Sync: "ri-refresh-line",
    Play: "ri-play-fill",
    Cloud: "ri-cloud-line"
};

// --- Components ---

const Sidebar = ({ activeTab, onTabChange }) => {
    return React.createElement('div', { className: 'sidebar' },
        ['Files', 'Search', 'Git', 'Debug', 'Extensions'].map((item) => 
            React.createElement('div', {
                key: item,
                className: `sidebar-icon ${activeTab === item ? 'active' : ''}`,
                onClick: () => onTabChange(item),
                title: item
            }, React.createElement('i', { className: Icons[item] }))
        ),
        React.createElement('div', { className: 'sidebar-bottom' },
            React.createElement('div', { className: 'sidebar-icon' }, 
                React.createElement('i', { className: Icons.Account })
            ),
            React.createElement('div', { className: 'sidebar-icon' }, 
                React.createElement('i', { className: Icons.Settings })
            )
        )
    );
};

const ProjectExplorer = ({ projects, activeId, onSelect }) => {
    return React.createElement('div', { className: 'panel' },
        React.createElement('div', { className: 'panel-header' }, 
            "RelaySim Projects",
            React.createElement('i', { className: "ri-more-fill", style: {cursor:'pointer'} })
        ),
        React.createElement('div', { className: 'project-list' },
            projects.map(p => 
                React.createElement('div', {
                    key: p.id,
                    className: `project-item ${activeId === p.id ? 'active' : ''}`,
                    onClick: () => onSelect(p.id)
                },
                    React.createElement('i', { className: getIconForType(p.type), style: {color: getIconColor(p.type)} }),
                    React.createElement('div', { style: {flex:1} }, 
                        React.createElement('div', { style: {fontWeight:500} }, p.name),
                        React.createElement('div', { style: {fontSize:'10px', color:'#777'} }, p.lastEdit)
                    ),
                    React.createElement('div', { className: `status-dot status-${p.status}` })
                )
            )
        )
    );
};

// Helper for icons
const getIconForType = (type) => {
    switch(type) {
        case 'Game': return 'ri-gamepad-line';
        case 'App': return 'ri-layout-grid-line';
        default: return 'ri-html5-line';
    }
};
const getIconColor = (type) => {
    switch(type) {
        case 'Game': return '#ea5c00'; // Orange
        case 'App': return '#61dafb'; // React Blue
        default: return '#e34c26'; // HTML Red
    }
};

const Editor = ({ project }) => {
    if (!project) return React.createElement('div', { className: 'editor-surface' }, "No project selected.");

    // Simulating the RelaySim Adapter injection code
    const adapterCode = `
// --- RelaySim Adapter (Injected) ---
// This enables your WebSim project to run anywhere

(async function() {
  const isWebSim = typeof window.websim !== 'undefined';
  
  if (!isWebSim) {
    console.log("RelaySim: Initializing P2P Polyfill...");
    // Inject PeerJS logic here to mock window.room
    window.room = {
      peers: {},
      state: {},
      send: (data) => console.log("P2P Send:", data),
      subscribePresence: (cb) => console.log("Subscribed Presence"),
    };
  }
  
  console.log("Project '${project.name}' ready.");
})();
`;

    return React.createElement('div', { className: 'main-view' },
        React.createElement('div', { className: 'tab-bar' },
            React.createElement('div', { className: 'tab active' }, 
                React.createElement('i', { className: getIconForType(project.type), style: {marginRight:'8px', color: getIconColor(project.type)} }),
                "adapter.js",
                React.createElement('i', { className: "ri-close-line", style: {marginLeft:'auto', fontSize:'14px'} })
            )
        ),
        React.createElement('div', { className: 'editor-surface' },
            React.createElement('div', { className: 'code-block' }, 
                `// Viewing Source Snapshot: ${project.name}\n` +
                `// Version: 1.0.4-alpha\n` +
                `// Synced via: RelaySim Git Bridge\n\n` +
                adapterCode
            )
        )
    );
};

const StatusBar = ({ status, mode, user }) => {
    return React.createElement('div', { className: 'status-bar' },
        React.createElement('div', { className: 'status-left' },
            React.createElement('div', { className: 'status-item', style: {background: '#005f9e', padding: '0 8px', marginLeft:'-10px', height:'22px'} },
                React.createElement('i', { className: "ri-remote-control-line" }),
                "RELAYSIM REMOTE"
            ),
            React.createElement('div', { className: 'status-item' },
                React.createElement('i', { className: "ri-git-branch-line" }),
                "main"
            ),
            React.createElement('div', { className: 'status-item' },
                React.createElement('i', { className: "ri-refresh-line" }),
                "0↓ 0↑"
            )
        ),
        React.createElement('div', { className: 'status-right' },
            React.createElement('div', { className: 'status-item' },
                mode === 'websim' ? "WebSim Connected" : "P2P Mode (Fallback)",
                React.createElement('i', { className: mode === 'websim' ? "ri-wifi-line" : "ri-broadcast-line" })
            ),
            React.createElement('div', { className: 'status-item' },
                user.name
            )
        )
    );
};

const App = () => {
    const [state, setState] = useState(store.state);
    const [activeTab, setActiveTab] = useState('Files');

    useEffect(() => {
        store.init();
        const unsubscribe = store.subscribe(setState);
        return () => unsubscribe();
    }, []);

    const activeProject = state.projects.find(p => p.id === state.activeProjectId);

    return React.createElement('div', { className: 'app-container' },
        React.createElement(Sidebar, { activeTab, onTabChange: setActiveTab }),
        activeTab === 'Files' && React.createElement(ProjectExplorer, { 
            projects: state.projects, 
            activeId: state.activeProjectId,
            onSelect: (id) => store.setActiveProject(id)
        }),
        React.createElement(Editor, { project: activeProject }),
        React.createElement('div', { style: {position: 'absolute', bottom: 0, width: '100%'} },
            React.createElement(StatusBar, { 
                status: state.networkStatus, 
                mode: state.mode,
                user: state.user
            })
        )
    );
};

// Mount
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));