//Modules
import _ from "lodash";
import React, { Component } from "react";
import { Formik, Form } from "formik";
import { connect } from "react-redux";
import * as Yup from "yup";

//Actions
import { postGameEvent, previewPlayerEventImage } from "~/client/actions/gamesActions";
import { fetchProfiles } from "~/client/actions/socialActions";

//Components
import LoadingPage from "../../LoadingPage";
import AdminGameEventList from "./AdminGameEventList";

//Constants
import gameEvents from "~/constants/gameEvents";
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";
import { renderFieldGroup } from "~/helpers/formHelper";

class AdminGameEvent extends Component {
	constructor(props) {
		super(props);
		const { profiles, fetchProfiles } = props;

		//Get Social Media Profiles
		if (!profiles) {
			fetchProfiles();
		}

		const validationSchema = Yup.object().shape({
			_profile: Yup.mixed()
				.required()
				.label("Profile"),
			event: Yup.mixed()
				.required()
				.label("Event"),
			player: Yup.mixed()
				.test("isRequired", "Please select a player", function(player) {
					const { event } = this.parent;
					const { isPlayerEvent } = gameEvents[event];
					return !isPlayerEvent || player;
				})
				.label("Player"),
			postTweet: Yup.boolean().label("Post to Social?"),
			tweet: Yup.string().label("Tweet"),
			replyTweet: Yup.string().label("Reply To Tweet")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullGames, localTeam, match, profiles, teamList } = nextProps;
		const newState = { isLoading: false };

		//Get Game
		newState.game = fullGames[match.params._id];

		//Check everything is loaded
		if (!profiles) {
			newState.isLoading = true;
			return newState;
		}

		//Dropdown Options
		newState.options = {};

		//Social Profile Options
		newState.options.profiles = _.chain(profiles)
			.reject("archived")
			.map(({ name, _id }) => ({ value: _id, label: name }))
			.sortBy("label")
			.value();

		//Event Types
		newState.options.event = [
			{ label: "None", value: "none" },
			{
				label: "Player Events",
				options: [
					{ label: "Try", value: "T" },
					{ label: "Conversion", value: "CN" },
					{ label: "Penalty Goal", value: "PK" },
					{ label: "Drop Goal", value: "DG" },
					{ label: "40/20", value: "FT" },
					{ label: "Yellow Card", value: "YC" },
					{ label: "Red Card", value: "RC" },
					{ label: "Man of the Match", value: "motm" },
					{ label: "Fans' Man of the Match", value: "fan_motm" }
				]
			},
			{
				label: "Game Events",
				options: [
					{ label: "Kick Off", value: "kickOff" },
					{ label: "Half Time", value: "halfTime" },
					{ label: "Extra Time", value: "extraTime" },
					{ label: "Full Time", value: "fullTime" }
				]
			}
		];

		//People
		newState.options.player = convertTeamToSelect(newState.game, teamList);

		//Twitter Variables
		const players = _.chain(newState.game.playerStats)
			.filter(p => p._team == localTeam)
			.sortBy("position")
			.map(
				({ _player }) =>
					newState.game.eligiblePlayers[localTeam].find(p => p._player._id == _player)
						._player
			)
			.value();
		const twitterHandles = players
			.filter(p => p.twitter)
			.map(({ name, twitter }) => ({ label: `${name.full} Twitter`, value: `@${twitter}` }));
		const sponsors = players
			.filter(p => p._sponsor)
			.map(({ name, _sponsor }) => ({
				name: `${name.first} ${name.last} sponsor`,
				value: `\n\n${name.first} is sponsored by ${
					_sponsor.twitter ? `@${_sponsor.twitter}` : _sponsor.name
				}`
			}));
		newState.twitterVariables = [...twitterHandles, ...sponsors];

		return newState;
	}

	getInitialValues() {
		const { defaultProfile } = this.props;
		const { game, options } = this.state;
		const { event, profiles } = options;

		//Get Initial Tweet Content
		let tweet = "";
		if (game.hashtags) {
			tweet += "\n\n";
			tweet += _.uniq(game.hashtags.map(t => `#${t}`)).join(" ");
		}

		return {
			_profile: defaultProfile || profiles[0].value,
			event: event[0].value,
			player: "",
			postTweet: true,
			tweet,
			replyTweet: ""
		};
	}

	getFieldGroups({ event, postTweet }) {
		const { options, twitterVariables } = this.state;
		const fields = [];

		//Event Type
		fields.push({
			name: "event",
			type: fieldTypes.select,
			options: options.event,
			isSearchable: false,
			isNested: true
		});

		//Conditionally add player field, based on current event type
		if (gameEvents[event].isPlayerEvent) {
			fields.push({
				name: "player",
				type: fieldTypes.select,
				options: options.player,
				isSearchable: false,
				isNested: true
			});
		}

		//Boolean to post to twitter
		fields.push({ name: "postTweet", type: fieldTypes.boolean });

		//Twitter Fields
		if (postTweet) {
			fields.push(
				{
					name: "tweet",
					type: fieldTypes.tweet,
					variables: twitterVariables,
					caretPoint: 0,
					variableInstruction: "Players"
				},
				{ name: "replyTweet", type: fieldTypes.text },
				{ name: "_profile", type: fieldTypes.select, options: options.profiles }
			);
		}

		return fields;
	}

	async getPreview(values) {
		const { previewPlayerEventImage } = this.props;
		const { game } = this.state;

		//Set previewImage to false, to enforce LoadingPage
		await this.setState({ previewImage: false });

		//Create the options
		const options = {
			...values,
			event: values.event,
			player: values.player
		};

		//Get the image
		const image = await previewPlayerEventImage(game._id, options);
		await this.setState({ previewImage: image });
	}

	async handleSubmit(values, { setSubmitting, setValues }) {
		const { postGameEvent } = this.props;
		const { game } = this.state;

		//Post Event
		const result = await postGameEvent(game._id, values);

		if (result) {
			//Remove preview
			this.setState({ previewImage: undefined });

			//Get Initial Values
			const newValues = this.getInitialValues();

			//Get the next event
			if (values.event === "T") {
				//If we've just submitted a try, auto-select conversion
				newValues.event = "CN";

				//And we set the reply tweet to the one we just posted
				if (result.tweet_id) {
					newValues.replyTweet = result.tweet_id;
				}
			}

			//Persist profile and postTweet
			const { _profile, postTweet } = values;

			//Set these values, maintaining the current profile and postTweet status
			setValues({
				...newValues,
				_profile,
				postTweet
			});
		}

		//Enable Resubmission
		setSubmitting(false);
	}

	renderPreview() {
		const { previewImage } = this.state;
		if (previewImage) {
			return <img src={previewImage} className="full-span preview-image" />;
		} else if (previewImage === false) {
			return <LoadingPage className="full-span" />;
		} else {
			return null;
		}
	}

	render() {
		const { game, isLoading, validationSchema } = this.state;

		//Wait for profiles to load
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div>
				<Formik
					initialValues={this.getInitialValues()}
					onSubmit={(values, formik) => this.handleSubmit(values, formik)}
					validationSchema={validationSchema}
					render={({ errors, isSubmitting, setFieldValue, values }) => (
						<Form>
							<div className="form-card grid">
								{renderFieldGroup(this.getFieldGroups(values), validationSchema)}
								<div className="buttons">
									<button type="button" onClick={() => this.getPreview(values)}>
										Preview
									</button>
									<button
										className="confirm"
										type="submit"
										disabled={isSubmitting || Object.keys(errors).length}
									>
										Post
									</button>
								</div>
								{this.renderPreview()}
							</div>
							<AdminGameEventList
								game={game}
								onReply={tweetId => setFieldValue("replyTweet", tweetId)}
							/>
						</Form>
					)}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ config, games, teams, social }) {
	const { localTeam } = config;
	const { fullGames } = games;
	const { teamList } = teams;
	const { profiles, defaultProfile } = social;
	return { fullGames, localTeam, teamList, profiles, defaultProfile };
}

// export default form;
export default connect(
	mapStateToProps,
	{
		fetchProfiles,
		postGameEvent,
		previewPlayerEventImage
	}
)(AdminGameEvent);
