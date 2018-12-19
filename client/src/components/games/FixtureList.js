import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGames } from "../../actions/index";

class FixtureList extends Component {
	componentDidMount() {
		this.props.fetchGames();
	}

	populateFixtureList() {
		if (this.props.games === null) {
			return "Loading...";
		} else if (this.props.games.length === 0) {
			return "No fixtures found";
		} else {
			const fixtures = this.props.games.map(game => {
				return (
					<p key={game._id}>
						{game._opposition.name.short} {game.date}
					</p>
				);
			});
			console.log(fixtures);
			return <div children={fixtures} />;
		}
	}

	render() {
		return (
			<div>
				<h1>Fixtures</h1>
				{this.populateFixtureList()}
			</div>
		);
	}
}

function mapStateToProps({ games }) {
	return { games };
}

export default connect(
	mapStateToProps,
	{ fetchGames }
)(FixtureList);
