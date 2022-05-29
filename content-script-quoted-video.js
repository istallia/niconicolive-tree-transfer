/*
 * Copyright (C) 2021-2022 istallia
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* --- 引用動画を監視する --- */
if (typeof browser === 'undefined') browser = chrome;
const target   = document.querySelector('div[class^="___lock-item-area"]');
const observer = new MutationObserver(records => {
	for (let record of records) {
		/* 追加ノードの中に動画がないか確認、あればIDを出す */
		let video_id = null;
		for (let addedNode of record.addedNodes) {
			if (addedNode.tagName.toLowerCase() !== 'div' || addedNode.getAttribute('class').indexOf('___launch-item-area') !== 0) continue;
			const img = addedNode.querySelector('button > img');
			if (!img || !img.src || img.src.indexOf('https://nicovideo.cdn.nimg.jp/thumbnails/') !== 0) continue;
			const regexp = /\/(\d{1,20})\//;
			let matches  = regexp.exec(img.src);
			if (matches === null || matches.length < 1) continue;
			video_id = matches[1];
		}
		/* 出したIDをbackgroundに送信 */
		if (video_id !== null) {
			browser.runtime.sendMessage({ctrl:'add-quoted-video', url:'https://www.nicovideo.jp/watch/sm'+video_id});
		}
	}
});
observer.observe(target, {childList:true});