
import $ from './jqes6.js'
import { getCharacter, getQuestTracker, getScenario, saveQuestTracker, onModalOpen, SUIT_TO_SYMBOL, calculateFormula } from './shared.js'

async function initSpacePage() {
    const scenario = await getScenario()
    const character = getCharacter()
    const tracker = getQuestTracker()

    // TODO: Add human players, order all characters by init
    // TODO: Track all spaces in quest historically
    // TODO: Add notes for current space

    if (!scenario || !character || !tracker || !tracker.active) {
        alert('You need to have an active quest to track!')
        window.location.replace('/')
        return
    }

    if (!tracker.spaces) { tracker.spaces = [{ enemies: [] }] }

    $('.quest-title').text(tracker.active.name)
    $('.add-space').on('click', () => { newSpace(tracker) })
    $('#avg-lv-space').on('change', () => {
        buildTrackedEnemyList(tracker, scenario)
    })

    buildEnemySelectionList(scenario)
    handleTrackEnemy(tracker, scenario)

    buildTrackedEnemyList(tracker, scenario)
    // TODO: handle enemy actions
}

function newSpace(tracker) {
    if (tracker.spaces.length && !confirm('Are you sure you want to destroy this space and start a new one? (All elements in this space will be lost.)')) {
        return
    }
    tracker.spaces = [{ enemies: [] }]
    saveQuestTracker(tracker)
}

function buildEnemySelectionList(scenario) {
    const enemyList = []

    $('select.enemies').append(enemyList.join(''))
}

function getEnemySlug(enemy) {
    return `${enemy.card.toLowerCase()}-${enemy.suit.toLowerCase()}`
}

function handleTrackEnemy(tracker, scenario) {
    const modal = $('.track-enemy-modal')
    const select = modal.find('.new-enemy')
    const detail = modal.find('.enemy-detail')

    
    const enemyOptions = ['<option value=\'\'>Choose an enemy...</option>']
    scenario.enemies.forEach((e) => {
        enemyOptions.push(`<option value='${getEnemySlug(e)}'>${e.name} (${e.card} ${SUIT_TO_SYMBOL[e.suit] || ''})</option>`)
    })
    select.html(enemyOptions.join(''))
    const enemyOptionElems = select.find('option')
    enemyOptionElems.attr('disabled', '')

    onModalOpen('.track-enemy-modal', () => {
        select[0].value = ''
        detail.html('')

        const trackedEnemyTypes = tracker.spaces[0].enemies.map((e) => { return e.type.toLowerCase() })
        enemyOptionElems.forEach((opt) => {
            if (trackedEnemyTypes.includes(opt.value)) {
                $(opt).attr('disabled', 'disabled')
            }
        })
    })

    select.on('change', () => {
        let content = ''
        if (select[0].value) {
            scenario.enemies.forEach((e) => {
                if (select[0].value === getEnemySlug(e)) {
                    content = e.description
                }
            })
        }
        detail.html(`<p>${content}</p>`)
    })

    modal.find('.track-enemy').on('click', (evt) => {
        const trackedEnemyTypes = tracker.spaces[0].enemies.map((e) => { return e.type.toLowerCase() })
        if (trackedEnemyTypes.includes(select[0].value)) {
            evt.preventDefault()
            evt.stopPropagation()
            return alert('It looks like you are already tracking that enemy.')
        }
        
        const enemy = getEnemyByType(select[0].value || '', scenario)
        if (!enemy) {
            return alert('Please select an available enemy!')
        }
        const avgLv = Number($('#avg-lv-space')[0].value)
        if (!avgLv) {
            return alert('Please enter your party\'s average level!')
        }
        if (trackEnemy(tracker, scenario, enemy, avgLv)) {
            modal.attr('open', false)
        } else {
            return alert('There was a problem tracking that enemy. Please refresh and try again!')
        }
    })
}

function buildTrackedEnemyList(tracker, scenario) {
    const enemiesElem = $('.enemies')
    enemiesElem.find('.enemy').forEach((n) => { n.parentNode.removeChild(n) })
    const avgLv = Number($('#avg-lv-space')[0].value)

    // TODO: sort by initiative

    tracker.spaces[0].enemies.forEach((enemy) => {
        enemiesElem.append(getEnemyElement(enemy, scenario, avgLv))
    })
}

function trackEnemy(tracker, scenario, enemy, avgLv) {
    const hp = calculateFormula(scenario, enemy.hp, null, null, null, null, { avgLv })
    const enemyTracker = { type: getEnemySlug(enemy), hp: hp.result || 0 }
    tracker.spaces[0].enemies.push(enemyTracker)
    $('.enemies').append(getEnemyElement(enemyTracker, scenario, avgLv))
    saveQuestTracker(tracker)
    return true
}

function getEnemyElement(enemyTracker, scenario, avgLv = 1) {
    const enemy = getEnemyByType(enemyTracker.type, scenario)
    const init = calculateFormula(scenario, ''+enemy.init, null, null, null, null, { avgLv })
    const move = calculateFormula(scenario, ''+enemy.move, null, null, null, null, { avgLv })
    const attacks = []
    const attackNames = []
    if (enemy.melee) {
        attackNames.push(enemy.melee.name)
        const target = calculateFormula(scenario, ''+enemy.melee.target, null, null, null, null, { avgLv })
        const damage = calculateFormula(scenario, ''+enemy.melee.damage, null, null, null, null, { avgLv })
        attacks.push(`${enemy.melee.name}: <span class='stat-target'>${target.reduced} Tgt</span> | <span class='stat-damage'>${damage.reduced} dmg</span>`)
    }
    if (enemy.ranged) {
        attackNames.push(enemy.ranged.name)
        const target = calculateFormula(scenario, ''+enemy.ranged.target, null, null, null, null, { avgLv })
        const damage = calculateFormula(scenario, ''+enemy.ranged.damage, null, null, null, null, { avgLv })
        attacks.push(`${enemy.ranged.name}: <span class='stat-target'>${target.reduced} Tgt</span> | <span class='stat-damage'>${damage.reduced} dmg</span>`)
    }

    const newElem = $(`<details id='enemy-${enemyTracker.type.toLowerCase()}' data-enemy='${enemyTracker.type}' class='enemy'>
    <summary>
        <h3>${enemy.name} (${enemyTracker.hp} HP, ${init.result || 0} init)</h3>
        <p class='short-stats'>
            Move: ${move.result || 0} | Attacks: ${attackNames.join(', ')}<br>
            Defense Mods: ${enemy.defense.melee} melee, ${enemy.defense.magic} magic, ${enemy.defense.range} range
        </p>
    </summary>
    <p class='attack-details'>${attacks.join('<br>')}</p>
    <p class='description'>${enemy.description}</p>
</details>`)

    // TODO: action buttons

    return newElem[0]
}

function getEnemyByType(type, scenario) {
    const [card, suit] = type.toLowerCase().split('-')
    return scenario.enemies.filter((e) => { return e.card.toLowerCase() === card && e.suit.toLowerCase() === suit })[0] || null
}

export default initSpacePage
