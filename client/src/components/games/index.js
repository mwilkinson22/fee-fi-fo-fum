import React, { Component } from "react";
import FixtureList from "./FixtureList";
import ResultList from "./ResultList";
import GamePage from "./GamePage";
import { Route, Switch, Redirect } from "react-router-dom";

export default class GameRouter extends Component {
	render() {
		return (
			<div>
				<Switch>
					<Route path="/games/results" component={ResultList} />
					<Route path="/games/fixtures" component={FixtureList} />
					<Route path="/games/:slug" component={GamePage} />
					<Route path="/games" render={() => <Redirect to="/games/fixtures" />} />
				</Switch>
			</div>
		);
	}
}
