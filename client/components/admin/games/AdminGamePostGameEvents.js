//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Prompt } from "react-router-dom";
import { Formik, Form, FieldArray } from "formik";
import Select from "react-select";
import * as Yup from "yup";

//Components
import LoadingPage from "../../LoadingPage";
import DeleteButtons from "../fields/DeleteButtons";

//Actions
import { previewPostGameEventImage } from "~/client/actions/gamesActions";
import { fetchProfiles } from "~/client/actions/socialActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import playerStatTypes from "~/constants/playerStatTypes";
import selectStyling from "~/constants/selectStyling";

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";
import { renderFieldGroup, getTouchedNestedErrors } from "~/helpers/formHelper";

class AdminGamePostGameEvents extends Component {
	constructor(props) {
		super(props);
		const { profiles, fetchProfiles } = props;

		//Get Social Media Profiles
		if (!profiles) {
			fetchProfiles();
		}

		//An array of all potential extra fields to be added to an event type
		//Requires a key, a Yup validation object, and an events array
		//All potential extra fields, and where they'll appear
		const extraFields = {
			_player: ["player-stats"],
			stats: ["team-stats", "player-stats"],
			playersAndStats: ["grouped-player-stats", "fan-potm-options", "steel-points"]
		};

		//Validation Schema
		const tweetValidationSchema = {
			text: Yup.string().label("Tweet Text"),
			stats: Yup.array()
				.of(Yup.string())
				.when("eventType", (eventType, schema) => {
					if (extraFields.stats.indexOf(eventType) > -1) {
						return schema.min(1);
					} else {
						return schema;
					}
				})
				//10 is a sensible limit for team stats, but a necessary one
				//for player stats.
				.max(10)
				.label("Stats"),
			_player: Yup.string()
				.when("eventType", (eventType, schema) => {
					if (extraFields._player.indexOf(eventType) > -1) {
						return schema.required();
					} else {
						return schema;
					}
				})
				.label("Player"),
			playersAndStats: Yup.array()
				.of(
					Yup.object().shape({
						_player: Yup.string()
							.required()
							.label("Player"),
						stats: Yup.array()
							.of(Yup.string())
							.label("Stats")
					})
				)
				.when("eventType", (eventType, schema) => {
					if (extraFields.playersAndStats.indexOf(eventType) > -1) {
						return schema.min(1);
					} else {
						return schema;
					}
				})
		};

		//Loop through
		const validationSchema = {
			replyTweet: Yup.string().label("Reply To (Tweet Id)"),
			_profile: Yup.string()
				.required()
				.label("Profile"),
			postToFacebook: Yup.boolean().label("Post To Facebook"),
			tweets: Yup.array()
				.of(Yup.object().shape(tweetValidationSchema))
				.min(1)
		};

		this.state = {
			extraFields,
			previewImages: {},
			validationSchema: Yup.object().shape(validationSchema)
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fullGames, match, profiles } = nextProps;
		const newState = { isLoading: false };

		//Check everything is loaded
		if (!profiles) {
			newState.isLoading = true;
			return newState;
		}

		//Get Game
		newState.game = fullGames[match.params._id];

		//On game change
		if (!prevState.game || prevState.game._id != match.params._id) {
			//Get Event Types
			const { genderedString } = newState.game;
			newState.eventTypes = [
				{ label: "Text Only", value: "text-only" },
				{ label: "Match Breakdown Intro", value: "breakdown-intro" },
				{ label: "Team Stats", value: "team-stats" },
				{ label: "Single Player Stats", value: "player-stats" },
				{ label: "Multiple Player Stats", value: "grouped-player-stats" }
			];

			//Conditionally add Man of Steel and Fans' POTM event types
			if (newState.game.manOfSteel && newState.game.manOfSteel.length) {
				newState.eventTypes.push({
					label: `${genderedString} of Steel Points`,
					value: "steel-points"
				});
			}
			if (newState.game.fan_potm) {
				if (newState.game.fan_potm.options.length) {
					newState.eventTypes.push({
						label: `Fans' ${genderedString} of the Match Options`,
						value: "fan-potm-options"
					});
				}
				if (newState.game.fan_potm_winners && newState.game.fan_potm_winners.length) {
					newState.eventTypes.push({
						label: `Fans' ${genderedString} of the Match Winner`,
						value: "fan-potm"
					});
				}
			}

			//Ensure an event type is selected for the dropdown
			if (!prevState.newEventType) {
				newState.newEventType = newState.eventTypes[0];
			}

			//Dropdown Options
			newState.options = AdminGamePostGameEvents.getDropdownOptionsFromProps(
				nextProps,
				newState.game
			);
		}

		return newState;
	}

	static getDropdownOptionsFromProps(props, game) {
		const { profiles, teamList } = props;
		const options = {};

		//Social Profile Options
		options.profiles = _.chain(profiles)
			.reject("archived")
			.map(({ name, _id }) => ({ value: _id, label: name }))
			.sortBy("label")
			.value();

		//Stat Types
		options.stats = _.chain(playerStatTypes)
			.mapValues((stat, value) => ({
				value,
				label: stat.plural,
				group: stat.type
			}))
			.groupBy("group")
			.map((options, label) => ({ label, options: _.sortBy(options, "label") }))
			.value();

		//Players
		options.players = convertTeamToSelect(game, teamList);

		return options;
	}

	getInitialValues() {
		const { defaultProfile } = this.props;
		const { options } = this.state;

		return {
			replyTweet: "",
			_profile: defaultProfile || options.profiles[0].value,
			postToFacebook: false,
			tweets: []
		};
	}

	getNewTweetInitialValues(eventType) {
		const { game } = this.state;
		const fields = { eventType, text: "", stats: [], _player: "", playersAndStats: [] };

		switch (eventType) {
			case "breakdown-intro":
				fields.text = `Let's look at our game against ${game._opposition.name.short} in a little more detail!`;
				break;
			case "fan-potm-options":
				fields.playersAndStats = game.fan_potm.options.map(_player => ({
					_player,
					stats: []
				}));
				break;
			default:
				break;
		}

		//Add hashtags
		fields.text += "\n\n";
		fields.text += game.hashtags.map(t => `#${t}`).join(" ");

		return fields;
	}

	getTweetFields({ eventType, playersAndStats, stats }) {
		const { extraFields, game, options } = this.state;

		//Set standard fields
		const fields = [{ name: "text", type: fieldTypes.tweet }];

		//Loop through extras
		for (const name in extraFields) {
			const validEventTypes = extraFields[name];
			if (validEventTypes.indexOf(eventType) > -1) {
				switch (name) {
					case "_player":
						fields.push({
							name,
							type: fieldTypes.select,
							options: options.players,
							isNested: true
						});
						break;
					case "stats":
						fields.push(
							{
								name,
								type: fieldTypes.select,
								options: options.stats,
								closeMenuOnSelect: false,
								isNested: true,
								isMulti: true
							},
							{
								name,
								type: fieldTypes.fieldArray,
								render: ({ push }) => {
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
														.filter(key => stats.indexOf(key) === -1)
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
								}
							}
						);
						break;
					case "playersAndStats":
						{
							if (eventType == "grouped-player-stats") {
								playersAndStats.forEach((data, i) => {
									fields.push(
										{
											name: `playersAndStats.${i}._player`,
											type: fieldTypes.select,
											options: options.players,
											isNested: true
										},
										{
											name: `playersAndStats.${i}.stats`,
											type: fieldTypes.select,
											options: options.stats,
											closeMenuOnSelect: false,
											isNested: true,
											isMulti: true
										},
										{
											name: `playersAndStats`,
											type: fieldTypes.fieldArray,
											key: `playersAndStats.${i}.fieldArray`,
											render: ({ remove }) => (
												<div className="buttons">
													<button type="button" onClick={() => remove(i)}>
														Remove Player
													</button>
													<hr />
												</div>
											)
										}
									);
								});
								fields.push({
									name: `playersAndStats`,
									type: fieldTypes.fieldArray,
									key: `playersAndStats.add`,
									render: ({ push }) => (
										<div className="buttons">
											<button
												type="button"
												onClick={() => push({ _player: "", stats: [] })}
											>
												Add Player
											</button>
										</div>
									)
								});
							} else {
								playersAndStats.forEach((data, i) => {
									const { _player } = _.chain(game.eligiblePlayers)
										.values()
										.flatten()
										.find(({ _player }) => _player._id == data._player)
										.value();

									fields.push({
										name: `playersAndStats.${i}.stats`,
										type: fieldTypes.select,
										options: options.stats,
										isNested: true,
										isMulti: true,
										label: `${_player.name.full} Stats`
									});
								});
							}
						}
						break;
				}
			}
		}

		return fields;
	}

	async getPreview(i, data) {
		const { previewPostGameEventImage } = this.props;
		const { game, previewImages } = this.state;

		//Disable preview buttons and
		//set corresponding image to "loading"
		this.setState({
			isLoadingPreview: true,
			previewImages: { ...previewImages, [i]: "loading" }
		});

		//Load image
		const result = await previewPostGameEventImage(game._id, data);

		//Add to state
		this.setState({
			isLoadingPreview: false,
			previewImages: { ...previewImages, [i]: result }
		});
	}

	renderThreadDetails() {
		const { options, validationSchema } = this.state;
		const fields = [
			{
				name: "_profile",
				type: fieldTypes.select,
				options: options.profiles,
				isSearchable: false
			},
			{
				name: "replyTweet",
				type: fieldTypes.text
			},
			{
				name: "postToFacebook",
				type: fieldTypes.boolean
			}
		];
		return <div className="form-card grid">{renderFieldGroup(fields, validationSchema)}</div>;
	}

	renderTweets({ errors, values }) {
		const { eventTypes, isLoadingPreview, previewImages, validationSchema } = this.state;
		return values.tweets.map((tweet, i) => {
			//Get Event Type as a string
			const eventTypeLabel = eventTypes.find(({ value }) => value == tweet.eventType).label;

			//Get "Movement" buttons
			const movementButtons = (
				<FieldArray
					name="tweets"
					render={({ move }) => (
						<div>
							<button
								onClick={() => {
									//Set Destination
									const destination = i + 1;

									//Move Tweet
									move(i, destination);

									//Move Images
									this.setState({
										previewImages: {
											...previewImages,
											[i]: previewImages[destination],
											[destination]: previewImages[i]
										}
									});
								}}
								disabled={i == values.tweets.length - 1}
								type="button"
							>
								&#9660;
							</button>
							<button
								onClick={() => {
									//Set Destination
									const destination = i - 1;

									//Move Tweet
									move(i, destination);

									//Move Images
									this.setState({
										previewImages: {
											...previewImages,
											[i]: previewImages[destination],
											[destination]: previewImages[i]
										}
									});
								}}
								disabled={i == 0}
								type="button"
							>
								&#9650;
							</button>
						</div>
					)}
				/>
			);

			//Get fields
			const fields = this.getTweetFields(tweet).map(field => ({
				...field,
				name: ["tweets", i, field.name].join(".")
			}));

			//Get Preview Section
			let preview;
			if (tweet.eventType !== "plain-text") {
				preview = [
					<div className="buttons" key="preview-button">
						<button
							type="button"
							disabled={isLoadingPreview || (errors.tweets && errors.tweets[i])}
							onClick={() => this.getPreview(i, tweet)}
						>
							Preview Image
						</button>
						<button
							type="button"
							disabled={!previewImages[i] || previewImages[i] === "loading"}
							onClick={() =>
								this.setState({
									previewImages: { ...previewImages, [i]: null }
								})
							}
						>
							Clear Preview
						</button>
					</div>
				];

				if (previewImages[i] === "loading") {
					preview.push(<LoadingPage key="loading" className="full-span" />);
				} else if (previewImages[i]) {
					preview.push(
						<img
							src={previewImages[i]}
							className="full-span preview-image"
							key="preview-image"
						/>
					);
				}
			}

			//Get "delete" fields
			const deleteButtons = (
				<FieldArray
					name="tweets"
					render={({ remove }) => (
						<DeleteButtons
							deleteText="Remove from Thread"
							onDelete={() => {
								remove(i);
								this.setState({
									previewImages: { ...previewImages, [i]: null }
								});
							}}
						/>
					)}
				/>
			);

			return (
				<div className="form-card grid" key={i}>
					{movementButtons}
					<strong>
						Tweet {i + 1} of {values.tweets.length} - {eventTypeLabel}
					</strong>
					{renderFieldGroup(fields, validationSchema)}
					{preview}
					{deleteButtons}
				</div>
			);
		});
	}

	renderAddButton() {
		const { eventTypes, newEventType } = this.state;
		return (
			<div className="form-card grid">
				<h6>Add To Thread</h6>
				<label>Event Type</label>
				<Select
					onChange={newEventType => this.setState({ newEventType })}
					options={eventTypes}
					styles={selectStyling}
					value={newEventType}
				/>
				<div className="buttons">
					<FieldArray
						name="tweets"
						render={({ push }) => (
							<button
								onClick={() =>
									push(this.getNewTweetInitialValues(newEventType.value))
								}
								type="button"
							>
								Add Tweet
							</button>
						)}
					/>
				</div>
			</div>
		);
	}

	renderErrors({ errors, touched }) {
		const filteredErrors = getTouchedNestedErrors(errors, touched);

		const tweetsWithErrors = _.chain(filteredErrors)
			//Get Array of Keys
			.keys()
			//Filter to just tweets
			.filter(key => key.match(/^tweets./))
			//Pull off tweet number
			.map(key => Number(key.split(".")[1]))
			//Get a unique, sorted list
			.uniq()
			.sort()
			//Move from 0-index to 1-index
			.map(num => ++num)
			.value();

		if (tweetsWithErrors.length) {
			let text = "Please correct errors in ";
			if (tweetsWithErrors.length === 1) {
				text += `Tweet ${tweetsWithErrors[0]}`;
			} else {
				const lastTweetNumber = tweetsWithErrors.pop();
				text += `Tweets ${tweetsWithErrors.join(", ")} & ${lastTweetNumber}`;
			}
			text += " before submitting";

			return <span className="error">{text}</span>;
		}
	}

	render() {
		const { isLoading, validationSchema } = this.state;
		if (isLoading) {
			return <LoadingPage />;
		}
		return (
			<Formik
				initialValues={this.getInitialValues()}
				onSubmit={() => {}}
				validationSchema={validationSchema}
				render={formikProps => {
					return (
						<Form>
							<Prompt
								when={formikProps.values.tweets.length > 0}
								message="You have unsaved changes. Are you sure you want to navigate away?"
							/>
							<div className="admin-post-game-events">
								{this.renderTweets(formikProps)}
								{this.renderAddButton()}
								{this.renderThreadDetails()}
								<div className="form-card">
									{this.renderErrors(formikProps)}
									<div className="buttons">
										<button type="reset">Clear</button>
										<button
											type="submit"
											className="confirm"
											disabled={formikProps.values.tweets.length === 0}
										>
											Submit
										</button>
									</div>
								</div>
							</div>
						</Form>
					);
				}}
			/>
		);
	}
}

AdminGamePostGameEvents.propTypes = {};
AdminGamePostGameEvents.defaultProps = {};

function mapStateToProps({ games, social, teams }) {
	const { fullGames } = games;
	const { profiles, defaultProfile } = social;
	const { teamList } = teams;
	return { fullGames, profiles, defaultProfile, teamList };
}

export default connect(mapStateToProps, { fetchProfiles, previewPostGameEventImage })(
	AdminGamePostGameEvents
);
