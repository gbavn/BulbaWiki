document.addEventListener('alpine:init', function() {
  Alpine.data('modal', function() {
    var base = {
      open: false, type: null, data: null, extra: null, loading: false,
      history: [], copiedUrl: false, activeArtwork: 'normal', carouselIdx: 0,
      contestPoints: true,  copied: false, activeTab: 'info',

      async openModal(type, data, push) {
        push = push !== false
        if (push && this.open) this.history.push({ type: this.type, data: this.data })
        this.activeArtwork = 'normal'; this.carouselIdx = 0; this.activeTab = 'info'
        this._resetChips()
        this.open = true; this.type = type; this.data = data; this.extra = null; this.loading = true
        try { history.replaceState(null, '', '#/' + type + '/' + data.id) } catch(e) {}
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
            const learnedBy = await BwAPI.loadMoveLearnedBy(data.id)
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
        this._resetChips()
        try { history.replaceState('', document.title, window.location.pathname + window.location.search) } catch(e) {}
      },

      goBack() {
        const prev = this.history.pop()
        if (prev) this.openModal(prev.type, prev.data, false)
        else this.closeModal()
      },


      async copiar() {
        var t = this.type, d = this.data, ex = this.extra, cp = this.contestPoints
        if      (t === 'pokemon') await BwSheet.gerarFicha(d, ex, cp)
        else if (t === 'move')    await BwSheet.copiarMove(d, cp)
        else if (t === 'item')    await BwSheet.copiarItem(d)
        var self = this; self.copied = true
        setTimeout(function(){ self.copied = false }, 2000)
      },

            async copyUrl() {
        try { await navigator.clipboard.writeText(window.location.href); this.copiedUrl = true; setTimeout(() => { this.copiedUrl = false }, 1500) }
        catch(e) { console.error(e) }
      },

      async openPokemonById(id) {
        if (!id) return
        const all = await BwAPI.loadPokemon()
        const p = all.find(function(x) { return x.id === id })
        if (p) this.openModal('pokemon', p)
      },

      async openMoveByName(name) {
        const all = await BwAPI.loadMoves()
        const m = all.find(function(x) { return x.name === name })
        if (m) this.openModal('move', m)
      },

      async openMoveById(id) {
        if (!id) return
        const all = await BwAPI.loadMoves()
        const m = all.find(function(x) { return x.id === id })
        if (m) this.openModal('move', m)
      },

      async openItemById(id) {
        if (!id) return
        const item = BwAPI.getItemById(id)
        if (item) this.openModal('item', item)
      },

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
      pokemonId(p)   { return p ? formatDexId(p.pokeapi_id) : '' },

      statRows(p) {
        if (!p) return []
        return STAT_META.map(function(s) { return Object.assign({}, s, { val: p[s.key] || 0 }) })
      },
      statTotal(p) { return p ? STAT_META.reduce(function(sum,s){ return sum+(p[s.key]||0) }, 0) : 0 },
      statBarPct(val) { return Math.min(100, Math.round((val/255)*100)) + '%' },

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
        var flavors = [
          { label:'Beleza',    val:berry.flavor_beauty||0, color:'#e91e8c' },
          { label:'Esperteza', val:berry.flavor_clever||0, color:'#4caf50' },
          { label:'Estilo',    val:berry.flavor_cool  ||0, color:'#2196f3' },
          { label:'Fofura',    val:berry.flavor_cute  ||0, color:'#ff9800' },
          { label:'Força',     val:berry.flavor_tough ||0, color:'#f44336' },
        ]
        var max = Math.max(10, Math.max.apply(null, flavors.map(function(f){ return f.val })))
        return flavors.map(function(f) { return Object.assign({}, f, { pct: Math.round((f.val/max)*100) }) })
      },

      berryRarityStyle(rarity) {
        var m = BERRY_RARITY_META[(rarity||'').toLowerCase()] || {}
        return 'background:'+(m.bg||'var(--row)')+';color:'+(m.color||'var(--colortext)')+';border-color:'+(m.border||'transparent')
      },
      berryRarityIcon(rarity) {
        return (BERRY_RARITY_META[(rarity||'').toLowerCase()]||{icon:'fa-solid fa-circle'}).icon
      },
      berryRarityLabel(rarity) {
        return (BERRY_RARITY_META[(rarity||'').toLowerCase()]||{label:rarity}).label
      },
      _seasonKey(s) {
        var k = (s||'').toLowerCase().trim()
        var map = {
          'primavera':'spring','spring':'spring',
          'verão':'summer','verao':'summer','summer':'summer',
          'outono':'autumn','fall':'autumn','autumn':'autumn',
          'inverno':'winter','winter':'winter'
        }
        return map[k] || k
      },
      seasonStyle(s) {
        var m = SEASON_META[this._seasonKey(s)] || {}
        return 'background:'+(m.bg||'var(--row)')+';color:'+(m.color||'var(--colortext)')+';border-color:'+(m.border||'transparent')
      },
      seasonIcon(s) {
        return (SEASON_META[this._seasonKey(s)]||{icon:'fa-solid fa-calendar'}).icon
      },
      seasonLabel(s) {
        return (SEASON_META[this._seasonKey(s)]||{label:s}).label
      },

      hasLocations(loc) { return loc && ((loc.maps&&loc.maps.length)||(loc.routeObjects&&loc.routeObjects.length)) },
      hasDrops(drops)   { return drops && ((drops.held&&drops.held.length)||(drops.produced&&drops.produced.length)) },
      hasDroppedBy(db)  { return db && ((db.held&&db.held.length)||(db.produced&&db.produced.length)) },
      hasItemSources(s) { return s && ((s.routeObjects&&s.routeObjects.length)||(s.quests&&s.quests.length)) },


      berryPentagonSvg(berry) {
        if (!berry) return ''
        var R=75, cx=110, cy=110, n=5, a0=-Math.PI/2
        var vals=[
          Math.min(5,berry.flavor_beauty||0),
          Math.min(5,berry.flavor_clever||0),
          Math.min(5,berry.flavor_cool  ||0),
          Math.min(5,berry.flavor_cute  ||0),
          Math.min(5,berry.flavor_tough ||0),
        ]
        var cols=['#e91e8c','#4caf50','#2196f3','#ff9800','#f44336']
        function pt(r,i){ var a=a0+(2*Math.PI*i)/n; return [(cx+r*Math.cos(a)).toFixed(1),(cy+r*Math.sin(a)).toFixed(1)] }
        // Anéis de referência (1-5)
        var rings=[1,2,3,4,5].map(function(v){
          var p=Array.from({length:n},function(_,i){return pt(v/5*R,i).join(',')}).join(' ')
          return '<polygon points="'+p+'" fill="'+(v===5?'var(--row,#eee)':'none')+'" stroke="rgba(0,0,0,.1)" stroke-width="'+(v===5?1:.5)+'"/>'
        }).join('')
        // Eixos
        var axes=Array.from({length:n},function(_,i){
          var p=pt(R,i); return '<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="rgba(0,0,0,.1)" stroke-width=".8"/>'
        }).join('')
        // Polígono de dados
        var dpts=vals.map(function(v,i){return pt(v/5*R,i).join(',')}).join(' ')
        // Pontos coloridos nos vértices de dados
        var dots=vals.map(function(v,i){
          var p=pt(v/5*R,i)
          return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3.5" fill="'+cols[i]+'" stroke="#fff" stroke-width="1"/>'
        }).join('')
        // Valores nos vértices (número)
        var nums=vals.map(function(v,i){
          var p=pt(v/5*R+11,i)
          return '<text x="'+p[0]+'" y="'+p[1]+'" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="700" fill="'+cols[i]+'">'+v+'</text>'
        }).join('')
        return '<svg viewBox="0 0 220 220" width="200" height="200" style="display:block;margin:0 auto">'+
          rings+axes+
          '<polygon points="'+dpts+'" fill="rgba(100,150,220,.25)" stroke="#6496c8" stroke-width="1.5"/>'+
          dots+nums+'</svg>'
      },

      moveTypeColor(type) { return TYPE_HEX_BBCODE[(type||'normal').toLowerCase()] || '#888' },

      formatSeasons(s) { return formatSeasons(s) },
      formatTime(t)    { return formatTime(t) },
      rarityLabel(n)   { return rarityLabel(n) },
    }

    // Merge do hook usePokemonChips (spoiler de chips de Pokémon)
    return Object.assign(base, usePokemonChips(12))
  })
})
