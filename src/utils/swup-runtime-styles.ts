/**
 * Client-only islands and Vite inject styles after the server renders <head>.
 * Swup must keep these nodes: the corresponding modules are already cached,
 * and persistent sidebar islands are not mounted again on navigation.
 */
export function preserveRuntimeStyles(swup: {
	findPlugin: (name: string) => unknown;
}) {
	const head = swup.findPlugin("SwupHeadPlugin") as {
		options: {
			persistTags: boolean | string | ((element: Element) => boolean);
		};
	} | undefined;
	if (!head) return;
	const previous = head.options.persistTags;
	head.options.persistTags = (element) => {
		if (element.matches('style[data-vite-dev-id], style[id^="svelte-"]')) return true;
		if (typeof previous === "function") return previous(element);
		if (typeof previous === "string") return element.matches(previous);
		return previous;
	};
}
