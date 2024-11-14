
import $ from './jqes6.js'
import PagefindHighlight from '../rules__pagefind/pagefind-highlight.js'

function initRulesPage() {

    new PagefindUI({
        element: '.rules-search',
        pageSize: 3,
        showImages: false,
        excerptLength: 30,
        showEmptyFilters: false,
        resetStyles: true,
        highlightParam: 's',
        processResult: function (result) {
            result.url = `/rules${result.url}`
            return result
        }
    })
    new PagefindHighlight({ highlightParam: 's' })

    $('.pagefind-highlight')[0]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    })
}

export default initRulesPage
