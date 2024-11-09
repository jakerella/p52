
import $ from './jqes6.js'
import {
    buildAbilityDisplay,
    buildItemDisplay,
    canUseItem,
    getAbilitiesByName,
    getCharacter,
    getCoreAbilitiesTableHtml,
    getItemEffects,
    getScenario,
    onModalOpen,
    saveCharacter,
    showMessage
} from './shared.js'


const ABILITY_LEVEL_ADD_ON = '<aside class="ability-item-add-on">(Lv <span class="ability-level"></span>)</span></aside>'
const COUNT_NOTE = '<aside class="ability-item-add-on">(x<span class="item-count">1</span>)</aside>'

let SAVE_DEBOUNCE = null

async function initCharacterSheet() {
    const scenario = getScenario()
    if (!scenario) {
        window.location.replace('/')
        return
    }
    const savedCharacter = getCharacter()
    if (!savedCharacter) {
        window.location.replace('/create-character')
        return
    }
    const character = new Proxy(savedCharacter, watchCharacter)
    console.log('Loading character:', character)

    if (character.reality.toLowerCase() !== scenario.reality.toLowerCase()) {
        console.warn(`Mismatched realities: ${character.reality} != ${scenario.reality}`)
        $('.whoami, .basic-stats, .quirk, .abilities, .items, .character-metadata').hide()
        return showMessage('Sorry, but this character appears to be from a different scenario. You may need to <a href="/load-scenario">(re)load the correct scenario</a>.', 0, 'error')
    }

    $('.core-abilities').html(getCoreAbilitiesTableHtml(''))

    addCharacterDetails(character, scenario)
    handleCoreEdits(character)
    handleHPChange(character)
    handleGearEquipping(character, scenario)
    handleConsumeItem(character, scenario)
    handleDropItem(character, scenario)
    handleAddItem(character, scenario)
    handleOpenChest(character, scenario)

    if (!/debug/.test(window.location.search)) {
        window.addEventListener('beforeunload', async () => { await saveCharacter(character) })
    }

    // TODO: edit ability levels
    // TODO: add modal to "use" ability (with calculations)
    // TODO: make use item work on yourself dynamically (versus manually)
    // TODO: level up (use experience, add abilities)
    // TODO: revert character sheet to previous save
}

const watchCharacter = {
    set(c, prop, value) {
        c[prop] = value
        if (prop === 'hp') {
            if (!Number.isInteger(value)) {
                throw new TypeError('Attempted to store non-integer HP value')
            }
            $('.char-hp').text(value)
            // TODO: check for dead character?
        }
        return true
    }
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

    let movement = Math.floor(character.core.move / 4) + 1
    const weight = character.items.reduce((prev, curr) => {
        return curr.equipped ? prev + scenario.itemsByName[curr.name.toLowerCase()].weight : prev
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
        itemElem.append(getItemElement(item, character, scenario))
    })
    
    $('.character-metadata .last-save').html((new Date(character.last_save)).toLocaleString())
}

function getItemElement(charItem, character, scenario) {
    const slug = charItem.name.toLowerCase().replaceAll(' ', '-')
    
    const EQUIPPED_NOTE = '<aside class="ability-item-add-on">(equip? <span class="equip-flip"></span>)</aside>'
    const CONSUME_BUTTON = '<button class="inline-button use-item">use</button>'
    const CANNOT_CONSUME_BUTTON = '<button disabled="disabled" class="inline-button use-item">use</button>'
    const DROP_BUTTON = '<button class="inline-button drop-item">drop</button>'

    const count = (charItem.count > 1) ? COUNT_NOTE : ''
    const equipNote = (scenario.itemsByName[charItem.name].equip && canUseItem(charItem.name, character, scenario)) ? EQUIPPED_NOTE : ''
    const consume = (scenario.itemsByName[charItem.name].consumable && canUseItem(charItem.name, character, scenario)) ? CONSUME_BUTTON : ((scenario.itemsByName[charItem.name].consumable) ? CANNOT_CONSUME_BUTTON : '')

    const newElem = $(`<details id='item-${slug}' data-item='${charItem.name}' class='item'>
<summary><h3>${charItem.name} ${count} ${equipNote} ${consume} ${DROP_BUTTON}</h3></summary>
${buildItemDisplay(scenario.itemsByName[charItem.name], charItem, character.core)}
</details>`)
    newElem.find(`.item-count`).text(charItem.count)
    newElem.find(`.equip-flip`).text(charItem.equipped ? '☑' : '☐')

    return newElem[0]
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
    $('.items').on('click', '.equip-flip', (e) => {
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
    $('.items').on('click', '.use-item', (e) => {
        e.preventDefault()
        const elem =$(e.target)
        const parent = elem.parents('details.item')
        const itemName = (parent.attr('data-item') || '').toLowerCase()
        character.items.forEach((item, i) => {
            if (item.name.toLowerCase() === itemName) {
                let canUse = canUseItem(itemName, character, scenario, true)
                if (item.count && canUse) {
                    showItemModal(itemName, character, scenario)
                } else if (item.count < 1) {
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
                if (item.count > 0 && canUse) {
                    item.count--
                    if (item.count > 0) {
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
    modal.find('.item-name').text(scenario.itemsByName[itemName].name)
    modal.find('.item-description').text(scenario.itemsByName[itemName].description)
    const effects = modal.find('.item-effects').html(' ')
    getItemEffects(scenario.itemsByName[itemName], character.core).forEach((effect) => {
        effects.append(`<li>${effect}</li>`)
    })
    modal.attr('open', 'open')
}

function handleDropItem(character, scenario) {
    $('.items').on('click', '.drop-item', (e) => {
        e.preventDefault()
        const parent = $(e.target).parents('details.item')
        const itemName = (parent.attr('data-item') || '').toLowerCase()
        character.items.forEach((item, i) => {
            if (item.name.toLowerCase() === itemName && 
                item.count > 0 &&
                confirm(`Are you sure you want to drop 1 ${itemName}?`)) {
                item.count--
                if (item.count > 0) {
                    parent.find('.item-count').text(item.count)
                } else {
                    character.items.splice(i, 1)
                    parent[0]?.parentNode?.removeChild(parent[0])
                }
                doCharacterSave(character)
            } else if (item.name.toLowerCase() === itemName && item.count < 1) {
                character.items.splice(i, 1)
                parent[0]?.parentNode?.removeChild(parent[0])
                doCharacterSave(character)
            }
        })
    })
}

function handleAddItem(character, scenario) {
    const select = $('.add-item-modal .item')
    const options = []
    scenario.items.forEach((item) => {
        options.push(`<option value='${item.name.toLowerCase()}'>${item.name}</option>`)
    })
    select.append(options.join(''))

    const detail = $('.add-item-modal .item-detail')
    select.on('change', () => {
        const itemName = select[0].value
        detail.html(buildItemDisplay(scenario.itemsByName[itemName], null, character.core))
    })
    
    $('.save-item').on('click', (e) => {
        e.preventDefault()

        const itemName = select[0].value.toLowerCase()
        const count = Number($('.add-item-modal .add-item-count')[0]?.value) || 1
        if (!itemName) {
            return alert('Please select an item to pick up!')
        }
        addItemToCharacter(character, scenario, itemName, count)
    })
}

function addItemToCharacter(character, scenario, itemName, count = 1) {
    let found = false
    for (let i in character.items) {
        if (character.items[i].name === itemName) {
            found = true
            character.items[i].count += count
            $(`[data-item="${itemName}"] .item-count`).text(character.items[i].count)
            doCharacterSave(character)
            break;
        }
    }
    if (!found) {
        const item = { name: itemName, equipped: false, count }
        character.items.push(item)
        $('.items').append(getItemElement(item, character, scenario))
        doCharacterSave(character)
    }
}

function handleOpenChest(character, scenario) {
    const modal = $('.open-chest-modal')
    const pickLock = modal.find('.pick-lock')
    const useKey = modal.find('.use-key')
    const itemFlips = modal.find('.determine-item .card-flip')
    const itemFlipValue = modal.find('.flip-value')

    modal.find('.think').text(character.core.think)

    onModalOpen('.open-chest-modal', () => {
        modal.find('details').show()
        $('.methods').removeClass('hide')
        modal.find('.attack-params').hide()
        $('.determine-item').hide()
        modal.find('input').forEach((n) => n.value = '')
        itemFlipValue.text('?')
        modal.find('.determine-item').attr('data-item-used', '')
        modal.find('.attack-result').text('?')

        let canPickLocks = false
        if (character.items.filter((it) => it.name.toLowerCase() === 'lock pick').length) {
            canPickLocks = true
        } else if (character.abilities.filter((ab) => ab.name.toLowerCase() === 'lock picking').length) {
            canPickLocks = true
        }
        if (canPickLocks) {
            modal.find('.lock-picking .msg-warn').hide()
            pickLock.attr('disabled', false)
        } else {
            modal.find('.lock-picking .msg-warn').show()
            pickLock.attr('disabled', 'disabled')
        }

        if (character.items.filter((it) => it.name.toLowerCase() === 'chest key').length) {
            modal.find('.using-keys .msg-warn').hide()
            useKey.attr('disabled', false)
        } else {
            modal.find('.using-keys .msg-warn').show()
            useKey.attr('disabled', 'disabled')
        }
    })

    // TODO: open by lock picking


    modal.find('.attack-chest').on('click', () => {
        modal.find('.methods').addClass('hide')
        modal.find('details:not(.attacking-chests)').hide()
        modal.find('.attack-params').show()
    })
    modal.find('.attack-params input').on('change', () => {
        const stamina = Number(modal.find('#chest-attack-stamina')[0].value) || 0
        const flip = Number(modal.find('#chest-attack-flip')[0].value) || 0
        const result = Math.floor(character.core.think / 3) + flip + stamina
        modal.find('.attack-result').text(result)
    })
    modal.find('.do-attack').on('click', () => {
        const stamina = Number(modal.find('#chest-attack-stamina')[0].value) || 0
        const flip = Number(modal.find('#chest-attack-flip')[0].value) || 0
        const result = Math.floor(character.core.think / 3) + flip + stamina

        
        if (flip === 1) {
            // Ace: chest explodes dealing `(2 x Lv)` damage.
            alert('You deal a voracious blow to the chest, so powerful that the chest explodes and sends wood and metal everywhere. You take (2 x Lv) damage!')
            character.hp -= (character.level * 2)
            doCharacterSave(character)
            return modal.attr('open', false)
        }
        if (result < 5) {
            alert('You aim for the chest and deal a mighty blow... that destroys the chest and everything in it.')
            return modal.attr('open', false)
        }
        
        // King reveals two items

        if (result > 9) {
            modal.find('.attack-params').hide()
            modal.find('.determine-item')
                .attr('data-item-used', false)
                .attr('data-item-count', false)
                .show()
            return
        }
        alert('Sorry, but you failed to open the chest. You can try again!')
        return modal.attr('open', false)
    })

    useKey.on('click', () => {
        let hasKey = false
        for (let i in character.items) {
            if (character.items[i].name.toLowerCase() === 'chest key') {
                hasKey = true
            }
        }
        if (!hasKey) {
            return alert('Sorry, but you do not have a chest key, please select another method.')
        }
        modal.find('.methods').addClass('hide')
        modal.find('details:not(.using-keys)').hide()
        modal.find('.determine-item')
            .attr('data-item-used', 'chest key')
            .attr('data-item-count', '1')
            .show()
    })

    itemFlips.on('change', () => {
        const total = itemFlips.reduce((prev, curr) => { return Number(prev) + Number(curr.value) }, 0)
        itemFlipValue.text(total)
    })

    modal.find('.do-open-chest').on('click', () => {
        const card1 = Number($('#chest-flip-1')[0].value)
        const card2 = Number($('#chest-flip-2')[0].value)
        if (card1 < 1 || card1 > 13 || card2 < 1 || card2 > 13) {
            return alert('Please flip two action cards and enter the values here.')
        }

        const suit1 = $('#chest-suit-1')[0].value
        const suit2 = $('#chest-suit-2')[0].value
        const suitResult = suit1 === suit2 ? suit1 : 'mixed'
        const item = scenario.chests.filter((item) => {
            return item.sum === (card1 + card2) && item.color === suitResult
        })[0]

        const itemUsed = (modal.find('.determine-item').attr('data-item-used') || '').trim().toLowerCase()
        if (itemUsed && scenario.itemsByName[itemUsed]) {
            const usedItemCount = Number(modal.find('.determine-item').attr('data-item-count')) || 1
            let itemIndex = null
            for (let i in character.items) {
                if (character.items[i].name.toLowerCase() === itemUsed) {
                    itemIndex = i
                }
            }
            if (itemIndex) {
                character.items[itemIndex].count -= usedItemCount
                if (character.items[itemIndex].count > 0) {
                    $(`[data-item="${itemUsed}"] .item-count`).text(character.items[itemIndex].count)
                } else {
                    character.items.splice(itemIndex, 1)
                    const elem = $(`[data-item="${itemUsed}"]`)[0]
                    elem?.parentNode.removeChild(elem)
                }
                doCharacterSave(character)
            }
        }
        
        modal.attr('open', false)
        const itemModal = $('.found-item-modal')
        itemModal.attr('open', 'open')
        itemModal.find('.item-name').text(item.item)
        itemModal.find('.item-count').text((item.count && item.count > 1) ? `(x${item.count})` : '')

        const name = item.item.toLowerCase()
        let description = item.description || ''
        if (scenario.itemsByName[name]) {
            itemModal.find('.auto-add').show()
            description = scenario.itemsByName[name].description
            addItemToCharacter(character, scenario, name, item.count || 1)
        } else {
            itemModal.find('.auto-add').hide()
        }
        itemModal.find('.description').text(description)
    })
}


export default initCharacterSheet
