import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../components/LoadingPage";
import NewsPostCard from "../components/news/NewsPostCard";
import GameCard from "../components/games/GameCard";
import { fetchPostList } from "../actions/newsActions";
import { fetchGameList, fetchGames } from "../actions/gamesActions";
import { fetchNeutralGames } from "../actions/neutralGamesActions";
import { fetchCompetitionSegments } from "../actions/competitionActions";
import LeagueTable from "../components/seasons/LeagueTable";
const leagueTableCompetition = "5c05342af22062c1fc3fe3c5";
const leagueTableYear = new Date().getFullYear();
const firstTeam = "5c34e00a0838a5b090f8c1a7";

//TODO automatically add correct year + competition

class HomePage extends Component {
	constructor(props) {
		super(props);
		const {
			postList,
			fetchPostList,
			gameList,
			fetchGameList,
			competitionSegments,
			fetchCompetitionSegments,
			neutralGames,
			fetchNeutralGames
		} = props;
		if (!postList) {
			fetchPostList();
		}
		if (!gameList) {
			fetchGameList();
		}
		if (!competitionSegments) {
			fetchCompetitionSegments();
		}
		if (!neutralGames) {
			fetchNeutralGames();
		}
		this.state = {
			postList
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			postList,
			gameList,
			neutralGames,
			fullGames,
			fetchGames,
			competitionSegmentList
		} = nextProps;
		const newState = { competitionSegmentList };

		if (!competitionSegmentList) {
			return {};
		}

		//Posts
		if (postList) {
			newState.postList = _.chain(postList)
				.values()
				.sortBy("dateCreated")
				.reverse()
				.chunk(3)
				.value()[0];
		}

		//Games
		if (gameList && !prevState.games) {
			const games = HomePage.getGameIds(gameList, neutralGames, competitionSegmentList);

			const gamesToLoad = _.chain(games)
				.values()
				.flatten()
				.uniq()
				.reject(id => fullGames[id])
				.value();

			if (gamesToLoad.length === 0) {
				newState.games = _.map(games.boxes, game => fullGames[game]);
			} else {
				fetchGames(gamesToLoad);
			}
		}

		return newState;
	}

	static getGameIds(gameList, neutralGames, competitionSegments) {
		const now = new Date();
		const boxGames = [];
		//Last Game
		boxGames.push(
			_.chain(gameList)
				.filter(game => game.date <= now)
				.filter(game => game._teamType === firstTeam)
				.sortBy("date")
				.reverse()
				.value()[0]
		);

		//Next Games
		const fixtures = _.chain(gameList)
			.filter(game => game.date > now)
			.filter(game => game._teamType === firstTeam)
			.sortBy("date")
			.value();
		const homeFixtures = _.reject(fixtures, game => game.isAway);

		if (fixtures.length) {
			boxGames.push(fixtures[0]);

			//Next Home Game
			if (boxGames[1].isAway && homeFixtures.length) {
				boxGames.push(homeFixtures[0]);
			}
		}

		const boxGameIds = _.map(boxGames, g => g._id);
		const tableGameIds = LeagueTable.getGames(
			leagueTableCompetition,
			competitionSegments,
			leagueTableYear,
			gameList,
			neutralGames
		).local;
		return {
			boxes: boxGameIds,
			table: tableGameIds
		};
	}

	generateNewsPosts() {
		const { postList } = this.state;
		if (!postList) {
			return <LoadingPage />;
		} else {
			const postCards = postList.map(post => {
				return <NewsPostCard post={post} key={post.slug} />;
			});
			return (
				<div className="container">
					<h2>Latest News</h2>
					<div className="post-list">{postCards}</div>
				</div>
			);
		}
	}

	generateGames() {
		const { games } = this.state;
		if (!games) {
			return <LoadingPage />;
		} else {
			const titles = ["Last Game", "Next Game", "Next Home Game"];
			const gameCards = _.map(games, (game, i) => {
				return (
					<div className="game-box-wrapper" key={game._id}>
						<h2>{titles[i]}</h2>
						<GameCard game={game} includeCountdown={true} />
					</div>
				);
			});
			return <div className="homepage-game-list">{gameCards}</div>;
		}
	}

	render() {
		const { competitionSegmentList } = this.state;

		if (!competitionSegmentList) {
			return <LoadingPage />;
		}

		return (
			<div className="homepage">
				<section className="latest-news">{this.generateNewsPosts()}</section>
				<section className="games-and-table">
					<div className="container">
						{this.generateGames()}
						<div>
							<h2>League Table</h2>
							<LeagueTable
								competition={leagueTableCompetition}
								year={leagueTableYear}
							/>
						</div>
					</div>
				</section>
				<section className="latest-league-table" />
			</div>
		);
	}
}

async function loadData(store) {
	await Promise.all([
		store.dispatch(fetchPostList()),
		store.dispatch(fetchCompetitionSegments()),
		store.dispatch(fetchGameList()),
		store.dispatch(fetchNeutralGames())
	]);
	const { gameList, neutralGames } = store.getState().games;
	const { competitionSegmentList } = store.getState().competitions;
	const gamesToLoad = _.values(
		HomePage.getGameIds(gameList, neutralGames, competitionSegmentList)
	);
	return store.dispatch(fetchGames(_.flatten(gamesToLoad)));
}

function mapStateToProps({ news, games, competitions }) {
	const { postList } = news;
	const { competitionSegmentList } = competitions;
	const { gameList, fullGames, neutralGames } = games;
	return { postList, gameList, fullGames, neutralGames, competitionSegmentList };
}

export default {
	component: connect(
		mapStateToProps,
		{
			fetchPostList,
			fetchGameList,
			fetchGames,
			fetchCompetitionSegments,
			fetchNeutralGames
		}
	)(HomePage),
	loadData
};
