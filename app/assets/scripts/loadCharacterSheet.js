
import $ from './jqes6.js'
import {
    buildAbilityDisplay,
    buildItemDisplay,
    canUseItem,
    getAbilitiesByName,
    getCharacter,
    getCoreAbilitiesTableHtml,
    getItemEffects,
    getItemsByName,
    getScenario,
    saveCharacter,
    showMessage
} from './shared.js'

const EQUIPPED_NOTE = '<aside class="ability-item-add-on">(equip? <span class="equip-flip"></span>)</aside>'
const CONSUME_BUTTON = '<button class="use-item">use</button>'
const ABILITY_LEVEL_ADD_ON = '<aside class="ability-item-add-on">(Lv <span class="ability-level"></span>)</span></aside>'
const COUNT_NOTE = '<aside class="ability-item-add-on">(x<span class="item-count">1</span>)</aside>'

let SAVE_DEBOUNCE = null

async function initCharacterSheet() {
    const scenario = getScenario()
    if (!scenario) {
        window.location.replace('/')
        return
    }
    const character = getCharacter()
    if (!character) {
        window.location.replace('/create-character')
        return
    }
    console.log('Loading character:', character)

    $('.core-abilities').html(getCoreAbilitiesTableHtml(''))

    addCharacterDetails(character, scenario)
    handleCoreEdits(character)
    handleHPChange(character)
    handleGearEquipping(character, scenario)
    handleConsumeItem(character, scenario)

    if (!/debug/.test(window.location.search)) {
        window.addEventListener('beforeunload', async () => { await saveCharacter(character) })
    }

    // TODO: edit items (pick up (any), chests, drop)
    // TODO: edit ability levels
    // TODO: add modal to "use" ability (with calculations)
    // TODO: level up (use experience)
    // TODO: adding abilities (remove?)
    // TODO: revert character sheet to previous save
}


function doCharacterSave(character) {
    if (!character) { return }

    if (SAVE_DEBOUNCE) { clearTimeout(SAVE_DEBOUNCE) }
    SAVE_DEBOUNCE = setTimeout(async () => {
        try {
            if (SAVE_DEBOUNCE) { clearTimeout(SAVE_DEBOUNCE) }
            await saveCharacter(character)
        } catch(err) {
            console.warn('Unable to save character:', err)
            alert(err.message)
        }
    }, 3000)
}


function addCharacterDetails(character, scenario) {
    Object.keys(character).forEach((attr) => {
        const elem = $(`.char-${attr}`)
        if (elem.length) { elem.html(''+character[attr]) }
    })

    $('.char-max-hp').html((character.core.lift * character.core.think) + 3)    
    $('.char-initiative').html(character.core.move + (character.core.lead * 2))

    const itemsByName = getItemsByName(scenario)
    let movement = Math.floor(character.core.move / 4) + 1
    const weight = character.items.reduce((prev, curr) => {
        return curr.equipped ? prev + itemsByName[curr.name.toLowerCase()].weight : prev
    }, 0)
    // TODO: modify by items or abilities
    $('.char-movement').html(movement - Math.floor(weight / (character.core.lift * character.core.balance)))

    Object.keys(character.core).forEach((attr) => {
        const elem = $(`.core-${attr}`)
        if (elem.length) { elem.html(character.core[attr]) }
    })
    
    Object.keys(character.quirk).forEach((attr) => {
        const elem = $(`.quirk-${attr}`)
        if (elem.length) { elem.html(character.quirk[attr]) }
    })

    const abilitiesByName = getAbilitiesByName(scenario)
    const abElem = $('.abilities')
    character.abilities.forEach((ability) => {
        const slug = ability.name.toLowerCase().replaceAll(' ', '-')
        abElem.append(`<details id='ability-${slug}' class='ability'>
    <summary><h3>${ability.name} ${ABILITY_LEVEL_ADD_ON}</h3></summary>
    ${buildAbilityDisplay(abilitiesByName[ability.name], ability, character.items, character.core)}
</details>`)
        $(`#ability-${slug} .ability-level`).html(ability.level)
    })

    const itemElem = $('.items')
    character.items.forEach((item) => {
        const slug = item.name.toLowerCase().replaceAll(' ', '-')
        
        const count = (item.count > 1) ? COUNT_NOTE : ''
        const equipNote = (itemsByName[item.name].equip && canUseItem(item.name, character, scenario)) ? EQUIPPED_NOTE : ''
        const consume = (itemsByName[item.name].consumable) ? CONSUME_BUTTON : ''

        itemElem.append(`<details id='item-${slug}' data-item='${item.name}' class='item'>
    <summary><h3>${item.name} ${count} ${equipNote} ${consume}</h3></summary>
    ${buildItemDisplay(itemsByName[item.name], item, character.core)}
</details>`)
        $(`#item-${slug} .item-count`).html(item.count)
        $(`#item-${slug} .equip-flip`).html(item.equipped ? '☑' : '☐')
    })
    
    $('.character-metadata .last-save').html((new Date(character.last_save)).toLocaleString())
}


function handleCoreEdits(character) {
    $('.edit-core').on('click', () => {
        $('#update-experience')[0].value = character.experience
        for (let attr in character.core) {
            $(`.core-value-updates [name=core-${attr}]`)[0].value = character.core[attr]
        }
    })
    $('.edit-core-modal form').on('submit', async (e) => {
        e.preventDefault()
        const core = {}
        const exp = $('#update-experience')[0].value || 0
        for (let attr in character.core) {
            core[attr] = Number($(`.core-value-updates [name=core-${attr}]`)[0].value) || 1
        }
        character.core = core
        character.experience = exp
        try {
            await saveCharacter(character)
            window.location.reload()
        } catch(err) {
            alert(err.message)
        }
        return false
    })
}

function handleHPChange(character) {
    const hpElem = $('.char-hp')
    $('.action-heal').on('click', () => {
        hpElem.text(++character.hp)
        doCharacterSave(character)
    })
    $('.action-damage').on('click', () => {
        hpElem.text(--character.hp)
        doCharacterSave(character)
    })
}

function handleGearEquipping(character, scenario) {
    $('.equip-flip').on('click', (e) => {
        e.preventDefault()
        const elem =$(e.target)
        const itemName = (elem.parents('details.item').attr('data-item') || '').toLowerCase()
        character.items.forEach((item) => {
            if (item.name.toLowerCase() === itemName) {
                let canEquip = canUseItem(itemName, character, scenario, true)
                if (!item.equipped && canEquip) {
                    item.equipped = true
                    doCharacterSave(character)
                } else if (item.equipped) {
                    item.equipped = false
                    doCharacterSave(character)
                }
                elem.text(item.equipped ? '☑' : '☐')
            }
        })

        return false
    })
}

function handleConsumeItem(character, scenario) {
    $('.use-item').on('click', (e) => {
        e.preventDefault()
        const elem =$(e.target)
        const parent = elem.parents('details.item')
        const itemName = (parent.attr('data-item') || '').toLowerCase()
        character.items.forEach((item, i) => {
            if (item.name.toLowerCase() === itemName) {
                let canUse = canUseItem(itemName, character, scenario, true)
                if (item.count && canUse) {
                    showItemModal(itemName, character, scenario)
                } else if (!item.count) {
                    showMessage('Sorry, but you do not have any of that item left!', 5, 'info')
                    parent[0].parentNode.removeChild(parent[0])
                }
            }
        })
    })

    $('.consume-item').on('click', (e) => {
        e.preventDefault()

        const modal = $(e.target).parents('.use-item-modal')
        const itemName = modal.attr('data-item-name')
        const itemElem = $(`[data-item="${itemName}"]`)

        character.items.forEach((item, i) => {
            if (item.name.toLowerCase() === itemName) {
                let canUse = canUseItem(itemName, character, scenario, true)
                if (item.count && canUse) {
                    item.count--
                    if (item.count) {
                        itemElem.find('.item-count').text(item.count)
                    } else {
                        character.items.splice(i, 1)
                        itemElem[0]?.parentNode?.removeChild(itemElem[0])
                    }
                    doCharacterSave(character)
                }
            }
        })
    })
}

function showItemModal(itemName, character, scenario) {
    const modal = $('.use-item-modal')
    modal.attr('data-item-name', itemName.toLowerCase())
    const itemsByName = getItemsByName(scenario)
    modal.find('.item-name').text(itemsByName[itemName].name)
    modal.find('.item-description').text(itemsByName[itemName].description)
    const effects = modal.find('.item-effects').html(' ')
    getItemEffects(itemsByName[itemName], character.core).forEach((effect) => {
        effects.append(`<li>${effect}</li>`)
    })
    modal.attr('open', 'open')
}


export default initCharacterSheet
