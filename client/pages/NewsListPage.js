import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchPostPagination, fetchPostList } from "../actions/newsActions";
import LoadingPage from "../components/LoadingPage";
import NewsPostPreview from "../components/news/NewsPostCard";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import HelmetBuilder from "../components/HelmetBuilder";
import newsCategories from "../../constants/newsCategories";

class NewsListPage extends Component {
	constructor(props) {
		super(props);

		const { postList, pages } = props;
		const { category } = props.match.params;
		const page = props.match.params.page || 1;

		this.state = {
			postList,
			pages,
			page,
			category
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};
		const { fetchPostPagination, fetchPostList, match, pages, postList } = nextProps;

		//Detect new category
		const newCategory = match.params.category;
		if (newCategory != prevState.category) {
			newState.category = newCategory;
		}

		//Detect new page
		const newPage = match.params.page || 1;
		if (newPage != prevState.page) {
			newState.page = newPage;
		}

		//Get pagination for new category
		if (!pages[newCategory]) {
			fetchPostPagination(newCategory);
		}

		//Get pages
		if (!postList[newCategory] || !postList[newCategory][newPage]) {
			fetchPostList(newCategory, newPage);
		}

		//Update with new data
		newState.postList = nextProps.postList;
		newState.pages = nextProps.pages;

		return newState;
	}

	generateHeader() {
		const categories = _.concat([{ name: "All", slug: "all" }], newsCategories);
		const subMenu = categories.map(category => {
			return (
				<NavLink key={category.slug} to={`/news/${category.slug}`} activeClassName="active">
					{category.name}
				</NavLink>
			);
		});
		return (
			<section className="page-header">
				<div className="container">
					<h1>News</h1>
					<div className="sub-menu">{subMenu}</div>
				</div>
			</section>
		);
	}

	generateList() {
		const { postList, page, category } = this.state;
		if (!postList[category] || !postList[category][page]) {
			return <LoadingPage fullscreen={true} />;
		} else {
			const posts = this.props.postList[category][page];

			const postPreviews = _.map(posts, post => {
				return <NewsPostPreview post={post} includeContent={false} key={post.slug} />;
			});
			return <div className="post-list">{postPreviews}</div>;
		}
	}

	generatePagination() {
		const { pages, category } = this.state;
		if (pages[category] === 1) {
			return null;
		} else {
			let links = [];
			for (let i = 1; i <= pages[category]; i++) {
				let url = `/news/${category}`;
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
		const { category } = this.state;
		let pageTitle = "News";
		if (category !== "all") {
			pageTitle += " - " + _.keyBy(newsCategories, "slug")[category].name;
		}
		return (
			<div className="post-list-page">
				<HelmetBuilder title={pageTitle} canonical={`news/${category}`} />
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

function mapStateToProps({ news }, ownProps) {
	const { postList, pages } = news;
	return { postList, pages };
}

async function loadData(store, path) {
	const splitPath = path.split("/");
	const category = splitPath.length > 2 ? path.split("/")[2] : "all";
	const page = splitPath.length > 3 ? path.split("/")[3] : 1;
	const promises = [
		store.dispatch(fetchPostPagination(category)),
		store.dispatch(fetchPostList(category, page))
	];

	return Promise.all(promises);
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchPostPagination, fetchPostList }
	)(NewsListPage),
	loadData
};
