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
			bucketPaths,
			site_name,
			site_social,
			site_default_description,
			facebookApp
		} = this.props;

		//Set Title
		title = `${title ? title + " - " : ""}${site_name}`;

		//Set Canonical
		if (!canonical) {
			if (typeof window !== "undefined") {
				canonical = window.location.pathname;
			} else {
				canonical = initialPath;
			}
		}
		const url = baseUrl + canonical;

		if (!cardImage) {
			cardImage =
				bucketPaths.images.layout + (cardType === "summary" ? "twitter-card.jpg" : "twitter-card-large.jpg");
		}

		//Set Meta
		const meta = [
			//Facebook
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: title },
			{
				property: "og:description",
				content: description || site_default_description
			},
			{ property: "og:url", content: url },
			{ property: "og:image", content: cardImage },
			{ property: "fb:app_id", content: facebookApp },
			//Twitter
			{ name: "twitter:card", content: cardType },
			{ name: "twitter:title", content: title },
			{ name: "twitter:creator", content: `@${author || site_social}` },
			{ name: "twitter:site", content: `@${site_social}` },
			{
				name: "twitter:description",
				content: description || site_default_description
			},
			{ name: "twitter:image", content: cardImage }
		];

		return (
			<Helmet
				key={url}
				title={title}
				link={[
					{ rel: "canonical", href: url },
					{ rel: "icon", href: `${bucketPaths.imageRoot}favicon.png` }
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
	canonical: null,
	cardType: "summary_large_image"
};

function mapStateToProps({ config }) {
	return config;
}

export default connect(mapStateToProps)(HelmetBuilder);
