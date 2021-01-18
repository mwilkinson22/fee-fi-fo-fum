//Modules
import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

//Components
import TeamFormHeadToHead from "../../games/TeamFormHeadToHead";
import TeamFormPerTeam from "../../games/TeamFormPerTeam";

//Helpers
import { matchSlugToItem } from "~/helpers/routeHelper";

function TeamFormBlock(props) {
	const { blockProps, data, match, postList, redirects, fullGames } = props;
	const { allCompetitions, formType } = data;

	if (blockProps.getReadOnly()) {
		const post = matchSlugToItem(match.params.slug, postList, redirects);
		if (!post) {
			return null;
		}

		//Get Game Id
		const { _game } = post.item;
		const game = fullGames[_game];

		if (formType === "head-to-head") {
			return <TeamFormHeadToHead allCompetitions={allCompetitions} game={game} />;
		} else {
			return (
				<TeamFormPerTeam
					allCompetitions={allCompetitions}
					game={game}
					includeHeader={false}
				/>
			);
		}
	} else {
		const formName = formType === "head-to-head" ? "Head To Head" : "Team";
		return (
			<div className="custom-block placeholder">{formName} Form will be displayed here</div>
		);
	}
}

function mapStateToProps({ games, news }) {
	const { fullGames } = games;
	const { postList, redirects } = news;
	return { fullGames, postList, redirects };
}

export default withRouter(connect(mapStateToProps)(TeamFormBlock));
