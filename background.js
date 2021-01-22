/* --- 各種情報を初期化 --- */
if (typeof browser === 'undefined') browser = chrome;
let is_working   = false;
let tab_id_video = null;
let tab_id_tree  = null;
let live_id      = null;


/* --- 各種sendMessageに応答する --- */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	/* 各種情報の取得要求 */
	if (message.ctrl === 'get-status') {
		sendResponse({
			is_working   : is_working,
			tab_id_video : tab_id_video,
			tab_id_tree  : tab_id_tree,
			live_id      : live_id
		});
		return;
	}
	/* 自動転送の開始 */
	if (message.ctrl === 'start-transfer') {
		is_working   = true;
		live_id      = message.live_id;
		tab_id_video = message.tab_id_video;
		tab_id_tree  = message.tab_id_tree;
		sendResponse({is_working:true});
		return;
	}
});
