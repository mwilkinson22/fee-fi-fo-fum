//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Switch, Route } from "react-router-dom";

//Components
import SubMenu from "~/client/components/SubMenu";
import LoadingPage from "../../components/LoadingPage";
import NotFoundPage from "../NotFoundPage";
import HelmetBuilder from "../../components/HelmetBuilder";

//Pages
import AdminPersonOverview from "~/client/components/admin/teams/AdminPersonOverview";
import AdminPlayerDetails from "~/client/components/admin/teams/AdminPlayerDetails";
import AdminRefereeDetails from "~/client/components/admin/teams/AdminRefereeDetails";

//Actions
import { fetchPeopleList, fetchPerson } from "../../actions/peopleActions";

class AdminPersonPage extends Component {
	constructor(props) {
		super(props);
		const { peopleList, fetchPeopleList } = props;

		if (!peopleList) {
			fetchPeopleList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, peopleList, fullPeople, fetchPerson } = nextProps;
		const { slug } = match.params;
		const newState = { isLoading: false };

		if (!peopleList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Person Id
		const person = _.find(peopleList, p => p.slug == slug);

		if (!person) {
			newState.person = false;
			return newState;
		}

		const { _id } = person;
		if (!fullPeople[_id]) {
			fetchPerson(_id);
			newState.isLoading = true;
		} else {
			newState.person = fullPeople[_id];
		}

		return newState;
	}

	getSubmenu() {
		const { person } = this.state;

		const submenuItems = [{ label: "Overview", slug: "", isExact: true }];
		if (person.isPlayer) {
			submenuItems.push({ label: "Player Details", slug: "player" });
		}
		if (person.isReferee) {
			submenuItems.push({ label: "Referee Details", slug: "referee" });
		}

		return (
			<SubMenu items={submenuItems} rootUrl={`/admin/people/${person.slug}/`} key="menu" />
		);
	}

	getContent() {
		return (
			<div>
				<HelmetBuilder title={this.state.person.name.full} />
				<Switch>
					<Route path="/admin/people/:slug/referee" component={AdminRefereeDetails} />
					<Route path="/admin/people/:slug/player" component={AdminPlayerDetails} />
					<Route path="/admin/people/:slug" exact component={AdminPersonOverview} />
					<Route path="/" component={NotFoundPage} />
				</Switch>
			</div>
		);
	}

	render() {
		const { person, isLoading } = this.state;
		if (person === undefined || isLoading) {
			return <LoadingPage />;
		} else if (!person) {
			return <NotFoundPage message="Person not found" />;
		} else {
			return (
				<div className="admin-person-page admin-page">
					<section className="page-header">
						<div className="container">
							<Link className="nav-card card" to="/admin/people/">
								↩ Return to people list
							</Link>
						</div>
						<h1>{person.name.full}</h1>
						<div className="container">{this.getSubmenu()}</div>
					</section>
					{this.getContent()}
				</div>
			);
		}
	}
}

function mapStateToProps({ people }) {
	const { fullPeople, peopleList } = people;
	return { fullPeople, peopleList };
}
export default connect(
	mapStateToProps,
	{ fetchPerson, fetchPeopleList }
)(AdminPersonPage);
