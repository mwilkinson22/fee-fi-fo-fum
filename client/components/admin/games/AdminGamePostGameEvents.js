//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { FieldArray } from "formik";

//Components
import SocialPostThreader from "~/client/components/social/SocialPostThreader";

//Actions
import { previewPostGameEventImage, submitPostGameEvents } from "~/client/actions/gamesActions";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";
import * as Yup from "yup";
import { renderField } from "~/helpers/formHelper";

class AdminGamePostGameEvents extends Component {
	constructor(props) {
		super(props);

		//Get the game object
		const { match, fullGames, previewPostGameEventImage } = props;
		const game = fullGames[match.params._id];

		//First, create all the dropdown selector options we need
		const options = this.defineOptions(game);

		//Then, define all the variables we'll need
		const variables = this.defineVariables(game);

		//Then, define each individual field we'll call upon within
		//the custom post types
		const additionalFields = this.defineFields(options);

		//Define the custom post types
		const postTypes = this.definePostTypes(game, additionalFields, variables);

		//Loop through the postTypes and standardise them
		for (const key in postTypes) {
			//Get post type
			const postType = postTypes[key];

			//Convert "additionalFields" array to relevant values
			if (postType.additionalFields) {
				postType.additionalFieldGroups = [];
				postType.additionalFieldInitialValues = {};
				postType.additionalFieldValidationSchema = {};
				postType.additionalFieldsComeAfter = true;
				postType.additionalFields.forEach(field => {
					postType.additionalFieldGroups.push(...field.fieldGroups);
					postType.additionalFieldInitialValues[field.key] = field.initialValue;
					postType.additionalFieldValidationSchema[field.key] = field.validation;
				});
			}
			delete postType.additionalFields;

			//Ensure we have initialContent and add game hashtags
			if (!postType.initialContent) {
				postType.initialContent = "";
			}
			postType.initialContent += `\n\n`;
			postType.initialContent += game.hashtags.map(t => `#${t}`).join(" ");

			//Add Preview Image callback
			postType.getPreviewImage = data => previewPostGameEventImage(game._id, data);

			//Add Variables
			postType.variables = variables;
		}

		this.state = { postTypes };
	}

	defineOptions(game) {
		const { teamList } = this.props;

		const options = {};

		// Team Stats
		//
		// The standard playerStatType entries,
		// grouped by Scoring, Attack and Defence
		options.teamStats = _.chain(playerStatTypes)
			.mapValues((stat, value) => ({
				value,
				label: stat.plural,
				group: stat.type
			}))
			.groupBy("group")
			.map((options, label) => ({ label, options: _.sortBy(options, "label") }))
			.value();

		// Player Stats
		//
		// Essentially the same as Team Stats
		// but potentially with Player of the Match
		// wins and Man/Woman of Steel points
		options.playerStats = [...options.teamStats];
		const playerAwards = [];
		if (game._potm) {
			playerAwards.push({ label: `${game.genderedString} of the Match`, value: "potm" });
		}
		if (game.fan_potm && game.fan_potm_winners) {
			playerAwards.push({
				label: `Fans' ${game.genderedString} of the Match`,
				value: "fan_potm"
			});
		}
		if (game.manOfSteel && game.manOfSteel.length) {
			playerAwards.push({ label: `${game.genderedString} of Steel Points`, value: "steel" });
		}
		if (playerAwards.length) {
			options.playerStats.push({ label: "Awards", options: playerAwards });
		}

		// Players
		//
		// Grouped by team, ordered by position
		options.players = convertTeamToSelect(game, teamList);

		return options;
	}

	defineVariables(game) {
		const { baseUrl, localTeam } = this.props;
		const variables = _.chain(game.playerStats)
			//Local Team players only
			.filter(({ _team }) => _team == localTeam)
			//Get eligiblePlayers entry
			.map(({ _player }) =>
				game.eligiblePlayers[localTeam].find(p => p._player._id == _player)
			)
			//Remove those without Twitter
			.filter(({ _player }) => _player.twitter)
			//Sort
			.sortBy(p => p.number || p.name.last)
			//Convert to label/value pair
			.map(p => ({
				value: `@${p._player.twitter}`,
				label: `${p.number ? `${p.number}. ` : ""} ${p._player.name.full}`
			}))
			.value();

		//Add in the game page url
		variables.unshift({ value: `${baseUrl}/games/${game.slug}`, label: "Game Page" });

		return variables;
	}

	defineFields(options) {
		// Here, we define all the additional fields, to be called upon by the
		// different post types. Each one will have the following properties:
		// fieldGroups: array
		// initialValues: mixed
		// validation: object
		// we map in the name at the end
		const fields = {};

		//A single-choice player field
		fields._player = {
			fieldGroups: [
				{
					fields: [
						{
							name: "_player",
							type: fieldTypes.select,
							options: options.players,
							isNested: true
						}
					]
				}
			],
			initialValue: null,
			validation: Yup.string()
				.label("Player")
				.required()
		};

		//Set some basics for the stat dropdowns
		const statDropdownTemplate = {
			type: fieldTypes.select,
			closeMenuOnSelect: false,
			isMulti: true,
			isNested: true
		};

		//Team Stats
		fields.teamStats = {
			fieldGroups: [
				{
					fields: [
						{ name: "teamStats", ...statDropdownTemplate, options: options.teamStats }
					]
				},
				{
					render: values => this.renderBulkAddStatButtons(values)
				}
			],
			initialValue: [],
			validation: Yup.array()
				.of(Yup.string())
				.min(1)
				.label("Stats")
		};

		//Player Stats
		fields.playerStats = {
			fieldGroups: [
				{
					fields: [
						{
							name: "playerStats",
							...statDropdownTemplate,
							options: options.playerStats
						}
					]
				}
			],
			initialValue: [],
			validation: Yup.array()
				.of(Yup.string())
				.min(1)
				.max(10)
				.label("Stats")
		};

		// We'll have two "playersAndStats" field types. One will be fixed (where
		// the players are predetermined, i.e. for Man of Steel, or Man of the Match)
		// and one will be open. So we split this off into its own method
		fields.playersAndStats = (fixed, players) =>
			this.renderPlayersAndStats(options, fixed, players);

		//Custom Header for multi-player posts
		fields.customHeader = {
			fieldGroups: [
				{
					fields: [{ name: "customHeader", type: fieldTypes.text }]
				}
			],
			initialValue: "",
			validation: Yup.string()
				.label("Custom Header")
				.nullable()
		};

		//Map in the key
		for (const key in fields) {
			//For function fields, we need to manually assign the key!
			if (typeof fields[key] === "object") {
				fields[key].key = key;
			}
		}

		return fields;
	}

	definePostTypes(game, fields) {
		const postTypes = {};

		//Match Breakdown Intro
		postTypes["breakdown-intro"] = {
			initialContent: `Let's look at our game against ${game._opposition.name.short} in a little more detail!`,
			label: "Match Breakdown Intro"
		};

		//Team Stats
		postTypes["team-stats"] = {
			additionalFields: [fields.teamStats],
			group: "Stats",
			label: "Team Stats"
		};

		//Single Player Stats
		postTypes["player-stats"] = {
			additionalFields: [fields._player, fields.playerStats],
			group: "Stats",
			label: "Player Stats"
		};

		//Multiple Player Stats
		postTypes["grouped-player-stats"] = {
			additionalFields: [fields.customHeader, fields.playersAndStats(false)],
			group: "Stats",
			label: "Multiple Player Stats"
		};

		//Standard League Table
		if (game._competition.type === "League") {
			postTypes["league-table"] = {
				group: "League",
				label: "League Table"
			};

			//Min-max league table
			const { instance } = game._competition;
			if (instance.totalRounds && instance.leagueTableColours) {
				postTypes["min-max-league-table"] = {
					group: "League",
					label: "Min/Max League Table"
				};
			}
		}

		//Fans' Player of the Match
		if (game.fan_potm && game.fan_potm.options && game.fan_potm.options.length) {
			postTypes["fan-potm-options"] = {
				additionalFields: [fields.playersAndStats(true, game.fan_potm.options)],
				group: "Awards",
				label: `Fans' ${game.genderedString} of the Match`
			};
		}

		//Man/Woman of Steel
		if (game.manOfSteel && game.manOfSteel.length) {
			const players = game.manOfSteel.map(p => p._player);
			postTypes["steel-points"] = {
				additionalFields: [fields.playersAndStats(true, players)],
				group: "Awards",
				label: `${game.genderedString} of Steel Points`
			};
		}
		return postTypes;
	}

	renderPlayersAndStats(options, fixed, players = [""]) {
		//Validation Schema
		const validation = Yup.array()
			.of(
				Yup.object().shape({
					_player: Yup.string()
						.required()
						.label("Player"),
					stats: Yup.array()
						.of(Yup.string())
						.min(1)
						.label("Stats")
				})
			)
			.min(1);

		//Convert validation to schema
		const schema = Yup.object().shape({
			playersAndStats: validation
		});

		const render = values => {
			//Create Array to hold the fields
			const fields = [];

			//Loop the current values (if we have any)
			if (values.playersAndStats) {
				values.playersAndStats.forEach((data, i) => {
					fields.push(
						//Player selector
						{
							name: `playersAndStats.${i}._player`,
							type: fieldTypes.select,
							options: options.players,
							isNested: true
						},
						//Stat selector
						{
							name: `playersAndStats.${i}.stats`,
							type: fieldTypes.select,
							options: options.playerStats,
							closeMenuOnSelect: false,
							isNested: true,
							isMulti: true
						}
					);

					//For non-fixed versions of the field, add reorder/remove buttons
					if (!fixed) {
						fields.push({
							name: `playersAndStats`,
							type: fieldTypes.fieldArray,
							key: `playersAndStats.${i}.fieldArray`,
							render: ({ move, remove }) => (
								<div className="buttons">
									<button type="button" onClick={() => remove(i)}>
										Remove Player
									</button>
									<div>
										<button
											onClick={() => move(i, i + 1)}
											disabled={i == values.playersAndStats.length - 1}
											type="button"
										>
											&#9660;
										</button>
										<button
											onClick={() => move(i, i - 1)}
											disabled={i == 0}
											type="button"
										>
											&#9650;
										</button>
									</div>
									<hr />
								</div>
							)
						});
					}
				});
			}

			//Finally, push in an "Add" button
			if (!fixed) {
				fields.push({
					name: `playersAndStats`,
					type: fieldTypes.fieldArray,
					key: `playersAndStats.add`,
					render: ({ push }) => (
						<div className="buttons">
							<button type="button" onClick={() => push({ _player: "", stats: [] })}>
								Add Player
							</button>
						</div>
					)
				});
			}

			return fields.map(field => renderField(field, schema));
		};

		return {
			fieldGroups: [{ render }],
			initialValue: players.map(_player => ({ _player, stats: [] })),
			key: "playersAndStats",
			validation
		};
	}

	renderBulkAddStatButtons(values) {
		const fieldName = "teamStats";
		return (
			<FieldArray name={fieldName}>
				{({ push }) => {
					//Get stats grouped by type
					const groupedStats = _.chain(playerStatTypes)
						.map((stat, key) => ({ ...stat, key }))
						.groupBy("type")
						.mapValues(s => _.map(s, "key"))
						.value();

					//Create Buttons
					const buttons = [];
					for (const label in groupedStats) {
						buttons.push(
							<button
								key={label}
								type="button"
								onClick={() => {
									groupedStats[label]
										.filter(key => values[fieldName].indexOf(key) === -1)
										.map(push);
								}}
							>
								{label} Stats
							</button>
						);
					}
					return [
						<label key="label">Quick add</label>,
						<div key="buttons" className="button-group">
							{buttons}
						</div>
					];
				}}
			</FieldArray>
		);
	}

	render() {
		const { match, submitPostGameEvents } = this.props;
		const { postTypes } = this.state;
		return (
			<SocialPostThreader
				customPostTypes={postTypes}
				onSubmit={values => submitPostGameEvents(match.params._id, values)}
			/>
		);
	}
}

AdminGamePostGameEvents.propTypes = {};
AdminGamePostGameEvents.defaultProps = {};

function mapStateToProps({ config, games, teams }) {
	const { baseUrl, localTeam } = config;
	const { fullGames } = games;
	const { teamList } = teams;
	return { fullGames, baseUrl, localTeam, teamList };
}

export default connect(mapStateToProps, {
	previewPostGameEventImage,
	submitPostGameEvents
})(AdminGamePostGameEvents);
