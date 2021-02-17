/* --- 拡張機能が動作中か確認 --- */
let is_working = false;
if (typeof browser === 'undefined') browser = chrome;
browser.runtime.sendMessage({ctrl:'get-status'}, response => {
	/* 変数の更新 */
	is_working = Boolean(response.is_working);
	/* IDの受信を待つ */
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		/* コモンズ確認ページのURLリクエスト */
		if (message.ctrl === 'request-commons-url') {
			/* コモンズのURLを送信 */
			const url = document.querySelector('a.Link.ContentTreeContainer-guideLink').getAttribute('href');
			sendResponse({url:url});
		}
	});
});
