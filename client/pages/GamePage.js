//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import HelmetBuilder from "../components/HelmetBuilder";
import LoadingPage from "../components/LoadingPage";
import Countdown from "../components/games/Countdown";
import GameHeaderImage from "../components/games/GameHeaderImage";
import NotFoundPage from "./NotFoundPage";
import TeamBanner from "../components/teams/TeamBanner";
import TeamForm from "../components/games/TeamForm";
import PregameSquadList from "../components/games/PregameSquadList";
import MatchSquadList from "../components/games/MatchSquadList";
import GameEvents from "../components/games/GameEvents";
import NewsPostCard from "../components/news/NewsPostCard";
import HeadToHeadStats from "../components/games/HeadToHeadStats";
import GameStars from "../components/games/GameStars";

//Actions
import { fetchGames, fetchGameList } from "../actions/gamesActions";
import { fetchTeam } from "../actions/teamsActions";
import { fetchPostList } from "~/client/actions/newsActions";

//Constants
import { imagePath } from "../extPaths";
import { Redirect } from "react-router-dom";

//Helpers
import { getLastGame } from "~/helpers/gameHelper";

class GamePage extends Component {
	constructor(props) {
		super(props);

		const {
			slugMap,
			fetchGameList,
			fullTeams,
			localTeam,
			fetchTeam,
			postList,
			fetchPostList
		} = props;

		if (!slugMap) {
			fetchGameList();
		}

		if (!postList) {
			fetchPostList();
		}

		if (!fullTeams[localTeam]) {
			fetchTeam(localTeam);
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = {};

		const { match, slugMap, gameList, fullGames, fetchGames, fullTeams, localTeam } = nextProps;

		if (slugMap && fullTeams[localTeam]) {
			const { id } = slugMap[match.params.slug];
			const previousId = getLastGame(id, gameList);

			//Get Previous Id
			const gamesRequired = [id];
			if (previousId) {
				gamesRequired.push(previousId);
			}

			//Check for missing games
			const gamesToLoad = gamesRequired.filter(id => !fullGames[id]);

			if (gamesToLoad.length) {
				fetchGames(gamesToLoad);
				newState.game = undefined;
			} else {
				newState.game = fullGames[id];
				newState.previousGame = fullGames[previousId];
				newState.isFixture = newState.game.date >= new Date();
			}
		}

		return newState;
	}

	generateHeaderInfoBar() {
		const { game } = this.state;
		const fields = [
			<span key="ground">
				{game._ground.name}, {game._ground.address._city.name}
			</span>,
			<span key="date">{game.date.toString("dddd dS MMM yyyy H:mm")}</span>,
			<span key="title">{game.title}</span>
		];

		if (game.hashtags && game.hashtags.length) {
			fields.push(
				<span key="hashtag" className="hashtag">
					#{game.hashtags[0]}
				</span>
			);
		}

		if (game.tv)
			fields.push(
				<img
					key="tv"
					src={`${imagePath}layout/icons/${game.tv}.svg`}
					className="tv-logo"
					alt={`${game.tv} Logo`}
				/>
			);

		return (
			<ul>
				{fields.map((field, i) => (
					<li key={i}>{field}</li>
				))}
			</ul>
		);
	}

	generateTeamBanners() {
		const { isAway, score, _opposition } = this.state.game;
		const { localTeam, fullTeams } = this.props;
		let teams = [fullTeams[localTeam], _opposition];
		if (isAway) {
			teams = teams.reverse();
		}

		return teams.map(team => (
			<TeamBanner key={team._id} team={team} score={score ? score[team._id] : null} />
		));
	}

	generateEditLink() {
		const { authUser } = this.props;
		const { game } = this.state;
		if (authUser) {
			return (
				<Link to={`/admin/game/${game.slug}`} className="nav-card">
					Edit this game
				</Link>
			);
		} else {
			return null;
		}
	}

	generateCountdown() {
		const { isFixture, game } = this.state;
		if (isFixture) {
			return (
				<section className="countdown">
					<div className="container">
						<h3>Countdown to Kickoff</h3>
						<Countdown
							date={game.date}
							onFinish={() => this.setState({ isFixture: false })}
						/>
					</div>
				</section>
			);
		} else {
			return null;
		}
	}

	generatePregameList() {
		const { game, previousGame } = this.state;
		if (!game._competition.instance.usesPregameSquads || game.squadsAnnounced) {
			return null;
		} else {
			return <PregameSquadList game={game} previousGame={previousGame} />;
		}
	}

	generateEvents() {
		const { game } = this.state;
		if (game.squadsAnnounced) {
			return <GameEvents game={game} />;
		} else {
			return null;
		}
	}

	generateSquads() {
		const { game } = this.state;
		if (game.squadsAnnounced) {
			return <MatchSquadList game={game} />;
		} else {
			return null;
		}
	}

	generateForm() {
		if (this.state.isFixture) {
			return <TeamForm game={this.state.game} />;
		} else {
			return null;
		}
	}

	generateNewsPosts() {
		const { postList } = this.props;
		const { game } = this.state;
		let gamePosts = [];
		if (postList) {
			gamePosts = _.chain(postList)
				.filter(p => p._game == game._id)
				.map(p => <NewsPostCard post={p} key={p._id} />)
				.value();
		}

		if (gamePosts.length) {
			return (
				<section className="news">
					<h2>News</h2>
					<div className="container">
						<div className="post-list">{gamePosts}</div>
					</div>
				</section>
			);
		} else {
			return null;
		}
	}

	getPageTitle() {
		const { isAway, scores, _opposition, date } = this.state.game;
		let strings;
		if (scores) {
			strings = [
				"Huddersfield Giants",
				" ",
				scores["5c041478e2b66153542b3742"],
				"-",
				scores[_opposition._id],
				" ",
				_opposition.name.long
			];
		} else {
			strings = ["Huddersfield Giants", " vs ", _opposition.name.long];
		}
		if (isAway) {
			strings = strings.reverse();
		}

		return strings.join("") + " - " + new Date(date).toString("dd/MM/yyyy");
	}

	generateStats() {
		const { game } = this.state;
		if (game._competition.instance.scoreOnly || game.status < 3) {
			return null;
		} else {
			return [
				<HeadToHeadStats game={game} key="head-to-head" />,
				<GameStars game={game} key="game-stars" />
			];
		}
	}

	render() {
		const { postList } = this.props;
		const { game } = this.state;
		if (game === undefined) {
			return <LoadingPage />;
		} else if (game.redirect) {
			return <Redirect to={`/games/${game.slug}`} />;
		} else if (!game) {
			return <NotFoundPage message="Game not found" />;
		} else if (!postList) {
			return <LoadingPage />;
		} else {
			return (
				<div className="game-page">
					<HelmetBuilder title={this.getPageTitle()} canonical={`games/${game.slug}`} />
					<section className="header">
						<GameHeaderImage game={game} className="game-header-image" />
						<div className="game-details">
							<div className="container">{this.generateHeaderInfoBar()}</div>
						</div>
						<div className="team-banners">{this.generateTeamBanners()}</div>
						{this.generateEditLink()}
					</section>
					{this.generateCountdown()}
					{this.generateNewsPosts()}
					{this.generateEvents()}
					{this.generatePregameList()}
					{this.generateForm()}
					{this.generateSquads()}
					{this.generateStats()}
				</div>
			);
		}
	}
}

function mapStateToProps({ games, config, teams, news }, ownProps) {
	const { fullGames, slugMap, gameList } = games;
	const { localTeam, authUser } = config;
	const { fullTeams } = teams;
	const { postList } = news;
	return { fullGames, slugMap, postList, localTeam, authUser, gameList, fullTeams, ...ownProps };
}

async function loadData(store, path) {
	const slug = path.split("/")[2];
	const { localTeam } = store.getState().config;
	await Promise.all([
		store.dispatch(fetchPostList()),
		store.dispatch(fetchGameList()),
		store.dispatch(fetchTeam(localTeam))
	]);
	const { id } = store.getState().games.slugMap[slug];
	const gamesToLoad = [id];
	const previousId = getLastGame(id, store.getState().games.gameList);
	if (previousId) {
		gamesToLoad.push(previousId);
	}
	return store.dispatch(fetchGames(gamesToLoad));
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchGames, fetchGameList, fetchTeam, fetchPostList }
	)(GamePage),
	loadData
};
