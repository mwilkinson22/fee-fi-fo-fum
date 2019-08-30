//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchPeopleList } from "~/client/actions/peopleActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminPersonList extends Component {
	constructor(props) {
		super(props);

		const { peopleList, fetchPeopleList } = props;

		if (!peopleList) {
			fetchPeopleList();
		}

		this.state = { filterName: "", regex: /((?![A-Za-z]).)/gi };
	}

	static getDerivedStateFromProps(nextProps) {
		const { peopleList } = nextProps;
		return { peopleList };
	}

	renderList() {
		const { peopleList, filterName, regex } = this.state;
		let content;

		if (filterName.length > 2) {
			const filteredPeople = _.filter(peopleList, ({ name }) => {
				const fullName = (name.first + name.last).replace(regex, "").toLowerCase();
				return fullName.includes(filterName);
			});

			if (filteredPeople.length) {
				content = _.chain(filteredPeople)
					.sortBy(["name.last", "name.first"])
					.map(({ _id, slug, name }) => (
						<li key={_id}>
							<Link to={`/admin/people/${slug}`}>
								{name.first} {name.last}
							</Link>
						</li>
					))
					.value();
			} else {
				content = <li>No people found</li>;
			}
		} else {
			content = <li>Enter 3 or more letters to search</li>;
		}

		return (
			<div className="card form-card">
				<input
					type="text"
					placeholder="Search By Name"
					className="name-filter"
					onChange={({ target }) =>
						this.setState({
							filterName: target.value.replace(regex, "").toLowerCase()
						})
					}
				/>
				<ul className="plain-list">{content}</ul>
			</div>
		);
	}

	render() {
		const { peopleList } = this.state;
		let content;
		if (!peopleList) {
			content = <LoadingPage />;
		} else {
			content = this.renderList();
		}
		return (
			<div className="admin-person-list">
				<HelmetBuilder title="People" />
				<section className="page-header">
					<div className="container">
						<h1>People</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/people/new`}>
							Add a New Person
						</Link>
						{content}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ people }) {
	const { peopleList } = people;
	return { peopleList };
}

export default connect(
	mapStateToProps,
	{ fetchPeopleList }
)(AdminPersonList);
