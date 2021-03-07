//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Actions
import { updateGame } from "../../../actions/gamesActions";

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";

class AdminGameKickers extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullGames, match, localTeam, teamList } = nextProps;

		const newState = {};

		//Get current game
		newState.game = fullGames[match.params._id];

		//Get Team Ids
		newState.teams = [localTeam, newState.game._opposition._id];
		if (newState.game.isAway) {
			newState.teams.reverse();
		}

		//Convert squads to options
		newState.options = _.fromPairs(
			newState.teams.map(id => [id, convertTeamToSelect(newState.game, teamList, id)])
		);

		//Get validation schema
		newState.validationSchema = Yup.object().shape(
			_.fromPairs(newState.teams.map(id => [id, Yup.string().label(teamList[id].name.short)]))
		);
		return newState;
	}

	getInitialValues() {
		const { game, teams } = this.state;

		const defaultValues = _.fromPairs(teams.map(id => [id, ""]));

		if (!game._kickers) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, id) => {
				const entry = game._kickers.find(({ _team }) => _team == id);
				if (entry && entry._player) {
					return entry._player;
				} else {
					return defaultValue;
				}
			});
		}
	}

	getFieldGroups() {
		const { options, teams } = this.state;

		return [
			{
				label: "Kickers",
				fields: teams.map(id => ({
					name: id,
					type: fieldTypes.select,
					options: options[id],
					isClearable: true
				}))
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		return _.map(values, (_player, _team) => ({ _player, _team })).filter(({ _player }) => _player);
	}

	render() {
		const { updateGame } = this.props;
		const { game, validationSchema } = this.state;

		return (
			<BasicForm
				alterValuesBeforeSubmit={values => this.alterValuesBeforeSubmit(values)}
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Kickers"
				onSubmit={_kickers => updateGame(game._id, { _kickers })}
				validationSchema={validationSchema}
			/>
		);
	}
}

function mapStateToProps({ config, games, teams }) {
	const { fullGames } = games;
	const { teamList } = teams;
	const { localTeam } = config;
	return { fullGames, teamList, localTeam };
}

export default connect(mapStateToProps, { updateGame })(AdminGameKickers);
