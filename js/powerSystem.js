class PowerSystem {
    constructor() {
        this.powers = {};
        this.loadDefaultPowers();
    }

    loadDefaultPowers() {
        this.powers = {
            shield: {
                name: 'Shield Barrier',
                cooldown: 15000,
                duration: 5000,
                description: 'Block 50% of incoming damage for 5 seconds',
                icon: '🛡️',
                effect: (player, scene) => {
                    player.shieldActive = true;
                    player.shieldDuration = 5000;
                    
                    const shield = scene.physics.add.circle(player.x, player.y, 50, 0x00ffff, 0.3);
                    shield.player = player;
                    
                    setTimeout(() => {
                        player.shieldActive = false;
                        shield.destroy();
                    }, 5000);
                }
            },

            speedBoost: {
                name: 'Speed Boost',
                cooldown: 20000,
                duration: 8000,
                description: 'Increase movement speed by 100% for 8 seconds',
                icon: '⚡',
                effect: (player, scene) => {
                    const originalSpeed = player.speed;
                    player.speed *= 2;
                    player.speedBoosted = true;
                    
                    setTimeout(() => {
                        player.speed = originalSpeed;
                        player.speedBoosted = false;
                    }, 8000);
                }
            },

            heal: {
                name: 'Healing Wave',
                cooldown: 25000,
                duration: 0,
                description: 'Restore 50% of max health',
                icon: '❤️',
                effect: (player, scene) => {
                    const maxHealth = 100;
                    player.health = Math.min(player.health + 50, maxHealth);
                }
            },

            berserk: {
                name: 'Berserk Mode',
                cooldown: 30000,
                duration: 6000,
                description: 'Double damage output for 6 seconds',
                icon: '😤',
                effect: (player, scene) => {
                    player.damageMultiplier = 2;
                    player.berserkerMode = true;
                    
                    setTimeout(() => {
                        player.damageMultiplier = 1;
                        player.berserkerMode = false;
                    }, 6000);
                }
            },

            shadowClone: {
                name: 'Shadow Clone',
                cooldown: 40000,
                duration: 10000,
                description: 'Create a decoy clone that distracts enemies',
                icon: '👤',
                effect: (player, scene) => {
                    const clone = scene.physics.add.sprite(player.x + 50, player.y, 'player');
                    clone.setTint(0x666666);
                    clone.isClone = true;
                    clone.targetPlayer = player;
                    
                    // Clone moves randomly
                    setInterval(() => {
                        if (clone.active) {
                            clone.setVelocity(
                                (Math.random() - 0.5) * 200,
                                (Math.random() - 0.5) * 200
                            );
                        }
                    }, 1000);
                    
                    setTimeout(() => {
                        clone.destroy();
                    }, 10000);
                }
            },

            timeWarp: {
                name: 'Time Warp',
                cooldown: 45000,
                duration: 5000,
                description: 'Slow down time by 50% for all enemies',
                icon: '⏱️',
                effect: (player, scene) => {
                    scene.physics.world.timeScale = 0.5;
                    
                    setTimeout(() => {
                        scene.physics.world.timeScale = 1;
                    }, 5000);
                }
            },

            meteorStrike: {
                name: 'Meteor Strike',
                cooldown: 35000,
                duration: 0,
                description: 'Strike enemies in an area with meteors (200 damage)',
                icon: '☄️',
                effect: (player, scene) => {
                    const radius = 200;
                    const meteors = 8;
                    
                    for (let i = 0; i < meteors; i++) {
                        const angle = (i / meteors) * Math.PI * 2;
                        const x = player.x + Math.cos(angle) * radius;
                        const y = player.y + Math.sin(angle) * radius;
                        
                        const meteor = scene.physics.add.sprite(x, y - 200, 'meteor');
                        meteor.damage = 200;
                        meteor.setVelocityY(400);
                        
                        scene.physics.overlap(meteor, scene.enemies, (m, enemy) => {
                            if (enemy.takeDamage) {
                                enemy.takeDamage(m.damage);
                            }
                            m.destroy();
                        });
                        
                        setTimeout(() => {
                            if (meteor.active) meteor.destroy();
                        }, 3000);
                    }
                }
            }
        };
    }

    addCustomPower(powerData) {
        const id = powerData.name.toLowerCase().replace(/\s/g, '_');
        this.powers[id] = {
            name: powerData.name,
            cooldown: powerData.cooldown || 20000,
            duration: powerData.duration || 5000,
            description: powerData.description,
            icon: powerData.icon || '✨',
            effect: powerData.effect
        };
        return id;
    }

    usePower(powerId, player, scene) {
        const power = this.powers[powerId];
        if (!power) return false;

        if (player.powerCooldowns && player.powerCooldowns[powerId]) {
            const remaining = player.powerCooldowns[powerId] - Date.now();
            if (remaining > 0) {
                console.log(`Power on cooldown for ${remaining}ms`);
                return false;
            }
        }

        // Execute power effect
        power.effect(player, scene);

        // Set cooldown
        if (!player.powerCooldowns) player.powerCooldowns = {};
        player.powerCooldowns[powerId] = Date.now() + power.cooldown;

        // Broadcast to other players
        networking.broadcastPlayerAction({
            type: 'usePower',
            playerId: player.playerId,
            power: powerId,
            x: player.x,
            y: player.y
        });

        return true;
    }

    getPowerList() {
        return Object.entries(this.powers).map(([key, power]) => ({
            key,
            ...power
        }));
    }
}

const powerSystem = new PowerSystem();
