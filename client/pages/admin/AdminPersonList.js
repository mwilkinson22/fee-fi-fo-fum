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

		this.state = { filteredPeople: null, selectedPerson: null };
	}

	static getDerivedStateFromProps(nextProps) {
		const { peopleList } = nextProps;
		return { peopleList };
	}

	handleInputChange(value) {
		const { peopleList } = this.state;

		//Normalise input
		const regex = new RegExp("((?![A-Za-z]).)", "gi");
		const filterName = value.replace(regex, "").toLowerCase();

		//Save filtered people to state
		let filteredPeople;
		if (filterName.length > 2) {
			filteredPeople = _.chain(peopleList)
				.filter(({ name }) => {
					const fullName = (name.first + name.last).replace(regex, "").toLowerCase();
					return fullName.includes(filterName);
				})
				.sortBy(["name.last", "name.first"])
				.value();
		}

		this.setState({ filteredPeople, selectedPerson: 0 });
	}

	handleInputKeypress(ev) {
		const { filteredPeople, selectedPerson } = this.state;

		if (filteredPeople && filteredPeople.length) {
			switch (ev.which) {
				//Up arrow
				case 38:
					if (selectedPerson > 0) {
						this.setState({ selectedPerson: selectedPerson - 1 });
					}
					break;
				//Down arrow
				case 40:
					if (selectedPerson < filteredPeople.length - 1) {
						this.setState({ selectedPerson: selectedPerson + 1 });
					}
					break;
				//Enter
				case 13: {
					const person = filteredPeople[selectedPerson];
					this.props.history.push(`/admin/people/${person._id}`);
					break;
				}
			}
		}
	}

	renderList() {
		const { filteredPeople, selectedPerson } = this.state;
		let content;

		if (filteredPeople == null) {
			content = <li>Enter 3 or more letters to search</li>;
		} else if (filteredPeople.length) {
			content = filteredPeople.map((person, i) => (
				<li
					key={person._id}
					className={selectedPerson === i ? "selected" : ""}
					onMouseOver={() => this.setState({ selectedPerson: i })}
				>
					<Link to={`/admin/people/${person._id}`}>
						{this.renderPersonIcons(person)}
						{person.name.first} {person.name.last}
					</Link>
				</li>
			));
		} else {
			content = <li>No people found</li>;
		}

		return (
			<div className="card form-card">
				<input
					type="text"
					placeholder="Search By Name"
					className="name-filter"
					onChange={ev => this.handleInputChange(ev.target.value)}
					onKeyDown={ev => this.handleInputKeypress(ev)}
				/>
				<ul className="plain-list">{content}</ul>
			</div>
		);
	}

	renderPersonIcons(person) {
		const { bucketPaths } = this.props;
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
				<img
					src={`${bucketPaths.images.people}icons/${file}.svg`}
					alt={title}
					title={title}
				/>
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

function mapStateToProps({ config, people }) {
	const { bucketPaths } = config;
	const { peopleList } = people;
	return { bucketPaths, peopleList };
}

export default connect(mapStateToProps, { fetchPeopleList })(AdminPersonList);
