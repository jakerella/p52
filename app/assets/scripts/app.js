
import c from './constants.js'
import $ from './jqes6.js'
import initCreateCharacter from './createCharacter.js'
import initCharacterSheet from './loadCharacterSheet.js'
import initLoadHome from './loadHome.js'
import initLoadScenario from './loadScenario.js'
import initQuestWalkthrough from './loadQuest.js'
import initRulesPage from './loadRules.js'
import initSpacePage from './loadSpaceDetails.js'
import { indexOfItem, isDebug } from './shared.js'

const PAGE_INIT = {
    'home': initLoadHome,
    'load-scenario': initLoadScenario,
    'create-character': initCreateCharacter,
    'character-sheet': initCharacterSheet,
    'quest': initQuestWalkthrough,
    'rules': initRulesPage,
    'space': initSpacePage
}

async function main(page) {
    console.info(`Loading page: ${page}`)
    if (PAGE_INIT[page]) { PAGE_INIT[page]() }
    if (/\/rules/.test(window.location.href)) { switchRuleLinks() }

    addSharedControls()
    if (isDebug()) { addDebugFunctions() }
}

function addSharedControls() {
    $('body').on('click', '.show-modal', (e) => {
        const selector = e.target.getAttribute('data-modal')
        if (selector) {
            $(`.${selector}`).attr('open', 'open')
            e.preventDefault()
        }
    })
    $('body').on('click', '.close-modal', (e) => {
        const selector = e.target.getAttribute('data-modal')
        if (selector) {
            $(`.${selector}`).attr('open', '')
            e.preventDefault()
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
    window.addAbility = function addAbility(name, level = 1, reload = true) {
        const c = JSON.parse(localStorage.getItem('character'))
        c.abilities.push({ name, level, modifiers: [] })
        localStorage.setItem('character', JSON.stringify(c))
        if (reload) { window.location.reload() }
    }
    window.removeAbility = function addAbility(name, reload = true) {
        const c = JSON.parse(localStorage.getItem('character'))
        let abi = null
        for (let i in c.abilities) {
            if (c.abilities[i].name === name) {
                abi = i
            }
        }
        if (abi !== null) {
            c.abilities.splice(abi, 1)
            localStorage.setItem('character', JSON.stringify(c))
            if (reload) { window.location.reload() }
        }
    }
}

export default main
