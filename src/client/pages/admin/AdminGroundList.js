//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchAllGrounds } from "~/client/actions/groundActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminGroundList extends Component {
	constructor(props) {
		super(props);

		const { groundList, fetchAllGrounds } = props;

		if (!groundList) {
			fetchAllGrounds();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { groundList } = nextProps;
		return { groundList };
	}

	renderList() {
		const grounds = _.chain(this.state.groundList)
			.sortBy("name")
			.map(({ _id, name, address }) => (
				<li key={_id}>
					<Link to={`/admin/grounds/${_id}`}>
						{name}, {address._city.name}
					</Link>
				</li>
			))
			.value();

		return (
			<div className="card form-card">
				<ul className="plain-list">{grounds}</ul>
			</div>
		);
	}

	render() {
		const { groundList } = this.state;
		let content;
		if (!groundList) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-ground-list">
				<HelmetBuilder title="Grounds" />
				<section className="page-header">
					<div className="container">
						<h1>Grounds</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/grounds/new`}>
							Add a New Ground
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ grounds }) {
	const { groundList } = grounds;
	return { groundList };
}

export default connect(mapStateToProps, { fetchAllGrounds })(AdminGroundList);
