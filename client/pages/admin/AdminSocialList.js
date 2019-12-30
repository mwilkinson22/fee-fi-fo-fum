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
import { fetchProfiles } from "~/client/actions/socialActions";

class AdminSocialList extends Component {
	constructor(props) {
		super(props);

		const { profiles, fetchProfiles } = props;

		if (!profiles) {
			fetchProfiles();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { profiles } = nextProps;
		return { profiles };
	}

	renderList() {
		const profiles = _.chain(this.state.profiles)
			.sortBy("name")
			.map(({ _id, name, archived }) => (
				<li key={_id} className={archived ? "archived" : ""}>
					<Link to={`/admin/settings/social/${_id}`}>{name}</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{profiles}</ul>
			</div>
		);
	}

	render() {
		const { profiles } = this.state;
		const { authUser } = this.props;
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		let content;
		if (!profiles) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-social-list">
				<HelmetBuilder title="Social Profiles" />
				<section className="page-header">
					<div className="container">
						<h1>Social Profiles</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/settings/social/new`}>
							Add a New Social Profile
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config, social }) {
	const { authUser } = config;
	const { profiles } = social;
	return { authUser, profiles };
}

export default connect(mapStateToProps, { fetchProfiles })(AdminSocialList);
