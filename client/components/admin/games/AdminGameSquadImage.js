//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import Select from "react-select";
import selectStyling from "~/constants/selectStyling";

//Components
import LoadingPage from "../../LoadingPage";
import AdminGameEventList from "./AdminGameEventList";

//Actions
import { fetchProfiles } from "~/client/actions/socialActions";
import { fetchTeam } from "../../../actions/teamsActions";
import { getSquadImage, postGameEvent } from "../../../actions/gamesActions";
import TweetComposer from "~/client/components/TweetComposer";

//Constants
import { defaultSocialProfile } from "~/config/keys";

class AdminGameSquadImage extends Component {
	constructor(props) {
		super(props);
		const { game, fullTeams, fetchTeam, localTeam, profiles, fetchProfiles } = props;

		if (!fullTeams[localTeam]) {
			fetchTeam(localTeam);
		}
		if (!fullTeams[game._opposition._id]) {
			fetchTeam(game._opposition._id);
		}

		if (!profiles) {
			fetchProfiles();
		}

		const { hashtags } = game;

		//Get Initial Tweets
		const tweet = `Here is your Giants squad for ${
			Number(game.date.toString("H")) < 6 ? "today" : "tonight"
		}'s game against ${game._opposition.name.short}!\n\n${
			hashtags ? hashtags.map(t => `#${t}`).join(" ") : ""
		}`;

		this.state = {
			_profile: defaultSocialProfile,
			game,
			tweet
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, fullTeams, localTeam, profiles } = nextProps;
		const newState = { game };

		let teams = [localTeam, game._opposition._id];

		//Ensure both teams have loaded
		if (_.reject(teams, team => fullTeams[team]).length || !profiles) {
			return newState;
		}

		if (!prevState.teams) {
			newState.teams = _.pick(fullTeams, [localTeam, game._opposition._id]);
			newState.teamOptions = _.chain(newState.teams)
				.filter(t => _.filter(game.playerStats, p => p._team == t._id).length)
				.sortBy(t => t._id != localTeam)
				.map(t => ({ value: t._id, label: t.name.short }))
				.value();
			newState.selectedTeam = newState.teamOptions[0];
		}

		return newState;
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

	renderProfileSelector() {
		const { profiles } = this.props;
		const { _profile } = this.state;

		let options = _.map(profiles, ({ name, _id }) => ({
			value: _id,
			label: name
		}));

		return (
			<Select
				styles={selectStyling}
				onChange={({ value }) => this.setState({ _profile: value })}
				isDisabled={options.length === 1}
				defaultValue={_.find(options, ({ value }) => value == _profile)}
				options={options}
			/>
		);
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

	async generatePreview() {
		const { game, getSquadImage, localTeam } = this.props;
		await this.setState({ previewImage: false });
		const image = await getSquadImage(game._id, this.state.selectedTeam.value != localTeam);
		await this.setState({ previewImage: image });
	}

	async postTweet() {
		const { game, postGameEvent, localTeam } = this.props;
		const { tweet, replyTweet, selectedTeam, _profile } = this.state;

		this.setState({ tweetSending: true });
		const options = {
			_profile,
			tweet,
			replyTweet,
			postTweet: true,
			event: "matchSquad",
			showOpposition: selectedTeam.value != localTeam
		};
		const event = await postGameEvent(game._id, options);
		this.setState({ tweetSending: false, replyTweet: event.tweet_id });
	}

	render() {
		const { teams, teamOptions, game } = this.state;

		if (game === undefined || teams === undefined) {
			return <LoadingPage />;
		}

		return (
			<div className="container pregame-image-loader">
				<div className="form-card grid">
					<label>Profile</label>
					{this.renderProfileSelector()}
					<label>Team</label>
					<Select
						styles={selectStyling}
						options={teamOptions}
						onChange={selectedTeam =>
							this.setState({
								selectedTeam
							})
						}
						isSearchable={false}
						isDisabled={teamOptions.length <= 1}
						defaultValue={this.state.selectedTeam}
					/>
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
							disabled={this.state.tweetSending}
						>
							Post
						</button>
					</div>
					{this.renderPreview()}
				</div>
				<AdminGameEventList
					game={game}
					onReply={replyTweet => this.setState({ replyTweet })}
				/>
			</div>
		);
	}
}

function mapStateToProps({ config, teams, social }) {
	const { fullTeams } = teams;
	const { localTeam } = config;
	return { fullTeams, localTeam, profiles: social };
}

export default connect(
	mapStateToProps,
	{ fetchProfiles, fetchTeam, getSquadImage, postGameEvent }
)(AdminGameSquadImage);
