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
import Table from "../../Table";

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
		newState.options.players = {};
		newState.options.players.bothTeams = convertTeamToSelect(newState.game, teamList);
		newState.options.players.localTeam = convertTeamToSelect(newState.game, teamList, localTeam);

		//Validation Schema
		const validationSchema = {
			attendance: Yup.number().label("Attendance"),
			extraTime: Yup.boolean().label("Game went to extra time?"),
			_potm: Yup.string().label(`${newState.game.genderedString} of the Match`),
			fan_potm_options: Yup.array()
				.of(Yup.string())
				.label("Nominees"),
			fan_potm_deadline_date: Yup.string().label("Deadline Date"),
			fan_potm_deadline_time: Yup.string().label("Deadline Time"),
			scoreOnly: Yup.boolean().label("Scores Only (No Stats)"),
			excludeFromAdminDashboard: Yup.boolean().label("Exclude from Admin Dashboard")
		};

		if (newState.manOfSteel) {
			const manOfSteelValidation = {};
			for (let i = 1; i <= 3; i++) {
				manOfSteelValidation[`${i}points`] = Yup.mixed()
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
		const { game, manOfSteel } = this.state;

		const defaultValues = {
			attendance: "",
			extraTime: "",
			_potm: "",
			_fan_potm: "",
			fan_potm_link: "",
			fan_potm_options: [],
			fan_potm_deadline_date: "",
			fan_potm_deadline_time: "",
			scoreOnly: false,
			excludeFromAdminDashboard: false
		};

		if (manOfSteel) {
			defaultValues.manOfSteel = {
				"1points": "",
				"2points": "",
				"3points": ""
			};
		}

		return _.mapValues(defaultValues, (defaultValue, key) => {
			let value;
			switch (key) {
				case "fan_potm_options":
					if (game.fan_potm) {
						value = game.fan_potm.options;
					}
					break;
				case "fan_potm_deadline_date":
				case "fan_potm_deadline_time":
					if (game.fan_potm && game.fan_potm.deadline) {
						const dateOrTime = key.replace("fan_potm_deadline_", "");
						const toString = dateOrTime == "date" ? "yyyy-MM-dd" : "HH:mm:ss";
						value = new Date(game.fan_potm.deadline).toString(toString);
					}
					break;
				case "manOfSteel":
					if (game.manOfSteel) {
						value = _.chain(game.manOfSteel)
							.map(({ _player, points }) => [`${points}points`, _player])
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
		const { game, manOfSteel, options } = this.state;
		const { genderedString } = game;

		//Create standard post-game fields
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
					},
					{
						name: "_potm",
						type: fieldTypes.select,
						options: options.players.bothTeams,
						isSearchable: false,
						isClearable: true,
						isNested: true
					},
					{
						name: "excludeFromAdminDashboard",
						type: fieldTypes.boolean
					}
				]
			}
		];

		//Add score-only bool, if not already determined by the competition
		if (!game._competition.instance.scoreOnly) {
			fieldGroups.push({ fields: [{ name: "scoreOnly", type: fieldTypes.boolean }] });
		}

		//Add Man Of Steel, if necessary
		if (manOfSteel) {
			const manOfSteelFields = [];
			for (let i = 3; i > 0; i--) {
				manOfSteelFields.push({
					name: `manOfSteel.${i}points`,
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

		//Add Fans' Man of the Match
		fieldGroups.push(
			{
				label: `Fans' ${genderedString} of the Match`,
				fields: [
					{
						name: "fan_potm_options",
						type: fieldTypes.select,
						options: options.players.localTeam,
						isMulti: true
					},
					{
						name: "fan_potm_deadline_date",
						type: fieldTypes.date
					},
					{
						name: "fan_potm_deadline_time",
						type: fieldTypes.time
					}
				]
			},
			{
				render: (values, formik) => {
					const setValue = days => {
						const now = new Date();
						formik.setFieldValue("fan_potm_deadline_time", now.toString("HH:mm:00"));

						now.addDays(days);
						formik.setFieldValue("fan_potm_deadline_date", now.toString("yyyy-MM-dd"));
					};

					const buttons = [];
					for (let i = 1; i <= 3; i++) {
						buttons.push(
							<button
								//Can't use a standard () => {} or i will always be 4
								onClick={(days => () => setValue(days))(i)}
								type="button"
								key={i}
							>
								{i * 24} Hours
							</button>
						);
					}

					return [<label key="label">Set Deadline</label>, <div key="buttons">{buttons}</div>];
				}
			},
			{
				render: () => {
					if (game.fan_potm && Object.keys(game.fan_potm.votes).length) {
						const columns = [
							{ key: "player", label: "Player" },
							{ key: "pc", label: "%" },
							{ key: "votes", label: "Votes" }
						];

						const totalVotes = _.sum(_.values(game.fan_potm.votes));

						const rows = _.map(game.fan_potm.votes, (votes, player) => {
							const data = {
								votes,
								player: options.players.localTeam.find(o => o.value == player).label,
								pc: Math.round((votes / totalVotes) * 1000) / 10 + "%"
							};
							return {
								key: player,
								data
							};
						});
						return (
							<Table
								className="full-span"
								columns={columns}
								defaultSortable={false}
								key="fan_potm_table"
								rows={rows}
								sortBy={{ key: "votes", asc: false }}
							/>
						);
					}
				}
			}
		);

		return fieldGroups;
	}

	alterValuesBeforeSubmit(values) {
		if (values.manOfSteel) {
			values.manOfSteel = _.chain(values.manOfSteel)
				.map((_player, points) => ({ _player, points: points.replace(/\D/g, "") }))
				.filter("_player")
				.value();
		}

		//Fan POTM
		values.fan_potm = {
			options: values.fan_potm_options
		};
		if (values.fan_potm_deadline_date && values.fan_potm_deadline_time) {
			values.fan_potm.deadline = `${values.fan_potm_deadline_date} ${values.fan_potm_deadline_time}`;
		} else {
			values.fan_potm.deadline = null;
		}

		delete values.fan_potm_options;
		delete values.fan_potm_deadline_date;
		delete values.fan_potm_deadline_time;
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
