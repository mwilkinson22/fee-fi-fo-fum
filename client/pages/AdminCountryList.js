//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../components/LoadingPage";

//Actions
import { fetchCountries } from "~/client/actions/locationActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminCountryList extends Component {
	constructor(props) {
		super(props);

		const { countries, fetchCountries } = props;

		if (!countries) {
			fetchCountries();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { countries } = nextProps;
		return { countries };
	}

	renderList() {
		const countries = _.chain(this.state.countries)
			.sortBy("name")
			.map(({ _id, slug, name }) => (
				<li key={_id}>
					<Link to={`/admin/countries/${slug}`}>{name}</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{countries}</ul>
			</div>
		);
	}

	render() {
		const { countries } = this.state;
		let content;
		if (!countries) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-country-list">
				<HelmetBuilder title="Countries" />
				<section className="page-header">
					<div className="container">
						<h1>Countries</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/countries/new`}>
							Add a New Country
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ locations }) {
	const { countries } = locations;
	return { countries };
}

export default connect(
	mapStateToProps,
	{ fetchCountries }
)(AdminCountryList);
