import React, { Component } from "react";
import connect from "react-redux/es/connect/connect";
import { fetchRecentPosts } from "../../actions/newsActions";
import LoadingPage from "../LoadingPage";
import NewsPostPreview from "./NewsPostPreview";

class NewsList extends Component {
	componentWillMount() {
		if (!this.props.recentPosts) this.props.fetchRecentPosts();
	}

	formatList() {
		return this.props.recentPosts.map(post => {
			return <NewsPostPreview post={post} includeContent={false} key={post.slug} />;
		});
	}

	render() {
		const { recentPosts } = this.props;
		if (!recentPosts) {
			return <LoadingPage />;
		} else {
			return (
				<div className="container">
					<div className="post-list">{this.formatList()}</div>
				</div>
			);
		}
	}
}

function mapStateToProps({ news }, ownProps) {
	const { recentPosts } = news;
	return { recentPosts };
}

export default connect(
	mapStateToProps,
	{ fetchRecentPosts }
)(NewsList);
