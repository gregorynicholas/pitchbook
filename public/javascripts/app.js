(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.brunch = true;
})();

window.require.register("scripts/box", function(exports, require, module) {
  var $d, PitchbookBox, exports, image_tpl, loading_tpl;

  loading_tpl = require('../templates/loading');

  image_tpl = require('../templates/image');

  exports = {};

  $d = $(document);

  exports.PitchbookBox = PitchbookBox = (function() {
    function PitchbookBox(settings) {
      var imageTypes;
      this.settings = {
        $container: $("#pitchbookBox"),
        $overlay: $('#pitchbookBox-overlay'),
        opacity: 0.35,
        has_overlay: true,
        animate_in: true,
        animate_out: true,
        imageTypes: ['png', 'jpg', 'jpeg', 'gif']
      };
      if (settings != null) {
        $.extend(this.settings, settings);
      }
      this.settings.$container.css("visibility", "hidden");
      imageTypes = this.settings.imageTypes.join('|');
      this.settings.imgTypesRE = new RegExp('\\.(#{imageTypes})(\\?.*)?$', 'i');
      if (settings) {
        $.extend(this.settings, settings);
      }
      this.bind();
      this.init();
    }

    PitchbookBox.prototype.init = function(data_type) {
      $d.trigger('pitchbookBox-init');
      this.loading();
      this.inited = true;
      if (this.settings.ajax != null) {
        return this._set_content_from_ajax(this.settings.ajax, data_type);
      } else if (this.settings.image != null) {
        return this._set_content_from_image(this.settings.image, data_type);
      } else if (this.settings.div != null) {
        return this._set_content_from_href(this.settings.div, data_type);
      } else if (this.settings.html != null) {
        return this._set_content_from_html(this.settings.html, data_type);
      } else if ($.isFunction(this.settings)) {
        return this._set_content_from_callback(this.settings);
      } else {
        return this.reveal(this.settings, data_type);
      }
    };

    PitchbookBox.prototype.bind = function() {
      var ctx;
      ctx = this;
      $d.on('pitchbookBox-close', function() {
        return ctx.close();
      });
      return $d.on('click', '[action="pitchbookBox-close"]', function(e) {
        e.preventDefault();
        return $d.trigger('pitchbookBox-close');
      });
    };

    PitchbookBox.prototype.close = function() {
      if (this.settings.$container.data('locked')) {
        return;
      }
      $d.trigger('pitchbookBox-close-before');
      $d.off('keydown.pitchbookBox');
      if (this.settings.$container.length < 1) {
        $d.trigger('pitchbookBox-close-after');
        return this.hide_overlay();
      }
      this.hide_content();
      this.hide_overlay();
      return $d.trigger('pitchbookBox-close-after');
    };

    PitchbookBox.prototype.loading = function() {
      var ctx;
      $d.trigger('pitchbookBox-loading-before');
      if (this.settings.$container.find('.loading').length > 0) {
        return;
      }
      this.show_overlay();
      this.settings.$container.css({
        display: 'block'
      }).find('.pitchbookBox-content').append(loading_tpl());
      ctx = this;
      $d.on('keydown.pitchbookBox', function(e) {
        switch (e.keyCode) {
          case 27:
            return ctx.close();
        }
      });
      return $d.trigger('pitchbookBox-loading-after');
    };

    PitchbookBox.prototype._set_content_from_href = function(href, data_type) {
      var target, url;
      if (href.match(/#/)) {
        url = window.location.href.split('#')[0];
        target = href.replace(url, '');
        if (target === '#') {
          return;
        }
        return this.reveal($(target).html(), data_type);
      } else if (href.match(this.settings.imgTypesRE)) {
        return _set_content_from_image(href, data_type);
      } else {
        return _set_content_from_ajax(href, data_type);
      }
    };

    PitchbookBox.prototype._set_content_from_html = function(html, data_type) {
      var $el;
      $el = $(html).html();
      return this.reveal($el, data_type);
    };

    PitchbookBox.prototype._set_content_from_image = function(href, data_type) {
      var img;
      img = new Image();
      img.onload = function() {
        return this.reveal(image_tpl({
          image_src: img.src
        }), data_type);
      };
      img.src = href;
      return img;
    };

    PitchbookBox.prototype._set_content_from_ajax = function(href, data_type) {
      return $.get(href, function(data) {
        return this.reveal(data, data_type);
      });
    };

    PitchbookBox.prototype._set_content_from_callback = function(fn) {
      return fn.call(this);
    };

    PitchbookBox.prototype.reveal = function(contents) {
      var $w, cb;
      $d.trigger('pitchbookBox-reveal-before');
      this.settings.$container.find('.pitchbookBox-content').empty().append(contents);
      if (this.settings.center_top) {
        $w = $(window);
        this.settings.$container.css("top", w.scrollTop() + ($w.height() / 2));
      }
      if (this.settings.animate_in) {
        cb = function() {
          return $d.trigger('pitchbookBox-reveal-animateIn');
        };
        this.settings.$container.css({
          opacity: 0
        }.animate({
          opacity: 1
        }, 500, cb));
      }
      return $d.trigger('pitchbookBox-reveal-after');
    };

    PitchbookBox.prototype.skip_overlay = function() {
      return !this.settings.has_overlay || this.settings.$container.data('locked');
    };

    PitchbookBox.prototype.show_overlay = function() {
      var cb;
      if (this.skip_overlay()) {
        return;
      }
      $d.trigger('pitchbookBox-overlay-show-before');
      cb = function() {
        return $d.trigger('pitchbookBox-overlay-show-after');
      };
      return this.settings.$overlay.css({
        display: 'block',
        opacity: 0
      }).removeClass('pitchbookBox-hide').animate({
        opacity: 0.35
      }, 400, 'easeOutExpo', cb);
    };

    PitchbookBox.prototype.hide_overlay = function() {
      var $el;
      if (this.skip_overlay()) {
        return;
      }
      $d.trigger('pitchbookBox-overlay-hide-before');
      $el = this.settings.$overlay;
      return $el.animate({
        opacity: 0
      }, 150, function() {
        $el.css("display", 'none').addClass('pitchbookBox-hide');
        return $d.trigger('pitchbookBox-overlay-hide-after');
      });
    };

    PitchbookBox.prototype.hide_content = function() {
      var ctx;
      $d.trigger('pitchbookBox-content-hide-before');
      ctx = this;
      return this.settings.$container.animate({
        opacity: 0
      }, 250, function() {
        ctx.settings.$container.find('.pitchbookBox-content').empty();
        ctx.settings.$container.find('.loading').remove();
        return $d.trigger('pitchbookBox-content-hide-after');
      });
    };

    return PitchbookBox;

  })();

  module.exports = exports;
  
});
window.require.register("scripts/img-preloader", function(exports, require, module) {
  var exports,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exports = {
    cache: {},
    /**
     * default preload options object
     *
     * @type {Object}
    */

    options: {
      src: null,
      container: $(),
      on_preload: function($img, o) {
        return console.info("done preloading " + o.src);
      }
    },
    preload: function() {
      var $o, arg, complete, o, total, _i, _len, _on_complete, _ref;
      total = arguments.length;
      complete = 0;
      _on_complete = function() {
        return console.info("done preloading " + total + " images");
      };
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        arg = arguments[_i];
        o = $.extend({}, this.options);
        $.extend(o, arg);
        if (_ref = o.src, __indexOf.call(this.cache, _ref) >= 0) {
          $o = this.cache[o.src].cloneNode();
          console.info('loading from cache..');
        } else {
          $o = new Image();
          this.cache[o.src] = $o;
        }
        $o.$container = o.$container;
        $o.on_preload = o.on_preload;
        $o.onload = function() {
          var $ctx;
          complete += 1;
          $ctx = $("<img src='" + this.src + "'>");
          console.log();
          if (this.$container != null) {
            this.$container.append($ctx);
          }
          if (this.on_preload != null) {
            this.on_preload($ctx, o);
          }
          if (complete === total) {
            return _on_complete();
          }
        };
        $o.src = o.src;
      }
      return this;
    }
  };

  module.exports = exports;
  
});
window.require.register("scripts/pitchbook-analytics", function(exports, require, module) {
  var $d;

  $d = $(document);

  pitchbook.analytics = {
    init: function() {
      var _ctx;
      _ctx = this;
      this.actions = [];
      this.rating = 0;
      $d.on("pitchbook.spread.change.before", function(e, o, spread, new_spread_index) {
        return _ctx.spread_view_end(o, spread, new_spread_index);
      });
      $d.on("pitchbook.spread.change.after", function(e, o) {});
      $d.on("pitchbook.book.show.start", function(e, o) {
        return _ctx.book_show_start(o, 0);
      });
      return $d.on("pitchbook.spread.gesture.start", function(e, o, touch_direction, touch_start_x) {
        return _ctx.track_gesture(o, touch_direction, touch_start_x);
      });
    },
    get_elapsed_seconds: function(s, e) {
      return (e - s) / 1000;
    },
    book_show_start: function(o) {
      this.book_show_start_time = (new Date()).getTime();
      return this.spread_view_start_time = (new Date()).getTime();
    },
    book_show_end: function(o) {
      return this.book_show_end_time = (new Date()).getTime();
    },
    spread_view_start: function(o, current_spread_index) {
      return this.spread_view_start_time = (new Date()).getTime();
    },
    spread_view_end: function(o, spread, new_spread_index) {
      var action, category, value;
      this.spread_view_end_time = (new Date()).getTime();
      category = o.brand_id + "||" + o.pitchbook_id + "||" + o.current_spread_index + "";
      action = "LOOKBOOK.SPREAD.VIEW.SECONDS";
      value = this.get_elapsed_seconds(this.spread_view_start_time, this.spread_view_end_time);
      _gaq.push(["_trackEvent", category, action, app.user.email, value]);
      return this.spread_view_start(o, o.new_spread_index);
    },
    track_click: function(o) {
      var action, category;
      category = o.brand_id + "||" + o.pitchbook_id + "||" + o.current_spread_index + "";
      action = "LOOKBOOK.SPREAD.NAV.CLICK";
      return _gaq.push(["_trackEvent", category, action, app.user.email, 0]);
    },
    track_gesture: function(o, direction, start_x) {
      var action, category;
      category = o.brand_id + "||" + o.pitchbook_id + "||" + o.current_spread_index + "";
      action = "LOOKBOOK.SPREAD.NAV.GESTURE";
      return _gaq.push(["_trackEvent", category, action, app.user.email, 0]);
    }
  };

  pitchbook.analytics.init();
  
});
window.require.register("scripts/pitchbook-app", function(exports, require, module) {
  var $d, $w, app, book_tpl, exports, intro_video_tpl, pitchbook, pitchbookBox, preloader;

  book_tpl = require('../templates/book');

  intro_video_tpl = require('../templates/intro-video');

  pitchbook = require('./pitchbook/book');

  pitchbookBox = require('./box');

  preloader = require('./img-preloader');

  exports = {};

  app = {
    inited: false
  };

  $w = $(window);

  $d = $(document);

  app.user = {};

  app.user.init = function() {
    this.ua = navigator.userAgent.toLowerCase();
    this.isIpad = this.ua.indexOf("ipad" > -1);
    this.isIPhone = this.ua.indexOf("iphone" > -1 || this.ua.indexOf("ipod" > -1));
    return this;
  };

  app.user.init();

  app.box_centering = function(settings) {
    if (settings.$elements != null) {
      settings.$elements = settings.$elements;
    } else {
      settings.$elements = $(".box");
    }
    return settings.$elements.each(function() {
      var $ctx;
      $ctx = $(this);
      app.box_center($ctx, settings);
      $ctx.css("visibility", "visible");
      return $w.resize(function(e) {
        return app.box_center($ctx, settings);
      });
    });
  };

  app.box_center = function($b, o) {
    var box_height, win_height, win_width;
    win_width = $w.width();
    box_height = $b.height();
    if (box_height === 0) {
      box_height = $b.parent().height();
    }
    win_height = $w.height() + (o.offsetY / 2);
    if (win_height < box_height) {
      if (o.animate === true) {
        $b.animate({
          top: 20
        }, 600, "easeInOutExpo");
      } else {
        $b.css("top", 20);
      }
    } else {
      if (o.animate === true) {
        $b.animate({
          top: (win_height / 2) - (box_height / 2)
        }, 600, "easeInOutExpo");
      } else {
        $b.css("top", (win_height / 2) - (box_height / 2));
      }
    }
    if (win_width * 2 < 1000) {
      return $b.css("left", 500);
    } else {
      return $b.css("left", win_width / 2);
    }
  };

  app.on_box_close = function() {
    var ex;
    $('.nav-btn.teaser').removeClass('selected');
    $('.nav-btn.overview').addClass('selected');
    app.box.settings.$container.css("opacity", 1);
    try {
      return app.show_book();
    } catch (_error) {
      ex = _error;
    }
  };

  app.init = function() {
    app.book = {};
    $d.on('pitchbookBox-reveal-after', function() {
      app.box_centering({
        $elements: $('.box'),
        offsetY: -75,
        animate: false
      });
      if (!app.inited) {
        preloader.preload({
          src: '/images/pitchbook-sprites.png',
          on_preload: function($img, o) {
            return console.info('done preloading #{o.src}');
          }
        });
        return app.init_book();
      }
    });
    $d.on('pitchbookBox-overlay-show-after', function() {
      return app.box.settings.$overlay.css("opacity", 0.7);
    });
    $d.on('pitchbookBox-content-hide-after', function() {
      return app.on_box_close();
    });
    $('.nav-btn.teaser').on('click', function() {
      return app.set_teaser_view();
    });
    $('.nav-btn.overview').on('click', function() {
      return app.set_overview_view();
    });
    $('.nav-btn.contact').on('click', function() {
      return window.location.href = 'mailto:info@pitchbook.appspot.com';
    });
    $d.on('pitchbookBox-overlay-show-after', function() {
      if (app.book.hide != null) {
        return app.book.hide();
      }
    });
    return app.start();
  };

  app.start = function() {
    app.box = new pitchbookBox.PitchbookBox({
      html: intro_video_tpl({}),
      overlay: true,
      animate_in: false,
      center_top: false
    });
    app.center_book();
    return app.box.settings.$container.data('locked', true);
  };

  app.center_book = function() {
    var $el, bounds, padding, pos, win_bounds;
    $el = $('.body-inner');
    padding = 70;
    win_bounds = {
      h: $w.height()
    };
    bounds = {
      h: $el.height() + padding,
      t: $el.offset().top
    };
    pos = {
      t: Math.ceil(((win_bounds.h / 2) - (bounds.h / 2)) + 30)
    };
    if (bounds.h === 0 || win_bounds.h === 0) {
      return app.center_book();
    }
    if (win_bounds.h < $el.parent().height()) {
      pos.t = padding;
    }
    $el.css({
      top: pos.t,
      margin: 0
    });
    return this;
  };

  app.show_book = function() {
    this.box.settings.$container.data('locked', false);
    this.book.$outer.css("opacity", 1);
    return this;
  };

  app.init_book = function() {
    var $book, spreads;
    if (app.inited) {
      return;
    }
    app.inited = true;
    spreads = [
      {
        left: {
          url: '/images/spreads/spread_01a.jpg'
        },
        right: {
          url: '/images/spreads/spread_01b.png'
        }
      }, {
        left: {
          url: '/images/spreads/spread_02a.jpg'
        },
        right: {
          url: '/images/spreads/spread_02b.png'
        }
      }, {
        left: {
          url: '/images/spreads/spread_03a.jpg'
        },
        right: {
          url: '/images/spreads/spread_03b.jpg'
        }
      }, {
        left: {
          url: '/images/spreads/spread_04a.png'
        },
        right: {
          url: '/images/spreads/spread_04b.png'
        }
      }, {
        left: {
          url: '/images/spreads/spread_05a.jpg'
        },
        right: {
          url: '/images/spreads/spread_05b.jpg'
        }
      }, {
        left: {
          url: '/images/spreads/spread_06a.jpg'
        },
        right: {
          url: '/images/spreads/spread_06b.jpg'
        }
      }, {
        left: {
          url: '/images/spreads/spread_07a.png'
        },
        right: {
          url: '/images/spreads/spread_07b.png'
        }
      }, {
        left: {
          url: '/images/spreads/spread_08a.png'
        },
        right: {
          url: '/images/spreads/spread_08b.png'
        }
      }
    ];
    $book = $('[data-book-container]');
    $book.html(book_tpl());
    app.book = new pitchbook.Pitchbook({
      $container: $book,
      spreads: spreads,
      SPREAD_WIDTH: 850,
      SPREAD_HEIGHT: 550,
      PAGE_WIDTH: 425,
      PAGE_HEIGHT: 550,
      ANIM_INTERVAL_RATE: 10,
      MOVE_NEXT_SPEED: 40,
      MOVE_PREV_SPEED: 40,
      EASE: 0.45,
      AUTO_SHOW: false,
      VERTICAL_OUTDENT: 0,
      SLOW_MOTION: false
    });
    $('[data-action="pitchbook-spread-change"]').on('click', function(e) {
      var $el, action, book_id, direction;
      e.preventDefault();
      $el = $(this);
      book_id = $el.data("book");
      action = $el.data("action");
      direction = $el.data("direction");
      return $('[data-book-container="#{book_id}"]').trigger(action, [direction]);
    });
    $w.on("resize", function() {
      return app.center_book();
    });
    return app.center_book();
  };

  app.set_teaser_view = function() {
    $('.nav-btn.teaser').addClass('selected');
    $('.nav-btn.overview').removeClass('selected');
    app.start();
    if (app.book != null) {
      return app.book.hide();
    }
  };

  app.set_overview_view = function() {
    app.box.settings.$container.data('locked', false);
    $('.nav-btn.overview').addClass('selected');
    $('.nav-btn.teaser').removeClass('selected');
    return $d.trigger('pitchbookBox-close');
  };

  exports.app = app;

  module.exports = exports;
  
});
window.require.register("scripts/pitchbook/book", function(exports, require, module) {
  var $d, NEXT, PREV, Pitchbook, Spread, SpreadContainer, exports, preloader;

  SpreadContainer = require('./spreadcontainer');

  Spread = require('./spread');

  preloader = require('../img-preloader');

  exports = {};

  $d = $(document);

  NEXT = 1;

  PREV = -1;

  /**
   * core pitchbook class
   *
   * animation is largely built from the example on:
   * http://www.html5rocks.com/en/tutorials/casestudies/20things_pageflip/
  */


  exports.Pitchbook = Pitchbook = (function() {
    function Pitchbook(settings) {
      this.settings = {
        SPREAD_WIDTH: 860,
        SPREAD_HEIGHT: 532,
        PAGE_WIDTH: 430,
        PAGE_HEIGHT: 515,
        VERTICAL_OUTDENT: 0.2,
        CANVAS_PADDING: 0,
        PAGE_Y: 0,
        ANIM_INTERVAL_RATE: 1,
        MOVE_NEXT_SPEED: 25,
        MOVE_PREV_SPEED: 25,
        EASE: 0.35,
        AUTO_SHOW: true,
        AUTO_PRELOAD: true,
        SLOW_MOTION: false
      };
      if (window.Touch != null) {
        this.settings.MOVE_NEXT_SPEED = 40 * 2;
        this.settings.MOVE_PREV_SPEED = 40 * 2;
        this.settings.EASE += 0.45 * 0.5;
      }
      if (settings != null) {
        $.extend(this.settings, settings);
      }
      this.settings.PAGE_Y = Math.ceil((this.settings.SPREAD_HEIGHT - this.settings.PAGE_HEIGHT) / 2);
      if (this.settings.SLOW_MOTION) {
        this.settings.ANIM_INTERVAL_RATE = 100;
        this.settings.MOVE_NEXT_SPEED = 4;
        this.settings.MOVE_PREV_SPEED = 4;
      }
      this.init();
    }

    Pitchbook.prototype.init = function() {
      var spreads_container;
      this.in_progress = false;
      this.current_spread_index = 0;
      this.$outer = this.settings.$container;
      this.$contents = this.$outer.find("[data-book-contents]");
      this.hide();
      spreads_container = new SpreadContainer();
      this.$contents.append(spreads_container.$el);
      this.total_spreads = this.settings.spreads.length;
      this.spreads = this.create_spreads(this.settings.spreads);
      spreads_container.set_spreads(this.spreads);
      this.$contents.css({
        position: "relative",
        width: this.settings.PAGE_WIDTH * 2,
        height: this.settings.PAGE_HEIGHT
      });
      this.$canvas = this.create_canvas();
      this.context = this.$canvas.getContext("2d");
      this.$contents.append(spreads_container.$el);
      spreads_container.$el.prepend(this.$canvas);
      this.$pager_left = this.$outer.find(".pager-left");
      this.$pager_right = this.$outer.find(".pager-right");
      this.current_load = 0;
      this.load_spread();
      this.canvas_left = $(this.$canvas).offset().left;
      this.bind_events();
      this.is_last = false;
      this.set_at_first(true);
      if (window.Touch == null) {
        this.disable_text_selection();
      }
      $d.trigger("pitchbook-book-show-start", [this]);
      return this;
    };

    Pitchbook.prototype.create_spreads = function(items) {
      var i, rv;
      i = 0;
      rv = [];
      while (i < items.length) {
        if (items[i].left == null) {
          break;
        }
        if (items[i].right == null) {
          break;
        }
        rv.push(new Spread({
          data: items[i],
          index: i,
          book: this
        }));
        i++;
      }
      return rv;
    };

    Pitchbook.prototype.create_canvas = function() {
      var rv;
      rv = document.createElement("canvas");
      rv.width = this.settings.SPREAD_WIDTH;
      rv.height = this.settings.SPREAD_HEIGHT + (this.settings.CANVAS_PADDING * 2);
      rv.style.top = this.settings.CANVAS_PADDING;
      rv.style.left = 0;
      rv.style.position = "absolute";
      rv.style.zIndex = 100;
      rv.style.cursor = "default";
      return rv;
    };

    Pitchbook.prototype.hide = function() {
      return this.$outer.css("opacity", 0);
    };

    Pitchbook.prototype.show = function() {
      $d.trigger('pitchbook-spread-show', [this]);
      return this.$outer.animate({
        opacity: 1
      }, 800, "easeOutExpo");
    };

    Pitchbook.prototype.load_spread = function() {
      var onload, p1, p2, spread, _ctx;
      if (this.current_load >= this.total_spreads) {
        return;
      }
      _ctx = this;
      spread = this.spreads[this.current_load];
      onload = function($img, o) {
        var cb;
        spread.loaded = true;
        if (_ctx.current_load === 1 && _ctx.settings.AUTO_SHOW) {
          _ctx.show();
          cb = function() {
            _ctx.current_load += 1;
            return _ctx.load_spread();
          };
          return setTimeout(cb, 100);
        } else {
          if (_ctx.settings.AUTO_PRELOAD) {
            _ctx.current_load += 1;
            return _ctx.load_spread();
          }
        }
      };
      p1 = {
        $container: spread.pages.left.$el,
        src: spread.pages.left.settings.url,
        on_preload: onload
      };
      p2 = {
        $container: spread.pages.right.$el,
        src: spread.pages.right.settings.url
      };
      return preloader.preload(p1, p2);
    };

    Pitchbook.prototype.get_current_spread = function() {
      return this.spreads[this.current_spread_index];
    };

    Pitchbook.prototype.bind_events = function() {
      var _ctx;
      _ctx = this;
      this.$outer.bind("pitchbook-spread-change", function(e, dir) {
        if (_ctx.in_progress) {
          return;
        }
        return _ctx.pager_click(e, dir);
      });
      $d.bind("keydown.pitchbook", function(e) {
        if (_ctx.in_progress) {
          return;
        }
        switch (e.keyCode) {
          case $.ui.keyCode.ESCAPE:
          case $.ui.keyCode.RIGHT:
            _ctx.pager_click(e, 1);
            break;
          case $.ui.keyCode.LEFT:
            _ctx.pager_click(e, -1);
        }
        return true;
      });
      this.$canvas.addEventListener("mousemove", function(e) {
        return _ctx.on_mousemove(e);
      });
      this.$canvas.addEventListener("mouseout", function(e) {
        return _ctx.on_mouseout(e);
      });
      this.$contents.on("click", function(e) {
        return _ctx.on_click(e);
      });
      return this;
    };

    Pitchbook.prototype.disable_text_selection = function() {
      $d.on("selectstart", ".book-body *", function(e) {
        e.preventDefault();
        return false;
      });
      return this;
    };

    Pitchbook.prototype.blur = function() {
      this.$contents.find("*").blur();
      return this;
    };

    Pitchbook.prototype.set_in_progress = function(active) {
      if ((active == null) || active === true) {
        this.in_progress = true;
      } else {
        this.in_progress = false;
      }
      return this;
    };

    Pitchbook.prototype.set_at_first = function(active) {
      if ((active == null) || active === true) {
        this.is_first = true;
        this.$contents.addClass("first");
        this.$pager_left.addClass("disabled").css("opacity", 0.05);
      } else {
        this.is_first = false;
        this.$contents.removeClass("first");
        this.$pager_left.removeClass("disabled").css("opacity", 0.2);
      }
      return this;
    };

    Pitchbook.prototype.set_at_last = function(active) {
      if ((active == null) || active === true) {
        this.is_last = true;
        this.$contents.addClass("last");
        this.$pager_right.addClass("disabled").css("opacity", 0.05);
      } else {
        this.is_last = false;
        this.$contents.removeClass("last");
        this.$pager_right.removeClass("disabled").css("opacity", 0.2);
      }
      return this;
    };

    Pitchbook.prototype.touchstart = function(e) {
      e.preventDefault();
      if (this.in_progress) {
        return;
      }
      if (this.$contents.data("dragging")) {
        if (this.touch_start_x < this.settings.PAGE_WIDTH) {
          this.touch_direction = -1;
        } else {
          this.touch_direction = 1;
        }
      } else {
        this.$contents.data("dragging", true);
        this.touch_start_x = e.touches[0].clientX - this.canvas_left;
      }
      if (e.touches.length === 1) {
        $d.trigger("pitchbook-spread-gesture-start", [this, this.touch_direction, this.touch_start_x]);
      }
      return this;
    };

    Pitchbook.prototype.touchmove = function(e) {
      var touch;
      if (this.in_progress) {
        return;
      }
      e.preventDefault();
      if (e.touches.length === 1) {
        touch = e.touches[0];
      }
      return this;
    };

    Pitchbook.prototype.touchend = function(e) {
      e.preventDefault();
      this.$contents.data("dragging", false);
      if (this.in_progress) {
        return;
      }
      if (e.touches.length === 1) {
        this.touch_end_x = e.touches[0].clientX - this.canvas_left;
        if (this.touch_end_x > this.touch_start_x && this.touch_direction === 1) {
          return;
        }
        if (this.touch_end_x < this.touch_start_x && this.touch_direction === -1) {
          return;
        }
        this.$next = this.get_spread(this.touch_direction);
      }
      if (this.$next != null) {
        this.turn(this.get_current_spread(), this.touch_direction);
      }
      return this;
    };

    Pitchbook.prototype.on_click = function(e) {
      var mouse;
      e.preventDefault();
      if (this.in_progress) {
        return;
      }
      mouse = {
        x: e.clientX - this.canvas_left,
        y: e.clientY - this.$canvas.offsetTop
      };
      this.like_page();
      return this;
    };

    Pitchbook.prototype.get_spread = function(dir) {
      if (dir < 0 && this.current_spread_index === 0) {
        return null;
      }
      if (dir > 0 && this.current_spread_index >= this.total_spreads) {
        return null;
      }
      return this.spreads[this.current_spread_index + dir];
    };

    Pitchbook.prototype.prev_spread = function() {
      return this.spreads[this.current_spread_index - 1];
    };

    Pitchbook.prototype.next_spread = function() {
      return this.spreads[this.current_spread_index + 1];
    };

    Pitchbook.prototype.like_page = function(page) {
      var cb, _ctx;
      this.set_in_progress(true);
      _ctx = this;
      cb = function() {
        return _ctx.$contents.animate({
          opacity: 1
        }, 350, function() {
          return _ctx.set_in_progress(false);
        });
      };
      this.$contents.animate({
        opacity: 0.3
      }, 250, function() {
        return setTimeout(cb, 50);
      });
      return this;
    };

    Pitchbook.prototype.on_mousemove = function(e) {
      var mouse;
      if (this.in_progress) {
        return;
      }
      mouse = {
        x: e.offsetX,
        y: e.offsetY
      };
      if (mouse.x < this.settings.PAGE_WIDTH) {
        this.$contents.removeClass("book-over-right").addClass("book-over-left");
      } else {
        this.$contents.removeClass("book-over-left");
        if (!this.is_last) {
          this.$contents.addClass("book-over-right");
        }
      }
      return this;
    };

    Pitchbook.prototype.on_mouseout = function(e) {
      var mouse;
      mouse = {
        x: e.clientX - this.canvas_left,
        y: e.clientY - this.$canvas.offsetTop
      };
      this.$contents.removeClass("book-over-left").removeClass("book-over-right");
      return this;
    };

    Pitchbook.prototype.pager_click = function(e, dir) {
      if (window.Touch == null) {
        this.blur();
      }
      this.$next = this.get_spread(dir);
      if (this.$next != null) {
        this.turn(this.get_current_spread(), dir);
      }
      return this;
    };

    /**
     * @param  {Spread} spread     current spread that is to be turned
     * @param  {Number} direction  -1 to move prev, 1 to move next
    */


    Pitchbook.prototype.turn = function(spread, direction) {
      var i;
      if (this.in_progress) {
        return;
      }
      $d.trigger("pitchbook-spread-change-before", [this, spread, direction]);
      this.set_in_progress(true);
      this.turn_direction = direction;
      if (this.turn_direction === 1) {
        this.current_x = this.settings.PAGE_WIDTH / 2;
      } else {
        this.current_x = -(this.settings.PAGE_WIDTH / 2);
      }
      i = this.current_spread_index;
      while (i < this.spreads.length) {
        this.spreads[i].reset();
        i++;
      }
      if (this.turn_direction === 1 && this.is_first) {
        this.set_at_first(false);
      }
      if (this.turn_direction === -1 && this.is_last) {
        this.set_at_last(false);
      }
      this.progress = this.turn_direction;
      this.target = this.turn_direction;
      this.run_turn_animation(spread);
      return this;
    };

    Pitchbook.prototype.run_turn_animation = function(spread) {
      var _ctx, _run;
      _ctx = this;
      _run = function() {
        var is_complete;
        is_complete = _ctx.on_turn_progress(spread);
        if (is_complete) {
          return _ctx.on_turn_complete(spread);
        }
      };
      return this._intvl = setInterval(_run, this.settings.ANIM_INTERVAL_RATE);
    };

    Pitchbook.prototype.clear_animation = function() {
      if (this._intvl != null) {
        clearInterval(this._intvl);
        return delete this._intvl;
      }
    };

    Pitchbook.prototype.ease = function() {
      return this.target - this.progress;
    };

    Pitchbook.prototype.calculate_target = function() {
      return Math.max(Math.min(this.current_x / this.settings.PAGE_WIDTH, 1), -1);
    };

    Pitchbook.prototype.calculate_progress = function() {
      return this.settings.EASE * (this.ease() * this.settings.EASE);
    };

    Pitchbook.prototype.calculate_movement_next = function() {
      return this.current_x + (-(this.settings.MOVE_NEXT_SPEED + (this.ease() * 2)));
    };

    Pitchbook.prototype.calculate_movement_prev = function() {
      var rv;
      rv = (this.current_x + this.settings.MOVE_PREV_SPEED) + (this.ease() * 2);
      return rv;
    };

    /**
     * @param  {Spread} spread  the spread being turned, animating out of display
     * @return {Boolean}        returns true when page turn animation completes progress
    */


    Pitchbook.prototype.on_turn_progress = function(spread) {
      var progress_abs, progress_done_thres;
      this.clear_canvas();
      this.target = this.calculate_target();
      this.progress += this.calculate_progress();
      progress_done_thres = 0.997;
      progress_abs = Math.abs(this.progress);
      if (progress_abs < progress_done_thres) {
        this.animate(spread);
      }
      if (this.turn_direction === 1) {
        this.current_x = this.calculate_movement_next();
      } else {
        this.current_x = this.calculate_movement_prev();
      }
      if (this.turn_direction === 1 && progress_abs > progress_done_thres) {
        return true;
      }
      if (this.turn_direction === -1 && this.progress > progress_done_thres) {
        return true;
      }
      return false;
    };

    Pitchbook.prototype.clear_canvas = function() {
      return this.context.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
    };

    /**
     * @param  {Spread} spread  the spread being turned, animating out of display
    */


    Pitchbook.prototype.on_turn_complete = function(spread) {
      var new_spread;
      this.clear_animation();
      $d.trigger("pitchbook-spread-change", [this]);
      this.current_spread_index += this.turn_direction;
      new_spread = this.get_current_spread();
      if (new_spread != null) {
        new_spread.pages.left.$el.css({
          width: this.settings.PAGE_WIDTH,
          left: 0
        });
      }
      this.set_in_progress(false);
      if (this.next_spread() == null) {
        this.set_at_last(true);
      }
      if (this.prev_spread() == null) {
        this.set_at_first(true);
      }
      $d.trigger("pitchbook-spread-change-after", [this]);
      return this;
    };

    /**
     * @param  {Spread} spead  spread being turned, animating out of display.
    */


    Pitchbook.prototype.animate = function(spread) {
      if (this.turn_direction === 1) {
        return this.animate_next(spread);
      } else {
        return this.animate_prev(spread);
      }
    };

    /**
     * @param  {Spread} spread  the spread being turned, animating out of display
    */


    Pitchbook.prototype.animate_prev = function(spread) {
      var fold_gradient, fold_w, fold_x, grad, l_shadow_gradient, left_shadow_w, next_right_left, next_right_width, page_shadow_w, pw, r_shadow_gradient, right_shadow_w, right_width, str, strength, v1, v2, vertical_outdent, w, x;
      pw = this.settings.PAGE_WIDTH;
      strength = 1 - Math.abs(this.progress);
      fold_w = (pw / 2) * (1 - this.progress);
      fold_x = pw * this.progress + fold_w;
      vertical_outdent = this.settings.VERTICAL_OUTDENT * strength;
      page_shadow_w = (pw * 0.5) * Math.max(Math.min(1 - this.progress, 0.5), 0);
      right_shadow_w = (pw * 0.5) * Math.max(Math.min(strength, 0.5), 0);
      left_shadow_w = (pw * 0.5) * Math.max(Math.min(strength, 0.5), 0);
      w = pw - (fold_w - fold_x);
      w = w >= pw ? pw : w;
      this.$next.pages.left.$el.css({
        width: w
      });
      x = fold_x + (pw - fold_w);
      w = fold_w < 1.5 ? 0 : fold_w;
      spread.pages.left.$el.css({
        left: x,
        width: w
      });
      if (x >= pw - 2) {
        right_width = Math.ceil(Math.abs(fold_w - fold_x) + 1);
        this.$next.pages.right.$el.css({
          width: right_width
        });
        next_right_width = Math.ceil(Math.abs(pw - right_width));
        next_right_left = Math.ceil(pw + (pw - next_right_width)) + right_width;
        spread.pages.right.$el.css({
          left: next_right_left,
          marginLeft: -(right_width * 2)
        });
      }
      this.context.save();
      v1 = this.settings.CANVAS_PADDING + (this.settings.SPREAD_WIDTH / 2);
      v2 = this.settings.PAGE_Y + this.settings.CANVAS_PADDING;
      this.context.translate(v1, v2);
      str = strength * 0.15;
      this.context.strokeStyle = "rgba(0,0,0, " + str + ")";
      this.context.lineWidth = 20 * strength;
      this.context.beginPath();
      this.context.moveTo(fold_x, -vertical_outdent * 0.5);
      this.context.lineTo(fold_x, this.settings.PAGE_HEIGHT + (vertical_outdent * 0.5));
      this.context.stroke();
      r_shadow_gradient = this.context.createLinearGradient(fold_x, 0, fold_x + right_shadow_w, 0);
      str = strength * 0.45;
      r_shadow_gradient.addColorStop(0, "rgba(0,0,0, " + str + ")");
      r_shadow_gradient.addColorStop(1, "rgba(0,0,0,0)");
      this.context.fillStyle = r_shadow_gradient;
      this.context.beginPath();
      this.context.moveTo(fold_x, 0);
      this.context.lineTo(fold_x + right_shadow_w, 0);
      this.context.lineTo(fold_x + right_shadow_w, this.settings.PAGE_HEIGHT);
      this.context.lineTo(fold_x, this.settings.PAGE_HEIGHT);
      this.context.fill();
      grad = {
        x1: fold_x - fold_w - left_shadow_w,
        x2: fold_x - fold_w,
        y1: 0,
        y2: 0
      };
      l_shadow_gradient = this.context.createLinearGradient(grad.x1, grad.y1, grad.x2, grad.y2);
      str = strength * 0.2;
      l_shadow_gradient.addColorStop(1, "rgba(0,0,0, " + str + ")");
      l_shadow_gradient.addColorStop(0, "rgba(0,0,0,0)");
      this.context.fillStyle = l_shadow_gradient;
      this.context.beginPath();
      this.context.moveTo(fold_x - fold_w - left_shadow_w, 0);
      this.context.lineTo(fold_x - fold_w, 0);
      this.context.lineTo(fold_x - fold_w, this.settings.PAGE_HEIGHT);
      this.context.lineTo(fold_x - fold_w - left_shadow_w, this.settings.PAGE_HEIGHT);
      this.context.fill();
      grad = {
        x1: fold_x - page_shadow_w,
        x2: fold_x,
        y1: 0,
        y2: 0
      };
      fold_gradient = this.context.createLinearGradient(grad.x1, grad.y1, grad.x2, grad.y2);
      str = 0.35 * strength;
      fold_gradient.addColorStop(0.35, "rgba(255,255,255, " + str + ")");
      fold_gradient.addColorStop(0.73, "rgba(0,0,0, " + str + ")");
      fold_gradient.addColorStop(0.9, "rgba(255,255,255, " + str + ")");
      fold_gradient.addColorStop(1.0, "rgba(0,0,0, " + str + ")");
      this.context.fillStyle = fold_gradient;
      this.context.strokeStyle = "rgba(0,0,0, 0.06)";
      this.context.lineWidth = 0.5;
      this.context.beginPath();
      this.context.moveTo(fold_x, 0);
      this.context.lineTo(fold_x, this.settings.PAGE_HEIGHT);
      this.context.quadraticCurveTo(fold_x, this.settings.PAGE_HEIGHT + (vertical_outdent * 2), fold_x - fold_w, this.settings.PAGE_HEIGHT + vertical_outdent);
      this.context.lineTo(fold_x - fold_w, -vertical_outdent);
      this.context.quadraticCurveTo(fold_x, -vertical_outdent * 2, fold_x, 0);
      this.context.fill();
      this.context.stroke();
      this.context.restore();
      return this;
    };

    /**
     * @param  {Spread} spread
    */


    Pitchbook.prototype.animate_next = function(spread) {
      var fold_right_x, fold_w, fold_x, grad, l_shadow_alpha, l_shadow_gradient, left_shadow_w, next_left, page_shadow_w, pw, pw_half, r_shadow_alpha, r_shadow_gradient, right_shadow_w, strength, v1, v2, vertical_outdent, w;
      pw = this.settings.PAGE_WIDTH;
      pw_half = pw * 0.5;
      strength = 1 - Math.abs(this.progress);
      fold_w = pw_half * (1 - this.progress);
      fold_x = pw * this.progress + fold_w;
      fold_right_x = fold_x - fold_w;
      vertical_outdent = this.settings.VERTICAL_OUTDENT * strength;
      page_shadow_w = pw_half * Math.max(Math.min(1 - this.progress, 0.5), 0);
      left_shadow_w = pw_half * Math.max(Math.min(strength, 0.5), 0);
      right_shadow_w = pw_half * Math.max(Math.min(strength, 0.5), 0);
      spread.pages.right.$el.css({
        "marginLeft": 0
      });
      next_left = pw + fold_right_x;
      this.$next.pages.right.$el.css("marginLeft", 0);
      this.$next.pages.left.$el.css({
        width: pw - fold_x,
        left: next_left
      });
      w = pw + fold_right_x;
      if (w < 1.5) {
        spread.pages.right.$el.css("width", 0);
        spread.pages.left.$el.css({
          width: 0,
          left: 0
        });
      } else if (fold_w > pw / 2) {
        spread.pages.right.$el.css("width", 0);
        spread.pages.left.$el.css("width", w);
      } else {
        spread.pages.right.$el.css("width", Math.ceil(fold_right_x));
      }
      this.context.save();
      v1 = this.settings.CANVAS_PADDING + (this.settings.SPREAD_WIDTH / 2);
      v2 = this.settings.PAGE_Y + this.settings.CANVAS_PADDING;
      this.context.translate(v1, v2);
      this.draw_fold_sharp_left_shadow(this.context, fold_x, fold_w, strength, vertical_outdent);
      grad = {
        x1: fold_x,
        x2: fold_x + right_shadow_w,
        y1: 0,
        y2: 0
      };
      r_shadow_alpha = strength * 0.2;
      r_shadow_gradient = this.set_gradient(this.context, grad);
      r_shadow_gradient.addColorStop(1, "rgba(0,0,0, 0)");
      r_shadow_gradient.addColorStop(0.25, "rgba(0,0,0, " + r_shadow_alpha + ")");
      r_shadow_gradient.addColorStop(0, "rgba(0,0,0, 0)");
      this.context.fillStyle = r_shadow_gradient;
      this.context.beginPath();
      this.context.moveTo(fold_x, 0);
      this.context.lineTo(fold_x + right_shadow_w, 0);
      this.context.lineTo(fold_x + right_shadow_w, this.settings.PAGE_HEIGHT);
      this.context.lineTo(fold_x, this.settings.PAGE_HEIGHT);
      this.context.fill();
      grad = {
        x1: fold_right_x - left_shadow_w,
        x2: fold_right_x,
        y1: 0,
        y2: 0
      };
      l_shadow_alpha = strength * 0.15;
      l_shadow_gradient = this.set_gradient(this.context, grad);
      l_shadow_gradient.addColorStop(1, "rgba(0,0,0, " + l_shadow_alpha + ")");
      l_shadow_gradient.addColorStop(0, "rgba(0,0,0, 0)");
      this.context.fillStyle = l_shadow_gradient;
      this.context.beginPath();
      this.context.moveTo(fold_right_x - left_shadow_w, 0);
      this.context.lineTo(fold_right_x, 0);
      this.context.lineTo(fold_right_x, this.settings.PAGE_HEIGHT);
      this.context.lineTo(fold_right_x - left_shadow_w, this.settings.PAGE_HEIGHT);
      this.context.fill();
      this.set_fold_gradients(fold_x - page_shadow_w, fold_x, 0, 0, strength);
      this.context.beginPath();
      this.context.moveTo(fold_x, 0);
      this.context.lineTo(fold_x, this.settings.PAGE_HEIGHT);
      this.context.quadraticCurveTo(fold_x, this.settings.PAGE_HEIGHT + (vertical_outdent * 2), fold_right_x, this.settings.PAGE_HEIGHT + vertical_outdent);
      this.context.lineTo(fold_right_x, -vertical_outdent);
      this.context.quadraticCurveTo(fold_x, -vertical_outdent * 2, fold_x, 0);
      this.context.fill();
      this.context.stroke();
      this.context.restore();
      return this;
    };

    Pitchbook.prototype.draw_fold_sharp_left_shadow = function(ctx, x1, x2, strength, vert_outdent) {
      var shadow_alpha, shadow_w, x, y1, y2;
      shadow_w = Math.ceil((this.settings.PAGE_WIDTH * 0.12) * strength);
      shadow_alpha = 0.1 * strength;
      y1 = vert_outdent * 0.5;
      y2 = y1 + this.settings.PAGE_HEIGHT;
      x = (x1 - x2) - shadow_w / 2;
      ctx.strokeStyle = "rgba(0,0,0, " + shadow_alpha + ")";
      ctx.lineWidth = shadow_w;
      ctx.beginPath();
      ctx.moveTo(x, -y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
      return this;
    };

    Pitchbook.prototype.set_gradient = function(ctx, options) {
      return ctx.createLinearGradient(options.x1, options.y1, options.x2, options.y2);
    };

    /**
     * gradient applied to the folded paper (highlights & shadows)
    
       @param x1  the X coordinate of the start of the gradient
       @param x2  the X coordinate of the end of the gradient
       @param y1
       @param y2
       @param strength
    */


    Pitchbook.prototype.set_fold_gradients = function(x1, x2, y1, y2, strength) {
      var alpha, rv;
      alpha = 0.35 * strength;
      rv = this.context.createLinearGradient(x1, y1, x2, y2);
      rv.addColorStop(0.35, "rgba(255,255,255, " + alpha + ")");
      rv.addColorStop(0.73, "rgba(0,0,0, " + alpha + ")");
      rv.addColorStop(0.9, "rgba(255,255,255, " + alpha + ")");
      rv.addColorStop(1.0, "rgba(0,0,0, " + alpha + ")");
      this.context.fillStyle = rv;
      this.context.strokeStyle = "rgba(0,0,0, 0.06)";
      this.context.lineWidth = 0.5;
      return this;
    };

    Pitchbook.prototype.pause = function() {
      this._paused_progress = this.progress;
      this._paused_intvl = this._intvl;
      if (this.turn_direction === 1) {
        this.progress = -1;
      } else {
        this.progress = 0;
      }
      this.clear_animation();
      return this;
    };

    /**
     * unbind all events
    */


    Pitchbook.prototype.destroy = function() {
      this.$outer.unbind();
      this.$contents.find("*").unbind();
      $(this.$canvas).unbind();
      return this;
    };

    return Pitchbook;

  })();

  module.exports = exports;
  
});
window.require.register("scripts/pitchbook/page", function(exports, require, module) {
  var Page, page_overlay_tpl, page_tpl;

  page_tpl = require('../../templates/page');

  page_overlay_tpl = require('../../templates/page_overlay');

  module.exports = Page = (function() {
    function Page(spread, o) {
      this.loaded = false;
      this.settings = o.settings;
      this.side = o.side;
      this.spread = spread;
      this.book = o.book;
      this.$overlay = this.create_overlay_el();
      this.$el = this.create_el();
      this.progress = 1;
      this;
    }

    Page.prototype.create_el = function() {
      var $rv;
      $rv = $(page_tpl({
        side: this.side
      }));
      $rv.css({
        position: "absolute",
        overflow: "hidden",
        width: this.book.settings.PAGE_WIDTH,
        height: this.book.settings.PAGE_HEIGHT
      }).append(this.$overlay);
      return $rv;
    };

    Page.prototype.create_overlay_el = function() {
      var $rv;
      $rv = $(page_overlay_tpl());
      $rv.css({
        width: this.book.settings.PAGE_WIDTH,
        height: this.book.settings.PAGE_HEIGHT
      });
      return $rv;
    };

    return Page;

  })();
  
});
window.require.register("scripts/pitchbook/spread", function(exports, require, module) {
  var Page, Spread, spread_tpl;

  Page = require('./page');

  spread_tpl = require('../../templates/spread');

  module.exports = Spread = (function() {
    function Spread(o) {
      this.loaded = false;
      this.data = o.data;
      this.index = o.index;
      this.book = o.book;
      this.zindex = this.book.total_spreads - this.index;
      this.pages = {};
      this.$el = this.create_el();
      this.addleft();
      this.addright();
      this;
    }

    Spread.prototype.create_el = function() {
      var $rv;
      $rv = $(spread_tpl());
      $rv.css({
        position: "absolute",
        overflow: "hidden",
        width: this.book.settings.PAGE_WIDTH * 2,
        height: this.book.settings.PAGE_HEIGHT,
        zIndex: this.zindex
      });
      return $rv;
    };

    Spread.prototype.addpage = function(opts) {
      var page;
      page = new Page(this, opts);
      this.$el.append(page.$el);
      this.pages[opts.side] = page;
      return this.pages[opts.side];
    };

    Spread.prototype.addleft = function() {
      var page;
      page = this.addpage({
        side: "left",
        spread: this,
        book: this.book,
        settings: this.data.left
      });
      page.$el.css("left", 0);
      this.left = page;
      return this;
    };

    Spread.prototype.addright = function() {
      var page;
      page = this.addpage({
        side: "right",
        spread: this,
        book: this.book,
        settings: this.data.right
      });
      page.$el.css("left", this.book.settings.PAGE_WIDTH);
      this.right = page;
      return this;
    };

    Spread.prototype.reset = function() {
      this.pages.left.$el.css({
        width: this.book.settings.PAGE_WIDTH,
        left: 0
      });
      this.pages.right.$el.css({
        width: this.book.settings.PAGE_WIDTH,
        left: this.book.settings.PAGE_WIDTH
      });
      return this;
    };

    return Spread;

  })();
  
});
window.require.register("scripts/pitchbook/spreadcontainer", function(exports, require, module) {
  var SpreadContainer, spreads_container_tpl;

  spreads_container_tpl = require('../../templates/spreads_container');

  module.exports = SpreadContainer = (function() {
    function SpreadContainer() {
      this.spreads = [];
      this.$el = this.create_el();
      this;
    }

    SpreadContainer.prototype.create_el = function() {
      var $el;
      $el = $(spreads_container_tpl());
      return $el;
    };

    SpreadContainer.prototype.set_spreads = function(spreads) {
      var spread, _i, _len;
      this.spreads = spreads;
      for (_i = 0, _len = spreads.length; _i < _len; _i++) {
        spread = spreads[_i];
        this.$el.append(spread.$el);
      }
      return this;
    };

    return SpreadContainer;

  })();
  
});
window.require.register("templates/book", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    


    return "\n<div\n  data-action=\"pitchbook-spread-change\"\n  data-book=\"0\"\n  data-direction=\"-1\"\n  class=\"pager-left\"></div>\n<div class=\"left book-edge\"></div>\n<div\n  data-book-contents=\"0\"\n  class=\"book-contents\"></div>\n<div class=\"right book-edge\"></div>\n<div\n  data-action=\"pitchbook-spread-change\"\n  data-book=\"0\"\n  data-direction=\"1\"\n  class=\"pager-right\"></div>\n<div class=\"left book-shadow\"></div>\n<div class=\"right book-shadow\"></div>\n";});
});
window.require.register("templates/image", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


    buffer += "\n<div class=\"image\">\n  <img src=\"";
    foundHelper = helpers.image_src;
    if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
    else { stack1 = depth0.image_src; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
    buffer += escapeExpression(stack1) + "\" />\n</div>\n";
    return buffer;});
});
window.require.register("templates/intro-video", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    


    return "\n<div>\n  <div class=\"box\" style=\"width:854px; height:480px;\">\n    <div class=\"btn-close\" action=\"pitchbookBox-close\"></div>\n    <iframe width=\"854\" height=\"480\" src=\"http://www.youtube.com/embed/YLxnRz9yKU8??version=3&amphl=en&amphd=1&ampfs=1&ampshowinfo=0&ampcontrols=1&amprel=0&ampautohide=1\" frameborder=\"0\" allowfullscreen></iframe>\n  </div>\n</div>\n";});
});
window.require.register("templates/loading", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    


    return "\n<div class=\"loading\"></div>\n";});
});
window.require.register("templates/page", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


    buffer += "\n<div class=\"";
    foundHelper = helpers.side;
    if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
    else { stack1 = depth0.side; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
    buffer += escapeExpression(stack1) + "\" data-page=\"";
    foundHelper = helpers.side;
    if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
    else { stack1 = depth0.side; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
    buffer += escapeExpression(stack1) + "\"></div>\n";
    return buffer;});
});
window.require.register("templates/page_overlay", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    


    return "\n<div class=\"book-overlay\"></div>\n";});
});
window.require.register("templates/spread", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    


    return "\n<section></section>\n";});
});
window.require.register("templates/spreads_container", function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    


    return "\n<div class=\"book-spreads\"></div>\n";});
});
