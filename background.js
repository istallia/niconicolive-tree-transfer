/* --- 各種情報を初期化 --- */
if (typeof browser === 'undefined') browser = chrome;
let is_working   = false;
let tab_id_video = null;
let tab_id_tree  = null;
let live_id      = null;
let ready        = false;
let queue        = [];


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
		ready        = false;
		queue        = [];
		sendResponse({is_working:true});
		if (tab_id_tree !== null) {
			browser.tabs.get(tab_id_video, tab => {
				addQueue(tab.id, tab.url);
			});
		} else {
			browser.tabs.query({url:'*://www.nicovideo.jp/watch/*'}, tabs => {
				for (let i in tabs.slice(0, -1)) addQueue(tabs[i].id, tabs[i].url, false);
				addQueue(tabs[tabs.length-1].id, tabs[tabs.length-1].url);
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
		ready        = false;
		queue        = [];
		sendResponse({is_working:false});
		return;
	}
	/* チャンネルに紐ついた動画のIDの処理 */
	if (message.ctrl === 'add-video-so') {
		addQueue(sender.tab.id, message.url);
		return;
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
			ready        = false;
			queue        = [];
		}
	}
});


/* --- タブ更新検知 --- */
browser.tabs.onUpdated.addListener((tab_id, change_info, tab) => {
	if (is_working && change_info.status === 'complete') {
		if (tab_id === tab_id_video || tab_id_video === null) {
			/* ツリー登録ページに送信 */
			addQueue(tab_id, tab.url);
		} else if (tab_id === tab_id_tree) {
			/* ツリー登録のURLか確認 */
			const regexp_2 = /commons\.nicovideo\.jp\/tree\/edit\/(lv\d{1,20})/;
			if (regexp_2.test(tab.url)) {
				ready = true;
				if (queue.length > 0) sendQueue();
			}
			/* ツリー登録後のURLか確認 */
			const regexp_1 = /commons\.nicovideo\.jp\/tree\/(lv\d{1,20})/;
			if (!regexp_1.test(tab.url)) return;
			/* ツリー登録ページに戻す */
			browser.tabs.update(tab_id, {url:'https://commons.nicovideo.jp/tree/edit/'+live_id});
		}
	}
});


/* --- キューに追加 --- */
const addQueue = (tab_id, url, tmp_ready = true) => {
	/* URLのチェック */
	if (!checkURL(tab_id, url)) return;
	/* URLを登録処理へ */
	queue.push(url);
	if (ready && tmp_ready) sendQueue();
};


/* --- キューを送信 --- */
const sendQueue = () => {
	const adding_queue = queue.slice(0,10);
	queue              = queue.filter(page => adding_queue.indexOf(page) === -1);
	sendArrayToContentsTree(adding_queue);
};


/* --- IDを抽出できるURLかチェックする --- */
const checkURL = (tab_id, url) => {
	/* URLのチェック */
	const regexp = /(?:www|commons)\.nicovideo\.jp\/(?:watch|tree)\/((?:sm|so)?\d{1,20})/;
	let matches  = regexp.exec(url);
	if (matches === null || matches.length < 1) return false;
	const video_id = matches[1];
	if (video_id.slice(0, 2) !== 'sm' && video_id.slice(0, 2) !== 'so') {
		/* コミュニティに紐ついてる動画かもしれないのでリクエストを送信 */
		const addQueueTemp = (tab_id, response) => addQueue(tab_id, response.url);
		browser.tabs.sendMessage(tab_id, {ctrl:'request-commons-url'}, addQueueTemp.bind(this, tab_id));
		return false;
	}
	return true;
};


/* --- ツリー登録ページにIDを送信 --- */
// const sendToContentsTree = url => {
// 	/* 動画IDを取得 */
// 	const regexp = /(?:www|commons)\.nicovideo\.jp\/(?:watch|tree)\/((?:sm|so)\d{1,20})/;
// 	let matches  = regexp.exec(url);
// 	if (matches === null || matches.length < 1) return;
// 	const video_id = matches[1];
// 	/* content-script側に送信 */
// 	browser.tabs.sendMessage(tab_id_tree, {ctrl:'add', id:video_id});
// 	ready = false;
// };


/* --- ツリー登録ページにIDを送信(初期/複数) --- */
const sendArrayToContentsTree = urls => {
	/* 動画IDを取得 */
	const regexp = /(?:www|commons)\.nicovideo\.jp\/(?:watch|tree)\/((?:sm|so)\d{1,20})/;
	let video_ids = [];
	for (let i in urls) {
		let matches  = regexp.exec(urls[i]);
		if (matches === null || matches.length < 1) continue;
		video_ids.push(matches[1]);
	}
	/* content-script側に送信 */
	if (video_ids.length > 0) {
		browser.tabs.sendMessage(tab_id_tree, {ctrl:'add', id:video_ids.join(' ')});
		ready = false;
	}
};
