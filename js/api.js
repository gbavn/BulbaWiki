// ============================================================
// BulbaWiki — api.js
// Camada de acesso ao Supabase via PostgREST (sem SDK).
// A anon key só devolve registros published_status='published'
// graças ao RLS configurado no banco.
// ============================================================

const SUPABASE_URL      = 'https://qyvsrbewliqplnmljxck.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dnNyYmV3bGlxcGxubWxqeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODY1MzcsImV4cCI6MjA4OTc2MjUzN30.VEKGHrEKE762PuObbkeanTl_okis_X2SAEtGE4JFbso'

const _cache   = {}
const _HEADERS = {
  'apikey':        SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Accept':        'application/json',
}

// Fetch com headers Supabase
async function _pgFetch(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: _HEADERS })
  if (!res.ok) { console.warn('[BwAPI]', path, res.status); return [] }
  return res.json()
}

// Busca todas as linhas de uma tabela com paginação automática (1000/página)
async function _all(table, select = '*', order = 'id') {
  if (_cache[table]) return _cache[table]
  const PAGE = 1000
  let rows = [], offset = 0, done = false
  while (!done) {
    const qs = `select=${encodeURIComponent(select)}&order=${order}&limit=${PAGE}&offset=${offset}`
    const page = await _pgFetch(`${table}?${qs}`)
    rows  = rows.concat(page)
    done  = page.length < PAGE
    offset += PAGE
  }
  _cache[table] = rows
  return rows
}

const BwAPI = {

  // ── Pokémon ──────────────────────────────────────────────
  async loadPokemon() {
    // Ordena por pokeapi_id para exibição correta da Pokédex
    return _all('pokemon', '*', 'pokeapi_id')
  },

  async loadPokemonMoves(pokemonId) {
    const key = `pm_${pokemonId}`
    if (_cache[key]) return _cache[key]
    const data = await _pgFetch(
      `pokemon_moves?select=*&pokemon_id=eq.${pokemonId}&order=level.asc.nullslast`
    )
    _cache[key] = data
    return data
  },

  // ── Items ─────────────────────────────────────────────────
  async loadItemCategories() {
    return _all('item_categories', '*', 'name')
  },

  async loadItems() {
    if (_cache['_items_full']) return _cache['_items_full']
    const [items, categories, crafting, berries] = await Promise.all([
      _all('items', '*', 'name'),
      BwAPI.loadItemCategories(),
      _all('item_crafting', 'item_id', 'item_id'),
      _all('berry_details', 'item_id', 'item_id'),
    ])
    const catMap   = Object.fromEntries(categories.map(c => [c.id, c.name]))
    const craftSet = new Set(crafting.map(c => c.item_id))
    const berrySet = new Set(berries.map(b => b.item_id))
    const result   = items.map(item => ({
      ...item,
      category_name: catMap[item.category_id] ?? null,
      is_craftable:  craftSet.has(item.id),
      is_berry:      berrySet.has(item.id),
    }))
    _cache['_items_full'] = result
    return result
  },

  async loadItemCrafting(itemId) {
    const key = `craft_${itemId}`
    if (_cache[key] !== undefined) return _cache[key]
    const recs = await _pgFetch(
      `item_crafting?select=*,crafting_slots(*,crafting_slot_options(*))&item_id=eq.${itemId}`
    )
    const rec = recs?.[0] ?? null
    if (rec?.crafting_slots) rec.crafting_slots.sort((a, b) => a.slot_order - b.slot_order)
    _cache[key] = rec
    return rec
  },

  async loadBerryDetails(itemId) {
    const key = `berry_${itemId}`
    if (_cache[key] !== undefined) return _cache[key]
    const recs = await _pgFetch(`berry_details?select=*&item_id=eq.${itemId}&limit=1`)
    _cache[key] = recs?.[0] ?? null
    return _cache[key]
  },

  getItemById(id) {
    return (_cache['_items_full'] ?? []).find(i => i.id === id) ?? null
  },

  getCategoryById(id) {
    return (_cache['item_categories'] ?? []).find(c => c.id === id) ?? null
  },

  // ── Moves ─────────────────────────────────────────────────
  async loadMoves() {
    return _all('moves', '*', 'name')
  },

  async loadMoveLearnedBy(moveName) {
    const key = `mlb_${moveName}`
    if (_cache[key]) return _cache[key]
    const data = await _pgFetch(
      `pokemon_moves?select=*,pokemon(id,name,pokeapi_id)&move_name=eq.${encodeURIComponent(moveName)}&order=pokemon_id`
    )
    _cache[key] = data
    return data
  },

  // ── Abilities ─────────────────────────────────────────────
  async loadAbilities() {
    return _all('abilities', '*', 'name')
  },

  // ── Busca rápida (para ficha.js) ──────────────────────────
  // Retorna pokémon filtrados por nome, máx 20 resultados
  searchPokemon(query) {
    const q   = query.toLowerCase().trim()
    const all = _cache['pokemon'] ?? []
    if (!q) return all.slice(0, 20)
    return all.filter(p => p.name.toLowerCase().includes(q)).slice(0, 20)
  },
}
