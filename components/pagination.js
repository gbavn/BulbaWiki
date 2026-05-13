// ============================================================
// BulbaWiki — components/pagination.js
// Alpine.data('pagination', config)
//
// Config: { total: number, perPage: number (default 12) }
// Emite evento customizado 'bw:page-change' com { page }
// ============================================================

document.addEventListener('alpine:init', function() {
  Alpine.data('pagination', function(config) {
    config = config || {}
    return {
      total:   config.total   || 0,
      perPage: config.perPage || 12,
      page:    1,

      get totalPages() {
        return Math.max(1, Math.ceil(this.total / this.perPage))
      },

      get pages() {
        const total = this.totalPages
        const cur   = this.page
        if (total <= 7) {
          return Array.from({ length: total }, function(_, i) { return i + 1 })
        }
        const set    = new Set([1, 2, cur-1, cur, cur+1, total-1, total].filter(function(p) { return p >= 1 && p <= total }))
        const sorted = Array.from(set).sort(function(a, b) { return a - b })
        const pages  = []
        for (let i = 0; i < sorted.length; i++) {
          if (i > 0 && sorted[i] - sorted[i-1] > 1) pages.push('…')
          pages.push(sorted[i])
        }
        return pages
      },

      goTo(p) {
        if (typeof p !== 'number' || p < 1 || p > this.totalPages) return
        this.page = p
        this.$dispatch('bw:page-change', { page: p })
      },

      prev() { this.goTo(this.page - 1) },
      next() { this.goTo(this.page + 1) },

      jumpTo(e) {
        const v = parseInt(e.target.value)
        e.target.value = ''
        if (!isNaN(v)) this.goTo(v)
      },

      setTotal(n) {
        this.total = n
        if (this.page > this.totalPages) this.page = 1
      },
    }
  })
})
