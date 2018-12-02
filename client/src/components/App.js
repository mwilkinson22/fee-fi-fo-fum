import React, { Component } from "react";
//import { BrowserRouter, Route } from "react-router-dom";
import { connect } from "react-redux";
import * as actions from "../actions";
import LoadingPage from "./LoadingPage";

class App extends Component {
	componentDidMount() {
		this.props.fetchUser();
	}

	render() {
		if (this.props.auth === null) {
			return <LoadingPage />;
		} else {
			return (
				<div>
					<h2>
						Hello,{" "}
						{this.props.auth ? this.props.auth.name.first : "World"}
					</h2>
					<p>Let's get started</p>
				</div>
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
