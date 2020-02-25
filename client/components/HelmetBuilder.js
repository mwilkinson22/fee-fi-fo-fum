import React, { Component } from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";

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
			initialPath,
			bucketPaths
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
			cardImage =
				bucketPaths.images.layout +
				(cardType === "summary" ? "twitter-card.jpg" : "twitter-card-large.jpg");
		}

		//Set Meta
		const meta = [
			{ property: "og:type", content: "website" },
			{ name: "twitter:card", content: cardType },
			{ name: "twitter:title", property: "og:title", content: title },
			{ name: "twitter:creator", content: `@${author}` },
			{ name: "twitter:site", content: "@FeeFiFoFumRL" },
			{ name: "twitter:description", property: "twitter:description", content: description },
			{ name: "twitter:image", property: "og:image", content: cardImage },
			{ property: "og:url", content: url }
		];

		return (
			<Helmet
				key={url}
				title={title}
				link={[
					{ rel: "canonical", href: url },
					{ rel: "icon shortcut", href: `${bucketPaths.imageRoot}favicon.png` }
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
	author: "FeeFiFoFumRL",
	canonical: null,
	cardType: "summary_large_image",
	description: "Huddersfield Giants news, stats and reports"
};

function mapStateToProps({ config }) {
	const { baseUrl, bucketPaths, initialPath } = config;
	return { baseUrl, bucketPaths, initialPath };
}

export default connect(mapStateToProps)(HelmetBuilder);
