//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../../LoadingPage";
import Select from "../fields/Select";

//Actions
import { fetchTeam } from "../../../actions/teamsActions";
import { getPregameImage, tweetPregameImage } from "../../../actions/gamesActions";
import TweetComposer from "~/client/components/TweetComposer";

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

		this.state = {
			game,
			team: game.pregameSquads.length > 1 ? "both" : _.values(game.pregameSquads)[0]._team,
			playerForImage: false,
			tweet: `Here are your teams for this ${game.date.toString("dddd")}'s game against ${
				game._opposition.name.short
			}!\n\n`
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, lastGame, fullTeams, localTeam, pregameImages } = nextProps;
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
			if (thisLocalSquad) {
				//Get the squad for the season, with numbers
				const squadNumbers = _.find(
					newState.teams[localTeam].squads,
					s =>
						s.year == new Date(game.date).getFullYear() && s._teamType == game._teamType
				).players;

				newState.playerOptions = _.chain(thisLocalSquad.squad)
					.map(id => {
						//Get Player Object
						const squadMember = _.find(
							squadNumbers,
							({ _player }) => _player._id == id
						);

						const highlight = _.find(newState.playersToHighlight, p => p == id);
						const number = squadMember.number;
						const name = `${number ? number + ". " : ""}${
							squadMember._player.name.full
						} ${highlight ? "    *" : ""}`;
						const image = squadMember._player.image;

						return {
							label: name,
							value: id,
							number,
							image
						};
					})
					.sortBy(p => p.number || 999)
					.value();
			} else {
				newState.playerOptions = [];
			}
		}

		newState.previewImage = pregameImages[game._id];

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
				onChange={({ value }) => this.setState({ team: value })}
				disabled={options.length === 1}
				defaultValue={_.find(options, ({ value }) => value == team)}
				options={options}
			/>
		);
	}

	renderPlayerImageSelect() {
		const { playerForImage, playerOptions } = this.state;
		const playersWithImages = _.filter(playerOptions, "image");
		const options = [{ value: false, label: "None" }, ...playersWithImages];

		return (
			<Select
				onChange={({ value }) => this.setState({ playerForImage: value })}
				defaultValue={_.find(options, ({ value }) => value == playerForImage)}
				disabled={options.length === 1}
				options={options}
			/>
		);
	}

	generatePreview() {
		const { game, getPregameImage } = this.props;
		getPregameImage(game._id, this.optionsToQuery());
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
		} else {
			return null;
		}
	}

	optionsToQuery() {
		const { playerForImage, playersToHighlight, team } = this.state;
		let query = `?playerForImage=${playerForImage}&playersToHighlight=${playersToHighlight.join(
			","
		)}`;

		if (team !== "both") {
			query += `&singleTeam=${team}`;
		}

		return query;
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

function mapStateToProps({ config, teams, games }, ownProps) {
	const { fullTeams } = teams;
	const { localTeam } = config;
	const { pregame } = games.images;
	return { fullTeams, localTeam, pregameImages: pregame, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchTeam, getPregameImage, tweetPregameImage }
)(AdminGamePregameImage);
