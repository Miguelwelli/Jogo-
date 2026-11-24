const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const THREE = require('three');

const html = fs.readFileSync('index.html', 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
function createGame() {
  const dom = new JSDOM(html, { url: 'https://example.test/', runScripts: 'outside-only' });
  const w = dom.window;
  w.THREE = THREE;
  THREE.WebGLRenderer = function () {
    this.domElement = w.document.createElement('canvas'); this.shadowMap = {};
    this.setSize = this.setPixelRatio = this.render = () => {};
  };
  w.AudioContext = function () { this.state = 'running'; };
  w.requestAnimationFrame = () => {};
  let now = 0, nextId = 1, timers = [];
  Object.defineProperty(w.performance, 'now', { value: () => now });
  w.setTimeout = (fn, ms) => { const id = nextId++; timers.push({ id, at: now + ms, fn }); return id; };
  w.clearTimeout = id => { timers = timers.filter(t => t.id !== id); };
  w.eval(script.replace('      animate();', `
    window.testGame = { duel, setMode, enterMatch, returnToLobby, pauseMatch, resumeMatch, applyDuelHit,
      tickTrainingChallenge, startTrainingChallenge, trainingChallenge, remotePlayers,
      setupOnline: () => { isHost = true; roomCode = 'TEST'; connections.set('peer', { open:true, send:()=>{} }); },
      beginDuel, handleRemoteData, animateVictory, rig: () => victoryRig, botAI,
      setupGuest: () => { isHost = false; roomCode = 'TEST'; connections.set('host', { open:true, send:()=>{} }); },
      poll: () => pollGamepad(.016),
      testSight: () => { camera.position.set(0, 2, 0); _aimDir.set(0, 0, -10); const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 3, .5), new THREE.MeshBasicMaterial()); wall.position.set(0, 2, -5); scene.add(wall); coverMeshes.push(wall); scene.updateMatrixWorld(true); const blocked = aimHasClearSight(10); coverMeshes.pop(); scene.remove(wall); const clear = aimHasClearSight(10); return { blocked, clear }; },
      botTick: (blocked) => { audioCtx = null; botAI.fireTimer = 0; botRay.intersectObjects = () => blocked ? [{}] : []; updateArenaBot(.016); },
      shootTarget: () => { audioCtx = null; raycaster.setFromCamera = () => {}; raycaster.intersectObjects = () => [{ point:new THREE.Vector3(), object:targets[0].body }]; shoot(); }
    }; animate();`));
  function advance(ms) {
    const until = now + ms;
    while (true) {
      timers.sort((a, b) => a.at - b.at || a.id - b.id);
      const item = timers[0];
      if (!item || item.at > until) break;
      timers.shift(); now = item.at; item.fn();
    }
    now = until;
  }
  return { w, g: w.testGame, advance };
}

test('duelo contra bot pausa contagem, registra vitória uma vez e permite revanche', () => {
  const { w, g, advance } = createGame();
  g.setMode('arena');
  w.document.getElementById('bot-difficulty').value = 'easy';
  w.document.getElementById('bot-duel-btn').click();
  assert.equal(g.botAI.difficulty, 'easy');
  assert.equal(g.duel.phase, 'countdown');
  advance(400); g.pauseMatch(); advance(10000);
  assert.equal(g.duel.phase, 'countdown');
  g.resumeMatch(); advance(2600);
  assert.equal(g.duel.phase, 'active');
  for (let i=0; i<4; i++) g.applyDuelHit('guest', 'ar', false);
  assert.equal(g.duel.hostWins, 1);
  advance(6000);
  for (let i=0; i<4; i++) g.applyDuelHit('guest', 'ar', false);
  assert.equal(g.duel.phase, 'finished');
  assert.equal(w.document.getElementById('victory-score').textContent, 'VOCÊ 2 × 0 BOT');
  g.animateVictory(.1);
  assert(g.rig());
  assert.deepEqual(JSON.parse(w.localStorage.getItem('nexuswz_bot_stats_v1')), { played:1, wins:1 });
  w.document.getElementById('victory-rematch').click();
  assert.equal(g.duel.round, 1);
  assert.equal(g.duel.phase, 'countdown');
  assert.equal(g.remotePlayers.size, 1);
  g.returnToLobby();
  assert.equal(g.remotePlayers.size, 0);
  advance(10000);
  assert.equal(g.duel.phase, 'idle');
});

test('partida online conserva sincronização e avisa que pausa não para o duelo', () => {
  const { w, g, advance } = createGame();
  g.setMode('arena'); g.setupOnline(); g.beginDuel();
  g.handleRemoteData('peer', { type:'duel_ready', id:g.duel.id });
  advance(3000);
  assert.equal(g.duel.phase, 'active');
  g.pauseMatch();
  assert(!w.document.getElementById('pause-online-note').classList.contains('hidden'));
  g.handleRemoteData('peer', { type:'duel_hit', id:g.duel.id, round:g.duel.round, weapon:'ar', head:false });
  assert.equal(g.duel.hostHealth, 75);
  assert.equal(w.document.getElementById('duel-life-bar').style.width, '75%');
  g.returnToLobby();
  assert.equal(g.duel.phase, 'idle');
});

test('desafio de treinamento registra tiros, acertos, alvos e recorde', () => {
  const { w, g, advance } = createGame();
  g.enterMatch(); g.startTrainingChallenge();
  for (let i=0; i<4; i++) g.shootTarget();
  assert.equal(g.trainingChallenge.shots, 4);
  assert.equal(g.trainingChallenge.hits, 4);
  assert.equal(g.trainingChallenge.kills, 1);
  advance(60000); g.tickTrainingChallenge();
  assert.equal(g.trainingChallenge.active, false);
  assert.equal(w.localStorage.getItem('nexuswz_training_best_v1'), '1');
});


test('o bot respeita cobertura e só causa dano com linha de visão', () => {
  const { w, g, advance } = createGame();
  g.setMode('arena'); w.document.getElementById('bot-duel-btn').click(); advance(3000);
  w.Math.random = () => 0;
  g.botTick(true); assert.equal(g.duel.hostHealth, 100);
  g.botTick(false); assert.equal(g.duel.hostHealth, 81);
  assert.equal(w.document.getElementById('damage-flash').style.opacity, '1');
});

test('convidado recebe contagem, dano e vitória sincronizados', () => {
  const { w, g } = createGame();
  g.setupGuest();
  g.handleRemoteData('host', { type:'duel_invite', id:'partida' });
  w.document.getElementById('duel-ready').click();
  const base = { type:'duel_snapshot', id:'partida', round:1, hostHealth:100, guestHealth:100, hostWins:0, guestWins:0 };
  g.handleRemoteData('host', { ...base, phase:'countdown', spawn:true, message:'COMEÇA EM 3' });
  assert.equal(g.duel.phase, 'countdown');
  g.handleRemoteData('host', { ...base, phase:'active', message:'LUTE!' });
  g.handleRemoteData('host', { ...base, phase:'active', guestHealth:75, message:'LUTE!' });
  assert.equal(g.duel.guestHealth, 75);
  assert.equal(w.document.getElementById('damage-flash').style.opacity, '1');
  g.handleRemoteData('host', { ...base, round:2, phase:'finished', guestWins:2, hostHealth:0, guestHealth:60 });
  assert(!w.document.getElementById('victory-scene').classList.contains('hidden'));
  assert.equal(w.document.getElementById('victory-score').textContent, 'VOCÊ 2 × 0 ADVERSÁRIO');
});

test('configuração do triângulo funciona com controles não padronizados', () => {
  const { w, g } = createGame();
  const pad = { id:'teste', connected:true, axes:[0,0,0,0], buttons:Array.from({length:16}, () => ({pressed:false,value:0})) };
  w.navigator.getGamepads = () => [pad];
  g.enterMatch();
  w.document.getElementById('btn-map-gamepad').click();
  g.poll(); pad.buttons[2].pressed = true; g.poll();
  assert.equal(w.localStorage.getItem('nexuswz_switch_button_teste'), '2');
  pad.buttons[2].pressed = false; g.poll();
  pad.buttons[2].pressed = true; g.poll();
  assert(w.document.getElementById('lobby-weapon-tag').textContent.includes('SUBMETRALHADORA'));
});

test('saída do adversário mostra encerramento, sem inventar derrota', () => {
  const { w, g, advance } = createGame();
  g.setMode('arena'); g.setupOnline(); g.beginDuel();
  g.handleRemoteData('peer', { type:'duel_ready', id:g.duel.id });
  advance(3000);
  g.handleRemoteData('peer', { type:'duel_leave', id:g.duel.id });
  assert.equal(g.duel.phase, 'aborted');
  assert.equal(w.document.getElementById('duel-result-title').textContent, 'PARTIDA ENCERRADA');
  assert(w.document.getElementById('duel-result-score').textContent.includes('saiu'));
  assert(!w.document.getElementById('duel-result').classList.contains('hidden'));
  g.returnToLobby();
  assert.equal(g.duel.phase, 'idle');
});


test('assistência de mira não atravessa cobertura', () => {
  const { g } = createGame();
  const result = g.testSight();
  assert.equal(result.blocked, false);
  assert.equal(result.clear, true);
});
