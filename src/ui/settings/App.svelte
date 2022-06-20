<script>
	import { onMount } from 'svelte';

	let exportFile
	let navigateOnEnterInput
	let clearTable
	let useDarkTheme
	let firstRowAsHeader

	function saveAs(content, filename) {
		const blob = new File([content], filename, { type: "text/plain" });

		if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
			return navigator.msSaveOrOpenBlob(blob, fileName);
		} else if (typeof navigator.msSaveBlob !== 'undefined') {
			return navigator.msSaveBlob(blob, fileName);
		} else {
			var elem = window.document.createElement('a');
			elem.href = window.URL.createObjectURL(blob);
			elem.download = filename;
			elem.style = 'display:none;opacity:0;color:transparent;';
			(document.body || document.documentElement).appendChild(elem);

			if (typeof elem.click === 'function') {
				elem.click();
			} else {
				elem.target = '_blank';
				elem.dispatchEvent(new MouseEvent('click', {
					view: window,
					bubbles: true,
					cancelable: true
				}));
			}
			URL.revokeObjectURL(elem.href);
		}
	}

	async function onLoad(event) {
		var message = event.data.pluginMessage

		if (message.type === "post-settings") {
			navigateOnEnterInput.checked = message.settings.navigateOnEnter
			firstRowAsHeader.checked = message.widgetFirstRowAsHeader

			if (message.widgetTheme === "dark") {
				useDarkTheme.checked = true
			}
			else {
				useDarkTheme.checked = false
			}


		}

		if (message.type === "export-data") {
			var exportedString = message.exportedString
			saveAs(exportedString, "exported_data.csv")
		}
	}

	onMount(async () => {
		exportFile.addEventListener('click', () => {
			parent.postMessage({ pluginMessage: { type: "export-data" } }, '*');
		})

		navigateOnEnterInput.addEventListener('input', () => {
			console.log("toggled")
			parent.postMessage({ pluginMessage: { type: "settings-saved", settings: { navigateOnEnter: navigateOnEnterInput.checked } } }, '*');
		})

		firstRowAsHeader.addEventListener('input', () => {
			parent.postMessage({ pluginMessage: { type: "widget-first-row-as-header-saved", firstRowAsHeader: firstRowAsHeader.checked } }, '*');
		})

		useDarkTheme.addEventListener('input', () => {
			let theme = "light";

			if (useDarkTheme.checked) {
				theme = "dark"
			}

			parent.postMessage({ pluginMessage: { type: "widget-theme-saved", theme } }, '*');
		})

		clearTable.addEventListener('click', () => {
			parent.postMessage({ pluginMessage: { type: "clear-table" } }, '*');
		})
	})

</script>

<svelte:window on:message={onLoad} />

<div class="m-xsmall type--small">
	<p class="type--bold">Settings</p>

	<div class="checkbox">
		<input id="navigateOnEnterInput" bind:this="{navigateOnEnterInput}" type="checkbox" class="checkbox__box">
		<label for="navigateOnEnterInput" class="checkbox__label">Navigate to cell below on enter</label>
	</div>
	<div class="checkbox">
		<input id="useDarkTheme" bind:this="{useDarkTheme}" type="checkbox" class="checkbox__box">
		<label for="useDarkTheme" class="checkbox__label">Use dark theme for widget</label>
	</div>
	<div class="checkbox">
		<input id="firstRowAsHeader" bind:this="{firstRowAsHeader}" type="checkbox" class="checkbox__box">
		<label for="firstRowAsHeader" class="checkbox__label">Use first row as header</label>
	</div>
	<hr>
	<p class="type--bold">Export data</p>
	<button class="button button--primary mt-xsmall" id="exportFile" bind:this="{exportFile}">Export as CSV</button>
	<br />
	<hr>
	<p class="type--bold">Clear table</p>
	<button class="button button--primary-destructive mt-xsmall" id="clearTable" bind:this="{clearTable}">Clear Table</button>

</div>

<style>
	.experimental {
		border-radius: 2px;
		padding: 0 2px;
		margin-left: 6px;
		font-weight: bold;
		background-color: var(--figma-color-bg-brand-tertiary);
		color: var(--figma-color-bg-brand);
	}
	.checkbox {
		margin-left: -8px;
	}
</style>
