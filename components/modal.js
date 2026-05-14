document.addEventListener('alpine:init', function() {
  Alpine.data('modal', function() {
    var base = {
      open: false, type: null, data: null, extra: null, loading: false,
      history: [], copiedUrl: false, activeArtwork: 'normal', carouselIdx: 0,
      fichaContestPoints: false, fichaCopiada: false, moveCopiado: false,

      async openModal(type, data, push) {
        push = push !== false
        if (push && this.open) this.history.push({ type: this.type, data: this.data })
        this.activeArtwork = 'normal'; this.carouselIdx = 0
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


      async gerarFicha() {
        var p = this.data, ex = this.extra, cc = this.fichaContestPoints
        if (!p || !ex) return
        var img = p.artwork_normal || ''
        var dex = p.pokeapi_id ? '#' + String(p.pokeapi_id).padStart(4,'0') : ''

        // Types
        var types = [p.type1, p.type2].filter(Boolean)
          .map(function(t){ var k=TYPE_PILL_CODE[(t||'').toLowerCase()]; return ':' + (k||t.toLowerCase()) + ':' })
          .join('')

        // Gender
        var sexo
        if (p.gender_male > 0 && p.gender_female > 0) {
          sexo = ':male: Masculino 01 a ' + p.gender_male + ' | :female: Feminino ' + (p.gender_male+1) + ' a 100'
        } else if (p.gender_male > 0) {
          sexo = ':male: Somente Masculino'
        } else if (p.gender_female > 0) {
          sexo = ':female: Somente Feminino'
        } else {
          sexo = 'Sem Gênero'
        }

        // Abilities
        var prim = (ex.abilities||[]).filter(function(a){return a.ability_type==='primary'}).map(function(a){return a.abilities&&a.abilities.name||''})
        var sec  = (ex.abilities||[]).filter(function(a){return a.ability_type==='secondary'}).map(function(a){return a.abilities&&a.abilities.name||''})
        var hid  = (ex.abilities||[]).filter(function(a){return a.ability_type==='hidden'}).map(function(a){return a.abilities&&a.abilities.name||''})
        var abilStr = [...prim,...sec].filter(Boolean).join(' | ')
        if (hid.length) abilStr += ' (HA: ' + hid.join(' | ') + ')'

        // Held items
        var itemStr = (ex.drops&&ex.drops.held||[])
          .map(function(h){ return (h.roll||'') + ' ' + (h.items&&h.items.name||'') })
          .filter(function(s){return s.trim()}).join(' | ')

        // Stats
        var total = (p.hp||0)+(p.attack||0)+(p.defense||0)+(p.sp_attack||0)+(p.sp_defense||0)+(p.speed||0)

        // Immunities
        var imms = [p.type1, p.type2].filter(Boolean)
          .map(function(t){ return TYPE_IMMUNITIES_BBCODE[(t||'').toLowerCase()] })
          .filter(Boolean)
        var immText = imms.join('\n')

        // Moves
        var ORDER = { initial:0, evo:1, level:2, egg:3, learnable:4, contest:5, unknown:6 }
        var moves = (ex.moves||[]).slice().sort(function(a,b){
          var oa = ORDER[a.learn_method]||99, ob = ORDER[b.learn_method]||99
          return oa!==ob ? oa-ob : (a.level||0)-(b.level||0)
        })
        var movesLines = moves.map(function(mv){
          var m = mv.moves||{}, name = m.name||'?'
          var color = TYPE_HEX_BBCODE[(m.type||'normal').toLowerCase()]||'#a8a878'
          var lm = mv.learn_method
          var label = lm==='initial'?'(inicial)':lm==='evo'?'(evo)':lm==='level'?'(lvl '+(mv.level||'?')+')':lm==='egg'?'(ovo)':lm==='learnable'?'(aprendível)':lm==='contest'?'(contest)':''
          var cp = cc&&m.contest_points ? ' [size=10][i]('+m.contest_points+')[/i][/size]' : ''
          return '[color='+color+']'+name+'[/color]'+cp+' '+label
        }).join('\n')

        var sheet = [
          '[img]'+img+'[/img] '+p.name,
          '[spoiler]',
          '[center][img(200px,200px)]'+img+'[/img]',
          '[b]Nome:[/b] '+p.name+' '+dex,
          types,
          '[b]Lvl:[/b]',
          '[b]Exp:[/b]',
          '[b]Sexo:[/b] '+sexo,
          '[b]Habilidade:[/b] '+abilStr,
          '[b]Item:[/b] '+itemStr,
          '[b]OT:[/b]',
          '',
          '[b]Stats:[/b]',
          '[size=10][b][color=#ff0000]HP [/color][/b] '+p.hp+' [b][color=#ff6600] Attack [/color][/b]'+p.attack+'[b][color=#ffcc00] Defense [/color][/b]'+p.defense+'[b][color=#0099cc] Sp.Atk [/color][/b] '+p.sp_attack+'[b][color=#00cc00] Sp.Def [/color][/b]'+p.sp_defense+'[b][color=#ff6699] Speed [/color][/b]'+p.speed+'[b] Total [/b]'+total+'[/size]',
          '',
          '[b]Características:[/b]',
          '',
          '[spoiler="Observações & Imunidades"]',
          '[quote]'+(immText||'—')+'[/quote]',
          '[/spoiler]',
          '',
          '[b]Ataques:[/b]',
          movesLines,
          '',
          '[size=10][i](Lvl x, local)[/i][/size][/center]',
          '[/spoiler]',
        ].join('\n')

        try { await navigator.clipboard.writeText(sheet) } catch(e) { console.error(e) }
        var self = this; this.fichaCopiada = true
        setTimeout(function(){ self.fichaCopiada = false }, 2000)
      },

      async copiarMove() {
        var m = this.data; if (!m) return
        var color = TYPE_HEX_BBCODE[(m.type||'normal').toLowerCase()]||'#a8a878'
        var text = '[color='+color+']'+m.name+'[/color]'
        if (m.contest_points) text += ' [size=10][i]('+m.contest_points+')[/i][/size]'
        try { await navigator.clipboard.writeText(text) } catch(e) { console.error(e) }
        var self = this; this.moveCopiado = true
        setTimeout(function(){ self.moveCopiado = false }, 2000)
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
      seasonStyle(s) {
        var m = SEASON_META[s] || {}
        return 'background:'+(m.bg||'var(--row)')+';color:'+(m.color||'var(--colortext)')+';border-color:'+(m.border||'transparent')
      },
      seasonIcon(s) { return (SEASON_META[s]||{icon:'fa-solid fa-calendar'}).icon },
      seasonLabel(s) { return (SEASON_META[s]||{label:s}).label },

      hasLocations(loc) { return loc && ((loc.maps&&loc.maps.length)||(loc.routeObjects&&loc.routeObjects.length)) },
      hasDrops(drops)   { return drops && ((drops.held&&drops.held.length)||(drops.produced&&drops.produced.length)) },
      hasDroppedBy(db)  { return db && ((db.held&&db.held.length)||(db.produced&&db.produced.length)) },
      hasItemSources(s) { return s && ((s.routeObjects&&s.routeObjects.length)||(s.quests&&s.quests.length)) },

      formatSeasons(s) { return formatSeasons(s) },
      formatTime(t)    { return formatTime(t) },
      rarityLabel(n)   { return rarityLabel(n) },
    }

    // Merge do hook usePokemonChips (spoiler de chips de Pokémon)
    return Object.assign(base, usePokemonChips(10))
  })
})
