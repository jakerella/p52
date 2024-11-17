
import c from './constants.js'
import $ from './jqes6.js'
import { getCharacter, showMessage, generateHash, getAllScenarioMetadata } from './shared.js'

async function initLoadScenario() {
    const metadata = await getAllScenarioMetadata()
    console.log('Displaying scenario choices:', metadata)

    const chooser = $('select#scenario')
    metadata.forEach(s => {
        chooser.append(`<option value='${s.id}'>${s.name}</value>`)
    })
    chooser.on('change', (e) => {
        const scenario = metadata.filter(s=>s.id===e.target.value)[0]
        if (!scenario) {
            $('.description').html('')
        } else {
            $('.description').html(scenario.description)
        }
    })

    $('.load-scenario').on('click', () => {
        const id = chooser[0].value
        const scenario = metadata.filter((s) => s.id === id)[0]
        if (!scenario) {
            showMessage(`Sorry, but that's not a valid Scenario. Please select a valid scenario!`, 5, 'error')
        } else {
            let character = getCharacter()
            if (character && character.reality !== scenario.reality &&
                !confirm('Loading this scenario will remove your current character (they are not compatible).\n\nAre you sure you want to do this?')
                ) {
                return
            }
            if (character && character.reality !== scenario.reality) {
                console.debug('Removing previous character and character history')
                localStorage.removeItem(c.CHARACTER_KEY)
                localStorage.removeItem(c.CHARACTER_HISTORY_KEY)
            }

            console.debug(`Loading scenario ${id}`, scenario)
            localStorage.setItem(c.SCENARIO_KEY, JSON.stringify({ id, file: scenario.file }))
            chooser.attr('disabled', 'disabled')

            const nextAction = 'Head over to the <a href="/create-character">Create Character</a> page to start building out your character.'
            character = getCharacter()
            if (character) {
                nextAction = 'It looks like you already have a character suitable for this scenario. You can <a href="/quest">Start a Quest</a> now!'
            }
            showMessage(`Your scenario is loaded! ${nextAction}`)
        }
    })
}

export default initLoadScenario
