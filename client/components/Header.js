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
		const { deviceType } = this.props;
		const urls = {};
		switch (deviceType) {
			case "android":
				urls.Twitter = "twitter://user?screen_name=GiantsFanzine";
				urls.Facebook = "fb://profile/699949263420705";
				urls.Instagram = "https://www.instagram.com/GiantsFanzine";
				break;
			case "ios":
				urls.Twitter = "twitter://user?screen_name=GiantsFanzine";
				urls.Facebook = "fb://profile/699949263420705";
				urls.Instagram = "https://www.instagram.com/GiantsFanzine";
				break;
			default:
				urls.Twitter = "https://www.twitter.com/GiantsFanzine";
				urls.Facebook = "https://www.facebook.com/GiantsFanzine";
				urls.Instagram = "https://www.instagram.com/GiantsFanzine";
				break;
		}
		const icons = ["Twitter", "Facebook", "Instagram"].map(social => {
			return (
				<a href={urls[social]} target="_system" rel="noopener noreferrer" key={social}>
					<img
						src={`${layoutImagePath}icons/${social.toLowerCase()}.svg`}
						alt={`${social} Logo`}
						title={`Follow us on ${social}`}
					/>
				</a>
			);
		});
		return <li className="nav-section social">{icons}</li>;
	}

	generateNavMenu() {
		const newsSubmenu = _.chain(newsCategories)
			.keyBy("name")
			.mapValues("slug")
			.value();

		const navMenu = [
			{
				header: "Home",
				headerLink: "/"
			},
			{
				header: "Games",
				headerLink: "/games/fixtures",
				subMenuRootLink: "/games/",
				headerClickable: false,
				subMenu: {
					Fixtures: "fixtures",
					Results: "results"
				}
			},
			{
				header: "squads",
				headerLink: "/squads/"
			},
			{
				header: "News",
				headerLink: "/news/category/all",
				subMenuRootLink: "/news/category/",
				subMenu: { All: "all", ...newsSubmenu }
			}
		];
		if (this.props.auth) {
			navMenu.push(
				{
					header: "Admin",
					headerLink: "/admin",
					subMenuRootLink: "/admin/",
					subMenu: {
						Teams: "teams",
						Games: "games"
					}
				},
				{
					header: "Logout",
					headerLink: "/auth/logout"
				}
			);
		}

		return _.map(navMenu, section => {
			const activeClassName = "active-nav-link";
			const sectionHeader = (
				<NavLink
					activeClassName={activeClassName}
					to={section.headerLink}
					className={"nav-menu-header" + (section.subMenu ? " with-submenu" : "")}
					onClick={() => this.setState({ showMobileNav: false })}
					exact={section.headerLink === "/"}
				>
					{section.header}
				</NavLink>
			);
			let sectionBody;

			if (section.subMenu) {
				const sectionBodyContent = _.map(section.subMenu, (link, name) => {
					return (
						<li key={section.header + name}>
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
	}

	render() {
		return (
			<header>
				<div className="container">
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
							src="https://www.giantsfanzine.co.uk/resources/images/4fs/logos/long-no-tagline.svg"
							alt="Fee Fi Fo Fum Logo"
						/>
					</Link>
					<nav className={this.state.showMobileNav ? "active" : null}>
						<div
							className="mobile-nav-background"
							onClick={() => this.setState({ showMobileNav: false })}
						/>
						<ul className="root-nav-list">
							{this.generateNavMenu()}
							{this.getSocial()}
						</ul>
					</nav>
				</div>
			</header>
		);
	}
}

function mapStateToProps({ auth, config }) {
	const { deviceType } = config;
	return { auth, deviceType };
}

export default withRouter(connect(mapStateToProps)(Header));
