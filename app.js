// --- DATA & CONFIG ---
const INITIAL_PLAYER = {
  username: '', gold: 50, xp: 0, level: 1, 
  hp: 100, maxHp: 100, atk: 12, def: 5,
  floor: 1, room: 1,
  weapon: { name: 'Épée de bois', atk: 2 },
  armor: { name: 'Tunique en loques', def: 1 },
  inventory: [],
  unlockedSkins: ['⚔️'],
  currentSkin: '⚔️'
};

const ENEMIES = [
  { name: 'Rat Mutant', hp: 30, atk: 6, def: 2, xp: 15, gold: 10, skin: '🐀' },
  { name: 'Squelette', hp: 45, atk: 9, def: 4, xp: 25, gold: 20, skin: '💀' },
  { name: 'Slime', hp: 20, atk: 4, def: 10, xp: 20, gold: 15, skin: '🧪' },
  { name: 'Guerrier Déchu', hp: 60, atk: 12, def: 6, xp: 40, gold: 35, skin: '🤺' }
];

const BOSSES = [
  { name: 'Roi Goblin', hp: 150, atk: 20, def: 10, xp: 200, gold: 150, skin: '👹' },
  { name: 'Dragon de Pierre', hp: 300, atk: 35, def: 25, xp: 500, gold: 400, skin: '🐲' }
];

const SHOP_ITEMS = {
  weapons: [
    { id: 'w1', name: 'Glaive de Fer', price: 150, atk: 8, icon: '🗡️' },
    { id: 'w2', name: 'Hache de Bataille', price: 400, atk: 18, icon: '🪓' },
    { id: 'w3', name: 'Lame Solaire', price: 1200, atk: 45, icon: '☀️' }
  ],
  armor: [
    { id: 'a1', name: 'Cotte de Mailles', price: 200, def: 6, icon: '🛡️' },
    { id: 'a2', name: 'Cuirasse Royale', price: 600, def: 15, icon: '🧥' }
  ],
  potions: [
    { id: 'p1', name: 'Potion de Vie', price: 30, heal: 50, icon: '🧪' }
  ],
  skins: [
    { id: 's1', name: 'Chevalier', price: 500, skin: '🏇' },
    { id: 's2', name: 'Mage', price: 800, skin: '🧙' },
    { id: 's3', name: 'Ninja', price: 1500, skin: '🥷' }
  ]
};

let player = null;
let enemy = null;
let currentTab = 'dungeon';

// --- CORE ENGINE ---

window.onload = () => {
  const fill = document.getElementById('load-fill');
  let p = 0;
  const iv = setInterval(() => {
    p += 10;
    fill.style.width = p + '%';
    if(p >= 100) {
      clearInterval(iv);
      document.getElementById('loading-screen').classList.add('hidden');
      document.getElementById('auth-screen').classList.remove('hidden');
    }
  }, 100);
};

function authLogin() {
  const u = document.getElementById('auth-user').value.trim().toUpperCase();
  const p = document.getElementById('auth-pass').value;
  if(!u || !p) return showToast("Pseudo et mot de passe requis !");

  let users = JSON.parse(localStorage.getItem('dk_users') || '[]');
  let user = users.find(x => x.username === u);

  if(!user) {
    user = { ...INITIAL_PLAYER, username: u, password: p };
    users.push(user);
    localStorage.setItem('dk_users', JSON.stringify(users));
    showToast("Compte créé ! Bienvenue.");
  } else if(user.password !== p) {
    return showToast("Mauvais mot de passe !");
  }

  player = user;
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  
  spawnEnemy();
  updateUI();
  renderShop();
}

function save() {
  let users = JSON.parse(localStorage.getItem('dk_users') || '[]');
  const idx = users.findIndex(u => u.username === player.username);
  if(idx !== -1) {
    users[idx] = player;
    localStorage.setItem('dk_users', JSON.stringify(users));
  }
}

function updateUI() {
  if(!player) return;
  document.getElementById('tb-name').innerText = player.username;
  document.getElementById('tb-level').innerText = "Niv. " + player.level;
  document.getElementById('tb-xp').innerText = player.xp + " XP";
  document.getElementById('tb-gold').innerText = Math.floor(player.gold);
  document.getElementById('tb-floor').innerText = "Donjon " + player.floor;

  document.getElementById('p-name').innerText = player.username;
  document.getElementById('p-hp').innerText = `${player.hp}/${player.maxHp}`;
  document.getElementById('p-hp-bar').style.width = (player.hp / player.maxHp * 100) + "%";
  document.getElementById('p-stats').innerText = `ATK: ${player.atk + (player.weapon?.atk||0)} | DEF: ${player.def + (player.armor?.def||0)}`;
  document.getElementById('player-sprite').innerText = player.currentSkin;

  const xpNeeded = player.level * 100;
  document.getElementById('xp-bar').style.width = (player.xp / xpNeeded * 100) + "%";
  document.getElementById('xp-label').innerText = `${player.xp} / ${xpNeeded} XP`;

  document.getElementById('floor-badge').innerText = `🏰 DONJON ${player.floor} - SALLE ${player.room}`;
}

// --- COMBAT LOGIC ---

function spawnEnemy() {
  const isBoss = player.room === 10;
  const base = isBoss ? BOSSES[Math.min(player.floor-1, BOSSES.length-1)] : ENEMIES[Math.floor(Math.random()*ENEMIES.length)];
  
  const mult = 1 + (player.floor - 1) * 0.5;
  enemy = {
    ...base,
    hp: Math.floor(base.hp * mult),
    maxHp: Math.floor(base.hp * mult),
    atk: Math.floor(base.atk * mult),
    def: Math.floor(base.def * mult),
    xp: Math.floor(base.xp * mult),
    gold: Math.floor(base.gold * mult)
  };

  document.getElementById('e-name').innerText = enemy.name + (isBoss ? " (BOSS)" : "");
  document.getElementById('e-hp').innerText = `${enemy.hp}/${enemy.maxHp}`;
  document.getElementById('e-hp-bar').style.width = "100%";
  document.getElementById('e-stats').innerText = `ATK: ${enemy.atk} | DEF: ${enemy.def}`;
  document.getElementById('enemy-sprite').innerText = enemy.skin;
  
  log(`Un ${enemy.name} bloque le passage !`, 'log-e');
  setActions(true);
}

function doAttack() {
  if(!player || !enemy) return;

  const pAtk = player.atk + (player.weapon?.atk || 0);
  const dmgToEnemy = Math.max(1, pAtk - enemy.def);
  enemy.hp -= dmgToEnemy;
  log(`Tu infliges ${dmgToEnemy} dégâts au ${enemy.name}.`, 'log-p');

  if(enemy.hp <= 0) {
    enemy.hp = 0;
    updateEnemyUI();
    winBattle();
    return;
  }

  setTimeout(() => {
    const pDef = player.def + (player.armor?.def || 0);
    const dmgToPlayer = Math.max(1, enemy.atk - pDef);
    player.hp -= dmgToPlayer;
    log(`${enemy.name} te frappe et t'inflige ${dmgToPlayer} dégâts.`, 'log-e');
    
    if(player.hp <= 0) {
      player.hp = 0;
      updateUI();
      document.getElementById('gameover-modal').classList.remove('hidden');
    }
    updateUI();
  }, 400);

  updateEnemyUI();
}

function updateEnemyUI() {
  document.getElementById('e-hp').innerText = `${enemy.hp}/${enemy.maxHp}`;
  document.getElementById('e-hp-bar').style.width = (enemy.hp / enemy.maxHp * 100) + "%";
}

function winBattle() {
  log(`Victoire ! Tu as vaincu le ${enemy.name}.`, 'log-win');
  log(`+${enemy.xp} XP | +${enemy.gold} Or`, 'log-win');
  
  player.xp += enemy.xp;
  player.gold += enemy.gold;
  
  const xpNeeded = player.level * 100;
  if(player.xp >= xpNeeded) {
    player.level++;
    player.xp = 0;
    player.maxHp += 20;
    player.hp = player.maxHp;
    player.atk += 3;
    player.def += 2;
    showLevelUp();
  }

  setActions(false);
  save();
  updateUI();
}

function nextRoom() {
  player.room++;
  if(player.room > 10) {
    player.room = 1;
    player.floor++;
    showToast(`Bienvenue au Donjon ${player.floor} !`);
  }
  spawnEnemy();
  updateUI();
}

function respawn() {
  player.hp = player.maxHp;
  player.room = 1;
  document.getElementById('gameover-modal').classList.add('hidden');
  spawnEnemy();
  updateUI();
}

// --- UI HELPERS ---

function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.getElementById('tab-' + id).classList.remove('hidden');
  currentTab = id;
  if(id === 'inventory') renderInventory();
}

function log(msg, cls) {
  const l = document.getElementById('battle-log');
  const d = document.createElement('div');
  d.className = 'log-msg ' + cls;
  d.innerText = `> ${msg}`;
  l.prepend(d);
}

function setActions(fighting) {
  document.getElementById('btn-attack').classList.toggle('hidden', !fighting);
  document.getElementById('btn-skill').classList.toggle('hidden', !fighting);
  document.getElementById('btn-flee').classList.toggle('hidden', !fighting);
  
  const isNextVisible = !fighting && player.room < 9;
  const isBossVisible = !fighting && player.room === 9;
  const isAfterBossVisible = !fighting && player.room === 10;

  document.getElementById('btn-next').classList.toggle('hidden', !isNextVisible && !isAfterBossVisible);
  document.getElementById('btn-boss').classList.toggle('hidden', !isBossVisible);
}

function showToast(m) {
  const c = document.getElementById('toast-container');
  if(!c) return;
  const t = document.createElement('div');
  t.className = 'toast'; t.innerText = m;
  c.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function renderShop() {
  const container = document.getElementById('shop-items');
  if(!container) return;
  container.innerHTML = '';
  Object.keys(SHOP_ITEMS).forEach(cat => {
    SHOP_ITEMS[cat].forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-icon">${item.icon || item.skin || '📦'}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-stats">${item.atk ? 'ATK +'+item.atk : (item.def ? 'DEF +'+item.def : '')}</div>
        <div class="item-price">${item.price} 💰</div>
        <button class="btn-primary" style="padding: 5px; font-size: 0.8rem;" onclick="buyItem('${cat}', '${item.id}')">Acheter</button>
      `;
      container.appendChild(card);
    });
  });
}

function buyItem(cat, id) {
  const item = SHOP_ITEMS[cat].find(x => x.id === id);
  if(player.gold < item.price) return showToast("Pas assez d'or !");
  
  player.gold -= item.price;
  if(cat === 'potions') {
    player.hp = Math.min(player.maxHp, player.hp + item.heal);
    showToast(`Vie restaurée !`);
  } else if(cat === 'skins') {
    if(!player.unlockedSkins.includes(item.skin)) player.unlockedSkins.push(item.skin);
    player.currentSkin = item.skin;
    showToast(`Nouveau skin équipé !`);
  } else {
    player.inventory.push({...item, type: cat});
    showToast(`${item.name} ajouté au sac.`);
  }
  save();
  updateUI();
}

function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  if(!grid) return;
  grid.innerHTML = '';
  player.inventory.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-name">${item.name}</div>
      <button class="btn-primary" style="padding: 5px; font-size: 0.8rem;" onclick="equipItem(${i})">Équiper</button>
    `;
    grid.appendChild(card);
  });
  
  document.getElementById('slot-weapon').innerHTML = `⚔️<br><small>${player.weapon?.name || 'Vide'}</small>`;
  document.getElementById('slot-armor').innerHTML = `🛡️<br><small>${player.armor?.name || 'Vide'}</small>`;
}

function equipItem(index) {
  const item = player.inventory[index];
  if(item.type === 'weapons') {
    const old = player.weapon;
    player.weapon = item;
    player.inventory.splice(index, 1);
    if(old && old.name !== 'Épée de bois') player.inventory.push(old);
  } else {
    const old = player.armor;
    player.armor = item;
    player.inventory.splice(index, 1);
    if(old && old.name !== 'Tunique en loques') player.inventory.push(old);
  }
  save();
  updateUI();
  renderInventory();
}

function logout() { location.reload(); }
function showLevelUp() { document.getElementById('levelup-modal').classList.remove('hidden'); }
function closeLevelUp() { document.getElementById('levelup-modal').classList.add('hidden'); }
