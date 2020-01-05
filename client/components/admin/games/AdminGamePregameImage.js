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
import { fetchGames, getPregameImage, postGameEvent } from "../../../actions/gamesActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { getLastGame } from "~/helpers/gameHelper";
import { renderFieldGroup } from "~/helpers/formHelper";

class AdminGamePregameImage extends Component {
	constructor(props) {
		super(props);
		const { match, fetchGames, fullGames, gameList, profiles, fetchProfiles } = props;

		//Get Social Media Profiles
		if (!profiles) {
			fetchProfiles();
		}

		//Get Last Game
		const lastGameId = getLastGame(match.params._id, gameList);
		if (lastGameId && !fullGames[lastGameId]) {
			fetchGames([lastGameId], "admin");
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullGames, gameList, localTeam, match, profiles, teamList } = nextProps;
		const newState = { isLoading: false };

		//Get Game
		newState.game = fullGames[match.params._id];

		//Get Last Game
		const lastGameId = getLastGame(match.params._id, gameList);
		if (lastGameId) {
			newState.lastGame = fullGames[lastGameId];
		} else {
			newState.lastGame = false;
		}

		//Check everything is loaded
		if (!profiles || (lastGameId && !newState.lastGame)) {
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
		newState.options.team = _.chain(newState.game.pregameSquads)
			.filter(({ squad }) => squad && squad.length)
			.map(({ _team }) => ({ value: _team, label: teamList[_team].name.short }))
			.value();
		if (newState.options.team.length === 2) {
			newState.options.team.unshift({ label: "Both", value: "both" });
		}

		//Player Dropdowns
		newState.currentLocalSquad = newState.game.pregameSquads.find(
			({ _team }) => _team == localTeam
		);
		if (newState.currentLocalSquad && newState.currentLocalSquad.squad) {
			newState.lastLocalSquad =
				newState.lastGame &&
				newState.lastGame.pregameSquads &&
				newState.lastGame.pregameSquads.find(({ _team }) => _team == localTeam);

			//Generic Player List, for "highlight" menu
			newState.options.players = _.chain(newState.currentLocalSquad.squad)
				//Convert ID list to eligible player array
				.map(id =>
					newState.game.eligiblePlayers[localTeam].find(
						({ _player }) => _player._id == id
					)
				)
				//Order
				.sortBy(p => p.number || p._player.name.full)
				//Convert to dropdown object
				.map(({ _player, number }) => ({
					value: _player._id,
					label: `${number ? `${number}. ` : ""} ${_player.name.full}`,
					image: _player.images.player || _player.images.main,
					isNew:
						newState.lastLocalSquad &&
						!newState.lastLocalSquad.squad.find(_id => _id == _player._id)
				}))
				//Group By New Status
				.groupBy(({ isNew }) => (isNew ? "New Players" : "All Players"))
				//Map into nested options
				.map((options, label) => ({ options, label, isNew: options[0].isNew }))
				//Order so that new players appear first
				.orderBy("isNew", "desc")
				.value();

			//Filter by those with images
			newState.options.playersWithImages =
				newState.options.players
					.map(optionGroup => {
						const options = optionGroup.options.filter(({ image }) => image);
						return {
							...optionGroup,
							options
						};
					})
					.filter(({ options }) => options.length) || [];

			//Add player twitter handles
			newState.twitterVariables = _.chain(newState.currentLocalSquad.squad)
				//Convert ID list to eligible player array
				.map(id =>
					newState.game.eligiblePlayers[localTeam].find(
						({ _player }) => _player._id == id
					)
				)
				.filter(({ _player }) => _player.twitter)
				.sortBy(p => p.number || p._player.name.full)
				.map(({ _player }) => ({ label: _player.name.full, value: `@${_player.twitter}` }))
				.value();
		} else {
			//This means we only have the opposition pregame squad
			newState.options.players = [];
		}

		//Validation Schema
		newState.validationSchema = Yup.object().shape({
			_profile: Yup.mixed()
				.required()
				.label("Profile"),
			team: Yup.mixed()
				.required()
				.label("Team"),
			playerForImage: Yup.mixed().label("Player For Image"),
			playersToHighlight: Yup.array()
				.of(Yup.mixed())
				.label("Players To Highlight"),
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

		//Player for image
		//This just pulls from the first group, as if there's
		//no new players then we can use an existing one
		const playerForImage = options.playersWithImages.length
			? _.sample(options.playersWithImages[0].options).value
			: "";

		//Players to highlight
		//This only pulls from the isNew group
		const playersToHighlight =
			options.players.length && options.players[0].isNew
				? options.players[0].options.map(o => o.value)
				: [];

		return {
			_profile: defaultProfile,
			team: options.team[0].value,
			playerForImage,
			playersToHighlight,
			tweet: this.getInitialTweet(),
			replyTweet: ""
		};
	}

	getInitialTweet() {
		const { localTeam, teamList } = this.props;
		const { currentLocalSquad, lastLocalSquad, game, options } = this.state;

		let tweet = "";

		//Add Teams
		if (options.team.length === 1) {
			tweet += `Here is your ${teamList[options.team[0].value].name.short} team`;
		} else {
			tweet += "Here are your teams";
		}
		tweet += ` for this ${game.date.toString("dddd")}'s game`;

		//Add opposition, as long as they're not the only team with a pregame squad at present
		//I.e. there's no need to say "Here is your Hull team for this Friday's game against Hull"
		if (options.team.length !== 1 || options.team[0].value != game._opposition._id) {
			tweet += ` against ${game._opposition.name.short}`;
		}

		//Add exclamation mark
		tweet += "!";

		//Add outgoing/incoming players
		//If this passes, we know that we've succesfully loaded the
		//local pregame squads for the current and previous games
		if (options.players.length && options.players[0].isNew) {
			const eligiblePlayers = _.keyBy(
				game.eligiblePlayers[localTeam],
				({ _player }) => _player._id
			);

			const getPlayerName = (player, useTwitter) => {
				if (useTwitter && player.twitter) {
					return `@${player.twitter}`;
				}

				if (player.nickname && player.displayNicknameInCanvas) {
					return player.nickname;
				}

				return player.squadNameWhenDuplicate || player.name.last;
			};

			//Add some line breaks
			tweet += "\n\n";

			//Get outgoing players
			const outgoing = lastLocalSquad.squad
				.filter(
					id => !currentLocalSquad.squad.find(cId => id == cId) && eligiblePlayers[id]
				)
				.map(id => getPlayerName(eligiblePlayers[id]._player, false));

			if (outgoing.length) {
				tweet += `⬅️ ${outgoing.join(", ")}\n`;
			}

			//Get incoming players
			const incoming = options.players[0].options
				.map(({ value }) => eligiblePlayers[value]._player)
				.map(p => getPlayerName(p, true));

			tweet += `➡️ ${incoming.join(", ")}`;
		}

		//Add hashtags
		tweet += `\n\n${game.hashtags.map(t => `#${t}`).join(" ")}`;

		return tweet;
	}

	generateQueryString(values, forPreview) {
		const { playerForImage, playersToHighlight, team } = values;
		const query = {};

		if (playerForImage) {
			query.playerForImage = playerForImage;
		}

		if (playersToHighlight && playersToHighlight.length) {
			query.playersToHighlight = playersToHighlight.join(",");
		}

		if (team !== "both") {
			query.singleTeam = team;
		}

		if (forPreview) {
			const queryStr = _.map(query, (val, key) => `${key}=${val}`).join("&");
			return `?${queryStr}`;
		} else {
			return query;
		}
	}

	async getPreview(values) {
		const { getPregameImage } = this.props;
		const { game } = this.state;

		//Set previewImage to false, which enforces LoadingPage
		this.setState({ previewImage: false });

		//Get Image
		const image = await getPregameImage(game._id, this.generateQueryString(values, true));
		this.setState({ previewImage: image });
	}

	async handleSubmit(values, { setFieldValue, setSubmitting }) {
		const { postGameEvent } = this.props;
		const { game } = this.state;
		const { _profile, tweet, replyTweet } = values;

		//Create Event Object
		const event = {
			_profile,
			tweet,
			replyTweet,
			postTweet: true,
			event: "pregameSquad",
			imageOptions: this.generateQueryString(values, false)
		};

		//Get Posted Tweet
		const result = await postGameEvent(game._id, event);

		//Update replyTweet Value
		setFieldValue("replyTweet", result.tweet_id);

		//Remove Preview
		this.setState({ previewImage: undefined });

		//Enable resubmission
		setSubmitting(false);
	}

	renderMainForm() {
		const { options, twitterVariables, validationSchema } = this.state;

		//Main For
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
				name: "playerForImage",
				type: fieldTypes.select,
				options: options.playersWithImages,
				isClearable: true,
				isDisabled: !options.playersWithImages.length,
				isNested: true
			},
			{
				name: "playersToHighlight",
				type: fieldTypes.select,
				options: options.players,
				isDisabled: !options.players.length,
				isMulti: true,
				isNested: true
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

		//Await Profiles
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

function mapStateToProps({ config, games, teams, social }) {
	const { teamList } = teams;
	const { localTeam } = config;
	const { fullGames, gameList } = games;
	const { profiles, defaultProfile } = social;
	return { fullGames, gameList, localTeam, teamList, profiles, defaultProfile };
}

export default connect(mapStateToProps, {
	fetchGames,
	fetchProfiles,
	getPregameImage,
	postGameEvent
})(AdminGamePregameImage);
