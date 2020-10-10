//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchAwards } from "~/client/actions/awardActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminAwardList extends Component {
	constructor(props) {
		super(props);

		const { awardsList, fetchAwards } = props;

		if (!awardsList) {
			fetchAwards();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { awardsList } = nextProps;
		return { awardsList };
	}

	renderList() {
		const awards = _.chain(this.state.awardsList)
			.orderBy(["year"], ["desc"])
			.map(({ _id, year, name }) => (
				<li key={_id}>
					<Link to={`/admin/awards/${_id}`}>
						{year}
						{name ? ` - ${name}` : ""}
					</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{awards.length ? awards : "No awards found"}</ul>
			</div>
		);
	}

	render() {
		const { awardsList } = this.state;
		let content;
		if (!awardsList) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-award-list">
				<HelmetBuilder title="Awards" />
				<section className="page-header">
					<div className="container">
						<h1>Awards</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/awards/new`}>
							Add New Awards
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ awards }) {
	const { awardsList } = awards;
	return { awardsList };
}

export default connect(mapStateToProps, { fetchAwards })(AdminAwardList);
