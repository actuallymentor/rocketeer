import LaunchBackground from '../assets/undraw_launch_day_4e04.svg'

export const Container = ( { children } ) => <main>

	<div className="container">

		{ children }

	</div>

	<img className="stretchBackground" src={ LaunchBackground } alt="Launching rocket" />

</main>