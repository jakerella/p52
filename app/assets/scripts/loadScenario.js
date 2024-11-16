
import c from './constants.js'
import $ from './jqes6.js'
import { showMessage, parseQuery, generateHash, getAllScenarioMetadata } from './shared.js'

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

    const params = parseQuery()
    if (params.scenario) {
        const scenario = metadata.filter(s=>s.id===params.scenario)[0]
        if (!scenario) {
            showMessage(`Sorry, but that's not a valid Scenario. Did you intend to upload a custom scenario?`, 7, 'error')
        } else {
            console.log(`Loading scenario ${params.scenario}`)
            await setScenario(scenario.file)

            // TODO: check for character in that scenario?

            showMessage(`Loaded new scenario: ${scenario.name}! Head over to the '<a href='/create-character'>Create Character</a>' page to get started on your new adventure.`)
        }
    }
}

async function setScenario(file) {
    const scenario = await (await fetch(file)).json()
    const hash = generateHash(JSON.stringify(scenario))
    localStorage.setItem(c.SCENARIO_KEY, JSON.stringify(scenario))
    localStorage.setItem(c.SCENARIO_HASH_KEY, hash)
}

export default initLoadScenario
