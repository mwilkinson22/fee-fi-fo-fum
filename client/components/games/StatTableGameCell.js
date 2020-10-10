//Modules
import React, { Component } from "react";
import { Link } from "react-router-dom";

//Components
import TeamImage from "../teams/TeamImage";

class StatTableGameCell extends Component {
	render() {
		const { slug, _opposition, date, title } = this.props.game;
		return (
			<Link to={`/games/${slug}`} className="fixture-box">
				<TeamImage team={_opposition} variant="dark" size="small" />
				<div className="date mobile">{new Date(date).toString("dS MMM")}</div>
				<div className="date desktop">{new Date(date).toString("ddd dS MMMM")}</div>
				<div className="title">{title}</div>
			</Link>
		);
	}
}
export default StatTableGameCell;
