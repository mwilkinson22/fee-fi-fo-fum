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

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";

class AdminGamePostGame extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, fullGames, localTeam, teamList, teamTypes } = nextProps;

		const newState = {};
		const { _id } = match.params;

		//Get Game
		newState.game = fullGames[_id];

		//Check whether we need Man of Steel points
		newState.manOfSteel = newState.game._competition.instance.manOfSteelPoints;

		//Dropdown Options
		newState.options = {};

		//Get Team Options
		newState.options.players = {};
		newState.options.players.bothTeams = convertTeamToSelect(newState.game, teamList);
		newState.options.players.localTeam = convertTeamToSelect(
			newState.game,
			teamList,
			localTeam
		);

		//Get Man/Woman string based on teamType
		const { gender } = teamTypes[newState.game._teamType];
		newState.genderedString = gender == "M" ? "Man" : "Woman";

		//Validation Schema
		const validationSchema = {
			attendance: Yup.number().label("Attendance"),
			extraTime: Yup.boolean().label("Game went to extra time?"),
			_potm: Yup.string().label(`${newState.genderedString} of the Match`)
		};

		//New or legacy Player of the Match
		newState.legacyFanPotm = Number(newState.game.date.getFullYear()) <= 2019;
		if (newState.legacyFanPotm) {
			validationSchema._fan_potm = Yup.string().label(
				`Fans' ${newState.genderedString} of the Match (Legacy)`
			);
			validationSchema.fan_potm_link = Yup.string().label("Poll Link (Legacy)");
		} else {
			//
		}

		if (newState.manOfSteel) {
			const manOfSteelValidation = {};
			for (let i = 1; i <= 3; i++) {
				manOfSteelValidation[i] = Yup.mixed()
					.test("isUnique", "Player selected twice", function(option) {
						//No worries if the value is empty
						if (!option || !option.value) {
							return true;
						}

						//Otherwise, check if there are other fields with
						//values equal to this field
						return _.filter(this.parent, o => o.value && o.value == option.value);
					})
					.label(`${i} ${i === 1 ? "Point" : "Points"}`);
			}

			validationSchema.manOfSteel = Yup.object().shape(manOfSteelValidation);
		}

		newState.validationSchema = Yup.object().shape(validationSchema);

		return newState;
	}

	getInitialValues() {
		const { game, legacyFanPotm, manOfSteel } = this.state;

		const defaultValues = {
			attendance: "",
			extraTime: "",
			_potm: "",
			_fan_potm: "",
			fan_potm_link: ""
		};

		if (legacyFanPotm) {
			defaultValues._fan_potm = "";
			defaultValues.fan_potm_link = "";
		}

		if (manOfSteel) {
			defaultValues.manOfSteel = {
				1: "",
				2: "",
				3: ""
			};
		}

		return _.mapValues(defaultValues, (defaultValue, key) => {
			let value;
			switch (key) {
				case "manOfSteel":
					if (game.manOfSteel) {
						value = _.chain(game.manOfSteel)
							.map(({ _player, points }) => [points, _player])
							.fromPairs()
							.value();
					}
					break;

				default:
					value = game[key];
					break;
			}

			return value == null ? defaultValue : value;
		});
	}

	getFieldGroups() {
		const { genderedString, legacyFanPotm, manOfSteel, options } = this.state;

		const potmFields = [
			{
				name: "_potm",
				type: fieldTypes.select,
				options: options.players.bothTeams,
				isSearchable: false,
				isClearable: true,
				isNested: true
			}
		];

		if (legacyFanPotm) {
			potmFields.push(
				{
					name: "_fan_potm",
					type: fieldTypes.select,
					options: options.players.localTeam,
					isSearchable: false,
					isClearable: true
				},
				{
					name: "fan_potm_link",
					type: fieldTypes.text
				}
			);
		}

		const fieldGroups = [
			{
				fields: [
					{
						name: "attendance",
						type: fieldTypes.number
					},
					{
						name: "extraTime",
						type: fieldTypes.boolean
					}
				]
			},
			{
				label: `${genderedString} of the Match`,
				fields: potmFields
			}
		];

		if (manOfSteel) {
			const manOfSteelFields = [];
			for (let i = 3; i > 0; i--) {
				manOfSteelFields.push({
					name: `manOfSteel.${i}`,
					type: fieldTypes.select,
					options: options.players.bothTeams,
					isSearchable: false,
					isClearable: true,
					isNested: true
				});
			}
			fieldGroups.push({
				label: `${genderedString} of Steel`,
				fields: manOfSteelFields
			});
		}

		return fieldGroups;
	}

	alterValuesBeforeSubmit(values) {
		if (values.manOfSteel) {
			values.manOfSteel = _.chain(values.manOfSteel)
				.map((_player, points) => ({ _player, points }))
				.filter("_player")
				.value();
		}
	}

	render() {
		const { game, validationSchema } = this.state;
		const { updateGame } = this.props;

		return (
			<BasicForm
				alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
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
function mapStateToProps({ config, games, teams }) {
	const { legacyFanPotmDeadline, localTeam } = config;
	const { fullGames } = games;
	const { teamList, teamTypes } = teams;

	return { legacyFanPotmDeadline, fullGames, localTeam, teamList, teamTypes };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, {
		updateGame
	})(AdminGamePostGame)
);
