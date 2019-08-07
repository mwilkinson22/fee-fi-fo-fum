import React, { Component } from "react";
import { connect } from "react-redux";
import Login from "./Login";
import { Switch, Route } from "react-router-dom";

//Pages
import NotFoundPage from "../../pages/NotFoundPage";
import Logout from "./Logout";

import AdminCityList from "../../pages/AdminCityList";
import AdminCityPage from "../../pages/AdminCityPage";

import AdminCountryList from "../../pages/AdminCountryList";
import AdminCountryPage from "../../pages/AdminCountryPage";

import AdminNeutralGameList from "../../pages/AdminNeutralGameList";
import AdminNeutralGamePage from "../../pages/AdminNeutralGamePage";

import AdminGameList from "../../pages/AdminGameList";
import AdminGamePage from "../../pages/AdminGamePage";
import AdminNewGamePage from "../../pages/AdminNewGamePage";

import AdminGroundList from "../../pages/AdminGroundList";
import AdminGroundPage from "../../pages/AdminGroundPage";

import AdminNewsList from "../../pages/AdminNewsList";
import AdminNewsPostPage from "../../pages/AdminNewsPostPage";

import AdminSponsorList from "../../pages/AdminSponsorList";
import AdminSponsorPage from "../../pages/AdminSponsorPage";

import AdminTeamList from "../../pages/AdminTeamList";
import AdminTeamPage from "../../pages/AdminTeamPage";

class AdminRouter extends Component {
	render() {
		if (this.props.authUser) {
			return (
				<Switch>
					<Route path="/admin/neutralGame/:id" component={AdminNeutralGamePage} />
					<Route
						path="/admin/neutralGames/:year/:teamType"
						component={AdminNeutralGameList}
					/>
					<Route path="/admin/neutralGames/:year" component={AdminNeutralGameList} />
					<Route path="/admin/neutralGames/" component={AdminNeutralGameList} />

					<Route path="/admin/games/:year/:teamType" exact component={AdminGameList} />
					<Route path="/admin/games/:year/" exact component={AdminGameList} />
					<Route path="/admin/games/" exact component={AdminGameList} />

					<Route path="/admin/game/new" component={AdminNewGamePage} />
					<Route path="/admin/game/:slug" component={AdminGamePage} />
					<Route path="/admin/games/:year/:teamType" exact component={AdminGameList} />
					<Route path="/admin/games/:year/" exact component={AdminGameList} />
					<Route path="/admin/games/" exact component={AdminGameList} />

					<Route path="/admin/cities/new" exact component={AdminCityPage} />
					<Route path="/admin/cities/:slug" exact component={AdminCityPage} />
					<Route path="/admin/cities" exact component={AdminCityList} />

					<Route path="/admin/countries/new" exact component={AdminCountryPage} />
					<Route path="/admin/countries/:slug" exact component={AdminCountryPage} />
					<Route path="/admin/countries" exact component={AdminCountryList} />

					<Route path="/admin/grounds/new" component={AdminGroundPage} />
					<Route path="/admin/grounds/:slug" component={AdminGroundPage} />
					<Route path="/admin/grounds" exact component={AdminGroundList} />

					<Route path="/admin/news/post/new" component={AdminNewsPostPage} />
					<Route path="/admin/news/post/:slug" component={AdminNewsPostPage} />
					<Route path="/admin/news/" exact component={AdminNewsList} />

					<Route path="/admin/sponsors/new" exact component={AdminSponsorPage} />
					<Route path="/admin/sponsors/:id" exact component={AdminSponsorPage} />
					<Route path="/admin/sponsors/" exact component={AdminSponsorList} />

					<Route path="/admin/teams/:slug" component={AdminTeamPage} />
					<Route path="/admin/teams/" exact component={AdminTeamList} />

					<Route path="/admin/logout" component={Logout} />
					<Route path="/admin" component={NotFoundPage} />
				</Switch>
			);
		} else {
			return <Login />;
		}
	}
}
function mapStateToProps({ config }) {
	const { authUser } = config;
	return { authUser };
}

export default { component: connect(mapStateToProps)(AdminRouter) };
