import styled from 'styled-components'

export default styled.img`
	border-radius: 50%;
	height: 150px;
	width: 150px;
	margin: 1rem;
	cursor: ${ ( { onClick } ) => onClick ? 'pointer' : 'none' };
	border: ${ ( { highlight } ) => highlight ? '5px solid orange' : 'none' };
	&:hover {
		box-shadow: ${ ( { onClick } ) => onClick ? '0 0 20px 2px rgb(0 0 0 / 20%)' : 'none' };
	}
`