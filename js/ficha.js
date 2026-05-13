// ============================================================
// BulbaWiki — ficha.js
// Componente Alpine: fichaGenerator()
// Permite montar uma ficha de treino/time com até 6 Pokémon,
// adicionar moves por slot e gerar BBCode para o fórum.
// ============================================================

function fichaGenerator() {
  return {

    // 6 slots fixos
    slots: Array.from({ length: 6 }, () => ({
      pokemon:   null,   // objeto completo do pokémon
      moves:     ['', '', '', '', ''],  // até 5 moves (texto livre)
      searchQ:   '',
      results:   [],
      searching: false,
    })),

    // Output gerado
    output:    '',
    copied:    false,
    _debTimer: null,

    // ── Busca de Pokémon ──────────────────────────────────────
    async searchSlot(idx) {
      const slot = this.slots[idx]
      const q    = slot.searchQ.trim()
      if (!q) { slot.results = []; return }

      clearTimeout(this._debTimer)
      this._debTimer = setTimeout(async () => {
        slot.searching = true
        // Garante que o cache de pokémon está carregado
        try {
          slot.results = BwAPI.searchPokemon(q)
        } catch (e) {
          console.error('[Ficha] searchPokemon', e)
          slot.results = []
        } finally {
          slot.searching = false
        }
      }, 300)
    },

    selectPokemon(idx, pokemon) {
      const slot      = this.slots[idx]
      slot.pokemon    = pokemon
      slot.searchQ    = ''
      slot.results    = []
      this.output     = ''  // limpa output ao editar
    },

    clearSlot(idx) {
      this.slots[idx].pokemon = null
      this.slots[idx].moves   = ['', '', '', '', '']
      this.slots[idx].searchQ = ''
      this.slots[idx].results = []
      this.output = ''
    },

    // ── Gerador de BBCode / HTML ──────────────────────────────
    generateFicha() {
      const filled = this.slots.filter(s => s.pokemon)
      if (!filled.length) {
        this.output = '⚠️ Adicione ao menos um Pokémon antes de gerar a ficha.'
        return
      }

      const lines = []
      lines.push('[b]🌿 Ficha de Time — BulbaRPG[/b]')
      lines.push('[hr]')

      filled.forEach((slot, i) => {
        const p     = slot.pokemon
        const dex   = p.pokeapi_id ? '#' + String(p.pokeapi_id).padStart(4, '0') : ''
        const types = [p.type1, p.type2].filter(Boolean).join(' / ')
        const moves = slot.moves.filter(m => m.trim())

        lines.push('')
        lines.push(`[b]Slot ${i + 1} — ${p.name}[/b] ${dex}`)
        if (types) lines.push(`Tipo: ${types}`)
        if (moves.length) {
          lines.push('Moves:')
          moves.forEach(m => lines.push(`  • ${m}`))
        }
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
        setTimeout(() => { this.copied = false }, 1500)
      } catch (e) {
        console.error('[Ficha] clipboard', e)
      }
    },

    clearAll() {
      this.slots  = Array.from({ length: 6 }, () => ({
        pokemon: null, moves: ['','','','',''],
        searchQ: '', results: [], searching: false,
      }))
      this.output = ''
    },

    // ── Helpers ───────────────────────────────────────────────
    typeBadgeStyle(type) {
      const c = TYPE_COLORS[type?.toLowerCase()] || { bg: '#eee', text: '#555', border: '#ccc' }
      return `background:${c.bg};color:${c.text};border-color:${c.border}`
    },

    dexNum(p) {
      if (!p) return ''
      return p.pokeapi_id ? '#' + String(p.pokeapi_id).padStart(4, '0') : ''
    },
  }
}
