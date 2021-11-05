import LaunchBackground from '../assets/undraw_launch_day_4e04.svg'

export const Container = ( { className, children, ...props } ) => <main { ...props }>

	<div className={ `container ${ className }` }>

		{ children }

	</div>

	<img className="stretchBackground" src={ LaunchBackground } alt="Launching rocket" />

</main>

export const Loading = ( { message } ) => <Container>
	<div className="loading">
			
		<div className="lds-dual-ring"></div>
		<p>{ message }</p>

	</div>
</Container>