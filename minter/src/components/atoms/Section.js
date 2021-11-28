import styled from 'styled-components'

export default styled.section`
	position: relative;
	padding: ${ ( { gutter=false } ) => gutter ? '5rem max( 1rem, calc( 25vw - 4rem ) )' : '5rem 0' };
	display: flex;
	flex-direction: ${ ( { direction } ) => direction || 'column' };
	width: ${ ( { width } ) => width || '100%' };
	max-width: 100%;
	flex-wrap: wrap;
	align-items: ${ ( { align } ) => align || 'center' };
	justify-content: ${ ( { justify } ) => justify || 'center' };
	box-shadow: ${ ( { shadow } ) => shadow ? '0 0 20px 2px rgb(0 0 0 / 20%)' : 'none' };
	background-image: ${ ( { background } ) => background ? `url(${ background })` : 'none' };
	background-size: cover;
	background-position: center;

	& * {
		z-index: 2;
	}

	&:after {
		content: '';
		z-index: 1;
		background: ${ ( { background } ) => background ? `rgba( 255, 255, 255, .5 )` : 'none' };
		position: absolute;
		top: 0;
		right: 0;
		width: 100%;
		height: 100%;
	}
`