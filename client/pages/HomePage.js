import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../components/LoadingPage";
import NewsPostCard from "../components/news/NewsPostCard";
import GameCard from "../components/games/GameCard";
import { fetchPostList } from "../actions/newsActions";
import { fetchGameList, fetchGames } from "../actions/gamesActions";
import { fetchLeagueTable } from "../actions/seasonActions";
import LeagueTable from "../components/seasons/LeagueTable";
const superLeagueId = "5c05342af22062c1fc3fe3c5";
const firstTeam = "5c34e00a0838a5b090f8c1a7";

//TODO automatically add correct year + competition

class HomePage extends Component {
	constructor(props) {
		super(props);
		const { postList, fetchPostList, gameList, fetchGameList } = props;
		if (!postList) {
			fetchPostList();
		}
		if (!gameList) {
			fetchGameList();
		}
		this.state = {
			postList
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { postList, gameList, fullGames, fetchGames } = nextProps;
		const newState = {};

		//Posts
		if (postList) {
			newState.postList = _.chain(postList)
				.values()
				.sortBy("datePublished")
				.reverse()
				.chunk(3)
				.value()[0];
		}

		//Games
		if (gameList && !prevState.games) {
			const games = HomePage.getGameIds(gameList);

			const gamesToLoad = _.chain(games)
				.reject(id => fullGames[id])
				.value();

			if (gamesToLoad.length === 0) {
				newState.games = _.map(games, game => fullGames[game]);
			} else {
				fetchGames(gamesToLoad);
			}
		}

		return newState;
	}

	static getGameIds(gameList) {
		const now = new Date();
		const games = [];
		//Last Game
		games.push(
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
			games.push(fixtures[0]);

			//Next Home Game
			if (games[1].isAway && homeFixtures.length) {
				games.push(homeFixtures[0]);
			}
		}

		return _.map(games, g => g._id);
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
		return (
			<div className="homepage">
				<section className="latest-news">{this.generateNewsPosts()}</section>
				<section className="games-and-table">
					<div className="container">
						{this.generateGames()}
						<div>
							<h2>League Table</h2>
							{/*
							<LeagueTable
								competition={superLeagueId}
								year={new Date().getFullYear()}
							/>
							*/}
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
		store.dispatch(fetchGameList())
		// store.dispatch(fetchLeagueTable(superLeagueId, new Date().getFullYear()))
	]);
	const { gameList } = store.getState().games;
	await store.dispatch(fetchGames(HomePage.getGameIds(gameList)));
	const promises = [];
	return Promise.all(promises);
}

function mapStateToProps({ news, games }) {
	const { postList } = news;
	const { gameList, fullGames } = games;
	return { postList, gameList, fullGames };
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchPostList, fetchGameList, fetchGames }
	)(HomePage),
	loadData
};
