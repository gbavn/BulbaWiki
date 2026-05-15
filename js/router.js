;(function() {
  if (window.BW_BASE_URL) return
  var scripts = document.getElementsByTagName('script')
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src || ''
    if (src.indexOf('/js/router.js') !== -1) {
      window.BW_BASE_URL = src.replace('/js/router.js', '') + '/'
      break
    }
  }
})()

// ============================================================
// BulbaWiki — router.js
// Hash router: escuta window.location.hash e injeta fragmentos
// HTML no <main id="bw-main"> via fetch('pages/x.html').
// Após injetar, chama Alpine.initTree() para inicializar
// os componentes Alpine do fragmento carregado.
// ============================================================

const ROUTES = {
  '':            'pages/home.html',
  '/':           'pages/home.html',
  '/pokemon':    'pages/pokemon.html',
  '/moves':      'pages/moves.html',
  '/abilities':  'pages/abilities.html',
  '/items':      'pages/items.html',
}

// Rota de detalhe (com id) → página base + tipo de modal
const DETAIL_ROUTES = {
  '/pokemon': { file: 'pages/pokemon.html', type: 'pokemon' },
  '/item':    { file: 'pages/items.html',   type: 'item'    },
  '/move':    { file: 'pages/moves.html',   type: 'move'    },
  '/ability': { file: 'pages/abilities.html', type: 'ability' },
}

// Cache de fragmentos já carregados
const _pageCache = {}

// Página atualmente renderizada (evita reload desnecessário)
var _currentFile = null

// Elemento raiz onde as páginas são injetadas
function getMain() {
  return document.getElementById('bw-main')
}

// Extrai a rota base e o parâmetro :id do hash
// Ex: "#/pokemon/BF7VAT" → { route: '/pokemon', id: 'BF7VAT' }
// Ex: "#/pokemon"        → { route: '/pokemon', id: null }
function parseHash(hash) {
  var path  = hash.replace(/^#/, '') || '/'
  var parts = path.split('/')
  // /pokemon/BF7VAT → parts = ['', 'pokemon', 'BF7VAT']
  if (parts.length === 3 && parts[2]) {
    return { route: '/' + parts[1], id: parts[2] }
  }
  return { route: path || '/', id: null }
}

async function loadPage(file) {
  if (_pageCache[file]) return _pageCache[file]
  var base = window.BW_BASE_URL || ''
  try {
    var res = await fetch(base + file)
    if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + file)
    var html = await res.text()
    _pageCache[file] = html
    return html
  } catch (e) {
    console.error('[Router]', e)
    return '<div style="padding:40px;text-align:center;opacity:.5">Erro ao carregar página.</div>'
  }
}

async function navigate(hash) {
  var parsed = parseHash(hash)
  var route  = parsed.route
  var id     = parsed.id

  // Rota de detalhe (com id) → carrega página base + abre modal
  var detail = DETAIL_ROUTES[route]
  if (id && detail) {
    if (_currentFile !== detail.file) {
      await renderPage(detail.file)
    }
    // Aguarda Alpine inicializar na página antes de abrir o modal
    setTimeout(function() {
      document.dispatchEvent(new CustomEvent('bw:open-detail', {
        detail: { type: detail.type, id: id }
      }))
    }, 150)
    return
  }

  // Rota de lista
  var file = ROUTES[route] || 'pages/home.html'
  if (_currentFile !== file) {
    await renderPage(file)
  }
}

async function renderPage(file) {
  var main = getMain()
  if (!main) return

  _currentFile = file

  // Mostra spinner enquanto carrega
  main.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:60px"><div class="bw-spinner"></div></div>'

  var html = await loadPage(file)
  main.innerHTML = html

  // Reinicializa Alpine nos novos elementos
  Alpine.initTree(main)
}

// Navega programaticamente e atualiza o hash
function goTo(path) {
  window.location.hash = path
}

// Inicia o router: escuta hashchange + popstate + render inicial
function initRouter() {
  window.addEventListener('hashchange', function() {
    navigate(window.location.hash)
  })

  // popstate: dispara quando history.pushState é desfeito (botão voltar)
  window.addEventListener('popstate', function() {
    var hash = window.location.hash
    if (hash) {
      navigate(hash)
    } else {
      navigate('#/')
    }
  })

  // Render inicial
  navigate(window.location.hash || '#/')
}
