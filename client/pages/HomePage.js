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
import { fetchCompetitionSegments, fetchLeagueTableData } from "../actions/competitionActions";

//Helpers
import { getHomePageGameInfo } from "~/helpers/gameHelper";

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

		//Get all required games
		const { gamesForCards, leagueTableDetails } = getHomePageGameInfo(
			gameList,
			teamTypes,
			competitionSegmentList
		);

		//Set League Table Details
		newState.leagueTableDetails = leagueTableDetails;

		//Work out which required games still need to be loaded
		const gamesToLoad = gamesForCards.filter(id => !fullGames[id]);

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
					<div className="news-post-list">{postCards}</div>
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
		const { leagueTableDetails } = this.state;

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
	//Get required data
	await Promise.all([
		store.dispatch(fetchPostList()),
		store.dispatch(fetchCompetitionSegments()),
		store.dispatch(fetchGameList())
	]);

	//Get Required Redux Lists
	const { gameList } = store.getState().games;
	const { teamTypes } = store.getState().teams;
	const { competitionSegmentList } = store.getState().competitions;

	//Get game & league table data
	const { gamesForCards, leagueTableDetails } = getHomePageGameInfo(
		gameList,
		teamTypes,
		competitionSegmentList
	);

	return Promise.all([
		store.dispatch(fetchGames(gamesForCards)),
		store.dispatch(
			fetchLeagueTableData(leagueTableDetails._competition, leagueTableDetails.year)
		)
	]);
}

function mapStateToProps({ news, games, competitions, teams }) {
	const { postList } = news;
	const { competitionSegmentList } = competitions;
	const { gameList, fullGames } = games;
	const { teamTypes } = teams;
	return { postList, gameList, fullGames, competitionSegmentList, teamTypes };
}

export default {
	component: connect(mapStateToProps, {
		fetchPostList,
		fetchGameList,
		fetchGames,
		fetchCompetitionSegments
	})(HomePage),
	loadData
};
