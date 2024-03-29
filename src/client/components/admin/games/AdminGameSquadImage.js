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
import { getDateString } from "~/helpers/gameHelper";
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
				newState.game.eligiblePlayers[localTeam].find(eligiblePlayer => eligiblePlayer._id == _player)
			)
			.filter("twitter")
			.sortBy(p => p.number || p.name.full)
			.map(({ name, twitter }) => ({ label: name.full, value: `@${twitter}` }))
			.value();

		//Validation Schema
		newState.validationSchema = Yup.object().shape({
			_profile: Yup.mixed().required().label("Profile"),
			team: Yup.mixed().required().label("Team"),
			tweet: Yup.string().required().label("Tweet"),
			replyTweet: Yup.string().label("Reply Tweet ID")
		});

		return newState;
	}

	getInitialValues() {
		const { defaultProfile } = this.props;
		const { options } = this.state;

		return {
			_profile: defaultProfile,
			team: options.team[0].value,
			tweet: this.getInitialTweet(),
			replyTweet: ""
		};
	}

	getInitialTweet() {
		const { game } = this.state;

		let tweet = "Here is your team for ";

		//Get date string
		const dateStringObject = getDateString(game.date);
		switch (dateStringObject.status) {
			case "past":
				//...for our game against...
				tweet += "our";
				break;
			case "overAWeek":
				//...for our upcoming game against...
				tweet += "our upcoming";
				break;
			default:
				//...for tomorrow's/tonight's/Friday's game against...
				tweet += `${dateStringObject.string}'s`;
				break;
		}

		//Opposition
		tweet += ` game against ${game._opposition.name.short}!\n\n`;

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
		const image = await getSquadImage(game._id, values.team != localTeam);
		await this.setState({ previewImage: image });
	}

	async handleSubmit(values, { setFieldValue, setSubmitting }) {
		const { postGameEvent, localTeam } = this.props;
		const { game } = this.state;

		const event = _.cloneDeep(values);

		//Get team
		event.showOpposition = values.team != localTeam;
		delete event.team;

		//Add additional event data
		event.postTweet = true;
		event.postToFacebook = true;
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
			return <img src={previewImage} className="full-span preview-image" alt="Preview" />;
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
			>
				{({ isSubmitting, setFieldValue, values }) => (
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
						<AdminGameEventList game={game} onReply={tweetId => setFieldValue("replyTweet", tweetId)} />
					</Form>
				)}
			</Formik>
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

export default connect(mapStateToProps, { fetchProfiles, getSquadImage, postGameEvent })(AdminGameSquadImage);
