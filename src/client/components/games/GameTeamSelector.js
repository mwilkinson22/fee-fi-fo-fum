//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import LoadingPage from "../LoadingPage";
import ShareableTeamSelector from "../teamselectors/ShareableTeamSelector";

//Actions
import { fetchTeamSelectorForGame } from "~/client/actions/teamSelectorActions";

class GameTeamSelector extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fetchTeamSelectorForGame, game, selectors } = nextProps;
		const newState = { game };

		//Look to see if we already have a selector for this game
		newState.selector = _.find(selectors, s => s._game == game._id);

		//If so, ensure we clear the isLoading flag.
		//Otherwise, if we're not already loading this selector, we fetch it
		if (newState.selector) {
			newState.isLoading = false;
		} else if (!prevState.isLoading != game._id) {
			fetchTeamSelectorForGame(game._id);
			newState.isLoading = game._id;
		}

		return newState;
	}

	render() {
		const { game, isLoading, selector } = this.state;

		let content;

		if (isLoading) {
			content = <LoadingPage />;
		} else {
			content = (
				<div className="container">
					<h2>Pick & share your squad</h2>
					<ShareableTeamSelector selector={selector} urlFormatter={() => `games/${game.slug}`} />
				</div>
			);
		}

		return <section className="game-page-team-selector">{content}</section>;
	}
}

function mapStateToProps({ teamSelectors }) {
	const { selectors } = teamSelectors;
	return { selectors };
}

GameTeamSelector.propTypes = {
	game: PropTypes.object.isRequired
};

export default connect(mapStateToProps, { fetchTeamSelectorForGame })(GameTeamSelector);
