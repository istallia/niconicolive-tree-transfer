/* 各種情報を取得 --- */
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
					const option = document.createElement('option');
					option.value = String(i);
					option.innerText = tabs_video[i].title;
					select.appendChild(option);
				}
			});
			/* 要素を表示 */
			document.getElementById('start').classList.add('visible');
		}
	});
});
