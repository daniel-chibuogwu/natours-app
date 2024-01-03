const fs = require("fs");

const users = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/users.json`, 'utf-8'));

exports.getAllUsers = (req, res) => {
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: users.length,
        data: {
            users,
        },
    });
}
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!',
    })
};
exports.getUser = (req, res) => {
    const id = req.params.id;
    const user = users.find((el) => el._id === id);
    if(!user) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID',
        });
    }
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
}
exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!',
    })
}
exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!',
    })
}
