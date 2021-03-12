// 视频信息页

// 获取全局app信息
const app = getApp();

// 视频工具类
const videoUtil = require('../../utils/videoUtils.js');

Page({
    data: {
        cover: "cover", // 对视频进行拉伸
        videoId: "", // 视频id
        src: "", // 视频播放地址，静态资源
        videoInfo: {}, // 视频信息

        userLikeVideo: false, // 用户视频喜欢该视频

        commentsPage: 1, // 当前评论页面
        commentsTotalPage: 1, // 评论总页数
        commentsList: [], // 评论列表

        placeholder: '说点什么…' // 输入框提示信息
    },
    // 视频播放组件
    videoCtx: {},
    // 定义页面加载时的动作
    onLoad: function (params) {
        const that = this;

        // 创建视频播放组件
        that.videoCtx = wx.createVideoContext('myVideo', that);

        // 获取上一个页面传入的参数
        const videoInfo = JSON.parse(params.videoInfo);

        const height = videoInfo.videoHeight;
        const width = videoInfo.videoWidth;
        let cover = "cover";

        // 当是横屏的视频，不对画面进行裁剪
        if (width >= height) {
            cover = "";
        }

        that.setData({
            videoId: videoInfo.id,
            src: app.serverUrl + videoInfo.videoPath,
            videoInfo: videoInfo,
            cover: cover
        });

        const serverUrl = app.serverUrl;
        // 尝试获取全局用户信息，如果登陆过，那么userInfo就不为空，否则为空；
        const userInfo = app.getGlobalUserInfo();
        // 登陆用户id
        let loginUserId = "";
        
        if (userInfo) {
            loginUserId = userInfo.id;
        }

        // 调用后端，查询发布者
        wx.request({
            url: `${serverUrl}/user/queryPublisher?loginUserId=${loginUserId}&videoId=${videoInfo.id}&publishUserId=${videoInfo.userId}`,
            method: "POST",
            success(res) {
                console.log(res.data);

                // 发布者
                const publisher = res.data.data.publisher;
                // 用户是否喜欢该视频
                const userLikeVideo = res.data.data.userLikeVideo;

                that.setData({
                    serverUrl: serverUrl,
                    publisher: publisher,
                    userLikeVideo: userLikeVideo
                });
            }
        });

        // 加载评论列表
        that.getCommentsList(1);
    },
    // 页面展示时
    onShow: function () {
        const that = this;
        // 启动视频播放
        that.videoCtx.play();
    },
    // 页面隐藏时
    onHide: function () {
        const that = this;
        // 暂停视频播放
        that.videoCtx.pause();
    },
    // 展示搜索页面
    showSearch: function () {
        // 跳转到搜索视频页面
        wx.navigateTo({
            url: '../searchVideo/searchVideo',
        })
    },
    // 展示视频发布者信息
    showPublisher: function () {
        const that = this;

        // 获取全局用户信息
        const userInfo = app.getGlobalUserInfo();

        // 视频信息
        const videoInfo = that.data.videoInfo;
        // 真实发布地址
        const realUrl = '../mine/mine#publisherId@' + videoInfo.userId;

        if (!userInfo) {
            // 没有全局用户信息时跳转到登录页
            wx.navigateTo({
                url: '../userLogin/login?redirectUrl=' + realUrl
            });
        } else {
            // 已登录时，跳转到我的页面，展示发布者信息
            wx.navigateTo({
                url: '../mine/mine?publisherId=' + videoInfo.userId
            });
        }
    },
    // 上传视频
    upload: function () {
        const that = this;

        // 获取全局用户信息
        const userInfo = app.getGlobalUserInfo();

        // 将视频信息变成字符串
        const videoInfo = JSON.stringify(that.data.videoInfo);
        // 真实视频信息地址
        const realUrl = '../videoinfo/videoinfo/#videoInfo@' + videoInfo;

        if (!userInfo) {
            // 未登录时跳转到登录页
            wx.navigateTo({
                url: '../userLogin/login/redirectUrl=' + realUrl
            });
        } else {
            // 已登录时，进行视频上传
            videoUtil.uploadVideo();
        }
    },
    // 跳转到首页
    showIndex: function () {
        wx.redirectTo({
            url: '../index/index'
        })
    },
    // 显示我的页面
    showMine: function () {
        // 获取全局用户信息
        const userInfo = app.getGlobalUserInfo();

        if (!userInfo) {
            // 未登录时跳转到登录页
            wx.navigateTo({
                url: '../userLogin/login'
            });
        } else {
            // 已登录时，跳转到我的页面
            wx.navigateTo({
                url: '../mine/mine'
            })
        }
    },
    // 是否给该视频点赞
    likeVideoOrNot: function () {
        const that = this;

        // 视频信息
        const videoInfo = that.data.videoInfo;
        // 尝试获取全局用户信息，如果用户已经登陆过，那么userInfo不为空；
        const userInfo = app.getGlobalUserInfo();

        if (!userInfo) {
            // 未登录时跳转到登录页
            wx.navigateTo({
                url: '../userLogin/login'
            });
        } else {
            // 已登录时，判断用户是否点赞并进行数据更新
           const userLikeVideo = that.data.userLikeVideo;

           // 将请求的地址
           let url = `/video/userLike?userId=${userInfo.id}&videoId=${videoInfo.id}&videoCreatorId=${videoInfo.userId}`;
            if (userLikeVideo) {
                url = `/video/userUnLike?userId=${userInfo.id}&videoId=${videoInfo.id}&videoCreatorId=${videoInfo.userId}`;
            }

            const serverUrl = app.serverUrl;

            // 展示提示框
            wx.showLoading({
                title: '请等待…'
            });

            // 网络请求
            wx.request({
                url: serverUrl + url,
                method: "POST",
                header: {
                    'content-type': 'application/json', // 默认值
                    'headerUserId': userInfo.id,
                    'headerUserToken': userInfo.userToken
                },
                success(res) {
                    // 隐藏提示框
                    wx.hideLoading();

                    that.setData({
                        userLikeVideo: !userLikeVideo
                    });
                }
            })
        }
    },
    // 分享视频
    shareMe: function () {
        const that = this;

        // 获取全局用户信息
        const userInfo = app.getGlobalUserInfo();

        // 展示选项列表
        wx.showActionSheet({
            itemList: ['下载到本地', '举报用户', '分享到朋友圈', '分享到QQ空间', '分享到微博'],
            success(res) {
                console.log(res.tapIndex);

                // 用户点赞选项的下标
                const tapIndex = res.tapIndex;

                if (tapIndex === 0) {
                    // 下载
                    wx.showLoading({
                        title: '下载中…'
                    });

                    // 下载文件
                    wx.downloadFile({
                        url: app.serverUrl + that.data.videoInfo.videoPath,
                        success(res) {
                            // 只要服务器有数据响应，就会把响应内容写入文件，并进行success回调
                            if (res.statusCode === 200) {
                                console.log(res.tempFilePath);

                                // 保存视频到相册
                                wx.saveVideoToPhotosAlbum({
                                    filePath: res.tempFilePath,
                                    success(errMsg) {
                                        console.log(errMsg);
                                        // 隐藏进度加载条
                                        wx.hideLoading();
                                    }
                                })
                            }
                        }
                    })
                } else if (tapIndex === 1) {
                    // 举报
                    const videoInfo = JSON.stringify(that.data.videoInfo);
                    const realUrl = '../videoinfo/videoinfo#videoInfo@' + videoInfo;

                    if (!userInfo) {
                        // 未登录时跳转到登录页
                        wx.navigateTo({
                            url: '../userLogin/login?redirectUrl=' + realUrl
                        });
                    } else {
                        // 已登录时，传递参数，并跳转到举报页面

                        // 视频发布者id
                        const publishUserId = that.data.videoInfo.userId;
                        // 视频id
                        const videoId = that.data.videoInfo.id;

                        wx.navigateTo({
                            url: `../report/report?videoId=${videoId}&publishUserId=${publishUserId}`
                        })
                    }
                } else {
                    // 其他选项
                    wx.showToast({
                        title: '官方暂未开放…'
                    })
                }
            }
        })
    },
    // 分享App消息
    onShareAppMessage: function (res) {
        var that = this;
        var videoInfo = that.data.videoInfo;

        return {
            title: '短视频内容分析',
            path: "pages/videoinfo/videoinfo?videoInfo=" + JSON.stringify(videoInfo)
        }
    },
    // 评论按钮点击事件
    leaveComment: function () {
        // 设置让评论输入框获取焦点
        this.setData({
            commentFocus: true
        });
    },
    // 回复评论
    replyFocus: function (e) {
        // 父评论id
        const fatherCommentId = e.currentTarget.dataset.fathercommentid;
        // 被评论者id
        const toUserId = e.currentTarget.dataset.touserid;
        // 被评论者昵称
        const toNickname = e.currentTarget.dataset.tonickname;

        this.setData({
            placeholder: '回复 ' + toNickname,
            replyFatherCommentId: fatherCommentId,
            replyToUserId: toUserId,
            commentFocus: true // 聚焦到对话框
        });
    },
    // 保存用户评论
    saveComment: function (e) {
        const that = this;

        // 获取用户输入的评论
        const content = e.detail.value;

        // 获取评论恢复的fatherCommentId（父评论的id）和toUserId（被评论者的id）
        const fatherCommentId = e.currentTarget.dataset.replyfathercommentid;
        const toUserId = e.currentTarget.dataset.replytouserid;

        // 获取全局用户信息
        const userInfo = app.getGlobalUserInfo();
        const videoInfo = JSON.stringify(that.data.videoInfo);
        const realUrl = '../videoinfo/videoinfo#videoInfo@' + videoInfo;

        if (!userInfo) {
            // 未登录时跳转到登录页
            wx.navigateTo({
                url: '../userLogin/login?redirectUrl=' + realUrl
            });
        } else {
            // 已登录时，保存评论内容
            wx.showLoading({
                title: '请稍候…'
            });

            wx.request({
                url: `${app.serverUrl}/video/saveComment?fatherCommentId=${fatherCommentId}&toUserId=${toUserId}`,
                method: "POST",
                header: {
                    'content-type': 'application/json', // 默认值
                    'headerUserId': userInfo.id,
                    'headerUserToken': userInfo.userToken
                },
                data: {
                    fromUserId: userInfo.id, // 当前用户id
                    videoId: that.data.videoInfo.id, // 视频id
                    comment: content // 评论内容
                },
                success(res) {
                    console.log(res.data);
                    wx.hideLoading(); // 隐藏进度加载框

                    // 清空输入框的内容和评论列表
                    that.setData({
                        contentValue: '',
                        commentsList: []
                    });

                    // 请求第一页的评论列表
                    that.getCommentsList(1);
                }
            })
        }
    },
    // 获取评论列表
    getCommentsList: function (page) {
        const that = this;

        // 视频id
        const videoId = that.data.videoInfo.id;

        wx.request({
            url: `${app.serverUrl}/video/getVideoComments?videoId=${videoId}&page=${page}&pageSize=5`,
            method: "POST",
            success(res) {
                console.log(res);

                // 获取请求的评论列表
                const commentsList = res.data.data.rows;
                const oldCommentsList = that.data.commentsList;

                // 合并评论列表
                that.setData({
                    commentsList: oldCommentsList.concat(commentsList),
                    commentsPage: page,
                    commentsTotalPage: res.data.data.total
                })
            }
        })
    },
    // 滑动到页面底部
    onReachBottom: function () {
        const that = this;

        // 当前页数
        const currentPage = that.data.commentsPage;
        // 总页数
        const totalPage = that.data.commentsTotalPage;

        // 到达最后一页
        if (currentPage === totalPage) {
            return;
        }

        // 请求下一页的数据
        const page = currentPage + 1;
        that.getCommentsList(page);
    }
});
