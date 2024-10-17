
import initCreateCharacter from './createCharacter.js'
import initLoadScenario from './loadScenario.js'


function main(page) {
    console.info(`Loading page: ${page}`)
    if (PAGE_INIT[page]) { PAGE_INIT[page]() }
}

const PAGE_INIT = {
    'load-scenario': initLoadScenario,
    'create-character': initCreateCharacter
}

export default main
