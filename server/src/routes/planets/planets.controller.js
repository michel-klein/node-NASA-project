const { getPlanets } = require('../../models/planets.model')

function getAllPlanets(req, res) {
    return res.status(200).json(getPlanets());
}

module.exports = {
    getAllPlanets,
}