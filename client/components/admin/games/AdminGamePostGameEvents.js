//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, FieldArray } from "formik";
import Select from "react-select";
import * as Yup from "yup";

//Components
import LoadingPage from "../../LoadingPage";
import DeleteButtons from "../fields/DeleteButtons";

//Actions
import { fetchProfiles } from "~/client/actions/socialActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import playerStatTypes from "~/constants/playerStatTypes";
import selectStyling from "~/constants/selectStyling";

//Helpers
import { renderFieldGroup } from "~/helpers/formHelper";

class AdminGamePostGameEvents extends Component {
	constructor(props) {
		super(props);
		const { profiles, fetchProfiles } = props;

		//Get Social Media Profiles
		if (!profiles) {
			fetchProfiles();
		}

		//An array of all potential extra fields to be added to an event type
		//Requires a key, a label (to pass into Yup), and an events array
		const extraFields = [
			{ key: "stats", label: "Stat Types", events: ["team-stats", "player-stats"] },
			{ key: "_player", label: "Player", events: ["single-player-stats"] },
			{
				key: "multi-stats",
				label: "",
				events: ["multi-player-stats", "fan-potm-oprions", "steel-points"]
			}
		];

		this.state = {
			extraFields
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fullGames, match, profiles } = nextProps;
		const newState = { isLoading: false };

		//Get Game
		newState.game = fullGames[match.params._id];

		//Get Event Types
		const { genderedString } = newState.game;
		newState.eventTypes = [
			{ label: "Match Breakdown Intro", value: "breakdown-intro" },
			{ label: "Team Stats", value: "team-stats" },
			{ label: "Single Player Stats", value: "player-stats" },
			{ label: "Multiple Player Stats", value: "multi-player-stats" },
			{ label: `Fans' ${genderedString} of the Match Options`, value: "fan-potm-options" },
			{ label: `${genderedString} of Steel Points`, value: "steel-points" }
		];

		//Ensure an event type is selected for the dropdown
		if (!prevState.newEventType) {
			newState.newEventType = newState.eventTypes[0];
		}

		//Check everything is loaded
		if (!profiles) {
			newState.isLoading = true;
			return newState;
		}

		//Dropdown Options
		newState.options = AdminGamePostGameEvents.getDropdownOptionsFromProps(nextProps);

		//Validation Schema
		const validationSchema = {
			replyTweet: Yup.string().label("Reply To (Tweet Id)"),
			_profile: Yup.string()
				.required()
				.label("Profile"),
			postToFacebook: Yup.boolean().label("Post To Facebook"),
			tweets: Yup.array()
				.of(
					Yup.object().shape({
						text: Yup.string().label("Tweet Text"),
						stats: Yup.array()
							.of(Yup.string())
							.label("Stats")
					})
				)
				.min(1)
		};

		newState.validationSchema = Yup.object().shape(validationSchema);

		return newState;
	}

	static getDropdownOptionsFromProps(props) {
		const { profiles } = props;
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
		const fields = { eventType, text: "" };

		switch (eventType) {
			case "breakdown-intro":
				fields.text = `Let's look at our game against ${game._opposition.name.short} in a little more detail!`;
				break;
			case "team-stats":
				fields.stats = [];
				break;
			default:
				break;
		}

		//Add hashtags
		fields.text += "\n\n";
		fields.text += game.hashtags.map(t => `#${t}`).join(" ");

		return fields;
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

	renderTweets(values) {
		const { eventTypes, options, validationSchema } = this.state;
		return values.tweets.map((tweet, i) => {
			//Get Event Type as a string
			const eventType = eventTypes.find(({ value }) => value == tweet.eventType).label;

			//Get "Movement" buttons
			const movementButtons = (
				<FieldArray
					name="tweets"
					render={({ move }) => (
						<div>
							<button
								onClick={() => move(i, i + 1)}
								disabled={i == values.tweets.length - 1}
								type="button"
							>
								&#9660;
							</button>
							<button onClick={() => move(i, i - 1)} disabled={i == 0} type="button">
								&#9650;
							</button>
						</div>
					)}
				/>
			);

			//Get "delete" fields
			const deleteButtons = (
				<FieldArray
					name="tweets"
					render={({ remove }) => (
						<DeleteButtons deleteText="Remove from Thread" onDelete={() => remove(i)} />
					)}
				/>
			);

			//Get standard fields
			let fields = [{ name: "text", type: fieldTypes.tweet }];

			//Add more, based on eventType
			switch (tweet.eventType) {
				case "single-player-stats":
				case "team-stats":
					fields.push({
						name: "stats",
						type: fieldTypes.select,
						isMulti: true,
						isSearchable: false,
						isNested: true,
						options: options.stats
					});
					break;
				default:
					break;
			}

			//Prepend tweet number
			fields = fields.map(field => ({ ...field, name: ["tweets", i, field.name].join(".") }));

			return (
				<div className="form-card grid" key={i}>
					{movementButtons}
					<strong>
						Tweet {i + 1} of {values.tweets.length} - {eventType}
					</strong>
					{renderFieldGroup(fields, validationSchema)}
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
				render={({ isValid, values }) => {
					return (
						<Form>
							{this.renderThreadDetails()}
							{this.renderTweets(values)}
							{this.renderAddButton()}
							<div className="form-card">
								<div className="buttons">
									<button type="reset">Clear</button>
									<button type="submit" className="confirm" disabled={!isValid}>
										Submit
									</button>
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

function mapStateToProps({ games, social }) {
	const { fullGames } = games;
	const { profiles, defaultProfile } = social;
	return { fullGames, profiles, defaultProfile };
}

export default connect(mapStateToProps, { fetchProfiles })(AdminGamePostGameEvents);
