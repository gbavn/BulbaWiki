document.addEventListener('alpine:init', function() {
  Alpine.data('modal', function() {
    return {
      open: false, type: null, data: null, extra: null, loading: false,
      history: [], copiedUrl: false, activeArtwork: 'normal', carouselIdx: 0,

      async openModal(type, data, push) {
        push = push !== false
        if (push && this.open) this.history.push({ type: this.type, data: this.data })
        this.activeArtwork = 'normal'; this.carouselIdx = 0
        this.open = true; this.type = type; this.data = data; this.extra = null; this.loading = true
        window.location.hash = type + '-' + data.id
        try {
          if (type === 'pokemon') {
            const [moves, abilities, locations, drops] = await Promise.all([
              BwAPI.loadPokemonMoves(data.id),
              BwAPI.loadPokemonAbilities(data.id),
              BwAPI.loadPokemonLocations(data.id),
              BwAPI.loadPokemonDrops(data.id),
            ])
            this.extra = { moves, abilities, locations, drops }
          } else if (type === 'item') {
            const [crafting, berry, sources, droppedBy] = await Promise.all([
              data.is_craftable ? BwAPI.loadItemCrafting(data.id) : Promise.resolve(null),
              data.is_berry     ? BwAPI.loadBerryDetails(data.id) : Promise.resolve(null),
              BwAPI.loadItemSources(data.id),
              BwAPI.loadItemDroppedBy(data.id),
            ])
            this.extra = { crafting, berry, sources, droppedBy }
          } else if (type === 'move') {
            const learnedBy = await BwAPI.loadMoveLearnedBy(data.name)
            this.extra = { learnedBy }
          } else if (type === 'ability') {
            const pokemon = await BwAPI.loadAbilityPokemon(data.id)
            this.extra = { pokemon }
          } else {
            this.extra = {}
          }
        } catch(e) { console.error('[Modal]', e); this.extra = {} }
        finally { this.loading = false }
      },

      closeModal() {
        this.open = false; this.type = null; this.data = null; this.extra = null; this.history = []
        history.pushState('', document.title, window.location.pathname + window.location.search)
      },

      goBack() {
        const prev = this.history.pop()
        if (prev) this.openModal(prev.type, prev.data, false)
        else this.closeModal()
      },

      async copyUrl() {
        try { await navigator.clipboard.writeText(window.location.href); this.copiedUrl = true; setTimeout(() => { this.copiedUrl = false }, 1500) }
        catch(e) { console.error(e) }
      },

      async openPokemonById(id) {
        const all = await BwAPI.loadPokemon()
        const p = all.find(function(x) { return x.id === id })
        if (p) this.openModal('pokemon', p)
      },

      async openMoveByName(name) {
        const all = await BwAPI.loadMoves()
        const m = all.find(function(x) { return x.name === name })
        if (m) this.openModal('move', m)
      },

      async openItemById(id) {
        const item = BwAPI.getItemById(id)
        if (item) this.openModal('item', item)
      },

      // Helpers
      artworkUrl(p) {
        if (!p) return null
        if (this.activeArtwork === 'shadow' && p.artwork_shadow) return p.artwork_shadow
        if (this.activeArtwork === 'aura'   && p.artwork_aura)   return p.artwork_aura
        return p.artwork_normal || null
      },

      typeBadgeStyle(type) {
        const c = TYPE_COLORS[(type||'').toLowerCase()] || { bg:'#eee', text:'#555', border:'#ccc' }
        return 'background:'+c.bg+';color:'+c.text+';border-color:'+c.border
      },
      typeHex(type) { return TYPE_HEX[(type||'').toLowerCase()] || '#aaa' },
      statusBadgeStyle(s) { const c = STATUS_COLORS[s]||STATUS_COLORS.canonical; return 'background:'+c.bg+';color:'+c.text },
      statusLabel(s) { return STATUS_LABELS[s] || s },
      catLabel(c)    { return CATEGORY_LABELS[c] || c },
      methodLabel(m) { return METHOD_LABELS[m] || m },

      pokemonId(p) { return p ? formatDexId(p.pokeapi_id) : '' },

      statRows(p) {
        if (!p) return []
        return STAT_META.map(function(s) { return Object.assign({}, s, { val: p[s.key] || 0 }) })
      },
      statTotal(p) { return p ? STAT_META.reduce(function(sum,s){ return sum+(p[s.key]||0) }, 0) : 0 },
      statBarPct(val) { return Math.min(100, Math.round((val/255)*100)) + '%' },

      // FIXED: usa MOVE_ORDER de constants.js + agrupa por 'level' (não 'level-up')
      groupedMoves(moves) {
        const map = {}
        moves.forEach(function(m) {
          const k = m.learn_method || 'unknown'
          if (!map[k]) map[k] = []
          map[k].push(m)
        })
        if (map['level']) map['level'].sort(function(a,b){ return (a.level||999)-(b.level||999) })
        const allKeys = MOVE_ORDER.concat(Object.keys(map).filter(function(k){ return MOVE_ORDER.indexOf(k)<0 }))
        return allKeys.filter(function(k){ return map[k] }).map(function(k){ return { method:k, moves:map[k] } })
      },

      itemSprites(item) {
        if (!item || !item.sprites) return []
        return Array.isArray(item.sprites) ? item.sprites.filter(Boolean) : []
      },

      slotOptionLabel(opt) {
        if (opt.item_id) { const item = BwAPI.getItemById(opt.item_id); return { text:(item&&item.name)||'Item #'+opt.item_id, itemId:opt.item_id } }
        if (opt.category_id) { const cat = BwAPI.getCategoryById(opt.category_id); return { text:'Qualquer: '+((cat&&cat.name)||'Cat.#'+opt.category_id), itemId:null } }
        if (opt.tag) return { text:'Qualquer '+(opt.tag_type||'tag')+': '+opt.tag, itemId:null }
        return { text:'—', itemId:null }
      },

      berryFlavors(berry) {
        if (!berry) return []
        return [
          { label:'Beauty', val:berry.flavor_beauty||0 },
          { label:'Clever', val:berry.flavor_clever||0 },
          { label:'Cool',   val:berry.flavor_cool  ||0 },
          { label:'Cute',   val:berry.flavor_cute  ||0 },
          { label:'Tough',  val:berry.flavor_tough ||0 },
        ]
      },

      hasLocations(loc) { return loc && ((loc.maps&&loc.maps.length)||(loc.routeObjects&&loc.routeObjects.length)) },
      hasDrops(drops)   { return drops && ((drops.held&&drops.held.length)||(drops.produced&&drops.produced.length)) },
      hasDroppedBy(db)  { return db && ((db.held&&db.held.length)||(db.produced&&db.produced.length)) },
      hasItemSources(s) { return s && ((s.routeObjects&&s.routeObjects.length)||(s.quests&&s.quests.length)) },

      formatSeasons(s) { return formatSeasons(s) },
      formatTime(t)    { return formatTime(t) },
      rarityLabel(n)   { return rarityLabel(n) },
    }
  })
})
