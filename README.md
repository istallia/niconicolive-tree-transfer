# niconicolive-tree-transfer

ニコ生にてBGMとしてニコ動を裏で流す際、指定タブ(ニコ動)で開いた動画を自動でコンテンツツリーに登録するChrome拡張機能/Firefoxアドオン


## ほしいUI

- ニコ生の放送ページでアイコンをクリック、ポップアップでタブを指定
	- タブはドロップダウンから選択(「すべて」という選択肢もあっていい？)
- 「自動転送」で動作開始
	- 当該ニコ生のツリー登録ページを即座に開く
	- 転送が行われると1件追加して送信、完了すると元の登録ページに戻る
- 転送対象のタブ(ニコ動 or ツリー登録ページ)を閉じると動作終了
- 「転送停止」ボタンでも動作終了させたい


## 実現のためのメモ

- ニコ動のタブのみを取得するには`browser.tabs.query`を使う
	- オプションは`{url:'*://www.nicovideo.jp/watch/*'}`
	- 表示するタイトルは`tab.title`から取得できる。末尾の「 - ニコニコ動画」を除いて表示する(タイトルが長い場合は考える)
	- 指定タブのID(数値/null)およびアクティブなタブのID(lv～)はbackgroundのsessionStorageに保存する
		- ニコ生のURLは`https://live2.nicovideo.jp/watch/*`なので、取得方法は動画とほぼ同じ
		- 登録済の動画はツリー登録ページ側で弾くので、転送段階ではフィルタしない
	- ツリー登録ページのタブのID(数値)は`browser.tabs.create`のコールバックで取得しておき、backgroundのsessionStorageに保存	
	- 自動転送が有効かもtrueかnullでsessionStorageに保存
- タブの更新を見るにはbackgroundで`browser.tabs.onUpdated`を見る
	- `changeInfo.status`がcomplete && `tabId`が指定タブ(nullは一致扱い) && `tab.url`がニコ動 の条件でそのタブの動画IDを転送する
	- backgroundからツリー登録ページのcontent-scriptにIDを送るには`browser.tabs.sendMessage`を使う
- ツリー登録ページのcontent-scriptはイベントを待ち、メッセージが来たらそのIDの作品を親作品欄に投げ込む
	- 投げ込み方法は「コンテンツツリー登録支援ツール」のテストスクリプトを参照
	- 投げ込んだら登録ボタンを押して送信する(戻るのはbackgroundの仕事。`browser.tabs.update`でできる)
- タブが閉じられたことを検知するには`browser.tabs.onRemoved`を使う
	- タブのIDのどちらかに一致すれば自動転送を終了する
