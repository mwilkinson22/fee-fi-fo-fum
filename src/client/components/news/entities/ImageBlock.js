import React, { Component } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import icons from "megadraft/lib/icons";

class ImageBlock extends Component {
	constructor(props) {
		super(props);
		this.actions = [
			{
				key: "delete",
				icon: icons.DeleteIcon,
				action: this.props.container.remove
			}
		];
	}

	renderCaption() {
		const { caption } = this.props.data;
		if (caption && caption.value) {
			const { value, rightAlign, firstWordIsWhite, formatAsHeader } = caption;
			let element;
			if (formatAsHeader) {
				let content = value;
				if (firstWordIsWhite) {
					const arr = value.split(" ");
					const firstWord = arr.shift();
					content = [<span key="first">{firstWord}</span>];
					if (arr.length) {
						content.push(<span key="rest"> {arr.join(" ")}</span>);
					}
				}
				element = <h6>{content}</h6>;
			} else {
				element = <span>{value}</span>;
			}

			return <div className={`caption-wrapper${rightAlign ? " right-align" : ""}`}>{element}</div>;
		}
	}

	render() {
		const { bucketPaths, data } = this.props;
		const { url } = data;

		let content = (
			<div className="image">
				<img src={`${bucketPaths.imageRoot}news/inline/${this.props.data.src}`} alt="" />
				{this.renderCaption()}
			</div>
		);

		if (url) {
			content = <Link to={url}>{content}</Link>;
		}

		return <div className="custom-block image-wrapper">{content}</div>;
	}
}

function mapStateToProps({ config }) {
	const { bucketPaths } = config;
	return { bucketPaths };
}

export default connect(mapStateToProps)(ImageBlock);
