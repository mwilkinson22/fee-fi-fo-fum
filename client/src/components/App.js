import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { connect } from "react-redux";

//Actions
import * as actions from "../actions";

//Stylesheets
import "../scss/style.scss";

//Components
import ScrollToTop from "./ScrollToTop";
import Header from "./Header";
import HomePage from "./Homepage";
import GameRouter from "./games";
import SquadList from "./squads/SquadList";
import AdminRouter from "./admin";
import NewsRouter from "./news";
import PersonPage from "./people/PersonPage";
import HelmetBuilder from "./HelmetBuilder";

class App extends Component {
	constructor(props) {
		super(props);
		this.coreUrl = window.location.protocol + "//" + window.location.host;
	}
	componentDidMount() {
		this.props.fetchUser();
	}

	render() {
		return (
			<BrowserRouter>
				<ScrollToTop>
					<HelmetBuilder />
					<div id="wrapper">
						<Header />
						<Route path="/games" component={GameRouter} />
						<Route path="/squads" component={SquadList} />
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
