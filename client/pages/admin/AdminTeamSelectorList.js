//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchAllTeamSelectors } from "~/client/actions/teamSelectorActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminTeamSelectorList extends Component {
	constructor(props) {
		super(props);

		const { selectorList, fetchAllTeamSelectors } = props;

		if (!selectorList) {
			fetchAllTeamSelectors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { selectorList } = nextProps;
		return { selectorList };
	}

	renderList() {
		const { selectorList } = this.state;

		if (!Object.keys(selectorList).length) {
			return "No team selectors found";
		}

		const list = _.chain(selectorList)
			.sortBy("title")
			.map(({ _id, title }) => (
				<li key={_id}>
					<Link to={`/admin/team-selectors/${_id}`}>{title}</Link>
				</li>
			))
			.value();

		return <ul className="plain-list">{list}</ul>;
	}

	render() {
		const { selectorList } = this.state;
		let content;
		if (!selectorList) {
			content = <LoadingPage />;
		} else {
			content = <div className="card form-card">{this.renderList()}</div>;
		}
		return (
			<div className="admin-country-list">
				<HelmetBuilder title="Team Selectors" />
				<section className="page-header">
					<div className="container">
						<h1>Team Selectors</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/team-selectors/new`}>
							Add a new Team Selector
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ teamSelectors }) {
	const { selectorList } = teamSelectors;
	return { selectorList };
}

export default connect(mapStateToProps, { fetchAllTeamSelectors })(AdminTeamSelectorList);
