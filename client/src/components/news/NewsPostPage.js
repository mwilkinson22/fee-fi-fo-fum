import React, { Component } from "react";
import Parser from "html-react-parser";
import LoadingPage from "../LoadingPage";
import { fetchNewsPostBySlug, fetchSidebarPosts } from "../../actions/newsActions";
import "datejs";
import connect from "react-redux/es/connect/connect";
import NewsPostPreview from "./NewsPostCard";

class NewsPostPage extends Component {
	componentWillMount() {
		const { slug } = this.props.match.params;
		if (!this.props.post) this.props.fetchNewsPostBySlug(slug);
		if (!this.props.recentPosts) this.props.fetchSidebarPosts();
	}

	formatSidebar() {
		if (this.props.recentPosts) {
			return this.props.recentPosts.map(post => {
				if (post.slug !== this.props.post.slug) {
					return <NewsPostPreview post={post} includeContent={false} key={post.slug} />;
				} else {
					return null;
				}
			});
		} else {
			return <LoadingPage />;
		}
	}

	componentWillReceiveProps(nextProps, nextContext) {
		const { slug } = nextProps.match.params;
		if (!nextProps.post) this.props.fetchNewsPostBySlug(slug);
	}

	formatPost() {
		const post = this.props.post;
		const author = post._author;
		let authorName;
		if (author.frontendName) {
			authorName = <h4>{author.frontendName}</h4>;
		} else {
			authorName = (
				<h4>
					{author.name.first} <span>{author.name.last}</span>
				</h4>
			);
		}

		let authorDetails;
		if (author.twitter) {
			authorDetails = (
				<div className="author-details">
					{authorName}
					<a
						href={`https://www.twitter.com/${author.twitter}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						@{author.twitter}
					</a>
				</div>
			);
		} else {
			authorDetails = <div className="author-details">{authorName}</div>;
		}

		return (
			<div className="container">
				<div className="post-wrapper">
					<div className="post-header">
						<NewsPostPreview post={post} inArticle={true} />
					</div>
					<div className="post-body">
						<div className="post-author">
							<div
								className="author-image"
								style={{ backgroundImage: `url('${author.image}')` }}
							/>
							{authorDetails}
						</div>
						<div className="post-content">{Parser(post.content)}</div>
					</div>
					<ul className="other-posts">
						<li>
							<h4>Recent Posts</h4>
						</li>
						{this.formatSidebar()}
					</ul>
					<div className="post-comments" />
				</div>
			</div>
		);
	}

	render() {
		const post = this.props.post;
		if (!this.props.post) {
			return <LoadingPage />;
		} else {
			return <div className={`news-post ${post.category}`}>{this.formatPost()}</div>;
		}
	}
}

function mapStateToProps({ news }, ownProps) {
	const { slug } = ownProps.match.params;
	const { posts, recentPosts } = news;
	return { post: posts[slug], recentPosts };
}

export default connect(
	mapStateToProps,
	{ fetchNewsPostBySlug, fetchSidebarPosts }
)(NewsPostPage);
