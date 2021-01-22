//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import * as Yup from "yup";

//Actions
import { updateGame } from "../../../actions/gamesActions";

//Components
import BasicForm from "../BasicForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import playerStatTypes from "~/constants/playerStatTypes";

class AdminGameOverrideGameStar extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, fullGames } = nextProps;

		const newState = {};
		const { _id } = match.params;

		//Get Game
		newState.game = fullGames[_id];

		//Get Players By Team, sorted by team
		newState.playersByTeam = _.chain(newState.game.playerStats)
			.groupBy("_team")
			.mapValues(players =>
				_.chain(players)
					.sortBy("position")
					.map("_player")
					.value()
			)
			.value();

		//Create validation schema
		const validationSchema = _.chain(newState.playersByTeam)
			.map((players, team) => {
				//Convert each player to a Yup Array (to represent their stats)
				return _.chain(players)
					.map(id => {
						//Get eligible player
						const eligiblePlayer = newState.game.eligiblePlayers[team].find(
							({ _id }) => _id == id
						);

						//Format Label
						let label = eligiblePlayer.name.full;
						if (eligiblePlayer.number) {
							label = `${eligiblePlayer.number}. ${label}`;
						}

						//Validation for this player
						const validation = Yup.array()
							.of(Yup.string())
							.label(label);

						//Return as an array which we can convert to an object
						return [id, validation];
					})
					.value();
			})
			.flatten()
			.fromPairs()
			.value();

		newState.validationSchema = Yup.object().shape(validationSchema);

		//Get Stats Options
		newState.statsOptions = _.chain(playerStatTypes)
			.map((data, key) => ({ ...data, key }))
			.groupBy("type")
			.map((statTypes, group) => {
				const options = _.chain(statTypes)
					.map(({ plural, key }) => ({ label: plural, value: key }))
					.sortBy("label")
					.value();
				return { label: group, options };
			})
			.value();

		return newState;
	}

	getInitialValues() {
		const { game, playersByTeam } = this.state;

		return _.chain(playersByTeam)
			.values()
			.flatten()
			.map(id => {
				let value = "";
				//Check for existing values
				if (game.overrideGameStarStats && game.overrideGameStarStats) {
					const currentValues = game.overrideGameStarStats.find(
						({ _player }) => _player == id
					);
					if (currentValues) {
						value = currentValues.stats;
					}
				}
				return [id, value];
			})
			.fromPairs()
			.value();
	}

	getFieldGroups() {
		const { teamList } = this.props;
		const { playersByTeam, statsOptions } = this.state;
		return _.map(playersByTeam, (players, team) => {
			return {
				label: teamList[team].name.short,
				fields: players.map(id => ({
					name: id,
					type: fieldTypes.select,
					isMulti: true,
					isNested: true,
					options: statsOptions
				}))
			};
		});
	}

	alterValuesBeforeSubmit(values) {
		const filteredValues = _.chain(values)
			.map((stats, _player) => ({ stats, _player }))
			.filter(({ stats }) => stats && stats.length)
			.value();

		return {
			overrideGameStarStats: filteredValues
		};
	}

	render() {
		const { game, validationSchema } = this.state;
		const { updateGame } = this.props;

		return (
			<BasicForm
				alterValuesBeforeSubmit={values => this.alterValuesBeforeSubmit(values)}
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Game"
				onSubmit={values => updateGame(game._id, values)}
				validationSchema={validationSchema}
			/>
		);
	}
}

//Add Redux Support
function mapStateToProps({ games, teams }) {
	const { fullGames } = games;
	const { teamList } = teams;

	return { fullGames, teamList };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, {
		updateGame
	})(AdminGameOverrideGameStar)
);
