export const getQuery = variable => {

       let query = window.location.search.substring(1)
       let vars = query.split("&").map( pair => pair.split("=") )
       const match = vars.find( pair => pair[0] == variable )
       return match ? match[1] : undefined
}

export const getQueries = queries => {
	const matches = {}

	for( let query of queries ) {
		matches[query] = getQuery( query )
	}

	return matches
}

export const setQuery = query => {
	const { protocol, host, pathname } = window.location
	window.history.pushState( { dummy: 'data'}, "", `${protocol}//${host}${pathname}${ query ? `?${query}` : `` }`);
}