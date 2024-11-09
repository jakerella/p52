
import $ from './jqes6.js'
import initCreateCharacter from './createCharacter.js'
import initCharacterSheet from './loadCharacterSheet.js'
import initLoadHome from './loadHome.js'
import initLoadScenario from './loadScenario.js'
import { indexOfItem, isDebug } from './shared.js'


function main(page) {
    console.info(`Loading page: ${page}`)
    if (PAGE_INIT[page]) { PAGE_INIT[page]() }
    if (/\/rules/.test(window.location.href)) { switchRuleLinks() }

    addSharedControls()
    if (isDebug()) { addDebugFunctions() }
}

const PAGE_INIT = {
    'home': initLoadHome,
    'load-scenario': initLoadScenario,
    'create-character': initCreateCharacter,
    'character-sheet': initCharacterSheet
}


function addSharedControls() {
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

    $('body').on('change', '.card-flip', (e) => {
        const val = Number(e.target.value) || 0
        if (val < 1 || val > 13) {
            $(e.target).attr('aria-invalid', 'true')
        } else {
            $(e.target).attr('aria-invalid', false)
        }
    })
}

function switchRuleLinks() {
    console.debug('Rewriting links for rules page')
    $('a').forEach((link) => {
        let href = link.getAttribute('href')
        if (!/^http/.test(href) && /\.md/.test(href)) {
            href = href.replace('.md', '.html')
            link.setAttribute('href', href)
        } else if (/^\.\.\/scenarios/.test(href)) {
            link.setAttribute('href', '/load-scenario')
        }
    })
}

function addDebugFunctions() {
    window.addItem = function addItem(name, count = 1, reload = true) {
        const c = JSON.parse(localStorage.getItem('character'))
        const itemIndex = indexOfItem(c, name)
        if (itemIndex > -1) {
            c.items[itemIndex].count += count
        } else {
            c.items.push({ name, equipped: false, count })
        }
        localStorage.setItem('character', JSON.stringify(c))
        if (reload) { window.location.reload() }
    }
}

export default main
