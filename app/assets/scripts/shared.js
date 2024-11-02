
import c from './constants.js'
import $ from './jqes6.js'

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

export async function saveCharacter(character) {
    if (!character) {
        return console.warn(`No character provided to save`)
    }

    const oldCharacter = getCharacter()

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

export function getItemsByName(scenario) {
    const itemsByName = {}
    scenario.items.forEach((item) => itemsByName[item.name.toLowerCase()] = item)
    return itemsByName
}

export function getAbilitiesByName(scenario) {
    const abilitiesByName = {}
    scenario.abilities.forEach((ab) => abilitiesByName[ab.name.toLowerCase()] = ab)
    return abilitiesByName
}

export function buildAbilityDisplay(ability, charAbility = null, charItems = null, charCore = null) {
    let target = ability.target
    if (charAbility) {
        target = target.replace('aLv', `${charAbility.level}<span class='calc-source'>(aLv)</span>`)
        ;(charAbility.modifiers || []).forEach((mod) => {
            if (mod.attribute === 'target') {
                const sign = (e.amount < 0) ? '-' : '+'
                target += ` ${sign} ${mod.amount}(mod)`
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
        const items = getItemsByName(getScenario())
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

    const effectText = Object.keys(effects).map((type) => {
        let text = effects[type].text.replace('{{amount}}', effects[type].amount)
        
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

    // TODO: do full calculation of target and effects if we have the info

    return `${(charAbility) ? '' : `<h3>${ability.name} (${ability.type})</h3>`}
<aside class='ability-details'>
    <p>${ability.usage}</p>
    <ul>
        <li>Target: <strong>${target}</strong></li>
        <li>Range: ${ability.range === 0 ? '(not ranged)' : ability.range[1]}</li>
        <li>Effects: ${effectText.length ? effectText.join('; ') : '(see description)'}</li>
    </ul>
</aside>`
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
    const itemsByName = getItemsByName(scenario)
    ;(itemsByName[itemName].requirements || []).forEach((req) => {
        if (character.core[req.ability.toLowerCase()] < req.value) {
            canUse = false
            if (showMsg) {
                showMessage(`Your ${req.ability} is not high enough to use this item (${character.core[req.ability.toLowerCase()]} < ${req.value})!`, 6, 'warn')
            }
        }
    })
    return canUse
}
