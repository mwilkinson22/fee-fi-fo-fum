import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { localUrl } from "../extPaths";

export default class HelmetBuilder extends Component {
	render() {
		const { title, canonical } = this.props;
		return (
			<Helmet>
				<title>
					{title ? title + " - " : ""}
					Fee Fi Fo Fum
				</title>
				<link rel="canonical" href={`${localUrl}/${canonical || ""}`} />
			</Helmet>
		);
	}
}
