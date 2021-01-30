import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, NavLink, withRouter } from "react-router-dom";
import newsCategories from "../../constants/newsCategories";
import { getYearsWithResults } from "~/helpers/gameHelper";

class Header extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showMobileNav: false
		};
	}

	getSocial() {
		const { bucketPaths, site_social } = this.props;
		return ["Twitter", "Facebook", "Instagram"].map(social => {
			return (
				<a
					href={`https://www.${social.toLowerCase()}.com/${site_social}`}
					target="_blank"
					rel="noopener noreferrer"
					key={social}
				>
					<img
						src={`${bucketPaths.images.layout}icons/${social.toLowerCase()}.svg`}
						alt={`${social} Logo`}
						title={`Follow us on ${social}`}
					/>
				</a>
			);
		});
	}

	generateNavMenu() {
		const {
			localTeam,
			fullTeams,
			authUser,
			currentAwards,
			sites,
			baseUrl,
			location,
			gameYears
		} = this.props;
		const navMenus = [
			[
				{
					header: "Home",
					headerLink: "/",
					exactNav: true
				},
				{
					header: "Games",
					headerLink: "/games/",
					subMenuRootLink: "/games/",
					headerClickable: false,
					subMenu: {
						Fixtures: "fixtures",
						Results: "results"
					}
				},
				{
					header: "News",
					headerLink: "/news/",
					subMenuRootLink: "/news/category/",
					subMenu: _.chain(newsCategories)
						.keyBy("name")
						.mapValues("slug")
						.value()
				},
				{
					header: "Seasons",
					headerLink: "/seasons/"
				},
				{
					header: "Squads",
					headerLink: "/squads/"
				}
			]
		];

		if (currentAwards) {
			navMenus[0].push({ header: "Awards", headerLink: "/awards" });
		}

		if (authUser) {
			const localTeamName = fullTeams[localTeam].name.short;
			const adminMenu = [
				{
					header: "Admin",
					headerLink: "/admin",
					exactNav: true
				},
				{
					header: "Games",
					headerLink: "/admin/games",
					subMenuRootLink: "/admin/",
					subMenu: {
						[`${localTeamName} Fixtures`]: "games/fixtures",
						[`${localTeamName} Results`]: `games/${getYearsWithResults(gameYears)[0]}`,
						Neutral: "neutralGames"
					}
				},
				{
					header: "Locations",
					headerLink: "/admin/grounds",
					subMenuRootLink: "/admin/",
					subMenu: {
						Cities: "cities",
						Countries: "countries",
						Grounds: "grounds"
					}
				},
				{
					header: "News",
					headerLink: "/admin/news"
				},
				{
					header: "People",
					headerLink: "/admin/people"
				},
				{
					header: "Seasons",
					subMenuRootLink: "/admin/",
					subMenu: {
						Awards: "awards",
						Competitions: "competitions"
					}
				},
				{
					header: "Social Thread",
					headerLink: "/admin/social-thread"
				},
				{
					header: "Teams",
					headerLink: "/admin/teams",
					subMenuRootLink: "/admin/",
					subMenu: {
						Selectors: "team-selectors",
						Teams: "teams",
						Types: "team-types"
					}
				},
				{
					header: "Logout",
					headerLink: "/admin/logout"
				}
			];

			if (authUser.isAdmin) {
				adminMenu.push({
					header: "Settings",
					subMenuRootLink: "/admin/settings/",
					subMenu: {
						Branding: "branding",
						Broadcasters: "broadcasters",
						Errors: "errors",
						Facebook: "facebook",
						"Privacy Policy": "privacy-policy",
						Social: "social",
						Sponsors: "sponsors",
						Twitter: "twitter",
						Users: "users"
					}
				});
			} else {
				adminMenu.push({
					header: "Account",
					headerLink: `/admin/users/${authUser._id}`
				});
			}

			//Add "View On" sites
			const viewOnSites = {};
			for (const siteType in sites) {
				if (sites[siteType] && sites[siteType] !== baseUrl) {
					viewOnSites[siteType] = sites[siteType] + location.pathname;
				}
			}

			if (_.values(viewOnSites).length) {
				adminMenu.push({
					header: "View On",
					externalLink: true,
					subMenu: viewOnSites
				});
			}

			navMenus.push(adminMenu);
		}

		return navMenus.map((navMenu, i) => {
			const items = _.sortBy(navMenu, s => {
				switch (s.header) {
					case "Logout":
					case "View On":
						return "ZZZZZZ" + s.header;
					case "Home":
					case "Admin":
						return -1;
					default:
						return s.header;
				}
			}).map(section => {
				const activeClassName = "active-nav-link";
				const headerClassName = `nav-menu-header ${section.subMenu ? "with-submenu" : ""}`;

				let sectionHeader;
				if (section.headerLink) {
					if (section.externalLink) {
						sectionHeader = (
							<a href={section.headerLink} target="_blank" rel="noopener noreferrer">
								{section.header}
							</a>
						);
					} else {
						sectionHeader = (
							<NavLink
								activeClassName={activeClassName}
								className={headerClassName}
								to={section.headerLink}
								onClick={() => this.setState({ showMobileNav: false })}
								exact={section.exactNav}
							>
								{section.header}
							</NavLink>
						);
					}
				} else {
					sectionHeader = <div className={headerClassName}>{section.header}</div>;
				}

				let sectionBody;

				if (section.subMenu) {
					const sectionBodyContent = _.map(section.subMenu, (link, name) => {
						let linkElement;
						if (section.externalLink) {
							linkElement = (
								<a href={link} target="_blank" rel="noopener noreferrer">
									{name}
								</a>
							);
						} else {
							linkElement = (
								<NavLink
									activeClassName={activeClassName}
									to={section.subMenuRootLink + link}
									onClick={() => this.setState({ showMobileNav: false })}
								>
									{name}
								</NavLink>
							);
						}
						return (
							<li key={section.header + name} className="submenu">
								{linkElement}
							</li>
						);
					});
					sectionBody = <ul>{sectionBodyContent}</ul>;
				}

				return (
					<li className="nav-section" key={section.header + "-header"}>
						{sectionHeader}
						{sectionBody}
					</li>
				);
			});

			return (
				<div className={`nav-wrapper ${i == 1 ? "admin" : "main"}`} key={i}>
					<div className="container no-mobile-tablet-padding">
						<ul className={`root-nav-list`}>{items}</ul>
					</div>
				</div>
			);
		});
	}

	handleLongpressStart() {
		this.buttonPressTimer = setTimeout(() => (window.location.href = "/admin"), 2000);
	}

	handleLongpressRelease() {
		clearTimeout(this.buttonPressTimer);
	}

	render() {
		const { database, environment, site_header_logo, site_name } = this.props;
		const { bucketPaths } = this.props;
		const social = this.getSocial();

		//Render classname based on environment
		let headerClass = "";

		if (database === "test" && environment === "production") {
			//Staged test website
			headerClass = "staging";
		} else if (database === "test" && environment === "development") {
			//Local dev server
			headerClass = "local-dev";
		} else if (database === "live" && environment === "development") {
			//Local dev server hooked up to live db
			headerClass = "local-dev-on-live";
		}

		return (
			<header className={headerClass}>
				<div className="container top-bar">
					<div
						className="nav-hamburger"
						onClick={() => this.setState({ showMobileNav: true })}
					>
						<span />
						<span />
						<span />
					</div>
					<Link to="/">
						<img
							className="main-header-logo"
							src={`${bucketPaths.images.layout}branding/${site_header_logo}`}
							alt={`${site_name} Logo`}
						/>
					</Link>
					<div className={`social desktop-only`}>{social}</div>
				</div>
				<nav
					className={this.state.showMobileNav ? "active" : null}
					onTouchStart={() => this.handleLongpressStart()}
					onTouchEnd={() => this.handleLongpressRelease()}
				>
					{this.generateNavMenu()}
					<div className={`nav-section social mobile-only`}>{social}</div>
				</nav>
				<div
					className="mobile-nav-background"
					onClick={() => this.setState({ showMobileNav: false })}
				/>
			</header>
		);
	}
}

function mapStateToProps({ awards, config, games, teams }) {
	const { currentAwards } = awards;
	const {
		authUser,
		database,
		environment,
		localTeam,
		bucketPaths,
		site_social,
		site_header_logo,
		site_name,
		sites,
		baseUrl
	} = config;
	const { gameYears } = games;
	const { fullTeams } = teams;
	return {
		currentAwards,
		database,
		environment,
		authUser,
		bucketPaths,
		site_social,
		site_header_logo,
		site_name,
		localTeam,
		gameYears,
		fullTeams,
		sites,
		baseUrl
	};
}

export default withRouter(connect(mapStateToProps)(Header));
