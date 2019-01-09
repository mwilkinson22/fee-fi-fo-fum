import { connect } from "react-redux";
import { fetchFixtures, updateFilters } from "../../actions/gamesActions";
import GameListOld from "./GameList-old";

class FixtureList extends GameListOld {
	fetchGameList() {
		this.props.fetchFixtures(this.state.filters);
	}

	fetchFilters() {
		this.setState({ filters: {} });
		this.props.updateFilters("fixtures");
	}

	generatePageHeader() {
		return "Fixtures";
	}
}

function mapStateToProps({ games }) {
	return { games: games.fixtures || null, filters: games.filters };
}

export default connect(
	mapStateToProps,
	{ fetchFixtures, updateFilters }
)(FixtureList);
