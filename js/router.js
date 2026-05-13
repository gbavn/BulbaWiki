// ============================================================
// BulbaWiki — router.js
// Hash router: escuta window.location.hash e injeta fragmentos
// HTML no <main id="bw-main"> via fetch('pages/x.html').
// Após injetar, chama Alpine.initTree() para inicializar
// os componentes Alpine do fragmento carregado.
// ============================================================

const ROUTES = {
  '':              'pages/home.html',
  '/':             'pages/home.html',
  '/pokemon':      'pages/pokemon.html',
  '/moves':        'pages/moves.html',
  '/abilities':    'pages/abilities.html',
  '/items':        'pages/items.html',
}

// Cache de fragmentos já carregados
const _pageCache = {}

// Elemento raiz onde as páginas são injetadas
function getMain() {
  return document.getElementById('bw-main')
}

// Extrai a rota base e o parâmetro :id do hash
// Ex: "#/pokemon/BF7VAT" → { route: '/pokemon', id: 'BF7VAT' }
// Ex: "#/pokemon"        → { route: '/pokemon', id: null }
function parseHash(hash) {
  const path  = hash.replace(/^#/, '') || '/'
  const parts = path.split('/')
  // /pokemon/BF7VAT → parts = ['', 'pokemon', 'BF7VAT']
  if (parts.length === 3 && parts[2]) {
    return { route: '/' + parts[1], id: parts[2] }
  }
  return { route: path || '/', id: null }
}

async function loadPage(file) {
  if (_pageCache[file]) return _pageCache[file]
  try {
    const res = await fetch(file)
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${file}`)
    const html = await res.text()
    _pageCache[file] = html
    return html
  } catch (e) {
    console.error('[Router]', e)
    return `<div style="padding:40px;text-align:center;opacity:.5">Erro ao carregar página.</div>`
  }
}

async function navigate(hash, pushState = false) {
  const { route, id } = parseHash(hash)

  // Rota de detalhe de Pokémon
  if (route === '/pokemon' && id) {
    await renderPage('pages/pokemon.html')
    // Dispara evento para o componente da página abrir o modal
    document.dispatchEvent(new CustomEvent('bw:open-pokemon', { detail: { id } }))
    return
  }

  const file = ROUTES[route] ?? 'pages/home.html'
  await renderPage(file)

  if (pushState) {
    history.pushState(null, '', window.location.pathname + (hash || ''))
  }
}

async function renderPage(file) {
  const main = getMain()
  if (!main) return

  // Mostra spinner enquanto carrega
  main.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:60px">
    <div class="bw-spinner"></div>
  </div>`

  const html = await loadPage(file)
  main.innerHTML = html

  // Reinicializa Alpine nos novos elementos
  Alpine.initTree(main)
}

// Navega programaticamente e atualiza o hash
function goTo(path) {
  window.location.hash = path
}

// Inicia o router: escuta hashchange + render inicial
function initRouter() {
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash)
  })
  // Render inicial
  navigate(window.location.hash || '#/')
}
