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

//Constants
import { imagePath } from "~/client/extPaths";
const iconPath = `${imagePath}people/icons/`;

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
					.map(person => (
						<li key={person._id}>
							<Link to={`/admin/people/${person.slug}`}>
								{this.renderPersonIcons(person)}
								{person.name.first} {person.name.last}
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

	renderPersonIcons(person) {
		const icons = [
			person.gender == "M"
				? { file: "male", title: "Male" }
				: { file: "female", title: "Female" },
			person.isPlayer
				? { file: "ball", title: "Player" }
				: { file: "ball-grey", title: "Not a Player" },
			person.isCoach
				? { file: "clipboard", title: "Coach" }
				: { file: "clipboard-grey", title: "Not a Coach" },
			person.isReferee
				? { file: "whistle", title: "Referee" }
				: { file: "whistle-grey", title: "Not a Referee" }
		];

		return icons.map(({ file, title }) => (
			<span key={file}>
				<img src={`${iconPath}${file}.svg`} alt={title} title={title} />
			</span>
		));
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
