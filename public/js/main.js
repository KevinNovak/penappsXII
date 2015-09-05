var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'gameDiv', { preload: preload, create: create, update: update, render: render });
var socket = io.connect('localhost:5000');
var sessionID = 0;
socket.on('connect', function (data) {
    console.log(data);
    sessionID = data;
    console.log(sessionID);
});
var UiPlayers = document.getElementById("players");
socket.on('count', function (data) {
    UiPlayers.innerHTML = 'Players: ' + data['playerCount'];
});
function preload() {
    game.load.tilemap('level1', '/resources/level1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles-1', '/resources/tiles-1.png');
    game.load.spritesheet('dude1', '/resources/dude.png', 32, 48);
    game.load.spritesheet('dude2', '/resources/dude2.png', 32, 48);
    game.load.spritesheet('dude3', '/resources/dude3.png', 32, 48);
    game.load.spritesheet('dude4', '/resources/dude4.png', 32, 48);
    game.load.spritesheet('droid', '/resources/droid.png', 32, 32);
    game.load.image('starSmall', '/resources/star.png');
    game.load.image('starBig', '/resources/star2.png');
    game.load.image('background', '/resources/background2.png');
    game.load.image('bullet', '/resources/purple_ball.png');
}
var map;
var tileset;
var layer;
var userPlayer = 0;
var players = [];
var facing = 'left';
var jumpTimer = 0;
var bg;
var cursors;
var spacebar;
var aKey;
var wKey;
var sKey;
var dKey;
var bullets;
var fireRate = 200;
var nextFire = 0;
function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = '#000000';
    bg = game.add.tileSprite(0, 0, 800, 600, 'background');
    bg.fixedToCamera = true;
    map = game.add.tilemap('level1');
    map.addTilesetImage('tiles-1');
    map.setCollisionByExclusion([13, 14, 15, 16, 46, 47, 48, 49, 50, 51]);
    layer = map.createLayer('Tile Layer 1');
    layer.resizeWorld();
    game.physics.arcade.gravity.y = 500;
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);
    for (var i = 0; i < 4; i++) {
        var spritePath = i % 4;
        spritePath = 'dude' + spritePath;
        players[i] = game.make.sprite(spritePath);
        game.physics.enable(players[i], Phaser.Physics.ARCADE);
        players[i].body.collideWorldBounds = true;
        players[i].body.setSize(20, 32, 5, 16);
        players[i].animations.add('left', [0, 1, 2, 3], 10, true);
        players[i].animations.add('turn', [4], 20, true);
        players[i].animations.add('right', [5, 6, 7, 8], 10, true);
    }
    players[userPlayer].x = 32;
    players[userPlayer].y = 32;
    game.camera.follow(players[userPlayer]);
    function addPlayer(p_id) {
    }
    cursors = game.input.keyboard.createCursorKeys();
    spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    socket.on('initialize', function (data) {
        console.log(data);
        sessionID = data.id;
        for (i in data.p_list) {
            addPlayer(data.p_list[i].p_id);
        }
        console.log("initialized");
    });
    socket.on('newPlayerwithPos', function (data) {
        console.log("newPlayerAdded");
        var obj = data;
        addPlayer(data);
    });
}
function update() {
    game.physics.arcade.collide(players, layer);
    game.physics.arcade.collide(bullets, layer, function (bullet, layer) {
        bullet.kill();
    });
    players[userPlayer].body.velocity.x = 0;
    if (cursors.left.isDown || aKey.isDown) {
        players[userPlayer].body.velocity.x = -150;
    }
    else if (cursors.right.isDown || dKey.isDown) {
        players[userPlayer].body.velocity.x = 150;
    }
    else {
        if (facing != 'idle') {
            players[userPlayer].animations.stop();
            if (facing == 'left') {
                players[userPlayer].frame = 0;
            }
            else {
                players[userPlayer].frame = 5;
            }
            facing = 'idle';
        }
    }
    if ((spacebar.isDown || cursors.up.isDown || wKey.isDown) && players[userPlayer].body.onFloor() && game.time.now > jumpTimer) {
        players[userPlayer].body.velocity.y = -300;
        jumpTimer = game.time.now + 750;
    }
    if (game.input.activePointer.isDown) {
        fire();
    }
    var impulse = players[userPlayer].body.velocity;
    var vector = {
        sessionID: sessionID,
        impulse: players[userPlayer].body.velocity
    };
    socket.emit('playerImpulse', vector);
}
function fire() {
    if (game.time.now > nextFire && bullets.countDead() > 0) {
        nextFire = game.time.now + fireRate;
        var bullet = bullets.getFirstDead();
        bullet.reset(players[userPlayer].x + 10, players[userPlayer].y + 20);
        game.physics.arcade.moveToPointer(bullet, 700);
    }
}
function render() {
    if (game.input.x < players[userPlayer].x - game.camera.x) {
        if (facing != 'left') {
            players[userPlayer].animations.play('left');
            facing = 'left';
        }
    }
    else {
        if (facing != 'right') {
            players[userPlayer].animations.play('right');
            facing = 'right';
        }
    }
}
