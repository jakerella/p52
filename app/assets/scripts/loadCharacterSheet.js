
import c from './constants.js'
import $ from './jqes6.js'
import {
    buildAbilityDisplay,
    buildItemDisplay,
    calculateFormula,
    canUseItem,
    getAbilityTargetAndEffects,
    getCharacter,
    getCharacterHistory,
    getCoreAbilitiesTableHtml,
    getItemEffects,
    getScenario,
    indexOfItem,
    isDebug,
    onModalOpen,
    saveCharacter,
    showMessage
} from './shared.js'

let SAVE_DEBOUNCE = null
let DO_UNLOAD_SAVE = true

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
    handleAbilityLevelIncrease(character, scenario)
    handleAddAbility(character, scenario)
    handleUseAbility(character, scenario)
    handleGearEquipping(character, scenario)
    handleConsumeItem(character, scenario)
    handleDropItem(character, scenario)
    handleAddItem(character, scenario)
    handleOpenChest(character, scenario)
    handleRevertCharacter()
    handleDownloadCharacter(character)

    if (!isDebug()) {
        window.addEventListener('beforeunload', async () => { if (DO_UNLOAD_SAVE) { await saveCharacter(character) } })
    }

    // TODO: level up walk through (use experience, update core, add abilities / levels)
    // TODO: upload character data to reload
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

    const abElem = $('.abilities')
    character.abilities.forEach((ability) => {
        abElem.append(getAbilityElement(character, scenario, ability))
    })
    checkAbilityUseConditions(character, scenario)

    const itemElem = $('.items')
    character.items.forEach((item) => {
        itemElem.append(getItemElement(item, character, scenario))
    })
    
    const saved = (new Date(character.last_save)).toLocaleString().replace(/:[0-9]{2} /, ' ').toLowerCase()
    $('.character-metadata .last-save').html(saved)
}

function getAbilityElement(character, scenario, ability) {
    const ABILITY_LEVEL = `<aside class="ability-item-add-on">(Lv <span class="ability-level">${ability.level}</span>)</span></aside>`
    const ABILITY_LEVEL_BUMP = '<span class="increase-ability-level">▲</span>'
    const USE_BUTTON = '<button class="inline-button use-ability">use</button>'
    const slug = ability.name.toLowerCase().replaceAll(' ', '-')

    const elem = `<details id='ability-${slug}' data-ability='${ability.name.toLowerCase()}' class='ability'>
    <summary><h3>${scenario.abilitiesByName[ability.name].name} ${ABILITY_LEVEL} ${ABILITY_LEVEL_BUMP} ${USE_BUTTON}</h3></summary>
    ${buildAbilityDisplay(scenario.abilitiesByName[ability.name], ability, character.items, character.core)}
</details>`
    return elem
}

function checkAbilityUseConditions(character, scenario) {
    const equippedTypesAndNames = []
    character.items.forEach((item) => {
        if (item.equipped && scenario.itemsByName[item.name.toLowerCase()]) {
            equippedTypesAndNames.push(item.name.toLowerCase(), ...scenario.itemsByName[item.name.toLowerCase()].gearTypes)
        }
    })

    character.abilities.forEach((ab) => {
        const ability = scenario.abilitiesByName[ab.name.toLowerCase()]
        if (!ability) {
            return console.warn('Found unknown ability in character sheet:', ab.name)
        }

        const allRequired = (ability.gearRequired?.all || [])
        let hasAll = true
        for (let i in allRequired) {
            if (!equippedTypesAndNames.includes(allRequired[i])) {
                hasAll = false
                break
            }
        }
        const oneRequired = (ability.gearRequired?.one || [])
        let hasOne = oneRequired.length ? false : true
        for (let i in oneRequired) {
            if (equippedTypesAndNames.includes(oneRequired[i])) {
                hasOne = true
                break
            }
        }

        $(`.abilities [data-ability="${ab.name.toLowerCase()}"] .use-ability`).attr('disabled', (hasAll && hasOne) ? false : 'disabled')
    })
}

function getItemElement(charItem, character, scenario) {
    const slug = charItem.name.toLowerCase().replaceAll(' ', '-')
    
    const COUNT_NOTE = `<aside class="ability-item-add-on item-count-container">${getItemCountDisplay(charItem)}</aside>`
    const EQUIPPED_NOTE = '<aside class="ability-item-add-on">(equip? <span class="equip-flip"></span>)</aside>'
    const CONSUME_BUTTON = '<button class="inline-button use-item">use</button>'
    const CANNOT_CONSUME_BUTTON = '<button disabled="disabled" class="inline-button use-item">use</button>'
    const DROP_BUTTON = '<button class="inline-button drop-item">drop</button>'

    const equipNote = (scenario.itemsByName[charItem.name].equip && canUseItem(charItem.name, character, scenario)) ? EQUIPPED_NOTE : ''
    const consume = (scenario.itemsByName[charItem.name].consumable && canUseItem(charItem.name, character, scenario)) ? CONSUME_BUTTON : ((scenario.itemsByName[charItem.name].consumable) ? CANNOT_CONSUME_BUTTON : '')

    const newElem = $(`<details id='item-${slug}' data-item='${charItem.name}' class='item'>
<summary><h3>${scenario.itemsByName[charItem.name].name} ${COUNT_NOTE} ${equipNote} ${consume} ${DROP_BUTTON}</h3></summary>
${buildItemDisplay(scenario.itemsByName[charItem.name], charItem, character.core)}
</details>`)
    newElem.find(`.item-count`).text(charItem.count)
    newElem.find(`.equip-flip`).text(charItem.equipped ? '☑' : '☐')

    return newElem[0]
}

function getItemCountDisplay(charItem) {
    return (charItem.count > 1) ? `(x<span class="item-count">${charItem.count}</span>)` : ''
}

function handleCoreEdits(character) {
    onModalOpen('.edit-core-modal', () => {
        $('#update-experience')[0].value = character.experience
        $('#update-level')[0].value = character.level
        $('#update-hp')[0].value = character.hp
        for (let attr in character.core) {
            $(`.core-value-updates [name=core-${attr}]`)[0].value = character.core[attr]
        }
    })
    $('.edit-core-modal form').on('submit', async (e) => {
        e.preventDefault()
        const core = {}
        const exp = Number($('#update-experience')[0].value) || 0
        const level = Number($('#update-level')[0].value) || 1
        const hp = Number($('#update-hp')[0].value) || 0
        for (let attr in character.core) {
            core[attr] = Number($(`.core-value-updates [name=core-${attr}]`)[0].value) || 1
        }
        character.core = core
        character.experience = exp
        character.level = level
        character.hp = hp
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

function handleAbilityLevelIncrease(character, scenario) {
    $('.abilities').on('click', '.increase-ability-level', (e) => {
        e.preventDefault()
        const elem =$(e.target)
        const abilityName = (elem.parents('details.ability').attr('data-ability') || '').toLowerCase()
        
        if (confirm(`Are you sure you want to increase your level in ${abilityName}?`)) {
            character.abilities.forEach((ab) => {
                if (ab.name === abilityName) {
                    ab.level++
                    const abilityElem = $(`[data-ability="${abilityName}"]`)
                    abilityElem.find('.ability-level').text(ab.level)
                    const details = abilityElem.find('.ability-details')
                    details[0]?.parentNode.removeChild(details[0])
                    abilityElem.append(buildAbilityDisplay(scenario.abilitiesByName[ab.name], ab, character.items, character.core))
                    doCharacterSave(character)
                }
            })
        }
    })
}

function handleAddAbility(character, scenario) {
    const modal = $('.add-ability-modal')
    const select = modal.find('.new-ability')
    const detail = modal.find('.ability-detail')

    let availableAbilities = []
    onModalOpen('.add-ability-modal', () => {
        detail.html(' ')

        availableAbilities = scenario.abilities.filter((ab) => {
            let match = true
            ab.requirements.forEach((req) => {
                if (character.core[req.ability.toLowerCase()] < req.value) {
                    match = false
                }
            })
            const alreadyTrained = !!character.abilities.filter((charAb) => charAb.name.toLowerCase() === ab.name.toLowerCase()).length
            return match && !alreadyTrained
        })
        
        select.html('<option value="">Choose an ability...</option>')
        if (!availableAbilities.length) {
            select.attr('disabled', 'disabled')
        } else {
            select.attr('disabled', false)
        }
        availableAbilities.forEach((ab) => {
            select.append(`<option value='${ab.name.toLowerCase()}'>${ab.name} (${ab.type})</option>`)
        })
    })

    select.on('change', () => {
        if (scenario.abilitiesByName[select[0].value]) {
            detail.html(buildAbilityDisplay(scenario.abilitiesByName[select[0].value], null, null, character.core))
        } else {
            detail.html(' ')
        }
    })

    modal.find('.save-ability').on('click', () => {
        if (!scenario.abilitiesByName[select[0].value]) {
            return alert('Please select an available ability!')
        }
        const ability = { name: select[0].value, level: 1, modifiers: [] }
        character.abilities.push(ability)
        modal.attr('open', false)
        $('.abilities').append(getAbilityElement(character, scenario, ability))
        doCharacterSave(character)
    })
}

function handleUseAbility(character, scenario) {
    const modal = $('.use-ability-modal')

    $('.abilities').on('click', '.use-ability', (e) => {
        e.preventDefault()
        const elem = $(e.target)
        const parent = elem.parents('details.ability')
        const abilityName = (parent.attr('data-ability') || '').toLowerCase()
        character.abilities.forEach((charAbility) => {
            if (charAbility.name.toLowerCase() === abilityName) {
                const ability = scenario.abilitiesByName[abilityName]
                modal.find('.ability-name').text(ability.name)
                modal.find('.ability-description').html(buildAbilityDisplay(ability, charAbility, character.items, character.core))
                modal.attr('open', 'open')
            }
        })
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
        checkAbilityUseConditions(character, scenario)

        return false
    })
}

function handleConsumeItem(character, scenario) {
    $('.items').on('click', '.use-item', (e) => {
        e.preventDefault()
        const elem = $(e.target)
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

function handleDropItem(character) {
    $('.items').on('click', '.drop-item', (e) => {
        e.preventDefault()
        const itemName = ($(e.target).parents('details.item').attr('data-item') || '').toLowerCase()

        if (confirm(`Are you sure you want to drop 1 ${itemName}?`)) {
            removeItemFromCharacter(character, itemName, 1)
        }
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
    const itemIndex = indexOfItem(character, itemName)
    if (itemIndex > -1) {
        character.items[itemIndex].count += count
        $(`[data-item="${itemName}"] .item-count-container`).html(getItemCountDisplay(character.items[itemIndex]))
        doCharacterSave(character)
    } else {
        const item = { name: itemName, equipped: false, count }
        character.items.push(item)
        $('.items').append(getItemElement(item, character, scenario))
        doCharacterSave(character)
    }
}

function removeItemFromCharacter(character, itemName, count = 1) {
    const itemIndex = indexOfItem(character, itemName)
    if (itemIndex > -1) {
        character.items[itemIndex].count -= count
        if (character.items[itemIndex].count > 0) {
            $(`[data-item="${itemName}"] .item-count-container`).html(getItemCountDisplay(character.items[itemIndex]))
        } else {
            character.items.splice(itemIndex, 1)
            const elem = $(`[data-item="${itemName}"]`)
            elem[0]?.parentNode?.removeChild(elem[0])
        }
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
        modal.find('.lock-pick-attempt').hide()
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

    modal.find('.pick-lock').on('click', () => {
        modal.find('.methods').addClass('hide')
        modal.find('details:not(.lock-picking)').hide()
        modal.find('.lock-pick-attempt').show()
        
        let charAbility = character.abilities.filter((ab) => ab.name.toLowerCase() === 'lock picking')[0]

        // if you don't have the ability, must use a lock pick
        modal.find('#lock-picks-used')[0].value = charAbility ? '0' : '1'
        if (!charAbility) {
            $('.lock-pick-note').show()
            charAbility = { name: 'lock picking', level: 1, modifiers: [] }
        } else {
            $('.lock-pick-note').hide()
        }

        const target = getAbilityTargetAndEffects(scenario.abilitiesByName['lock picking'], charAbility, character.items).target
        modal.find('.lock-pick-target').html(target)

        const method = (indexOfItem(character, 'lock pick') < 0) ? 'addClass' : 'removeClass'
        modal.find('.lock-picks')[method]('hide')
    })
    modal.find('#lock-picks-used').on('change', (e) => {
        let picksUsed = Math.max(0, Number(e.target.value) || 0)
        const index = indexOfItem(character, 'lock pick')
        if (character.items[index].count < picksUsed) {
            e.target.value = character.items[index].count
            picksUsed = character.items[index].count
        }
        if (picksUsed > 3) {
            alert('You may only use a maximum of 3 lock picks on any attempt')
            e.target.value = 3
            picksUsed = 3
        }
        
        const target = getAbilityTargetAndEffects(scenario.abilitiesByName['lock picking'], getLockPickStats(character, picksUsed), character.items).target
        modal.find('.lock-pick-target').html(target)
    })
    modal.find('.do-pick-lock').on('click', () => {
        const stamina = Number(modal.find('#lock-pick-stamina')[0].value) || 0
        const flip = Number(modal.find('#lock-pick-flip')[0].value) || 0
        const picksUsed = Math.max(0, Number(modal.find('#lock-picks-used')[0].value) || 0)
        const result = flip + stamina + picksUsed

        if (flip === 0 || flip > 13) {
            return alert('Please flip 1 action card to determine the outcome!')
        }

        const charAbility = getLockPickStats(character, picksUsed)
        const params = { aLv: charAbility.level }
        const modifiers = charAbility.modifiers.map((mod) => (mod.attribute === 'target') ? mod.value : 0)

        const formula = calculateFormula(scenario.abilitiesByName['lock picking'].target, character.core, 'lock picking', 'target', character.items, params, modifiers)
        if (!formula.result) {
            return alert(`You'll need to evaluate this one yourself. Follow the rules and see if you succeeded, then determine your item (if sucessful) and add the item to your inventory!\n\nYour target is: ${formula.reduced}`)
        }
        
        if (flip === 1) {
            alert('You tinker with the lock, twisting and jamming things into it, until you finally hear a grinding metal sound. Looks like you broke the lock\'s inner workings! **You may NOT attempt to pick this lock again, OR use a chest key on it.**')
            if (picksUsed) {
                removeItemFromCharacter(character, 'lock pick', picksUsed)
            }
            return modal.attr('open', false)
        }
        if (result < formula.result) {
            alert('You tinker with the lock for a while, but give up after a while. You can always try again.')
            if (picksUsed) {
                removeItemFromCharacter(character, 'lock pick', picksUsed)
            }
            return modal.attr('open', false)
        }
        
        if (flip === 13) {
            alert('Well done! Your skill is impecible. Not only did you open the lock, but you were able to reveal a hidden slot with a chest key in it! You can save that one for later (it has been added to your inventory).')
            addItemToCharacter(character, scenario, 'chest key')
        }

        modal.find('.lock-pick-attempt').hide()
        // we've already used the lock pick, and they are only consumed on failure
        modal.find('.determine-item')
            .attr('data-item-used', false)
            .attr('data-item-count', false)
            .show()
    })

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
            alert('You deal a voracious blow to the chest, so powerful that the chest explodes and sends wood and metal everywhere. You take (2 x Lv) damage!')
            character.hp -= (character.level * 2)
            doCharacterSave(character)
            return modal.attr('open', false)
        }
        if (result < 5) {
            alert('You aim for the chest and deal a mighty blow... that destroys the chest and everything in it.')
            return modal.attr('open', false)
        }
        
        if (flip === 13) {
            alert('Well done! By hitting the chest at just the right angle you were able to also reveal a hidden slot with a chest key in it! You can save that one for later (it has been added to your inventory).')
            addItemToCharacter(character, scenario, 'chest key')
        }

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
        if (indexOfItem(character, 'chest key') < 0) {
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
        const usedItemCount = Number(modal.find('.determine-item').attr('data-item-count')) || 1
        if (itemUsed && scenario.itemsByName[itemUsed]) {
            removeItemFromCharacter(character, itemUsed, usedItemCount)
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

function getLockPickStats(character, picksUsed = 0) {
    let charAbility = character.abilities.filter((ab) => ab.name.toLowerCase() === 'lock picking')[0] || null
    if (!charAbility && picksUsed) {
        charAbility = { name: 'lock picking', level: picksUsed, modifiers: [] }
    } else if (charAbility && picksUsed) {
        charAbility = {
            name: 'lock picking',
            level: charAbility.level,
            modifiers: [...charAbility.modifiers, { attribute: 'target', amount: (picksUsed * -1) }]
        }
    }
    return charAbility
}

function handleRevertCharacter() {
    $('.revert-character').on('click', () => {
        const history = getCharacterHistory()
        if (history?.length && confirm('Are you sure you want to undo your most recent change?')) {
            const previousSave = history.pop()
            localStorage.setItem(c.CHARACTER_KEY, JSON.stringify(previousSave))
            localStorage.setItem(c.CHARACTER_HISTORY_KEY, JSON.stringify(history))
            DO_UNLOAD_SAVE = false
            window.location.reload()
        }
    })
}

function handleDownloadCharacter(character) {
    $('.do-download').on('click', (e) => {
        e.target.download = `p52-character-${character.name.toLowerCase().replace(' ', '-').replaceAll(/[^a-z0-9\-\.]/g, '')}.json`
        e.target.href = `data:text/json,${JSON.stringify(character)}`
        $('.download-character-modal').attr('open', false)
    })
}


export default initCharacterSheet
