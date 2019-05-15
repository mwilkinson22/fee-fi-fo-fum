//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchTeam } from "../../../actions/teamsActions";
import { getSquadImage } from "../../../actions/gamesActions";
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
			tweet: `Here is your Giants squad for ${
				Number(game.date.toString("H")) < 6 ? "today" : "tonight"
			}'s game against ${game._opposition.name.short}!\n\n`
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, fullTeams, localTeam } = nextProps;
		const newState = {};

		let teams = [localTeam, game._opposition._id];

		//Ensure both teams have loaded
		if (_.reject(teams, team => fullTeams[team]).length) {
			return newState;
		}

		if (!prevState.teams) {
			newState.teams = _.pick(fullTeams, [localTeam, game._opposition._id]);
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
		await this.setState({ previewImage: false });
		const { game, getSquadImage } = this.props;
		const image = await getSquadImage(game._id);
		await this.setState({ previewImage: image });
	}

	async postTweet() {}

	render() {
		const { teams } = this.state;
		const { game } = this.props;

		if (game === undefined || teams === undefined) {
			return <LoadingPage />;
		}

		return (
			<div className="container pregame-image-loader">
				<div className="form-card grid">
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

function mapStateToProps({ config, teams }, ownProps) {
	const { fullTeams } = teams;
	const { localTeam } = config;
	return { fullTeams, localTeam, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchTeam, getSquadImage }
)(AdminGamePregameImage);
