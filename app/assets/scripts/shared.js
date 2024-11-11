
import c from './constants.js'
import $ from './jqes6.js'

export function isDebug() {
    return /(\?|&)debug($|&)/.test(window.location.search)
}

export function showMessage(msg, ttl, type) {
    // CSS-defined types: info, warn, error
    const ts = Date.now()
    $('#messages').append(`<p id='msg-${ts}' class='msg msg-${type || 'info'}' data-remove='${ts + (ttl * 1000)}'>${msg}</p>`)
    if (ttl) {
        setTimeout(() => {
            const elem = $(`#msg-${ts}`).addClass('complete')
            setTimeout(() => {
                elem.forEach((n) => { n.parentNode?.removeChild(n) })
            }, 550)
        }, ttl * 1000)
    }
    window.scrollTo(0,0)
}

export function parseQuery() {
    const params = {}
    window.location.search.substring(1).split('&')
        .forEach(p => {
            const parts = p.split('=')
            if (params[parts[0]]) {
                if (!Array.isArray(params[parts[0]])) { params[parts[0]] = [params[parts[0]]] }
                params[parts[0]].push(parts[1] || true)
            } else if (parts.length === 1) {
                params[parts[0]] = true
            } else {
                params[parts[0]] = parts[1]
            }
        })
    return params
}

export function getScenario() {
    let scenario = null
    try {
        scenario = JSON.parse(localStorage.getItem(c.SCENARIO_KEY) || 'null')
        scenario.itemsByName = {}
        scenario.items.forEach((item) => { scenario.itemsByName[item.name.toLowerCase()] = item })
        scenario.abilitiesByName = {}
        scenario.abilities.forEach((ab) => { scenario.abilitiesByName[ab.name.toLowerCase()] = ab })
    } catch(e) {
        console.warn(`Unable to load scenario from localStorage key: ${c.SCENARIO_KEY}`)
    }
    return scenario
}

export function getCharacter() {
    let character = null
    try {
        character = JSON.parse(localStorage.getItem(c.CHARACTER_KEY) || 'null')
    } catch(e) {
        console.warn(`Unable to load character from localStorage key: ${c.CHARACTER_KEY}`)
    }
    return character
}

export function getQuestTracker() {
    let tracker = null
    try {
        tracker = JSON.parse(localStorage.getItem(c.QUEST_TRACKER_KEY) || 'null')
    } catch(e) {
        console.warn(`Unable to load quest tracker from localStorage key: ${c.QUEST_TRACKER_KEY}`)
    }
    return tracker
}

export async function saveCharacter(character) {
    if (!character) {
        return console.warn(`No character provided to save`)
    }

    const oldCharacter = getCharacter()

    if (oldCharacter.id !== character.id) {
        if (!confirm('You are about to replace your currently loaded character!\n\nAre you sure you want to do this?')) {
            return window.location.reload()
        }
    }

    if (!/^[a-f0-9]+$/.test(character.id)) {
        character.id = await generateHash(`${Date.now()} ${character.name} ${character.race} ${character.class} ${character.reality}`)
    }

    delete character.last_save
    delete character.hash_check
    character.hash_check = await generateHash(character)
    character.last_save = Date.now()

    try {
        console.debug(`Saving character at ${character.last_save} with hash ${character.hash_check}`)
        localStorage.setItem(c.CHARACTER_KEY, JSON.stringify(character))
        if (oldCharacter?.hash_check !== character.hash_check) {
            addToCharacterHistory(oldCharacter)
        }

    } catch(e) {
        console.warn(`Unable to save character to localStorage key '${c.CHARACTER_KEY}': ${e.message}`)
        if (oldCharacter) {
            console.debug(`Attempting to revert to previous character`)
            localStorage.setItem(c.CHARACTER_KEY, JSON.stringify(oldCharacter))
        }
        throw new Error('Sorry, we were unable to save the character data.')
    }
    return true
}

export function getCharacterHistory() {
    let history = []
    try {
        history = JSON.parse(localStorage.getItem(c.CHARACTER_HISTORY_KEY) || '[]')
    } catch(e) {
        console.warn(`Unable to load character history from localStorage key: ${c.CHARACTER_HISTORY_KEY}`)
    }
    return history
}

function addToCharacterHistory(character) {
    if (!character) { return }
    const history = getCharacterHistory()
    history.push(character)
    if (history.length > c.MAX_CHARACTER_HISTORY) {
        history.shift()
    }

    try {
        console.debug(`Saving character history entry in localStorage: ${c.CHARACTER_HISTORY_KEY}`)
        localStorage.setItem(c.CHARACTER_HISTORY_KEY, JSON.stringify(history))
    } catch(e) {
        console.warn(`Unable to save character history to localStorage key '${c.CHARACTER_HISTORY_KEY}': ${e.message}`)
    }
}

export function saveQuestTracker(tracker) {
    if (!tracker) {
        return console.warn(`No quest tracker data provided to save`)
    }

    tracker.last_save = Date.now()

    try {
        console.debug(`Saving quest data at ${tracker.last_save}`)
        localStorage.setItem(c.QUEST_TRACKER_KEY, JSON.stringify(tracker))
    } catch(e) {
        console.warn(`Unable to save quest data to localStorage key '${c.QUEST_TRACKER_KEY}': ${e.message}`)
        throw new Error('Sorry, we were unable to save the quest data.')
    }
    return true
}

export function setupPaging(parent, checks = {}, onshow = {}) {
    $(parent).on('click', '.pager', (e) => {
        const show = e.target.getAttribute('data-show')
        if (!show) { return console.warn('No data-show attribute on pager button!') }
        
        const check = e.target.getAttribute('data-check') || null
        if (check && !checks[check]()) { return }

        $('.page-section').hide()
        const el = $(show)
        const callback = el[0].getAttribute('data-onshow')
        if (callback && onshow[callback]) {
            onshow[callback]()
        }
        el.show()
    })
}

export async function generateHash(data, algo='sha-256') {
    const hashBuffer = await crypto.subtle.digest(algo, (new TextEncoder()).encode(JSON.stringify(data)))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function getCoreAbilitiesTableHtml(tableClass = 'core-abilities', defaultValues = 1) {
    return `<table class='${tableClass}'>
    <thead><tr>
        <th>Lift</th>
        <th>Think</th>
        <th>Balance</th>
        <th>Move</th>
        <th>Lead</th>
    </tr></thead>
    <tbody><tr>
        <td class='core-lift'>${defaultValues}</td>
        <td class='core-think'>${defaultValues}</td>
        <td class='core-balance'>${defaultValues}</td>
        <td class='core-move'>${defaultValues}</td>
        <td class='core-lead'>${defaultValues}</td>
    </tr></tbody>
</table>`
}

export function buildAbilityDisplay(ability, charAbility = null, charItems = null, charCore = null) {
    const abStats = getAbilityTargetAndEffects(ability, charAbility, charItems)

    const effectText = Object.keys(abStats.effects).map((type) => {
        let text = abStats.effects[type].text.replace('{{amount}}', abStats.effects[type].amount)
        
        if (charAbility) {
            text = text.replace('aLv', `${charAbility.level}<span class='calc-source'>(aLv)</span>`)
        }
        if (charCore) {
            text = text.replace('Lt', `${charCore.lift}<span class='calc-source'>(Lt)</span>`)
                .replace('Th', `${charCore.think}<span class='calc-source'>(Th)</span>`)
                .replace('Bc', `${charCore.balance}<span class='calc-source'>(Bc)</span>`)
                .replace('Mv', `${charCore.move}<span class='calc-source'>(Mv)</span>`)
                .replace('Ld', `${charCore.lead}<span class='calc-source'>(Ld)</span>`)
        }
        return text
    })

    return `${(charAbility) ? '' : `<h3>${ability.name} (${ability.type})</h3>`}
<aside class='ability-details'>
    <p>${ability.usage}</p>
    <ul>
        <li>Target: <strong>${abStats.target}</strong></li>
        <li>Range: ${ability.range === 0 ? '(not ranged)' : ability.range[1]}</li>
        <li>Effects: ${effectText.length ? effectText.join('; ') : '(see description)'}</li>
    </ul>
</aside>`
}

export function getAbilityTargetAndEffects(ability, charAbility, charItems) {
    let target = ability.target
    if (charAbility) {
        target = target.replace('aLv', `${charAbility.level}<sup class='calc-source'>(aLv)</sup>`)
        ;(charAbility.modifiers || []).forEach((mod) => {
            if (mod.attribute === 'target') {
                const sign = (mod.amount < 0) ? '-' : '+'
                target += ` ${sign} ${Math.abs(mod.amount)}<sup class='calc-source'>(mod)</sup>`
            }
        })
    }

    const verbs = { damage: 'deal', defense: 'defend', heal: 'heal' }
    const effects = {}
    ;(ability.effects || []).forEach((e) => {
        if (verbs[e.type]) {
            effects[e.type] = { text: `${verbs[e.type]} <strong>{{amount}}</strong> damage`, amount: e.amount }
        } else if (e.type === 'modifier') {
            effects[`modifier-${e.object}`] = { text: `modify <strong>${e.object} ${e.attribute}</strong> by <strong>{{amount}}</strong>`, amount: e.amount }
        } else if (e.type === 'action') {
            effects.action = { text: 'perform the action', amount: e.amount }
        } else if (e.type === 'level') {
            effects[`level-${e.attribute}`] = { text: `modify <strong>${e.object} ${e.attribute}</strong>`, amount: e.amount }
        } else if (e.type === 'turn') {
            effects.turn = { text: `${e.object} takes {{amount}} turn${Number(e.amount) === 1 ? '' : 's'}`, amount: e.amount }
        } else if (e.type === 'move') {
            effects.move = { text: `move ${e.object}`, amount: e.amount }
        } else {
            effects[e.type] = { text: '(see description)', amount: e.amount }
        }
    })

    if (charItems && charItems.length) {
        const items = getScenario().itemsByName
        charItems.forEach((item) => {
            if (item.equipped && items[item.name] && items[item.name].effects) {
                items[item.name].effects.forEach((e) => {
                    if (e.object.toLowerCase() === ability.name.toLowerCase() && e.attribute === 'target') {
                        const sign = (e.amount < 0) ? '-' : '+'
                        target += ` ${sign} ${e.amount}<span class='calc-source'>(${item.name})</span>`
                    }
                    if (e.object.toLowerCase() === ability.name.toLowerCase() && e.attribute === 'damage' && effects.damage) {
                        const sign = (e.amount < 0) ? '-' : '+'
                        effects.damage.amount = `${effects.damage.amount} ${sign} ${e.amount}<span class='calc-source'>(${item.name})</span>`
                    }
                })
            }
        })
    }

    return { target, effects }
}

export function calculateFormula(base, coreStats, abilityName = null, attribute, charItems = [], params = {}, modifiers = []) {
    // known params: (coreStats), F, R, Over, #, aLv, Lv, avgLv, MaxHP

    let formula = base.replaceAll(' x ', ' * ').replaceAll(/^-\(/g, '-1 * (').replaceAll(/^\+\(/g, '0 + (')
    for (let key in coreStats) {
        params[c.CORE_MAP[key.toLowerCase()]] = coreStats[key]
    }
    for (let key in params) {
        formula = formula.replaceAll(key, params[key])
    }
    modifiers.forEach((mod) => {
        if (Number.isInteger(mod)) {
            const sign = (mod < 0) ? '-' : '+'
            formula = `(${formula}) ${sign} ${Math.abs(mod)}`
        }
    })

    if (charItems && charItems.length) {
        const items = getScenario().itemsByName
        charItems.forEach((item) => {
            if (item.equipped && items[item.name] && items[item.name].effects) {
                items[item.name].effects.forEach((eff) => {
                    if (eff.object.toLowerCase() === abilityName.toLowerCase() && eff.attribute.toLowerCase() === attribute.toLowerCase()) {
                        const sign = (eff.amount < 0) ? '-' : '+'
                        formula = `(${formula}) ${sign} ${Math.abs(mod)}`
                    }
                })
            }
        })
    }

    let result = null
    const reduced = reduceFormula(formula)
    if (Number(reduced)) {
        result = Number(reduced)
    }

    return { formula, reduced, result }
}

function reduceFormula(formula) {
    let modified = formula
    const matches = formula.match(/\([0-9 \-+*\/]+\)/g)
    if (matches) {
        matches.forEach((m) => {
            try {
                modified = modified.replace(m, Math.floor(eval(m)))
            } catch(e) {
                console.debug('unable to evaluate formula section:', m)
            }
        })
        return reduceFormula(modified)
    }  if (/^[0-9 \-+*\/]+$/) {
        try {
            return eval(formula)
        } catch(e) {
            console.debug('unable to evaluate reduced formula:', formula)
            return formula
        }
    }
}

export function buildItemDisplay(item, charItem = null, charCore = null) {
    const effects = getItemEffects(item, charCore)

    const equip = item.equip ? ' (must equip)' : ''
    const requirements = (item.requirements || []).map((req) => {
        return `${req.ability} >= ${req.value}`
    })

    return `${(charItem) ? '' : `<h4>${item.name}${equip}</h4>`}
<aside class='item-details'>
    <p>${item.description}</p>
    <ul>
        <li>Weight: ${item.weight}</li>
        <li>To Use: ${(requirements.length) ? requirements.join('; ') : '(none)'}</li>
        <li>Effects: ${effects.length ? effects.join('; ') : '(see description)'}</li>
    </ul>
</aside>`
}

export function getItemEffects(item, charCore = null) {
    return (item.effects || []).map((e) => {
        let text = '(see description)'
        if (e.type === 'heal') {
            text = `heal <strong>${e.amount}</strong> damage`
        } else if (e.type === 'modifier') {
            text = `modify <strong>${e.attribute}</strong> of <strong>${e.object}</strong> by <strong>${e.amount}</strong>`
        } else if (e.type === 'stun') {
            text = `stun for <strong>${e.amount} turns</strong>`
        } else if (e.type === 'defense') {
            text = `defend <strong>${(Number(e.amount)) ? Math.abs(e.amount) : e.amount}</strong> damage`
        } else if (e.type === 'damage') {
            text = `deal <strong>${(Number(e.amount)) ? Math.abs(e.amount) : e.amount}</strong> damage`
        }
        if (charCore) {
            text = text.replace('Lt', `${charCore.lift}<span class='calc-source'>(Lt)</span>`)
                .replace('Th', `${charCore.think}<span class='calc-source'>(Th)</span>`)
                .replace('Bc', `${charCore.balance}<span class='calc-source'>(Bc)</span>`)
                .replace('Mv', `${charCore.move}<span class='calc-source'>(Mv)</span>`)
                .replace('Ld', `${charCore.lead}<span class='calc-source'>(Ld)</span>`)
        }
        return text
    })
}

export function canUseItem(itemName, character, scenario, showMsg = false) {
    let canUse = true
    ;(scenario.itemsByName[itemName].requirements || []).forEach((req) => {
        if (character.core[req.ability.toLowerCase()] < req.value) {
            canUse = false
            if (showMsg) {
                showMessage(`Your ${req.ability} is not high enough to use this item (${character.core[req.ability.toLowerCase()]} < ${req.value})!`, 6, 'warn')
            }
        }
    })
    return canUse
}

export function observe(node, fn, options = {}) {
    const observer = new MutationObserver(fn)
    observer.observe(node, options)
}

function watchModal(selector, fn, checkForOpen) {
    const node = $(selector)[0]
    if (!node) { return console.debug(`Unable to watch modal (bad selector): ${selector}`) }
    observe(node, (records = []) => {
        for (let i in records) {
            const openChanged = records[i].type === 'attributes' && records[i].attributeName === 'open'
            const correctState = checkForOpen ? (node.getAttribute('open') !== null) : (node.getAttribute('open') === null)
            if (openChanged && correctState && fn?.apply) {
                fn(node)
            }
        }
    }, { attributes: true })
}
export function onModalClose(selector, fn) {
    watchModal(selector, fn, false)
}
export function onModalOpen(selector, fn) {
    watchModal(selector, fn, true)
}

export function indexOfItem(character, itemName) {
    let itemIndex = -1
    for (let i in character.items) {
        if (character.items[i].name.toLowerCase() === itemName.toLowerCase()) {
            itemIndex = i
        }
    }
    return itemIndex
}
