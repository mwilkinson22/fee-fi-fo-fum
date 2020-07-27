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

	renderLists() {
		const { selectorList } = this.state;

		if (!Object.keys(selectorList).length) {
			return <div className="card form-card">No team selectors found</div>;
		}

		return _.chain(selectorList)
			.groupBy(l => (l._game ? "Game" : "Custom"))
			.map((selectors, type) => {
				const getDisplayValue = ({ title, _game }) => (_game ? _game.slug : title);

				const list = _.chain(selectors)
					.sortBy(getDisplayValue)
					.map(s => (
						<li key={s._id}>
							<Link to={`/admin/team-selectors/${s._id}`}>{getDisplayValue(s)}</Link>
						</li>
					))
					.value();

				return (
					<div className="card form-card" key={type}>
						<h6>{type} Selectors</h6>
						<ul className="plain-list">{list}</ul>
					</div>
				);
			})
			.sortBy("key")
			.value();
	}

	render() {
		const { selectorList } = this.state;
		let content;
		if (!selectorList) {
			content = <LoadingPage />;
		} else {
			content = this.renderLists();
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
