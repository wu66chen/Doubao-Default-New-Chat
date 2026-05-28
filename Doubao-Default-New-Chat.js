// ==UserScript==
// @name         豆包默认新对话
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动拦截并跳出默认的“豆包”对话，强制每次进入豆包主站都开启全新空白对话。首次运行自动配置。
// @author       Wesley
// @match        *://*.doubao.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @license      MIT
// ==/UserScript==
 
(function() {
    'use strict';
 
    // 核心函数：弹窗引导用户配置 ID
    function setupTargetId(isManual = false) {
        // 尝试从当前地址栏智能提取 ID（方便小白用户）
        let guessId = '';
        const currentMatch = location.href.match(/\/chat\/(\d+)/);
        if (currentMatch) {
            guessId = currentMatch[1];
        }
 
        const currentSaved = GM_getValue('doubao_target_id', '');
        const promptText = "【豆包默认新对话脚本-配置】\n\n请输入你需要拦截的 “豆包” 对话 ID ：\n\n💡 提示：如果你当前正停留在“豆包”对话中，系统已为你自动填入，直接点确定即可";
 
        // 弹出输入框
        let userInput = prompt(promptText, guessId || currentSaved);
 
        if (userInput !== null && userInput.trim() !== '') {
            // 智能提取数字 ID（兼容用户直接粘贴完整 URL 的情况）
            let finalId = userInput.trim();
            const urlMatch = finalId.match(/\/chat\/(\d+)/);
            if (urlMatch) {
                finalId = urlMatch[1];
            } else {
                const digitMatch = finalId.match(/(\d+)/);
                if (digitMatch) finalId = digitMatch[1];
            }
 
            GM_setValue('doubao_target_id', finalId);
            alert(`✅ 设置成功！\n\n以后一旦豆包试图进入 ID 为【${finalId}】的对话，脚本将自动为你拦截并开启新对话。\n\n如需修改，请点击浏览器右上角油猴插件图标，在管理面板的菜单中选择“⚙️ 重新设置拦截 ID”。`);
            return finalId;
        } else if (isManual) {
            alert("❌ 未输入任何内容，设置已取消。");
        }
        return currentSaved;
    }
 
    // 注册油猴菜单命令（方便用户随时修改配置）
    GM_registerMenuCommand("⚙️ 重新设置拦截 ID", () => {
        targetOldId = setupTargetId(true);
    });
 
    // 读取已保存的 ID，如果没有，则触发首次配置
    let targetOldId = GM_getValue('doubao_target_id', null);
 
    if (!targetOldId) {
        // 延迟1秒弹窗，避免页面还没加载完影响体验
        setTimeout(() => {
            targetOldId = setupTargetId(false);
            if (!targetOldId) {
                console.warn('【豆包拦截器】未配置目标 ID，脚本处于休眠状态。');
            }
        }, 1000);
    }
 
    // --- 以下为自动触发新对话的核心拦截逻辑 ---
 
    function clickNewChat() {
        if (!targetOldId) return; // 如果用户没设置ID，不执行拦截
 
        // 方案 1：在网页中寻找“新对话”的按钮并自动点击
        const elements = document.querySelectorAll('*');
        for (let el of elements) {
            if (el.textContent === '新对话' && el.children.length === 0) {
                el.click();
                if(el.parentElement) el.parentElement.click();
                console.log('油猴拦截：已成功自动点击新对话');
                return;
            }
        }
 
        // 方案 2（备用兜底）：如果没找到按钮，直接向页面派发全局快捷键 (Mac: Cmd+K, Win: Ctrl+K)
        const isMac = navigator.userAgent.includes('Mac OS X');
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'k',
            code: 'KeyK',
            keyCode: 75,
            ctrlKey: !isMac,
            metaKey: isMac,
            bubbles: true
        }));
        console.log('油猴拦截：已发送快捷键开启新对话');
    }
 
    // 监听网址的动态变化（单页应用路由监听）
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (!targetOldId) return;
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            // 发现网址变更为目标 ID，立刻触发拦截
            if (url.includes(`/chat/${targetOldId}`)) {
                setTimeout(clickNewChat, 300);
                setTimeout(clickNewChat, 1000);
            }
        }
    }).observe(document, {subtree: true, childList: true});
 
    // 兜底逻辑：处理用户直接手动把旧网址粘贴进地址栏按回车的情况
    window.addEventListener('load', () => {
        if (targetOldId && location.href.includes(`/chat/${targetOldId}`)) {
            setTimeout(clickNewChat, 500);
            setTimeout(clickNewChat, 1500);
        }
    });
 
})();