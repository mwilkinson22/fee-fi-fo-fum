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
import { fetchNewsPost, fetchPostList } from "../actions/newsActions";

//Helpers
import { matchSlugToItem } from "~/helpers/routeHelper";

//Constants
import newsDecorators from "~/constants/newsDecorators";
import newsPlugins from "~/constants/newsPlugins";

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

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			postList,
			fullPosts,
			fullGames,
			match,
			redirects,
			fetchNewsPost,
			fetchGames
		} = nextProps;
		const { slug } = match.params;
		const newState = { isLoadingList: false, redirect: null };

		//Ensure we have the basic postlist
		if (!postList) {
			newState.isLoadingList = true;
			return newState;
		}

		//Get the item and redirect info from the post
		const { item, redirect } = matchSlugToItem(slug, postList, redirects);

		//If there's a redirect, pass it in immediately
		if (redirect) {
			newState.redirect = `/news/post/${item.slug}`;
			return newState;
		}

		//If the post isn't found in the list, 404
		if (!item) {
			newState.post = false;
			return newState;
		}

		//Otherwise, we have the id
		const { _id } = item;

		//Check to see if we have the post within fullPosts
		newState.post = fullPosts[_id];

		//If don't have it, we need to load it
		if (!newState.post && !prevState.isLoadingPost) {
			fetchNewsPost(_id);
			newState.isLoadingPost = true;
		}

		//Otherwise, pull the info we need
		if (newState.post) {
			//For when it's just loaded
			newState.isLoadingPost = false;

			//Get Meta Description
			const { blocks } = JSON.parse(newState.post.content);

			//We do the regex to ensure punctuation at the end of each line
			newState.post.preview = blocks
				.map(({ text }) => text + (text.trim().match(/[.!?:]$/) ? "" : "."))
				.join(" \n");
			newState.post.editorState = editorStateFromRaw(
				JSON.parse(newState.post.content),
				newsDecorators
			);

			//Get recent posts for the sidebar
			newState.recentPosts = _.chain(postList)
				.orderBy(["dateCreated"], ["desc"])
				.reject(post => post.id == _id)
				.chunk(5)
				.value()[0];

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
		} else {
			fetchNewsPost(_id);
		}

		return newState;
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
						<NewsPostCard
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
		const { ticketLink } = this.props;
		const { game, post } = this.state;

		let content;

		switch (post.category) {
			case "previews": {
				if (game) {
					let ticketLinkElement;
					if (ticketLink && new Date() < game.date) {
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
							<PregameSquadList game={game} />;
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
				{this.renderEditLink()}
				<div className="post-wrapper">
					<div className="post-header">
						<NewsPostCard post={post} inArticle={true} />
					</div>
					<div className="post-body">
						<div className="post-body-header">
							<div className="post-author">
								<div className="author-image">
									<AuthorImage author={author} />
								</div>
								{authorDetails}
							</div>
							<div className="post-share">
								<FacebookShareButton url={this.getUrl()}>
									<FacebookIcon {...shareIconProps} />
								</FacebookShareButton>
								<TwitterShareButton
									url={this.getUrl()}
									title={post.title}
									via="FeeFiFoFumRL"
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
						<div className="post-content">
							{this.prependArticle()}
							<MegadraftEditor
								editorState={post.editorState}
								readOnly={true}
								onChange={() => {}}
								plugins={newsPlugins}
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
		const { bucketPaths } = this.props;
		const { isLoadingList, isLoadingPost, isLoadingGame, post, redirect } = this.state;

		//Redirect old slugs
		if (redirect) {
			return <Redirect to={redirect} />;
		}

		//Wait for all content
		if (isLoadingList || isLoadingPost || isLoadingGame) {
			return <LoadingPage />;
		}

		//404
		if (!post) {
			return <NotFoundPage message="Post not found" />;
		}

		return (
			<FacebookProvider appId="1610338439232779">
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
	const { authUser, bucketPaths, ticketLink } = config;
	const { fullGames } = games;
	const { fullPosts, postList, redirects } = news;

	return { fullPosts, fullGames, postList, redirects, authUser, bucketPaths, ticketLink };
}

async function loadData(store, path) {
	const slug = path.split("/")[3];

	//Get post list
	await store.dispatch(fetchPostList());

	//Find item in list
	const { postList, redirects } = store.getState().news;
	const { item } = matchSlugToItem(slug, postList, redirects);

	//Load the full post, if it exists
	if (item) {
		await store.dispatch(fetchNewsPost(item._id));
		const post = store.getState().news.fullPosts[item._id];

		//Load game, if necessary
		if (post._game) {
			await store.dispatch(fetchGames([post._game], "gamePage"));
		}
		return;
	}
}

export default {
	component: connect(mapStateToProps, { fetchGames, fetchNewsPost, fetchPostList })(NewsPostPage),
	loadData
};
