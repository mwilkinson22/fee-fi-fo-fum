import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../components/LoadingPage";
import NewsPostCard from "../components/news/NewsPostCard";
import GameCard from "../components/games/GameCard";
import { fetchHomepagePosts } from "../actions/newsActions";
import { fetchHomepageGames } from "../actions/gamesActions";
import { fetchLeagueTable } from "../actions/seasonActions";
import LeagueTable from "../components/seasons/LeagueTable";
const superLeagueId = "5c05342af22062c1fc3fe3c5";

//TODO automatically add correct year + competition

class HomePage extends Component {
	constructor(props) {
		super(props);
		const { homepagePosts, homepageGames } = props;
		this.state = {
			homepagePosts,
			homepageGames
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { homepagePosts, homepageGames, fetchHomepagePosts, fetchHomepageGames } = nextProps;
		const newState = {};
		// console.log(homepagePosts);
		if (!homepagePosts) {
			fetchHomepagePosts();
		} else {
			newState.homepagePosts = homepagePosts;
		}
		if (!homepageGames) {
			fetchHomepageGames();
		} else {
			newState.homepageGames = homepageGames;
		}

		return newState;
	}

	generateNewsPosts() {
		const { homepagePosts } = this.state;
		if (!homepagePosts) {
			return <LoadingPage />;
		} else {
			const postCards = homepagePosts.map(post => {
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
		const { homepageGames } = this.state;
		if (!homepageGames) {
			return <LoadingPage />;
		} else {
			const titles = ["Last Game", "Next Game", "Next Home Game"];
			let i = 0;
			const games = homepageGames.map(game => {
				return (
					<div className="game-box-wrapper" key={game._id}>
						<h2>{titles[i++]}</h2>
						<GameCard game={game} includeCountdown={true} />
					</div>
				);
			});
			return <div className="homepage-game-list">{games}</div>;
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
							<LeagueTable
								competition={superLeagueId}
								year={new Date().getFullYear()}
							/>
						</div>
					</div>
				</section>
				<section className="latest-league-table" />
			</div>
		);
	}
}

function loadData(store) {
	const promises = [
		store.dispatch(fetchHomepageGames()),
		store.dispatch(fetchHomepagePosts()),
		store.dispatch(fetchLeagueTable(superLeagueId, new Date().getFullYear()))
	];
	return Promise.all(promises);
}

function mapStateToProps(state) {
	const { news, games } = state;
	const { homepagePosts } = news;
	const { homepageGames } = games;
	return { homepagePosts, homepageGames };
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchHomepagePosts, fetchHomepageGames }
	)(HomePage),
	loadData
};
