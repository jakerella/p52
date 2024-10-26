
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

    // TODO: add modal to "use" ability

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
    page.find('.char-initiative').html(character.core.move + (character.core.lead * 2))

    const itemsByName = getItemsByName(scenario)
    let movement = Math.floor(character.core.move / 4) + 1
    const weight = character.items.reduce((prev, curr) => {
        return curr.equipped ? prev + itemsByName[curr.name.toLowerCase()].weight : prev
    }, 0)
    page.find('.char-movement').html(movement - Math.floor(weight / (character.core.lift * character.core.balance)))

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
        abElem.append(`<details id='ability-${slug}' class='ability'>
    <summary><h3>${ability.name} <span class='ability-level'>(Lv ${ability.level})</span></h3></summary>
    ${buildAbilityDisplay(abilitiesByName[ability.name], ability, character.items, character.core)}
</details>`)
    })

    const itemElem = page.find('.items')
    character.items.forEach((item) => {
        const slug = item.name.toLowerCase().replaceAll(' ', '-')
        const count = (item.count > 1) ? ` (x${item.count})` : ''
        const equip = item.equipped ? ' (equipped)' : (itemsByName.equip ? ' (not equipped)' : '')
        itemElem.append(`<details id='item-${slug}' class='item'>
    <summary><h3>${item.name}${count}${equip}</h3></summary>
    ${buildItemDisplay(itemsByName[item.name], item, character.core)}
</details>`)
    })
    
    $('.character-metadata .last-save').html((new Date(character.last_save)).toLocaleString())
}

export default initCharacterSheet
