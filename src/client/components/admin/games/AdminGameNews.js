//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter, Link } from "react-router-dom";

//Components
import LoadingPage from "../../LoadingPage";
import NewsPostCard from "../../news/NewsPostCard";

//Actions
import { fetchPostList } from "~/client/actions/newsActions";

class AdminGameNews extends Component {
	constructor(props) {
		super(props);
		const { postList, fetchPostList } = props;

		if (!postList) {
			fetchPostList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, postList } = nextProps;
		const newState = { isLoading: false };

		//Await post list
		if (!postList) {
			newState.isLoading = true;
			return newState;
		}

		//Get game id
		newState.gameId = match.params._id;

		//Get posts
		newState.posts = _.chain(postList)
			//For this game only
			.filter(({ _game }) => _game == newState.gameId)
			//Filter by category
			.groupBy("category")
			.value();

		return newState;
	}

	wrapPosts(posts) {
		const cards = posts.map(p => <NewsPostCard post={p} key={p._id} isAdminList={true} />);
		return <div className="post-list">{cards}</div>;
	}

	render() {
		const { gameId, isLoading, posts } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}

		//Split posts by category
		const { previews, recaps, ...otherCategories } = posts;

		//Format Preview Posts
		let previewPosts;
		if (previews) {
			previewPosts = this.wrapPosts(previews);
		} else {
			previewPosts = (
				<Link to={`/admin/news/post/new?preview=${gameId}`}>Add Preview Post</Link>
			);
		}

		//Format Recap Posts
		let recapPosts;
		if (recaps) {
			recapPosts = this.wrapPosts(recaps);
		} else {
			recapPosts = <Link to={`/admin/news/post/new?recap=${gameId}`}>Add Recap Post</Link>;
		}

		//Format other posts
		let otherPosts = [];
		if (otherCategories) {
			for (const category in otherCategories) {
				otherPosts.push(
					<div className="category-wrapper" key={category}>
						<h6>{category}</h6>
						{this.wrapPosts(otherCategories[category])}
					</div>
				);
			}
		}

		return (
			<div className="form-card admin-game-news">
				<div className="category-wrapper">
					<h6>Previews</h6>
					{previewPosts}
				</div>
				<div className="category-wrapper">
					<h6>Recaps</h6>
					{recapPosts}
				</div>
				{otherPosts}
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ news }) {
	const { postList } = news;

	return { postList };
}
// export default form;
export default withRouter(connect(mapStateToProps, { fetchPostList })(AdminGameNews));
