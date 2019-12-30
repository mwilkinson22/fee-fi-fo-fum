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
import { layoutImagePath } from "../../extPaths";
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
				<img src={`${layoutImagePath}icons/${key}.svg`} title={title} />
			</div>
		));

		return <div className="service-icons">{icons}</div>;
	}

	renderDialog() {
		const { getAuthorisedAccounts } = this.props;
		const {
			authorisedAccounts,
			isAuthorising,
			isSubmitting,
			service,
			submittedPost
		} = this.state;

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
				content = (
					<div>
						<button
							className="authorise-btn"
							style={services[service].authBtn}
							onClick={() => this.setState({ isAuthorising: true })}
							disabled={isAuthorising}
						>
							Share on {services[service].name}
						</button>
						{popout}
					</div>
				);
			} else {
				//Otherwise, we render the composer
				content = this.renderComposer();
			}

			return <div className="dialog">{content}</div>;
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
	const { browser } = config;
	const { authorisedAccounts } = oAuth;
	return { authorisedAccounts, browser };
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
