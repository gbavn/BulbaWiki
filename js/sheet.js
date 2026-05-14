// ============================================================
// BulbaWiki — sheet.js
// Gerador de ficha BBCode para o fórum BulbaRPG.
// Usado pelo modal.js via BwSheet.gerarFicha() e BwSheet.copiarMove().
// Depende de: constants.js (TYPE_PILL_CODE, TYPE_HEX_BBCODE, TYPE_IMMUNITIES_BBCODE)
// ============================================================

var BwSheet = {

  async gerarFicha(data, extra, comContest) {
    var p = data, ex = extra, cc = comContest
    if (!p || !ex) return
    var img  = p.artwork_normal || ''
    var dex  = p.pokeapi_id ? '#' + String(p.pokeapi_id).padStart(4,'0') : ''

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
    var regular = (ex.abilities||[])
      .filter(function(a){ return (a.ability_type||'').toLowerCase() !== 'hidden' })
      .map(function(a){ return a.abilities&&a.abilities.name||'' }).filter(Boolean)
    var hid = (ex.abilities||[])
      .filter(function(a){ return (a.ability_type||'').toLowerCase() === 'hidden' })
      .map(function(a){ return a.abilities&&a.abilities.name||'' }).filter(Boolean)
    var abilStr = regular.join(' | ')
    if (hid.length) abilStr += ' (HA: ' + hid.join(' | ') + ')'

    // Held items
    var itemStr = (ex.drops&&ex.drops.held||[])
      .map(function(h){ return (h.roll||'')+' '+(h.items&&h.items.name||'') })
      .filter(function(s){return s.trim()}).join(' | ')

    // Stats
    var total = (p.hp||0)+(p.attack||0)+(p.defense||0)+(p.sp_attack||0)+(p.sp_defense||0)+(p.speed||0)

    // Immunities
    var imms = [p.type1, p.type2].filter(Boolean)
      .map(function(t){ return TYPE_IMMUNITIES_BBCODE[(t||'').toLowerCase()] })
      .filter(Boolean)

    // Moves
    var ORDER = { initial:0, evo:1, level:2 }
    var moves = (ex.moves||[])
      .filter(function(mv){ return mv.learn_method in ORDER })
      .slice().sort(function(a,b){
      var oa=ORDER[a.learn_method]||99, ob=ORDER[b.learn_method]||99
      return oa!==ob ? oa-ob : (a.level||0)-(b.level||0)
    })
    var movesLines = moves.map(function(mv){
      var m=mv.moves||{}, name=m.name||'?'
      var color=TYPE_HEX_BBCODE[(m.type||'normal').toLowerCase()]||'#a8a878'
      var lm=mv.learn_method
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
      '[quote]'+(imms.join('\n')||'—')+'[/quote]',
      '[/spoiler]',
      '',
      '[b]Ataques:[/b]',
      movesLines,
      '',
      '[size=10][i](Lvl x, local)[/i][/size][/center]',
      '[/spoiler]',
    ].join('\n')

    try { await navigator.clipboard.writeText(sheet) } catch(e) { console.error(e) }
  },

  async copiarMove(data) {
    var m = data; if (!m) return
    var color = TYPE_HEX_BBCODE[(m.type||'normal').toLowerCase()]||'#a8a878'
    var text = '[color='+color+']'+m.name+'[/color]'
    if (m.contest_points) text += ' [size=10][i]('+m.contest_points+')[/i][/size]'
    try { await navigator.clipboard.writeText(text) } catch(e) { console.error(e) }
  },

  async copiarItem(data) {
    var m = data; if (!m) return
    var sprites = Array.isArray(m.sprites) ? m.sprites : (m.sprites ? Object.values(m.sprites) : [])
    var sprite  = sprites[0] || ''
    var img     = sprite ? '[img(24px,24px)]' + sprite + '[/img] ' : ''
    var text    = img + m.name + ' [01]'
    try { await navigator.clipboard.writeText(text) } catch(e) { console.error(e) }
  },


}
