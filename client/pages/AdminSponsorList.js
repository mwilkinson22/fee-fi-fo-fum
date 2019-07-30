//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../components/LoadingPage";

//Actions
import { fetchPlayerSponsors } from "~/client/actions/peopleActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminSponsorList extends Component {
	constructor(props) {
		super(props);

		const { sponsors, fetchPlayerSponsors } = props;

		if (!sponsors) {
			fetchPlayerSponsors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { sponsors } = nextProps;
		return { sponsors };
	}

	renderList() {
		const sponsors = _.chain(this.state.sponsors)
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
		const { sponsors } = this.state;
		let content;
		if (!sponsors) {
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

function mapStateToProps({ people }) {
	const { sponsors } = people;
	return { sponsors };
}

export default connect(
	mapStateToProps,
	{ fetchPlayerSponsors }
)(AdminSponsorList);
