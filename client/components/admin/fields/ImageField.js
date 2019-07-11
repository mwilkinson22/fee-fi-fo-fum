//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { googleBucket } from "~/client/extPaths";

//Components
import ImageSelector from "./ImageSelector";
import PopUpDialog from "~/client/components/PopUpDialog";

class ImageField extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { value } = nextProps;
		return { value };
	}

	renderImageSelector() {
		const { value, showImageSelector } = this.state;
		const { path, imageList, onChange } = this.props;
		if (showImageSelector) {
			return (
				<PopUpDialog
					onDestroy={() => this.setState({ showImageSelector: false })}
					fullSize={true}
				>
					<ImageSelector
						value={value}
						path={path}
						imageList={imageList}
						onChange={onChange}
					/>
				</PopUpDialog>
			);
		}
	}

	render() {
		const { onChange, path } = this.props;
		const { value } = this.state;

		let content;
		if (value.length) {
			content = (
				<img
					src={googleBucket + path + value}
					className="image-selector-field image"
					title={value}
				/>
			);
		} else {
			content = <span className="image-selector-field text">No Image Selected</span>;
		}

		return (
			<div className="image-selector-field-wrapper">
				{content}
				{this.renderImageSelector()}
				<div className="buttons">
					<button type="button" disabled={!value} onClick={() => onChange("")}>
						Clear
					</button>
					<button
						type="button"
						onClick={() => this.setState({ showImageSelector: true })}
					>
						Choose
					</button>
				</div>
			</div>
		);
	}
}

ImageField.propTypes = {
	acceptSVG: PropTypes.bool,
	value: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
	imageList: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			created: PropTypes.instanceOf(Date).isRequired,
			updated: PropTypes.instanceOf(Date).isRequired,
			size: PropTypes.number.isRequired
		})
	),
	onChange: PropTypes.func.isRequired
};

ImageField.defaultProps = {
	acceptSVG: true,
	imageList: []
};

export default ImageField;
