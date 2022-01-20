import styled from 'styled-components'
import Home from '../../assets/home-2-line.svg'
import { useNavigate } from 'react-router-dom'

// Image that behaves like a background image
const BackgroundImage = styled.img.attrs( props => ( {
	// src: LaunchBackground
} ) )`
	position: absolute;
	z-index: -1;
	right: 50%;
	transform: translateY( -50% );
	/*top: 50%;*/
	transform: translateX( 50% );
	width: 90%;
	opacity: .05;
`

const Wrapper = styled.div`
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: ${ ( { align='center' } ) => align };
	justify-content: ${ ( { justify='center' } ) => justify };
	min-height: 100vh;
	width: 100%;
	padding: ${ ( { gutter=true } ) => gutter ? '3rem max( 1rem, calc( 25vw - 4rem ) )' : 'none' };
	// margin-bottom: 10rem;
	box-sizing: border-box;
	& * {
		box-sizing: border-box;
	}

	& #home {
		position: fixed;
		top: 0;
		right: 0;
		padding: 1rem;
		width: 70px;
		height: 70px;
		opacity: .8;
	}
`

// Container that always has the background image
export default ( { children, ...props } ) => {

	const navigate = useNavigate()

	return <Wrapper { ...props }>
		<img id="home" onClick={ f => navigate( '/' ) } src={ Home } />
		<BackgroundImage key='background' />
		{ children }
	</Wrapper>

}