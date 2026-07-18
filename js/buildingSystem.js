class BuildingSystem {
    constructor() {
        this.buildings = {};
        this.buildingInstances = [];
        this.loadDefaultBuildings();
    }

    loadDefaultBuildings() {
        this.buildings = {
            wall: {
                name: 'Stone Wall',
                health: 100,
                width: 40,
                height: 40,
                cost: 10,
                buildTime: 2000,
                icon: '🧱',
                description: 'Protective barrier'
            },

            turret: {
                name: 'Turret',
                health: 50,
                width: 50,
                height: 50,
                cost: 30,
                buildTime: 5000,
                icon: '🎯',
                description: 'Auto-attacks enemies',
                fireRate: 1000,
                damage: 20,
                range: 300
            },

            healingStation: {
                name: 'Healing Station',
                health: 80,
                width: 40,
                height: 40,
                cost: 25,
                buildTime: 3000,
                icon: '🏥',
                description: 'Heals nearby allies',
                healRate: 10,
                healRange: 150
            },

            ammoBox: {
                name: 'Ammo Box',
                health: 50,
                width: 35,
                height: 35,
                cost: 15,
                buildTime: 1500,
                icon: '📦',
                description: 'Restores ammunition'
            },

            spikeTrap: {
                name: 'Spike Trap',
                health: 30,
                width: 30,
                height: 30,
                cost: 12,
                buildTime: 1000,
                icon: '⚔️',
                description: 'Damages enemies walking over it',
                damage: 25
            },

            shieldGenerator: {
                name: 'Shield Generator',
                health: 120,
                width: 60,
                height: 60,
                cost: 50,
                buildTime: 8000,
                icon: '🔷',
                description: 'Protects area from damage',
                range: 200
            }
        };
    }

    addCustomBuilding(buildingData) {
        const id = buildingData.name.toLowerCase().replace(/\s/g, '_');
        this.buildings[id] = {
            name: buildingData.name,
            health: buildingData.health || 100,
            width: buildingData.width || 40,
            height: buildingData.height || 40,
            cost: buildingData.cost || 20,
            buildTime: buildingData.buildTime || 3000,
            icon: buildingData.icon || '🏗️',
            description: buildingData.description || 'Custom building'
        };
        return id;
    }

    placeBuilding(buildingId, x, y, scene, player) {
        const building = this.buildings[buildingId];
        if (!building) return false;

        // Check if player has enough resources
        if (!player.resources || player.resources < building.cost) {
            console.log('Not enough resources');
            return false;
        }

        // Deduct cost
        player.resources -= building.cost;

        // Create building
        const buildingObj = scene.physics.add.sprite(x, y, 'building');
        buildingObj.setDisplaySize(building.width, building.height);
        buildingObj.buildingType = buildingId;
        buildingObj.health = building.health;
        buildingObj.owner = player.playerId;
        buildingObj.building = building;

        // Building under construction
        buildingObj.buildProgress = 0;
        buildingObj.buildTime = building.buildTime;
        
        const progressBar = scene.add.rectangle(x, y - building.height / 2 - 15, building.width, 5, 0xff0000);
        buildingObj.progressBar = progressBar;

        // Animate build progress
        const buildInterval = setInterval(() => {
            buildingObj.buildProgress += 50;
            progressBar.setScale(buildingObj.buildProgress / building.buildTime, 1);

            if (buildingObj.buildProgress >= building.buildTime) {
                clearInterval(buildInterval);
                buildingObj.isBuilt = true;
                progressBar.setFillStyle(0x00ff00);
                
                // Activate building effects
                this.activateBuilding(buildingObj, scene, player);
            }
        }, 50);

        this.buildingInstances.push(buildingObj);
        return buildingObj;
    }

    activateBuilding(building, scene, player) {
        const buildData = building.building;

        switch(building.buildingType) {
            case 'turret':
                this.activateTurret(building, scene);
                break;
            case 'healing_station':
                this.activateHealingStation(building, scene);
                break;
            case 'shield_generator':
                this.activateShieldGenerator(building, scene);
                break;
            case 'spike_trap':
                this.activateSpikeTrap(building, scene);
                break;
        }
    }

    activateTurret(turret, scene) {
        turret.lastShot = 0;
        
        scene.physics.overlap(turret, scene.enemies, (t, enemy) => {
            if (Date.now() - t.lastShot > turret.building.fireRate) {
                if (enemy.takeDamage) {
                    enemy.takeDamage(turret.building.damage);
                }
                t.lastShot = Date.now();
            }
        });
    }

    activateHealingStation(station, scene) {
        setInterval(() => {
            if (!station.active) return;
            
            // Heal nearby players
            const nearbyPlayers = Phaser.Physics.Arcade.overlapRect(
                scene.physics.world,
                station.x - station.building.healRange,
                station.y - station.building.healRange,
                station.building.healRange * 2,
                station.building.healRange * 2
            );

            nearbyPlayers.forEach(player => {
                if (player.heal) {
                    player.heal(station.building.healRate);
                }
            });
        }, 500);
    }

    activateShieldGenerator(generator, scene) {
        const shield = scene.add.circle(
            generator.x,
            generator.y,
            generator.building.range,
            0x00ffff,
            0.1
        );
