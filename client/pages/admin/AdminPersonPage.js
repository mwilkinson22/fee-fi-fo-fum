//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { NavLink, Link, Switch, Route } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";
import NotFoundPage from "../NotFoundPage";
import HelmetBuilder from "../../components/HelmetBuilder";

//Pages

//Actions
import { fetchPeopleList, fetchPerson } from "../../actions/peopleActions";

class AdminTeamPage extends Component {
	constructor(props) {
		super(props);
		const { slugMap, fetchPeopleList } = props;

		if (!slugMap) {
			fetchPeopleList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, slugMap, fullPeople, fetchPerson } = nextProps;
		const newState = { isLoading: false };

		if (!slugMap) {
			newState.isLoading = true;
			return newState;
		}

		if (slugMap[match.params.slug]) {
			const { id } = slugMap[match.params.slug];
			if (!fullPeople[id]) {
				fetchPerson(id);
				newState.isLoading = true;
			} else {
				newState.person = fullPeople[id];
			}
		} else {
			newState.person = false;
		}

		return newState;
	}

	getSubmenu() {
		const { slug } = this.state.person;
		const submenuItems = {
			Overview: ""
		};
		const submenu = _.map(submenuItems, (url, title) => {
			return (
				<NavLink
					key={url}
					exact={url.length === 0}
					to={`/admin/people/${slug}/${url}`}
					activeClassName="active"
				>
					{title}
				</NavLink>
			);
		});
		return (
			<div className="sub-menu" key="menu">
				{submenu}
			</div>
		);
	}

	getContent() {
		return (
			<div>
				<HelmetBuilder title={this.state.person.name.full} />
				{/*<Switch>*/}
				{/*	<Route*/}
				{/*		exact*/}
				{/*		path="/admin/people/:slug/squads/:squad"*/}
				{/*		component={AdminTeamSquads}*/}
				{/*	/>*/}
				{/*	<Route exact path="/admin/people/:slug/squads" component={AdminTeamSquads} />*/}
				{/*	<Route path="/admin/people/:slug" exact component={AdminTeamOverview} />*/}
				{/*	<Route path="/" component={NotFoundPage} />*/}
				{/*</Switch>*/}
			</div>
		);
	}

	render() {
		const { person, isLoading } = this.state;
		if (person === undefined || isLoading) {
			return <LoadingPage />;
		} else if (!person) {
			return <NotFoundPage message="Team not found" />;
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
	const { fullPeople, slugMap } = people;
	return { fullPeople, slugMap };
}
export default connect(
	mapStateToProps,
	{ fetchPerson, fetchPeopleList }
)(AdminTeamPage);
