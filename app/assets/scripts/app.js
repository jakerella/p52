
import $ from './jqes6.js'
import initCreateCharacter from './createCharacter.js'
import initCharacterSheet from './loadCharacterSheet.js'
import initLoadHome from './loadHome.js'
import initLoadScenario from './loadScenario.js'


function main(page) {
    console.info(`Loading page: ${page}`)
    if (PAGE_INIT[page]) { PAGE_INIT[page]() }
    if (/\/rules/.test(window.location.href)) { switchRuleLinks() }

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

function switchRuleLinks() {
    $('a').forEach((link) => {
        let href = link.getAttribute('href')
        if (!/^http/.test(href) && /\.md/.test(href)) {
            console.log(`switching link to html (${href})`)
            href = href.replace('.md', '.html')
            link.setAttribute('href', href)
        } else if (/^\.\.\/scenarios/.test(href)) {
            console.log(`switching link to scenarios in app (${href})`)
            link.setAttribute('href', '/load-scenario')
        } else {
            console.log(`leaving link as is: ${href}`)
        }
    })
}

export default main
