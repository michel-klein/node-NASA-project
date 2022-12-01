const express = require('express');
const { getAllLaunches, httpAddNewLaunch } = require('./launches.controller');

const launchesRouter = express.Router();

launchesRouter.get('/', getAllLaunches);
launchesRouter.post('/', httpAddNewLaunch);

module.exports = launchesRouter;