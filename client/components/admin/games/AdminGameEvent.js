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

	onSubmit(values, formikActions) {
		const { postGameEvent, game } = this.props;
		values.event = values.event.value;
		values.player = values.player.value || null;

		formikActions.resetForm();

		postGameEvent(game._id, values);

		formikActions.setFieldValue("postTweet", values.postTweet);

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
							const { name } = peopleList[_player];
							return { label: `${name.first} ${name.last}`, value: _player };
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
						<button
							type="button"
							onClick={() => this.generatePreview(formikProps.values)}
						>
							Preview Image
						</button>
						<button type="button" onClick={() => formikProps.resetForm()}>
							Clear
						</button>
						<button type="submit">Submit</button>
					</div>

					{this.renderPreview()}
				</div>
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
