import React, { Component } from "react";
import { connect } from "react-redux";
import { renderRoutes } from "react-router-config";
import { fetchNewsCategories } from "./actions/newsActions";

//Actions
import * as actions from "./actions";

//Components
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";

class App extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		return (
			<div>
				<ScrollToTop>
					<Header />
					{renderRoutes(this.props.route.routes)}
				</ScrollToTop>
			</div>
		);
	}
}

function mapStateToProps({ auth }) {
	return { auth };
}

function loadData(store, path) {
	return store.dispatch(fetchNewsCategories());
}

export default {
	component: connect(
		mapStateToProps,
		actions
	)(App),
	loadData
};
