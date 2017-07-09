var io = require('socket.io-client');
var socket = io.connect('http://192.168.1.108:3000');

// 保存全局用户id
var userId;
// 保存全局所有战书信息
var battles;

// 登录结果监听，通过登陆结果判断是否登陆成功
socket.on('loginResult', function (result) {
    console.log('\nIn loginResult listener:');
    var prefix = "\t";

    if (result.success) {
        userId = result.userId;
        console.log(prefix + JSON.stringify(result));

    } else {
        console.log('failed!!');
        console.log(result.text);
    }
});

socket.on('registerResult', function (result) {
    console.log('\nIn battleEstablishResult listener:');
    var prefix = "\t";

    if (result.success) {
        console.log(prefix + '注册成功, 用户id' + result.userId);
        userId = result.userId;
    } else {
        console.log(prefix + '注册失败');
        console.log(prefix + '原因：' + result.text);
    }
})
// 战书创建结果监听，创建战书后对服务器发来的战书创建结果进行监听
socket.on('battleEstablishResult', function (result) {
    console.log('\nIn battleEstablishResult listener:');
    var prefix = "\t";

    if (result.success) {
        console.log(prefix + result.text);
    } else {
        console.log(prefix + '创建失败，失败原因：' + result.text);
    }
});

// var battleRes = {
//     success: true,
//     battle
// }

// 应战结果监听，应战之后对服务器发送的是否可以应战进行监听
socket.on('joinBattleResult', function (result) {
    console.log('\nIn joinBattleResult listener:');
    var prefix = "\t";

    if (result.success) {
        // TODO 弹框显示应战成功等待发起者响应
        console.log(prefix + "应战成功等待发起者响应");
    } else {
        switch (result.battleState) {
            case 'INPROGRESS':
                console.log(prefix + '战斗已经开始，请刷新战书信息');
                break;

            case 'FINISHED':
                console.log(prefix + '战斗已经结束，请刷新战书信息');
        }
    }
});

// 接战监听，作为战书的发起者选择是否接收应战者的挑战
socket.on('acceptBattle', function (info) {
    console.log('\nIn acceptBattle listener:');
    var prefix = "\t";

    //TODO 弹出应战者信息，用户选择是否接受
    console.log(prefix + JSON.stringify(info));

    //TODO 创建英雄联盟房间名
    // 测试： 模拟接受挑战
    socket.emit('acceptBattleFeedBack', {
        accept: true,
        userId: userId,
        text: '打的你落花流水！',
        room: {
            name: '斗牛电竞房间1',
            password: '12345'
        }
    });
});

// 接战反馈监听，接战之后对发起者的应战信息进行监听
socket.on('acceptBattleFeedback', function (feedBack) {
    console.log('\nIn acceptBattleFeedback listener:');
    var prefix = "\t";

    if (feedBack.accept) {
        // TODO 如果存在 “等待对方响应” 的弹框则关闭弹框，如果不存在（用户以手动关闭）就开始进入房间
        console.log(prefix + JSON.stringify(feedBack));

        //TODO 获取英雄联盟的房间名和密码进入游戏房间
        console.log(prefix + '游戏开始');
    } else {
        // TODO 弹框显示拒绝信息
        console.log(prefix + JSON.stringify(feedBack));
    }
});

// 战书信息监听，获取从服务端传来的战书信息并进行展示
socket.on('battleInfos', function (battles) {
    console.log('\nIn battleInfos listener:');
    var prefix = "\t";

    battles = battles;
    for (var userId in battles) {
        console.log(prefix + 'Userid:' + userId);
        console.log(prefix + JSON.stringify(battles[userId]));
    }
});

// 对失败结果进行监听
socket.on('loseResult', function () {
    console.log('战败');
});

// 测试：登录
// socket.emit('login', {
//     userName: 'xing1',
//     password: '123456'
// });

// 测试：注册
socket.emit('register', {
    userName: 'colinyoung',
    tel: '18553358649',
    email: '1427714873@qq.com',
    password: '123456'
})

// 测试：刷新所有战书信息
socket.emit('battleInfoRefresh');

// 测试：测试下战书
setTimeout(function () {
    if (userId) {
        socket.emit('battleEstablish', {
            userId: userId,
            battleInfo: {
                name: '战书1',
                server: '比尔吉沃特',
                condition: '1血1塔100刀',
                type: '常规模式',
                declaration: '不服来战！',
                reward: {
                    type: '礼券',
                    amount: 100
                },
                date: '2017/7/6 10:53',
                state: 'WAITING'
            },
            recepient: null
        });
    }
}, 1000);

// 测试：接战
var initiatorId = '2';
setTimeout(function() {
    socket.emit('joinBattle', {
        initiatorId: initiatorId, //该信息在点击页面上的“应战”按钮之后获取发起者id
        recepientId: userId
    }); 
}, 2000);

// 测试：战斗结束，发送战斗结果
// TODO 判断达到胜利条件，弹出 “恭喜取得胜利” 提示框
setTimeout(function () {
    socket.emit('victoryResult', {
        userId: userId,
        win: userId,
        lose: initiatorId
    });
}, 3000);

