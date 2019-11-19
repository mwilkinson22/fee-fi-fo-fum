//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Switch, Route } from "react-router-dom";

//Components
import SubMenu from "../../components/SubMenu";
import NotFoundPage from "../NotFoundPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";
import AdminUserOverview from "~/client/components/admin/users/AdminUserOverview";
import AdminUserPasswordChange from "~/client/components/admin/users/AdminUserPasswordChange";
import AdminUserTransferSiteOwnership from "~/client/components/admin/users/AdminUserTransferSiteOwnership";

//Actions
import { fetchUserList } from "~/client/actions/userActions";

//Constants
import LoadingPage from "~/client/components/LoadingPage";

class AdminTeamTypePage extends Component {
	constructor(props) {
		super(props);
		const { userList, fetchUserList, authUser, match } = props;

		//Non-admins can only edit their own profile
		//So we only call userList when an admin user is accessing another profile
		//Otherwise, we can simply use authUser
		if (!userList && authUser.isAdmin && match.params._id != authUser._id) {
			fetchUserList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { authUser, userList, match } = nextProps;
		const newState = { authUser };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Remove redirect after creation/deletion
		if (prevState.redirect == match.url) {
			newState.redirect = false;
		}

		//Get current user
		if (!newState.isNew) {
			if (authUser && authUser._id == match.params._id) {
				//Current user accessing their own page. Simple match to current user
				newState.user = authUser;
			} else if (!authUser.isAdmin) {
				//If none admin users are trying to access others, we simply 404
				newState.user = false;
			} else if (userList) {
				//If an admin is accessing another page and userList has loaded
				//we pull it here
				newState.user = userList[match.params._id] || false;
			}
		}
		return newState;
	}

	renderSubMenu() {
		const { user, authUser } = this.state;
		if (user) {
			const menu = [
				{ label: "Overview", slug: "", isExact: true },
				{ label: "Change Password", slug: "password" }
			];

			if (authUser.isSiteOwner && authUser._id != user._id) {
				menu.push({ label: "Transfer Ownership", slug: "ownership" });
			}

			return <SubMenu items={menu} rootUrl={`/admin/users/${user._id}`} />;
		}
	}

	renderContent() {
		const { user } = this.state;
		//We use render and pass in the user to save us repeating the
		//more complex logic on access rights.
		//Child components must pass the user prop into state
		return (
			<Switch>
				<Route
					path="/admin/users/:_id/ownership"
					render={() => <AdminUserTransferSiteOwnership user={user} />}
				/>
				<Route
					path="/admin/users/:_id/password"
					render={() => <AdminUserPasswordChange user={user} />}
				/>
				<Route
					path="/admin/users/:_id/"
					exact
					render={() => <AdminUserOverview user={user} />}
				/>
				<Route path="/" component={NotFoundPage} />
			</Switch>
		);
	}

	render() {
		const { user, isNew } = this.state;

		if (!isNew && user === false) {
			return <NotFoundPage message="User not found" />;
		}

		if (!isNew && !user) {
			return <LoadingPage />;
		}

		const title = isNew ? "Add New User" : user.username;
		return (
			<div className="admin-user-page">
				<HelmetBuilder title={title} />
				<section className="page-header">
					<div className="container">
						<h1>{title}</h1>
						{this.renderSubMenu()}
					</div>
				</section>
				<section className="form">
					<div className="container">{this.renderContent()}</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config, users }) {
	const { authUser } = config;
	const { userList } = users;
	return { authUser, userList };
}

export default connect(mapStateToProps, { fetchUserList })(AdminTeamTypePage);
