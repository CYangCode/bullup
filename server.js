var io = require('socket.io')();
var dbUtil = require("./util/dbutil.js");

/**
 * 维护用户id与通信连接
 * {用户id：socket}
 */
var userSocketMap = {};
/* 维护战书信息，结构为
{
用户id：战书详情
    '123456': {battle...}
}*/
var battleCache = {};


io.on('connection', function (socket) {
    console.log('User ' + socket.id + ' has connected!');

    handleUserLogin(socket);

    handleUserRegister(socket);

    handleBattleEstablish(socket);

    handleBattleRefresh(socket);

    handleJoinBattle(socket);

    handleVictory(socket);
});

io.listen(3000);

/**
 * 处理用户登录逻辑
 * @param {*} socket
 */
function handleUserLogin(socket) {
    // 注册用户登录监听
    socket.on('login', function (data) {
        dbUtil.findUserByNick(data.userName, function (user) {
            // 对客户端发送过来的登录信息进行验证
            if (!user || user.password != data.password) {
                // 登录失败
                socket.emit('loginResult', {
                    success: false,
                    text: '登录失败，请检验用户名密码！',
                    userId: -1
                });
            } else {
                // 维护userSocket
                userSocketMap[user.user_id] = socket;
                socket.emit('loginResult', {
                    success: true,
                    text: '登录成功',
                    userId: user.user_id
                });
            }
        });

    });
}

/**
 * 处理用户注册
 * @param {*} socket 
 */
function handleUserRegister(socket) {
    socket.on('register', function (userInfo) {
        dbUtil.findUserByNick(userInfo.userName, function (result){
            if (result) {
                // 如果该用户存在
                socket.emit('registerResult', {
                    success: false,
                    text: '该用户已注册',
                    userId: -1
                });
            } else {
                dbUtil.addUser(userInfo, function (userId) {
                    
                    socket.emit('registerResult', {
                        success: true,
                        text: '注册成功',
                        userId: userId
                    });
                });
            }
        });
    });
}

/**
 * 处理战书创建请求
 * @param {*} socket 
 */
function handleBattleEstablish(socket) {
    socket.on('battleEstablish', function (battle) {
        // 当前用户已经创建战书
        if (battleCache[battle.userId]) {
            socket.emit('battleEstablishResult', {
                success: false,
                text: '战书已经创建'
            });
            return;
        }

        battleCache[battle.userId] = battle.battleInfo;

        console.log(JSON.stringify(battleCache));

        // 保存连接和用户id
        userSocketMap[battle.userId] = socket;

        // 返回创建结果
        socket.emit('battleEstablishResult', {
            success: true,
            text: '战书创建成功'
        });

        socket.emit('battleInfos', battleCache);
    });
}

/**
 * 处理战书刷新请求，向客户端发送所有存在的战书信息
 * @param {*} socket 
 */
function handleBattleRefresh(socket) {
    socket.on('battleInfoRefresh', function () {
        socket.emit('battleInfos', battleCache);
    });
}
/**
 * 处理战书取消，清除缓存中
 * @param {*} socket 
 */
function handleBattleCancel(socket) {
    socket.on('battleCancel', function (battle) {
        // 清空服务器对该战书信息的缓存
        battleCache[battle.userId] = null;
    });
}

/**
 * 处理接战请求
 * @param {*} socket 
 */
function handleJoinBattle(socket) {
    socket.on('joinBattle', function (battle) {
        // 如果不存在该对局
        if (!battleCache[battle.initiatorId]) {
            socket.emit('joinBattleResult', {
                success: false,
                text: '该战书已经撤销'
            });
        } else {
            var battleState = battleCache[battle.initiatorId].state;

            if (battleState == 'WAITING') {
                // 战书状态为等待，向发起者发送“应战成功”
                socket.emit('joinBattleResult', {
                    success: true,
                    battleState: 'WAITING'
                });

                // 查询数据库并将应战者信息发送给发起者
                dbUtil.findUserById(battle.recepientId, function (user) {
                    // 通过userSocketMap找到发起者的socket
                    userSocketMap[battle.recepientId].emit('acceptBattle', 
                    {
                        recepient:{
                            id: user.user_id,
                            nickname: user.nick_name
                        } 

                    });
                    // 处理发起者传来的反馈，根据反馈更新战书信息和战书状态
                    userSocketMap[battle.recepientId].on('acceptBattleFeedBack', function(feedBack) {
                        // 反馈为接收，则更新状态
                        if (feedBack.accept) {
                            // 更新缓存中战书的接受者信息
                            battleCache[feedBack.userId].recepient = {
                                id: user.user_id,
                                nickname: user.nick_name,
                                socket: userSocketMap[user.user_id]
                            };
                            // 更新战斗状态
                            battleCache[battle.initiatorId].state = 'INPROGRESS';
                            // 向发起者发送反馈信息
                            userSocketMap[user.user_id].emit('acceptBattleFeedback', feedBack);

                        } else {
                            userSocketMap[user.user_id].emit('acceptBattleFeedback', feedBack);
                        }
                    });
                });
            } else {
                socket.emit('joinBattleResult', {
                        success: false,
                        battleState: battleState
                    });
            }
        }
    });
}

/**
 * 处理战斗结果
 * @param {*} socket 
 */
function handleVictory(socket) {
    socket.on('victoryResult', function (result) {
        // 获取缓存中的战书信息，更改缓存中的战书状态
        var index = battleCache[result.win]? result.win: result.lose;
        if (battleCache[index]) {
            battleCache[index].state = 'FINISHED';
            // 向失败者发送失败信息
            userSocketMap[result.lose].emit('loseResult');
            // TODO 将已完结的战书信息放入数据库
        } 

    });
}