//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminTeamTypeList extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { teamTypes } = nextProps;
		return { teamTypes };
	}

	renderList() {
		const { teamTypes } = this.state;

		const list = _.chain(teamTypes)
			.sortBy("sortOrder")
			.map(({ slug, name }) => (
				<li key={slug}>
					<Link to={`/admin/team-types/${slug}`}>{name}</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{list}</ul>
			</div>
		);
	}

	render() {
		return (
			<div className="admin-team-type-list">
				<HelmetBuilder title="Team Types" />
				<section className="page-header">
					<div className="container">
						<h1>Team Types</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/team-types/new`}>
							Add a New Team Type
						</Link>
						{this.renderList()}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ teams }) {
	const { teamTypes } = teams;
	return { teamTypes };
}

export default connect(mapStateToProps)(AdminTeamTypeList);
