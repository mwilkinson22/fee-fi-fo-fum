//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Switch, Route } from "react-router-dom";

//Components
import ErrorBoundary from "../../components/ErrorBoundary";
import SubMenu from "~/client/components/SubMenu";
import LoadingPage from "../../components/LoadingPage";
import NotFoundPage from "../NotFoundPage";
import HelmetBuilder from "../../components/HelmetBuilder";

//Pages
import AdminPersonOverview from "~/client/components/admin/teams/AdminPersonOverview";
import AdminPlayerDetails from "~/client/components/admin/people/AdminPlayerDetails";
import AdminCoachDetails from "~/client/components/admin/teams/AdminCoachDetails";
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

	static getDerivedStateFromProps(nextProps, prevState) {
		const { match, peopleList, fullPeople, fetchPerson } = nextProps;
		const { _id } = match.params;
		const newState = { isLoadingList: false };

		//Create or edit
		newState.isNew = !_id;

		if (!newState.isNew) {
			//Check for peopleList
			if (!peopleList) {
				return { isLoadingList: true };
			}

			//Check for valid ID
			if (!peopleList[_id]) {
				return { person: false };
			}

			//Check person is fully loaded
			if (fullPeople[_id]) {
				newState.person = fullPeople[_id];
				newState.isLoadingPerson = false;
			} else if (!prevState.isLoadingPerson) {
				fetchPerson(_id);
				newState.isLoadingPerson = true;
			}
		}

		return newState;
	}

	getSubmenu() {
		const { isNew, person } = this.state;

		if (!isNew) {
			const submenuItems = [{ label: "Overview", slug: "", isExact: true }];
			if (person.isPlayer) {
				submenuItems.push({ label: "Player Details", slug: "player" });
			}
			if (person.isCoach) {
				submenuItems.push({ label: "Coach Details", slug: "coach" });
			}
			if (person.isReferee) {
				submenuItems.push({ label: "Referee Details", slug: "referee" });
			}

			return (
				<SubMenu items={submenuItems} rootUrl={`/admin/people/${person._id}/`} key="menu" />
			);
		}
	}

	getContent() {
		return (
			<section className="form">
				<div className="container">
					<ErrorBoundary>
						<Switch>
							<Route path="/admin/people/new" exact component={AdminPersonOverview} />
							<Route
								path="/admin/people/:_id/referee"
								component={AdminRefereeDetails}
							/>
							<Route path="/admin/people/:_id/coach" component={AdminCoachDetails} />
							<Route
								path="/admin/people/:_id/player"
								component={AdminPlayerDetails}
							/>
							<Route
								path="/admin/people/:_id/player"
								component={AdminPlayerDetails}
							/>
							<Route
								path="/admin/people/:_id"
								exact
								component={AdminPersonOverview}
							/>
							<Route path="/" component={NotFoundPage} />
						</Switch>
					</ErrorBoundary>
				</div>
			</section>
		);
	}

	render() {
		const { isLoadingList, isLoadingPerson, isNew, person } = this.state;

		if (isLoadingList || isLoadingPerson) {
			return <LoadingPage />;
		}

		if (!isNew && person === false) {
			return <NotFoundPage message="Person not found" />;
		}

		//Get Title
		const title = isNew ? "Add New Person" : person.name.full;

		return (
			<div className="admin-person-page admin-page">
				<section className="page-header">
					<HelmetBuilder title={title} />
					<div className="container">
						<Link className="nav-card card" to="/admin/people/">
							↩ Return to people list
						</Link>
					</div>
					<h1>{title}</h1>
					<div className="container">{this.getSubmenu()}</div>
				</section>
				{this.getContent()}
			</div>
		);
	}
}

function mapStateToProps({ people }) {
	const { fullPeople, peopleList } = people;
	return { fullPeople, peopleList };
}
export default connect(mapStateToProps, { fetchPerson, fetchPeopleList })(AdminPersonPage);
