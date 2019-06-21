import React, { Component } from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { imagePath } from "../extPaths";

class HelmetBuilder extends Component {
	render() {
		let { title, canonical, author, cardImage, description, baseUrl, initialPath } = this.props;

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

		return (
			<Helmet
				key={url}
				title={title}
				link={[
					{ rel: "canonical", href: url },
					{ rel: "shortcut icon", href: `${imagePath}favicon.png` }
				]}
				meta={[
					{ name: "twitter:card", content: "summary_large_image" },
					{ name: "twitter:title", property: "og:title", content: title },
					{ name: "twitter:site", content: "@GiantsFanzine" },
					{ name: "twitter:creator", content: `@${author}` },
					{ property: "og:type", content: "website" },
					{ name: "twitter:image", property: "og:image", content: cardImage },
					{ property: "twitter:description", content: description },
					{ property: "og:url", content: url }
				]}
			/>
		);
	}
}

HelmetBuilder.propTypes = {
	title: PropTypes.string.isRequired,
	canonical: PropTypes.string,
	author: PropTypes.string,
	cardImage: PropTypes.string,
	description: PropTypes.string
};

HelmetBuilder.defaultProps = {
	author: "GiantsFanzine",
	canonical: null,
	cardImage: imagePath + "layout/twitter-card.jpg",
	description: "Huddersfield Giants news, stats and reports"
};

function mapStateToProps({ config }) {
	const { baseUrl, initialPath } = config;
	return { baseUrl, initialPath };
}

export default connect(mapStateToProps)(HelmetBuilder);
