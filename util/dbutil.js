var mysql = require('mysql');

var config = {
    host: '192.168.1.102',
    user: 'admin',
    password: '123456',
    database: 'bullup'
};

connection = mysql.createConnection(config);

connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('Mysql connected as id ' + connection.threadId);
});

/**
 * 通过用户名获取用户
 * @param nickname 用户名
 */
exports.findUserByNick = function(nickname, callback) {
    connection.query('select * from `user` where nick_name=?', [nickname], function (err, results, fields){
        if (err) throw err;
        callback(results[0]);
    });
}

/**
 * 通过id获取用户
 * @param userId
 */
exports.findUserById = function(userId, callback) {
    connection.query('select * from `user` where user_id=?', [userId], function (err, results, fields) {
        if (err) throw err;
        callback(results[0]);
    })
}

/**
 * 插入用户信息
 * @param userInfo 用户信息，格式：{userName: 'cy', password: '123', tel: '123', email: '123@qq.com'}
 */
exports.addUser = function(userInfo, callback) {
    connection.query('insert into `user` (nick_name, password, mobile_no, email) values (?, ?, ?, ?)', 
        [userInfo.userName, userInfo.password, userInfo.tel, userInfo.email], function (err, rows) {
            if (err) {
                connection.rollback();
            }

            var insertId = rows.insertId;
            callback(insertId);
        });
}