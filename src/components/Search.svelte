<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onMount } from "svelte";
import type { SearchResult } from "@/global";

type SearchMode = "summary" | "full";

type SearchIndexItem = {
	id: string;
	title: string;
	description: string;
	url: string;
	category?: string | null;
	tags: string[];
	series?: string | null;
	column?: string | null;
	cover?: string | null;
	published: string;
};

let keywordDesktop = "";
let keywordMobile = "";
let mode: SearchMode = "summary";
let result: SearchResult[] = [];
let indexResult: SearchIndexItem[] = [];
let localIndex: SearchIndexItem[] = [];
let isSearching = false;
let pagefindLoaded = false;
let initialized = false;
let searchVersion = 0;

const togglePanel = () => {
	const panel = document.getElementById("search-panel");
	panel?.classList.toggle("float-panel-closed");
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) return;

	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

function clearSearch(isDesktop: boolean) {
	searchVersion++;
	setPanelVisibility(false, isDesktop);
	result = [];
	indexResult = [];
	isSearching = false;
}

function activeKeyword() {
	return keywordDesktop || keywordMobile;
}

function localSearch(keyword: string) {
	const query = keyword.trim().toLowerCase();
	if (!query) return [];

	return localIndex
		.filter((item) => {
			const haystack = [
				item.title,
				item.description,
				item.category,
				item.series,
				item.column,
				...(item.tags || []),
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return haystack.includes(query);
		})
		.slice(0, 8);
}

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	const version = ++searchVersion;
	const query = keyword.trim();

	if (!query) {
		clearSearch(isDesktop);
		return;
	}

	if (!initialized) return;

	isSearching = true;

	try {
		if (mode === "summary") {
			const nextIndexResult = localSearch(query);
			if (version !== searchVersion) return;
			indexResult = nextIndexResult;
			result = [];
			setPanelVisibility(true, isDesktop);
			return;
		}

		let searchResults: SearchResult[] = [];

		if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
			const response = await window.pagefind.search(query);
			searchResults = await Promise.all(
				response.results.map((item) => item.data()),
			);
		} else {
			const nextIndexResult = localSearch(query);
			if (version !== searchVersion) return;
			indexResult = nextIndexResult;
			result = [];
			setPanelVisibility(true, isDesktop);
			return;
		}

		if (version !== searchVersion) return;
		result = searchResults;
		indexResult = [];
		setPanelVisibility(true, isDesktop);
	} catch (error) {
		if (version !== searchVersion) return;
		console.error("Search error:", error);
		result = [];
		indexResult = [];
		setPanelVisibility(true, isDesktop);
	} finally {
		if (version === searchVersion) isSearching = false;
	}
};

async function loadLocalIndex() {
	try {
		const response = await fetch(url("/search-index.json"));
		localIndex = response.ok ? await response.json() : [];
	} catch (error) {
		console.warn("Failed to load search index", error);
		localIndex = [];
	}
}

function switchMode(nextMode: SearchMode) {
	mode = nextMode;
	search(activeKeyword(), true);
}

onMount(() => {
	const initializeSearch = async () => {
		await loadLocalIndex();
		initialized = true;
		pagefindLoaded =
			typeof window !== "undefined" &&
			!!window.pagefind &&
			typeof window.pagefind.search === "function";
		if (keywordDesktop) search(keywordDesktop, true);
		if (keywordMobile) search(keywordMobile, false);
	};

	if (import.meta.env.DEV) {
		initializeSearch();
	} else {
		document.addEventListener("pagefindready", initializeSearch, {
			once: true,
		});
		document.addEventListener("pagefindloaderror", initializeSearch, {
			once: true,
		});

		setTimeout(() => {
			if (!initialized) initializeSearch();
		}, 2000);
	}
});

$: if (initialized) {
	(async () => {
		if (keywordDesktop.trim()) {
			await search(keywordDesktop, true);
		} else if (!keywordMobile.trim()) {
			clearSearch(true);
		}
	})();
}

$: if (initialized) {
	(async () => {
		if (keywordMobile.trim()) {
			await search(keywordMobile, false);
		} else if (!keywordDesktop.trim()) {
			clearSearch(false);
		}
	})();
}
</script>

<div id="search-bar" class="hidden transition-all items-center h-11 mr-2 rounded-xl
      bg-white/45 hover:bg-white/65 focus-within:bg-white/75 border border-white/50
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10 dark:border-white/10
">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input placeholder="{i18n(I18nKey.search)}" bind:value={keywordDesktop} on:focus={() => search(keywordDesktop, true)}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-64 focus:w-64 text-black/55 dark:text-white/60"
    >
</div>

<button on:click={togglePanel} aria-label="Search Panel" id="search-switch"
        class="btn-plain scale-animation inline-flex rounded-full w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[32rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-3">

    <div class="flex items-center gap-2 mb-2">
        <button class:active-mode={mode === "summary"} on:click={() => switchMode("summary")} class="search-mode-btn">标题/摘要</button>
        <button class:active-mode={mode === "full"} on:click={() => switchMode("full")} class="search-mode-btn">全文</button>
        {#if isSearching}<span class="text-xs text-30 ml-auto">Searching...</span>{/if}
    </div>

    <div id="search-bar-inside" class="flex relative transition-all items-center h-11 rounded-xl mb-2
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input placeholder="Search" bind:value={keywordMobile}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    {#each indexResult as item}
        <a href={item.url}
           class="transition group block rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
            <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                {item.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
            </div>
            <div class="transition text-sm text-50">
                {item.description}
            </div>
        </a>
    {/each}

    {#each result as item}
        <a href={item.url}
           class="transition group block rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
            <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
            </div>
            <div class="transition text-sm text-50">
                {@html item.excerpt}
            </div>
        </a>
    {/each}

    {#if activeKeyword() && initialized && result.length === 0 && indexResult.length === 0 && !isSearching}
        <div class="px-3 py-6 text-center text-50 text-sm">没有找到匹配内容。</div>
    {/if}
</div>

<style>
  input:focus {
    outline: 0;
  }
  .search-panel {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
  .search-mode-btn {
    border-radius: 0.75rem;
    padding: 0.35rem 0.7rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    background: var(--btn-plain-bg-hover);
    transition: 0.2s ease;
  }
  .search-mode-btn.active-mode {
    color: var(--btn-content);
    background: var(--btn-regular-bg);
  }
</style>
