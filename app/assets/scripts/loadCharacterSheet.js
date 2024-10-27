
import $ from './jqes6.js'
import { buildAbilityDisplay, buildItemDisplay, getAbilitiesByName, getCharacter, getCoreAbilitiesTableHtml, getItemsByName, getScenario, saveCharacter, showMessage } from './shared.js'

const EQUIPPED_NOTE = '<aside class="ability-item-add-on">(equip? <span class="equip-flip"></span>)</aside>'
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

    updateCharacterDisplay(character, scenario)
    handleCoreEdits(character)
    handleHPChange(character)
    handleGearEquipping(character, scenario)


    // TODO: edit items (pick up (any), chests, consume, drop)
    // TODO: edit ability levels
    // TODO: add modal to "use" ability (with calculations)
    // TODO: level up (use experience)
    // TODO: adding abilities (remove?)
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


function updateCharacterDisplay(character, scenario) {
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
        const equipNote = itemsByName[item.name].equip ? EQUIPPED_NOTE : ''

        itemElem.append(`<details id='item-${slug}' data-item='${item.name}' class='item'>
    <summary><h3>${item.name} ${count} ${equipNote}</h3></summary>
    ${buildItemDisplay(itemsByName[item.name], item, character.core)}
</details>`)
        // @TODO: include requirements to use!!
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
    let debounce = null
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
    const itemsByName = getItemsByName(scenario)

    $('.equip-flip').on('click', (e) => {
        e.preventDefault()

        const elem =$(e.target)
        const itemName = (elem.parents('details.item').attr('data-item') || '').toLowerCase()
        character.items.forEach((item) => {
            if (item.name.toLowerCase() === itemName) {
                let canEquip = true
                if (!item.equipped) {
                    ;(itemsByName[itemName].requirements || []).forEach((req) => {
                        if (character.core[req.ability.toLowerCase()] < req.value) {
                            canEquip = false
                            showMessage(`Your ${req.ability} (${character.core[req.ability.toLowerCase()]}) is not high enough to equip this item!`, 6, 'warn')
                        }
                    })
                }
                if (canEquip) {
                    item.equipped = !item.equipped
                    elem.text(item.equipped ? '☑' : '☐')
                    doCharacterSave(character)
                }
            }
        })

        return false
    })
}


export default initCharacterSheet
