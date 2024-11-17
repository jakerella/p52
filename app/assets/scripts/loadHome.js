import { getCharacter, getScenario } from './shared.js'
import $ from './jqes6.js'


async function initLoadHome() {
    const scenario = await getScenario()
    const character = getCharacter()
    if (scenario && !character) {
        $('#page-home .no-character').show()
    } else if (scenario && character) {
        $('#page-home .scenario-and-character').show()
    }
}

export default initLoadHome
