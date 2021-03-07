//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Constants
import newsCategories from "~/constants/newsCategories";

//Helpers
import { getHeaderImage } from "~/helpers/newsHelper";

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
		const { bucketPaths, post, inArticle, webp, hideImage } = this.props;

		//Get Category
		const category = newsCategories.find(c => c.slug == post.category);

		//Link to category search when not in article
		let categoryElement;
		if (inArticle) {
			categoryElement = <Link to={`/news/category/${category.slug}`}>{category.name}</Link>;
		} else {
			categoryElement = category.name;
		}

		//This doesn't govern visibility, only the classname,
		//which changes the colour to indicate admin-viewable-only posts
		const isPublished = post.isPublished && post.dateCreated < new Date();

		return (
			<div
				className={`post-preview${isPublished ? "" : " unpublished"}${hideImage ? " hide-image" : ""}`}
				style={{
					backgroundImage: `url('${getHeaderImage(post, bucketPaths, webp, inArticle ? null : "card")}')`
				}}
			>
				<div className="post-meta">
					{this.getTitle()}
					<h6 className="post-meta-category-and-date">
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
				<Link to={url} className={"card news-post-card"}>
					{this.generateContent()}
				</Link>
			);
		}
	}
}

NewsPostCard.propTypes = {
	hideImage: PropTypes.bool,
	inArticle: PropTypes.bool,
	isAdminList: PropTypes.bool,
	post: PropTypes.object.isRequired
};

NewsPostCard.defaultProps = {
	hideImage: false,
	isAdminList: false,
	inArticle: false
};

function mapStateToProps({ config, news }) {
	const { bucketPaths, webp } = config;
	const { categories } = news;
	return { bucketPaths, categories, webp };
}

export default connect(mapStateToProps)(NewsPostCard);
