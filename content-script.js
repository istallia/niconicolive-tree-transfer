/* --- 拡張機能が動作中か確認 --- */
let is_working = false;
let is_adding  = false;
if (typeof browser === 'undefined') browser = chrome;
browser.runtime.sendMessage({ctrl:'get-status'}, response => {
	/* 変数の更新 */
	is_working = Boolean(response.is_working);
	/* DOM監視イベントの登録 */
	const target   = document.getElementById('candidate');
	const observer = new MutationObserver(records => {
		if (is_working && is_adding && records[0].addedNodes.length > 0) {
			is_adding             = false;
			const candidates_area = document.getElementById('candidate');
			const parents_area    = document.getElementById('parents');
			let candidates_works  = [... candidates_area.children];
			let parents_works     = [... parents_area.children].map(li => li.id);
			candidates_works      = candidates_works.filter(li => parents_works.indexOf(li.id) === -1);
			if (candidates_works.length > 0) {
				for (let i in candidates_works) {
					let li = candidates_works[i];
					parents_area.appendChild(li);
				}
				setTimeout(() => {
					document.getElementById('send_check').dispatchEvent(new Event('click', {bubbles: true, composed: true}));
				}, 0);
			} else {
				browser.runtime.sendMessage({ctrl:'ready-tree'});
			}
		}
	});
	observer.observe(target, {childList:true});
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
		is_adding  = true;
		let button = document.querySelector('a[title="候補に追加する"]');
		button.dispatchEvent(new Event('click', {bubbles: true, composed: true}));
	}
});
