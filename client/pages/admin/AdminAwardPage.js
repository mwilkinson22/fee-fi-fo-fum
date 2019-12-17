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
import AdminAwardOverview from "~/client/components/admin/awards/AdminAwardOverview";
import AdminAwardCategories from "~/client/components/admin/awards/AdminAwardCategories";
import AdminAwardVotes from "~/client/components/admin/awards/AdminAwardVotes";

//Actions
import { fetchAwards } from "../../actions/awardActions";

class AdminAwardPage extends Component {
	constructor(props) {
		super(props);
		const { awardsList, fetchAwards } = props;

		if (!awardsList) {
			fetchAwards();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, awardsList } = nextProps;
		const { _id } = match.params;
		const newState = { isLoading: false, isNew: _id === "new" };

		if (!awardsList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Award By Id
		if (!newState.isNew) {
			newState.award = awardsList[_id] || false;
		}

		return newState;
	}

	getSubmenu() {
		const { isNew, award } = this.state;
		if (!isNew) {
			const submenuItems = [
				{ label: "Overview", slug: "", isExact: true },
				{ label: "Categories", slug: "categories" },
				{ label: "Voting", slug: "voting" }
			];

			return (
				<SubMenu items={submenuItems} rootUrl={`/admin/awards/${award._id}/`} key="menu" />
			);
		}
	}

	getTitle() {
		const { award } = this.state;
		if (award) {
			return `${award.year} ${award.name ? ` - ${award.name}` : ""}`;
		} else {
			return "Add Awards";
		}
	}

	getContent() {
		const { match } = this.props;
		const { isNew } = this.state;

		if (isNew) {
			return <AdminAwardOverview match={match} />;
		} else {
			return (
				<div>
					<HelmetBuilder title={this.getTitle()} />
					<Switch>
						<Route path="/admin/awards/:_id/voting/" component={AdminAwardVotes} />
						<Route
							path="/admin/awards/:_id/categories/:categoryId"
							component={AdminAwardCategories}
						/>
						<Route
							path="/admin/awards/:_id/categories"
							component={AdminAwardCategories}
						/>
						<Route path="/admin/awards/:_id" exact component={AdminAwardOverview} />
						<Route path="/" component={NotFoundPage} />
					</Switch>
				</div>
			);
		}
	}

	render() {
		const { isNew, award, isLoading } = this.state;
		if (isLoading) {
			return <LoadingPage />;
		} else if (!isNew && !award) {
			return <NotFoundPage />;
		} else {
			return (
				<div className="admin-award-page admin-page">
					<section className="page-header">
						<div className="container">
							<Link className="nav-card card" to="/admin/awards/">
								↩ Return to awards list
							</Link>
						</div>
						<h1>{this.getTitle()}</h1>
						<div className="container">{this.getSubmenu()}</div>
					</section>
					<section className="form">
						<ErrorBoundary>{this.getContent()}</ErrorBoundary>
					</section>
				</div>
			);
		}
	}
}

function mapStateToProps({ awards }) {
	const { awardsList } = awards;
	return { awardsList };
}
export default connect(
	mapStateToProps,
	{ fetchAwards }
)(AdminAwardPage);
