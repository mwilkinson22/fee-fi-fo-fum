//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { postGameEvent, previewPlayerEventImage } from "~/client/actions/gamesActions";
import { fetchPeopleList } from "~/client/actions/peopleActions";
import { fetchTeam } from "~/client/actions/teamsActions";
import { fetchProfiles } from "~/client/actions/socialActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";
import AdminGameEventList from "./AdminGameEventList";

//Constants
import gameEvents from "~/constants/gameEvents";
import { defaultSocialProfile } from "~/config/keys";
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";

class AdminGameEvent extends BasicForm {
	constructor(props) {
		super(props);
		const {
			game,
			peopleList,
			fetchPeopleList,
			fullTeams,
			localTeam,
			fetchTeam,
			profiles,
			fetchProfiles
		} = props;
		if (!peopleList) {
			fetchPeopleList();
		}
		if (!fullTeams[localTeam]) {
			fetchTeam(localTeam);
		}
		if (!fullTeams[game._opposition._id]) {
			fetchTeam(game._opposition._id);
		}

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
				.test("getPlayer", "Please select a player", function(player) {
					const { event } = this.parent;
					const { isPlayerEvent } = gameEvents[event.value];
					return !isPlayerEvent || (player && player.value);
				})
				.label("Player"),
			postTweet: Yup.boolean().label("Post to Social?"),
			tweet: Yup.string().label("Tweet"),
			replyTweet: Yup.string().label("Reply To Tweet")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, localTeam, game, profiles, peopleList } = nextProps;
		const newState = { isLoading: false };

		if (!fullTeams[localTeam] || !fullTeams[game._opposition._id] || !peopleList || !profiles) {
			newState.isLoading = true;
			return newState;
		}

		newState.profiles = _.chain(profiles)
			.reject("archived")
			.map(({ name, _id }) => ({ label: name, value: _id }))
			.sortBy("label")
			.value();

		return newState;
	}

	getDefaults() {
		const { hashtags } = this.props.game;
		const { profiles } = this.state;

		return {
			_profile: profiles.find(p => p.value == defaultSocialProfile) || profiles[0],
			event: {
				label: "None",
				value: "none"
			},
			player: "",
			postTweet: true,
			tweet: hashtags ? `\n\n${_.uniq(hashtags.map(t => `#${t}`)).join(" ")}` : "",
			replyTweet: ""
		};
	}

	async onSubmit(fValues, formikActions) {
		const { postGameEvent, game } = this.props;
		const values = _.cloneDeep(fValues);

		//Disable Submit Button
		this.setState({ isPosting: true });

		//Pull value ids
		values.event = values.event.value;
		values.player = values.player.value || null;
		values._profile = values._profile.value || null;

		//Post Event
		const event = await postGameEvent(game._id, values);

		//Clean Up
		this.setState({ previewImage: null, isPosting: false });
		if (event) {
			//Reset Form
			formikActions.resetForm();
			formikActions.setFieldValue("postTweet", values.postTweet);
			formikActions.setFieldValue("_profile", fValues._profile);

			if (values.event === "T") {
				formikActions.setFieldValue("replyTweet", event.tweet_id || "");
				formikActions.setFieldValue("event", {
					label: "Conversion",
					value: "CN"
				});
			}
		}
	}

	async generatePreview(fValues) {
		const values = _.cloneDeep(fValues);
		await this.setState({ previewImage: false });
		const { previewPlayerEventImage, game } = this.props;
		values.event = values.event.value;
		values.player = values.player.value || null;

		const image = await previewPlayerEventImage(game._id, values);
		await this.setState({ previewImage: image });
	}

	getEventTypes() {
		return [
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
	}

	renderFields(formikProps) {
		const { localTeam, game, teamList } = this.props;
		const { isPosting, profiles } = this.state;
		const { event, postTweet } = formikProps.values;
		const eventTypes = this.getEventTypes();
		let fields = [
			{ name: "event", type: fieldTypes.select, options: eventTypes, isSearchable: false }
		];

		if (event.value && gameEvents[event.value].isPlayerEvent) {
			const players = convertTeamToSelect(game, teamList);
			fields.push({
				name: "player",
				type: fieldTypes.select,
				options: players,
				isSearchable: false
			});
		}

		fields.push({ name: "postTweet", type: fieldTypes.boolean });

		if (postTweet) {
			const variables = _.chain(game.playerStats)
				.filter(p => p._team == localTeam)
				.sortBy("position")
				.map(
					({ _player }) =>
						game.eligiblePlayers[localTeam].find(p => p._player._id == _player)._player
				)
				.map(({ name, twitter, _sponsor }) => {
					let entries = [];
					if (twitter) {
						entries.push({ name: `${name.full} Twitter`, value: `@${twitter}` });
					}
					if (_sponsor) {
						entries.push({
							name: `${name.full} sponsor`,
							value: `\n\n${name.first} is sponsored by ${
								_sponsor.twitter ? `@${_sponsor.twitter}` : _sponsor.name
							}`
						});
					}
					return entries;
				})
				.flatten()
				.value();

			fields.push(
				{
					name: "tweet",
					type: fieldTypes.tweet,
					variables,
					caretPoint: 0,
					variableInstruction: "Players"
				},
				{ name: "replyTweet", type: fieldTypes.text },
				{ name: "_profile", type: fieldTypes.select, options: profiles }
			);
		}
		return (
			<Form>
				<div className="form-card grid">
					<h6>Add Game Event</h6>
					{this.renderFieldGroup(fields)}
					<div className="buttons">
						<button type="button" onClick={() => formikProps.resetForm()}>
							Clear
						</button>
						<button
							type="button"
							onClick={() => this.generatePreview(formikProps.values)}
						>
							Preview Image
						</button>
						<button type="submit" disabled={isPosting}>
							Submit
						</button>
					</div>

					{this.renderPreview()}
				</div>
				<AdminGameEventList
					game={game}
					onReply={val => formikProps.setFieldValue("replyTweet", val)}
				/>
			</Form>
		);
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
		const { isLoading } = this.state;
		if (isLoading) {
			return <LoadingPage />;
		}
		return (
			<div className="container game-event-page">
				<Formik
					validationSchema={this.state.validationSchema}
					onSubmit={(values, formikActions) => this.onSubmit(values, formikActions)}
					initialValues={this.getDefaults()}
					render={formikProps => this.renderFields(formikProps)}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ config, people, teams, social }) {
	const { localTeam } = config;
	const { peopleList } = people;
	const { teamList, fullTeams } = teams;
	return { localTeam, peopleList, teamList, fullTeams, profiles: social };
}

// export default form;
export default connect(
	mapStateToProps,
	{ fetchProfiles, fetchPeopleList, postGameEvent, fetchTeam, previewPlayerEventImage }
)(AdminGameEvent);
