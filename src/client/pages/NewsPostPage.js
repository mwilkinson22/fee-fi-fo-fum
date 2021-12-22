//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import { FacebookProvider, Comments } from "react-facebook";
import { MegadraftEditor, editorStateFromRaw } from "megadraft";
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

//Components
import LoadingPage from "../components/LoadingPage";
import NotFoundPage from "./NotFoundPage";
import NewsPostCard from "../components/news/NewsPostCard";
import HelmetBuilder from "../components/HelmetBuilder";
import AuthorImage from "../components/news/AuthorImage";
import GameCard from "../components/games/GameCard";
import GameEvents from "../components/games/GameEvents";
import FanPotmVoting from "../components/games/FanPotmVoting";
import PregameSquadList from "../components/games/PregameSquadList";

//Actions
import { fetchGames } from "../actions/gamesActions";
import { fetchNewsPostBySlug } from "../actions/newsActions";

//Constants
import newsDecorators from "~/constants/newsDecorators";
import newsPlugins from "~/constants/newsPlugins";

class NewsPostPage extends Component {
	constructor(props) {
		super(props);
		const { fetchNewsPostBySlug, slugMap, match } = props;

		const { slug } = match.params;
		let isLoadingPost = false;
		if (slugMap[slug] === undefined) {
			fetchNewsPostBySlug(slug);
			isLoadingPost = slug;
		}

		this.state = { isLoadingPost };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fetchNewsPostBySlug, fullPosts, fullGames, match, fetchGames, slugMap } = nextProps;
		const { slug } = match.params;
		const newState = {};

		//If we have no slugMap value, and isLoadingPost is set to the current slug, then we return null as we're still waiting
		if (slugMap[slug] === undefined && prevState.isLoadingPost === slug) {
			return null;
		}

		//Otherwise if we have no slugMap value, then the page has changed and we need to fetch a new post
		if (slugMap[slug] === undefined) {
			fetchNewsPostBySlug(slug);
			newState.isLoadingPost = slug;
			return newState;
		}

		//Otherwise, we either have a 404 or a post loaded
		newState.isLoadingPost = false;

		//404 if we have no id
		if (!slugMap[slug]) {
			//404
			newState.post = false;
			return newState;
		}

		//Get the current post
		newState.post = fullPosts[slugMap[slug]];

		//Set preview and editor state
		const { blocks } = JSON.parse(newState.post.content);

		//We do the regex to ensure punctuation at the end of each line
		newState.post.preview = blocks.map(({ text }) => text + (text.trim().match(/[.!?:]$/) ? "" : ".")).join(" \n");
		newState.post.editorState = editorStateFromRaw(JSON.parse(newState.post.content), newsDecorators);

		//Get game, if necessary
		if (newState.post._game) {
			//See if it's already loaded
			newState.game = fullGames[newState.post._game];
			if ((!newState.game || !newState.game.pageData) && !prevState.isLoadingGame) {
				//Load Game
				fetchGames([newState.post._game], "gamePage");
				newState.isLoadingGame = true;
			} else if (newState.game && newState.game.pageData) {
				newState.isLoadingGame = false;
			}
		} else {
			newState.game = undefined;
		}

		return newState;
	}

	getUrl() {
		const { baseUrl } = this.props;
		const { post } = this.state;
		return `${baseUrl}/news/post/${post.slug}`;
	}

	formatSidebar() {
		const { postList } = this.props;
		const { post } = this.state;
		const recentPosts = _.chain(postList)
			.orderBy(["dateCreated"], ["desc"])
			.reject(({ _id }) => post._id == _id)
			.chunk(5)
			.value()[0];

		if (recentPosts && recentPosts.length) {
			return recentPosts.map(recentPost => {
				if (recentPost.slug !== post.slug) {
					return <NewsPostCard post={recentPost} includeContent={false} key={recentPost.slug} />;
				} else {
					return null;
				}
			});
		}
	}

	renderEditLink() {
		const { authUser } = this.props;
		const { post } = this.state;
		if (authUser) {
			return (
				<Link className="card nav-card" to={`/admin/news/post/${post._id}`}>
					Edit this post
				</Link>
			);
		} else {
			return null;
		}
	}

	prependArticle() {
		const { game, post } = this.state;

		let content;

		switch (post.category) {
			case "previews":
				if (game) {
					content = <GameCard game={game} hideImage={true} />;
				}
				break;
			case "recaps":
				{
					if (game) {
						content = (
							<div>
								<GameCard game={game} hideImage={true} />
								<GameEvents game={game} />
							</div>
						);
					}
				}
				break;
		}

		if (content) {
			return <div className="pre-article-content">{content}</div>;
		}
	}

	appendArticle() {
		const { fansCanAttend, ticketLink } = this.props;
		const { game, post } = this.state;

		let content;

		switch (post.category) {
			case "previews": {
				if (game) {
					let ticketLinkElement;
					if (fansCanAttend && ticketLink && new Date() < game.date) {
						ticketLinkElement = (
							<p>
								Want to watch the game? Get your tickets{" "}
								<a href={ticketLink} target="_blank" rel="noopener noreferrer">
									here
								</a>
								!
							</p>
						);
					}
					content = (
						<div>
							{ticketLinkElement}
							<PregameSquadList game={game} />
						</div>
					);
				}
				break;
			}
			case "recaps": {
				if (game && game.fan_potm && game.fan_potm.deadline) {
					//Check if voting is still valid
					const canStillVote = new Date() < new Date(game.fan_potm.deadline);
					if (canStillVote) {
						content = (
							<div>
								<FanPotmVoting id={game._id} />
							</div>
						);
					}
				}
				break;
			}
		}

		if (content) {
			return <div className="post-article-content">{content}</div>;
		}
	}

	formatPost() {
		const { social_account, site_name } = this.props;
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
					<a href={`https://www.twitter.com/${author.twitter}`} target="_blank" rel="noopener noreferrer">
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
				{this.renderEditLink()}
				<div className="post-wrapper">
					<div className="post-header">
						<NewsPostCard post={post} inArticle={true} />
					</div>
					<div className="post-body">
						<div className="post-body-header">
							<div className="post-author">
								<div className="author-image">
									<AuthorImage author={author} size="small" />
								</div>
								{authorDetails}
							</div>
							<div className="post-share">
								<FacebookShareButton url={this.getUrl()}>
									<FacebookIcon {...shareIconProps} />
								</FacebookShareButton>
								<TwitterShareButton url={this.getUrl()} title={post.title} via={social_account}>
									<TwitterIcon {...shareIconProps} />
								</TwitterShareButton>
								<RedditShareButton url={this.getUrl()} title={post.title}>
									<RedditIcon {...shareIconProps} />
								</RedditShareButton>
								<WhatsappShareButton url={this.getUrl()} title={post.title}>
									<WhatsappIcon {...shareIconProps} />
								</WhatsappShareButton>
								<EmailShareButton url={this.getUrl()} subject={`${site_name} - ${post.title}`}>
									<EmailIcon {...shareIconProps} />
								</EmailShareButton>
							</div>
						</div>
						<div className="post-content">
							{this.prependArticle()}
							<MegadraftEditor
								editorState={post.editorState}
								readOnly={true}
								onChange={() => {}}
								plugins={newsPlugins(post)}
							/>
							{this.appendArticle()}
						</div>
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
		const { bucketPaths, facebookApp, match } = this.props;
		const { isLoadingList, isLoadingPost, isLoadingGame, post } = this.state;

		//Wait for all content
		if (isLoadingList || isLoadingPost || isLoadingGame) {
			return <LoadingPage />;
		}

		//Redirect old slugs
		if (post && post.slug !== match.params.slug) {
			return <Redirect to={`/news/post/${post.slug}`} />;
		}

		//404
		if (!post) {
			return <NotFoundPage message="Post not found" />;
		}

		return (
			<FacebookProvider appId={facebookApp}>
				<div className={`news-post ${post.category}`}>
					<HelmetBuilder
						title={post.title}
						canonical={`/news/post/${post.slug}`}
						cardImage={bucketPaths.images.newsHeader + post.image}
						cardType="summary_large_image"
						description={post.subtitle || post.preview.substring(0, 500) + "..."}
					/>
					{this.formatPost()}
				</div>
			</FacebookProvider>
		);
	}
}

function mapStateToProps({ config, games, news }) {
	const { authUser, baseUrl, bucketPaths, facebookApp, fansCanAttend, site_name, social_account, ticketLink } =
		config;
	const { fullGames } = games;
	const { fullPosts, postList, slugMap } = news;

	return {
		facebookApp,
		fansCanAttend,
		fullPosts,
		fullGames,
		postList,
		slugMap,
		authUser,
		baseUrl,
		bucketPaths,
		site_name,
		social_account,
		ticketLink
	};
}

async function loadData(store, path) {
	const slug = path.split("/")[3];

	//Get post
	await store.dispatch(fetchNewsPostBySlug(slug));

	//Check to see if we need a game
	const { fullPosts, slugMap } = store.getState().news;
	const _id = slugMap[slug];
	const post = fullPosts[_id];
	if (post && post._game) {
		await store.dispatch(fetchGames([post._game], "gamePage"));
	}
}

export default {
	component: connect(mapStateToProps, { fetchGames, fetchNewsPostBySlug })(NewsPostPage),
	loadData
};
