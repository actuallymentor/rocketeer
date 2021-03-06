import ContainerBackground from '../assets/undraw_connected_world_wuay.svg'

export const Container = ( { children } ) => <main>

	<div className="container">

		{ children }

	</div>

	<img className="stretchBackground" src={ ContainerBackground } alt="Launching rocket" />

</main>

export const Loading = ( { children, message } ) => <Container>
	
	<div className="loading">
			
		<div className="lds-dual-ring"></div>
		{ message && <p>{ message }</p> }
		{ children }

	</div>

</Container>