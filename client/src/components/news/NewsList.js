import React, { Component } from "react";
import connect from "react-redux/es/connect/connect";
import { fetchPostPagination, fetchPostList } from "../../actions/newsActions";
import LoadingPage from "../LoadingPage";
import NewsPostPreview from "./NewsPostPreview";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import qs from "query-string";

class NewsList extends Component {
	async componentWillMount() {
		await this.pageLoad(this.props);
	}

	async componentWillReceiveProps(nextProps, nextContext) {
		const newCategory = this.props.match.params.category !== nextProps.match.params.category;
		const newPage = this.props.match.params.page !== nextProps.match.params.page;
		if (newCategory || newPage) {
			await this.pageLoad(nextProps);
		}
	}

	async pageLoad(props) {
		const category = props.match.params.category;
		const page = Number(props.match.params.page) || 1;

		//Get Page
		await this.setState({
			category,
			page
		});
		await this.props.fetchPostPagination(this.state.category);
		if (!props.postList || !props.postList[this.state.page])
			props.fetchPostList(this.state.category, this.state.page);
	}

	generateHeader() {
		const { category } = this.state;
		if (category !== "all") return <h1>News - {category}</h1>;
		else return <h1>News</h1>;
	}

	generateList() {
		const { postList } = this.props;
		if (!postList || !postList[this.state.page]) {
			return <LoadingPage fullscreen={true} />;
		} else {
			const posts = this.props.postList[this.state.page];

			const postPreviews = _.map(posts, post => {
				return <NewsPostPreview post={post} includeContent={false} key={post.slug} />;
			});
			return <div className="post-list">{postPreviews}</div>;
		}
	}

	generatePagination() {
		const { pages } = this.props;
		if (pages === 1) {
			return null;
		} else {
			let links = [];
			for (let i = 1; i <= pages; i++) {
				let url = `/news/${this.state.category}`;
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
		const { postList } = this.props;
		if (!postList) {
			return <LoadingPage fullscreen={true} />;
		} else {
			return (
				<div className="post-list-page">
					<div className="container">
						{this.generateHeader()}
						{this.generateList()}
						<div className="post-pagination">{this.generatePagination()}</div>
					</div>
				</div>
			);
		}
	}
}

function mapStateToProps({ news }, ownProps) {
	const category = ownProps.match.params.category || "all";
	const { postList, pages } = news;
	console.debug(news.postList);
	return { postList: postList[category], pages };
}

export default connect(
	mapStateToProps,
	{ fetchPostPagination, fetchPostList }
)(NewsList);
