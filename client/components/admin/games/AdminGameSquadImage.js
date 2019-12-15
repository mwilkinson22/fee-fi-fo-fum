//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import LoadingPage from "../../LoadingPage";
import AdminGameEventList from "./AdminGameEventList";

//Actions
import { fetchProfiles } from "~/client/actions/socialActions";
import { getSquadImage, postGameEvent } from "../../../actions/gamesActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { renderFieldGroup } from "~/helpers/formHelper";

class AdminGameSquadImage extends Component {
	constructor(props) {
		super(props);
		const { profiles, fetchProfiles } = props;

		//Get Social Media Profiles
		if (!profiles) {
			fetchProfiles();
		}

		this.state = {};
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

		//Team Options
		newState.options.team = _.chain([localTeam, newState.game._opposition._id])
			.filter(_id => newState.game.playerStats.filter(({ _team }) => _id == _team).length)
			.map(_team => ({ value: _team, label: teamList[_team].name.short }))
			.value();

		//Add player twitter handles
		newState.twitterVariables = _.chain(newState.game.playerStats)
			//Just get the local players
			.filter(({ _team }) => _team == localTeam)

			//Convert ID list to eligible player array
			.map(({ _player }) =>
				newState.game.eligiblePlayers[localTeam].find(
					eligiblePlayer => eligiblePlayer._player._id == _player
				)
			)
			.filter(({ _player }) => _player.twitter)
			.sortBy(p => p.number || p._player.name.full)
			.map(({ _player }) => ({ label: _player.name.full, value: `@${_player.twitter}` }))
			.value();

		//Validation Schema
		newState.validationSchema = Yup.object().shape({
			_profile: Yup.mixed()
				.required()
				.label("Profile"),
			team: Yup.mixed()
				.required()
				.label("Team"),
			tweet: Yup.string()
				.required()
				.label("Tweet"),
			replyTweet: Yup.string().label("Reply Tweet ID")
		});

		return newState;
	}

	getInitialValues() {
		const { defaultProfile } = this.props;
		const { options } = this.state;

		return {
			_profile: options.profiles.find(({ value }) => value == defaultProfile),
			team: options.team[0],
			tweet: this.getInitialTweet(),
			replyTweet: ""
		};
	}

	getInitialTweet() {
		const { game } = this.state;

		let tweet = "Here is your Giants squad for ";

		//Today or tonight
		tweet += Number(game.date.toString("H")) < 6 ? "today" : "tonight";

		//Opposition
		tweet += `'s game against ${game._opposition.name.short}!\n\n`;

		//Add Hashtags
		tweet += game.hashtags.map(t => `#${t}`).join(" ");

		return tweet;
	}

	async getPreview(values) {
		const { getSquadImage, localTeam } = this.props;
		const { game } = this.state;

		//Set previewImage to false, to enforce LoadingPage
		await this.setState({ previewImage: false });

		//Get the Image
		const image = await getSquadImage(game._id, values.team.value != localTeam);
		await this.setState({ previewImage: image });
	}

	async handleSubmit(values, { setFieldValue, setSubmitting }) {
		const { postGameEvent, localTeam } = this.props;
		const { game } = this.state;

		const event = _.cloneDeep(values);

		//Get team
		event.showOpposition = event.team.value == localTeam;
		delete event.team;

		//Pull profile id
		event._profile = event._profile.value;

		//Add additional event data
		event.postTweet = true;
		event.event = "matchSquad";

		//Get Posted Tweet
		const result = await postGameEvent(game._id, event);

		//Update replyTweet value
		setFieldValue("replyTweet", result.tweet_id);

		//Remove preview
		this.setState({ previewImage: undefined });

		//Enable resubmission
		setSubmitting(false);
	}

	renderMainForm() {
		const { options, twitterVariables, validationSchema } = this.state;

		//Main Form
		const fields = [
			{
				name: "_profile",
				type: fieldTypes.select,
				options: options.profiles,
				isSearchable: false
			},
			{
				name: "team",
				type: fieldTypes.select,
				options: options.team,
				isDisabled: options.team.length < 2,
				isSearchable: false
			},
			{
				name: "tweet",
				type: fieldTypes.tweet,
				variables: twitterVariables,
				variableInstruction: "@ Player"
			},
			{
				name: "replyTweet",
				type: fieldTypes.text
			}
		];

		return renderFieldGroup(fields, validationSchema);
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

		//Await profiles
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<Formik
				initialValues={this.getInitialValues()}
				onSubmit={(values, formik) => this.handleSubmit(values, formik)}
				validationSchema={validationSchema}
				render={({ isSubmitting, setFieldValue, values }) => (
					<Form>
						<div className="form-card grid">
							{this.renderMainForm()}
							<div className="buttons">
								<button type="button" onClick={() => this.getPreview(values)}>
									Preview
								</button>
								<button className="confirm" type="submit" disabled={isSubmitting}>
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
		);
	}
}

function mapStateToProps({ config, games, social, teams }) {
	const { fullGames } = games;
	const { teamList } = teams;
	const { localTeam } = config;
	const { profiles, defaultProfile } = social;
	return { fullGames, localTeam, profiles, defaultProfile, teamList };
}

export default connect(
	mapStateToProps,
	{ fetchProfiles, getSquadImage, postGameEvent }
)(AdminGameSquadImage);
