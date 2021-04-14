//Modules
import React from "react";
import { Link } from "react-router-dom";

//Components
import TeamImage from "../teams/TeamImage";

export default function StatTableGameCell({ game, includeYear }) {
	const { slug, _opposition, date, title } = game;
	const yearFormat = includeYear ? " yyyy" : "";
	return (
		<Link to={`/games/${slug}`} className="fixture-box">
			<TeamImage team={_opposition} variant="dark" size="small" />
			<div className="date mobile">{new Date(date).toString(`dS MMM${yearFormat}`)}</div>
			<div className="date desktop">{new Date(date).toString(`ddd dS MMMM${yearFormat}`)}</div>
			<div className="title">{title}</div>
		</Link>
	);
}
