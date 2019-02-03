import React, { Component } from "react";
import GamePage from "./GamePage";
import { Route, Switch, Redirect } from "react-router-dom";
import GameList2 from "./GameList";

export default class GameRouter extends Component {
	render() {
		return (
			<div>
				<Switch>
					<Route
						path="/games/fixtures/:teamType"
						render={props => <GameList2 {...props} listType="fixtures" />}
					/>
					<Route
						path="/games/fixtures"
						render={props => <GameList2 {...props} listType="fixtures" />}
					/>
					<Route
						path="/games/results/:year/:teamType"
						render={props => <GameList2 {...props} listType="results" />}
					/>
					<Route
						path="/games/results/:year"
						render={props => <GameList2 {...props} listType="results" />}
					/>
					<Route
						path="/games/results"
						render={props => <GameList2 {...props} listType="results" />}
					/>
					<Route path="/games/:slug" component={GamePage} />
					<Route path="/games" render={() => <Redirect to="/games/fixtures" />} />
				</Switch>
			</div>
		);
	}
}
