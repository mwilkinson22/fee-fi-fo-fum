import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "./LoadingPage";
import NewsPostCard from "./news/NewsPostCard";
import { fetchFrontpagePosts } from "../actions/newsActions";

class HomePage extends Component {
	componentWillMount() {
		this.props.fetchFrontpagePosts();
	}

	getNewsPosts() {
		const { posts } = this.props;
		console.log(posts);
		if (!posts) {
			return <LoadingPage />;
		} else {
			const postCards = posts.map(post => {
				return <NewsPostCard post={post} key={post.slug} />;
			});
			return <div className="post-list">{postCards}</div>;
		}
	}

	render() {
		return (
			<div className="homepage">
				<section className="latest-news">
					<div className="container">
						<h2>News</h2>
						{this.getNewsPosts()}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ news }) {
	const posts = news.frontpagePosts;
	return { posts };
}

export default connect(
	mapStateToProps,
	{ fetchFrontpagePosts }
)(HomePage);
