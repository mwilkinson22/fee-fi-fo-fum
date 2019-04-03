import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { renderRoutes } from "react-router-config";

//Actions
import { fetchUser } from "./actions/userActions";

//Components
import { ToastContainer, toast } from "react-toastify";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";

//Action Type Sanity Check
import * as actionTypes from "./actions/types";
const duplicatedTypes = _.chain(actionTypes)
	.groupBy()
	.filter(arr => arr.length > 1)
	.map(arr => arr[0])
	.value();
if (duplicatedTypes.length) {
	console.warn("Two or more action types are using the following strings:", duplicatedTypes);
}

//App Component
class App extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		document.addEventListener("keydown", this.handleKeyPress);
	}

	handleKeyPress(ev) {
		const { keyCode, ctrlKey, shiftKey, altKey } = ev;
		if (ctrlKey && shiftKey && altKey && keyCode === 65) {
			window.location.href = "/admin";
		}
	}

	render() {
		const { route } = this.props;
		return (
			<div>
				<ScrollToTop>
					<Header />
					{renderRoutes(route.routes)}
					<ToastContainer position="bottom-right" />
				</ScrollToTop>
			</div>
		);
	}
}

function mapStateToProps(state, ownProps) {
	return ownProps;
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchUser }
	)(App)
};
