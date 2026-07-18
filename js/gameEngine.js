class GameEngine {
    constructor(gameMode) {
        this.gameMode = gameMode;
        this.players = [];
        this.enemies = [];
        this.projectiles = [];
        this.config = {
            type: Phaser.AUTO,
            width: 1200,
            height: 800,
            physics: {
                default: 'arcade',
                arcade: { debug: false, gravity: { y: 300 } }
            },
            scene: {
                preload: this.preload,
                create: this.create.bind(this),
                update: this.update.bind(this)
            }
        };

        this.game = new Phaser.Game(this.config);
    }

    preload = function() {
        // Load assets
        this.load.image('player', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiPjxyZWN0IHdpZHRoPSIzMCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==');
