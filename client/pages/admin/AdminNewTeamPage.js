import React, { Component } from "react";
import HelmetBuilder from "../../components/HelmetBuilder";
import { Link } from "react-router-dom";

//Pages
import AdminTeamOverview from "../../components/admin/teams/AdminTeamOverview";

export default class AdminTeamPage extends Component {
	render() {
		return (
			<div className="admin-team-page admin-page">
				<HelmetBuilder title="Add New Team" />
				<section className="page-header">
					<div className="container">
						<Link className="nav-card card" to="/admin/teams/">
							↩ Return to team list
						</Link>
					</div>
					<h1>Add New Team</h1>
				</section>
				<section>
					<AdminTeamOverview />
				</section>
			</div>
		);
	}
}
