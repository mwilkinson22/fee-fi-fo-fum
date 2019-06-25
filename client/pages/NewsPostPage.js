import _ from "lodash";
import React, { Component } from "react";
import Parser from "html-react-parser";
import LoadingPage from "../components/LoadingPage";
import { fetchNewsPost, fetchPostList } from "../actions/newsActions";
import { connect } from "react-redux";
import NewsPostPreview from "../components/news/NewsPostCard";
import { FacebookProvider, Comments } from "react-facebook";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "./NotFoundPage";
import { Redirect } from "react-router-dom";
import {
	FacebookShareButton,
	FacebookIcon,
	TwitterShareButton,
	TwitterIcon,
	WhatsappShareButton,
	WhatsappIcon,
	RedditShareButton,
	RedditIcon,
	EmailShareButton,
	EmailIcon
} from "react-share";

class NewsPostPage extends Component {
	constructor(props) {
		super(props);
		const { post, postList, fetchPostList } = props;

		if (!postList) {
			fetchPostList();
		}

		this.state = {
			post,
			postList
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { postList, fullPosts, match, slugMap, fetchNewsPost } = nextProps;
		const { slug } = match.params;

		if (slugMap[slug].redirect) {
			//TODO
			return {};
		} else {
			const id = slugMap[slug].id;
			const post = fullPosts[id];
			if (!post) {
				fetchNewsPost(id);
			}

			return {
				post,
				recentPosts: _.chain(postList)
					.values()
					.sortBy("dateCreated")
					.reverse()
					.filter(post => post.id !== id)
					.chunk(5)
					.value()[0]
			};
		}
	}

	getUrl() {
		const { post } = this.state;
		return `https://www.feefifofum.co.uk/news/post/${post.slug}`;
	}

	formatSidebar() {
		const { post, recentPosts } = this.state;
		if (recentPosts) {
			return recentPosts.map(recentPost => {
				if (recentPost.slug !== post.slug) {
					return (
						<NewsPostPreview
							post={recentPost}
							includeContent={false}
							key={recentPost.slug}
						/>
					);
				} else {
					return null;
				}
			});
		} else {
			return <LoadingPage />;
		}
	}

	formatPost() {
		const { post } = this.state;
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

		const shareIconProps = {
			size: 34
		};

		return (
			<div className="container">
				<div className="post-wrapper">
					<div className="post-header">
						<NewsPostPreview post={post} inArticle={true} />
					</div>
					<div className="post-body">
						<div className="post-body-header">
							<div className="post-author">
								<div
									className="author-image"
									style={{ backgroundImage: `url('${author.image}')` }}
								/>
								{authorDetails}
							</div>
							<div className="post-share">
								<FacebookShareButton url={this.getUrl()}>
									<FacebookIcon {...shareIconProps} />
								</FacebookShareButton>
								<TwitterShareButton
									url={this.getUrl()}
									title={post.title}
									via="GiantsFanzine"
								>
									<TwitterIcon {...shareIconProps} />
								</TwitterShareButton>
								<RedditShareButton url={this.getUrl()} title={post.title}>
									<RedditIcon {...shareIconProps} />
								</RedditShareButton>
								<WhatsappShareButton url={this.getUrl()} title={post.title}>
									<WhatsappIcon {...shareIconProps} />
								</WhatsappShareButton>
								<EmailShareButton
									url={this.getUrl()}
									subject={`Fee Fi Fo Fum - ${post.title}`}
								>
									<EmailIcon {...shareIconProps} />
								</EmailShareButton>
							</div>
						</div>
						<div className="post-content">{Parser(post.content)}</div>
					</div>
					<ul className="other-posts">
						<li>
							<h4>Recent Posts</h4>
						</li>
						{this.formatSidebar()}
					</ul>
					<div className="post-comments">
						<Comments href={this.getUrl()} width="100%" mobile={true} />
					</div>
				</div>
			</div>
		);
	}

	render() {
		const { post } = this.state;
		if (post === undefined) {
			return <LoadingPage />;
		} else if (!post) {
			return <NotFoundPage message="Post not found" />;
		} else if (post.redirect) {
			return <Redirect to={`/news/post/${post.slug}`} />;
		} else {
			return (
				<FacebookProvider appId="1610338439232779">
					<div className={`news-post ${post.category}`}>
						<HelmetBuilder
							title={post.title}
							canonical={`/news/post/${post.slug}`}
							cardImage={post.image}
							description={
								post.content.replace(/<[^>]*>/g, "").substring(0, 500) + "..."
							}
						/>
						{this.formatPost()}
					</div>
				</FacebookProvider>
			);
		}
	}
}

function mapStateToProps({ news }, ownProps) {
	const { fullPosts, postList, slugMap } = news;

	return { fullPosts, postList, slugMap, ...ownProps };
}

async function loadData(store, path) {
	const slug = path.split("/")[3];
	await store.dispatch(fetchPostList());
	const slugMap = store.getState().news.slugMap[slug];

	if (slugMap.redirect) {
		//TODO
	} else {
		return store.dispatch(fetchNewsPost(slugMap.id));
	}
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchNewsPost, fetchPostList }
	)(NewsPostPage),
	loadData
};
