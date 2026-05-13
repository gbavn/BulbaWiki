// ============================================================
// BulbaWiki — hooks.js
// Funções reutilizáveis compatíveis com Alpine.js via spread:
//   x-data="{ ...usePagination(12), raw:[], ... }"
//
// Alpine rastreia dependências reativas quando os métodos são
// chamados nos templates (x-for, x-text, etc), então métodos
// que acessam _items e _page se atualizam automaticamente.
// ============================================================

function usePagination(perPage) {
  perPage = perPage || 12
  return {
    _page:    1,
    _perPage: perPage,
    _items:   [],

    // Slice da página atual
    paged() {
      return this._items.slice(
        (this._page - 1) * this._perPage,
        this._page * this._perPage
      )
    },

    // Total de páginas
    totalPages() {
      return Math.max(1, Math.ceil(this._items.length / this._perPage))
    },

    // Array de números/elipses para renderizar a paginação
    // Ex: [1, '…', 4, 5, 6, '…', 28]
    paginationPages() {
      const total = this.totalPages()
      const cur   = this._page
      if (total <= 7) return Array.from({ length: total }, function(_, i) { return i + 1 })
      const set    = new Set([1, 2, cur-1, cur, cur+1, total-1, total].filter(function(p) { return p >= 1 && p <= total }))
      const sorted = Array.from(set).sort(function(a, b) { return a - b })
      const out    = []
      sorted.forEach(function(v, i) {
        if (i > 0 && v - sorted[i-1] > 1) out.push('…')
        out.push(v)
      })
      return out
    },

    // Navega para uma página
    goTo(p) {
      p = Number(p)
      if (p >= 1 && p <= this.totalPages()) this._page = p
    },

    // Atualiza o dataset e reseta para página 1
    setItems(items) {
      this._items = items || []
      this._page  = 1
    },

    // Jump via input numérico
    jumpTo(e) {
      var v = parseInt(e.target.value)
      e.target.value = ''
      if (!isNaN(v)) this.goTo(v)
    },
  }
}

// ============================================================
// usePokemonChips(limit)
// Gerencia listas de chips de Pokémon com spoiler.
// Aparece em 3 modais: item ("Obtido de"), move ("Aprendido
// por") e ability ("Pokémon com esta habilidade").
//
// Uso no modal.js: Object.assign(returnObj, usePokemonChips(10))
// Uso no HTML:
//   x-for="p in visibleChips('learnedBy', extra.learnedBy)"
//   x-show="hasMore('learnedBy', extra.learnedBy)"
//   @click="toggleChips('learnedBy')"
//   x-text="hiddenCount('learnedBy', extra.learnedBy)"
// ============================================================

function usePokemonChips(limit) {
  limit = limit || 10
  return {
    _chipsExpanded: {},  // { key: boolean }

    // Reseta o estado de expansão ao abrir um novo modal
    _resetChips() {
      this._chipsExpanded = {}
    },

    // Itens visíveis: primeiros `limit` ou todos se expandido
    visibleChips(key, items) {
      items = items || []
      return this._chipsExpanded[key] ? items : items.slice(0, limit)
    },

    // Há itens ocultos?
    hasMore(key, items) {
      return (items || []).length > limit
    },

    // Quantos estão ocultos
    hiddenCount(key, items) {
      return Math.max(0, (items || []).length - limit)
    },

    // Alterna expansão
    toggleChips(key) {
      this._chipsExpanded[key] = !this._chipsExpanded[key]
    },
  }
}
