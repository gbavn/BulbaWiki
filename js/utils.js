// ============================================================
// BulbaWiki — utils.js
// Helpers puros reutilizados por api.js, router.js e componentes
// ============================================================

// Debounce: atrasa execução de fn por `wait` ms
function debounce(fn, wait = 300) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}

// Remove tags HTML de uma string (para previews de texto)
function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

// Formata o número da Pokédex: 1 → "#0001", 10001 → "#10001"
function formatDexId(pokeapiId) {
  if (pokeapiId == null) return ''
  const n = Number(pokeapiId)
  if (n >= 10000) return '#' + n          // formas alternativas: não faz padding
  return '#' + String(n).padStart(4, '0')
}

// Capitaliza primeira letra
function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Trunca texto com reticências
function truncate(str, max = 80) {
  if (!str || str.length <= max) return str
  return str.slice(0, max).trimEnd() + '…'
}

// Seasons PT-BR
const SEASON_LABELS = {
  spring: 'Primavera',
  summer: 'Verão',
  autumn: 'Outono',
  winter: 'Inverno',
}
function formatSeasons(seasons) {
  if (!seasons?.length) return 'Todas as estações'
  return seasons.map(s => SEASON_LABELS[s] || capitalize(s)).join(', ')
}

// Time of day PT-BR
const TIME_LABELS = { day: 'Dia', night: 'Noite' }
function formatTime(time) {
  if (!time) return 'Qualquer hora'
  return TIME_LABELS[time] || capitalize(time)
}

// Raridade (1-12) → label
function rarityLabel(n) {
  if (n == null) return '—'
  if (n <= 6)  return 'Comum'
  if (n === 7) return 'Incomum'
  if (n <= 9)  return 'Raro'
  if (n === 10) return 'Muito Raro'
  if (n === 11) return 'Exotic Pokémon'
  if (n === 12) return 'Face Especial'
  return String(n)
}

// Formata preço em ₽
function formatPrice(p) {
  if (p == null) return null
  return '₽\u202f' + Number(p).toLocaleString('pt-BR')
}
