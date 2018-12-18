import React, { Component } from "react";
import { connect } from "react-redux";
import { NavLink, withRouter } from "react-router-dom";
import _ from "lodash";

class Header extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showMobileNav: false
		};
	}

	generateNavMenu() {
		const navMenu = [
			{
				header: "Home",
				headerLink: "/"
			},
			{
				header: "Games",
				headerLink: "/games",
				subMenu: {
					Fixtures: "/fixtures",
					Results: "/results"
				}
			},
			{
				header: "Teams",
				headerLink: "/teams"
			},
			{
				header: "News",
				headerLink: "/news",
				subMenu: {
					Previews: "/previews",
					Recaps: "/recaps",
					Features: "/features",
					Opinions: "/opinions"
				}
			}
		];

		if (this.props.auth) {
			navMenu.push({
				header: "Admin",
				headerLink: "/admin",
				subMenu: {
					Teams: "/teams",
					Games: "/games"
				}
			});
		}

		return _.map(navMenu, section => {
			const activeClassName = "active-nav-link";
			const sectionHeader = (
				<NavLink
					activeClassName={activeClassName}
					to={section.headerLink}
					className="nav-menu-header"
					children={section.header}
					onClick={() => this.setState({ showMobileNav: false })}
					exact={section.headerLink === "/"}
				/>
			);
			let sectionBody;

			if (section.subMenu) {
				const sectionBodyContent = _.map(section.subMenu, (link, name) => {
					return (
						<li key={section.header + name}>
							<NavLink
								activeClassName={activeClassName}
								to={section.headerLink + link}
								children={name}
								onClick={() => this.setState({ showMobileNav: false })}
							/>
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
					<span>Logo goes here</span>
					<nav className={this.state.showMobileNav ? "active" : null}>
						<div
							className="mobile-nav-background"
							onClick={() => this.setState({ showMobileNav: false })}
						/>
						<ul className="root-nav-list">{this.generateNavMenu()}</ul>
					</nav>
				</div>
			</header>
		);
	}
}

function mapStateToProps({ auth }) {
	return { auth };
}

export default withRouter(connect(mapStateToProps)(Header));
