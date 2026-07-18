class GameModeManager {
    static MODES = {
        teamDeathmatch: {
            name: 'Team Deathmatch',
            description: '2v2 battle. First team to 20 kills wins!',
            timeLimit: 600,
            teamBased: true,
            winCondition: (game) => game.score.team1 >= 20 || game.score.team2 >= 20,
            onStart: (game, scene) => {
                game.score = { team1: 0, team2: 0 };
                // Spawn weapons scattered
                for (let i = 0; i < 8; i++) {
                    const weapon = scene.physics.add.sprite(
                        Math.random() * 1200,
                        Math.random() * 800,
                        'weapon'
                    );
                    weapon.weaponType = Object.keys(weaponSystem.weapons)[i % 5];
                }
            }
        },

        freeForAll: {
            name: 'Free For All',
            description: 'Every player for themselves! Highest score wins!',
            timeLimit: 300,
            teamBased: false,
            winCondition: (game) => game.timeLimitReached,
            onStart: (game, scene) => {
                game.score = {};
            }
        },

        bombDefuse: {
            name: 'Bomb Defuse',
            description: 'Plant or defuse the bomb. 2 rounds of 2 minutes!',
            timeLimit: 240,
            teamBased: true,
            winCondition: (game) => {
                return game.bombPlanted && game.bombExploded ||
                       game.bombPlanted && game.bombDefused;
            },
            onStart: (game, scene) => {
                game.score = { team1: 0, team2: 0 };
                game.bombPlanted = false;
                game.bombExploded = false;
                game.bombDefused = false;
                
                // Create bomb zone at center
                const bombZone = scene.physics.add.zone(600, 400, 100, 100);
                game.bombZone = bombZone;
            }
        },

        kingOfTheHill: {
            name: 'King Of The Hill',
            description: 'Control the center zone! Earn points for holding it!',
            timeLimit: 600,
            teamBased: false,
            winCondition: (game) => Object.values(game.score).some(s => s >= 100),
            onStart: (game, scene) => {
                game.score = {};
                
                // Create hill zone
                const hill = scene.add.circle(600, 400, 100, 0x00ff00, 0.3);
                game.hill = hill;
                game.hillOwner = null;
            }
        },

        captureTheFlag: {
            name: 'Capture The Flag',
            description: 'Steal enemy flag and bring it back! First team to 3 wins!',
            timeLimit: 600,
            teamBased: true,
            winCondition: (game) => game.score.team1 >= 3 || game.score.team2 >= 3,
            onStart: (game, scene) => {
                game.score = { team1: 0, team2: 0 };
                
                // Create flags
                const flagTeam1 = scene.physics.add.sprite(200, 400, 'flag');
                const flagTeam2 = scene.physics.add.sprite(1000, 400, 'flag');
                
                flagTeam1.team = 'team1';
                flagTeam2.team = 'team2';
                
                game.flags = { team1: flagTeam1, team2: flagTeam2 };
            }
        },

survival: {
            name: 'Survival',
            description: 'Survive against increasing waves of enemies!',
            timeLimit: 0,
            teamBased: false,
            winCondition: (game) => game.wave >= 10,
            onStart: (game, scene) => {
                game.score = {};
                game.wave = 1;
                game.enemiesSpawned = 0;
                game.spawnEnemyWave(scene);
            },
            onUpdate: (game, scene) => {
                if (game.enemies.length === 0 && game.enemiesSpawned > 0) {
                    game.wave++;
                    game.spawnEnemyWave(scene);
                }
            }
        }
    };

    static getMode(modeKey) {
        return this.MODES[modeKey];
    }

    static getAllModes() {
        return Object.entries(this.MODES).map(([key, config]) => ({
            key,
            ...config
        }));
    }
}

// Add to GameEngine prototype
GameEngine.prototype.spawnEnemyWave = function(scene) {
    const enemyCount = 3 + (this.wave * 2);
    
    for (let i = 0; i < enemyCount; i++) {
        const x = Math.random() * 1200;
        const y = Math.random() * 800;
        
        const character = ['knight', 'assassin', 'mage'][i % 3];
        const enemy = characterSystem.spawnCharacter(character, x, y, scene);
        
        enemy.isEnemy = true;
        enemy.ai = {
            targetPlayer: this.localPlayer,
            speed: 100 + (this.wave * 10),
            attackRange: 150
        };
        
        this.enemies.push(enemy);
        this.enemiesSpawned++;
    }
};

GameEngine.prototype.updateEnemyAI = function(scene) {
    this.enemies.forEach((enemy, index) => {
        if (!enemy.active) {
            this.enemies.splice(index, 1);
            return;
        }

        const target = enemy.ai.targetPlayer;
        if (!target) return;

        // Move towards player
        const distX = target.x - enemy.x;
        const distY = target.y - enemy.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance > 20) {
            const angle = Math.atan2(distY, distX);
            enemy.setVelocity(
                Math.cos(angle) * enemy.ai.speed,
                Math.sin(angle) * enemy.ai.speed
            );
        }

        // Attack if in range
        if (distance < enemy.ai.attackRange) {
            if (!enemy.lastAttack || Date.now() - enemy.lastAttack > 1000) {
                target.takeDamage(5);
                enemy.lastAttack = Date.now();
            }
        }
    });
};
