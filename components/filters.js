// ============================================================
// BulbaWiki — components/filters.js
// Alpine.data('filters', config)
//
// Config: { tab: 'pokemon' | 'items' | 'moves' | 'abilities' }
// Expõe: values, count, apply(data), clear()
// Emite: 'bw:filter-change' com { filtered: [] }
// ============================================================

document.addEventListener('alpine:init', function() {
  Alpine.data('filters', function(config) {
    config = config || {}
    const tab = config.tab || 'pokemon'

    const defaults = {
      pokemon:   { search:'', type1:'', type2:'', eggGroup:'', canBreed:false, hasArtwork:false },
      items:     { search:'', category:'', hasSprite:false, hasPrice:false, isCraftable:false, isBerry:false, priceMin:0, priceMax:100000 },
      moves:     { search:'', type:'', category:'', status:'', hasContest:false, powerMin:0, powerMax:250 },
      abilities: { search:'', status:'', hasOutEffect:false },
    }

    return {
      tab:    tab,
      open:   false,
      values: Object.assign({}, defaults[tab] || {}),

      get count() {
        const f = this.values
        const v = Object.values(f)
        return v.filter(function(x) { return x !== '' && x !== false && x !== 0 && x !== 100000 }).length
      },

      apply(data) {
        const f   = this.values
        const q   = (f.search || '').toLowerCase().trim()
        let   out = data

        if (tab === 'pokemon') {
          out = data.filter(function(p) {
            return (!q || p.name.toLowerCase().includes(q)) &&
                   (!f.type1    || (p.type1 || '').toLowerCase() === f.type1) &&
                   (!f.type2    || (p.type2 || '').toLowerCase() === f.type2) &&
                   (!f.eggGroup || p.egg_group1 === f.eggGroup || p.egg_group2 === f.eggGroup) &&
                   (!f.canBreed || p.can_breed) &&
                   (!f.hasArtwork || p.artwork_normal)
          })
        } else if (tab === 'items') {
          out = data.filter(function(i) {
            return (!q || i.name.toLowerCase().includes(q)) &&
                   (!f.category    || String(i.category_id) === f.category) &&
                   (!f.hasSprite   || (i.sprites && i.sprites.length > 0)) &&
                   (!f.hasPrice    || i.price != null) &&
                   (!f.isCraftable || i.is_craftable) &&
                   (!f.isBerry     || i.is_berry) &&
                   (i.price == null || (i.price >= f.priceMin && i.price <= f.priceMax))
          })
        } else if (tab === 'moves') {
          out = data.filter(function(m) {
            return (!q || m.name.toLowerCase().includes(q)) &&
                   (!f.type     || (m.type || '').toLowerCase() === f.type) &&
                   (!f.category || m.category === f.category) &&
                   (!f.status   || m.status === f.status) &&
                   (!f.hasContest || m.contest_points) &&
                   (m.power == null || (m.power >= f.powerMin && m.power <= f.powerMax))
          })
        } else if (tab === 'abilities') {
          out = data.filter(function(a) {
            return (!q || a.name.toLowerCase().includes(q)) &&
                   (!f.status       || a.status === f.status) &&
                   (!f.hasOutEffect || a.out_of_battle_effect)
          })
        }

        this.$dispatch('bw:filter-change', { filtered: out })
        return out
      },

      clear() {
        this.values = Object.assign({}, defaults[this.tab] || {})
      },

      toggle() {
        this.open = !this.open
      },
    }
  })
})
