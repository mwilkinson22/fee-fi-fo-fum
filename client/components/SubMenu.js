//Modules
import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";

class SubMenu extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		let { rootUrl } = nextProps;

		//Ensure rootUrl ends with a forward slash
		if (rootUrl.slice(-1) !== "/") {
			rootUrl += "/";
		}

		return {
			...nextProps,
			rootUrl
		};
	}

	render() {
		const { className, exactByDefault, items, rootUrl } = this.state;

		const list = items.map(({ className, label, slug, isExact, isDummy }) => {
			return (
				<NavLink
					key={slug}
					exact={isExact != null ? isExact : exactByDefault}
					to={`${rootUrl}${slug}`}
					activeClassName="active"
					className={`${isDummy ? "hidden" : ""} ${className || ""}`}
				>
					{label}
				</NavLink>
			);
		});

		return <div className={`sub-menu ${className}`}>{list}</div>;
	}
}

SubMenu.propTypes = {
	className: PropTypes.string,
	exactByDefault: PropTypes.bool,
	items: PropTypes.arrayOf(
		PropTypes.shape({
			className: PropTypes.string,
			label: PropTypes.string.isRequired,
			isDummy: PropTypes.bool,
			isExact: PropTypes.bool,
			slug: PropTypes.string.isRequired
		})
	).isRequired,
	rootUrl: PropTypes.string
};

SubMenu.defaultProps = {
	className: "",
	exactByDefault: false,
	rootUrl: "/"
};

export default SubMenu;
