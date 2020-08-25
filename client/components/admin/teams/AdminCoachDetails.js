//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Constants
import coachTypes from "~/constants/coachTypes";

class AdminCoachDetails extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPeople, match } = nextProps;

		const newState = {};

		newState.person = fullPeople[match.params._id];

		return newState;
	}

	renderCoachHistory() {
		const { person } = this.state;
		const { teamList, teamTypes } = this.props;
		let content;

		//Get games
		if (person.coachingRoles && person.coachingRoles.length) {
			const dateFormat = "yyyy/MM/dd";
			content = _.chain(person.coachingRoles)
				.orderBy("from", "desc")
				.map(r => {
					//Set dates
					const team = teamList[r._team].name.long;
					const teamType = teamTypes[r._teamType].name;
					const fromDate = new Date(r.from).toString(dateFormat);
					const toDate = r.to ? new Date(r.to).toString(dateFormat) : "";
					const role = coachTypes.find(({ key }) => key == r.role).name;

					return [
						<label key={r._id + "label"}>
							{fromDate} - {toDate}
						</label>,
						<Link to={`/admin/teams/${r._team}/coaches`} key={r._id + "content"}>
							{team} {teamType} {role} Coach
						</Link>
					];
				})
				.flatten()
				.value();
		} else {
			content = "No coaching data saved";
		}

		return (
			<div className="form-card grid">
				<h6>Coaching Roles</h6>
				{content}
			</div>
		);
	}

	render() {
		return <div>{this.renderCoachHistory()}</div>;
	}
}

//Add Redux Support
function mapStateToProps({ people, teams }) {
	const { fullPeople } = people;
	const { teamList, teamTypes } = teams;
	return { fullPeople, teamList, teamTypes };
}
// export default form;
export default connect(mapStateToProps)(AdminCoachDetails);
