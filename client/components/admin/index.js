import React, { Component } from "react";
import { connect } from "react-redux";
import Login from "./Login";
import { Switch, Route } from "react-router-dom";
import Logout from "./Logout";

class AdminRouter extends Component {
	render() {
		if (this.props.auth) {
			return (
				<Switch>
					<Route path="/admin/logout" component={Logout} />
				</Switch>
			);
		} else {
			return <Login />;
		}
	}
}
function mapStateToProps({ auth }) {
	return { auth };
}

export default { component: connect(mapStateToProps)(AdminRouter) };
