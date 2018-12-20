import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchResults } from "../../actions/games";
import GameList from "./GameList";

class ResultList extends GameList {
	fetchGameList() {
		this.props.fetchResults(2018);
	}

	generatePageHeader() {
		return "Results";
	}
}

function mapStateToProps({ games }) {
	return { games: games.results || null };
}

export default connect(
	mapStateToProps,
	{ fetchResults }
)(ResultList);
