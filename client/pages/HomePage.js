//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../components/LoadingPage";
import NewsPostCard from "../components/news/NewsPostCard";
import GameCard from "../components/games/GameCard";
import LeagueTable from "../components/seasons/LeagueTable";

//Actions
import { fetchPostList } from "../actions/newsActions";
import { fetchGameList, fetchGames } from "../actions/gamesActions";
import { fetchNeutralGames } from "../actions/neutralGamesActions";
import { fetchCompetitionSegments } from "../actions/competitionActions";

class HomePage extends Component {
	constructor(props) {
		super(props);
		const {
			postList,
			fetchPostList,
			gameList,
			fetchGameList,
			competitionSegmentList,
			fetchCompetitionSegments
		} = props;

		//Get dependencies
		if (!postList) {
			fetchPostList();
		}
		if (!gameList) {
			fetchGameList();
		}
		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		this.state = {
			postList
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			postList,
			gameList,
			fullGames,
			fetchGames,
			competitionSegmentList,
			teamTypes
		} = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		if (!postList || !gameList || !competitionSegmentList) {
			newState.isLoading = true;
			return newState;
		}

		//Get latest news posts
		if (!prevState.newsPosts) {
			newState.newsPosts = _.chain(postList)
				.orderBy("dateCreated", "desc")
				.chunk(3)
				.value()
				.shift();
		}

		//Get First Team TeamType
		const firstTeam = _.sortBy(teamTypes, "sortOrder")[0]._id;

		//Get league table data
		let { leagueTableDetails } = prevState;
		if (!leagueTableDetails) {
			leagueTableDetails = _.chain(gameList)
				//Filter by teamType
				.filter(g => g._teamType == firstTeam)
				//Get games in reverse order
				.orderBy("date", "desc")
				//Map to unique competition and year list
				.map(({ _competition, date }) => ({
					_competition,
					year: date.getFullYear()
				}))
				.uniqBy(({ _competition, year }) => `${_competition}${year}`)
				//Filter to league competitions
				.filter(
					({ _competition }) => competitionSegmentList[_competition].type === "League"
				)
				.value()
				.shift();
			newState.leagueTableDetails = leagueTableDetails;
		}

		//Work out required games
		//While we can technically load the LeagueTable games within the child
		//component, doing so here allows us to prevent duplication
		if (!prevState.gamesForCards) {
			//Split games into first team fixtures and results
			const now = new Date();
			const games = _.chain(gameList)
				//First Team Games Only
				.filter(game => game._teamType === firstTeam)
				//Split into two arrays, results and fixtures
				.groupBy(({ date }) => (date > now ? "results" : "fixtures"))
				.value();

			//Create empty array to store required games
			const gamesForCards = [];

			//Add last game
			if (games.fixtures && games.fixtures.length) {
				gamesForCards.push(_.maxBy(games.fixtures, "date")._id);
			}

			//Add next game
			if (games.results && games.results.length) {
				const nextGame = _.minBy(games.results, "date");
				gamesForCards.push(nextGame._id);

				//Add next home game
				if (nextGame.isAway) {
					const nextHomeGame = _.minBy(
						games.results.filter(g => !g.isAway),
						"date"
					);
					if (nextHomeGame) {
						gamesForCards(nextHomeGame._id);
					}
				}
			}

			//Get all required games for the League Table
			//Pass in an empty array for neutralGames, as these can be handled
			//by the child component with relative ease
			const gamesForTable = LeagueTable.getGames(
				leagueTableDetails._competition,
				competitionSegmentList,
				leagueTableDetails.year,
				gameList,
				[]
			).local;

			//Work out which required games still need to be loaded
			const gamesToLoad = _.uniq([...gamesForCards, ...gamesForTable]).filter(
				id => !fullGames[id]
			);

			if (gamesToLoad.length === 0) {
				//If we have no more games to load, then we assign the game objects
				//to newState
				newState.isLoadingGames = false;
				newState.gamesForCards = gamesForCards.map(id => fullGames[id]);
			} else if (!prevState.isLoadingGames) {
				//Otherwise, if we're not already loading, we do so here
				fetchGames(gamesToLoad);
				newState.isLoadingGames = true;
			}
		}

		return newState;
	}

	renderNewsPosts() {
		const { newsPosts } = this.state;
		if (!newsPosts) {
			return <LoadingPage />;
		} else {
			const postCards = newsPosts.map(post => {
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

	renderGameCards() {
		const { gamesForCards, isLoadingGames } = this.state;

		if (isLoadingGames) {
			return <LoadingPage />;
		}

		//Create Cards
		const titles = ["Last Game", "Next Game", "Next Home Game"];
		const gameCards = gamesForCards.map((game, i) => (
			<div className="game-box-wrapper" key={game._id}>
				<h2>{titles[i]}</h2>
				<GameCard game={game} includeCountdown={true} />
			</div>
		));

		return <div className="homepage-game-list">{gameCards}</div>;
	}

	renderLeagueTable() {
		const { isLoadingGames, leagueTableDetails } = this.state;

		if (isLoadingGames) {
			return <LoadingPage />;
		}

		if (leagueTableDetails) {
			return (
				<div>
					<h2>League Table</h2>
					<LeagueTable
						competition={leagueTableDetails._competition}
						year={leagueTableDetails.year}
					/>
				</div>
			);
		}
	}

	render() {
		const { isLoading } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div className="homepage">
				<section className="latest-news">{this.renderNewsPosts()}</section>
				<section className="games-and-table">
					<div className="container">
						{this.renderGameCards()}
						{this.renderLeagueTable()}
					</div>
				</section>
			</div>
		);
	}
}

async function loadData(store) {
	return Promise.all([
		store.dispatch(fetchPostList()),
		store.dispatch(fetchCompetitionSegments()),
		store.dispatch(fetchGameList())
	]);
}

function mapStateToProps({ news, games, competitions, teams }) {
	const { postList } = news;
	const { competitionSegmentList } = competitions;
	const { gameList, fullGames, neutralGames } = games;
	const { teamTypes } = teams;
	return { postList, gameList, fullGames, neutralGames, competitionSegmentList, teamTypes };
}

export default {
	component: connect(mapStateToProps, {
		fetchPostList,
		fetchGameList,
		fetchGames,
		fetchCompetitionSegments,
		fetchNeutralGames
	})(HomePage),
	loadData
};
