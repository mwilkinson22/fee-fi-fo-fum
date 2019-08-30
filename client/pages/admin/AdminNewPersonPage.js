import React, { Component } from "react";
import HelmetBuilder from "../../components/HelmetBuilder";
import { Link } from "react-router-dom";

//Pages

export default class AdminNewPersonPage extends Component {
	render() {
		return (
			<div className="admin-person-page admin-page">
				<HelmetBuilder title="Add New Person" />
				<section className="page-header">
					<div className="container">
						<Link className="nav-card card" to="/admin/people/">
							↩ Return to people list
						</Link>
					</div>
					<h1>Add New Person</h1>
				</section>
				<section />
			</div>
		);
	}
}
