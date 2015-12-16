
var init = function () {
	
	var frog;
	var group;
	var layer;
	var enemies;
	var weapons;
	var weaponsGroup;
	var weaponIndex = 0;
	var meters;
	var health;
	
	var bgmusic;
	var jumpSound;
	var thudSound;
	
	var cursors;
	var spacebar;
	var fire;
	var weaponSelect;
	
	var FIRE_RATE = 250;
	var nextFire;
	
	var game = new Phaser.Game(width, height, Phaser.CANVAS, "gameArea", {
		preload: preload,
		create: create,
		update: update,
		render: render
	});

	function preload() {

		game.load.pack("main", "assets/pack.json");
		
	}
	

    function setTileCollision(mapLayer, idxOrArray, dirs) {
    
        var mFunc; // tile index matching function
        if (idxOrArray.length) {
            // if idxOrArray is an array, use a function with a loop
            mFunc = function(inp) {
                for (var i = 0; i < idxOrArray.length; i++) {
                    if (idxOrArray[i] === inp) {
                        return true;
                    }
                }
                return false;
            };
        } else {
            // if idxOrArray is a single number, use a simple function
            mFunc = function(inp) {
                return inp === idxOrArray;
            };
        }
    
        // get the 2-dimensional tiles array for this layer
        var d = mapLayer.map.layers[mapLayer.index].data;
        
        for (var i = 0; i < d.length; i++) {
            for (var j = 0; j < d[i].length; j++) {
                var t = d[i][j];
                if (mFunc(t.index)) {
                    
                    t.collideUp = dirs.top;
                    t.collideDown = dirs.bottom;
                    t.collideLeft = dirs.left;
                    t.collideRight = dirs.right;
                    
                    t.faceTop = dirs.top;
                    t.faceBottom = dirs.bottom;
                    t.faceLeft = dirs.left;
                    t.faceRight = dirs.right;
                    
                }
            }
        }
    
    }
	
    function create() {
    
        game.physics.startSystem(Phaser.Physics.ARCADE);
    
        game.physics.arcade.gravity.y = 1500;
    
        game.stage.backgroundColor = "#D3EEFF";
    
        var map = game.add.tilemap("stage1");
        map.addTilesetImage("ground", "tiles");
    
        var bglayer = map.createLayer("bg");
        bglayer.scrollFactorX = 0.5;
    
        layer = map.createLayer("layer1");
        layer.resizeWorld();
    
        map.setLayer(layer);
        
        
		enemies = game.add.group();
		enemies.enableBody = true;
		
		var toads = game.add.group();
		map.createFromObjects('others', 6571, 'toad', 0, true, false, toads);
		
		toads.forEach(function(t) {
			setupToad(t);
		}, this);
		
		enemies.addMultiple(toads);
        
        map.setCollisionBetween(1, 5);
        map.setCollisionBetween(91, 95);
        map.setCollisionBetween(181, 185);
        map.setCollisionBetween(271, 275);
        
        map.setCollisionBetween(2306, 2310);
        
        map.setCollisionBetween(3421, 3429);
        map.setCollisionBetween(3511, 3521);
        map.setCollisionBetween(3601, 3611);
        map.setCollisionBetween(3690, 3701);
        map.setCollisionBetween(3781, 3791);

        map.setCollisionBetween(2815, 2817);
        map.setCollisionBetween(6055, 6057);

        
        //map.setCollisionBetween(3354, 3356);
        //map.setCollisionBetween(2900, 2903);
        //map.setCollisionBetween(3714, 3716);
    
        setTileCollision(layer, [3354, 3355, 3356, 2900, 2901, 2902, 2903, 3714, 3715, 3716], {
            top: true,
            bottom: false,
            left: false,
            right: false
        });
        
        group = game.add.group();
    
        frog = createFrog(group, 50, 50, "frog", 200, "left");
        
        weaponsGroup = game.add.group();
        weapons = [];
        weapons.push({
           name: 'pencil',
           lifespan: 1500,
           velocity: {
               x: 500,
               y: -400
           },
           spin: 50,
           power: 10
        });
        
        weapons.push({
            name: 'flask',
            lifespan: 1500,
            velocity: {
                x: 600,
                y: -600
            },
            spin: 50,
            power: 20
         });
        
        weapons.push({
            name: 'hammer',
            lifespan: 1500,
            velocity: {
                x: 600,
                y: -400
            },
            spin: 50,
            power: 30
         });
        
        weapons.push({
            name: 'brace',
            lifespan: 1500,
            velocity: {
                x: 800,
                y: -200
            },
            spin: 80,
            power: 40
         });
        
        for (var w = 0; w < weapons.length; w++) {
            var wg = game.add.group();
            wg.createMultiple(3, weapons[w].name, 0, false);
            weapons[w].sprites = wg;
            weaponsGroup.add(wg);
        }
        
        game.camera.follow(frog);
    
        cursors = game.input.keyboard.createCursorKeys();
        spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        fire = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);
        weaponSelect = game.input.keyboard.addKeys({
            'one'  : Phaser.KeyCode.ONE,
            'two'  : Phaser.KeyCode.TWO,
            'three': Phaser.KeyCode.THREE,
            'four' : Phaser.KeyCode.FOUR
        });
        
        bgmusic = game.sound.add("bgmusic1");
        bgmusic.volume = 0.3;
        bgmusic.loop = true;
        bgmusic.play();
        
        jumpSound = game.sound.add("jump");
        thudSound = game.sound.add("thud");
        
    	nextFire = game.time.now + FIRE_RATE;
    	
    	createHealthBar();
    
    }

    var jumpTimer = 0;
    
	function update() {
	
	    game.physics.arcade.collide(frog, layer);
	    game.physics.arcade.collide(enemies, layer);
	    game.physics.arcade.overlap(frog, enemies, hurtFrog, null, this);
	    game.physics.arcade.overlap(enemies, weaponsGroup.children, hurtEnemy, null, this);
	    
	    if (frog.body.onFloor() && frog.falling) {
	        frog.falling = false;
	        thudSound.play();
	    }
	    
	    if (!frog.immune) {
	        frog.body.velocity.x = 0;
	    }
	
	    if (spacebar.isDown) {
	        if (frog.body.onFloor() && jumpTimer === 0) {
	            // jump is allowed to start
	            jumpTimer = 1;
	            frog.body.velocity.y = -400;
	            jumpSound.play();
	        } else if (jumpTimer > 0 && jumpTimer < 31) {
	            // keep jumping higher
	            jumpTimer++;
	            frog.body.velocity.y = -400 + (jumpTimer * 7);
	        }
	    } else {
	        // jump button not being pressed, reset jump timer
	        jumpTimer = 0;
	    }
	    
	    if (weaponSelect.one.isDown) {
	        weaponIndex = 0;
	    } else if (weaponSelect.two.isDown) {
	        weaponIndex = 1;
        } else if (weaponSelect.three.isDown) {
            weaponIndex = 2;
        } else if (weaponSelect.four.isDown) {
            weaponIndex = 3;
	    }
	
	    if (fire.isDown) {
	    	throwSomething();
	    }
	    
	    if (!frog.immune) {
	        if (cursors.left.isDown) {
	            frog.body.velocity.x = -150;
	        } else if (cursors.right.isDown) {
	            frog.body.velocity.x = 150;
	        }
	    }
	
	    if (frog.body.velocity.y > 0) {
	        frog.falling = true;
	    }
	    
	    setAnimation(frog);
	    
		enemies.forEach(function(t) {
			t.update();
		}, this);
		
		updateHealthBar();
	
	}
	
    function hurtFrog(f, e) {
        
        if (!f.immune) {
            f.immune = true;
            f.alpha = 0.5;
            f.damage(10);
            if (f.body.position.x < e.body.position.x) {
                f.body.velocity.x = -300;
            } else {
                f.body.velocity.x = 300;
            }
            game.time.events.add(500, function() {
                f.immune = false;
                f.alpha = 1;
            }, this);
        }
        
    }

    function hurtEnemy(e, w) {
        
        if (!e.immune) {
            e.immune = true;
            e.alpha = 0.5;
            e.damage(w.power);
            
            w.exists = false;
            
            game.time.events.add(200, function() {
                e.immune = false;
                e.alpha = 1;
            }, this);
        }
        
    }

    function throwSomething() {
    
        // has it been long enough? can we throw something yet?
    	if (game.time.now > nextFire) {
    
    		nextFire = game.time.now + FIRE_RATE;
    
    		// see if a weapon is available from the group
    		var weapon = weapons[weaponIndex].sprites.getFirstExists(false);
            if (weapon) {
    
                weapon.exists = true;
                weapon.anchor.setTo(0.5, 0.5);
                weapon.reset(frog.body.position.x+20, frog.body.position.y-20);
                game.physics.arcade.enable(weapon);
    
                weapon.lifespan = weapons[weaponIndex].lifespan;
                weapon.body.angularVelocity = weapons[weaponIndex].spin;
                weapon.body.velocity.y = weapons[weaponIndex].velocity.y;
                weapon.power = weapons[weaponIndex].power;
                if (frog.scale.x == 1) {
                    weapon.body.velocity.x = weapons[weaponIndex].velocity.x;
                } else{
                    weapon.body.velocity.x = -weapons[weaponIndex].velocity.x;
                }
                
            }
    
    	}
    
    }

    /**
	 * Creates a frog.
	 * 
	 * @param grp group to which this frog should be added
	 * @param x x-coordinate for this frog
	 * @param y y-coordinate for this frog
	 * @param ss sprite sheet
	 * @param mv max velocity
	 * @param ani initial animation ('left', 'right', 'front', or 'back)
	 * @returns the created frog
	 */
    function createFrog(grp, x, y, ss, mv, ani) {
    	
    	var f = grp.create(x, y, ss);
    	f.anchor.setTo(0.5, 0);
    	game.physics.enable(f, Phaser.Physics.ARCADE);
    	f.name = "frog";
        f.body.setSize(60, 25, 0, 38);
        f.body.linearDamping = 1;
        f.body.collideWorldBounds = true;
        f.falling = false;
        f.immune = false;
        f.health = 100;
        
        f.animations.add("run", [0, 1, 2], 10, true);
    	
        f.events.onKilled.add(function() {
            console.log("game over!");
        }, this);
        
        return f;
        
    }
    
    function createHealthBar() {
        
        meters = game.add.group();
        
        // create a plain black rectangle to use as the background of a health meter
        var meterBackgroundBitmap = game.add.bitmapData(20, 100);
        meterBackgroundBitmap.ctx.beginPath();
        meterBackgroundBitmap.ctx.rect(0, 0, meterBackgroundBitmap.width, meterBackgroundBitmap.height);
        meterBackgroundBitmap.ctx.fillStyle = '#000000';
        meterBackgroundBitmap.ctx.fill();
    
        // create a Sprite using the background bitmap data
        var healthMeterBG = game.add.sprite(10, 10, meterBackgroundBitmap);
        healthMeterBG.fixedToCamera = true;
        meters.add(healthMeterBG);
    
        // create a red rectangle to use as the health meter itself
        var healthBitmap = game.add.bitmapData(12, 92);
        healthBitmap.ctx.beginPath();
        healthBitmap.ctx.rect(0, 0, healthBitmap.width, healthBitmap.height);
        healthBitmap.ctx.fillStyle = '#FF0000';
        healthBitmap.ctx.fill();
        
        // create the health Sprite using the red rectangle bitmap data
        health = game.add.sprite(14, 14, healthBitmap);
        meters.add(health);
        health.fixedToCamera = true;
        
    }
    
    function updateHealthBar() {
        
        var m = (100 - frog.health) / 100;
        var bh = 92 - (92 * m);
        var offset = 92 - bh;
        
        health.key.context.clearRect(0, 0, health.width, health.height);
        health.key.context.fillRect(0, offset, 12, bh);
        health.key.dirty = true;
        
    }
	
    // any object that should be a toad
	function setupToad(obj) {
	
		game.physics.enable(obj, Phaser.Physics.ARCADE);
		obj.body.setSize(60, 25, 0, 38);
		obj.health = 40;
	
		obj.jumping = true;
	
		obj.jump = function() {
			this.frame = 1;
			this.body.velocity.y = -600;
			this.jumping = true;
		};
	
		obj.update = function() {
	
			if (this.body.onFloor() && this.jumping) {
				this.jumping = false;
				this.frame = 0;
				game.time.events.add(5000, function() {
					this.jump();
				}, this);
			}
	
		};
	
	}
    
    function setAnimation(f) {
    
        if (f.body.velocity.y === 0) {
    
            if (f.body.velocity.x === 0) {
    
                // no animation, the frog is still
                f.animations.stop(null, true);
    
            } else {
    
                if (f.body.velocity.x > 0) {
                    f.scale.x = 1;
                } else if (f.body.velocity.x < 0) {
                    f.scale.x = -1;
                }
                f.animations.play("run");
    
            }
    
        } else {
    
            // no animation, use a fixed frame
            f.animations.stop(null, true);
            
            if (f.body.velocity.y < 0) {
                f.frame = 1;
            } else if (f.body.velocity.y > 0) {
                f.frame = 2;
            }
    
        }
    
    }
	
	function render() {
		
		// un-comment to see the boxes
		//game.debug.body(frog);
		
	}
	
};

var wfconfig = {

    active: function() { 
    	console.log("font loaded");
    	init();
    },
    
    inactive: function() {
        console.log("fonts could not be loaded!");
        init();
    },

    google: {
      families: ['Sniglet']
    }

};

window.onload = function() {
	//WebFont.load(wfconfig);
    init();
};

