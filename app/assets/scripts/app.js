
import $ from './jqes6.js'
import initCreateCharacter from './createCharacter.js'
import initCharacterSheet from './loadCharacterSheet.js'
import initLoadHome from './loadHome.js'
import initLoadScenario from './loadScenario.js'


function main(page) {
    console.info(`Loading page: ${page}`)
    if (PAGE_INIT[page]) { PAGE_INIT[page]() }

    addSharedControls(page)
}

const PAGE_INIT = {
    'home': initLoadHome,
    'load-scenario': initLoadScenario,
    'create-character': initCreateCharacter,
    'character-sheet': initCharacterSheet
}


function addSharedControls(page) {
    $('.show-modal').on('click', (e) => {
        const selector = e.target.getAttribute('data-modal')
        if (selector) {
            $(`.${selector}`).attr('open', 'open')
        }
    })
    $('.close-modal').on('click', (e) => {
        const selector = e.target.getAttribute('data-modal')
        if (selector) {
            $(`.${selector}`).attr('open', '')
        }
    })
}

export default main
