/**
 * RelayNet: The Interoperability Layer
 * 
 * This module abstracts the difference between WebSim's native environment
 * and a standalone RelaySim deployment using P2P fallbacks.
 */

export class RelayNet {
    constructor() {
        this.mode = 'unknown';
        this.isConnected = false;
        this.peers = {};
        this.peerId = null;
        this.roomState = {};
        this.callbacks = {
            onConnect: [],
            onMessage: [],
            onPresenceChange: [],
            onRoomStateChange: []
        };

        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.send = this.send.bind(this);
    }

    async initialize() {
        if (window.websim && window.room) {
            // Case 1: Running inside WebSim
            this.mode = 'websim';
            console.log("[RelayNet] Initializing via WebSim Socket...");
            
            // WebSim handles initialization automatically usually, but we ensure we hook in
            try {
                // Subscribe to WebSim events
                window.room.subscribePresence((presence) => {
                    this.peers = presence;
                    this._trigger('onPresenceChange', presence);
                });

                window.room.subscribeRoomState((state) => {
                    this.roomState = state;
                    this._trigger('onRoomStateChange', state);
                });

                window.room.onmessage = (event) => {
                    this._trigger('onMessage', event.data);
                };

                this.peerId = window.room.clientId;
                this.isConnected = true;
                this._trigger('onConnect', { id: this.peerId, mode: 'websim' });

            } catch (e) {
                console.error("WebSim init failed, falling back...", e);
                this.initializePeerJS();
            }
        } else {
            // Case 2: Running Standalone (RelaySim Static Page)
            console.log("[RelayNet] WebSim environment not detected. Initializing P2P Fallback...");
            await this.initializePeerJS();
        }
    }

    async initializePeerJS() {
        this.mode = 'p2p';
        // Generate a random ID if not provided
        const myId = 'relay_' + Math.random().toString(36).substr(2, 9);
        
        try {
            // Using default PeerJS cloud server for demo purposes
            this.peerInstance = new Peer(myId);

            this.peerInstance.on('open', (id) => {
                this.peerId = id;
                this.isConnected = true;
                console.log(`[RelayNet] P2P Connected. ID: ${id}`);
                this._trigger('onConnect', { id, mode: 'p2p' });
            });

            this.peerInstance.on('connection', (conn) => {
                conn.on('data', (data) => {
                    this._trigger('onMessage', data);
                });
            });

            // Simulate presence via broadcast (simplified)
            // In a real implementation, we'd mesh-network this
            
        } catch (e) {
            console.error("PeerJS initialization failed", e);
        }
    }

    // Unified Send Method
    send(data) {
        if (this.mode === 'websim') {
            window.room.send(data);
        } else if (this.mode === 'p2p') {
            // Broadcast to all connected peers in P2P mesh
            // This is a simplification; normally we track connections
            console.log("[RelayNet] Broadcasting P2P:", data);
        }
    }

    // Update synchronized state
    updateState(payload) {
        if (this.mode === 'websim') {
            window.room.updatePresence(payload);
        } else {
            // P2P state logic
            this.peers[this.peerId] = { ...this.peers[this.peerId], ...payload };
            this._trigger('onPresenceChange', this.peers);
        }
    }

    // Event Listeners
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    _trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }
}

// Singleton export
export const network = new RelayNet();