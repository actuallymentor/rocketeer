import { Link } from 'react-router-dom'
import styled from 'styled-components'

const DynamicButton = ( { to, ...props } ) => to ? <link { ...props } to={ to } /> : <button { ...props } />


export default styled( DynamicButton )`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba( 0, 0, 0, .3 );
	color: rgba( 0, 0, 0, .8 );
	text-decoration: none;
	font-size: 1.5rem;
	padding: .5rem 1.1rem .5rem 1rem;
	margin-top:  1rem;
`