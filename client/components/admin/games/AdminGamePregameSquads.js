import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../../LoadingPage";
import { fetchYearsWithSquads } from "../../../actions/teamsActions";
import { fetchSquad } from "../../../actions/teamsActions";
import Table from "../../Table";

class AdminGamePregameSquads extends Component {
	constructor(props) {
		super(props);
		const { game, squads } = props;

		this.state = { game };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, fetchYearsWithSquads, fetchSquad, squads } = nextProps;
		const home = game.teams.home._id;
		const away = game.teams.away._id;
		const year = new Date(game.date).getFullYear();

		const newState = { game, squads: {} };

		for (const ha of [home, away]) {
			if (!squads[ha]) {
				fetchYearsWithSquads(ha);
			} else if (!squads[ha][year]) {
				fetchSquad(year, ha);
			} else {
				newState.squads[ha] = squads[ha][year];
			}
		}

		return newState;
	}

	render() {
		const { game, squads } = this.state;

		if (Object.keys(squads).length < 2) {
			return <LoadingPage />;
		}

		return <span>Ready</span>;
	}
}

function mapStateToProps({ teams }, ownProps) {
	const { squads } = teams;
	return { squads, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchYearsWithSquads, fetchSquad }
)(AdminGamePregameSquads);
