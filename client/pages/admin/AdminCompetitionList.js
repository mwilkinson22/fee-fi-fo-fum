//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchCompetitions } from "~/client/actions/competitionActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminCompetitionList extends Component {
	constructor(props) {
		super(props);

		const { competitionList, fetchCompetitions } = props;

		if (!competitionList) {
			fetchCompetitions();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionList } = nextProps;
		return { competitionList };
	}

	renderList() {
		const { competitionList } = this.state;
		const competitions = _.chain(competitionList)
			.sortBy("name")
			.map(({ _id, name }) => (
				<li key={_id}>
					<Link to={`/admin/competitions/${_id}`}>{name}</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{competitions}</ul>
			</div>
		);
	}

	render() {
		const { competitionList } = this.state;
		let content;
		if (!competitionList) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-country-list">
				<HelmetBuilder title="Competitions" />
				<section className="page-header">
					<div className="container">
						<h1>Competitions</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/competitions/new`}>
							Add a New Competition
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ competitions }) {
	const { competitionList } = competitions;
	return { competitionList };
}

export default connect(
	mapStateToProps,
	{ fetchCompetitions }
)(AdminCompetitionList);
