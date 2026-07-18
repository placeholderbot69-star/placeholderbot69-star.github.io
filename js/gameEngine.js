class GameEngine {
    constructor(gameMode) {
        this.gameMode = gameMode;
        this.players = [];
        this.enemies = [];
        this.projectiles = [];
        this.score = {};
        this.gametime = 0;
        this.gameActive = true;

        this.config = {
            type: Phaser.AUTO,
            width: 1200,
            height: 800,
            physics: {
                default: 'arcade',
                arcade: { debug: false, gravity: { y: 0 } }
            },
            scene: {
                preload: this.preload,
                create: this.create.bind(this),
                update: this.update.bind(this)
            }
        };

        this.game = new Phaser.Game(this.config);
        window.gameEngine = this;
    }

    preload = function() {
        // Create simple placeholder graphics
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Player sprite
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 30, 40);
        graphics.generateTexture('player', 30, 40);

        // Bullet sprite
        graphics.fillStyle(0xffff00);
        graphics.fillRect(0, 0, 5, 5);
        graphics.generateTexture('bullet', 5, 5);

        // Grenade sprite
        graphics.fillStyle(0xff0000);
        graphics.fillCircle(5, 5, 5);
        graphics.generateTexture('grenade', 10, 10);

        graphics.destroy();
    }

    create = function() {
        this.engine = window.gameEngine;
        this.engine.scene = this;

        // Create tilemap/background
        this.add.rectangle(600, 400, 1200, 800, 0x2c3e50);

        // Game boundaries
        this.physics.world.setBounds(0, 0, 1200, 800);

        // Input handling
        this.input.keyboard.on('keydown', (event) => {
            this.engine.handleInput(event, this);
        });

        this.input.keyboard.on('keyup', (event) => {
            this.engine.handleInputUp(event, this);
        });

        // Mouse input for aiming/firing
        this.input.on('pointermove', (pointer) => {
            this.engine.playerDirection = Phaser.Math.Angle.Between(
                this.engine.localPlayer.x,
                this.engine.localPlayer.y,
                pointer.x,
                pointer.y
            );
        });

        this.input.on('pointerdown', (pointer) => {
            if (this.engine.localPlayer && this.engine.localPlayer.currentWeapon) {
                this.engine.fireWeapon(this.engine.localPlayer, this.engine.playerDirection, this);
            }
        });

        // Spawn local player
        this.engine.spawnLocalPlayer(this);

        // Game mode specific setup
        this.engine.setupGameMode(this);

        // Network updates
        setInterval(() => {
            this.engine.syncGameState();
        }, 50); // 20 updates per second
    }

    update = function() {
        if (!this.engine.gameActive) return;

        // Update local player movement
        if (this.engine.localPlayer) {
            this.engine.updateLocalPlayer(this);
        }

        // Update projectiles
        this.engine.projectiles.forEach((proj, index) => {
            if (proj.lifespan) {
                proj.lifespan -= 16;
                if (proj.lifespan <= 0) {
                    proj.destroy();
                    this.engine.projectiles.splice(index, 1);
                }
            }
        });

        // Update game UI
        this.engine.updateUI();
    }

    spawnLocalPlayer = function(scene) {
        const char = characterSystem.characters[this.selectedCharacter || 'knight'];
        const player = characterSystem.spawnCharacter(this.selectedCharacter || 'knight', 600, 400, scene);
        
        player.isLocal = true;
        player.team = this.playerTeam || 'team1';
        player.weapons = [Object.keys(weaponSystem.weapons)[0]];
        player.currentWeapon = player.weapons[0];
        player.playerId = networking.peerId;
        player.inputKeys = {};

        this.localPlayer = player;
        this.players.push(player);
        
        // Add UI
        player.healthBar = scene.add.rectangle(player.x, player.y - 30, 30, 5, 0x00ff00);
        
        return player;
    }

    updateLocalPlayer = function(scene) {
        const player = this.localPlayer;
        const keys = player.inputKeys;
        let velocityX = 0;
        let velocityY = 0;

        // Movement controls (WASD)
        if (keys['W'] || keys['ArrowUp']) velocityY = -player.speed;
        if (keys['S'] || keys['ArrowDown']) velocityY = player.speed;
        if (keys['A'] || keys['ArrowLeft']) velocityX = -player.speed;
        if (keys['D'] || keys['ArrowRight']) velocityX = player.speed;

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.7;
            velocityY *= 0.7;
        }

        player.setVelocity(velocityX, velocityY);

        // Update UI
        if (player.healthBar) {
            player.healthBar.x = player.x;
            player.healthBar.y = player.y - 30;
            player.healthBar.setScale(player.health / (characterSystem.characters[this.selectedCharacter || 'knight'].health));
        }

        // Keep player in bounds
        player.x = Phaser.Math.Clamp(player.x, 15, scene.physics.world.bounds.width - 15);
        player.y = Phaser.Math.Clamp(player.y, 20, scene.physics.world.bounds.height - 20);
    }

    handleInput = function(event, scene) {
        if (this.localPlayer) {
            this.localPlayer.inputKeys[event.key.toUpperCase()] = true;

            // Number keys to switch weapons
            if (event.key >= '1' && event.key <= '9') {
                const index = parseInt(event.key) - 1;
                if (this.localPlayer.weapons[index]) {
                    this.localPlayer.currentWeapon = this.localPlayer.weapons[index];
                }
            }
        }
    }

    handleInputUp = function(event, scene) {
        if (this.localPlayer) {
            this.localPlayer.inputKeys[event.key.toUpperCase()] = false;
        }
    }

    fireWeapon = function(player, direction, scene) {
        if (!player.currentWeapon) return;
        if (player.lastFireTime && Date.now() - player.lastFireTime < weaponSystem.weapons[player.currentWeapon].fireRate) {
            return; // Fire rate cooldown
        }

        player.lastFireTime = Date.now();

        const weapon = weaponSystem.weapons[player.currentWeapon];
        weaponSystem.fire(player.currentWeapon, player.x, player.y, direction, scene);

        // Broadcast to other players
        networking.broadcastPlayerAction({
            type: 'fire',
            playerId: player.playerId,
            weapon: player.currentWeapon,
            x: player.x,
            y: player.y,
            direction: direction
        });
    }

    syncGameState = function() {
        if (!this.localPlayer) return;

        const gameState = {
            players: this.players.map(p => ({
                playerId: p.playerId,
                x: p.x,
                y: p.y,
                health: p.health,
                currentWeapon: p.currentWeapon,
                team: p.team
            })),
            projectiles: this.projectiles.map(proj => ({
                x: proj.x,
                y: proj.y,
                velocityX: proj.body.velocity.x,
                velocityY: proj.body.velocity.y
            })),
            score: this.score,
            gameTime: this.gametime++
        };

        networking.broadcastGameState(gameState);
    }

    updateRemoteGameState = function(gameState) {
        // Update remote players
        gameState.players.forEach(remotePlayer => {
            let localPlayer = this.players.find(p => p.playerId === remotePlayer.playerId);
            if (localPlayer && !localPlayer.isLocal) {
                localPlayer.x = remotePlayer.x;
                localPlayer.y = remotePlayer.y;
                localPlayer.health = remotePlayer.health;
            }
        });
    }

    applyRemoteAction = function(action) {
        const scene = this.scene;
        
        switch(action.type) {
            case 'fire':
                weaponSystem.fire(action.weapon, action.x, action.y, action.direction, scene);
                break;
            case 'spawn':
                this.spawnRemotePlayer(action.playerId, action.character, action.team, scene);
                break;
            case 'kill':
                this.handleKill(action.killer, action.victim);
                break;
        }
    }

    spawnRemotePlayer = function(playerId, character, team, scene) {
        const player = characterSystem.spawnCharacter(character, 100 + Math.random() * 1000, 100 + Math.random() * 600, scene);
        player.playerId = playerId;
        player.isLocal = false;
        player.team = team;
        this.players.push(player);
    }

    setupGameMode = function(scene) {
        switch(this.gameMode) {
            case 'tdm':
                this.setupTeamDeathmatch(scene);
                break;
            case 'dm':
                this.setupFreeForAll(scene);
                break;
            case 'bomb':
                this.setupBombDefuse(scene);
                break;
            case 'custom':
                this.runCustomGameMode(scene);
                break;
        }
    }

    setupTeamDeathmatch = function(scene) {
        this.score = { team1: 0, team2: 0 };
        this.gameMode = 'Team Deathmatch';
        this.timelimit = 600; // 10 minutes
        
        // Spawn enemies on opposite team
        for (let i = 0; i < 3; i++) {
            this.spawnRemotePlayer(
                'bot_' + i,
                ['knight', 'assassin', 'mage'][i],
                this.localPlayer.team === 'team1' ? 'team2' : 'team1',
                scene
            );
        }
    }

    setupFreeForAll = function(scene) {
        this.score = {};
        this.gameMode = 'Free For All';
        this.timelimit = 300; // 5 minutes
        
        // Spawn enemies as individual players
        for (let i = 0; i < 5; i++) {
            this.spawnRemotePlayer('bot_' + i, 'knight', 'free', scene);
        }
    }

    setupBombDefuse = function(scene) {
        this.score = { team1: 0, team2: 0 };
        this.gameMode = 'Bomb Defuse';
        this.timelimit = 120; // 2 minutes per round
        
        // Create bomb at center
        const bomb = scene.physics.add.sprite(600, 400, 'bomb');
        this.bomb = bomb;
        
        // Team setup
        for (let i = 0; i < 2; i++) {
            this.spawnRemotePlayer('bot_' + i, 'knight', 'team1', scene);
        }
        for (let i = 2; i < 4; i++) {
            this.spawnRemotePlayer('bot_' + i, 'assassin', 'team2', scene);
        }
    }

    runCustomGameMode = function(scene) {
        // Execute custom code from editor
        try {
            const customCode = window.customGameCode;
            if (customCode && customCode.onGameStart) {
                customCode.onGameStart(this, scene);
            }
        } catch(e) {
            console.error('Custom game code error:', e);
        }
    }

    handleKill = function(killerId, victimId) {
        if (this.score[killerId]) {
            this.score[killerId]++;
        } else {
            this.score[killerId] = 1;
        }
    }

    updateUI = function() {
        // Update score display
        const scoreText = Object.entries(this.score)
            .map(([player, score]) => `${player}: ${score}`)
            .join(' | ');
        
        document.getElementById('playerCount').textContent = this.players.length;
    }

    exportGameAsJSON = function() {
        return JSON.stringify({
            gameMode: this.gameMode,
            characters: characterSystem.characters,
            weapons: weaponSystem.weapons,
            customCode: window.customGameCode || {},
            timestamp: new Date().toISOString()
        }, null, 2);
    }
}

window.gameEngine = null;
