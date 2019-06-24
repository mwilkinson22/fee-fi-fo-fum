import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import newsCategories from "../../../constants/newsCategories";

class NewsPostCard extends Component {
	getTitle() {
		const { post, inArticle } = this.props;
		if (inArticle) {
			return <h1 className="title">{post.title}</h1>;
		} else {
			return <h5 className="title">{post.title}</h5>;
		}
	}

	generateContent() {
		const { post, inArticle } = this.props;
		const category = _.keyBy(newsCategories, "slug")[post.category];
		const categoryElement = inArticle ? (
			<Link to={`/news/category/${category.slug}`}>{category.name}</Link>
		) : (
			category.name
		);
		return (
			<div
				className="post-preview"
				style={{
					backgroundImage: `url('${post.image}')`
				}}
			>
				<div className="post-meta">
					{this.getTitle()}
					<h6>
						<span>{categoryElement}</span>
						<span>{post.dateCreated.toString("dddd dS MMM yyyy H:mm")}</span>
					</h6>
				</div>
			</div>
		);
	}

	render() {
		const { inArticle, isAdminList } = this.props;
		if (inArticle) {
			return this.generateContent();
		} else {
			const { slug } = this.props.post;
			return (
				<Link to={`${isAdminList ? "/admin" : ""}/news/post/${slug}`} className="card">
					{this.generateContent()}
				</Link>
			);
		}
	}
}

NewsPostCard.propTypes = {
	inArticle: PropTypes.bool,
	isAdminList: PropTypes.bool,
	post: PropTypes.object.isRequired
};

NewsPostCard.defaultProps = {
	isAdminList: false,
	inArticle: false
};

function mapStateToProps({ news }) {
	const { categories } = news;
	return { categories };
}

export default connect(mapStateToProps)(NewsPostCard);
