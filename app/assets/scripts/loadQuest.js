
import $ from './jqes6.js'
import { getCharacter, getQuestTracker, getScenario, onModalOpen, saveQuestTracker, showMessage } from './shared.js'


async function initQuestWalkthrough() {
    const scenario = await getScenario()
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
    }

    await showActiveQuest(tracker, scenario)

    // TODO: allow user to show enemy stats
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

async function showActiveQuest(tracker, scenario) {
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

    const steps = questText.split('<hr>')
        .filter((step) => { return !step.includes('<!-- OPTION ') })
        .map((step) => {
            let html = ''+step
            html = buildStartingItems(html, scenario)
            html = buildNextConfirmations(html)
            html = buildQuestChoices(html)
            return html
        })
    
    const questOptions = {}
    questText.split('<hr>')
        .filter((step) => { return step.includes('<!-- OPTION ') })
        .forEach((step) => {
            const optionText = step.match(/\<\!--\s+OPTION\s+"([^"]+)"\s+--\>/)
            if (!optionText) {
                return console.warn('Unable to determine option text!')
            }
            questOptions[optionText[1].toLowerCase()] = step
        })

    $('.quest-title').text(tracker.active.name)
    showStep(steps, tracker)

    const choiceModal = $('.quest-choice-modal')
    $('.current-step').on('click', '.quest-choice button', (e) => {
        const choice = $(e.target).attr('data-option')
        choiceModal.attr('open', 'open')
            .find('.choice-description').html(questOptions[choice])
    })
    $('.close-choice').on('click', () => {
        choiceModal.attr('open', false)
            .find('.choice-description').html('')
        tracker.currentStep++
        saveQuestTracker(tracker)
        showStep(steps, tracker)
    })

    $('.prev-step').on('click', () => {
        if (tracker.currentStep > 0) {
            tracker.currentStep--
            saveQuestTracker(tracker)
            showStep(steps, tracker)
        }
    })
    $('.next-step').on('click', () => {
        const confirm = $('.current-step .next-confirmation-modal')
        if (confirm.attr('data-has-handler') !== 'true') {
            confirm.find('.next-confirmation').on('click', () => {
                confirm.attr('open', '')
                if (tracker.currentStep < (steps.length - 1)) {
                    tracker.currentStep++
                    saveQuestTracker(tracker)
                    showStep(steps, tracker)
                }
            })
            confirm.attr('data-has-handler', 'true')
        }
        if (confirm.length) {
            confirm.attr('open', 'open')
            return
        }

        if (tracker.currentStep < (steps.length - 1)) {
            tracker.currentStep++
            saveQuestTracker(tracker)
            showStep(steps, tracker)
        }
    })
    $('.complete-quest').on('click', () => {
        if (tracker.currentStep >= (steps.length - 1)) {
            $('.quest-finish-modal').attr('open', 'open')
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

    $('.prev-step').removeClass('hide')
    if (tracker.currentStep < 1) {
        $('.prev-step').attr('disabled', 'disabled')
        $('.next-step').removeClass('hide')
        $('.complete-quest').addClass('hide')
    } else if (tracker.currentStep >= (steps.length - 1)) {
        $('.prev-step').attr('disabled', false)
        $('.next-step').addClass('hide')
        $('.complete-quest').removeClass('hide')
    } else {
        $('.prev-step').attr('disabled', false)
        $('.next-step').removeClass('hide')
        $('.complete-quest').addClass('hide')
    }

    if ($('.current-step .quest-choice').length) {
        // This step has a player choice, so don't let them proceed until chosen
        $('.next-step').addClass('hide')
        $('.complete-quest').addClass('hide')
    }
}

function buildStartingItems(stepHtml, scenario) {
    if (!stepHtml.includes('<!-- determineStartingItem -->')) {
        return stepHtml
    }

    const newHtml = stepHtml.replace(
        '<!-- determineStartingItem -->',
        '<aside class="center"><button class="show-modal" data-modal="starting-item-modal">Determine Item</button></aside>'
    )

    const flips = $('.starting-item-modal .card-flip')
    const flipValue = $('.starting-item-modal .flip-value')
    onModalOpen('.starting-item-modal', () => {
        flips.forEach((input) => { input.value = '' })
        flipValue[0].value = ''
    })

    flips.on('change', () => {
        let flip = 0
        flips.forEach((input) => { flip += Number(input.value) || 0 })
        flipValue.text(flip)
    })

    $('.reveal-starting-item').on('click', () => {
        let flip = 0
        flips.forEach((input) => { flip += Number(input.value) || 0 })
        if (flip < 2 || flip > 26) {
            return alert('Sorry, but that was not a valid value. Can you try again?')
        }
        const item = scenario.startingItems.filter((item) => {
            return flip >= item.sum[0] && flip <= item.sum[1]
        })[0]
        if (!item) {
            return alert('Sorry, no item was found. Can you try again?')
        }
        const count = (item.count > 1) ? ` (x${item.count})` : ''
        const options = (item.options.length) ? `\n\nYou may pick one of: ${item.options.join(', ')}` : ''
        alert(`You found a ${item.item}${count}!${options}\n\n${item.description}\n\nRemember to add the item(s) to your inventory!!`)
        $('.starting-item-modal').attr('open', false)
    })

    return newHtml
}

function buildNextConfirmations(stepHtml) {
    if (!stepHtml.includes('<!-- CONFIRM-NEXT ')) {
        return stepHtml
    }

    let newHtml = ''+stepHtml
    const confirmationMatch = stepHtml.match(/\<\!--\s+CONFIRM-NEXT\s+\"([^\"]+)\"\s+--\>/)
    if (confirmationMatch) {
        newHtml += `
<dialog class='next-confirmation-modal'>
    <article>
        <header><h3>Are you sure?</h2></header>
        ${confirmationMatch[1]}
        <footer>
            <input type='button' class='next-cancel secondary close-modal' data-modal='next-confirmation-modal' value='Cancel'>
            <input type='button' class='next-confirmation' value='Yes'>
        </footer>
    </article>
</dialog>`
    }

    return newHtml
}

function buildQuestChoices(stepHtml) {
    if (!stepHtml.includes('<!-- CHOICE ')) {
        return stepHtml
    }

    let newHtml = ''+stepHtml
    const optionMatch = stepHtml.match(/\<\!--\s+CHOICE\s+(\[[^\]]+\])\s+--\>/)
    if (optionMatch) {
        try {
            const options = JSON.parse(optionMatch[1])
            if (!Array.isArray(options)) {
                throw new Error('Quest options are not an array')
            }
            const optionHtml = ['<aside class="quest-choice">']
            optionHtml.push(...options.map((option, i) => { return `<button class='wide' data-option='${option.toLowerCase()}'>${option}</button>` }))
            optionHtml.push('</aside>')
            newHtml += optionHtml.join('')
            
        } catch(err) {
            console.warn('Unable to parse options for quest section:', err.message)
        }
    }

    return newHtml
}


export default initQuestWalkthrough
