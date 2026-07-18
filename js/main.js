let currentEditor = null;
let gameInstance = null;
let customGameCode = null;

function startEditor() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('editor').style.display = 'block';
}

function backToMenu() {
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('editor').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    
    if (gameInstance) {
        gameInstance.game.destroy();
        gameInstance = null;
    }
}

function createCharacter() {
    const name = document.getElementById('charName').value;
    const color = document.getElementById('charColor').value;
    const speed = document.getElementById('charSpeed').value;

    if (!name) {
        alert('Please enter a character name');
        return;
    }

    const charId = characterSystem.addCustomCharacter({
        name: name,
        speed: parseInt(speed),
        health: 100,
        color: color,
        abilities: []
    });

    alert(`✅ Character "${name}" created!`);
    document.getElementById('charName').value = '';
    document.getElementById('charSpeed').value = 150;
}

function createWeapon() {
    const name = document.getElementById('weaponName').value;
    const damage = document.getElementById('weaponDmg').value;
    const fireRate = document.getElementById('weaponRate').value;
    const type = document.getElementById('weaponType').value;

    if (!name) {
        alert('Please enter a weapon name');
        return;
    }

    const weaponId = weaponSystem.addCustomWeapon({
        name: name,
        damage: parseInt(damage),
        fireRate: parseInt(fireRate),
        type: type,
        ammo: 999
    });

    alert(`⚔️ Weapon "${name}" created!`);
    document.getElementById('weaponName').value = '';
    document.getElementById('weaponDmg').value = 25;
    document.getElementById('weaponRate').value = 200;
}

function loadPreset(preset) {
    startEditor();
    
    switch(preset) {
        case 'tdm':
            document.getElementById('gameMode').value = 'tdm';
            alert('✅ Team Deathmatch preset loaded!\nCreate 2 teams and battle!');
            break;
        case 'bomb':
            document.getElementById('gameMode').value = 'bomb';
            alert('✅ Bomb Defuse preset loaded!\nPlant or defuse the bomb!');
            break;
    }
}

function startGame() {
    const gameMode = document.getElementById('gameMode').value;
    
    document.getElementById('editor').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    // Get selected character
    const characters = Object.keys(characterSystem.characters);
    gameInstance = new GameEngine(gameMode);

    alert(`🎮 Game started in ${gameMode} mode!`);
}

function testCode() {
    const code = document.getElementById('customCode').value;
    
    try {
        // Safely
