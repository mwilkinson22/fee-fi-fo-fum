import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "./LoadingPage";
import NewsPostCard from "./news/NewsPostCard";
import GameCard from "./games/GameCard";
import { fetchFrontpagePosts } from "../actions/newsActions";
import { fetchFrontpageGames } from "../actions/gamesActions";

class HomePage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const {
			frontpagePosts,
			frontpageGames,
			fetchFrontpagePosts,
			fetchFrontpageGames
		} = nextProps;
		const newState = {};
		if (!frontpagePosts) {
			fetchFrontpagePosts();
		} else {
			newState.frontpagePosts = frontpagePosts;
		}
		if (!frontpageGames) {
			fetchFrontpageGames();
		} else {
			newState.frontpageGames = frontpageGames;
		}

		return newState;
	}

	generateNewsPosts() {
		const { frontpagePosts } = this.state;
		if (!frontpagePosts) {
			return <LoadingPage />;
		} else {
			const postCards = frontpagePosts.map(post => {
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
		const { frontpageGames } = this.state;
		if (!frontpageGames) {
			return <LoadingPage />;
		} else {
			const titles = ["Last Game", "Next Game", "Next Home Game"];
			let i = 0;
			const games = frontpageGames.map(game => {
				return (
					<div className="game-box-wrapper" key={game._id}>
						<h2>{titles[i++]}</h2>
						<GameCard game={game} includeCountdown={true} />
					</div>
				);
			});
			return <div className="frontpage-game-list">{games}</div>;
		}
	}

	render() {
		return (
			<div className="homepage">
				<section className="latest-news">{this.generateNewsPosts()}</section>
				<section className="games-and-table">
					<div className="container">{this.generateGames()}</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ news, games }) {
	const { frontpagePosts } = news;
	const { frontpageGames } = games;
	return { frontpagePosts, frontpageGames };
}

export default connect(
	mapStateToProps,
	{ fetchFrontpagePosts, fetchFrontpageGames }
)(HomePage);
