import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { localUrl, imagePath } from "../extPaths";

export default class HelmetBuilder extends Component {
	render() {
		const { title, canonical, author, cardImage } = this.props;
		const fullTitle = (title ? title + " - " : "") + "Fee Fi Fo Fum";
		document.title = fullTitle;
		return (
			<Helmet>
				<title>{fullTitle}</title>
				<link rel="canonical" href={`${localUrl}/${canonical || ""}`} />
				<link rel="shortcut icon" href={`${imagePath}favicon.png`} />
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={fullTitle} />
				<meta name="twitter:site" content="@GiantsFanzine" />
				<meta name="twitter:creator" content={`@${author || "GiantsFanzine"}`} />
				<meta
					name="twitter:image"
					content={cardImage || imagePath + "layout/twitter-card.jpg"}
				/>
			</Helmet>
		);
	}
}
