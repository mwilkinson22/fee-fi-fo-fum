//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import Select from "react-select";
import selectStyling from "~/constants/selectStyling";

//Components
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchTeam } from "../../../actions/teamsActions";
import { getPregameImage, tweetPregameImage } from "../../../actions/gamesActions";
import TweetComposer from "~/client/components/TweetComposer";

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";

class AdminGamePregameImage extends Component {
	constructor(props) {
		super(props);
		const { game, fullTeams, fetchTeam, localTeam } = props;

		if (!fullTeams[localTeam]) {
			fetchTeam(localTeam);
		}
		if (!fullTeams[game._opposition._id]) {
			fetchTeam(game._opposition._id);
		}

		const { hashtags } = game;
		this.state = {
			game,
			highlightNewPlayers: true,
			team: game.pregameSquads.length > 1 ? "both" : _.values(game.pregameSquads)[0]._team,
			tweet: `Here are your teams for this ${game.date.toString("dddd")}'s game against ${
				game._opposition.name.short
			}!\n\n${hashtags ? hashtags.map(t => `#${t}`).join(" ") : ""}`
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, lastGame, fullTeams, localTeam, teamList } = nextProps;
		const newState = {};

		let teams = [localTeam, game._opposition._id];

		//Ensure both teams have loaded
		if (_.reject(teams, team => fullTeams[team]).length) {
			return newState;
		}

		//Check teams to prevent us repeating logic on picture load
		if (!prevState.teams) {
			newState.teams = _.pick(fullTeams, [localTeam, game._opposition._id]);

			//Get Squad Filters
			const year = new Date(game.date).getFullYear();
			const { _teamType } = game;

			//Get squads
			newState.squads = _.chain(teams)
				.map(id => {
					const squad = _.find(fullTeams[id].squads, { year, _teamType });
					return [id, squad ? squad.players : null];
				})
				.fromPairs()
				.value();

			//Get highlight players
			const thisLocalSquad = _.find(game.pregameSquads, ({ _team }) => _team == localTeam);
			const lastLocalSquad = _.find(
				lastGame.pregameSquads,
				({ _team }) => _team == localTeam
			);

			if (thisLocalSquad && lastLocalSquad) {
				newState.playersToHighlight = _.difference(
					thisLocalSquad.squad,
					lastLocalSquad.squad
				);
			} else {
				newState.playersToHighlight = [];
			}

			//Player List
			newState.playerHighlightOptions = convertTeamToSelect(
				game,
				teamList,
				false,
				false,
				true
			);
			newState.playerImageOptions = [{ label: "None", value: false }];
			if (thisLocalSquad) {
				//Get the squad for the season, with numbers
				const squadNumbers = _.find(
					newState.teams[localTeam].squads,
					s =>
						s.year == new Date(game.date).getFullYear() && s._teamType == game._teamType
				).players;

				const newPlayers = [];
				const otherPlayers = [];

				//Add player to corresponding array
				thisLocalSquad.squad.map(id => {
					//Get Player Object
					const squadMember = _.find(squadNumbers, ({ _player }) => _player._id == id);
					const { image } = squadMember._player;
					if (!image) {
						return null;
					}

					//Get Data
					const { number } = squadMember;
					const label = `${number ? number + ". " : ""}${squadMember._player.name.full}`;
					const option = { label, value: id, number };

					//Push to object
					const isNew = _.find(newState.playersToHighlight, p => p == id);
					if (isNew) {
						newPlayers.push(option);
					} else {
						otherPlayers.push(option);
					}
				});

				if (newPlayers.length) {
					newState.playerImageOptions.push({
						label: "New Players",
						options: _.sortBy(newPlayers, p => p.number || 999)
					});
				}

				if (otherPlayers.length) {
					newState.playerImageOptions.push({
						label: "Other Players",
						options: _.sortBy(otherPlayers, p => p.number || 999)
					});
				}

				newState.playersToHighlight = newState.playerImageOptions[1].options;

				newState.playerForImage =
					newState.playerImageOptions.length > 1 &&
					_.sample(newState.playerImageOptions[1].options);
			} else {
				newState.playerForImage = newState.playerImageOptions[0];
			}
		}

		return newState;
	}

	renderTeamSelect() {
		const { pregameSquads } = this.props.game;
		const { teams, team } = this.state;
		let options = _.map(pregameSquads, ({ _team }) => ({
			value: _team,
			label: teams[_team].name.short
		}));

		if (options.length > 1) {
			options = [{ value: "both", label: "Both" }, ...options];
		}

		return (
			<Select
				styles={selectStyling}
				onChange={({ value }) => this.setState({ team: value })}
				isDisabled={options.length === 1}
				defaultValue={_.find(options, ({ value }) => value == team)}
				options={options}
			/>
		);
	}

	renderPlayerImageSelect() {
		const { playerForImage, playerImageOptions } = this.state;

		return (
			<Select
				styles={selectStyling}
				onChange={playerForImage => this.setState({ playerForImage })}
				defaultValue={playerForImage}
				options={playerImageOptions}
			/>
		);
	}

	renderPlayerHighlightSelect() {
		const { playersToHighlight, playerHighlightOptions } = this.state;

		return (
			<Select
				styles={selectStyling}
				onChange={playersToHighlight => this.setState({ playersToHighlight })}
				defaultValue={playersToHighlight}
				options={playerHighlightOptions}
				isMulti={true}
			/>
		);
	}

	async generatePreview() {
		this.setState({ previewImage: false });
		const { game, getPregameImage } = this.props;
		const image = await getPregameImage(game._id, this.optionsToQuery());
		this.setState({ previewImage: image });
	}

	postTweet() {
		this.setState({ tweetSent: true });
		const { game, tweetPregameImage } = this.props;
		tweetPregameImage(
			game._id,
			this.optionsToQuery(),
			_.pick(this.state, ["tweet", "replyTweet"])
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

	optionsToQuery() {
		const { playerForImage, playersToHighlight, team } = this.state;
		const query = {
			playerForImage: playerForImage.value,
			playersToHighlight: playersToHighlight.map(p => p.value).join(",")
		};
		if (team !== "both") {
			query.singleTeam = team;
		}

		const queryStr = _.map(query, (val, key) => `${key}=${val}`).join("&");

		return `?${queryStr}`;
	}

	renderTweetComposer() {
		const { teams, tweet } = this.state;
		const { game, localTeam } = this.props;
		const localSquad = _.find(
			teams[localTeam].squads,
			({ year }) => year == game.date.getFullYear()
		);

		let variables = [];
		if (localSquad) {
			variables = _.chain(localSquad.players)
				.filter(({ _player }) => _player.twitter)
				.sortBy(p => p.number || 999)
				.map(({ _player }) => ({ name: _player.name.full, value: `@${_player.twitter}` }))
				.value();
		}

		return (
			<TweetComposer
				initialContent={tweet}
				variables={variables}
				variableInstruction="@ Player"
				includeButton={false}
				onChange={tweet => this.setState({ tweet })}
			/>
		);
	}

	render() {
		const { teams } = this.state;
		const { game, lastGame } = this.props;

		if (game === undefined || lastGame === undefined || teams === undefined) {
			return <LoadingPage />;
		}

		return (
			<div className="container pregame-image-loader">
				<div className="form-card grid">
					<label>Team</label>
					{this.renderTeamSelect()}
					<label>Player For Image</label>
					{this.renderPlayerImageSelect()}
					<label>Highlight New Players</label>
					{this.renderPlayerHighlightSelect()}
					<label>Tweet</label>
					{this.renderTweetComposer()}
					<label>In Reply To</label>
					<input
						type="text"
						value={this.state.replyTweet}
						onChange={ev => this.setState({ replyTweet: ev.target.value })}
					/>
					<div className="buttons">
						<button type="button" onClick={() => this.generatePreview()}>
							Preview
						</button>
						<button
							type="button"
							onClick={() => this.postTweet()}
							disabled={this.state.tweetSent}
						>
							Post
						</button>
					</div>
					{this.renderPreview()}
				</div>
			</div>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { fullTeams, teamList } = teams;
	const { localTeam } = config;
	return { fullTeams, localTeam, teamList };
}

export default connect(
	mapStateToProps,
	{ fetchTeam, getPregameImage, tweetPregameImage }
)(AdminGamePregameImage);
