//Modules
import { DraftJS, createTypeStrategy } from "megadraft";
import Link from "megadraft/lib/components/Link";

//Components
import InternalLink from "~/client/components/news/entities/InternalLink";

const decorators = [["LINK", Link], ["INTERNAL_PAGE_LINK", InternalLink]];

export default new DraftJS.CompositeDecorator(
	decorators.map(([entity, component]) => ({
		strategy: createTypeStrategy(entity),
		component
	}))
);
