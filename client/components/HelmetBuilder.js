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

		//Set Author
		if (!author) {
			author = "FeeFiFoFumRL";
		}

		//Set Meta
		const meta = [
			{ property: "og:type", content: "website" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", property: "og:title", content: title },
			{ name: "twitter:creator", content: `@${author}` },
			{ name: "twitter:site", content: "@FeeFiFoFumRL" },
			{ property: "twitter:description", content: description },
			{ property: "og:url", content: url }
		];
		if (cardImage) {
			meta.push({ name: "twitter:image", property: "og:image", content: cardImage });
		}

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
	title: PropTypes.string.isRequired,
	canonical: PropTypes.string,
	author: PropTypes.string,
	cardImage: PropTypes.string,
	description: PropTypes.string
};

HelmetBuilder.defaultProps = {
	author: "GiantsFanzine",
	canonical: null,
	cardImage: null,
	description: "Huddersfield Giants news, stats and reports"
};

function mapStateToProps({ config }) {
	const { baseUrl, initialPath } = config;
	return { baseUrl, initialPath };
}

export default connect(mapStateToProps)(HelmetBuilder);
