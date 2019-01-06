import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { connect } from "react-redux";

//Actions
import * as actions from "../actions";

//Stylesheets
import "../scss/base.scss";
import "../scss/style.scss";

//Components
import ScrollToTop from "./ScrollToTop";
import Header from "./Header";
import HomePage from "./Homepage";
import GameRouter from "./games";
import TeamList from "./teams/TeamList";
import AdminRouter from "./admin";
import NewsRouter from "./news";
import PersonPage from "./people/PersonPage";

class App extends Component {
	componentDidMount() {
		this.props.fetchUser();
	}

	render() {
		return (
			<BrowserRouter>
				<ScrollToTop>
					<div id="wrapper">
						<Header />
						<Route path="/games" component={GameRouter} />
						<Route path="/teams" component={TeamList} />
						<Route path="/news/" component={NewsRouter} />
						<Route
							path="/players/:slug"
							render={props => <PersonPage {...props} personRole="player" />}
						/>
						<Route
							path="/coaches/:slug"
							render={props => <PersonPage {...props} personRole="coach" />}
						/>
						<Route path="/admin" component={AdminRouter} />
						<Route path="/" component={HomePage} exact />
					</div>
				</ScrollToTop>
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
