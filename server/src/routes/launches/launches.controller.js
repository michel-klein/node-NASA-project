const { getLaunches } = require('../../models/launches.model')

function getAllLaunches(req, res) {
    return res.status(200).json(getLaunches());
}

module.exports = {
    getAllLaunches,
}