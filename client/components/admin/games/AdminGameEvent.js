//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { postGameEvent, previewPlayerEventImage } from "~/client/actions/gamesActions";
import { fetchPeopleList } from "~/client/actions/peopleActions";
import { fetchTeam } from "~/client/actions/teamsActions";

//Components
import LoadingPage from "../../LoadingPage";

//Constants
import gameEvents from "~/constants/gameEvents";

//Helpers
import { processFormFields } from "~/helpers/adminHelper";

class AdminGameEvent extends Component {
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
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, localTeam, game } = nextProps;
		if (!fullTeams[localTeam] || !fullTeams[game._opposition._id]) {
			return {};
		}

		return nextProps;
	}

	getValidationSchema() {
		const shape = {
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
		};
		return Yup.object().shape(shape);
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

	async onSubmit(values, formikActions) {
		const { postGameEvent, game } = this.props;

		//Disable Submit Button
		this.setState({ isPosting: true });

		//Pull value ids
		values.event = values.event.value;
		values.player = values.player.value || null;

		//Post Event
		const event = await postGameEvent(game._id, values);

		//Reset Form
		formikActions.resetForm();
		if (values.postTweet) {
			formikActions.setFieldValue("replyTweet", event.tweet_id);
		}
		formikActions.setFieldValue("postTweet", values.postTweet);
		this.setState({ previewImage: null, isPosting: false });

		if (values.event === "T") {
			formikActions.setFieldValue("event", {
				label: "Conversion",
				value: "CN"
			});
		}
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
					{ label: "Full Time", value: "fullTime" }
				]
			}
		];
	}

	renderFields(formikProps) {
		const { localTeam } = this.props;
		const { isPosting } = this.state;
		const { game, peopleList, teamList } = this.props;
		const { event, postTweet } = formikProps.values;
		const validationSchema = this.getValidationSchema();
		const eventTypes = this.getEventTypes();
		const fields = [
			{ name: "event", type: "Select", options: eventTypes, isSearchable: false }
		];

		if (event.value && gameEvents[event.value].isPlayerEvent) {
			const players = _.chain(game.playerStats)
				.groupBy("_team")
				.map((squad, team) => {
					const options = _.chain(squad)
						.sortBy("position")
						.map(({ _player }) => {
							const p = _.find(
								game.eligiblePlayers[team],
								p => _player == p._player._id
							);
							const numberStr = p.number ? `${p.number}. ` : "";
							const label = numberStr + p._player.name.full;
							return { label, value: _player };
						})
						.value();
					return { label: teamList[team].name.short, options };
				})
				.value();
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
					customProps: {
						variables,
						caretPoint: 0,
						variableInstruction: "@ Player"
					}
				},
				{ name: "replyTweet", type: "text" }
			);
		}
		return (
			<Form>
				<div className="form-card grid">
					<h6>Add Game Event</h6>
					{processFormFields(fields, validationSchema)}
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
				{this.renderEventList(formikProps)}
			</Form>
		);
	}

	renderEventList(formikProps) {
		const { events, eligiblePlayers } = this.props.game;
		const playerList = _.chain(eligiblePlayers)
			.map((players, team) => {
				return _.map(players, p => ({ team, ...p }));
			})
			.flatten()
			.value();

		if (events && events.length) {
			const renderedList = _.chain(events)
				.sortBy("date")
				.reverse()
				.map(e => {
					const { _id, event, _player, tweet_text, tweet_image, tweet_id, date } = e;

					//Get Player
					let player;
					if (_player) {
						player = _.find(playerList, p => p._player._id == _player)._player.name
							.full;
					}

					//Get Tweet Image
					let image;
					if (tweet_image) {
						image = (
							<div
								key="image"
								className={`image ${
									this.state.visibleEventImage === _id ? "visible" : ""
								}`}
							>
								<img src={tweet_image} />
							</div>
						);
					}
					return [
						<div
							key="reply"
							className="action reply"
							onClick={() => formikProps.setFieldValue("replyTweet", tweet_id)}
						>
							↩️
						</div>,
						<div key="delete" className="action delete">
							🛇
						</div>,
						<div
							key="date"
							className="date"
							onClick={() => this.setState({ visibleEventImage: _id })}
						>
							{new Date(date).toString("HH:mm:ss")}
						</div>,
						<div
							key="event-type"
							className="event-type"
							onClick={() => this.setState({ visibleEventImage: _id })}
						>
							{gameEvents[event].label}
							{player ? ` (${player})` : ""}
						</div>,
						<div
							key="tweet-text"
							className="tweet-text"
							onClick={() => this.setState({ visibleEventImage: _id })}
						>
							{tweet_text}
						</div>,
						image
					];
				})
				.value();
			return <div className="form-card event-list">{renderedList}</div>;
		} else {
			return null;
		}
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

	async generatePreview(fValues) {
		const values = _.cloneDeep(fValues);
		await this.setState({ previewImage: false });
		const { previewPlayerEventImage, game } = this.props;
		values.event = values.event.value;
		values.player = values.player.value || null;

		const image = await previewPlayerEventImage(game._id, values);
		await this.setState({ previewImage: image });
	}

	render() {
		const { peopleList } = this.state;
		if (!peopleList) {
			return <LoadingPage />;
		}
		return (
			<div className="container">
				<Formik
					validationSchema={() => this.getValidationSchema()}
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
