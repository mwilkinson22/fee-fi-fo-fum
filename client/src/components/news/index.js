import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";
import NewsPost from "./NewsPost";
import NewsList from "./NewsList";

export default class NewsRouter extends Component {
	render() {
		return (
			<div>
				<Switch>
					<Route path="/news/:category/:slug" component={NewsPost} />
					<Route path="/news/:category/" component={NewsList} />
					<Route path="/news/" component={NewsList} />
				</Switch>
			</div>
		);
	}
}
