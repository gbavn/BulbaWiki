// ============================================================
// BulbaWiki — api.js
// ============================================================

const SUPABASE_URL      = 'https://qyvsrbewliqplnmljxck.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dnNyYmV3bGlxcGxubWxqeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODY1MzcsImV4cCI6MjA4OTc2MjUzN30.VEKGHrEKE762PuObbkeanTl_okis_X2SAEtGE4JFbso'

const _cache   = {}
const _HEADERS = {
  'apikey':        SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
  'Accept':        'application/json',
}

async function _pgFetch(path) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: _HEADERS })
  if (!res.ok) { console.warn('[BwAPI]', path, res.status); return [] }
  return res.json()
}

async function _all(table, select, order) {
  select = select || '*'; order = order || 'id'
  if (_cache[table]) return _cache[table]
  const PAGE = 1000
  let rows = [], offset = 0, done = false
  while (!done) {
    const qs = 'select=' + encodeURIComponent(select) + '&order=' + order + '&limit=' + PAGE + '&offset=' + offset
    const page = await _pgFetch(table + '?' + qs)
    rows = rows.concat(page); done = page.length < PAGE; offset += PAGE
  }
  _cache[table] = rows
  return rows
}

const BwAPI = {

  // ── Pokémon ──────────────────────────────────────────────
  async loadPokemon() { return _all('pokemon', '*', 'pokeapi_id') },

  async loadPokemonMoves(pokemonId) {
    const key = 'pm_' + pokemonId
    if (_cache[key]) return _cache[key]
    const data = await _pgFetch('pokemon_moves?select=id,pokemon_id,move_id,level,learn_method,moves(id,name,type,category)&pokemon_id=eq.' + pokemonId + '&order=level.asc.nullslast,move_id.asc')
    _cache[key] = data; return data
  },

  async loadPokemonAbilities(pokemonId) {
    const key = 'pab_' + pokemonId
    if (_cache[key]) return _cache[key]
    const data = await _pgFetch('pokemon_abilities?select=*,abilities(id,name,description)&pokemon_id=eq.' + pokemonId)
    _cache[key] = data; return data
  },

  async loadPokemonLocations(pokemonId) {
    const key = 'ploc_' + pokemonId
    if (_cache[key]) return _cache[key]
    const maps   = await _pgFetch('map_pokemon?select=*,maps(id,name,forum_url)&pokemon_id=eq.' + pokemonId)
    const routes = await _pgFetch('route_object_pokemon?select=*,route_objects(id,name,forum_url)&pokemon_id=eq.' + pokemonId)
    const result = { maps, routeObjects: routes }
    _cache[key] = result; return result
  },

  // Itens que um Pokémon dropa/produz
  async loadPokemonDrops(pokemonId) {
    const key = 'drops_' + pokemonId
    if (_cache[key] !== undefined) return _cache[key]
    const [held, produced] = await Promise.all([
      _pgFetch('pokemon_held_items?select=*,items(id,name,sprites,category_id)&pokemon_id=eq.' + pokemonId),
      _pgFetch('pokemon_producers?select=*,items(id,name,sprites,category_id)&pokemon_id=eq.' + pokemonId),
    ])
    const result = { held, produced }
    _cache[key] = result; return result
  },

  // ── Items ─────────────────────────────────────────────────
  async loadItemCategories() { return _all('item_categories', '*', 'name') },

  async loadItems() {
    if (_cache['_items_full']) return _cache['_items_full']
    const items      = await _all('items', '*', 'name')
    const categories = await BwAPI.loadItemCategories()
    const crafting   = await _all('item_crafting', 'item_id', 'item_id')
    const berries    = await _all('berry_details', 'item_id', 'item_id')
    const catMap     = {}
    categories.forEach(function(c) { catMap[c.id] = c.name })
    const craftSet   = new Set(crafting.map(function(c) { return c.item_id }))
    const berrySet   = new Set(berries.map(function(b)  { return b.item_id }))
    const result     = items.map(function(item) {
      return Object.assign({}, item, {
        category_name: catMap[item.category_id] || null,
        is_craftable:  craftSet.has(item.id),
        is_berry:      berrySet.has(item.id),
      })
    })
    _cache['_items_full'] = result; return result
  },

  async loadItemCrafting(itemId) {
    const key = 'craft_' + itemId
    if (_cache[key] !== undefined) return _cache[key]
    const recs = await _pgFetch('item_crafting?select=*,crafting_slots(*,crafting_slot_options(*))&item_id=eq.' + itemId)
    const rec  = (recs && recs[0]) || null
    if (rec && rec.crafting_slots) rec.crafting_slots.sort(function(a,b){ return a.slot_order - b.slot_order })
    _cache[key] = rec; return rec
  },

  async loadBerryDetails(itemId) {
    const key = 'berry_' + itemId
    if (_cache[key] !== undefined) return _cache[key]
    const recs = await _pgFetch('berry_details?select=*&item_id=eq.' + itemId + '&limit=1')
    _cache[key] = (recs && recs[0]) || null; return _cache[key]
  },

  async loadItemSources(itemId) {
    const key = 'isrc_' + itemId
    if (_cache[key] !== undefined) return _cache[key]
    const routeRows = await _pgFetch('route_object_items?select=*,route_objects(id,name,forum_url)&item_id=eq.' + itemId)
    const questRows = await _pgFetch('quest_items?select=*,npc_quests(id,name,npc_id,npcs(id,name,forum_url))&item_id=eq.' + itemId + '&role=eq.reward')
    const result = { routeObjects: routeRows, quests: questRows }
    _cache[key] = result; return result
  },

  // Pokémon que dropam/produzem este item
  async loadItemDroppedBy(itemId) {
    const key = 'droppedby_' + itemId
    if (_cache[key] !== undefined) return _cache[key]
    const [held, produced] = await Promise.all([
      _pgFetch('pokemon_held_items?select=*,pokemon(id,name,pokeapi_id,artwork_normal,type1,type2)&item_id=eq.' + itemId),
      _pgFetch('pokemon_producers?select=*,pokemon(id,name,pokeapi_id,artwork_normal,type1,type2)&item_id=eq.' + itemId),
    ])
    const result = { held, produced }
    _cache[key] = result; return result
  },

  getItemById(id) { return (_cache['_items_full'] || []).find(function(i) { return i.id === id }) || null },
  getCategoryById(id) { return (_cache['item_categories'] || []).find(function(c) { return c.id === id }) || null },

  // ── Moves ─────────────────────────────────────────────────
  async loadMoves() { return _all('moves', '*', 'name') },

  async loadMoveLearnedBy(moveId) {
    const key = 'mlb_' + moveId
    if (_cache[key]) return _cache[key]
    // move_name coluna nao existe — filtrar por move_id (FK)
    const data = await _pgFetch('pokemon_moves?select=id,pokemon_id,move_id,level,learn_method,pokemon(id,name,pokeapi_id,artwork_normal,type1,type2)&move_id=eq.' + encodeURIComponent(moveId) + '&order=pokemon_id')
    _cache[key] = data; return data
  },

  // ── Abilities ─────────────────────────────────────────────
  async loadAbilities() { return _all('abilities', '*', 'name') },

  // Pokémon que possuem esta habilidade
  async loadAbilityPokemon(abilityId) {
    const key = 'abpoke_' + abilityId
    if (_cache[key] !== undefined) return _cache[key]
    const data = await _pgFetch(
      'pokemon_abilities?select=ability_type,pokemon(id,name,pokeapi_id,artwork_normal,type1,type2)&ability_id=eq.' + abilityId + '&order=pokemon_id'
    )
    _cache[key] = data; return data
  },

  searchPokemon(query) {
    const q = (query || '').toLowerCase().trim()
    const all = _cache['pokemon'] || []
    if (!q) return all.slice(0, 20)
    return all.filter(function(p) { return p.name.toLowerCase().includes(q) }).slice(0, 20)
  },
}
