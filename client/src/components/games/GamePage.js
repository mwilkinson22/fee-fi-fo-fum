import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGame } from "../../actions/gamesActions";
import LoadingPage from "../../components/LoadingPage";

class GamePage extends Component {
	componentWillMount() {
		this.props.fetchGame(this.props.match.params.slug);
	}

	render() {
		const { game } = this.props;
		if (!game) {
			return <LoadingPage />;
		} else {
			return <h1>{game._id}</h1>;
		}
	}
}

function mapStateToProps({ games }, ownProps) {
	const { slug } = ownProps.match.params;
	const { fullGames } = games;
	return { game: fullGames[slug] };
}

export default connect(
	mapStateToProps,
	{ fetchGame }
)(GamePage);
