const CLASSES = {
  warrior: {
    name: 'Warrior',
    color: '#c0392b',
    icon: '⚔️',
    stats: { hp: 150, atk: 18, def: 12, speed: 3 },
    statGrowth: { hp: 20, atk: 3, def: 2 },
    standardAttack: { name: 'Power Strike', cooldown: 0, type: 'attack', multiplier: 2.0, desc: 'Heavy melee hit (2x ATK)' },
    abilities: [
      { name: 'Shield Bash', cooldown: 3, desc: 'Stun adjacent enemy', type: 'stun', range: 1.5 },
      { name: 'Fortify', cooldown: 5, desc: '+5 DEF for 3s', type: 'buff_def', value: 5, duration: 3 },
    ],
  },
  rogue: {
    name: 'Rogue',
    color: '#27ae60',
    icon: '🔪',
    stats: { hp: 100, atk: 14, def: 6, speed: 5 },
    statGrowth: { hp: 12, atk: 4, def: 1 },
    standardAttack: { name: 'Throw Dagger', cooldown: 1, type: 'ranged_attack', range: 5, multiplier: 0.8, desc: 'Ranged attack (range 5)' },
    abilities: [
      { name: 'Stealth', cooldown: 4, desc: 'Invisible for 2s', type: 'stealth', duration: 2 },
      { name: 'Backstab', cooldown: 3, desc: '3x melee from behind', type: 'attack', multiplier: 3.0, requiresBehind: true },
    ],
  },
  mage: {
    name: 'Mage',
    color: '#8e44ad',
    icon: '🧿',
    stats: { hp: 80, atk: 22, def: 3, speed: 4 },
    statGrowth: { hp: 8, atk: 5, def: 0 },
    standardAttack: { name: 'Fireball', cooldown: 2, type: 'aoe_attack', range: 4, multiplier: 1.5, desc: 'AoE fire (range 4)' },
    abilities: [
      { name: 'Ice Wall', cooldown: 4, desc: 'Block tile for 3s', type: 'wall', range: 3, duration: 3 },
      { name: 'Lightning', cooldown: 3, desc: 'Chain to 3 enemies', type: 'chain', range: 6, targets: 3, multiplier: 1.2 },
    ],
  },
  cleric: {
    name: 'Cleric',
    color: '#f39c12',
    icon: '☦',
    stats: { hp: 120, atk: 10, def: 8, speed: 3 },
    statGrowth: { hp: 15, atk: 2, def: 3 },
    standardAttack: { name: 'Holy Strike', cooldown: 0, type: 'attack', multiplier: 1.5, desc: 'Melee holy damage (1.5x ATK)' },
    abilities: [
      { name: 'Heal', cooldown: 3, desc: 'Restore 30% max HP', type: 'heal', percent: 0.3 },
      { name: 'Blessing', cooldown: 5, desc: 'Shield nearby allies', type: 'buff_shield', range: 3, value: 10 },
    ],
  },
};
