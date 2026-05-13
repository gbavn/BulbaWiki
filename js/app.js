// ============================================================
// BulbaWiki — app.js
// Componente Alpine principal: bulbaWiki()
//
// Fixes vs. monolito original:
//  1. _handleHash() — removido parseInt; IDs são nanoid TEXT
//  2. pokemonId()   — usa pokeapi_id (INTEGER) em vez do id nanoid
// ============================================================

function bulbaWiki() {
  return {

    // ── Tabs ────────────────────────────────────────────────
    activeTab: 'pokemon',
    tabs: [
      { id: 'pokemon',   label: 'Pokémon'     },
      { id: 'items',     label: 'Itens'       },
      { id: 'moves',     label: 'Moves'       },
      { id: 'abilities', label: 'Habilidades' },
      { id: 'ficha',     label: 'Ficha'       },
    ],

    // ── Data stores ─────────────────────────────────────────
    stores: {
      pokemon:   { data: [], filtered: [], page: 1, loaded: false, loading: false },
      items:     { data: [], filtered: [], page: 1, loaded: false, loading: false },
      moves:     { data: [], filtered: [], page: 1, loaded: false, loading: false },
      abilities: { data: [], filtered: [], page: 1, loaded: false, loading: false },
    },

    // ── Filters ─────────────────────────────────────────────
    fPokemon:   { search: '', type1: '', type2: '', eggGroup: '', canBreed: false, hasArtwork: false },
    fItems:     { search: '', category: '', hasSprite: false, hasPrice: false, isCraftable: false, isBerry: false, priceMin: 0, priceMax: 100000 },
    fMoves:     { search: '', type: '', category: '', status: '', hasContest: false, powerMin: 0, powerMax: 250 },
    fAbilities: { search: '', status: '', hasOutEffect: false },

    // ── Filter option lists ──────────────────────────────────
    allTypes:      Object.keys(TYPE_COLORS),
    allEggGroups:  [],
    allCategories: [],

    // ── UI state ─────────────────────────────────────────────
    filtersOpen: false,

    // ── Modal ────────────────────────────────────────────────
    modal:        { open: false, type: null, data: null, extra: null, loading: false },
    modalHistory: [],
    activeArtwork: 'normal',
    carouselIdx:   0,
    copiedUrl:     false,

    // ── Init ─────────────────────────────────────────────────
    async init() {
      await this.switchTab('pokemon')
      this._handleHash()
      window.addEventListener('hashchange', () => this._handleHash())
    },

    // ── Tab loading ──────────────────────────────────────────
    async switchTab(tab) {
      this.activeTab  = tab
      this.filtersOpen = false
      if (tab === 'ficha') return   // ficha tem seu próprio componente
      const s = this.stores[tab]
      if (s.loaded) return
      s.loading = true
      try {
        if (tab === 'pokemon') {
          s.data = await BwAPI.loadPokemon()
          this.allEggGroups = [...new Set(
            s.data.flatMap(p => [p.egg_group1, p.egg_group2]).filter(Boolean)
          )].sort()
        } else if (tab === 'items') {
          s.data = await BwAPI.loadItems()
          this.allCategories = await BwAPI.loadItemCategories()
        } else if (tab === 'moves') {
          s.data = await BwAPI.loadMoves()
        } else if (tab === 'abilities') {
          s.data = await BwAPI.loadAbilities()
        }
        s.loaded = true
        this.applyFilters(tab)
      } catch (e) {
        console.error('[BwWiki] loadTab', e)
      } finally {
        s.loading = false
      }
    },

    // ── Filters ──────────────────────────────────────────────
    applyFilters(tab) {
      const s = this.stores[tab]
      let d = s.data

      if (tab === 'pokemon') {
        const f = this.fPokemon, q = f.search.toLowerCase().trim()
        d = d.filter(p =>
          (!q || p.name.toLowerCase().includes(q)) &&
          (!f.type1    || p.type1?.toLowerCase() === f.type1) &&
          (!f.type2    || p.type2?.toLowerCase() === f.type2) &&
          (!f.eggGroup || p.egg_group1 === f.eggGroup || p.egg_group2 === f.eggGroup) &&
          (!f.canBreed || p.can_breed) &&
          (!f.hasArtwork || p.artwork_normal)
        )
      } else if (tab === 'items') {
        const f = this.fItems, q = f.search.toLowerCase().trim()
        d = d.filter(i =>
          (!q || i.name.toLowerCase().includes(q)) &&
          (!f.category    || String(i.category_id) === f.category) &&
          (!f.hasSprite   || (i.sprites?.length > 0)) &&
          (!f.hasPrice    || i.price != null) &&
          (!f.isCraftable || i.is_craftable) &&
          (!f.isBerry     || i.is_berry) &&
          (i.price == null || (i.price >= f.priceMin && i.price <= f.priceMax))
        )
      } else if (tab === 'moves') {
        const f = this.fMoves, q = f.search.toLowerCase().trim()
        d = d.filter(m =>
          (!q || m.name.toLowerCase().includes(q)) &&
          (!f.type     || m.type?.toLowerCase() === f.type) &&
          (!f.category || m.category === f.category) &&
          (!f.status   || m.status === f.status) &&
          (!f.hasContest || m.contest_points) &&
          (m.power == null || (m.power >= f.powerMin && m.power <= f.powerMax))
        )
      } else if (tab === 'abilities') {
        const f = this.fAbilities, q = f.search.toLowerCase().trim()
        d = d.filter(a =>
          (!q || a.name.toLowerCase().includes(q)) &&
          (!f.status       || a.status === f.status) &&
          (!f.hasOutEffect || a.out_of_battle_effect)
        )
      }

      s.filtered = d
      s.page = 1
    },

    clearFilters(tab) {
      if (tab === 'pokemon')   this.fPokemon   = { search:'', type1:'', type2:'', eggGroup:'', canBreed:false, hasArtwork:false }
      if (tab === 'items')     this.fItems     = { search:'', category:'', hasSprite:false, hasPrice:false, isCraftable:false, isBerry:false, priceMin:0, priceMax:100000 }
      if (tab === 'moves')     this.fMoves     = { search:'', type:'', category:'', status:'', hasContest:false, powerMin:0, powerMax:250 }
      if (tab === 'abilities') this.fAbilities = { search:'', status:'', hasOutEffect:false }
      this.applyFilters(tab)
    },

    get activeFiltersCount() {
      const tab = this.activeTab
      if (tab === 'pokemon') {
        const f = this.fPokemon
        return [f.search,f.type1,f.type2,f.eggGroup,f.canBreed,f.hasArtwork].filter(Boolean).length
      }
      if (tab === 'items') {
        const f = this.fItems
        return [f.search,f.category,f.hasSprite,f.hasPrice,f.isCraftable,f.isBerry].filter(Boolean).length
      }
      if (tab === 'moves') {
        const f = this.fMoves
        return [f.search,f.type,f.category,f.status,f.hasContest].filter(Boolean).length
      }
      if (tab === 'abilities') {
        const f = this.fAbilities
        return [f.search,f.status,f.hasOutEffect].filter(Boolean).length
      }
      return 0
    },

    // ── Pagination ───────────────────────────────────────────
    get curStore() { return this.stores[this.activeTab] ?? { data:[], filtered:[], page:1, loaded:false, loading:false } },

    get pagedItems() {
      const s = this.curStore
      const start = (s.page - 1) * PER_PAGE
      return s.filtered.slice(start, start + PER_PAGE)
    },

    get totalPages() {
      return Math.max(1, Math.ceil(this.curStore.filtered.length / PER_PAGE))
    },

    get paginationPages() {
      const total = this.totalPages, cur = this.curStore.page
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
      const set    = new Set([1, 2, cur-1, cur, cur+1, total-1, total].filter(p => p >= 1 && p <= total))
      const sorted = [...set].sort((a, b) => a - b)
      const pages  = []
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i-1] > 1) pages.push('…')
        pages.push(sorted[i])
      }
      return pages
    },

    goToPage(p) {
      if (p < 1 || p > this.totalPages) return
      this.curStore.page = p
    },

    jumpPage(e) {
      const v = parseInt(e.target.value)
      e.target.value = ''
      if (!isNaN(v)) this.goToPage(v)
    },

    // ── Modal open/close ─────────────────────────────────────
    async openModal(type, data, push = true) {
      if (push && this.modal.open) {
        this.modalHistory.push({ type: this.modal.type, data: this.modal.data })
      }
      this.activeArtwork = 'normal'
      this.carouselIdx   = 0
      this.modal = { open: true, type, data, extra: null, loading: true }

      // Atualiza hash — usa o id (nanoid TEXT) do registro
      window.location.hash = `${type}-${data.id}`

      try {
        if (type === 'pokemon') {
          const moves = await BwAPI.loadPokemonMoves(data.id)
          this.modal.extra = { moves }
        } else if (type === 'item') {
          const [crafting, berry] = await Promise.all([
            data.is_craftable ? BwAPI.loadItemCrafting(data.id)  : null,
            data.is_berry     ? BwAPI.loadBerryDetails(data.id)  : null,
          ])
          this.modal.extra = { crafting, berry }
        } else if (type === 'move') {
          const learnedBy = await BwAPI.loadMoveLearnedBy(data.name)
          this.modal.extra = { learnedBy }
        } else {
          this.modal.extra = {}
        }
      } catch (e) {
        console.error('[BwWiki] openModal extra', e)
        this.modal.extra = {}
      } finally {
        this.modal.loading = false
      }
    },

    closeModal() {
      this.modal        = { open: false, type: null, data: null, extra: null, loading: false }
      this.modalHistory = []
      history.pushState('', document.title, window.location.pathname + window.location.search)
    },

    goBack() {
      const prev = this.modalHistory.pop()
      if (prev) this.openModal(prev.type, prev.data, false)
      else       this.closeModal()
    },

    // ── Cross-modal navigation ───────────────────────────────
    async openMoveByName(name) {
      if (!this.stores.moves.loaded) await this.switchTab('moves')
      const m = this.stores.moves.data.find(x => x.name === name)
      if (m) this.openModal('move', m)
    },

    async openPokemonById(id) {
      if (!this.stores.pokemon.loaded) await this.switchTab('pokemon')
      const p = this.stores.pokemon.data.find(x => x.id === id)
      if (p) this.openModal('pokemon', p)
    },

    async openItemById(id) {
      if (!this.stores.items.loaded) await this.switchTab('items')
      const i = this.stores.items.data.find(x => x.id === id)
      if (i) this.openModal('item', i)
    },

    async copyUrl() {
      await navigator.clipboard.writeText(window.location.href)
      this.copiedUrl = true
      setTimeout(() => { this.copiedUrl = false }, 1500)
    },

    // ── Hash router ──────────────────────────────────────────
    // FIX: IDs são nanoid TEXT (ex: "BF7VAT") — removido parseInt
    // Formato do hash: #type-id  (ex: #pokemon-BF7VAT)
    // O tipo nunca contém hífens, então lastIndexOf('-') separa corretamente
    async _handleHash() {
      const hash = window.location.hash.slice(1)
      if (!hash) return
      const dash = hash.lastIndexOf('-')
      if (dash < 0) return
      const type = hash.slice(0, dash)
      const id   = hash.slice(dash + 1)
      if (!id) return

      const tabMap = { pokemon: 'pokemon', item: 'items', move: 'moves', ability: 'abilities' }
      const tab = tabMap[type]
      if (!tab) return

      await this.switchTab(tab)
      const item = this.stores[tab].data.find(d => d.id === id)
      if (item) {
        this.activeTab = tab
        this.openModal(type, item, false)
      }
    },

    // ── Formatting helpers ───────────────────────────────────
    typeBadgeStyle(type) {
      const c = TYPE_COLORS[type?.toLowerCase()] || { bg: '#eee', text: '#555', border: '#ccc' }
      return `background:${c.bg};color:${c.text};border-color:${c.border}`
    },

    typeHex(type) {
      return TYPE_HEX[type?.toLowerCase()] || '#aaa'
    },

    statusBadgeStyle(status) {
      const c = STATUS_COLORS[status] || STATUS_COLORS.canonical
      return `background:${c.bg};color:${c.text}`
    },

    statusLabel(s)  { return STATUS_LABELS[s]  || s },
    catLabel(c)     { return CATEGORY_LABELS[c] || c },
    methodLabel(m)  { return METHOD_LABELS[m]   || m },

    fmtPrice(p) {
      if (p == null) return null
      return '₽\u202f' + p.toLocaleString('pt-BR')
    },
    fmtHeight(cm) {
      if (cm == null) return null
      return (cm / 100).toFixed(1).replace('.', ',') + ' m'
    },
    fmtWeight(hg) {
      if (hg == null) return null
      return (hg / 10).toFixed(1).replace('.', ',') + ' kg'
    },
    fmtGender(male, female) {
      if (male == null && female == null) return 'Sem gênero'
      return `♂ ${male}% / ♀ ${female}%`
    },

    // FIX: usa pokeapi_id (INTEGER da Pokédex), não o id nanoid TEXT
    pokemonId(pokemon) {
      if (!pokemon) return ''
      const num = pokemon.pokeapi_id ?? pokemon.id
      return '#' + String(num).padStart(4, '0')
    },

    statRows(p) {
      if (!p) return []
      return STAT_META.map(s => ({ ...s, val: p[s.key] ?? 0 }))
    },
    statTotal(p) {
      if (!p) return 0
      return STAT_META.reduce((sum, s) => sum + (p[s.key] ?? 0), 0)
    },
    statBarPct(val) {
      return Math.min(100, Math.round((val / 255) * 100)) + '%'
    },

    artworkUrl(p) {
      if (!p) return null
      if (this.activeArtwork === 'shadow' && p.artwork_shadow) return p.artwork_shadow
      if (this.activeArtwork === 'aura'   && p.artwork_aura)   return p.artwork_aura
      return p.artwork_normal
    },

    groupedMoves(moves) {
      const order = ['level-up', 'initial', 'evo', 'egg', 'learnable', 'machine', 'contest']
      const map   = {}
      for (const m of moves) {
        const k = m.learn_method || 'other'
        if (!map[k]) map[k] = []
        map[k].push(m)
      }
      if (map['level-up']) map['level-up'].sort((a, b) => (a.level ?? 999) - (b.level ?? 999))
      const keys = [...new Set([...order, ...Object.keys(map)])]
      return keys.filter(k => map[k]).map(k => ({ method: k, moves: map[k] }))
    },

    itemSprites(item) {
      if (!item?.sprites) return []
      return Array.isArray(item.sprites) ? item.sprites.filter(Boolean) : []
    },

    slotOptionLabel(opt) {
      if (opt.item_id) {
        const item = BwAPI.getItemById(opt.item_id)
        return { text: item?.name ?? `Item #${opt.item_id}`, itemId: opt.item_id }
      }
      if (opt.category_id) {
        const cat = BwAPI.getCategoryById(opt.category_id)
        return { text: `Qualquer item de: ${cat?.name ?? `Cat. #${opt.category_id}`}`, itemId: null }
      }
      if (opt.tag) {
        return { text: `Qualquer ${opt.tag_type || 'tag'}: ${opt.tag}`, itemId: null }
      }
      return { text: '—', itemId: null }
    },

    berryFlavors(berry) {
      if (!berry) return []
      return [
        { label: 'Beauty',  val: berry.flavor_beauty  ?? 0 },
        { label: 'Clever',  val: berry.flavor_clever  ?? 0 },
        { label: 'Cool',    val: berry.flavor_cool    ?? 0 },
        { label: 'Cute',    val: berry.flavor_cute    ?? 0 },
        { label: 'Tough',   val: berry.flavor_tough   ?? 0 },
      ]
    },
  }
}
