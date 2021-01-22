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
		if (tab_id_tree !== null) {
			browser.tabs.get(tab_id_video, tab => {
				setTimeout(() => sendToContentsTree(tab.url), 2000);
			});
		} else {
			browser.tabs.query({url:'*://www.nicovideo.jp/watch/*'}, tabs => {
				let urls = [];
				for (let i in tabs) {
					if (urls.length < 10) urls.push(tabs[i].url);
				}
				setTimeout(() => sendArrayToContentsTree(urls, 2000));
			});
		}
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
			if (tab_id === tab_id_video) browser.tabs.remove(tab_id_tree);
			is_working   = false;
			live_id      = null;
			tab_id_video = null;
			tab_id_tree  = null;
		}
	}
});


/* --- タブ更新検知 --- */
browser.tabs.onUpdated.addListener((tab_id, change_info, tab) => {
	if (is_working && change_info.status === 'complete') {
		if (tab_id === tab_id_video || tab_id_video === null) {
			/* ツリー登録ページに送信 */
			sendToContentsTree(tab.url);
		} else if (tab_id === tab_id_tree) {
			/* ツリー登録後のURLか確認 */
			const regexp = /commons\d\.nicovideo\.jp\/tree\/(lv\d{1,20})/;
			if (!regexp.test(tab.url)) return;
			/* ツリー登録ページに戻す */
			browser.tabs.update(tab_id, {url:'https://commons.nicovideo.jp/tree/edit/'+live_id});
		}
	}
});


/* --- ツリー登録ページにIDを送信 --- */
const sendToContentsTree = url => {
	/* 動画IDを取得 */
	const regexp = /www\.nicovideo\.jp\/watch\/(sm\d{1,20})/;
	let matches  = regexp.exec(url);
	if (matches === null || matches.length < 1) return;
	const video_id = matches[1];
	/* content-script側に送信 */
	browser.tabs.sendMessage(tab_id_tree, {ctrl:'add', id:video_id});
};


/* --- ツリー登録ページにIDを送信(初期/複数) --- */
const sendArrayToContentsTree = urls => {
	/* 動画IDを取得 */
	const regexp = /www\.nicovideo\.jp\/watch\/(sm\d{1,20})/;
	let video_ids = [];
	for (let i in urls) {
		let matches  = regexp.exec(urls[i]);
		if (matches === null || matches.length < 1) continue;
		video_ids.push(matches[1]);
	}
	/* content-script側に送信 */
	browser.tabs.sendMessage(tab_id_tree, {ctrl:'add', id:video_ids.join(' ')});
};
