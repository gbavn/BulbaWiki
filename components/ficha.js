// ============================================================
// BulbaWiki — components/ficha.js
// Alpine.data('fichaGenerator')
// Gerador de ficha BBCode para o fórum.
// ============================================================

document.addEventListener('alpine:init', function() {
  Alpine.data('fichaGenerator', function() {
    return {
      slots: Array.from({ length: 6 }, function() {
        return { pokemon: null, moves: ['','','','',''], searchQ: '', results: [], searching: false }
      }),
      output:    '',
      copied:    false,
      _debTimer: null,

      async searchSlot(idx) {
        const slot = this.slots[idx]
        const q    = (slot.searchQ || '').trim()
        if (!q) { slot.results = []; return }
        clearTimeout(this._debTimer)
        const self = this
        this._debTimer = setTimeout(async function() {
          slot.searching = true
          try {
            slot.results = BwAPI.searchPokemon(q)
          } catch(e) {
            slot.results = []
          } finally {
            slot.searching = false
          }
        }, 300)
      },

      selectPokemon(idx, pokemon) {
        const slot   = this.slots[idx]
        slot.pokemon = pokemon
        slot.searchQ = ''
        slot.results = []
        this.output  = ''
      },

      clearSlot(idx) {
        this.slots[idx] = { pokemon: null, moves: ['','','','',''], searchQ: '', results: [], searching: false }
        this.output = ''
      },

      generateFicha() {
        const filled = this.slots.filter(function(s) { return s.pokemon })
        if (!filled.length) {
          this.output = 'Adicione ao menos um Pokémon antes de gerar a ficha.'
          return
        }
        const lines = []
        lines.push('[b]🌿 Ficha de Time — BulbaRPG[/b]')
        lines.push('[hr]')
        filled.forEach(function(slot, i) {
          const p     = slot.pokemon
          const dex   = p.pokeapi_id ? '#' + String(p.pokeapi_id).padStart(4,'0') : ''
          const types = [p.type1, p.type2].filter(Boolean).join(' / ')
          const moves = slot.moves.filter(function(m) { return m.trim() })
          lines.push('')
          lines.push('[b]Slot ' + (i+1) + ' — ' + p.name + '[/b] ' + dex)
          if (types) lines.push('Tipo: ' + types)
          if (moves.length) { lines.push('Moves:'); moves.forEach(function(m) { lines.push('  • ' + m) }) }
        })
        lines.push('')
        lines.push('[hr]')
        lines.push('[size=9]Gerado pelo BulbaWiki · bulbarpg.forumeiros.com[/size]')
        this.output = lines.join('\n')
      },

      async copyOutput() {
        if (!this.output) return
        try {
          await navigator.clipboard.writeText(this.output)
          this.copied = true
          const self  = this
          setTimeout(function() { self.copied = false }, 1500)
        } catch(e) { console.error('[Ficha] clipboard', e) }
      },

      clearAll() {
        this.slots  = Array.from({ length: 6 }, function() {
          return { pokemon: null, moves: ['','','','',''], searchQ: '', results: [], searching: false }
        })
        this.output = ''
      },

      typeBadgeStyle(type) {
        const c = TYPE_COLORS[(type || '').toLowerCase()] || { bg:'#eee', text:'#555', border:'#ccc' }
        return 'background:' + c.bg + ';color:' + c.text + ';border-color:' + c.border
      },

      dexNum(p) {
        if (!p || !p.pokeapi_id) return ''
        return formatDexId(p.pokeapi_id)
      },
    }
  })
})
