//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import SquadSelector from "./SquadSelector";
import ShareDialog from "../social/ShareDialog";
import LoadingPage from "../LoadingPage";

//Actions
import { fetchPreviewImage, saveTeamSelectorChoices, shareTeamSelector, fetchTeamSelectorChoices } from "~/client/actions/teamSelectorActions";
import { fetchTeam } from "~/client/actions/teamsActions";

class ShareableTeamSelector extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fetchTeam, fullTeams, selector, fetchTeamSelectorChoices } = nextProps;
		const newState = { selector };

		//Ensure we have all dependencies
		const { numberFromSquad, numberFromTeam } = newState.selector;

		//Wait for squad numbers
		if (numberFromTeam && numberFromSquad) {
			if (fullTeams[numberFromTeam] && fullTeams[numberFromTeam].fullData) {
				//If we already have full data for this team,
				//add squad numbers to state
				const squad = fullTeams[numberFromTeam].squads.find(({ _id }) => _id == numberFromSquad);
				newState.squadNumbers = squad ? squad.players : [];
				newState.isLoadingTeam = false;
			} else if (!prevState.isLoadingTeam) {
				//Otherwise load the team, if we're not already
				fetchTeam(numberFromTeam, "full");
				newState.isLoadingTeam = true;
			}
			//Otherwise, we're already loading the team, so we just wait
		}

		//If a player is missing from the preselected values
		//(i.e, if a user chooses a player who is later removed
		//from the selector, and then revisits the page), we
		//enforce edit mode
		const { activeUserChoices, players } = newState.selector;
		if (activeUserChoices != null) {
			const missingPlayers = _.difference(
				activeUserChoices,
				players.map(p => p._id)
			);

			if (missingPlayers.length) {
				newState.enforceEditMode = true;
			}
			newState.isLoadingChoices = false;
		} else if (!prevState.isLoadingChoices) {
			fetchTeamSelectorChoices(newState.selector._id);
			newState.isLoadingChoices = true;
		}

		return newState;
	}

	handleSave(values) {
		const { saveTeamSelectorChoices } = this.props;
		const { selector } = this.state;

		saveTeamSelectorChoices(selector._id, values);

		this.setState({ enforceEditMode: false });
	}

	selectionIsComplete() {
		const { enforceEditMode, selector } = this.state;
		return !enforceEditMode && selector.activeUserChoices != null && selector.activeUserChoices.length > 0;
	}

	renderSecondColumn() {
		if (this.selectionIsComplete()) {
			const { baseUrl, fetchPreviewImage, shareTeamSelector, site_social, urlFormatter } = this.props;
			const { selector } = this.state;

			//Get Initial Share Values
			let initialContent = selector.defaultSocialText || "";

			//Get Tokens
			const url = `${baseUrl}/${urlFormatter(selector)}`;

			//Replace tokens
			initialContent = initialContent.replace(/{url}/gi, url).replace(/@*{site_social}/gi, "@" + site_social);

			return (
				<div>
					<div className="confirmation">
						<p>Thank you, your choices have been saved!</p>
						<p>
							{"Want to make a change? "}
							<span className="pseudo-link" onClick={() => this.setState({ enforceEditMode: true })}>
								Click Here
							</span>
							{" to edit your team"}
						</p>
						<p>Or, share your picks with the world using the tool below!</p>
					</div>
					<ShareDialog
						initialContent={initialContent}
						onFetchImage={() => fetchPreviewImage(selector._id)}
						onSubmit={data => shareTeamSelector(selector._id, data)}
					/>
				</div>
			);
		}
	}

	render() {
		const { fullTeams, localTeam } = this.props;
		const { isLoadingTeam, isLoadingChoices, selector, squadNumbers } = this.state;

		if (isLoadingTeam || isLoadingChoices) {
			return <LoadingPage />;
		}

		const players = selector.players.map(_player => {
			//Check for a squad number
			const squadEntry = squadNumbers && squadNumbers.find(squadMember => squadMember._player._id == _player._id);

			let number;
			if (squadEntry) {
				number = squadEntry.number;
			}

			return { _player, number, showInDropdown: false };
		});

		//Get current squad
		let currentSquad = {};
		if (selector.activeUserChoices && selector.activeUserChoices.length) {
			currentSquad = _.chain(selector.activeUserChoices)
				.map((_player, i) => {
					//Get Position
					const position = i + 1;

					//Check Player is still valid
					const player = selector.players.find(({ _id }) => _id == _player) ? _player : null;

					return [position, player];
				})
				.fromPairs()
				.value();
		}

		return (
			<div className="container">
				<div className="form-card shareable-team-selector">
					<SquadSelector
						currentSquad={currentSquad}
						customSecondColumn={this.renderSecondColumn()}
						customValidation={true}
						onSubmit={values => this.handleSave(values)}
						maxInterchanges={selector.interchanges}
						players={players}
						requireFullTeam={true}
						submitText="Save Choices"
						readOnly={this.selectionIsComplete()}
						team={fullTeams[localTeam]}
						usesExtraInterchange={selector.usesExtraInterchange}
					/>
				</div>
			</div>
		);
	}
}

ShareableTeamSelector.propTypes = {
	selector: PropTypes.object.isRequired,
	urlFormatter: PropTypes.func
};

ShareableTeamSelector.defaultProps = {
	urlFormatter: s => `team-selectors/${s.slug}`
};

function mapStateToProps({ config, teams, teamSelectors }) {
	const { baseUrl, localTeam, site_social } = config;
	const { fullTeams } = teams;
	const { selectors } = teamSelectors;
	return { baseUrl, fullTeams, localTeam, site_social, selectors };
}

export default connect(mapStateToProps, {
	fetchPreviewImage,
	fetchTeamSelectorChoices,
	saveTeamSelectorChoices,
	shareTeamSelector,
	fetchTeam
})(ShareableTeamSelector);
