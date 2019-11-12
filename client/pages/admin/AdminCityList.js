//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchCities } from "~/client/actions/locationActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminCityList extends Component {
	constructor(props) {
		super(props);

		const { cities, fetchCities } = props;

		if (!cities) {
			fetchCities();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { cities } = nextProps;
		return { cities };
	}

	renderList() {
		const cities = _.chain(this.state.cities)
			.sortBy("name")
			.map(({ _id, name, _country }) => (
				<li key={_id}>
					<Link to={`/admin/cities/${_id}`}>
						{name}, {_country.name}
					</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{cities}</ul>
			</div>
		);
	}

	render() {
		const { cities } = this.state;
		let content;
		if (!cities) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-city-list">
				<HelmetBuilder title="Cities" />
				<section className="page-header">
					<div className="container">
						<h1>Cities</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/cities/new`}>
							Add a New City
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ locations }) {
	const { cities } = locations;
	return { cities };
}

export default connect(
	mapStateToProps,
	{ fetchCities }
)(AdminCityList);
