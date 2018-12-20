import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { connect } from "react-redux";

//Actions
import * as actions from "../actions";

//Stylesheets
import "../scss/base.scss";
import "../scss/style.scss";

//Components
import Header from "./Header";
import HomePage from "./Homepage";
import GameRouter from "./games";
import TeamRouter from "./teams";
import AdminRouter from "./admin";
import NewsRouter from "./news";

class App extends Component {
	componentDidMount() {
		this.props.fetchUser();
	}

	render() {
		return (
			<BrowserRouter>
				<div id="wrapper">
					<Header />
					<Route path="/games" component={GameRouter} />
					<Route path="/teams" component={TeamRouter} />
					<Route path="/news/" component={NewsRouter} />
					<Route path="/admin" component={AdminRouter} />
					<Route path="/" component={HomePage} exact />
				</div>
			</BrowserRouter>
		);
	}
}

function mapStateToProps({ auth }) {
	return { auth };
}

export default connect(
	mapStateToProps,
	actions
)(App);
