//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { NavLink } from "react-router-dom";

//Components
import SubMenu from "~/client/components/SubMenu";
import LoadingPage from "../components/LoadingPage";
import NotFoundPage from "./NotFoundPage";
import NewsPostPreview from "../components/news/NewsPostCard";
import HelmetBuilder from "../components/HelmetBuilder";

//Actions
import { fetchPostList } from "../actions/newsActions";

//Constants
import newsCategories from "../../constants/newsCategories";

class NewsListPage extends Component {
	constructor(props) {
		super(props);

		const { postList, fetchPostList } = props;
		const { category } = props.match.params;
		const page = props.match.params.page || 1;
		if (!postList) {
			fetchPostList();
		}
		this.state = {
			page,
			category,
			postsPerPage: 12
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, postList } = nextProps;

		const category = match.params.category;
		const page = match.params.page || 1;
		const posts = _.chain(postList)
			.values()
			.sortBy("dateCreated")
			.reverse()
			.filter(post => category === "all" || post.category === category)
			.value();

		return {
			category,
			page,
			postList: posts
		};
	}

	generateHeader() {
		const categories = [
			{ name: "All", slug: "all" },
			...newsCategories
		].map(({ slug, name }) => ({ slug, label: name }));
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
		const { postList, postsPerPage, page } = this.state;
		if (!postList) {
			return <LoadingPage fullscreen={true} />;
		} else {
			const posts = _.chunk(postList, postsPerPage)[page - 1];

			const postPreviews = _.map(posts, post => {
				return <NewsPostPreview post={post} includeContent={false} key={post.slug} />;
			});
			return <div className="post-list">{postPreviews}</div>;
		}
	}

	generatePagination() {
		const { postList, postsPerPage, category } = this.state;
		const pages = _.chunk(postList, postsPerPage).length;
		if (pages === 1) {
			return null;
		} else {
			let links = [];
			for (let i = 1; i <= pages; i++) {
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
		const { category, postList } = this.state;
		let pageTitle = "News";
		if (category !== "all" && !_.keyBy(newsCategories, "slug")[category]) {
			return <NotFoundPage message="Category not found" />;
		} else if (!postList || !postList.length) {
			return <LoadingPage />;
		} else {
			if (category !== "all") {
				pageTitle += " - " + _.keyBy(newsCategories, "slug")[category].name;
			}
			return (
				<div className="post-list-page">
					<HelmetBuilder title={pageTitle} canonical={`/news/category/${category}`} />
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

function mapStateToProps({ news }) {
	const { postList } = news;
	return { postList };
}

async function loadData(store) {
	return store.dispatch(fetchPostList());
}

export default {
	component: connect(mapStateToProps, { fetchPostList })(NewsListPage),
	loadData
};
