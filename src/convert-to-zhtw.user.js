// ==UserScript==
// @name         簡繁轉換
// @description  將網站中的簡體字詞轉換成繁體字詞
// @license      MIT
// @author       Poy Chang
// @homepage     https://blog.poychang.net
// @version      0.2.4
// @updateURL    https://raw.githubusercontent.com/poychang/userscripts/main/src/convert-to-zhtw.user.js
// @match        *://*/*
// @exclude      http://*.tw/*
// @exclude      https://*.tw/*
// 更多關於簡繁轉換的資料可以參考同文堂所提供的資料：https://github.com/tongwentang/tongwen-dict
// ==/UserScript==

let s2tChar = {};
let s2tPhrase = {};
// 使用同文堂 v1.0.1 版的轉換字典
const url = (filename) =>
    `https://www.unpkg.com/tongwen-dict@1.0.1/dist/${filename}`;
const loadDict = () =>
    fetch(url("manifest.json"))
        .then((res) => res.json())
        // 取得 manifest.json 中所提供的檔案列表，僅取得 s2t （簡轉繁）的字典
        .then((manifest) =>
            Promise.all(
                manifest.dicts
                    .filter((d) => d.min)
                    .filter((d) => d.filename.substring(0, 3) === "s2t")
                    .map((d) => url(d.filename))
            )
        )
        .then((urls) => {
            // console.log(urls);
            // https://www.unpkg.com/tongwen-dict@1.0.0/dist/s2t-char.min.json
            // https://www.unpkg.com/tongwen-dict@1.0.0/dist/s2t-phrase.min.json
            return urls;
        })
        // 將取得的 URL 所回傳的 json 資料，並且保存到 s2tChar 和 s2tPhrase
        .then((urls) =>
            Promise.all(urls.map((url) => fetch(url).then((res) => res.json())))
        )
        .then(([s2t_char, s2t_phrase]) => {
            s2tChar = s2t_char;
            s2tPhrase = s2t_phrase;
            // console.log("s2tChar:", s2tChar);
            // console.log("s2tPhrase:", s2tPhrase);
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
        });

// 詞彙轉換
function toTrad(itxt) {
    var txt = "",
        s = "",
        bol = true,
        leng = 5;
    for (var i = 0, c = itxt.length; i < c; ) {
        bol = true;
        for (var j = leng; j > 1; j--) {
            s = itxt.substr(i, j);
            if (s in s2tPhrase) {
                txt += s2tPhrase[s];
                i += j;
                bol = false;
                break;
            }
        }

        if (bol) {
            s = itxt.substr(i, 1);
            txt += s in s2tChar ? s2tChar[s] : s;
            i++;
        }
    }
    if (txt != "") itxt = txt;

    return itxt;
}

function convert(node) {
    var treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    var textNode;
    while ((textNode = treeWalker.nextNode())) {
        // console.log(textNode.nodeValue)
        textNode.nodeValue = toTrad(textNode.nodeValue);
    }
}

(function () {
    "use strict";
    loadDict().then(() => {
        convert(window.document.body);

        const callback = (mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (
                    mutation.type == "childList" &&
                    mutation.addedNodes.length > 0
                ) {
                    Array.from(mutation.addedNodes).find((node) => {
                        convert(node);
                    });
                }
            });
        };
        const observer = new MutationObserver(callback);
        observer.observe(document.body, { childList: true, subtree: true });
    });
})();
