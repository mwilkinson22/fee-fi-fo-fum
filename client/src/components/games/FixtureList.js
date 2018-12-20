import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchFixtures } from "../../actions/games";
import GameList from "./GameList";

class FixtureList extends GameList {
	fetchGameList() {
		this.props.fetchFixtures();
	}

	generatePageHeader() {
		return "Fixtures";
	}
}

function mapStateToProps({ games }) {
	return { games: games.fixtures || null };
}

export default connect(
	mapStateToProps,
	{ fetchFixtures }
)(FixtureList);
