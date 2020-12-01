import React, { Component } from "react";
import { Helmet } from "react-helmet";

export default class NotFoundPage extends Component {
	render() {
		const { message } = this.props;
		return (
			<div className="container">
				<Helmet>
					<meta name="robots" content="NOINDEX, NOFOLLOW" />
				</Helmet>
				<h1>404 - {message || "Page not found"}</h1>
			</div>
		);
	}
}
