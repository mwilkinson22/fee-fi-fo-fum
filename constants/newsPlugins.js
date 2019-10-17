import ImageBlock from "~/client/components/news/entities/ImageBlock";
import ImageButton from "~/client/components/news/entities/ImageButton";

const imagePlugin = {
	title: "Image",
	type: "image",
	buttonComponent: ImageButton,
	blockComponent: ImageBlock
};

export default [imagePlugin];
