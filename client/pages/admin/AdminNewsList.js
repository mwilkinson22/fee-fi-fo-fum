//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import NewsPostCard from "../../components/news/NewsPostCard";
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchPostList } from "~/client/actions/newsActions";

class AdminNewsList extends Component {
	constructor(props) {
		super(props);
		const { postList, fetchPostList } = props;
		if (!postList) {
			fetchPostList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { postList } = nextProps;
		return { postList };
	}

	render() {
		const { postList } = this.state;

		let content;
		if (!postList) {
			content = <LoadingPage />;
		} else {
			const posts = _.chain(postList)
				.sortBy("dateCreated")
				.reverse()
				.map(post => (
					<NewsPostCard post={post} isAdminList={true} key={post._id} hideImage={true} />
				))
				.value();
			content = <div className="container news-post-list">{posts}</div>;
		}

		return (
			<div className="admin-page admin-news-list">
				<section className="page-header">
					<div className="container">
						<h1>News Posts</h1>
						<Link className="card nav-card" to="/admin/news/post/new">
							Create New Post
						</Link>
					</div>
				</section>
				<section>{content}</section>
			</div>
		);
	}
}

function mapStateToProps({ news }) {
	const { postList } = news;
	return { postList };
}

export default connect(mapStateToProps, { fetchPostList })(AdminNewsList);
