// 视频搜索页

// 加载js
const WxSearch = require('../../wxSearchView/wxSearchView.js');

const app = getApp();

Page({
	data: {},
	// 页面加载
	onLoad: function (params) {
		const that = this;
		const serverUrl = app.serverUrl;

		// 查询热搜词
		wx.request({
			url: serverUrl + '/video/hot',
			method: "POST",
			success: function (res) {
				console.log(res);
				// 获取热搜词列表
				const hotList = res.data.data;

				// 初始化搜索框
				WxSearch.init(
					that, // 本页面一个引用
					hotList, // 热点搜索推荐，[]表示不使用
					hotList, // 搜索匹配，[]表示不使用
					that.mySearchFunction, // 提供一个搜索回调函数
					that.myGobackFunction //提供一个返回回调函数
				);
			}
		})
	},
	// [搜索框] 转发函数，固定部分，直接拷贝即可
	wxSearchInput: WxSearch.wxSearchInput, // 输入变化时的操作
	wxSearchKeyTap: WxSearch.wxSearchKeyTap, // 点击提示或者关键字、历史记录时的操作
	wxSearchDeleteAll: WxSearch.wxSearchDeleteAll, // 删除所有的历史记录
	wxSearchConfirm: WxSearch.wxSearchConfirm, // 搜索函数
	wxSearchClear: WxSearch.wxSearchClear, // 清空函数

	// [搜索框] 搜索回调函数  
	mySearchFunction: function (value) {
		// do your job here
		// 示例：跳转
		wx.redirectTo({
			url: '../index/index?isSaveRecord=1&search=' + value
		})
	},

	// [搜索框] 返回回调函数
	myGobackFunction: function () {
		// do your job here
		// 示例：返回
		wx.redirectTo({
			url: '../index/index'
		})
	}
});