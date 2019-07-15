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

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";
import AdminGameEventList from "./AdminGameEventList";

//Constants
import gameEvents from "~/constants/gameEvents";

//Helpers
import { convertTeamToSelect, getMostRecentTweet } from "~/helpers/gameHelper";

class AdminGameEvent extends BasicForm {
	constructor(props) {
		super(props);
		const { game, peopleList, fetchPeopleList, fullTeams, localTeam, fetchTeam } = props;
		if (!peopleList) {
			fetchPeopleList();
		}
		if (!fullTeams[localTeam]) {
			fetchTeam(localTeam);
		}
		if (!fullTeams[game._opposition._id]) {
			fetchTeam(game._opposition._id);
		}

		const validationSchema = Yup.object().shape({
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
			postTweet: Yup.boolean().label("Post Tweet?"),
			tweet: Yup.string().label("Tweet"),
			replyTweet: Yup.string().label("Reply To Tweet")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, localTeam, game } = nextProps;
		if (!fullTeams[localTeam] || !fullTeams[game._opposition._id]) {
			return {};
		}

		return nextProps;
	}

	getDefaults() {
		const { hashtags } = this.props.game;

		return {
			event: {
				label: "None",
				value: "none"
			},
			player: "",
			postTweet: true,
			tweet: hashtags ? `\n\n${hashtags.map(t => `#${t}`).join(" ")}` : "",
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

		//Post Event
		const events = await postGameEvent(game._id, values);

		//Clean Up
		this.setState({ previewImage: null, isPosting: false });
		if (events !== false) {
			//Reset Form
			formikActions.resetForm();
			formikActions.setFieldValue("postTweet", values.postTweet);

			if (values.event === "T") {
				formikActions.setFieldValue("replyTweet", getMostRecentTweet(events));
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
		const { localTeam, game, peopleList, teamList } = this.props;
		const { isPosting } = this.state;
		const { event, postTweet } = formikProps.values;
		const eventTypes = this.getEventTypes();
		const fields = [
			{ name: "event", type: "Select", options: eventTypes, isSearchable: false }
		];

		if (event.value && gameEvents[event.value].isPlayerEvent) {
			const players = convertTeamToSelect(game, teamList);
			fields.push({ name: "player", type: "Select", options: players, isSearchable: false });
		}

		fields.push({ name: "postTweet", type: "Boolean" });

		if (postTweet) {
			const variables = _.chain(game.playerStats)
				.filter(p => p._team == localTeam)
				.sortBy("position")
				.map(({ _player }) => peopleList[_player])
				.filter(p => p.twitter)
				.map(({ name, twitter }) => ({
					name: `${name.first} ${name.last}`,
					value: `@${twitter}`
				}))
				.value();
			fields.push(
				{
					name: "tweet",
					type: "Tweet",
					variables,
					caretPoint: 0,
					variableInstruction: "@ Player"
				},
				{ name: "replyTweet", type: "text" }
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
		const { peopleList } = this.state;
		if (!peopleList) {
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
function mapStateToProps({ config, people, teams }) {
	const { localTeam } = config;
	const { peopleList } = people;
	const { teamList, fullTeams } = teams;
	return { localTeam, peopleList, teamList, fullTeams };
}

// export default form;
export default connect(
	mapStateToProps,
	{ fetchPeopleList, postGameEvent, fetchTeam, previewPlayerEventImage }
)(AdminGameEvent);
