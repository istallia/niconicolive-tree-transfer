/* --- 各種情報を取得 --- */
let is_working   = false;
let tab_id_video = null;
let tab_id_tree  = null;
let live_id      = null;
let tabs_video   = [{id:null, title:'(タブを指定しない)'}];
if (typeof browser === 'undefined') browser = chrome;
document.addEventListener('DOMContentLoaded', event => {
	browser.runtime.sendMessage({ctrl:'get-status'}, response => {
		working = Boolean(response.is_working);
		if (working) {
			tab_id_video = response.tab_id_video;
			tab_id_tree  = response.tab_id_tree;
			live_id      = response.live_id;
		} else {
			/* ニコ生IDを取得 */
			browser.tabs.query({active:true,currentWindow:true}, tabs => {
				/* ニコ生IDを取得 */
				const regexp = /live\d\.nicovideo\.jp\/watch\/(lv\d{1,20})/;
				let matches  = regexp.exec(tabs[0].url);
				if (matches === null || matches.length < 1) {
					/* 開いているタブがニコ生ではない場合 */
					document.getElementById('none').classList.add('visible');
					return;
				}
				live_id = matches[1];
				/* ニコニコ動画を開いているタブを取得 */
				browser.tabs.query({url:'*://www.nicovideo.jp/watch/*'}, tabs => {
					for (let i in tabs) {
						tabs_video.push({
							id    : tabs[i].id,
							title : tabs[i].title.replace(/ - ニコニコ動画$/g, '')
						});
					}
					const select = document.getElementById('nicovideo-tabs');
					for (let i in tabs_video) {
						const option     = document.createElement('option');
						option.value     = String(i);
						option.innerText = tabs_video[i].title;
						select.appendChild(option);
					}
				});
				/* 開始ボタンにイベント登録 */
				document.getElementById('start-transfer').addEventListener('click', () => {
					/* 各タブのID取得(ツリー登録ページは新しく開く) */
					tab_id_video = Number( document.getElementById('nicovideo-tabs').value );
					tab_id_video = tabs_video[tab_id_video].id;
					browser.tabs.create({
						active : false,
						url    : 'https://commons.nicovideo.jp/tree/edit/' + live_id
					}, tab => {
						tab_id_tree = tab.id;
						/* 取得したIDたちをbackgroundに送信 */
						browser.runtime.sendMessage({
							ctrl         : 'start-transfer',
							live_id      : live_id,
							tab_id_video : tab_id_video,
							tab_id_tree  : tab_id_tree
						}, response => {
							is_working = true;
							document.getElementById('start').classList.remove('visible');
							document.getElementById('working').classList.add('visible');
						});
					});
				});
				/* 要素を表示 */
				document.getElementById('start').classList.add('visible');
			});
		}
	});
});
