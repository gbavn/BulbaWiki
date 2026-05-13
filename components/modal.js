// ============================================================
// BulbaWiki — components/modal.js
// Alpine.data('modal')
//
// Gerencia modais de Pokémon, Item, Move e Ability.
// Inclui: histórico de navegação (Voltar) e Compartilhar (copia URL).
// Fecha com: botão ✕, clique fora, tecla Escape.
// ============================================================

document.addEventListener('alpine:init', function() {
  Alpine.data('modal', function() {
    return {
      open:          false,
      type:          null,   // 'pokemon' | 'item' | 'move' | 'ability'
      data:          null,   // objeto completo do registro
      extra:         null,   // dados extras carregados após abertura
      loading:       false,
      history:       [],     // pilha para navegação Voltar
      copiedUrl:     false,
      activeArtwork: 'normal',
      carouselIdx:   0,

      // ── Abrir modal ────────────────────────────────────────
      async openModal(type, data, push) {
        push = push !== false   // default true
        if (push && this.open) {
          this.history.push({ type: this.type, data: this.data })
        }
        this.activeArtwork = 'normal'
        this.carouselIdx   = 0
        this.open    = true
        this.type    = type
        this.data    = data
        this.extra   = null
        this.loading = true

        // Atualiza hash para compartilhar
        window.location.hash = type + '-' + data.id

        try {
          if (type === 'pokemon') {
            const [moves, abilities, locations] = await Promise.all([
              BwAPI.loadPokemonMoves(data.id),
              BwAPI.loadPokemonAbilities(data.id),
              BwAPI.loadPokemonLocations(data.id),
            ])
            this.extra = { moves, abilities, locations }
          } else if (type === 'item') {
            const [crafting, berry, sources] = await Promise.all([
              data.is_craftable ? BwAPI.loadItemCrafting(data.id)  : Promise.resolve(null),
              data.is_berry     ? BwAPI.loadBerryDetails(data.id)  : Promise.resolve(null),
              BwAPI.loadItemSources(data.id),
            ])
            this.extra = { crafting, berry, sources }
          } else if (type === 'move') {
            const learnedBy = await BwAPI.loadMoveLearnedBy(data.name)
            this.extra = { learnedBy }
          } else {
            this.extra = {}
          }
        } catch(e) {
          console.error('[Modal] extra', e)
          this.extra = {}
        } finally {
          this.loading = false
        }
      },

      // ── Fechar ─────────────────────────────────────────────
      closeModal() {
        this.open    = false
        this.type    = null
        this.data    = null
        this.extra   = null
        this.history = []
        history.pushState('', document.title, window.location.pathname + window.location.search)
      },

      // ── Voltar ─────────────────────────────────────────────
      goBack() {
        const prev = this.history.pop()
        if (prev) this.openModal(prev.type, prev.data, false)
        else       this.closeModal()
      },

      // ── Compartilhar ───────────────────────────────────────
      async copyUrl() {
        try {
          await navigator.clipboard.writeText(window.location.href)
          this.copiedUrl = true
          setTimeout(() => { this.copiedUrl = false }, 1500)
        } catch(e) {
          console.error('[Modal] clipboard', e)
        }
      },

      // ── Navegação cruzada ──────────────────────────────────
      async openPokemonById(id) {
        const all = await BwAPI.loadPokemon()
        const p   = all.find(function(x) { return x.id === id })
        if (p) this.openModal('pokemon', p)
      },

      async openMoveByName(name) {
        const all = await BwAPI.loadMoves()
        const m   = all.find(function(x) { return x.name === name })
        if (m) this.openModal('move', m)
      },

      async openItemById(id) {
        const item = BwAPI.getItemById(id)
        if (item) this.openModal('item', item)
      },

      // ── Helpers de exibição ────────────────────────────────
      artworkUrl(p) {
        if (!p) return null
        if (this.activeArtwork === 'shadow' && p.artwork_shadow) return p.artwork_shadow
        if (this.activeArtwork === 'aura'   && p.artwork_aura)   return p.artwork_aura
        return p.artwork_normal || null
      },

      typeBadgeStyle(type) {
        const c = TYPE_COLORS[(type || '').toLowerCase()] || { bg:'#eee', text:'#555', border:'#ccc' }
        return 'background:' + c.bg + ';color:' + c.text + ';border-color:' + c.border
      },

      typeHex(type) {
        return TYPE_HEX[(type || '').toLowerCase()] || '#aaa'
      },

      statusBadgeStyle(status) {
        const c = STATUS_COLORS[status] || STATUS_COLORS.canonical
        return 'background:' + c.bg + ';color:' + c.text
      },

      statusLabel(s)  { return STATUS_LABELS[s]  || s },
      catLabel(c)     { return CATEGORY_LABELS[c] || c },
      methodLabel(m)  { return METHOD_LABELS[m]   || m },

      statRows(p) {
        if (!p) return []
        return STAT_META.map(function(s) { return Object.assign({}, s, { val: p[s.key] || 0 }) })
      },
      statTotal(p) {
        if (!p) return 0
        return STAT_META.reduce(function(sum, s) { return sum + (p[s.key] || 0) }, 0)
      },
      statBarPct(val) {
        return Math.min(100, Math.round((val / 255) * 100)) + '%'
      },

      pokemonId(p) {
        if (!p) return ''
        return formatDexId(p.pokeapi_id)
      },

      groupedMoves(moves) {
        const order = ['level-up','initial','evo','egg','learnable','machine','contest']
        const map   = {}
        moves.forEach(function(m) {
          const k = m.learn_method || 'other'
          if (!map[k]) map[k] = []
          map[k].push(m)
        })
        if (map['level-up']) map['level-up'].sort(function(a, b) { return (a.level || 999) - (b.level || 999) })
        const keys = Array.from(new Set(order.concat(Object.keys(map))))
        return keys.filter(function(k) { return map[k] }).map(function(k) { return { method: k, moves: map[k] } })
      },

      itemSprites(item) {
        if (!item || !item.sprites) return []
        return Array.isArray(item.sprites) ? item.sprites.filter(Boolean) : []
      },

      slotOptionLabel(opt) {
        if (opt.item_id) {
          const item = BwAPI.getItemById(opt.item_id)
          return { text: (item && item.name) || ('Item #' + opt.item_id), itemId: opt.item_id }
        }
        if (opt.category_id) {
          const cat = BwAPI.getCategoryById(opt.category_id)
          return { text: 'Qualquer item de: ' + ((cat && cat.name) || ('Cat. #' + opt.category_id)), itemId: null }
        }
        if (opt.tag) {
          return { text: 'Qualquer ' + (opt.tag_type || 'tag') + ': ' + opt.tag, itemId: null }
        }
        return { text: '—', itemId: null }
      },

      berryFlavors(berry) {
        if (!berry) return []
        return [
          { label: 'Beauty',  val: berry.flavor_beauty  || 0 },
          { label: 'Clever',  val: berry.flavor_clever  || 0 },
          { label: 'Cool',    val: berry.flavor_cool    || 0 },
          { label: 'Cute',    val: berry.flavor_cute    || 0 },
          { label: 'Tough',   val: berry.flavor_tough   || 0 },
        ]
      },

      // Localização do Pokémon
      hasLocations(locations) {
        if (!locations) return false
        return (locations.maps && locations.maps.length > 0) ||
               (locations.routeObjects && locations.routeObjects.length > 0)
      },

      formatSeasons(seasons) { return formatSeasons(seasons) },
      formatTime(time)       { return formatTime(time)       },
      rarityLabel(n)         { return rarityLabel(n)         },

      // Fontes do item
      hasItemSources(sources) {
        if (!sources) return false
        return (sources.routeObjects && sources.routeObjects.length > 0) ||
               (sources.quests && sources.quests.length > 0)
      },
    }
  })
})
