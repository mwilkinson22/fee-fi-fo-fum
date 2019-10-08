//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";
import NotFoundPage from "../NotFoundPage";

//Actions
import { fetchUserList } from "~/client/actions/userActions";

class AdminUserList extends Component {
	constructor(props) {
		super(props);

		const { userList, fetchUserList } = props;

		if (!userList) {
			fetchUserList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { userList } = nextProps;
		return { userList };
	}

	renderList() {
		const users = _.chain(this.state.userList)
			.sortBy("name.full")
			.map(({ _id, username, name }) => (
				<li key={_id}>
					<Link to={`/admin/users/${_id}`}>
						{name.full} ({username})
					</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{users}</ul>
			</div>
		);
	}

	render() {
		const { userList } = this.state;
		const { authUser } = this.props;
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		let content;
		if (!userList) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-user-list">
				<HelmetBuilder title="Users" />
				<section className="page-header">
					<div className="container">
						<h1>Users</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/users/new`}>
							Add a new User
						</Link>
						{content}
					</div>
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

export default connect(
	mapStateToProps,
	{ fetchUserList }
)(AdminUserList);
