// ============================================================
// BulbaWiki — API Layer (Supabase + cache client-side)
// ============================================================

const SUPABASE_URL  = 'https://qyvsrbewliqplnmljxck.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dnNyYmV3bGlxcGxubWxqeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODY1MzcsImV4cCI6MjA4OTc2MjUzN30.VEKGHrEKE762PuObbkeanTl_okis_X2SAEtGE4JFbso'

const _sb  = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const _cache = {}

// Generic: fetch ALL rows of a table (no server-side pagination)
async function _all(table, select = '*', order = 'id') {
  if (_cache[table]) return _cache[table]
  const PAGE = 1000
  let rows = [], from = 0, done = false
  while (!done) {
    const { data, error } = await _sb.from(table).select(select)
      .order(order).range(from, from + PAGE - 1)
    if (error) { console.error('[BwAPI]', table, error); break }
    rows = rows.concat(data)
    done = data.length < PAGE
    from += PAGE
  }
  _cache[table] = rows
  return rows
}

const BwAPI = {

  // ── Pokémon ──────────────────────────────────────────────
  async loadPokemon() {
    return _all('pokemon')
  },

  async loadPokemonMoves(pokemonId) {
    const key = `pm_${pokemonId}`
    if (_cache[key]) return _cache[key]
    const { data, error } = await _sb
      .from('pokemon_moves').select('*')
      .eq('pokemon_id', pokemonId).order('level', { nullsFirst: false })
    if (error) { console.error('[BwAPI] pokemon_moves', error); return [] }
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
      _all('items'),
      BwAPI.loadItemCategories(),
      _all('item_crafting', 'item_id'),
      _all('berry_details', 'item_id'),
    ])
    const catMap   = Object.fromEntries(categories.map(c => [c.id, c.name]))
    const craftSet = new Set(crafting.map(c => c.item_id))
    const berrySet = new Set(berries.map(b => b.item_id))
    const result = items.map(item => ({
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
    const { data, error } = await _sb
      .from('item_crafting')
      .select(`*, crafting_slots(*, crafting_slot_options(*))`)
      .eq('item_id', itemId)
    if (error) { console.error('[BwAPI] crafting', error); return null }
    // sort slots by slot_order
    const rec = data?.[0] ?? null
    if (rec?.crafting_slots) {
      rec.crafting_slots.sort((a, b) => a.slot_order - b.slot_order)
    }
    _cache[key] = rec
    return rec
  },

  async loadBerryDetails(itemId) {
    const key = `berry_${itemId}`
    if (_cache[key] !== undefined) return _cache[key]
    const { data, error } = await _sb
      .from('berry_details').select('*').eq('item_id', itemId).maybeSingle()
    if (error) { console.error('[BwAPI] berry', error); return null }
    _cache[key] = data
    return data
  },

  getItemById(id) {
    return (_cache['_items_full'] ?? []).find(i => i.id == id) ?? null
  },

  getCategoryById(id) {
    return (_cache['item_categories'] ?? []).find(c => c.id == id) ?? null
  },

  // ── Moves ─────────────────────────────────────────────────
  async loadMoves() {
    return _all('moves', '*', 'name')
  },

  async loadMoveLearnedBy(moveName) {
    const key = `mlb_${moveName}`
    if (_cache[key]) return _cache[key]
    const { data, error } = await _sb
      .from('pokemon_moves')
      .select('*, pokemon(id, name)')
      .eq('move_name', moveName)
      .order('pokemon_id')
    if (error) { console.error('[BwAPI] move_learned_by', error); return [] }
    _cache[key] = data
    return data
  },

  // ── Abilities ─────────────────────────────────────────────
  async loadAbilities() {
    return _all('abilities', '*', 'name')
  },
}
