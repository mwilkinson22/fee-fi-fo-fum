//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../components/LoadingPage";

//Actions
import { fetchSponsors } from "~/client/actions/sponsorActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminSponsorList extends Component {
	constructor(props) {
		super(props);

		const { sponsorList, fetchSponsors } = props;

		if (!sponsorList) {
			fetchSponsors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { sponsorList } = nextProps;
		return { sponsorList };
	}

	renderList() {
		const { sponsorList } = this.state;
		const sponsors = _.chain(sponsorList)
			.sortBy("name")
			.map(({ _id, name }) => (
				<li key={_id}>
					<Link to={`/admin/sponsors/${_id}`}>{name}</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{sponsors}</ul>
			</div>
		);
	}

	render() {
		const { sponsorList } = this.state;
		let content;
		if (!sponsorList) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-city-list">
				<HelmetBuilder title="Sponsors" />
				<section className="page-header">
					<div className="container">
						<h1>Sponsors</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/sponsors/new`}>
							Add a New Sponsor
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ sponsors }) {
	const { sponsorList } = sponsors;
	return { sponsorList };
}

export default connect(
	mapStateToProps,
	{ fetchSponsors }
)(AdminSponsorList);
