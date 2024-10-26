
import $ from './jqes6.js'
import { buildAbilityDisplay, buildItemDisplay, getAbilitiesByName, getCharacter, getCoreAbilitiesTableHtml, getItemsByName, getScenario } from './shared.js'

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

    $('#page-character-sheet .core-abilities').html(getCoreAbilitiesTableHtml(''))

    updateCharacterDisplay(character, scenario)

    // TODO: make abilities and items expandable

    // TODO: make certain things editable

    // TODO: level up, adding abilities

    // TODO: chests (getting new items)
}


function updateCharacterDisplay(character, scenario) {
    const page = $('#page-character-sheet')
    Object.keys(character).forEach((attr) => {
        const elem = page.find(`.char-${attr}`)
        if (elem.length) { elem.html(character[attr]) }
    })

    page.find('.char-max-hp').html((character.core.lift * character.core.think) + 3)
    page.find('.char-movement').html(Math.floor(character.core.move / 4) + 1)
    page.find('.char-initiative').html(character.core.move + (character.core.lead * 2))

    Object.keys(character.core).forEach((attr) => {
        const elem = page.find(`.core-${attr}`)
        if (elem.length) { elem.html(character.core[attr]) }
    })
    
    Object.keys(character.quirk).forEach((attr) => {
        const elem = page.find(`.quirk-${attr}`)
        if (elem.length) { elem.html(character.quirk[attr]) }
    })

    const abilitiesByName = getAbilitiesByName(scenario)
    const abElem = page.find('.abilities')
    character.abilities.forEach((ability) => {
        const slug = ability.name.toLowerCase().replaceAll(' ', '-')
        abElem.append(`<aside id='ability-${slug}' class='ability'>${buildAbilityDisplay(abilitiesByName[ability.name], ability, character.items, character.core)}</aside>`)
    })

    const itemsByName = getItemsByName(scenario)
    const itemElem = page.find('.items')
    character.items.forEach((item) => {
        const slug = item.name.toLowerCase().replaceAll(' ', '-')
        itemElem.append(`<aside id='item-${slug}' class='item'>${buildItemDisplay(itemsByName[item.name], item)}</aside>`)
    })
    
    $('.character-metadata .last-save').html((new Date(character.last_save)).toLocaleString())
}

export default initCharacterSheet
