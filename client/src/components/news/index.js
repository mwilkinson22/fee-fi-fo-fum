import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";
import NewsPost from "./NewsPost";

export default class NewsRouter extends Component {
	render() {
		return (
			<div>
				<Switch>
					<Route path="/news/:category/:slug" component={NewsPost} />
				</Switch>
			</div>
		);
	}
}
