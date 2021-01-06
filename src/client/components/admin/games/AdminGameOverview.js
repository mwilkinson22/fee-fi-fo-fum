//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import * as Yup from "yup";

//Actions
import { fetchBroadcasters } from "../../../actions/broadcasterActions";
import { fetchCompetitionSegments } from "../../../actions/competitionActions";
import { fetchAllGrounds } from "../../../actions/groundActions";
import { fetchPeopleList } from "../../../actions/peopleActions";
import { createGame, updateGame, deleteGame } from "../../../actions/gamesActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { getDynamicOptions } from "~/helpers/gameHelper";

// noinspection JSUnusedGlobalSymbols
class AdminGameOverview extends Component {
	constructor(props) {
		super(props);
		const {
			broadcasterList,
			fetchBroadcasters,
			competitionSegmentList,
			fetchCompetitionSegments,
			groundList,
			fetchAllGrounds,
			peopleList,
			fetchPeopleList
		} = props;

		if (!broadcasterList) {
			fetchBroadcasters();
		}
		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}
		if (!groundList) {
			fetchAllGrounds();
		}
		if (!peopleList) {
			fetchPeopleList();
		}
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const {
			match,
			teamList,
			teamTypes,
			competitionSegmentList,
			broadcasterList,
			groundList,
			peopleList,
			fullGames,
			localTeam
		} = nextProps;
		const newState = { isLoading: false };
		const { _id } = match.params;

		//Create or edit
		newState.isNew = !_id;

		//Await lists
		if (
			!teamList ||
			!competitionSegmentList ||
			!groundList ||
			!peopleList ||
			!broadcasterList
		) {
			newState.isLoading = true;
			return newState;
		}

		if (!newState.isNew) {
			//Get Game
			newState.game = fullGames[_id];
		}

		//Validation Schema
		const rawValidationSchema = {
			date: Yup.date()
				.required()
				.label("Date"),
			dateRange: Yup.number().label("Date Range"),
			time: Yup.string()
				.required()
				.label("Time"),
			_teamType: Yup.string()
				.required()
				.label("Team Type"),
			_competition: Yup.string()
				.required()
				.label("Competition"),
			_opposition: Yup.string()
				.required()
				.label("Opposition"),
			round: Yup.number()
				.min(1)
				.label("Round"),
			hideGame: Yup.bool().label("Hide Game"),
			customTitle: Yup.string().label("Title"),
			customHashtags: Yup.string().label("Hashtags"),
			isAway: Yup.string()
				.required()
				.label("Home/Away"),
			isNeutralGround: Yup.bool().label("Neutral Ground?"),
			_ground: Yup.string().label("Ground"),
			_broadcaster: Yup.string().label("Broadcaster"),
			_referee: Yup.string()
				.label("Referee")
				.nullable(),
			_video_referee: Yup.string()
				.label("Video Referee")
				.nullable(),
			externalSync: Yup.bool().label("Sync Externally?"),
			externalId: Yup.number().label("External ID")
		};

		if (!newState.isNew) {
			//Add a year limit to the game date
			const year = newState.game.date.getFullYear();
			const yearError = `Only dates in ${year} are valid for this game`;
			rawValidationSchema.date = rawValidationSchema.date
				.min(`${year}-01-01`, yearError)
				.max(`${year}-12-31`, yearError);

			//Add Score Override
			rawValidationSchema.scoreOverride = Yup.object().shape({
				[localTeam]: Yup.string().label(teamList[localTeam].name.short),
				[newState.game._opposition._id]: Yup.string().label(
					newState.game._opposition.name.short
				)
			});
		}

		newState.validationSchema = Yup.object().shape(rawValidationSchema);

		//Create dropdown options
		//Competitions and Teams will be rendered dynamically
		newState.options = {};
		newState.options._teamType = _.chain(teamTypes)
			.sortBy("sortOrder")
			.map(({ _id, name }) => ({ value: _id, label: name }))
			.value();

		const groundOptions = _.chain(groundList)
			.map(({ _id, name, address }) => ({
				value: _id,
				label: `${name}, ${address._city.name}`
			}))
			.sortBy("label")
			.value();
		newState.options._ground = [
			{ value: "auto", label: "Home Team's Ground" },
			...groundOptions
		];

		newState.options._referee = _.chain(peopleList)
			.filter(person => person.isReferee)
			.map(ref => ({
				value: ref._id,
				label: `${ref.name.first} ${ref.name.last}`
			}))
			.sortBy("label")
			.value();

		newState.options._broadcaster = _.chain(broadcasterList)
			.map(({ name, _id }) => ({ label: name, value: _id }))
			.sortBy("label")
			.value();

		newState.options.isAway = [
			{ label: "Home", value: false },
			{ label: "Away", value: true }
		];

		return newState;
	}

	getInitialValues() {
		const { localTeam } = this.props;
		const { game, isNew } = this.state;

		const defaultValues = {
			date: "",
			dateRange: "",
			time: "",
			_teamType: "",
			_competition: "",
			_opposition: "",
			round: "",
			hideGame: false,
			customTitle: "",
			customHashtags: [],
			isAway: "",
			isNeutralGround: false,
			_ground: "",
			_broadcaster: "",
			_referee: "",
			_video_referee: "",
			externalSync: false,
			externalId: ""
		};

		if (isNew) {
			return {
				...defaultValues,
				_ground: "auto"
			};
		} else {
			//Create a values object
			const values = _.mapValues(defaultValues, (defaultValue, key) => {
				let value;
				switch (key) {
					case "date":
						value = game.date.toString("yyyy-MM-dd");
						break;
					case "time":
						value = game.date.toString("HH:mm");
						break;
					case "_competition":
					case "_opposition":
					case "_referee":
					case "_broadcaster":
					case "_ground":
					case "_video_referee": {
						value = game[key] ? game[key]._id : null;
						break;
					}
					default:
						value = game[key];
						break;
				}
				return value != null ? value : defaultValue;
			});

			//Add on the score override fields
			values.scoreOverride = {};
			[localTeam, game._opposition._id].forEach(_team => {
				let value = "";
				if (game.scoreOverride && game.scoreOverride[_team] != null) {
					value = game.scoreOverride[_team];
				}
				values.scoreOverride[_team] = value;
			});

			return values;
		}
	}

	getFieldGroups(values) {
		const { localTeam } = this.props;
		const { game, isNew, options } = this.state;

		const dynamicOptions = getDynamicOptions(
			values,
			false,
			this.props,
			// For existing games, we pass in the year,
			// to prevent clearing the other read-only fields if
			// the date is cleared (firefox bug)
			isNew ? null : game.date.getFullYear()
		);

		const fieldGroups = [
			{
				fields: [
					{ name: "date", type: fieldTypes.date },
					{ name: "dateRange", type: fieldTypes.number },
					{ name: "time", type: fieldTypes.time },
					{
						name: "_teamType",
						type: fieldTypes.select,
						options: options._teamType,
						isDisabled: !isNew
					},
					{
						name: "_competition",
						type: fieldTypes.select,
						options: dynamicOptions._competition,
						isDisabled: !isNew || !values.date || !values._teamType,
						placeholder: dynamicOptions.placeholders._competition
					},
					{
						name: "_opposition",
						type: fieldTypes.select,
						options: dynamicOptions.teams,
						isDisabled: !values._competition || (!isNew && game.status > 0),
						placeholder: dynamicOptions.placeholders._team
					},
					{
						name: "round",
						type: fieldTypes.number
					},
					{
						name: "hideGame",
						type: fieldTypes.boolean
					}
				]
			},
			{
				label: "Venue",
				fields: [
					{ name: "isAway", type: fieldTypes.radio, options: options.isAway },
					{ name: "isNeutralGround", type: fieldTypes.boolean },
					{
						name: "_ground",
						type: fieldTypes.select,
						options: options._ground,
						isClearable: true
					}
				]
			},
			{
				label: "Media",
				fields: [
					{
						name: "customTitle",
						type: fieldTypes.text,
						placeholder: "Auto-generated if left blank"
					},
					{
						name: "customHashtags",
						type: fieldTypes.creatableSelect,
						formatCreateLabel: str => `Add #${str}`,
						isValidNewOption: val => val.match(/^[a-zA-Z]\w*$/),
						components: {
							NoOptionsMessage: props => (
								<div style={props.getStyles("noOptionsMessage", props)}>
									Hashtags must begin with a letter and can only contain letters
									and numbers
								</div>
							)
						},
						isMulti: true,
						placeholder: "Auto-generated if left blank"
					},
					{
						name: "_broadcaster",
						type: fieldTypes.select,
						options: options._broadcaster,
						isClearable: true,
						isSearchable: false
					}
				]
			},
			{
				label: "Referees",
				fields: [
					{
						name: "_referee",
						type: fieldTypes.select,
						options: options._referee,
						isClearable: true
					},
					{
						name: "_video_referee",
						type: fieldTypes.select,
						options: options._referee,
						isClearable: true
					}
				]
			},
			{
				label: "External Sync",
				fields: [
					{
						name: "externalSync",
						type: fieldTypes.boolean
					},
					{
						name: "externalId",
						type: fieldTypes.number
					}
				]
			}
		];

		if (!isNew) {
			const scoreOverrideFields = [
				{
					name: `scoreOverride.${localTeam}`,
					type: fieldTypes.number
				},
				{
					name: `scoreOverride.${game._opposition._id}`,
					type: fieldTypes.number
				}
			];

			if (game.isAway) {
				scoreOverrideFields.reverse();
			}

			fieldGroups.push({
				label: "Score Override",
				fields: scoreOverrideFields
			});
		}

		return fieldGroups;
	}

	alterValuesBeforeSubmit(values) {
		//Fix date/time
		values.date = `${values.date} ${values.time}`;
		delete values.time;

		//Filter score override
		if (values.scoreOverride) {
			values.scoreOverride = _.map(values.scoreOverride, (points, _team) => ({
				points,
				_team
			})).filter(({ points }) => points !== null);
		}
	}

	render() {
		const { game, isNew, isLoading, validationSchema } = this.state;
		const { createGame, updateGame, deleteGame } = this.props;

		if (isLoading) {
			return <LoadingPage />;
		}

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createGame(values),
				redirectOnSubmit: id => `/admin/game/${id}`
			};
		} else {
			formProps = {
				onSubmit: values => updateGame(game._id, values),
				onDelete: () => deleteGame(game._id),
				redirectOnDelete: "/admin/games"
			};
		}

		return (
			<BasicForm
				alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
				enableRedirectBoolean={isNew}
				fastFieldByDefault={false}
				fieldGroups={values => this.getFieldGroups(values)}
				initialValues={this.getInitialValues()}
				isNew={isNew}
				itemType="Game"
				validationSchema={validationSchema}
				{...formProps}
			/>
		);
	}
}

//Add Redux Support
function mapStateToProps({ broadcasters, teams, competitions, games, grounds, people, config }) {
	const { broadcasterList } = broadcasters;
	const { teamTypes, teamList } = teams;
	const { competitionSegmentList } = competitions;
	const { fullGames } = games;
	const { groundList } = grounds;
	const { peopleList } = people;
	const { localTeam } = config;

	return {
		broadcasterList,
		teamTypes,
		teamList,
		fullGames,
		competitionSegmentList,
		groundList,
		peopleList,
		localTeam
	};
}
// export default form;
export default withRouter(
	connect(mapStateToProps, {
		fetchBroadcasters,
		fetchCompetitionSegments,
		fetchAllGrounds,
		fetchPeopleList,
		createGame,
		updateGame,
		deleteGame
	})(AdminGameOverview)
);
