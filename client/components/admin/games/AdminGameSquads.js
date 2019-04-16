//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";

//Components
import SquadSelector from "./SquadSelector";
import LoadingPage from "../../LoadingPage";
import Table from "../../Table";

//Actions
import { fetchTeam } from "../../../actions/teamsActions";
import { setPregameSquads } from "../../../actions/gamesActions";
import { fetchPeopleList } from "~/client/actions/peopleActions";
import TeamImage from "~/client/components/teams/TeamImage";

class AdminGameSquads extends Component {
	constructor(props) {
		super(props);
		const { game, fullTeams, fetchTeam, localTeam, peopleList, fetchPeopleList } = props;

		if (!fullTeams[localTeam]) {
			fetchTeam(localTeam);
		}
		if (!fullTeams[game._opposition._id]) {
			fetchTeam(game._opposition._id);
		}
		if (!peopleList) {
			fetchPeopleList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, fullTeams, localTeam, peopleList } = nextProps;
		const newState = {};

		const teams = [localTeam, game._opposition._id];

		//Ensure people list is loaded
		if (!peopleList) {
			return newState;
		}

		//Ensure both teams have loaded
		if (_.reject(teams, team => fullTeams[team]).length) {
			return newState;
		}

		//Get Squads
		if (!prevState.squads) {
			const year = new Date(game.date).getFullYear();
			const { _teamType } = game;
			newState.squads = _.chain(teams)
				.map(id => {
					const fullSquad = _.find(
						fullTeams[id].squads,
						s => s.year === year && s._teamType === _teamType
					).players;
					const pregameSquad = _.find(game.pregameSquads, s => s._team === id).squad;

					const filteredSquad = _.map(fullSquad, squadMember => {
						let name = "";
						if (squadMember.number) {
							name += `${squadMember.number}. `;
						}
						name += `${squadMember._player.name.first} ${
							squadMember._player.name.last
						}`;

						const currentSquadMember = _.find(
							game.playerStats,
							s => s._team === id && s._player === squadMember._player._id
						);
						const position = currentSquadMember ? currentSquadMember.position : null;

						return {
							_id: squadMember._player._id,
							number: squadMember.number,
							name,
							mainPosition: squadMember._player.playerDetails.mainPosition,
							otherPositions: squadMember._player.playerDetails.otherPositions,
							inPregame: Boolean(
								_.find(pregameSquad, p => p === squadMember._player._id)
							),
							position
						};
					});

					return [id, filteredSquad];
				})
				.fromPairs()
				.value();
		}

		return newState;
	}

	getDefaults() {}

	onSubmit(values) {
		console.log(values);
	}

	render() {
		const { squads } = this.state;
		const { game, localTeam, fullTeams } = this.props;
		if (!squads) {
			return <LoadingPage />;
		}

		let teams = [localTeam, game._opposition._id];
		if (game.isAway) {
			teams = teams.reverse();
		}

		const content = teams.map(id => {
			const { colours } = fullTeams[id];
			return (
				<div className="form-card squad-selector-wrapper" key={id}>
					<TeamImage team={fullTeams[id]} />
					<SquadSelector
						squad={squads[id]}
						teamColours={colours}
						team={id}
						game={game._id}
					/>
				</div>
			);
		});

		return (
			<div className="admin-squad-picker-page">
				<div className="container">{content}</div>
			</div>
		);
	}
}

function mapStateToProps({ config, teams, people }, ownProps) {
	const { fullTeams } = teams;
	const { localTeam } = config;
	const { peopleList } = people;
	return { fullTeams, localTeam, peopleList, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchTeam, setPregameSquads, fetchPeopleList }
)(AdminGameSquads);
