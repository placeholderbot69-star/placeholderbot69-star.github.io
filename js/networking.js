class GameNetworking {
    constructor() {
        this.peer = new Peer({
            config: {
                'iceServers': [
                    { urls: ['stun:stun.l.google.com:19302'] }
                ]
            }
        });
        
        this.peerId = null;
        this.connections = {};
        this.isHost = false;
        
        this.peer.on('open', (id) => {
            this.peerId = id;
            document.getElementById('shareCode').value = id.substring(0, 8).toUpperCase();
            console.log('Your Peer ID:', id);
        });

        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });
    }

    setupConnection(conn) {
        this.connections[conn.peer] = conn;
        
        conn.on('data', (data) => {
            this.handleNetworkData(data);
        });

        conn.on('close', () => {
            delete this.connections[conn.peer];
            console.log('Player disconnected:', conn.peer);
        });
    }

    connectToPeer(peerId) {
        const conn = this.peer.connect(peerId);
        conn.on('open', () => {
            this.setupConnection(conn);
        });
    }

    broadcastGameState(gameState) {
        Object.values(this.connections).forEach(conn => {
            if (conn.open) {
                conn.send({
                    type: 'gameState',
                    data: gameState
                });
            }
        });
    }

    broadcastPlayerAction(action) {
        Object.values(this.connections).forEach(conn => {
            if (conn.open) {
                conn.send({
                    type: 'playerAction',
                    data: action
                });
            }
        });
    }

    handleNetworkData(data) {
        switch(data.type) {
            case 'gameState':
                window.gameEngine.updateRemoteGameState(data.data);
                break;
            case 'playerAction':
                window.gameEngine.applyRemoteAction(data.data);
                break;
        }
    }
}

const networking = new GameNetworking();
