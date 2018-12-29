import React, { Component } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import NewsPost from "./NewsPostPage";
import NewsList from "./NewsList";

export default class NewsRouter extends Component {
	render() {
		return (
			<div>
				<Switch>
					<Route path="/news/:category/post/:slug" component={NewsPost} />
					<Route path="/news/:category/:page" component={NewsList} />
					<Route path="/news/:category/" component={NewsList} />
					<Route path="/news/" render={() => <Redirect to="/news/all" />} />
				</Switch>
			</div>
		);
	}
}
