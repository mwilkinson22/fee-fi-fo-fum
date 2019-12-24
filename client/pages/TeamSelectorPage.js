//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import SquadSelector from "../components/admin/games/SquadSelector";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "./NotFoundPage";

//Actions
import {
	fetchAllTeamSelectors,
	fetchTeamSelector,
	saveTeamSelectorChoices
} from "~/client/actions/teamSelectorActions";

//Helpers
import { matchSlugToItem } from "~/helpers/routeHelper";

class TeamSelectorPage extends Component {
	constructor(props) {
		super(props);

		const { fetchAllTeamSelectors, selectorList } = props;

		if (!selectorList) {
			fetchAllTeamSelectors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = { isLoadingList: false };
		const {
			fetchTeam,
			fetchTeamSelector,
			fullTeams,
			match,
			selectorList,
			selectors
		} = nextProps;

		//Check we have the list
		if (!selectorList) {
			newState.isLoadingList = true;
			return newState;
		}

		//Get the selector
		const { item } = matchSlugToItem(match.params.slug, selectorList);

		if (!item) {
			newState.selector = false;
			return newState;
		}

		//Ensure it's fully loaded
		if (!selectors[item._id] && !prevState.isLoadingSelector) {
			fetchTeamSelector(item._id);
			newState.isLoadingSelector = true;
		} else if (selectors[item._id]) {
			newState.selector = selectors[item._id];
			newState.isLoadingSelector = false;

			//Finally, ensure we have all dependencies
			const { numberFromSquad, numberFromTeam } = newState.selector;
			if (numberFromTeam && !fullTeams[numberFromTeam] && !prevState.isLoadingTeam) {
				//Load team for squad numbers
				fetchTeam(numberFromTeam);
				newState.isLoadingTeam = true;
			} else if (fullTeams[numberFromTeam]) {
				const squad = fullTeams[numberFromTeam].squads.find(
					({ _id }) => _id == numberFromSquad
				);
				newState.squadNumbers = squad ? squad.players : [];
				newState.isLoadingTeam = false;
			}
		}

		return newState;
	}

	handleSave(values) {
		const { saveTeamSelectorChoices } = this.props;
		const { selector } = this.state;

		saveTeamSelectorChoices(selector._id, values);

		this.setState({ editMode: false });
	}

	renderHeader() {
		const { selector } = this.state;
		return (
			<section className="page-header">
				<HelmetBuilder title={selector.title} cardImage={selector.socialCard} />
				<div className="container">
					<h1>{selector.title}</h1>
				</div>
			</section>
		);
	}

	renderContent() {
		const { fullTeams, localTeam } = this.props;
		const { editMode, isLoadingTeam, selector, squadNumbers } = this.state;

		if (isLoadingTeam) {
			return <LoadingPage />;
		}

		const players = selector.players.map(_player => {
			//Check for a squad number
			const squadEntry =
				squadNumbers &&
				squadNumbers.find(squadMember => squadMember._player._id == _player._id);

			let number;
			if (squadEntry) {
				number = squadEntry.number;
			}

			return { _player, number, showInDropdown: false };
		});

		//Get current squad
		let currentSquad = {};
		if (selector.activeUserChoices) {
			currentSquad = _.chain(selector.activeUserChoices)
				.map((_player, i) => {
					//Get Position
					const position = i + 1;

					//Check Player is still valid
					const player = selector.players.find(({ _id }) => _id == _player)
						? _player
						: null;

					return [position, player];
				})
				.fromPairs()
				.value();
		}

		return (
			<section>
				<div className="container">
					<div className="form-card">
						<SquadSelector
							currentSquad={currentSquad}
							customSecondColumn={this.renderSecondColumn()}
							customValidation={true}
							onSubmit={values => this.handleSave(values)}
							maxInterchanges={selector.interchanges}
							players={players}
							requireFullTeam={true}
							submitText="Save Choices"
							readOnly={selector.activeUserChoices && !editMode}
							team={fullTeams[localTeam]}
						/>
					</div>
				</div>
			</section>
		);
	}

	renderSecondColumn() {
		const { editMode, selector } = this.state;
		if (selector.activeUserChoices && !editMode) {
			return (
				<div>
					<p>
						<span>Thank you, your team has been saved. </span>
						<span
							className="pseudo-link"
							onClick={() => this.setState({ editMode: true })}
						>
							Click Here
						</span>
						<span> to edit them</span>
					</p>
				</div>
			);
		}
	}

	render() {
		const { isLoadingList, isLoadingSelector, selector } = this.state;

		if (isLoadingList || isLoadingSelector) {
			return <LoadingPage />;
		}

		if (!selector) {
			return <NotFoundPage />;
		}

		return (
			<div className="team-selector-page">
				{this.renderHeader()}
				{this.renderContent()}
			</div>
		);
	}
}

function mapStateToProps({ config, teams, teamSelectors }) {
	const { localTeam } = config;
	const { fullTeams, teamTypes } = teams;
	const { selectors, selectorList } = teamSelectors;
	return { fullTeams, localTeam, selectors, selectorList, teamTypes };
}

export default {
	component: connect(mapStateToProps, {
		fetchAllTeamSelectors,
		fetchTeamSelector,
		saveTeamSelectorChoices
	})(TeamSelectorPage)
};
