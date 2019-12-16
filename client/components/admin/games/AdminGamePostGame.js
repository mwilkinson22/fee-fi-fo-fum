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
		const { match, fullGames, localTeam, teamList } = nextProps;

		const newState = {};
		const { _id } = match.params;

		//Get Game
		newState.game = fullGames[_id];

		//Check whether we need Man of Steel points
		newState.manOfSteel = newState.game._competition.instance.manOfSteelPoints;

		//Dropdown Options
		newState.options = {};

		//Get Team Options
		newState.options.manOfSteel = convertTeamToSelect(newState.game, teamList);
		newState.options.motm = convertTeamToSelect(newState.game, teamList, localTeam);

		//Validation Schema
		const validationSchema = {
			attendance: Yup.number().label("Attendance"),
			extraTime: Yup.boolean().label("Game went to extra time?"),
			_motm: Yup.object().label("Man of the Match"),
			_fan_motm: Yup.object().label("Fans' Man of the Match"),
			fan_motm_link: Yup.string().label("Poll Link")
		};

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
		const { game, manOfSteel, options } = this.state;

		const defaultValues = {
			attendance: "",
			extraTime: "",
			_motm: "",
			_fan_motm: "",
			fan_motm_link: ""
		};

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
						const flatOptions = _.flatten(options.manOfSteel.map(o => o.options || o));

						value = _.chain(game.manOfSteel)
							.map(({ _player, points }) => [
								points,
								flatOptions.find(({ value }) => value == _player)
							])
							.fromPairs()
							.value();
					}
					break;

				case "_motm":
				case "_fan_motm":
					value = options.motm.find(({ value }) => value == game[key]);
					break;

				default:
					value = game[key];
					break;
			}

			return value == null ? defaultValue : value;
		});
	}

	getFieldGroups() {
		const { manOfSteel, options } = this.state;

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
				label: "Man of the Match",
				fields: [
					{
						name: "_motm",
						type: fieldTypes.select,
						options: options.motm,
						isSearchable: false,
						isClearable: true
					},
					{
						name: "_fan_motm",
						type: fieldTypes.select,
						options: options.motm,
						isSearchable: false,
						isClearable: true
					},
					{
						name: "fan_motm_link",
						type: fieldTypes.text
					}
				]
			}
		];

		if (manOfSteel) {
			const manOfSteelFields = [];
			for (let i = 3; i > 0; i--) {
				manOfSteelFields.push({
					name: `manOfSteel.${i}`,
					type: fieldTypes.select,
					options: options.manOfSteel,
					isSearchable: false,
					isClearable: true
				});
			}
			fieldGroups.push({
				label: "Man of Steel",
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
	const { localTeam } = config;
	const { fullGames } = games;
	const { teamList } = teams;

	return { fullGames, localTeam, teamList };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, {
		updateGame
	})(AdminGamePostGame)
);
