//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

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
			.map(({ _id, name }) => (
				<li key={_id}>
					<Link to={`/admin/social/${_id}`}>{name}</Link>
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
		let content;
		if (!profiles) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-country-list">
				<HelmetBuilder title="Social Profiles" />
				<section className="page-header">
					<div className="container">
						<h1>Social Profiles</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/social/new`}>
							Add a New Social Profile
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ social }) {
	return { profiles: social };
}

export default connect(
	mapStateToProps,
	{ fetchProfiles }
)(AdminSocialList);
