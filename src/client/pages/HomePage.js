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
import { fetchHomePageGames } from "../actions/gamesActions";
import { fetchHomePageLeagueTableData } from "../actions/competitionActions";

class HomePage extends Component {
	constructor(props) {
		super(props);
		const {
			homePageGames,
			fetchHomePageGames,
			fullGames,
			homePageLeagueTable,
			fetchHomePageLeagueTableData
		} = props;

		//Get League Table Data
		if (homePageLeagueTable === undefined) {
			fetchHomePageLeagueTableData();
		}

		//Get Game Cards
		if (!homePageGames) {
			fetchHomePageGames();
		} else {
			//Check the "next" game isn't now in the past,
			//for cached values
			if (homePageGames.length > 1 && fullGames[homePageGames[1]].date < new Date()) {
				fetchHomePageGames();
			}
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { postList, fullGames, homePageLeagueTable, homePageGames } = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		if (!homePageGames || homePageLeagueTable === undefined) {
			newState.isLoading = true;
			return newState;
		}

		//Get latest news posts
		newState.newsPosts = _.chain(postList)
			.orderBy("dateCreated", "desc")
			.chunk(3)
			.value()
			.shift();

		//Set League Table Details
		newState.leagueTableDetails = homePageLeagueTable;

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
					<LeagueTable competition={leagueTableDetails._competition} year={leagueTableDetails.year} />
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
	return Promise.all([store.dispatch(fetchHomePageGames()), store.dispatch(fetchHomePageLeagueTableData())]);
}

function mapStateToProps({ news, games, competitions }) {
	const { postList } = news;
	const { homePageLeagueTable } = competitions;
	const { fullGames, homePageGames } = games;
	return {
		postList,
		fullGames,
		homePageGames,
		homePageLeagueTable
	};
}

export default {
	component: connect(mapStateToProps, {
		fetchHomePageGames,
		fetchHomePageLeagueTableData
	})(HomePage),
	loadData
};
