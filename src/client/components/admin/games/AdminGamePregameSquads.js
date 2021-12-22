//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import AdminPregameSquadSelector from "./AdminGamePregameSquadSelector";
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchTeam } from "../../../actions/teamsActions";
import { updateGame } from "../../../actions/gamesActions";

//Helpers
import BasicForm from "../BasicForm";

class AdminGamePregameSquads extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullGames, localTeam, match, teamList } = nextProps;
		const newState = { isLoading: false };

		//Get Game
		newState.game = fullGames[match.params._id];

		//Get Teams
		newState.teams = [localTeam, newState.game._opposition._id];
		if (newState.game.isAway) {
			newState.teams.reverse();
		}

		//Validation Schema
		newState.validationSchema = Yup.object().shape(
			_.chain(newState.teams)
				.map(id => [id, Yup.array().of(Yup.string()).label(teamList[id].name.long)])
				.fromPairs()
				.value()
		);

		return newState;
	}

	getInitialValues() {
		const { game, teams } = this.state;

		return _.chain(teams)
			.map(teamId => {
				let values;

				//First we check to see if the squad exists yet
				const currentPregameSquad = game.pregameSquads.find(({ _team }) => _team == teamId);

				//If not, just return an empty array
				if (!currentPregameSquad || !currentPregameSquad.squad) {
					values = [];
				} else {
					//Otherwise we return the existing squad, filtered to
					//ensure all values appear in eligiblePlayers
					values = currentPregameSquad.squad.filter(id =>
						game.eligiblePlayers[teamId].find(({ _id }) => _id == id)
					);
				}
				return [teamId, values];
			})
			.fromPairs()
			.value();
	}

	getFieldGroups() {
		const { game, teams } = this.state;
		const { teamList } = this.props;

		return [
			{
				render: () => {
					return teams.map(id => <AdminPregameSquadSelector key={id} game={game} team={teamList[id]} />);
				}
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		return _.map(values, (squad, _team) => ({ squad, _team }));
	}

	render() {
		const { updateGame } = this.props;
		const { game, isLoading, validationSchema } = this.state;

		//Await Last Game
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div className="admin-pregame-squad-page">
				<BasicForm
					alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
					className={"pregame-wrapper"}
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={false}
					itemType={"Squads"}
					onSubmit={pregameSquads => updateGame(game._id, { pregameSquads })}
					useFormCard={false}
					validationSchema={validationSchema}
				/>
			</div>
		);
	}
}

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { fullGames } = games;
	const { teamList } = teams;
	return { fullGames, localTeam, teamList };
}

export default connect(mapStateToProps, { updateGame, fetchTeam })(AdminGamePregameSquads);
