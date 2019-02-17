import React, { Component } from "react";
import { connect } from "react-redux";
import { renderRoutes } from "react-router-config";

//Actions
import { fetchUser } from "./actions/userActions";

//Components
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";

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
				</ScrollToTop>
			</div>
		);
	}
}

function mapStateToProps({ auth }) {
	return { auth };
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchUser }
	)(App)
};
