import React, { Component } from "react";
import axios from "axios";
import _ from "lodash";
import "./PersonSearch.css";

export default class SearchBar extends Component {
	constructor(props) {
		super(props);
		this.state = { list: [] };
	}
	async updateList(val) {
		if (val.length < 3) this.setState({ list: <ul /> });
		else {
			const content = await axios.get("/api/person/search/" + encodeURI(val));
			this.setState({
				list: (
					<ul>
						{_.map(content.data, entry => {
							return <li key={entry._id}>{entry.fullname}</li>;
						})}
					</ul>
				)
			});
		}
	}

	render() {
		return (
			<div style={{ position: "relative", display: "inline-block" }}>
				<input
					id="nameSearch"
					ref="nameInput"
					type="text"
					placeholder="Search"
					onChange={ev => this.updateList(ev.target.value)}
				/>
				<div className="results">{this.state.list}</div>
			</div>
		);
	}
}
