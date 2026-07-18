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
        // Safely evaluate custom code
        customGameCode = {};
        const func = new Function('gameEngine', 'scene', code);
        
        // Test run
        if (gameInstance && gameInstance.scene) {
            func(gameInstance, gameInstance.scene);
            alert('✅ Code compiled successfully!\nNo errors found.');
        } else {
            alert('⚠️ Start the game first to test code.');
        }
    } catch(e) {
        alert('❌ Code Error:\n' + e.message);
    }
}

function exportGame() {
    if (!gameInstance) {
        alert('Start a game first');
        return;
    }

    const gameData = gameInstance.exportGameAsJSON();
    const exportData = {
        name: prompt('Enter game name:', 'My Custom Game') || 'CustomGame',
        version: '1.0',
        createdAt: new Date().toISOString(),
        gameConfig: JSON.parse(gameData),
        customCode: document.getElementById('customCode').value
    };

    // Download as JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportData.name}.json`;
    link.click();

    // Also provide GitHub gist code
    const gistCode = generateGistCode(exportData);
    console.log('Share this code with others:\n', gistCode);
    alert('✅ Game exported!\n\nShare code:\n' + gistCode);
}

function generateGistCode(gameData) {
    return `
// Game: ${gameData.name}
// Play: Load this into the Game Maker and click "Import"

const GAME_CONFIG = ${JSON.stringify(gameData.gameConfig, null, 2)};

const CUSTOM_CODE = \`${gameData.customCode}\`;

// To import:
// 1. Go to Game Maker
// 2. Paste this entire code into browser console
// 3. Click "Create Game"
    `.trim();
}

function joinGame() {
    document.getElementById('joinDialog').style.display = 'block';
}

function closeJoinDialog() {
    document.getElementById('joinDialog').style.display = 'none';
}

function connectToPeer() {
    const code = document.getElementById('joinCode').value.toUpperCase();
    
    if (!code) {
        alert('Please enter a code');
        return;
    }

    networking.connectToPeer(code);
    alert('🔗 Connecting to player...');
    document.getElementById('joinDialog').style.display = 'none';
    
    setTimeout(() => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        gameInstance = new GameEngine('custom');
    }, 1000);
}

function copyCode() {
    const code = document.getElementById('shareCode').value;
    navigator.clipboard.writeText(code);
    alert('✅ Code copied to clipboard!');
}

// Load game from exported JSON
function loadGameFromJSON(jsonData) {
    const gameData = JSON.parse(jsonData);
    
    // Restore characters
    Object.assign(characterSystem.characters, gameData.gameConfig.characters);
    
    // Restore weapons
    Object.assign(weaponSystem.weapons, gameData.gameConfig.weapons);
    
    // Restore custom code
    document.getElementById('customCode').value = gameData.customCode;
    
    alert('✅ Game loaded: ' + gameData.name);
    startEditor();
}

// Initialize on page load
window.addEventListener('load', () => {
    console.log('🎮 Game Maker loaded');
    console.log('🔑 Your Peer ID:', networking.peerId);
});

