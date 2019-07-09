//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";

//Components
import DeleteButtons from "./fields/DeleteButtons";

class ImageUploader extends Component {
	constructor(props) {
		super(props);
		this.inputRef = React.createRef();
		this.state = {};
	}

	onChange(ev) {
		const input = ev.target;
		if (input.files && input.files[0]) {
			const reader = new FileReader();

			reader.readAsDataURL(input.files[0]);

			reader.onload = e => {
				this.setState({ image: e.target.result });
			};
		}
	}

	renderButtons() {
		const { image } = this.state;
		const { initialPreviewSrc, onSubmit, onDelete } = this.props;

		if (!image && onDelete) {
			return <DeleteButtons onDelete={onDelete} />;
		}

		if (image) {
			return (
				<div className="buttons">
					<button
						type="button"
						onClick={() => {
							this.setState({ image: undefined });
							this.inputRef.current.value = null;
						}}
					>
						Clear
					</button>
					<button type="button" onClick={() => onSubmit(this.state.image)}>
						Upload
					</button>
				</div>
			);
		}
	}

	render() {
		const { initialPreviewSrc, accept, acceptSVG } = this.props;
		const { image } = this.state;

		//Get Accept prop
		if (acceptSVG) {
			accept.push("svg");
		}

		//Handle Preview
		const previewSrc = image || initialPreviewSrc;
		const previewImage = previewSrc && <img src={previewSrc} key="preview" />;

		return (
			<div className="image-uploader">
				{previewImage}
				<input
					accept={accept.map(ext => `.${ext.replace(/^\./, "")}`).join(",")}
					key="input"
					type="file"
					ref={this.inputRef}
					onChange={ev => this.onChange(ev)}
				/>
				{this.renderButtons()}
			</div>
		);
	}
}

ImageUploader.propTypes = {
	accept: PropTypes.arrayOf(PropTypes.string),
	acceptSVG: PropTypes.bool,
	initialPreviewSrc: PropTypes.string,
	onDelete: PropTypes.func,
	onSubmit: PropTypes.func.isRequired
};

ImageUploader.defaultProps = {
	accept: ["jpg", "jpeg", "gif", "png"],
	acceptSVG: false,
	initialPreviewSrc: null
};

export default ImageUploader;
