import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { connect } from "react-redux";
import * as actions from "../actions";
import LoadingPage from "./LoadingPage";
import Header from "./Header";
import "../scss/base.scss";
import "../scss/style.scss";

class App extends Component {
	componentDidMount() {
		this.props.fetchUser();
	}

	render() {
		if (this.props.auth === null) {
			return <LoadingPage />;
		} else {
			return (
				<BrowserRouter>
					<div id="wrapper">
						<Header />
						<div className="container">
							<h1>Test</h1>
							<h2>Test</h2>
							<h3>Test</h3>
							<h4>Test</h4>
						</div>
					</div>
				</BrowserRouter>
			);
		}
	}
}

function mapStateToProps({ auth }) {
	return { auth };
}

export default connect(
	mapStateToProps,
	actions
)(App);
