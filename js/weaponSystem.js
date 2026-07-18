class WeaponSystem {
    constructor() {
        this.weapons = {};
        this.loadDefaultWeapons();
    }

    loadDefaultWeapons() {
        // Preset weapons
        this.weapons = {
            pistol: {
                name: 'Pistol',
                damage: 15,
                fireRate: 200,
                ammo: 30,
                range: 300,
                type: 'gun',
                animation: 'pistol_fire'
            },
            rifle: {
                name: 'Rifle',
                damage: 25,
                fireRate: 100,
                ammo: 60,
                range: 500,
                type: 'gun',
                animation: 'rifle_fire'
            },
            shotgun: {
                name: 'Shotgun',
                damage: 50,
                fireRate: 800,
                ammo: 12,
                range: 150,
                type: 'gun',
                animation: 'shotgun_fire',
                pellets: 8
            },
            sword: {
                name: 'Sword',
                damage: 40,
                fireRate: 300,
                range: 80,
                type: 'melee',
                animation: 'sword_swing'
            },
            grenade: {
                name: 'Grenade',
                damage: 60,
                fireRate: 1500,
                range: 200,
                type: 'explosive',
                animation: 'grenade_throw',
                explosionRadius: 150
            }
        };
    }

    addCustomWeapon(weaponData) {
        const id = weaponData.name.toLowerCase().replace(/\s/g, '_');
        this.weapons[id] = {
            name: weaponData.name,
            damage: weaponData.damage,
            fireRate: weaponData.fireRate,
            ammo: weaponData.ammo || 999,
            range: weaponData.range || 300,
            type: weaponData.type,
            animation: `${id}_fire`
        };
        return id;
    }

    fire(weaponId, x, y, direction, game) {
        const weapon = this.weapons[weaponId];
        if (!weapon) return;

        switch(weapon.type) {
            case 'gun':
                this.fireProjectile(weapon, x, y, direction, game);
                break;
            case 'melee':
                this.meleeAttack(weapon, x, y, direction, game);
                break;
            case 'explosive':
                this.throwExplosive(weapon, x, y, direction, game);
                break;
        }
    }

    fireProjectile(weapon, x, y, direction, game) {
        const bullet = game.physics.add.sprite(x, y, 'bullet');
        bullet.setVelocity(
            Math.cos(direction) * 400,
            Math.sin(direction) * 400
        );
        bullet.rotation = direction;
        bullet.damage = weapon.damage;
        bullet.lifespan = 5000; // 5 second lifespan
    }

    meleeAttack(weapon, x, y, direction, game) {
        const attackArea = game.physics.add.zone(x, y, 100, 100);
        const enemies = game.physics.overlap(attackArea, game.enemies);
        enemies.forEach(enemy => {
            enemy.takeDamage(weapon.damage);
        });
        attackArea.destroy();
    }

    throwExplosive(weapon, x, y, direction, game) {
        const grenade = game.physics.add.sprite(x, y, 'grenade');
        grenade.setVelocity(
            Math.cos(direction) * 300,
            Math.sin(direction) * 300 - 100 // Arc
        );
        grenade.damage = weapon.damage;
        grenade.radius = weapon.explosionRadius;
        grenade.lifespan = 3000; // Explode after 3 seconds
    }
}

const weaponSystem = new WeaponSystem();
