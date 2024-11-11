
import $ from './jqes6.js'
import { getCharacter, getQuestTracker, getScenario, saveQuestTracker } from './shared.js'


async function initQuestWalkthrough() {
    const scenario = getScenario()
    const character = getCharacter()    
    if (!scenario || !character) {
        alert('Please load a scenario and create a character before starting a quest!')
        window.location.replace('/')
        return
    }
    let tracker = getQuestTracker()
    if (!tracker) {
        tracker = {
            scenario: scenario.id,
            character: character.id,
            active: null,
            completed: []
        }
        saveQuestTracker(tracker)
    }
    console.log('loading quest tracker data:', tracker)

    if (!tracker.active) {
        return chooseQuest(scenario, tracker)
    }

    await showActiveQuest(tracker)

    // TODO: save scenario progress to file (and load from file)
}

function chooseQuest(scenario, tracker) {
    const modal = $('.choose-quest-modal')
    modal.attr('open', 'open')

    const questOptions = ['<option value="">Select a New Quest</option>']
    questOptions.push(...scenario.quests.map((q) => {
        let complete = tracker.completed.includes(q.name.toLowerCase())
        return `<option class='${complete ? 'disabled' : ''}' value='${q.name}'>${q.name}${complete ? ' (completed)' : ''}</option>`
    }))
    modal.find('.quest-selector').html(questOptions.join(''))

    modal.find('.start-quest').on('click', (e) => {
        const name = modal.find('.quest-selector')[0].value
        if (!name) { return }

        if (tracker.completed.includes(name.toLowerCase()) &&
            !confirm('It looks like you already completed this quest, are you sure you want to start over?')) {
            return
        }
        tracker.active = scenario.quests.filter(q => q.name.toLowerCase() === name.toLowerCase())[0]
        saveQuestTracker(tracker)
        window.location.reload()
    })
}

async function showActiveQuest(tracker) {
    const questText = await (await fetch(`/${tracker.active.filepath}`)).text()
    $('.active-quest').html(questText)

    // TODO: okay... now how do we chunk this up to walkthrough?
    
}


export default initQuestWalkthrough
