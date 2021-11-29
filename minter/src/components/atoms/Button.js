import { Link } from 'react-router-dom'
import styled from 'styled-components'

const DynamicButton = ( { to='', onClick, ...props } ) => to && !to.includes( 'http' ) ? <Link { ...props } to={ to } /> : <button onClick={ onClick || ( () => window.open( to, '_blank' ).focus() ) } { ...props } />


const PrettyButton = styled( DynamicButton )`

	display: flex;
	flex-direction: ${ ( { direction='row' } ) => direction };
	align-items: center;
	justify-content: center;
	border: 1px solid ${ ( { theme } ) => theme.colors.text };
	color: ${ ( { theme } ) => theme.colors.text };
	text-decoration: none;
	font-size: 1.5rem;
	padding: .5rem 1.1rem .5rem 1rem;
	margin:  1rem .5rem;

	&:hover {
		box-shadow: 0 0 20px 2px rgb(0 0 0 / 20%);
	}

	& img {
		height: 50px;
		width: auto;
		margin: ${ ( { direction='row' } ) => direction == 'row' ? '0 1rem 0 0' : '1rem' };
	}
`

export default ( { icon, ...props } ) => !icon ? <PrettyButton { ...props } /> : <PrettyButton { ...props }>
	<img alt="Button icon" src={ icon } />
	{ props.children }
</PrettyButton>