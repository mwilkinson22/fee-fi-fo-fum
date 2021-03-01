//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";

class Searcher extends Component {
	constructor(props) {
		super(props);

		const { initialSearch } = props;

		//Return initial search
		this.handleInputChange(initialSearch);

		//Set state
		this.state = { searchValue: initialSearch };
	}

	convertStringToSearchable(string) {
		const { caseSensitive, regex } = this.props;

		const regexedString = string.replace(regex, "");

		if (caseSensitive) {
			return regexedString;
		} else {
			return regexedString.toLowerCase();
		}
	}

	handleInputChange(value) {
		const { data, emptySearchReturnsAll, handleFilter, minimumSearchValue, onChange } = this.props;

		//Normalise input
		const filterName = this.convertStringToSearchable(value);

		//Save filtered data to state
		let filteredData;
		if (filterName.length >= minimumSearchValue) {
			filteredData = _.filter(data, obj =>
				handleFilter(obj, filterName, str => this.convertStringToSearchable(str))
			);
		} else if (emptySearchReturnsAll) {
			filteredData = data;
		} else {
			filteredData = [];
		}

		onChange(filteredData, value.length >= minimumSearchValue);
	}

	render() {
		const { minimumSearchValue, onKeyDown, placeholder } = this.props;

		let searchPrompt;
		if (minimumSearchValue) {
			const text = `Enter ${minimumSearchValue} or more ${
				minimumSearchValue === 1 ? "character" : "characters"
			} to search`;
			searchPrompt = <p>{text}</p>;
		}

		return (
			<div className="card form-card">
				<input
					type="text"
					placeholder={placeholder}
					className="searcher-input"
					onChange={ev => this.handleInputChange(ev.target.value)}
					onKeyDown={ev => onKeyDown(ev)}
				/>
				{searchPrompt}
			</div>
		);
	}
}

Searcher.propTypes = {
	caseSensitive: PropTypes.bool,
	data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
	emptySearchReturnsAll: PropTypes.bool,
	handleFilter: PropTypes.func.isRequired, //Takes the obj param, the search string, and the convert method
	onChange: PropTypes.func.isRequired,
	onKeyDown: PropTypes.func,
	initialSearch: PropTypes.string,
	minimumSearchValue: PropTypes.number,
	placeholder: PropTypes.string,
	regex: PropTypes.instanceOf(RegExp)
};

Searcher.defaultProps = {
	caseSensitive: false,
	emptySearchReturnsAll: false,
	initialSearch: "",
	minimumSearchValue: 3,
	onKeyDown: () => {},
	placeholder: "Search",
	regex: new RegExp("((?![A-Za-z]).)", "gi")
};

export default Searcher;
