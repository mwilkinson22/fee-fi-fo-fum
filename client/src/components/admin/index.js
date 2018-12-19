import React, { Component } from "react";
import { connect } from "react-redux";
import LoginPage from "./Login";
import { Route } from "react-router-dom";
import "../../scss/admin/admin.scss";

class AdminRouter extends Component {
	render() {
		if (this.props.auth) {
			return (
				<div>
					<h1>Admin</h1>
					<Route path="/admin/logout" />
				</div>
			);
		} else {
			return <LoginPage />;
		}
	}
}
function mapStateToProps({ auth }) {
	return { auth };
}

export default connect(mapStateToProps)(AdminRouter);
