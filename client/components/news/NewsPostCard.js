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
		const { bucketPaths, post, inArticle, webp } = this.props;
		const category = _.keyBy(newsCategories, "slug")[post.category];
		const categoryElement = inArticle ? (
			<Link to={`/news/category/${category.slug}`}>{category.name}</Link>
		) : (
			category.name
		);
		let { image } = post;
		if (image && webp) {
			const imageArr = image.split(".");
			imageArr.pop();
			image = imageArr.join(".") + ".webp";
		}
		//This doesn't govern visibility, only the classname,
		//which changes the colour to indicate admin-viewable-only posts
		const isPublished = post.isPublished && post.dateCreated < new Date();

		return (
			<div
				className={`post-preview ${isPublished ? "" : "unpublished"}`}
				style={{
					backgroundImage: image
						? `url('${bucketPaths.images.newsHeader}${image}')`
						: null
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
			const { _id, slug } = this.props.post;
			let url;
			if (isAdminList) {
				url = `/admin/news/post/${_id}`;
			} else {
				url = `/news/post/${slug}`;
			}
			return (
				<Link to={url} className="card">
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

function mapStateToProps({ config, news }) {
	const { bucketPaths, webp } = config;
	const { categories } = news;
	return { bucketPaths, categories, webp };
}

export default connect(mapStateToProps)(NewsPostCard);
