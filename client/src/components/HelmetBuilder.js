import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { localUrl, imagePath } from "../extPaths";

export default class HelmetBuilder extends Component {
	render() {
		const { title, canonical } = this.props;
		const fullTitle = (title ? title + " - " : "") + "Fee Fi Fo Fum";
		document.title = fullTitle;
		return (
			<Helmet>
				<title>{fullTitle}</title>
				<link rel="canonical" href={`${localUrl}/${canonical || ""}`} />
				<link rel="shortcut icon" href={`${imagePath}favicon.png`} />
			</Helmet>
		);
	}
}
