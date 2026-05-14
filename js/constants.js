// ============================================================
// BulbaWiki — constants.js
// ============================================================

const TYPE_COLORS = {
  normal:   { bg: '#f0f0e8', text: '#5a5a3a', border: '#d0d0b0' },
  fire:     { bg: '#fdf0e8', text: '#8a3a10', border: '#f0c0a0' },
  water:    { bg: '#e8f0fd', text: '#1a3a8a', border: '#a0c0f0' },
  electric: { bg: '#fff8d0', text: '#7a6a10', border: '#e8d880' },
  grass:    { bg: '#e8f5e0', text: '#3a6a20', border: '#c0e0a0' },
  ice:      { bg: '#e8f8fd', text: '#1a6a7a', border: '#a0e0f0' },
  fighting: { bg: '#fde8e8', text: '#8a1a1a', border: '#f0a0a0' },
  poison:   { bg: '#f0e8f5', text: '#6a2a7a', border: '#d0b0e0' },
  ground:   { bg: '#f5f0e0', text: '#6a5a1a', border: '#e0d0a0' },
  flying:   { bg: '#eaf0fd', text: '#2a4a8a', border: '#b0c8f0' },
  psychic:  { bg: '#fde8f0', text: '#8a1a4a', border: '#f0a0c0' },
  bug:      { bg: '#eef5e0', text: '#3a5a10', border: '#b8d890' },
  rock:     { bg: '#f0ede0', text: '#5a4a20', border: '#d0c890' },
  ghost:    { bg: '#ece8f5', text: '#3a1a5a', border: '#c0a8e0' },
  dragon:   { bg: '#e8e8fd', text: '#1a1a8a', border: '#a0a0f0' },
  dark:     { bg: '#ece8f0', text: '#2a1a3a', border: '#b8a8d0' },
  steel:    { bg: '#eeeef5', text: '#3a3a5a', border: '#c0c0d8' },
  fairy:    { bg: '#fde8f5', text: '#8a1a6a', border: '#f0a0d8' },
}

const TYPE_HEX = {
  normal:'#a8a878',  fire:'#f08030',    water:'#6890f0',   electric:'#f8d030',
  grass:'#78c850',   ice:'#98d8d8',     fighting:'#c03028', poison:'#a040a0',
  ground:'#e0c068',  flying:'#a890f0',  psychic:'#f85888',  bug:'#a8b820',
  rock:'#b8a038',    ghost:'#705898',   dragon:'#7038f8',   dark:'#705848',
  steel:'#b8b8d0',   fairy:'#ee99ac',
}

const STATUS_LABELS = {
  canonical: 'Padrão',
  modified:  'Modificado para o RPG',
  original:  'Original do RPG',
}

const STATUS_COLORS = {
  canonical: { bg: '#e8f5e0', text: '#3a6a20' },
  modified:  { bg: '#fff8d0', text: '#7a6a10' },
  original:  { bg: '#f0e8f5', text: '#6a2a7a' },
}

const CATEGORY_LABELS = {
  physical: 'Físico',
  special:  'Especial',
  status:   'Status',
}

// Valores reais do banco: 'level', 'initial', 'evo', 'egg', 'learnable', 'contest', 'unknown'
// ATENÇÃO: o banco usa 'level' (não 'level-up')
const METHOD_LABELS = {
  'initial':   'Inicial',
  'evo':       'Por Evolução',
  'level':     'Por Nível',
  'learnable': 'Aprendível',
  'egg':       'Egg Move',
  'contest':   'Contest',
  'unknown':   'Desconhecido',
}

// Ordem de exibição dos grupos de moves (per user spec)
const MOVE_ORDER = ['initial', 'evo', 'level', 'learnable', 'egg', 'contest', 'unknown']

const STAT_META = [
  { key: 'hp',         label: 'HP',     color: '#4caf50' },
  { key: 'attack',     label: 'ATK',    color: '#f44336' },
  { key: 'defense',    label: 'DEF',    color: '#ff9800' },
  { key: 'sp_attack',  label: 'SP.ATK', color: '#2196f3' },
  { key: 'sp_defense', label: 'SP.DEF', color: '#00bcd4' },
  { key: 'speed',      label: 'VEL',    color: '#e91e8c' },
]

const PER_PAGE = 12

const SEASON_META = {
  spring: { label: 'Primavera', icon: 'fa-solid fa-seedling',  bg: '#d4edda', color: '#155724', border: '#a8d8b8' },
  summer: { label: 'Verão',     icon: 'fa-solid fa-sun',       bg: '#fff3cd', color: '#7a5c00', border: '#f0d87a' },
  autumn: { label: 'Outono',    icon: 'fa-solid fa-leaf',      bg: '#fde8d8', color: '#7d3712', border: '#f0b890' },
  winter: { label: 'Inverno',   icon: 'fa-solid fa-snowflake', bg: '#d0ecf8', color: '#0c5060', border: '#90c8e8' },
}

const BERRY_RARITY_META = {
  'comum':         { label: 'Comum',      icon: 'fa-solid fa-circle',               bg: '#ededea', color: '#4a4a2a', border: '#d0d0b8' },
  'intermediaria': { label: 'Intermédia', icon: 'fa-solid fa-circle-half-stroke',   bg: '#d8f0d0', color: '#2a5a18', border: '#a8d890' },
  'intermediária': { label: 'Intermédia', icon: 'fa-solid fa-circle-half-stroke',   bg: '#d8f0d0', color: '#2a5a18', border: '#a8d890' },
  'rara':          { label: 'Rara',       icon: 'fa-solid fa-diamond',              bg: '#dcdcfc', color: '#18187a', border: '#a0a0e8' },
  'lendaria':      { label: 'Lendária',   icon: 'fa-solid fa-star',                 bg: '#fff0b0', color: '#6a5000', border: '#e8d060' },
  'lendária':      { label: 'Lendária',   icon: 'fa-solid fa-star',                 bg: '#fff0b0', color: '#6a5000', border: '#e8d060' },
}

const EGG_GROUP_LABELS = {
  'water1':       'Water 1',
  'water2':       'Water 2',
  'water3':       'Water 3',
  'bug':          'Bug',
  'flying':       'Flying',
  'field':        'Field',
  'fairy':        'Fairy',
  'grass':        'Grass',
  'human-like':   'Human-Like',
  'mineral':      'Mineral',
  'amorphous':    'Amorphous',
  'ditto':        'Ditto',
  'dragon':       'Dragon',
  'undiscovered': 'Undiscovered',
  'no-eggs':      'Sem Ovos',
}

// ── Gerador de ficha ──────────────────────────────────────────────────────────

const TYPE_PILL_CODE = {
  bug:'bug', dark:'dark', dragon:'dragon', electric:'elect',
  fairy:'fairy', fighting:'fight', fire:'fire', flying:'fly',
  ghost:'ghost', grass:'grass', ground:'ground', ice:'ice',
  normal:'normal', poison:'poison', psychic:'psy',
  rock:'rock', steel:'steel', water:'water',
}

const TYPE_HEX_BBCODE = {
  bug:'#a8b820', dark:'#705848', dragon:'#7038f8', electric:'#c2a60c',
  fairy:'#ee99ac', fighting:'#c03028', fire:'#f08030', flying:'#a890f0',
  ghost:'#705898', grass:'#78c850', ground:'#e0c068', ice:'#98d8d8',
  normal:'#a8a878', poison:'#a040a0', psychic:'#f85888',
  rock:'#b8a038', steel:'#b8b8d0', water:'#6890f0',
}

const TYPE_IMMUNITIES_BBCODE = {
  dark:    'Imune a golpes do Type [u]Psychic[/u]\nImune a moves do oponente que ganhem prioridade devido à habilidade [u]Prankster[/u]',
  electric:'Imune ao Status Paralisia [i](Paralysis)[/i]',
  fairy:   'Imune aos moves do Type [u]Dragon[/u]',
  fire:    'Imune ao Status Queimadura [i](Burn)[/i]',
  flying:  'Não está no solo [i](Grounded)[/i], não podendo ser afetado por Entry Hazards e Terrains que estejam no solo.\nImune aos moves do Type [u]Ground[/u]',
  ghost:   'Imunes a ficarem presos por moves e habilidades. Imune a moves do Type [u]Fighting e Normal.[/u]\nImunes ao Status [url=https://bulbarpg.forumeiros.com/t12823-regra-guia-status-condition#247572]Sangramento [i](Bleed)[/i][/url]\nPossui 25% extra de escapar com o seu treinador.',
  grass:   'Imune a golpes de [url=https://bulbapedia.bulbagarden.net/wiki/Category:Powder_and_spore_moves]Powder e Spore[/url], à Habilidade [u]Effect Spore[/u] e ao move [u]Leech Seed[/u]',
  ground:  'Imune a moves do Type [u]Eletric[/u].',
  ice:     'Imune ao Status Congelar [i](Freeze)[/i] e a [url=https://bulbarpg.forumeiros.com/t12823-regra-guia-status-condition#247571]Queimadura de Gelo [i](Frostbite)[/i][/url] e ao move [u]Sheer Cold[/u]',
  normal:  'Imune aos moves do Type [u]Ghost[/u].',
  poison:  'Imune ao Status Envenenado [i](Poisoned)[/i], excepto pela habilidade Corrosion. Se estiver no chão [i](grounded)[/i] irá absorver todos os Toxic Spikes do seu lado do campo. Se usar o move [u]Toxic[/u] o move nunca irá falhar.',
  steel:   'Imune ao Status Envenenado [i](Poisoned)[/i] e a [url=https://bulbarpg.forumeiros.com/t12823-regra-guia-status-condition#247572]Sangramento [i](Bleed)[/i][/url]\nImune aos moves de Type [u]Poison[/u].',
}
