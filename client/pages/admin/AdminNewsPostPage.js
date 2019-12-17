//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Route, Switch } from "react-router-dom";

//Components
import ErrorBoundary from "../../components/ErrorBoundary";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "../../components/HelmetBuilder";
import NotFoundPage from "~/client/pages/NotFoundPage";
import SubMenu from "../../components/SubMenu";

//Forms
import AdminNewsPostOverview from "../../components/admin/news/AdminNewsPostOverview";
import AdminNewsPostContent from "../../components/admin/news/AdminNewsPostContent";
import AdminNewsPostTags from "../../components/admin/news/AdminNewsPostTags";

//Actions
import { fetchPostList, fetchNewsPost } from "~/client/actions/newsActions";
import { fetchUserList } from "~/client/actions/userActions";
import { fetchGameList } from "~/client/actions/gamesActions";

class AdminNewsPostPage extends Component {
	constructor(props) {
		super(props);

		const { postList, fetchPostList } = props;

		if (!postList) {
			fetchPostList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fullPosts, match, fetchNewsPost, postList } = nextProps;
		const { _id } = match.params;
		const newState = { isLoadingLists: false };

		//Is New
		newState.isNew = !_id;

		//Check we have the info we need
		if (!postList) {
			return { isLoadingLists: true };
		}

		//Check Post Exists
		if (!postList[_id]) {
			newState.post = false;
			return newState;
		}

		//Check post is loaded
		if (!newState.isNew) {
			if (fullPosts[_id]) {
				newState.post = fullPosts[_id];
				newState.isLoadingPost = false;
			} else if (!prevState.isLoadingPost) {
				fetchNewsPost(_id);
				newState.isLoadingPost = true;
			}
		}

		return newState;
	}

	renderViewLink() {
		const { post } = this.state;
		if (post && post.isPublished) {
			return (
				<Link className="card nav-card" to={`/news/post/${post.slug}`}>
					View this post
				</Link>
			);
		} else {
			return null;
		}
	}

	renderHeader() {
		const { authUser } = this.props;
		const { isNew, post } = this.state;

		//Get "View" link
		let viewLink;
		if (post && (post.isPublished || authUser.isAdmin)) {
			viewLink = (
				<Link className="card nav-card" to={`/news/post/${post.slug}`}>
					View this post
				</Link>
			);
		}

		//Create Submenu
		let submenu;
		if (!isNew) {
			const items = [
				{ label: "Overview", slug: "", isExact: true },
				{ label: "Content", slug: "content" },
				{ label: "Tags", slug: "tags" }
			];

			submenu = (
				<div className="container">
					<SubMenu items={items} rootUrl={`/admin/news/post/${post._id}/`} />
				</div>
			);
		}

		//Get Page Title
		const title = isNew ? "New Post" : post.title;

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<Link className="nav-card card" to="/admin/news">
						↩ Return to post list
					</Link>
					{viewLink}
					<h1>{title}</h1>
					{submenu}
				</div>
			</section>
		);
	}

	renderContent() {
		return (
			<section className="form">
				<div className="container">
					<ErrorBoundary>
						<Switch>
							<Route
								path="/admin/news/post/new"
								exact
								component={AdminNewsPostOverview}
							/>
							<Route
								path="/admin/news/post/:_id/tags"
								component={AdminNewsPostTags}
							/>
							<Route
								path="/admin/news/post/:_id/content"
								component={AdminNewsPostContent}
							/>
							<Route
								path="/admin/news/post/:_id"
								exact
								component={AdminNewsPostOverview}
							/>
							<Route path="/" component={NotFoundPage} />
						</Switch>
					</ErrorBoundary>
				</div>
			</section>
		);
	}

	render() {
		const { post, isNew, isLoadingLists, isLoadingPost } = this.state;

		//Await additional resources
		if (isLoadingLists || isLoadingPost) {
			return <LoadingPage />;
		}

		//404
		if (!isNew && !post) {
			return <NotFoundPage error={"Post not found"} />;
		}

		return (
			<div className="admin-news-page">
				{this.renderHeader()}
				{this.renderContent()}
			</div>
		);
	}
}

function mapStateToProps({ config, games, news, users }) {
	const { authUser } = config;
	const { postList, fullPosts } = news;
	const { userList } = users;
	const { gameList } = games;
	return { authUser, postList, fullPosts, userList, gameList };
}

export default connect(
	mapStateToProps,
	{
		fetchPostList,
		fetchNewsPost,
		fetchUserList,
		fetchGameList
	}
)(AdminNewsPostPage);
