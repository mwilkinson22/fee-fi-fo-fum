//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Redirect, NavLink } from "react-router-dom";

//Components
import SubMenu from "~/client/components/SubMenu";
import LoadingPage from "../components/LoadingPage";
import NotFoundPage from "./NotFoundPage";
import NewsPostPreview from "../components/news/NewsPostCard";
import HelmetBuilder from "../components/HelmetBuilder";

//Actions
import { fetchNewsPostPageCount, fetchNewsPostPage, fetchPostList } from "../actions/newsActions";

//Constants
import newsCategories from "../../constants/newsCategories";
import NewsPostCardPlaceholder from "~/client/components/news/NewsPostCardPlaceholder";

class NewsListPage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fetchNewsPostPageCount, pageCount, fetchNewsPostPage, pages, postList, fetchPostList, match } =
			nextProps;

		const newState = {
			category: match.params.category,
			page: match.params.page || 1,
			redirect: false
		};

		//First, make sure we've got our pageCount
		if (!pageCount) {
			if (!prevState.isLoadingPageCount) {
				fetchNewsPostPageCount();
				newState.isLoadingPageCount = true;
			}
			return newState;
		}
		newState.isLoadingPageCount = false;

		//Ensure we have a valid category/page combo
		if (!pageCount[newState.category]) {
			newState.category = "all";
			newState.redirect = true;
		}
		if (pageCount[newState.category] < newState.page) {
			newState.page = 1;
			newState.redirect = true;
		}

		//Then make sure we've got the current page
		const catPageString = `${newState.category}-${newState.page}`;
		if (!pages[newState.category][newState.page]) {
			if (prevState.isLoadingPage !== catPageString) {
				fetchNewsPostPage(newState.category, newState.page);
				newState.isLoadingPage = catPageString;
			}
			return newState;
		}
		newState.isLoadingPage = false;

		//Finally, make sure we've got all the posts we require in postList
		newState.postIds = pages[newState.category][newState.page];
		const postsMissing = newState.postIds.filter(id => !postList[id]);
		if (postsMissing.length) {
			if (prevState.isLoadingPosts !== catPageString) {
				fetchPostList(postsMissing);
				newState.isLoadingPosts = catPageString;
			}
			return newState;
		}
		newState.isLoadingPosts = false;

		return newState;
	}

	generateHeader() {
		const { pageCount } = this.props;
		const categories = [{ name: "All", slug: "all" }, ...newsCategories]
			.map(({ slug, name }) => ({ slug, label: name }))
			.filter(({ slug }) => pageCount[slug]);

		return (
			<section className="page-header">
				<div className="container">
					<h1>News</h1>
					<SubMenu items={categories} rootUrl={"/news/category/"} />
				</div>
			</section>
		);
	}

	generateList() {
		const { pages, newsPostsPerPage, postList } = this.props;
		const { category, page, postIds, isLoadingPage, isLoadingPosts } = this.state;
		let postPreviews = [];
		if (isLoadingPage || isLoadingPosts) {
			const placeholdersToShow = pages[category][page] ? pages[category][page].length : newsPostsPerPage;
			for (let i = 0; i < placeholdersToShow; i++) {
				postPreviews.push(<NewsPostCardPlaceholder key={i} />);
			}
		} else {
			postIds.forEach(id =>
				postPreviews.push(<NewsPostPreview post={postList[id]} includeContent={false} key={id} />)
			);
		}
		return <div className="news-post-list">{postPreviews}</div>;
	}

	generatePagination() {
		const { pageCount } = this.props;
		const { category } = this.state;
		const total = pageCount[category];
		if (total === 1) {
			return null;
		} else {
			let links = [];
			for (let i = 1; i <= total; i++) {
				let url = `/news/category/${category}`;
				if (i > 1) url += `/${i}`;
				links.push(
					<li key={i}>
						<NavLink exact={true} to={url} activeClassName="current-page">
							{i}
						</NavLink>
					</li>
				);
			}
			return <ul>{links}</ul>;
		}
	}

	render() {
		const { isLoadingPageCount, category, page, redirect } = this.state;
		const canonicalUrl = `/news/category/${category}${page === 1 ? "" : `/${page}`}`;
		let pageTitle = "News";
		if (category !== "all" && !_.keyBy(newsCategories, "slug")[category]) {
			return <NotFoundPage message="Category not found" />;
		} else if (isLoadingPageCount) {
			return <LoadingPage />;
		} else if (redirect) {
			return <Redirect to={canonicalUrl} />;
		} else {
			if (category !== "all") {
				pageTitle += " - " + _.keyBy(newsCategories, "slug")[category].name;
			}
			return (
				<div className="news-post-list-page">
					<HelmetBuilder title={pageTitle} canonical={canonicalUrl} />
					{this.generateHeader()}
					<section className="posts">
						<div className="container">
							{this.generateList()}
							<div className="post-pagination">{this.generatePagination()}</div>
						</div>
					</section>
				</div>
			);
		}
	}
}

function mapStateToProps({ config, news }) {
	const { newsPostsPerPage } = config;
	const { pageCount, pages, postList } = news;
	return { newsPostsPerPage, pageCount, pages, postList };
}

async function loadData(store, path) {
	let category = path.split("/")[3] || "all";
	let page = path.split("/")[4] || 1;

	//First, get the pagination
	await store.dispatch(fetchNewsPostPageCount());

	//Then the page we need
	await store.dispatch(fetchNewsPostPage(category, page));

	//Validate category & page
	const { pageCount, pages } = store.getState().news;
	if (!pageCount[category]) {
		category = "all";
		page = 1;
	} else if (pageCount[category] < page) {
		page = 1;
	}
	return store.dispatch(fetchPostList(pages[category][page]));
}

export default {
	component: connect(mapStateToProps, {
		fetchNewsPostPageCount,
		fetchNewsPostPage,
		fetchPostList
	})(NewsListPage),
	loadData
};
