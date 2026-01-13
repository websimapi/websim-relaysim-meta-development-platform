import { network } from './relay-net.js';

// Simple Event-Based Store for React
class Store {
    constructor() {
        this.state = {
            projects: [
                { id: 1, name: 'asteroid-field-sim', type: 'Game', status: 'synced', lastEdit: '2 mins ago', language: 'Three.js' },
                { id: 2, name: 'ai-chat-interface', type: 'App', status: 'pending', lastEdit: '1 hour ago', language: 'React' },
                { id: 3, name: 'portfolio-v3', type: 'Site', status: 'offline', lastEdit: '2 days ago', language: 'HTML/CSS' }
            ],
            activeProjectId: 1,
            user: {
                name: 'Developer',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
            },
            networkStatus: 'Initializing...',
            mode: 'disconnected'
        };
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach(listener => listener(this.state));
    }

    init() {
        network.initialize();
        
        network.on('onConnect', (info) => {
            this.setState({ 
                networkStatus: 'Connected', 
                mode: info.mode 
            });
            
            // If in WebSim, populate user info from actual peers
            if (info.mode === 'websim' && window.room && window.room.peers) {
                const myPeer = window.room.peers[window.room.clientId];
                if (myPeer) {
                    this.setState({
                        user: { name: myPeer.username, avatar: myPeer.avatarUrl }
                    });
                }
            }
        });
    }

    setActiveProject(id) {
        this.setState({ activeProjectId: id });
    }

    addProject(project) {
        this.setState({
            projects: [...this.state.projects, project]
        });
    }
}

export const store = new Store();