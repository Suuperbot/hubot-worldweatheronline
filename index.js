var Path = require('path');

module.exports = function(robot) {
    var path = Path.resolve(__dirname, 'scripts');
    robot.load(path);
};
