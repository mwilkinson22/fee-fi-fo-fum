import React, { Component } from "react";
import _ from "lodash";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import "datejs";
import newsCategories from "../../../constants/newsCategories";

class NewsPostCard extends Component {
	getTitle() {
		const { post } = this.props;
		if (this.props.inArticle) {
			return <h1 className="title">{post.title}</h1>;
		} else {
			return <h5 className="title">{post.title}</h5>;
		}
	}

	generateContent() {
		const { post, inArticle } = this.props;
		const category = _.keyBy(newsCategories, "slug")[post.category];
		const categoryElement = inArticle ? (
			<Link to={`/news/${category.slug}`}>{category.name}</Link>
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
						<span>{new Date(post.dateCreated).toString("dddd dS MMM yyyy H:mm")}</span>
					</h6>
				</div>
			</div>
		);
	}

	render() {
		const { slug } = this.props.post;
		if (this.props.inArticle) {
			return this.generateContent();
		} else {
			return (
				<Link to={`/news/post/${slug}`} className="card">
					{this.generateContent()}
				</Link>
			);
		}
	}
}

function mapStateToProps({ news }) {
	const { categories } = news;
	return { categories };
}

export default connect(mapStateToProps)(NewsPostCard);
