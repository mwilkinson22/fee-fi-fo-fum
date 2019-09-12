import React, { Component } from "react";
import { connect } from "react-redux";
import Login from "./Login";
import { Switch, Route } from "react-router-dom";
import { ToastContainer, Slide } from "react-toastify";

//Pages
import NotFoundPage from "../../pages/NotFoundPage";
import Logout from "./Logout";

import AdminCityList from "../../pages/admin/AdminCityList";
import AdminCityPage from "../../pages/admin/AdminCityPage";

import AdminCompetitionList from "../../pages/admin/AdminCompetitionList";
import AdminCompetitionPage from "../../pages/admin/AdminCompetitionPage";
import AdminCompetitionSegmentPage from "../../pages/admin/AdminCompetitionSegmentPage";

import AdminCountryList from "../../pages/admin/AdminCountryList";
import AdminCountryPage from "../../pages/admin/AdminCountryPage";

import AdminNeutralGameList from "../../pages/admin/AdminNeutralGameList";
import AdminNeutralGamePage from "../../pages/admin/AdminNeutralGamePage";

import GameList from "../../pages/GameList";
import AdminGamePage from "../../pages/admin/AdminGamePage";
import AdminNewGamePage from "../../pages/admin/AdminNewGamePage";

import AdminGroundList from "../../pages/admin/AdminGroundList";
import AdminGroundPage from "../../pages/admin/AdminGroundPage";

import AdminNewsList from "../../pages/admin/AdminNewsList";
import AdminNewsPostPage from "../../pages/admin/AdminNewsPostPage";

import AdminNewPersonPage from "../../pages/admin/AdminNewPersonPage";
import AdminPersonPage from "../../pages/admin/AdminPersonPage";
import AdminPersonList from "../../pages/admin/AdminPersonList";

import AdminSocialList from "../../pages/admin/AdminSocialList";
import AdminSocialPage from "../../pages/admin/AdminSocialPage";

import AdminSponsorList from "../../pages/admin/AdminSponsorList";
import AdminSponsorPage from "../../pages/admin/AdminSponsorPage";

import AdminTeamList from "../../pages/admin/AdminTeamList";
import AdminTeamPage from "../../pages/admin/AdminTeamPage";
import AdminNewTeamPage from "../../pages/admin/AdminNewTeamPage";

class AdminRouter extends Component {
	render() {
		let content;
		if (this.props.authUser) {
			content = (
				<Switch>
					<Route path="/admin/neutralGame/:id" component={AdminNeutralGamePage} />
					<Route
						path="/admin/neutralGames/:year/:teamType"
						component={AdminNeutralGameList}
					/>
					<Route path="/admin/neutralGames/:year" component={AdminNeutralGameList} />
					<Route path="/admin/neutralGames/" component={AdminNeutralGameList} />

					<Route path="/admin/game/new" component={AdminNewGamePage} />
					<Route path="/admin/game/:slug" component={AdminGamePage} />
					<Route
						path="/admin/games/:year/:teamType"
						exact
						component={GameList.component}
					/>
					<Route path="/admin/games/:year/" exact component={GameList.component} />
					<Route path="/admin/games/" exact component={GameList.component} />

					<Route path="/admin/cities/new" exact component={AdminCityPage} />
					<Route path="/admin/cities/:slug" exact component={AdminCityPage} />
					<Route path="/admin/cities" exact component={AdminCityList} />

					<Route
						path="/admin/competitions/segments/new/:parent"
						exact
						component={AdminCompetitionSegmentPage}
					/>
					<Route
						path="/admin/competitions/segments/:_id"
						exact
						component={AdminCompetitionSegmentPage}
					/>
					<Route path="/admin/competitions/:_id" exact component={AdminCompetitionPage} />
					<Route path="/admin/competitions" exact component={AdminCompetitionList} />

					<Route path="/admin/countries/new" exact component={AdminCountryPage} />
					<Route path="/admin/countries/:slug" exact component={AdminCountryPage} />
					<Route path="/admin/countries" exact component={AdminCountryList} />

					<Route path="/admin/grounds/new" component={AdminGroundPage} />
					<Route path="/admin/grounds/:_id" component={AdminGroundPage} />
					<Route path="/admin/grounds" exact component={AdminGroundList} />

					<Route path="/admin/news/post/new" component={AdminNewsPostPage} />
					<Route path="/admin/news/post/:slug" component={AdminNewsPostPage} />
					<Route path="/admin/news/" exact component={AdminNewsList} />

					<Route path="/admin/people/new" exact component={AdminNewPersonPage} />
					<Route path="/admin/people/:slug" component={AdminPersonPage} />
					<Route path="/admin/people/" exact component={AdminPersonList} />

					<Route path="/admin/social/new" exact component={AdminSocialPage} />
					<Route path="/admin/social/:id" exact component={AdminSocialPage} />
					<Route path="/admin/social/" exact component={AdminSocialList} />

					<Route path="/admin/sponsors/new" exact component={AdminSponsorPage} />
					<Route path="/admin/sponsors/:id" exact component={AdminSponsorPage} />
					<Route path="/admin/sponsors/" exact component={AdminSponsorList} />

					<Route path="/admin/teams/new" component={AdminNewTeamPage} />
					<Route path="/admin/teams/:_id" component={AdminTeamPage} />
					<Route path="/admin/teams/" exact component={AdminTeamList} />

					<Route path="/admin/logout" component={Logout} />
					<Route path="/admin" component={NotFoundPage} />
				</Switch>
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

export default { component: connect(mapStateToProps)(AdminRouter) };
