
import $ from './jqes6.js'
import c from './constants.js'
import {
    showMessage,
    getScenario,
    setupPaging,
    saveCharacter,
    getCoreAbilitiesTableHtml,
    getCharacter,
    buildAbilityDisplay,
    buildItemDisplay
} from './shared.js'
import template from '../data/character_template.js'

async function initCreateCharacter() {
    const scenario = await getScenario()
    if (!scenario) {
        showMessage(`Sorry, but you need to <a href='/load-scenario'>load a scenario</a> first!`, null, 'error')
        $('form.create-character').hide()
        return
    }

    if (getCharacter()) {
        showMessage(`Sorry, but it looks like you already have a character created! You can view your <a href='/character'>Character Sheet</a> to check!`, null, 'warn')
        $('form.create-character').hide()
        setupReset()
        return
    }

    console.debug('Building character for scenario:', scenario)

    const inProgressCharacter = JSON.parse(localStorage.getItem(c.IN_PROGRESS_CHARACTER_KEY) || 'null')
    let character = null
    if (inProgressCharacter) {
        character = inProgressCharacter
    } else {
        character = structuredClone(template)
        character.build = {
            hasCoreBonus: false,
            coreBonuses: []
        }
        character.scenarios = [scenario.id]
        character.reality = scenario.reality
    }

    $('#page-create-character .core-table').html(getCoreAbilitiesTableHtml('modifiers', 0))
    $('#page-create-character .in-progress-core-table').html(getCoreAbilitiesTableHtml('in-progress-core-abilities', 1))

    setupPaging('.create-character', {
        // checks before progressing
        raceAndClass: () => {
            if (!character.race || !character.class) {
                showMessage('Please select a race and class for your character before proceeding!', 5, 'warn')
                return false
            }
            return true
        },
        coreBonus: () => {
            if (!character.build.hasCoreBonus) {
                showMessage('Please flip for your core bonuses and "assign" them before proceeding!', 6, 'warn')
                return false
            }
            return true
        }
    }, {
        // actions on show of section
        checkAbilities: () => {
            setAvailableAbilities(character, scenario)
        },
        checkItems: () => {
            setAvailableItems(character, scenario)
        }
    })

    setupRaceAndClass('race', character, scenario)
    setupRaceAndClass('class', character, scenario)
    setupCoreBonus(character, scenario)
    setupAbilities(character, scenario)
    setupItems(character, scenario)
    setupQuirks(character, scenario)
    setupReset()
    setupCompletion(character, scenario)

    if (character.race && character.class) {
        $('.character-race-class').hide()
        if (character.build.hasCoreBonus) {
            $('.choose-race, .choose-class, .core-bonus').forEach((e) => { e.setAttribute('disabled', 'disabled') })
            $('.character-abilities').show()
        } else {
            $('.character-core-bonuses').show()
        }
    }

    updateInProgressCharacter(character, scenario)
}

function setupCompletion(character, scenario) {
    $('input.complete').on('click', async () => {
        if (!character.race || !character.class) {
            return showMessage('Please select a race and class for your character before proceeding!', 5, 'warn')
        }

        const quirkFreqElem = $('[name=quirk-frequency').filter((r) => r.getAttribute('checked'))[0]
        let quirkFrequency = 'c'
        if (quirkFreqElem) {
            quirkFrequency = quirkFreqElem.value
        }

        const quirk = {
            title: $('#quirk-title')[0].value || 'none',
            bonus: $('#quirk-bonus')[0].value || 'n/a',
            penalty: $('#quirk-penalty')[0].value || 'n/a',
            description: $('#quirk-description')[0].value || 'n/a',
            frequency: quirkFrequency
        }
        if (quirk.title && (!quirk.bonus || !quirk.penalty)) {
            return showMessage('Your quirk must have both a bonus and a penalty!', 5, 'warn')
        }

        character.name = prompt('Pleae give your character a name!')
        if (!character.name) {
            return showMessage('You must give your character a name!', 5, 'warn')
        }

        character.abilities.push(...getRaceAndClassAbilities('given', character, scenario))
        const ability = $('.character-abilities .availableAbilities')[0].value
        if (ability) {
            character.abilities.push(ability)
        }
        character.abilities = character.abilities.map((name) => { return { name, level: 1, modifiers: [] } })

        character.items.push(...getRaceAndClassItems('given', character, scenario))
        const item = $('.character-items .availableItems')[0].value
        if (item) {
            character.items.push(item)
        }
        character.items = character.items.map((name) => {
            let count = 1
            if (scenario.itemsByName[name]) {
                count = (scenario.itemsByName[name].count || 1)
                ;(scenario.itemsByName[name].includes || []).forEach((item) => {
                    return { name: item.name, equipped: false, count: (item.count || 1) }
                })
            }
            return { name, equipped: false, count }
        })

        character.quirk = quirk
        character.hp = (character.core.lift * character.core.think) + 3
        character.level = 1
        delete character.build

        console.log('Creating character', character)
        localStorage.removeItem(c.IN_PROGRESS_CHARACTER_KEY)
        await saveCharacter(character)
        window.location.replace('/character')
    })
}

function setupReset() {
    $('.reset').on('click', (e) => {
        e.preventDefault()
        if (!confirm('Are you sure you want to start over? Anything you have selected will be reset!')) {
            return false
        }
        localStorage.removeItem(c.CHARACTER_KEY)
        localStorage.removeItem(c.IN_PROGRESS_CHARACTER_KEY)
        window.location.reload()
        return false
    })
}

function updateInProgressCharacter(character, scenario) {
    const base = $('.current-character')
    if (character.race || character.class) { base.show() } else { return base.hide() }

    base.find('.selected-race').html(character.race || '?')
    base.find('.selected-class').html(character.class || '?')

    const curr = $('.current-character')
    const coreValues = []
    for (let i=0; i<c.CORE_ORDER.length; ++i) {
        let val = 1
        if (character.build.hasCoreBonus) {
            val = character.core[c.CORE_ORDER[i].toLowerCase()]
        } else {
            if (character.race) {
                val += scenario.races[character.race].core[i]
            }
            if (character.class) {
                val += scenario.classes[character.class].core[i]
            }
            val = Math.max(val, 1)
        }
        coreValues[i] = val
        curr.find(`.core-${c.CORE_ORDER[i].toLowerCase()}`).html(val)
    }

    curr.find('.max-hp').html((coreValues[0] * coreValues[1]) + 3)
    curr.find('.movement').html(Math.floor(coreValues[3] / 4) + 1)
    curr.find('.initiative').html(coreValues[3] + (coreValues[4] * 2))

    const abilities = []
    const abilitiesBlock = curr.find('.in-progress-abilities')
    if (character.race) {
        abilities.push(...(scenario.races[character.race].abilities?.given || []))
    }
    if (character.class) {
        abilities.push(...(scenario.classes[character.class].abilities?.given || []))
    }
    abilitiesBlock.html(abilities.length ? abilities.join(', ') : '(none)')

    const items = []
    const itemsBlock = curr.find('.in-progress-items')
    if (character.race) {
        items.push(...(scenario.races[character.race].items?.given || []))
    }
    if (character.class) {
        items.push(...(scenario.classes[character.class].items?.given || []))
    }
    itemsBlock.html(items.length ? items.join(', ') : '(none)')

    saveInProgressCharacter(character)
}

function saveInProgressCharacter(character) {
    localStorage.setItem(c.IN_PROGRESS_CHARACTER_KEY, JSON.stringify(character))
}

function setupRaceAndClass(type, character, scenario) {
    const selector = $(`.choose-${type} select`)
    const collection = (type === 'race') ? scenario.races : scenario.classes
    for (let name in collection) {
        selector.append(`<option value='${name}'>${name}</option>`)
    }
    
    if (character[type]) {
        selector.value = character[type]
        processRaceOrClass(character[type], type, collection, character, scenario)
    }

    if (!character.build.hasCoreBonus) {
        selector.on('change', (e) => {
            processRaceOrClass(e.target.value, type, collection, character, scenario)
        })
    }
}

function processRaceOrClass(value, type, collection, character, scenario) {
    const description = $(`.choose-${type} .description`)
    const modifiers = $(`.choose-${type} .modifiers`)

    const item = collection[value]
    if (item) {
        description.html(item.description || value).show()
        item.core.forEach((v, i) => {
            modifiers.find(`.core-${c.CORE_ORDER[i].toLowerCase()}`).html((v > 0 ? `+${v}` : `${v}`))
        })
        modifiers.show()

        character[type] = value
        updateInProgressCharacter(character, scenario)
    } else {
        character[type] = ''
        updateInProgressCharacter(character, scenario)
        description.hide()
        modifiers.hide()
    }
}

function setupCoreBonus(character, scenario) {
    if (character.build.hasCoreBonus) {
        let total = 0
        for (let i=0; i<c.CORE_ORDER.length; ++i) {
            total += character.build.coreBonuses[i]
            $(`.character-core-bonuses [name=core-bonus-${c.CORE_ORDER[i].toLowerCase()}]`)[0].value = character.build.coreBonuses[i]
        }
        $('.character-core-bonuses .core-bonus-value').html(total)
        return
    }
    
    $('.card-flip').on('change', () => {
        $('.core-bonus-value').html(getCoreBonus())
    })

    $('.assign-bonus').on('click', (e) => {
        const bonuses = $('.modifiers .core-bonus').map((n) => Number(n.value))
        const max = getCoreBonus()

        if (bonuses.filter((v) => v < 0 || v > max).length) {
            return showMessage(`Bonuses cannot be less than 0, and cannot exceed the maximum of ${max}!`, 5, 'warn')
        }

        const total = bonuses.reduce((prev, curr) => { return (prev || 0) + curr })
        if (total < max || total > max) {
            return showMessage(`Your ability bonuses do not equal your max value of ${max}!`, 5, 'warn')
        }

        if (!confirm('Once you set these bonuses, you cannot change your race or class! Are you sure?')) {
            return
        }

        character.build.hasCoreBonus = true
        character.build.coreBonuses = bonuses
        for (let i=0; i<c.CORE_ORDER.length; ++i) {
            let val = 1
            if (character.race) {
                val += scenario.races[character.race].core[i]
            }
            if (character.class) {
                val += scenario.classes[character.class].core[i]
            }
            val += bonuses[i]
            character.core[c.CORE_ORDER[i].toLowerCase()] = Math.max(val, 1)
            updateInProgressCharacter(character, scenario)
        }
        $('input.assign-bonus, .choose-race, .choose-class, .core-bonus').attr('disabled', 'disabled')
    })
}

function getCoreBonus() {
    const values = $('.card-flip').map((n) => Number(n.value)).filter((v) => v > 0)
    if (values.length < 3) { return 0 }

    let bonus = values.sort((a,b) => a-b)[1]
    if (values[0] === values[1] && values[0] === values[2]) {
        bonus += 2
    }
    return bonus
}

function setupAbilities(character, scenario) {
    const section = $('.character-abilities')
    const availableSelector = section.find('select.availableAbilities')
    const description = section.find('.description')

    // TODO: race/class ability options

    setAvailableAbilities(character, scenario)
    
    availableSelector.on('change', () => {
        if (!availableSelector[0].value) { return description.html(' ') }

        const ab = scenario.abilitiesByName[availableSelector[0].value]
        
        const abilities = getRaceAndClassAbilities('given', character, scenario)
        description.html(buildAbilityDisplay(scenario, ab))
        $('.in-progress-abilities').html([...abilities, ab.name.toLowerCase()].join(', '))
    })
}

function getRaceAndClassAbilities(type, character, scenario) {
    const abilities = []
    if (type === 'given') {
        abilities.push(...(scenario.races[character.race]?.abilities?.given || []))
        abilities.push(...(scenario.classes[character.class]?.abilities?.given || []))
    } else {
        abilities.push(...(scenario.races[character.race]?.abilities?.options || []))
        abilities.push(...(scenario.classes[character.class]?.abilities?.options || []))
    }
    return abilities
}

function setAvailableAbilities(character, scenario) {
    const abilities = getRaceAndClassAbilities('given', character, scenario)
    if (abilities.length) {
        $('.character-abilities .race-class-abilities .ability-list').html(abilities.join(', '))
    } else {
        $('.character-abilities .race-class-abilities').hide()
    }

    const available = scenario.abilities.filter((ab) => {
        let match = true
        if (scenario.races[character.race]?.abilities?.given?.includes(ab.name.toLowerCase()) ||
            scenario.classes[character.class]?.abilities?.given?.includes(ab.name.toLowerCase())) {
            return false
        }
        ab.requirements.forEach((r) => {
            if (character.core[r.ability.toLowerCase()] < r.value) {
                match = false
            }
        })
        return match
    })

    const selector = $('.character-abilities select.availableAbilities')
    selector.html('<option value=\'\'>Select an ability</option>')
    if (!available.length) {
        selector[0].setAttribute('disabled', 'disabled')
    } else {
        selector[0].removeAttribute('disabled')
    }
    available.forEach((ab) => {
        selector.append(`<option value='${ab.name.toLowerCase()}'>${ab.name} (${ab.type})</option>`)
    })
}

function setupItems(character, scenario) {
    const section = $('.character-items')
    const selector = section.find('select')
    const description = section.find('.description')

    setAvailableItems(character, scenario)

    selector.on('change', () => {
        if (!selector[0].value) { return description.html(' ') }

        const item = scenario.itemsByName[selector[0].value]
        const raceClassItems = getRaceAndClassItems('given', character, scenario)
        description.html(buildItemDisplay(item))
        $('.in-progress-items').html([...raceClassItems, item.name.toLowerCase()].join(', '))
    })
}

function getRaceAndClassItems(type, character, scenario) {
    const items = []
    if (type === 'given') {
        items.push(...(scenario.races[character.race]?.items?.given || []))
        items.push(...(scenario.classes[character.class]?.items?.given || []))
    } else {
        items.push(...(scenario.races[character.race]?.items?.options || []))
        items.push(...(scenario.classes[character.class]?.items?.options || []))
    }
    return items
}

function setAvailableItems(character, scenario) {
    const section = $('.character-items')
    const items = getRaceAndClassItems('given', character, scenario)
    if (items.length) {
        section.find('.race-class-items .item-list').html(items.join(', '))
    } else {
        section.find('.race-class-items').hide()
    }

    const selector = section.find('select')

    const optionalItems = getRaceAndClassItems('options', character, scenario)
    if (optionalItems.length) {
        section.find('.optional-items').show()
        selector.html('<option value=\'\'>Select an item</option>')
        optionalItems.forEach((item) => {
            selector.append(`<option value='${scenario.itemsByName[item].name.toLowerCase()}'>${scenario.itemsByName[item].name}</option>`)
        })
    } else {
        section.find('.optional-items').hide()
    }
}

function setupQuirks(character, scenario) {
    const section = $('.character-quirk')
    const selector = section.find('select')

    scenario.quirks.forEach((q, i) => {
        selector.append(`<option value='${i}'>${q.title}</option>`)
    })

    selector.on('change', () => {
        const quirk = scenario.quirks[selector[0].value]
        if (quirk) {
            $('[name=quirk-frequency]').forEach((f) => f.removeAttribute('checked'))
            Object.keys(quirk).forEach((field) => {
                if (field === 'frequency') {
                    const input = $(`#quirk-frequency-${quirk[field]}`)[0]
                    if (input) { input.setAttribute('checked', 'checked') }
                } else {
                    const input = $(`#quirk-${field}`)[0]
                    if (input) { input.value = quirk[field] }
                }
            })
        }
    })
}

export default initCreateCharacter
