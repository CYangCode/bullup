var user = {
    userName: 'colinyoung',
    tel: '18553358649',
    email: '1427714873@qq.com',
    password: '123456'
};

var dbUtil = require('./util/dbutil.js');
dbUtil.addUser(user, function(insertId) {
    console.log(insertId);
});