
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
        const avgLv = Number(modal.find('[name="avg-lv-enemy"]')[0].value)
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
    tracker.spaces[0].enemies.forEach((enemy) => {
        enemiesElem.append(getEnemyElement(enemy, scenario))
    })
}

function trackEnemy(tracker, scenario, enemy, avgLv) {
    const hp = calculateFormula(scenario, enemy.hp, null, null, null, null, { avgLv })
    const enemyTracker = { type: getEnemySlug(enemy), hp: hp.result || 0 }
    tracker.spaces[0].enemies.push(enemyTracker)
    $('.enemies').append(getEnemyElement(enemyTracker, scenario))
    saveQuestTracker(tracker)
    return true
}

function getEnemyElement(enemyTracker, scenario) {
    const enemy = getEnemyByType(enemyTracker.type, scenario)

    const newElem = $(`<details id='enemy-${enemyTracker.type.toLowerCase()}' data-enemy='${enemyTracker.type}' class='enemy'>
<summary><h3>${enemy.name} (${enemyTracker.hp} HP)</h3></summary>
<p class='description'>${enemy.description}</p>
</details>`)

    // TODO: add more info and action buttons

    return newElem[0]
}

function getEnemyByType(type, scenario) {
    const [card, suit] = type.toLowerCase().split('-')
    return scenario.enemies.filter((e) => { return e.card.toLowerCase() === card && e.suit.toLowerCase() === suit })[0] || null
}

export default initSpacePage
