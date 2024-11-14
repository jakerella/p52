
import $ from './jqes6.js'
import { getCharacter, getQuestTracker, getScenario, saveQuestTracker, showMessage } from './shared.js'


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
            currentStep: 0,
            completed: []
        }
        saveQuestTracker(tracker)
    }
    console.log('loading quest tracker data:', tracker)

    if (!tracker.active) {
        return chooseQuest(scenario, tracker)
    } else if (tracker.currentStep > 0) {
        showMessage('It looks like you were already in a quest, we\'ve resumed from where you were last.', 7)
    }

    await showActiveQuest(tracker)

    // TODO: figure out decision points, see if we can show user options and then result?
    // TODO: save scenario progress to file (and load from file)
}

function chooseQuest(scenario, tracker) {
    const modal = $('.choose-quest-modal')
    modal.attr('open', 'open')

    const questOptions = ['<option value="">Select a New Quest</option>']
    questOptions.push(...scenario.quests.map((q, i) => {
        let complete = tracker.completed.includes(q.name.toLowerCase())
        return `<option class='${complete ? 'disabled' : ''}' value='${q.name}'>${i+1}. ${q.name}${complete ? ' (completed)' : ''}</option>`
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
    let questText = null
    try {
        questText = await (await fetch(`/${tracker.active.filepath}`)).text()
        if (!questText) {
            throw new Error(`No quest text available for: ${tracker.active.name} (${tracker.active.filepath})`)
        }
    } catch(e) {
        showMessage('Sorry, but there was a problem reading the quest information.', 0, 'error')
        console.warn(e.message)
        return
    }

    $('.quest-title').text(tracker.active.name)
    const steps = questText.split('<hr>')
    $('.quest-bonuses').html(steps[steps.length-1])

    showStep(steps, tracker)

    $('.prev-step').on('click', () => {
        if (tracker.currentStep > 0) {
            tracker.currentStep--
            saveQuestTracker(tracker)
            showStep(steps, tracker)
            if (tracker.currentStep < 1) {
                $('.prev-step').attr('disabled', 'disabled')
                $('.next-step').removeClass('hide')
                $('.complete-quest').addClass('hide')
            }
        }
    })
    $('.next-step').on('click', () => {
        if (tracker.currentStep < (steps.length - 2)) {
            tracker.currentStep++
            saveQuestTracker(tracker)
            showStep(steps, tracker)
        }
    })
    $('.complete-quest').on('click', () => {
        if (tracker.currentStep >= (steps.length - 2)) {
            $('.quest-bonus-modal').attr('open', 'open')
        }
    })
    $('.close-quest').on('click', () => {
        if (!tracker.completed.includes(tracker.active.name.toLowerCase())) {
            tracker.completed.push(tracker.active.name.toLowerCase())
        }
        tracker.active = null
        tracker.currentStep = 0
        saveQuestTracker(tracker)
        alert('We\'ve saved your progress, good luck on the next quest!')
        window.location.reload()
    })
}

function showStep(steps, tracker) {
    $('.current-step').html(steps[tracker.currentStep])
    if (tracker.currentStep < 1) {
        $('.prev-step').attr('disabled', 'disabled')
        $('.next-step').removeClass('hide')
        $('.complete-quest').addClass('hide')
    } else if (tracker.currentStep >= (steps.length - 2)) {
        $('.prev-step').attr('disabled', false)
        $('.next-step').addClass('hide')
        $('.complete-quest').removeClass('hide')
    } else {
        $('.prev-step').attr('disabled', false)
        $('.next-step').removeClass('hide')
        $('.complete-quest').addClass('hide')
    }
}


export default initQuestWalkthrough
