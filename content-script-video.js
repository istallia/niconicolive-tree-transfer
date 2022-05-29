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
