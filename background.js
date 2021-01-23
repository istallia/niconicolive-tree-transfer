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
		ready        = false;
		queue        = [];
		sendResponse({is_working:false});
	}
	/* チャンネルに紐ついた動画のIDの処理 */
	if (message.ctrl === 'add-video-so') {
		sendToContentsTree(message.url);
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
			sendToContentsTree(tab.url);
		} else if (tab_id === tab_id_tree) {
			/* ツリー登録のURLか確認 */
			const regexp_2 = /commons\.nicovideo\.jp\/tree\/edit\/(lv\d{1,20})/;
			if (regexp_2.test(tab.url)) {
				ready = true;
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
const addQueue = (tab_id, url) => {
	/* URLの型チェック */
	if (typeof url === 'object') {
		queue = queue.concat(url.slice(0, -1).filter(page => checkURL(page)));
		addQueue(tab_id, url[url.length-1]);
		return;
	}
	/* URLのチェック */
	if (!checkURL(url)) return;
	/* URLを登録処理へ */
	queue.push(url);
	if (ready) {
		const adding_queue = queue.slice(0,10);
		queue              = queue.filter(url => adding_queue.indexOf(url) === -1);
		sendArrayToContentsTree(adding_queue);
	}
};


const checkURL = url => {
	/* URLのチェック */
	const regexp = /(?:www|commons)\.nicovideo\.jp\/(?:watch|tree)\/((?:sm|so)?\d{1,20})/;
	let matches  = regexp.exec(url);
	if (matches === null || matches.length < 1) return false;
	const video_id = matches[1];
	if (video_id.slice(0, 2) !== 'sm' && video_id.slice(0, 2) !== 'so') {
		/* コミュニティに紐ついてる動画かもしれないのでリクエストを送信 */
		browser.tabs.sendMessage(tab_id, {ctrl:'request-commons-url'}, response => {
			addQueue(tab_id, response.url);
		});
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
