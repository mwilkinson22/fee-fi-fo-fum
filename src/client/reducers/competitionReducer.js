import {
	DELETE_COMPETITION,
	DELETE_COMPETITION_SEGMENT,
	FETCH_ALL_COMPETITION_SEGMENTS,
	FETCH_ALL_COMPETITIONS,
	FETCH_COMPETITION,
	FETCH_COMPETITION_SEGMENT,
	FETCH_HOMEPAGE_LEAGUE_TABLE_DATA,
	FETCH_LEAGUE_TABLE_DATA
} from "../actions/types";

export default function(state = { leagueTableData: {} }, action) {
	switch (action.type) {
		case FETCH_ALL_COMPETITIONS:
			return {
				...state,
				competitionList: action.payload
			};

		case FETCH_COMPETITION:
			return {
				...state,
				competitionList: {
					...state.competitionList,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_COMPETITION: {
			const { [action.payload]: oldCompetitionId, ...competitionList } = state.competitionList;
			return {
				...state,
				competitionList
			};
		}

		case FETCH_ALL_COMPETITION_SEGMENTS:
			return {
				...state,
				competitionSegmentList: action.payload
			};

		case FETCH_COMPETITION_SEGMENT:
			return {
				...state,
				competitionSegmentList: {
					...state.competitionSegmentList,
					[action.payload._id]: action.payload
				}
			};

		case DELETE_COMPETITION_SEGMENT: {
			const { [action.payload]: oldSegmentId, ...competitionSegmentList } = state.competitionSegmentList;
			return {
				...state,
				competitionSegmentList
			};
		}

		case FETCH_LEAGUE_TABLE_DATA: {
			return {
				...state,
				leagueTableData: {
					...state.leagueTableData,
					[action.key]: action.payload
				}
			};
		}

		case FETCH_HOMEPAGE_LEAGUE_TABLE_DATA: {
			return {
				...state,
				homePageLeagueTable: action.payload
			};
		}

		default:
			return state;
	}
}
