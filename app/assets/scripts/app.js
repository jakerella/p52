
import initCreateCharacter from './createCharacter.js'
import initCharacterSheet from './loadCharacterSheet.js'
import initLoadHome from './loadHome.js'
import initLoadScenario from './loadScenario.js'


function main(page) {
    console.info(`Loading page: ${page}`)
    if (PAGE_INIT[page]) { PAGE_INIT[page]() }
}

const PAGE_INIT = {
    'home': initLoadHome,
    'load-scenario': initLoadScenario,
    'create-character': initCreateCharacter,
    'character-sheet': initCharacterSheet
}


export default main
