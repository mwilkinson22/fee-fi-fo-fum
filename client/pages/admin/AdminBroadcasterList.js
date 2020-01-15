//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchBroadcasters } from "~/client/actions/broadcasterActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminBroadcasterList extends Component {
	constructor(props) {
		super(props);

		const { broadcasterList, fetchBroadcasters } = props;

		if (!broadcasterList) {
			fetchBroadcasters();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { broadcasterList } = nextProps;
		return { broadcasterList };
	}

	renderList() {
		let broadcasters = _.chain(this.state.broadcasterList)
			.sortBy("name")
			.map(({ _id, name }) => (
				<li key={_id}>
					<Link to={`/admin/settings/broadcasters/${_id}`}>{name}</Link>
				</li>
			))
			.value();

		if (!broadcasters.length) {
			broadcasters = <li>No broadcasters found</li>;
		}

		return (
			<div className="card form-card">
				<ul className="plain-list">{broadcasters}</ul>
			</div>
		);
	}

	render() {
		const { broadcasterList } = this.state;
		let content;
		if (!broadcasterList) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}

		return (
			<div className="admin-broadcaster-list">
				<HelmetBuilder title="Broadcasters" />
				<section className="page-header">
					<div className="container">
						<h1>Broadcasters</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/settings/broadcasters/new`}>
							Add a New Broadcaster
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ broadcasters }) {
	const { broadcasterList } = broadcasters;
	return { broadcasterList };
}

export default connect(mapStateToProps, { fetchBroadcasters })(AdminBroadcasterList);
