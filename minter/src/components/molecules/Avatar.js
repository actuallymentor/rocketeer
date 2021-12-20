import styled from 'styled-components'
import CircleImage from '../atoms/CircleImage'
import { Text } from '../atoms/Text'

const Wrapper = styled.div`
`

export default ( { title, ...props } ) => <Wrapper>
	<CircleImage { ...props } />
	{ title && <Text align="center">{ title }</Text> }
</Wrapper>