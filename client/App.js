//Modules
import "datejs";
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { renderRoutes } from "react-router-config";

//Actions
import { fetchUser } from "./actions/userActions";

//Components
import GAListener from "~/client/components/GAListener";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import HelmetBuilder from "./components/HelmetBuilder";

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
		const { route, browser, gaTracking, socialMediaImage } = this.props;
		let className = "";
		if (browser) {
			className = `browser-${browser.toLowerCase().replace(/(?![A-Za-z0-9-_])./gi, "-")}`;
		}
		return (
			<GAListener trackingId={gaTracking}>
				<div className={className}>
					<ScrollToTop>
						<Header />
						<HelmetBuilder title="" canonical="/" />
						{renderRoutes(route.routes)}
					</ScrollToTop>
				</div>
			</GAListener>
		);
	}
}

function mapStateToProps({ config }) {
	const { browser, gaTracking, socialMediaImage } = config;
	return { browser, gaTracking, socialMediaImage };
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchUser }
	)(App)
};
