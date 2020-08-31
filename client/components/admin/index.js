import React, { Component } from "react";
import { connect } from "react-redux";
import Login from "./Login";
import { Switch, Route } from "react-router-dom";
import { ToastContainer, Slide } from "react-toastify";

//Pages
import ErrorBoundary from "../ErrorBoundary";
import NotFoundPage from "../../pages/NotFoundPage";
import Logout from "./Logout";

import AdminDashboard from "../../pages/admin/AdminDashboard";

import AdminAwardPage from "../../pages/admin/AdminAwardPage";
import AdminAwardList from "../../pages/admin/AdminAwardList";

import AdminBrandingPage from "../../pages/admin/AdminBrandingPage";

import AdminBroadcasterPage from "../../pages/admin/AdminBroadcasterPage";
import AdminBroadcasterList from "../../pages/admin/AdminBroadcasterList";

import AdminCityList from "../../pages/admin/AdminCityList";
import AdminCityPage from "../../pages/admin/AdminCityPage";

import AdminCompetitionList from "../../pages/admin/AdminCompetitionList";
import AdminCompetitionPage from "../../pages/admin/AdminCompetitionPage";
import AdminCompetitionSegmentPage from "../../pages/admin/AdminCompetitionSegmentPage";
import AdminCompetitionInstancePage from "../../pages/admin/AdminCompetitionInstancePage";

import AdminCountryList from "../../pages/admin/AdminCountryList";
import AdminCountryPage from "../../pages/admin/AdminCountryPage";

import AdminErrorPage from "../../pages/admin/AdminErrorPage";

import AdminNeutralGameList from "../../pages/admin/AdminNeutralGameList";
import AdminNeutralGamePage from "../../pages/admin/AdminNeutralGamePage";

import GameList from "../../pages/GameList";
import AdminGamePage from "../../pages/admin/AdminGamePage";
import AdminFixtureListImagePage from "../../pages/admin/AdminFixtureListImagePage";

import AdminGroundList from "../../pages/admin/AdminGroundList";
import AdminGroundPage from "../../pages/admin/AdminGroundPage";

import AdminNewsList from "../../pages/admin/AdminNewsList";
import AdminNewsPostPage from "../../pages/admin/AdminNewsPostPage";

import AdminPersonPage from "../../pages/admin/AdminPersonPage";
import AdminPersonList from "../../pages/admin/AdminPersonList";

import AdminSocialList from "../../pages/admin/AdminSocialList";
import AdminSocialPage from "../../pages/admin/AdminSocialPage";

import AdminSponsorList from "../../pages/admin/AdminSponsorList";
import AdminSponsorPage from "../../pages/admin/AdminSponsorPage";

import AdminTeamList from "../../pages/admin/AdminTeamList";
import AdminTeamPage from "../../pages/admin/AdminTeamPage";

import AdminTeamSelectorList from "../../pages/admin/AdminTeamSelectorList";
import AdminTeamSelectorPage from "../../pages/admin/AdminTeamSelectorPage";

import AdminTeamTypeList from "../../pages/admin/AdminTeamTypeList";
import AdminTeamTypePage from "../../pages/admin/AdminTeamTypePage";

import AdminFacebookAppPage from "../../pages/admin/AdminFacebookAppPage";
import AdminTwitterAppPage from "../../pages/admin/AdminTwitterAppPage";

import AdminUserList from "../../pages/admin/AdminUserList";
import AdminUserPage from "../../pages/admin/AdminUserPage";

class AdminRouter extends Component {
	render() {
		let content;
		if (this.props.authUser) {
			content = (
				<ErrorBoundary>
					<Switch>
						<Route path="/admin/awards/:_id" component={AdminAwardPage} />
						<Route path="/admin/awards" exact component={AdminAwardList} />

						<Route
							path="/admin/settings/branding/"
							exact
							component={AdminBrandingPage}
						/>
						<Route
							path="/admin/settings/broadcasters/new"
							exact
							component={AdminBroadcasterPage}
						/>
						<Route
							path="/admin/settings/broadcasters/:_id"
							exact
							component={AdminBroadcasterPage}
						/>
						<Route
							path="/admin/settings/broadcasters"
							exact
							component={AdminBroadcasterList}
						/>

						<Route path="/admin/cities/new" exact component={AdminCityPage} />
						<Route path="/admin/cities/:_id" exact component={AdminCityPage} />
						<Route path="/admin/cities" exact component={AdminCityList} />

						<Route
							path="/admin/competitions/segments/:segmentId/instances/new"
							component={AdminCompetitionInstancePage}
						/>
						<Route
							path="/admin/competitions/segments/:segmentId/instances/:instanceId"
							component={AdminCompetitionInstancePage}
						/>
						<Route
							path="/admin/competitions/segments/new/:parent"
							exact
							component={AdminCompetitionSegmentPage}
						/>
						<Route
							path="/admin/competitions/segments/:_id"
							component={AdminCompetitionSegmentPage}
						/>
						<Route path="/admin/competitions/new" component={AdminCompetitionPage} />
						<Route path="/admin/competitions/:_id" component={AdminCompetitionPage} />
						<Route path="/admin/competitions" exact component={AdminCompetitionList} />

						<Route path="/admin/countries/new" exact component={AdminCountryPage} />
						<Route path="/admin/countries/:_id" exact component={AdminCountryPage} />
						<Route path="/admin/countries" exact component={AdminCountryList} />

						<Route path="/admin/game/new" component={AdminGamePage} />
						<Route path="/admin/game/:_id" component={AdminGamePage} />
						<Route
							path="/admin/games/fixture-list-image"
							exact
							component={AdminFixtureListImagePage}
						/>
						<Route
							path="/admin/games/:year/:teamType"
							exact
							component={GameList.component}
						/>
						<Route path="/admin/games/:year/" exact component={GameList.component} />
						<Route path="/admin/games/" exact component={GameList.component} />

						<Route path="/admin/grounds/new" component={AdminGroundPage} />
						<Route path="/admin/grounds/:_id" component={AdminGroundPage} />
						<Route path="/admin/grounds" exact component={AdminGroundList} />

						<Route path="/admin/news/post/new" component={AdminNewsPostPage} />
						<Route path="/admin/news/post/:_id" component={AdminNewsPostPage} />
						<Route path="/admin/news/" exact component={AdminNewsList} />

						<Route path="/admin/neutralGame/new" component={AdminNeutralGamePage} />
						<Route path="/admin/neutralGame/:_id" component={AdminNeutralGamePage} />
						<Route
							path="/admin/neutralGames/:year/:teamType"
							component={AdminNeutralGameList}
						/>
						<Route path="/admin/neutralGames/:year" component={AdminNeutralGameList} />
						<Route path="/admin/neutralGames/" component={AdminNeutralGameList} />

						<Route path="/admin/people/new" exact component={AdminPersonPage} />
						<Route path="/admin/people/:_id" component={AdminPersonPage} />
						<Route path="/admin/people/" exact component={AdminPersonList} />

						<Route path="/admin/settings/errors" component={AdminErrorPage} />

						<Route
							path="/admin/settings/social/new"
							exact
							component={AdminSocialPage}
						/>
						<Route
							path="/admin/settings/social/:_id"
							exact
							component={AdminSocialPage}
						/>
						<Route path="/admin/settings/social/" exact component={AdminSocialList} />

						<Route
							path="/admin/settings/facebook/"
							exact
							component={AdminFacebookAppPage}
						/>

						<Route
							path="/admin/settings/twitter/"
							exact
							component={AdminTwitterAppPage}
						/>

						<Route path="/admin/settings/users/new" component={AdminUserPage} />
						<Route path="/admin/settings/users/:_id" component={AdminUserPage} />
						<Route path="/admin/settings/users/" exact component={AdminUserList} />

						<Route path="/admin/sponsors/new" exact component={AdminSponsorPage} />
						<Route path="/admin/sponsors/:_id" exact component={AdminSponsorPage} />
						<Route path="/admin/sponsors/" exact component={AdminSponsorList} />

						<Route path="/admin/teams/new" component={AdminTeamPage} />
						<Route path="/admin/teams/:_id" component={AdminTeamPage} />
						<Route path="/admin/teams/" exact component={AdminTeamList} />

						<Route path="/admin/team-selectors/new" component={AdminTeamSelectorPage} />
						<Route
							path="/admin/team-selectors/:_id"
							component={AdminTeamSelectorPage}
						/>
						<Route path="/admin/team-selectors/" component={AdminTeamSelectorList} />

						<Route path="/admin/team-types/new" exact component={AdminTeamTypePage} />
						<Route path="/admin/team-types/:_id" exact component={AdminTeamTypePage} />
						<Route path="/admin/team-types/" exact component={AdminTeamTypeList} />

						<Route path="/admin/logout" component={Logout} />
						<Route path="/admin" exact component={AdminDashboard} />
						<Route path="/admin" component={NotFoundPage} />
					</Switch>
				</ErrorBoundary>
			);
		} else {
			content = <Login />;
		}
		return (
			<div>
				{content}
				<ToastContainer
					position="bottom-right"
					pauseOnFocusLoss={false}
					className="toast-container"
					transition={Slide}
				/>
			</div>
		);
	}
}
function mapStateToProps({ config }) {
	const { authUser } = config;
	return { authUser };
}

export default connect(mapStateToProps)(AdminRouter);
