import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, NavLink, withRouter } from "react-router-dom";
import _ from "lodash";
import newsCategories from "../../constants/newsCategories";
import { layoutImagePath } from "../extPaths";

class Header extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showMobileNav: false
		};
	}

	getSocial() {
		return ["Twitter", "Facebook", "Instagram"].map(social => {
			return (
				<a
					href={`https://www.${social.toLowerCase()}.com/FeeFiFoFumRL`}
					target="_blank"
					rel="noopener noreferrer"
					key={social}
				>
					<img
						src={`${layoutImagePath}icons/${social.toLowerCase()}.svg`}
						alt={`${social} Logo`}
						title={`Follow us on ${social}`}
					/>
				</a>
			);
		});
	}

	generateNavMenu() {
		const { localTeam, fullTeams, authUser, currentAwards } = this.props;
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
			const adminMenu = [
				{
					header: "Admin",
					headerLink: "/admin",
					exactNav: true
				},
				{
					header: "Awards",
					headerLink: "/admin/awards"
				},
				{
					header: "Competitions",
					headerLink: "/admin/competitions"
				},
				{
					header: "Games",
					headerLink: "/admin/games",
					subMenuRootLink: "/admin/",
					subMenu: {
						[fullTeams[localTeam].name.short]: "games",
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
					header: "Sponsors",
					headerLink: "/admin/sponsors"
				},
				{
					header: "Teams",
					headerLink: "/admin/teams"
				},
				{
					header: "Team Selectors",
					headerLink: "/admin/team-selectors"
				},
				{
					header: "Team Types",
					headerLink: "/admin/team-types"
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
						Errors: "errors",
						Social: "social",
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

			navMenus.push(adminMenu);
		}

		return navMenus.map((navMenu, i) => {
			const items = _.sortBy(navMenu, s => {
				switch (s.header) {
					case "Logout":
						return "ZZZZZZ";
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
				} else {
					sectionHeader = <div className={headerClassName}>{section.header}</div>;
				}

				let sectionBody;

				if (section.subMenu) {
					const sectionBodyContent = _.map(section.subMenu, (link, name) => {
						return (
							<li key={section.header + name} className="submenu">
								<NavLink
									activeClassName={activeClassName}
									to={section.subMenuRootLink + link}
									onClick={() => this.setState({ showMobileNav: false })}
								>
									{name}
								</NavLink>
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
					<div className="container">
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
		const { database, environment } = this.props;
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
							src={`${layoutImagePath}branding/long-no-tagline.png`}
							alt="Fee Fi Fo Fum Logo"
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

function mapStateToProps({ awards, config, teams }) {
	const { currentAwards } = awards;
	const { authUser, database, environment, localTeam } = config;
	const { fullTeams } = teams;
	return { currentAwards, database, environment, authUser, localTeam, fullTeams };
}

export default withRouter(connect(mapStateToProps)(Header));
