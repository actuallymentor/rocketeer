import styled from 'styled-components'
import Section from '../atoms/Section'

export default styled( Section )`
	width: 100%;
	min-height: 500px;
	align-items: flex-start;
	border-bottom: 2px solid ${ ( { theme } ) => theme.colors.primary };
	margin-bottom: 5rem;
	& h1 {
		margin-bottom: .5rem;
		text-align: left;
	}
	& * {
		max-width: 700px;
	}
	& p {
		margin: 0 0 4rem;
	}
`