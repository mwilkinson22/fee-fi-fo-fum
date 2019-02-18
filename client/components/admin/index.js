import React, { Component } from "react";
import { connect } from "react-redux";
import Login from "./Login";
import { Switch, Route } from "react-router-dom";

//Pages
import AdminGameList from "../../pages/AdminGameList";
import Logout from "./Logout";
import NotFoundPage from "../../pages/NotFoundPage";
import AdminGamePage from "../../pages/AdminGamePage";

class AdminRouter extends Component {
	render() {
		if (this.props.auth) {
			return (
				<Switch>
					<Route path="/admin/game/:slug" component={AdminGamePage} />
					<Route path="/admin/games/:year/:teamType" exact component={AdminGameList} />
					<Route path="/admin/games/:year/" exact component={AdminGameList} />
					<Route path="/admin/games/" exact component={AdminGameList} />

					<Route path="/admin/logout" component={Logout} />
					<Route path="/admin" component={NotFoundPage} />
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
