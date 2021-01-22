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
	/* 自動転送の停止 */
	if (message.ctrl === 'stop-transfer') {
		is_working   = false;
		live_id      = null;
		tab_id_video = null;
		tab_id_tree  = null;
		sendResponse({is_working:false});
	}
});


/* --- タブ閉じ検知 --- */
browser.tabs.onRemoved.addListener((tab_id, close_info) => {
	if (is_working) {
		/* 指定タブなら自動転送を停止 */
		if (tab_id === tab_id_video || tab_id === tab_id_tree) {
			is_working   = false;
			live_id      = null;
			tab_id_video = null;
			tab_id_tree  = null;
		}
	}
});


/* --- タブ更新検知 --- */
browser.tabs.onUpdated.addListener((tab_id, change_info, tab) => {
	if (is_working && (tab_id === tab_id_video || tab_id === null)) {
		/* 動画IDを取得 */
		const regexp = /www\.nicovideo\.jp\/watch\/(sm\d{1,20})/;
		let matches  = regexp.exec(tabs[0].url);
		if (matches === null || matches.length < 1) return;
		const video_id = matches[1];
	}
});
