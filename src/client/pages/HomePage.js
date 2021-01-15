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
import { fetchGameList, fetchHomePageGames } from "../actions/gamesActions";
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
			fetchCompetitionSegments,
			homePageGames,
			fetchHomePageGames,
			fullGames
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

		if (!homePageGames) {
			fetchHomePageGames();
		} else {
			//Check the "next" game isn't now in the past,
			//for cached values
			if (homePageGames.length > 1 && fullGames[homePageGames[1]].date < new Date()) {
				fetchHomePageGames();
			}
		}

		this.state = {
			postList
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const {
			postList,
			gameList,
			fullGames,
			competitionSegmentList,
			teamTypes,
			homePageGames
		} = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		if (!postList || !gameList || !competitionSegmentList || !homePageGames) {
			newState.isLoading = true;
			return newState;
		}

		//Get latest news posts
		newState.newsPosts = _.chain(postList)
			.orderBy("dateCreated", "desc")
			.chunk(3)
			.value()
			.shift();

		//Get all required games
		const { leagueTableDetails } = getHomePageGameInfo(
			gameList,
			teamTypes,
			competitionSegmentList
		);

		//Set League Table Details
		newState.leagueTableDetails = leagueTableDetails;

		//Get games for cards
		newState.gamesForCards = _.sortBy(
			homePageGames.map(id => fullGames[id]),
			"date"
		);

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
		const { gamesForCards, isLoading } = this.state;

		if (isLoading) {
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
		store.dispatch(fetchGameList()),
		store.dispatch(fetchHomePageGames())
	]);

	//Get Required Redux Lists
	const { gameList } = store.getState().games;
	const { teamTypes } = store.getState().teams;
	const { competitionSegmentList } = store.getState().competitions;

	//Get game & league table data
	const { leagueTableDetails } = getHomePageGameInfo(gameList, teamTypes, competitionSegmentList);

	return store.dispatch(
		fetchLeagueTableData(leagueTableDetails._competition, leagueTableDetails.year)
	);
}

function mapStateToProps({ news, games, competitions, teams }) {
	const { postList } = news;
	const { competitionSegmentList } = competitions;
	const { gameList, fullGames, homePageGames } = games;
	const { teamTypes } = teams;
	return {
		postList,
		gameList,
		fullGames,
		homePageGames,
		competitionSegmentList,
		teamTypes
	};
}

export default {
	component: connect(mapStateToProps, {
		fetchPostList,
		fetchGameList,
		fetchHomePageGames,
		fetchCompetitionSegments
	})(HomePage),
	loadData
};
