import React, { Component } from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { imagePath } from "../extPaths";

const defaultCardImage = imagePath + "layout/twitter-card.jpg";
const defaultLargeCardImage = imagePath + "layout/twitter-card-large.jpg";

class HelmetBuilder extends Component {
	render() {
		let {
			title,
			canonical,
			author,
			cardImage,
			cardType,
			description,
			baseUrl,
			initialPath
		} = this.props;

		//Set Title
		title = (title ? title + " - " : "") + "Fee Fi Fo Fum";

		//Set Canonical
		if (!canonical) {
			if (typeof window !== "undefined") {
				canonical = window.location.pathname;
			} else {
				canonical = initialPath;
			}
		}
		const url = baseUrl + canonical;

		//Set Author
		if (!author) {
			author = "FeeFiFoFumRL";
		}

		if (!cardImage) {
			cardImage = cardType === "summary" ? defaultCardImage : defaultLargeCardImage;
		}

		//Set Meta
		const meta = [
			{ property: "og:type", content: "website" },
			{ name: "twitter:card", content: cardType },
			{ name: "twitter:title", property: "og:title", content: title },
			{ name: "twitter:creator", content: `@${author}` },
			{ name: "twitter:site", content: "@FeeFiFoFumRL" },
			{ property: "twitter:description", content: description },
			{ name: "twitter:image", property: "og:image", content: cardImage },
			{ property: "og:url", content: url }
		];

		return (
			<Helmet
				key={url}
				title={title}
				link={[
					{ rel: "canonical", href: url },
					{ rel: "shortcut icon", href: `${imagePath}favicon.png` }
				]}
				meta={meta}
			/>
		);
	}
}

HelmetBuilder.propTypes = {
	author: PropTypes.string,
	canonical: PropTypes.string,
	cardType: PropTypes.oneOf(["summary", "summary_large_image", "app", "player"]),
	cardImage: PropTypes.string,
	description: PropTypes.string,
	title: PropTypes.string.isRequired
};

HelmetBuilder.defaultProps = {
	author: "GiantsFanzine",
	canonical: null,
	cardImage: defaultCardImage,
	cardType: "summary_large_image",
	description: "Huddersfield Giants news, stats and reports"
};

function mapStateToProps({ config }) {
	const { baseUrl, initialPath } = config;
	return { baseUrl, initialPath };
}

export default connect(mapStateToProps)(HelmetBuilder);
