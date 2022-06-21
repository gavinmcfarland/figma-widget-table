<script>
	// let editor = document.getElementById('editor')
	// let colElement = document.getElementById('colElement')
	// let rowElement = document.getElementById('rowElement')
	// const button = document.getElementById("button");

	import { onMount } from 'svelte';

	let editor
	let colElement
	let rowElement
	let button
	let link = ""

	const alphabet = [
		'', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
	]

	let data, colIndex, rowIndex, msg;

	function setCaretPosition(ctrl, pos) {
		// Modern browsers
		if (ctrl.setSelectionRange) {
			ctrl.focus();
			ctrl.setSelectionRange(pos, pos);

			// IE8 and below
		} else if (ctrl.createTextRange) {
			var range = ctrl.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}
	}

	function checkIfLink(text) {
		if (text) {
			// Removed : for now from expression because causes error in figma
			var expression = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#()?&//=]*)$/gi;
			var regex = new RegExp(expression);
			var t = text;

			if (t.match(regex)) {
				return true
			} else {
				return false
			}
		}

	}

	function evalFunction(js) {

		var value;

		var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
        valid = true;

		// Detect valid JS identifier names and replace them
		js = js.replace(reg, function ($0) {
			// If the name is a direct member of Math, allow
			if (Math.hasOwnProperty($0))
				return "Math."+$0;
			// Otherwise the expression is invalid
			else
				valid = false;
		});



		if (valid) {

			try {
				// for expressions
				// value = eval(js);
				value = Function('"use strict";return (' + js + ')')()
			} catch (e) {
				// if (e instanceof SyntaxError) {
				// 	try {
				// 		// for statements
				// 		value = (new Function('with(this) { ' + js + ' }')).call(context);
				// 	} catch (e) {}
				// }
				console.log(e)
			}
		}

		return value;
	}


	// link = checkIfLink(data)

	function updateRows(input) {
		input.parentNode.dataset.replicatedValue = input.value
		var textareaHeight = input.clientHeight
		parent.postMessage({ pluginMessage: { type: 'resize-ui', data: { textareaHeight } } }, '*');
		function setNumberRows(input) {
			var numberLines = input.value.split('\n').length
			editor.setAttribute('rows', numberLines)
		}

		// setNumberRows(editor)

		input.addEventListener('input', (e) => {
			input.parentNode.dataset.replicatedValue = input.value
			var textareaHeight = input.clientHeight
			link = checkIfLink(input.value)

			// Checks if input express is valid before posting to figma. This means user only sees valid expression rendered while typing
			if (input.value === "=") {
				parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value, link } } }, '*');
			}
			else if (input.value.startsWith("=")) {
				let evalCode = evalFunction(input.value.substring(1))
				if (evalCode || evalCode === 0) {
					parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value, link } } }, '*');
				}
			}
			else {
				parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value, link } } }, '*');
			}

			parent.postMessage({ pluginMessage: { type: 'resize-ui', data: { textareaHeight } } }, '*');
		})

		input.addEventListener('keydown', (e) => {
			var textareaHeight = input.clientHeight
			link = checkIfLink(input.value)
			if ((e.key === 'Enter' && e.metaKey) || (e.key === 'Enter' && e.ctrlKey)) {
				parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value, link } } }, '*');
			}
			else if (e.key !== 'Enter' && e.which === 37 && e.which === 38 && e.which === 39 && e.which === 38 && e.which === 40) {
				parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value, link} } }, '*');
			}
		})
	}

	function submitOnEnter(input, message) {

		if (message?.settings?.navigateOnEnter) {
			input.addEventListener('keydown', function (e) {

				if (e.key === 'Enter') {
					e.preventDefault()
				}

				if ((e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) || ((e.metaKey || e.ctrlKey) && e.which === 40)) {
					parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value } } }, '*');
					parent.postMessage({ pluginMessage: { type: 'next-cell', data: { colIndex, rowIndex, link }, target: [null, 1] } }, '*');

				}

				if ((e.key === 'Enter' && e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.which === 38)) {
					parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value } } }, '*');
					parent.postMessage({ pluginMessage: { type: 'next-cell', data: { colIndex, rowIndex, link }, target: [null, -1] } }, '*');

				}

			});
		}

		else {
			input.addEventListener('keydown', function (e) {

				if (e.key === 'Enter') {
					e.preventDefault()
				}

				if (((e.metaKey || e.ctrlKey) && e.which === 40)) {
					parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value } } }, '*');
					parent.postMessage({ pluginMessage: { type: 'next-cell', data: { colIndex, rowIndex, link }, target: [null, 1] } }, '*');


				}


				if (((e.metaKey || e.ctrlKey) && e.which === 38)) {
					parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value } } }, '*');
					parent.postMessage({ pluginMessage: { type: 'next-cell', data: { colIndex, rowIndex, link }, target: [null, -1] } }, '*');

				}

			});

			input.addEventListener('keydown', function (e) {

				// User presses enter key?
				if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey)) {
					e.preventDefault()
					parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: input.value } } }, '*');
					parent.postMessage({ pluginMessage: { type: 'close-plugin' } }, '*');
				}

			});

		}

		document.addEventListener('keydown', function (e) {

			// If user presses tab
			if ((e.key === "Tab" && !e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.which === 39)) {
				e.preventDefault()

				parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: editor.value } } }, '*');
				parent.postMessage({ pluginMessage: { type: 'next-cell', data: { colIndex, rowIndex, link }, target: [1, null] } }, '*');

			}
			if (e.key === "Escape") {
				parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: editor.value } } }, '*');
				parent.postMessage({ pluginMessage: { type: 'close-plugin' } }, '*');

			}
		});

		document.addEventListener('keydown', function (e) {

			// If user presses tab and shift key
			if ((e.key === "Tab" && e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.which === 37)) {
				e.preventDefault()

				parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: editor.value } } }, '*');
				parent.postMessage({ pluginMessage: { type: 'next-cell', data: { colIndex, rowIndex, link }, target: [-1, null] } }, '*');

			}
		});
	}

	async function onLoad(event) {
		msg = event.data.pluginMessage

		if (msg.type === "post-data") {
			({ data, colIndex, rowIndex } = msg.data)
		}

		if (msg.type === "show-ui") {
			submitOnEnter(editor, msg)
		}

		editor.value = data
		editor.focus();

		if (msg.type === "post-data") {
		updateRows(editor)
		}

		// Makes sure to always position caret at end of text
		setCaretPosition(editor, editor.value.length)

		colElement.innerHTML = `${alphabet[colIndex]}`
		rowElement.innerHTML = `${rowIndex}`

	}

	onMount(async () => {

		parent.postMessage({ pluginMessage: { type: "window-loaded" } }, '*');

		// setInterval(() => {
		// 	if (document.hasFocus()) {
		// 		console.log("window has focus")
		// 		editor.focus();
		// 	}
		// 	else {
		// 		console.log("window does not have focus")
		// 		editor.focus();
		// 	}
		// }, 200)

		// window.addEventListener('blur', () => {
		// 	console.log("window has lost focus")
		// 	editor.focus();
		// })

		editor.addEventListener('keydown', function (e) {

			var caretPosition = this.selectionStart

			if ((e.metaKey && e.key === 'Enter') || (e.ctrlKey && e.key === 'Enter')) {
				var caretPositionBefore = caretPosition
				var stringBefore = editor.value.slice(0, caretPosition)
				var stringAfter = editor.value.slice(caretPosition)
				editor.value = stringBefore + "\n" + stringAfter
				setCaretPosition(editor, caretPositionBefore + 1)

				editor.parentNode.dataset.replicatedValue = editor.value
				var textareaHeight = editor.clientHeight
				parent.postMessage({ pluginMessage: { type: 'resize-ui', data: { textareaHeight } } }, '*');

				// parent.postMessage({ pluginMessage: { type: 'data-received', data: { data: editor.value, textareaHeight } } }, '*');
			}

		});

		// button.addEventListener("click", () => {
		// 	parent.postMessage({ pluginMessage: { type: 'close-plugin' } }, '*');
		// })
	});








</script>

<svelte:window on:message={onLoad} />

<body>
	<div class="m-xsmall type--small">
		<p>Cell <span id="colElement" bind:this="{colElement}"></span><span id="rowElement" bind:this="{rowElement}"></span></p>
		<div class="input grow-wrap">
			<textarea id="editor" bind:this="{editor}" class="textarea" rows="1" style="max-height: 277px; min-height: auto;"></textarea>
		</div>
		<p class="type-small secondary-text">Press <key>ctrl/cmd + enter</key> to create a new line</p>
		<!-- <button class="button button--primary mt-xsmall" id="button" bind:this="{button}">Save</button> -->
	</div>
</body>

<style>
	.grow-wrap {
		/* easy way to plop the elements on top of each other and have them both sized based on the tallest one's height */
		display: grid;
	}

	.grow-wrap::after {
		/* Note the weird space! Needed to preventy jumpy behavior */
		content: attr(data-replicated-value) " ";

		/* This is how textarea text behaves */
		white-space: pre-wrap;

		/* Hidden from view, clicks, and screen readers */
		visibility: hidden;
	}

	.grow-wrap>textarea {
		/* You could leave this, but after a user resizes, then it ruins the auto sizing */
		resize: none;

		/* Firefox shows scrollbar on growth, you can hide like this. */
		overflow: hidden;
	}

	.grow-wrap>textarea,
	.grow-wrap::after {
		/* Identical styling required!! */
		padding: 8px;
		font: inherit;
		max-height: 250px;
		min-height: auto;
		/* Place on top of each other */
		grid-area: 1 / 1 / 2 / 2;
		letter-spacing: 0.12px;
	}
	.grow-wrap::after {
		margin: 2px 0;
	}
</style>
