/* --- 拡張機能が動作中か確認 --- */
let is_working = false;
let is_adding  = false;
if (typeof browser === 'undefined') browser = chrome;
document.addEventListener('DOMContentLoaded', event => {
	browser.runtime.sendMessage({ctrl:'get-status'}, response => {
		is_working     = Boolean(response.is_working);
		document.title = '[転送中] ' + document.title;
	});
});


/* --- IDの受信を待つ --- */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	/* IDを受信したら */
	if (message.ctrl === 'add') {
		/* 「IDから指定」に切り替え */
		let select           = document.getElementById('site_selector');
		select.selectedIndex = select.options.length - 1;
		select.dispatchEvent(new Event('change', {bubbles: true, composed: true}));
		/* 候補作品に追加 */
		document.getElementById('candidate_input').value = message.id;
		let button = document.querySelector('a[title="候補に追加する"]');
		button.dispatchEvent(new Event('click', {bubbles: true, composed: true}));
		is_adding = true;
	}
});
