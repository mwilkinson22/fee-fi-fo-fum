//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import NewWindow from "react-new-window";

//Components
import LoadingPage from "../LoadingPage";
import TweetComposer from "../TweetComposer";

//Actions
import { disconnectAccount, getAuthorisedAccounts } from "~/client/actions/oAuthActions";

//Constants
import PopUpDialog from "../PopUpDialog";
const services = {
	twitter: {
		name: "Twitter",
		postName: "Tweet",
		authBtn: { background: "#1da1f3", color: "white" }
	}
	// facebook: { name: "Facebook", authBtn: { background: "#3c5a99", color: "white" } }
};

class ShareDialog extends Component {
	constructor(props) {
		super(props);

		const { authorisedAccounts, getAuthorisedAccounts, images } = props;

		if (!authorisedAccounts) {
			getAuthorisedAccounts();
		}

		this.state = { images, service: Object.keys(services)[0] };
	}

	static getDerivedStateFromProps(nextProps) {
		const { authorisedAccounts } = nextProps;

		const newState = { authorisedAccounts };

		return newState;
	}

	async handleSubmit(text) {
		const { onSubmit } = this.props;
		const { authorisedAccounts, service } = this.state;

		//Set state to disable button
		this.setState({ isSubmitting: true });

		//Get access token for server validation
		const { access_token } = authorisedAccounts[service];

		//Combine all data into a single object
		const data = { access_token, text, service };

		//Send to server
		const result = await onSubmit(data);

		//Set final state
		this.setState({ isSubmitting: false, submittedPost: result });
	}

	renderIcons() {
		const { bucketPaths } = this.props;
		const { service } = this.state;
		const icons = _.map(services, ({ title }, key) => (
			<div
				className={`service-icon ${key == service ? "active" : ""}`}
				key={key}
				onClick={() =>
					this.setState({
						service: key,
						isAuthorising: false,
						isSubmitting: false,
						submittedPost: false
					})
				}
			>
				<img src={`${bucketPaths.images.layout}icons/${key}.svg`} title={title} />
			</div>
		));

		return <div className="service-icons">{icons}</div>;
	}

	renderDialog() {
		const { authorisedAccounts, isSubmitting, service, submittedPost } = this.state;

		if (service) {
			let content;

			//If we haven't authenticated, show the auth button
			//If we have, render the composer
			//While submitting, render LoadingPage
			//Once we've finished, show a message
			if (isSubmitting) {
				content = <LoadingPage />;
			} else if (submittedPost) {
				//Check to see if we can create a link
				let url, link;
				switch (service) {
					case "twitter": {
						url = [
							"https://twitter.com",
							submittedPost.user.screen_name,
							"status",
							submittedPost.id_str
						].join("/");
					}
				}

				if (url) {
					link = (
						<span>
							<a href={url} target="_blank" rel="noopener noreferrer">
								Click here
							</a>
							{" to view it."}
						</span>
					);
				}

				content = (
					<div>
						{`\u2705 ${services[service].postName || "Post"} sent. `}
						{link}
					</div>
				);
			} else if (!authorisedAccounts[service]) {
				content = this.renderAuthoriseDialog();
			} else {
				//Otherwise, we render the composer
				content = this.renderComposer();
			}

			return <div className="dialog">{content}</div>;
		}
	}

	renderAuthoriseDialog() {
		const { getAuthorisedAccounts } = this.props;
		const { isAuthorising, service } = this.state;

		//If we don't have credentials, get a request token
		let popout;
		if (isAuthorising) {
			popout = (
				<NewWindow
					url={`/api/oauth/${service}/authorise`}
					onUnload={async () => {
						await getAuthorisedAccounts();
						this.setState({ isAuthorising: false });
					}}
				/>
			);
		}

		let content;
		let buttonText = `Share on ${services[service].name}`;
		let includeDisclaimer = false;

		switch (service) {
			case "twitter":
				includeDisclaimer = true;
				content = [
					<p key="1">
						To share to Twitter, you will need to click the button below and authorise
						posts from this website. Granting authorisation simply allows{" "}
						<strong>you</strong> to post to your own account from this website.
					</p>,
					<p key="2">
						No personal data is ever saved by us, and your password is never exposed by
						Twitter, meaning it is impossible for us (or anyone else) to access your
						account or post without your consent.
					</p>
				];
				break;
		}

		//Render disclaimer link
		let disclaimer;
		if (includeDisclaimer) {
			disclaimer = (
				<p
					className="disclaimer-link"
					onClick={() => this.setState({ isShowingDisclaimer: true })}
				>
					Read More
				</p>
			);
		}

		return (
			<div className="authorise-dialog">
				{content}
				{disclaimer}
				<button
					className="authorise-btn"
					style={services[service].authBtn}
					onClick={() => this.setState({ isAuthorising: true })}
					disabled={isAuthorising}
				>
					{buttonText}
				</button>
				{popout}
				{this.renderDisclaimerDialog()}
			</div>
		);
	}

	renderDisclaimerDialog() {
		const { isShowingDisclaimer, service } = this.state;

		if (isShowingDisclaimer) {
			let content;
			switch (service) {
				case "twitter":
					content = (
						<div>
							<h6>Sharing to Twitter</h6>
							<p>
								Upon clicking the Share button, a Twitter window will pop up asking
								you to grant access to Fee Fi Fo Fum (the website, not the
								page/group). If you accept, an access token will be saved to your
								web browser.
							</p>
							<p>
								This access token is a long string of letters and numbers, generated
								by Twitter to allow other apps to post to your account without
								accessing twitter.com directly. It is accessible only within your
								web browser, so at no point can this be accessed or used by the 4Fs
								team (or anyone else).
							</p>
							<p>
								The access token can easily be deleted, if you wish, either by
								clicking the <strong>Disconnect</strong> link above the Tweet
								editor, or by revoking it directly on Twitter. If you have any more
								questions,{" "}
								<a
									href="https://twitter.com/FeeFiFoFumRL"
									target="_blank"
									rel="noopener noreferrer"
								>
									just let us know
								</a>
							</p>
						</div>
					);
					break;
			}

			if (content) {
				return (
					<PopUpDialog onDestroy={() => this.setState({ isShowingDisclaimer: false })}>
						{content}
					</PopUpDialog>
				);
			}
		}
	}

	renderComposer() {
		const { browser, disconnectAccount, initialContent, onFetchImage } = this.props;
		const { authorisedAccounts, fetchingPreview, images, service } = this.state;

		//First, get user info
		const account = authorisedAccounts[service];
		let userInfo;

		switch (service) {
			case "twitter": {
				let userImage;
				//Firefox disables twitter images by default via its
				//tracker. Easier to just hide it
				if (browser !== "Firefox") {
					userImage = (
						<img src={account.profile_image_url_https} className="profile-pic" />
					);
				}
				userInfo = (
					<div className="user-info twitter">
						{userImage}
						<span className="full-name">{account.name}</span>
						<span className="username">@{account.screen_name}</span>
						<span className="disconnect" onClick={() => disconnectAccount(service)}>
							Disconnect
						</span>
					</div>
				);
			}
		}

		//Then, render the actual composer
		const composer = (
			<TweetComposer
				initialContent={initialContent}
				onSubmit={text => this.handleSubmit(text)}
			/>
		);

		//And show a preview of any images
		let imagePreview;
		if (images.length) {
			const list = images.map((src, i) => (
				<img key={i} src={src} onClick={() => window.open(src)} />
			));
			imagePreview = <div className="image-previews">{list}</div>;
		} else if (fetchingPreview) {
			imagePreview = <LoadingPage />;
		} else if (onFetchImage) {
			imagePreview = (
				<button
					className="fetch-preview-image-btn"
					onClick={async () => {
						this.setState({ fetchingPreview: true });
						const images = await onFetchImage();
						this.setState({ fetchingPreview: false, images });
					}}
				>
					Preview Image
				</button>
			);
		}

		return (
			<div>
				{userInfo}
				{composer}
				{imagePreview}
			</div>
		);
	}

	render() {
		const { authorisedAccounts } = this.state;
		if (!authorisedAccounts) {
			return <LoadingPage />;
		}

		return (
			<div className="share-dialog">
				{this.renderIcons()}
				{this.renderDialog()}
			</div>
		);
	}
}

function mapStateToProps({ config, oAuth }) {
	const { browser, bucketPaths } = config;
	const { authorisedAccounts } = oAuth;
	return { authorisedAccounts, browser, bucketPaths };
}

ShareDialog.propTypes = {
	initialContent: PropTypes.string,
	images: PropTypes.arrayOf(PropTypes.string),
	onFetchImage: PropTypes.func,
	onSubmit: PropTypes.func.isRequired
};

ShareDialog.defaultProps = {
	initialContent: "",
	images: []
};

export default connect(mapStateToProps, { disconnectAccount, getAuthorisedAccounts })(ShareDialog);
