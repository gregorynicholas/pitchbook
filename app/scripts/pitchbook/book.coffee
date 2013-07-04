SpreadContainer = require './spreadcontainer'
Spread = require './spread'
preloader = require '../img-preloader'


exports = {}
$d = $(document)

NEXT = 1
PREV = -1


###*
 * core pitchbook class
 *
 * animation is largely built from the example on:
 * http://www.html5rocks.com/en/tutorials/casestudies/20things_pageflip/
###
exports.Pitchbook = class Pitchbook

  constructor: (settings)->
    @settings =
      # dimensions of the whole book
      SPREAD_WIDTH: 860
      SPREAD_HEIGHT: 532
      # dimensions of one page in the book
      PAGE_WIDTH: 430
      PAGE_HEIGHT: 515
      VERTICAL_OUTDENT: 0.2
      # the canvas size equals to the book dimensions + padding
      CANVAS_PADDING: 0
      # vertical spacing between the top edge of the book
      # and the papers
      PAGE_Y: 0
      # interval rate the animation function is called
      ANIM_INTERVAL_RATE: 1
      # when not dragging or being controlled by mouse position,
      # these values determine movement speed..
      MOVE_NEXT_SPEED: 25
      MOVE_PREV_SPEED: 25
      # value which affects speed of the ease effect,
      # usually between 0.2 to 0.5
      EASE: 0.35
      AUTO_SHOW: true
      AUTO_PRELOAD: true
      # ignores speed values and configures it to run slloowww
      SLOW_MOTION: false

    if window.Touch?
      @settings.MOVE_NEXT_SPEED = 40 * 2
      @settings.MOVE_PREV_SPEED = 40 * 2
      @settings.EASE += 0.45 * 0.5

    if settings?
      $.extend @settings, settings

    @settings.PAGE_Y = Math.ceil(
      (@settings.SPREAD_HEIGHT - @settings.PAGE_HEIGHT) / 2)

    if @settings.SLOW_MOTION
      @settings.ANIM_INTERVAL_RATE = 100
      @settings.MOVE_NEXT_SPEED = 4
      @settings.MOVE_PREV_SPEED = 4

    @init()


  init: ->
    @in_progress = false
    @current_spread_index = 0
    @$outer = @settings.$container

    @$contents = @$outer.find "[data-book-contents]"
    @hide()

    spreads_container = new SpreadContainer()
    @$contents.append spreads_container.$el

    @total_spreads = @settings.spreads.length
    @spreads = @create_spreads(@settings.spreads)
    spreads_container.set_spreads @spreads

    @$contents
      .css({
        position: "relative"
        width: @settings.PAGE_WIDTH * 2
        height: @settings.PAGE_HEIGHT
      })
    @$canvas = @create_canvas()
    @context = @$canvas.getContext("2d")

    @$contents.append(spreads_container.$el)
    spreads_container.$el.prepend @$canvas

    # todo: move these out
    @$pager_left = @$outer.find ".pager-left"
    @$pager_right = @$outer.find ".pager-right"

    # @pages = @init_spreads()
    @current_load = 0
    @load_spread()
    @canvas_left = $(@$canvas).offset().left
    @bind_events()
    @is_last = false
    @set_at_first true
    if not window.Touch?
      @disable_text_selection()
    $d.trigger "pitchbook-book-show-start", [@]
    @


  create_spreads: (items) ->
    i = 0
    rv = []
    while i < items.length
      if not items[i].left? then break
      if not items[i].right? then break
      rv.push(new Spread({
        data: items[i]
        index: i
        book: @
      }))
      i++
    return rv


  create_canvas: ->
    # Create and insert canvas element
    rv = document.createElement "canvas"

    # Resize the canvas to match the book size
    rv.width = @settings.SPREAD_WIDTH
    rv.height = @settings.SPREAD_HEIGHT + (@settings.CANVAS_PADDING * 2)

    # Offset the canvas so that it's padding is evenly spread around the book
    rv.style.top = @settings.CANVAS_PADDING
    rv.style.left = 0
    rv.style.position = "absolute"
    rv.style.zIndex = 100
    rv.style.cursor = "default"
    rv


  hide: ->
    @$outer.css("opacity", 0)


  show: ->
    $d.trigger('pitchbook-spread-show', [@])
    @$outer.animate {opacity: 1}, 800, "easeOutExpo"


  load_spread: ->
    if @current_load >= @total_spreads
      return
    _ctx = @
    spread = @spreads[@current_load]

    onload = ($img, o)->
      spread.loaded = true
      if _ctx.current_load is 1 and _ctx.settings.AUTO_SHOW
        _ctx.show()
        cb = ->
          _ctx.current_load += 1
          _ctx.load_spread()
        setTimeout cb, 100
      else
        if _ctx.settings.AUTO_PRELOAD
          _ctx.current_load += 1
          _ctx.load_spread()

    p1 =
      $container: spread.pages.left.$el
      src: spread.pages.left.settings.url
      on_preload: onload

    p2 =
      $container: spread.pages.right.$el
      src: spread.pages.right.settings.url

    preloader.preload(p1, p2)


  get_current_spread: ->
    return @spreads[@current_spread_index]


  bind_events: ->
    _ctx = @
    @$outer.bind "pitchbook-spread-change", (e, dir) ->
      if _ctx.in_progress then return
      _ctx.pager_click e, dir

    $d.bind "keydown.pitchbook", (e) ->
      if _ctx.in_progress then return
      switch e.keyCode
        # 27
        when $.ui.keyCode.ESCAPE, $.ui.keyCode.RIGHT
          _ctx.pager_click e, 1
        when $.ui.keyCode.LEFT
          _ctx.pager_click e, -1
      true

    @$canvas.addEventListener "mousemove", (e) ->
      _ctx.on_mousemove e

    @$canvas.addEventListener "mouseout", (e) ->
      _ctx.on_mouseout e

    @$contents.on "click", (e) ->
      _ctx.on_click e

    @


  # these prevent highlighting issues when dragging..

  disable_text_selection: ->
    $d.on "selectstart", ".book-body *", (e)->
      e.preventDefault()
      return false
    # @$contents.find("*").each (iterator, el) ->
    #   $(el).on "selectstart", (e) ->
    #     e.preventDefault()
    #     false
    @

  blur: ->
    @$contents.find("*").blur()
    @


  set_in_progress: (active) ->
    if not active? or active is true
      @in_progress = true
      # @$contents.addClass "in-progress"
    else
      @in_progress = false
      # @$contents.removeClass "in-progress"
    @


  set_at_first: (active) ->
    if not active? or active is true
      @is_first = true
      @$contents.addClass("first")
      @$pager_left
        .addClass("disabled")
        .css("opacity", 0.05)

    else
      @is_first = false
      @$contents.removeClass("first")
      @$pager_left
        .removeClass("disabled")
        .css("opacity", 0.2)
    @


  set_at_last: (active) ->
    if not active? or active is true
      @is_last = true
      @$contents.addClass("last")
      @$pager_right
        .addClass("disabled")
        .css("opacity", 0.05)

    else
      @is_last = false
      @$contents.removeClass("last")
      @$pager_right
        .removeClass("disabled")
        .css("opacity", 0.2)
    @


  touchstart: (e) ->
    e.preventDefault()
    if @in_progress then return
    if @$contents.data "dragging"
      if @touch_start_x < @settings.PAGE_WIDTH
        @touch_direction = -1
      else
        @touch_direction = 1
    else
      @$contents.data "dragging", true
      @touch_start_x = e.touches[0].clientX - @canvas_left

    # cache the value of the x coord of the event,
    # ontouchmove, if x is less than start_x

    # which page is going to be swiped
    if e.touches.length is 1
      $d.trigger(
        "pitchbook-spread-gesture-start",
        [@, @touch_direction, @touch_start_x])
    @


  touchmove: (e) ->
    if @in_progress then return
    e.preventDefault()
    # only deal with one finger
    if e.touches.length is 1
      touch = e.touches[0]
    @


  touchend: (e) ->
    e.preventDefault()
    @$contents.data "dragging", false
    if @in_progress then return

    # only deal with one finger
    if e.touches.length is 1
      @touch_end_x = e.touches[0].clientX - @canvas_left

      # if start x is greater than end x, and user is swiping left to go forward, return
      if @touch_end_x > @touch_start_x and @touch_direction is 1
        return
      # if start x is less than end x, and user is swiping right to go back, return
      if @touch_end_x < @touch_start_x and @touch_direction is -1
        return

      @$next = @get_spread(@touch_direction)
    if @$next?
      @turn(@get_current_spread(), @touch_direction)
    @


  on_click: (e) ->
    e.preventDefault()
    if @in_progress then return
    # get which page the user clicks on by position..
    mouse =
      x: e.clientX - @canvas_left
      y: e.clientY - @$canvas.offsetTop
    @like_page()
    @


  get_spread: (dir) ->
    if dir < 0 and @current_spread_index is 0
      return null
    if dir > 0 and @current_spread_index >= @total_spreads
      return null
    @spreads[@current_spread_index + dir]

  prev_spread: ->
    @spreads[@current_spread_index - 1]

  next_spread: ->
    @spreads[@current_spread_index + 1]


  like_page: (page) ->
    @set_in_progress true
    _ctx = @
    cb = ->
      _ctx.$contents.animate {opacity: 1}, 350, ->
        _ctx.set_in_progress false
    @$contents.animate {opacity: 0.3}, 250, ->
      setTimeout cb, 50
    @


  on_mousemove: (e) ->
    if @in_progress then return
    mouse =
      x: e.offsetX
      y: e.offsetY

    if mouse.x < @settings.PAGE_WIDTH
      # left side
      @$contents
        .removeClass("book-over-right")
        .addClass("book-over-left")

    else
      # right side
      @$contents.removeClass("book-over-left")
      if not @is_last
        @$contents.addClass("book-over-right")
    @


  on_mouseout: (e) ->
    mouse =
      x: e.clientX - @canvas_left
      y: e.clientY - @$canvas.offsetTop
    @$contents
      .removeClass("book-over-left")
      .removeClass("book-over-right")
    @


  pager_click: (e, dir) ->
    if not window.Touch?
      @blur()
    @$next = @get_spread(dir)
    if @$next?
      @turn(@get_current_spread(), dir)
    @


  ###*
   * @param  {Spread} spread     current spread that is to be turned
   * @param  {Number} direction  -1 to move prev, 1 to move next
  ###
  turn: (spread, direction) ->
    if @in_progress then return
    $d.trigger "pitchbook-spread-change-before", [@, spread, direction]
    @set_in_progress true
    @turn_direction = direction

    if @turn_direction is 1
      @current_x = @settings.PAGE_WIDTH / 2
    else
      @current_x = -(@settings.PAGE_WIDTH / 2)

    # because of the interval not precise, reset the page positions..
    i = @current_spread_index
    # because of the interval not precise, reset the css
    # on the spreads..
    while i < @spreads.length
      @spreads[i].reset()
      i++

    # determine if @ first + last position
    if @turn_direction is 1 and @is_first
      @set_at_first false
    if @turn_direction is -1 and @is_last
      @set_at_last false

    # kickoff the turn..
    @progress = @turn_direction
    @target = @turn_direction
    @run_turn_animation(spread)
    @


  run_turn_animation: (spread)->
    # set the animation callback..
    _ctx = @
    _run = ->
      is_complete = _ctx.on_turn_progress(spread)
      if is_complete
        _ctx.on_turn_complete(spread)
    @_intvl = setInterval(_run, @settings.ANIM_INTERVAL_RATE)


  clear_animation: ->
    if @_intvl?
      clearInterval @_intvl
      delete @_intvl


  # the target + progress are used in conjunction to create the easing effect.

  # they are used to determine how far the page should currently be folded,
  # -1 means all the way to the left, 0 means the dead center of the spread
  # and +1 means the right most edge of the spread

  # progress and target values with the pages are used to determine where the
  # animating, folding page should be drawn.

  ease: ->
    return @target - @progress


  calculate_target: ->
    # when dragging is enabled, the @current_x is the event.mouse.x
    return Math.max(Math.min(@current_x / @settings.PAGE_WIDTH, 1), -1)


  calculate_progress: ->
    return @settings.EASE * (@ease() * @settings.EASE)


  calculate_movement_next: ->
    return @current_x + (
      -(@settings.MOVE_NEXT_SPEED + (@ease() * 2)))


  calculate_movement_prev: ->
    rv = (@current_x + @settings.MOVE_PREV_SPEED) + (@ease() * 2)
    return rv


  ###*
   * @param  {Spread} spread  the spread being turned, animating out of display
   * @return {Boolean}        returns true when page turn animation completes progress
  ###
  on_turn_progress: (spread) ->
    @clear_canvas()

    # ease progress towards the target value..
    @target = @calculate_target()
    @progress += @calculate_progress()

    progress_done_thres = 0.997
    progress_abs = Math.abs(@progress)

    if progress_abs < progress_done_thres
      @animate(spread)

    # when not dragging or being controlled by mouse position,
    # calculate the movement..
    if @turn_direction is 1
      @current_x = @calculate_movement_next()

    else
      @current_x = @calculate_movement_prev()

    # console.info(
    #   '@progress', @progress,
    #   '@target', @target,
    #   '@current_x', @current_x)

    if @turn_direction is 1 and progress_abs > progress_done_thres
      return true

    if @turn_direction is -1 and @progress > progress_done_thres
      return true

    return false


  # reset the pixels in the canvas
  clear_canvas: ->
    # TODO: there is a huge performance hit here..
    # need to find a better solution
    @context.clearRect(0, 0, @$canvas.width, @$canvas.height)


  ###*
   * @param  {Spread} spread  the spread being turned, animating out of display
  ###
  on_turn_complete: (spread) ->
    @clear_animation()
    $d.trigger "pitchbook-spread-change", [@]

    # after the turn completes animating, update the current
    # spread index
    @current_spread_index += @turn_direction
    new_spread = @get_current_spread()
    if new_spread?
      new_spread.pages.left.$el.css({
        width: @settings.PAGE_WIDTH
        left: 0
      })

    @set_in_progress false

    if not @next_spread()?
      @set_at_last true
    if not @prev_spread()?
      @set_at_first true

    $d.trigger "pitchbook-spread-change-after", [@]
    @


  ###*
   * @param  {Spread} spead  spread being turned, animating out of display.
  ###
  animate: (spread) ->
    if @turn_direction is 1
      return @animate_next spread
    else
      return @animate_prev spread


  ###*
   * @param  {Spread} spread  the spread being turned, animating out of display
  ###
  animate_prev: (spread) ->
    pw = @settings.PAGE_WIDTH

    # strength of the fold is strongest in the middle of the book..
    strength = 1 - Math.abs(@progress)

    # width of the folded page..
    fold_w = (pw / 2) * (1 - @progress)

    # X position of the folded page..
    fold_x = pw * @progress + fold_w

    # how far the page should outdent vertically due to perspective
    vertical_outdent = @settings.VERTICAL_OUTDENT * strength

    # the max width of the left and right page shadows..
    page_shadow_w = ((pw * 0.5) * Math.max(Math.min(1 - @progress, 0.5), 0))
    right_shadow_w = ((pw * 0.5) * Math.max(Math.min(strength, 0.5), 0))
    left_shadow_w = ((pw * 0.5) * Math.max(Math.min(strength, 0.5), 0))

    w = pw - (fold_w - fold_x)
    w = if w >= pw then pw else w

    @$next.pages.left.$el.css({width: w})

    # moves the [left page] right alongside the page curl
    x = fold_x + (pw - fold_w)
    w = if fold_w < 1.5 then 0 else fold_w

    spread.pages.left.$el.css({left: x, width: w})

    if x >= pw - 2
      # adds 1px: for some reason it was calculating
      # a pixel too thin, creating a 1px right border
      right_width = Math.ceil(Math.abs(fold_w - fold_x) + 1)
      @$next.pages.right.$el.css({width: right_width})

      # moves the [right page] to the [crop]
      # made by the [left page moving right]
      next_right_width = Math.ceil(Math.abs(pw - right_width))
      next_right_left = Math.ceil(pw + (pw - next_right_width)) + right_width

      spread.pages.right.$el.css({
        left: next_right_left
        marginLeft: -(right_width * 2)
      })

    @context.save()

    v1 = @settings.CANVAS_PADDING + (@settings.SPREAD_WIDTH / 2)
    v2 = @settings.PAGE_Y + @settings.CANVAS_PADDING
    @context.translate v1, v2

    # draw a sharp shadow on the right side of the page
    str = strength * 0.15
    @context.strokeStyle = "rgba(0,0,0, #{str})"
    @context.lineWidth = 20 * strength
    @context.beginPath()
    @context.moveTo(fold_x, -vertical_outdent * 0.5)
    @context.lineTo(fold_x, @settings.PAGE_HEIGHT + (vertical_outdent * 0.5))
    @context.stroke()

    # right side drop shadow
    r_shadow_gradient = @context.createLinearGradient(
      fold_x, 0, fold_x + right_shadow_w, 0)
    str = strength * 0.45
    r_shadow_gradient.addColorStop(0, "rgba(0,0,0, #{str})")
    r_shadow_gradient.addColorStop(1, "rgba(0,0,0,0)")
    @context.fillStyle = r_shadow_gradient
    @context.beginPath()
    @context.moveTo(fold_x, 0)
    @context.lineTo(fold_x + right_shadow_w, 0)
    @context.lineTo(fold_x + right_shadow_w, @settings.PAGE_HEIGHT)
    @context.lineTo(fold_x, @settings.PAGE_HEIGHT)
    @context.fill()

    # left side drop shadow
    grad =
      x1: fold_x - fold_w - left_shadow_w
      x2: fold_x - fold_w
      y1: 0
      y2: 0

    l_shadow_gradient = @context.createLinearGradient(
      grad.x1, grad.y1, grad.x2, grad.y2)
    str = strength * 0.2
    l_shadow_gradient.addColorStop(1, "rgba(0,0,0, #{str})")
    l_shadow_gradient.addColorStop(0, "rgba(0,0,0,0)")
    @context.fillStyle = l_shadow_gradient
    @context.beginPath()
    @context.moveTo(fold_x - fold_w - left_shadow_w, 0)
    @context.lineTo(fold_x - fold_w, 0)
    @context.lineTo(fold_x - fold_w, @settings.PAGE_HEIGHT)
    @context.lineTo(fold_x - fold_w - left_shadow_w, @settings.PAGE_HEIGHT)
    @context.fill()

    grad =
      x1: fold_x - page_shadow_w
      x2: fold_x
      y1: 0
      y2: 0

    fold_gradient = @context.createLinearGradient(
      grad.x1, grad.y1, grad.x2, grad.y2)
    str = 0.35 * strength
    fold_gradient.addColorStop(0.35, "rgba(255,255,255, #{str})")
    fold_gradient.addColorStop(0.73, "rgba(0,0,0, #{str})")
    fold_gradient.addColorStop(0.9, "rgba(255,255,255, #{str})")
    fold_gradient.addColorStop(1.0, "rgba(0,0,0, #{str})")
    @context.fillStyle = fold_gradient
    @context.strokeStyle = "rgba(0,0,0, 0.06)"
    @context.lineWidth = 0.5

    # draw the folded piece of paper
    @context.beginPath()
    @context.moveTo fold_x, 0
    @context.lineTo fold_x, @settings.PAGE_HEIGHT
    @context.quadraticCurveTo(
      fold_x,
      @settings.PAGE_HEIGHT + (vertical_outdent * 2),
      fold_x - fold_w,
      @settings.PAGE_HEIGHT + vertical_outdent)
    @context.lineTo fold_x - fold_w, -vertical_outdent
    @context.quadraticCurveTo(
      fold_x,
      -vertical_outdent * 2,
      fold_x,
      0)
    @context.fill()
    @context.stroke()
    @context.restore()
    @


  ###*
   * @param  {Spread} spread
  ###
  animate_next: (spread) ->
    pw = @settings.PAGE_WIDTH
    pw_half = pw * 0.5

    # strength of the fold is strongest in the middle of the spread,
    # where the progress value is closest to 0..
    strength = 1 - Math.abs(@progress)

    # width of the folded page..
    fold_w = pw_half * (1 - @progress)
    # X position of the folded page..
    fold_x = pw * @progress + fold_w
    fold_right_x = fold_x - fold_w

    # how far the page should outdent vertically due to perspective
    vertical_outdent = @settings.VERTICAL_OUTDENT * strength

    # the max width of the left and right page shadows..
    page_shadow_w  = pw_half * Math.max(Math.min(1 - @progress, 0.5), 0)
    left_shadow_w  = pw_half * Math.max(Math.min(strength, 0.5), 0)
    right_shadow_w = pw_half * Math.max(Math.min(strength, 0.5), 0)

    spread.pages.right.$el.css({"marginLeft": 0})

    next_left = pw + fold_right_x
    @$next.pages.right.$el.css("marginLeft", 0)
    @$next.pages.left.$el.css({
      width: pw - fold_x
      left: next_left
    })

    w = pw + fold_right_x
    if w < 1.5
      spread.pages.right.$el.css("width", 0)
      spread.pages.left.$el.css {width: 0, left: 0}

    else if fold_w > pw / 2
      spread.pages.right.$el.css("width", 0)
      spread.pages.left.$el.css("width", w)

    else
      spread.pages.right.$el.css("width", Math.ceil(fold_right_x))
    @context.save()

    v1 = @settings.CANVAS_PADDING + (@settings.SPREAD_WIDTH / 2)
    v2 = @settings.PAGE_Y + @settings.CANVAS_PADDING
    @context.translate v1, v2

    # draw a sharp shadow on the left side of the page
    @draw_fold_sharp_left_shadow(
      @context, fold_x, fold_w, strength, vertical_outdent)

    # right side drop shadow
    grad =
      x1: fold_x
      x2: fold_x + right_shadow_w
      y1: 0
      y2: 0

    r_shadow_alpha = strength * 0.2
    r_shadow_gradient = @set_gradient @context, grad
    r_shadow_gradient.addColorStop(1, "rgba(0,0,0, 0)")
    r_shadow_gradient.addColorStop(0.25, "rgba(0,0,0, #{r_shadow_alpha})")
    r_shadow_gradient.addColorStop(0, "rgba(0,0,0, 0)")
    @context.fillStyle = r_shadow_gradient
    @context.beginPath()
    @context.moveTo(fold_x, 0)
    @context.lineTo(fold_x + right_shadow_w, 0)
    @context.lineTo(fold_x + right_shadow_w, @settings.PAGE_HEIGHT)
    @context.lineTo(fold_x, @settings.PAGE_HEIGHT)
    @context.fill()

    # left side drop shadow
    grad =
      x1: fold_right_x - left_shadow_w
      x2: fold_right_x
      y1: 0
      y2: 0

    l_shadow_alpha = strength * 0.15
    l_shadow_gradient = @set_gradient @context, grad
    l_shadow_gradient.addColorStop(1, "rgba(0,0,0, #{l_shadow_alpha})")
    l_shadow_gradient.addColorStop(0, "rgba(0,0,0, 0)")
    @context.fillStyle = l_shadow_gradient
    @context.beginPath()
    @context.moveTo(fold_right_x - left_shadow_w, 0)
    @context.lineTo(fold_right_x, 0)
    @context.lineTo(fold_right_x, @settings.PAGE_HEIGHT)
    @context.lineTo(fold_right_x - left_shadow_w, @settings.PAGE_HEIGHT)
    @context.fill()

    @set_fold_gradients(
      fold_x - page_shadow_w,
      fold_x,
      0,
      0,
      strength)

    # draw the folded piece of paper
    @context.beginPath()
    @context.moveTo fold_x, 0
    @context.lineTo fold_x, @settings.PAGE_HEIGHT

    @context.quadraticCurveTo(
      fold_x,
      @settings.PAGE_HEIGHT + (vertical_outdent * 2),
      fold_right_x,
      @settings.PAGE_HEIGHT + vertical_outdent)

    @context.lineTo fold_right_x, -vertical_outdent

    @context.quadraticCurveTo(
      fold_x,
      -vertical_outdent * 2,
      fold_x,
      0)

    @context.fill()
    @context.stroke()
    @context.restore()
    @


  # draws a sharp shadow on the left side of the page
  draw_fold_sharp_left_shadow: (ctx, x1, x2, strength, vert_outdent)->
    # set the shadow width to roughly 12% of the page width
    shadow_w = Math.ceil((@settings.PAGE_WIDTH * 0.12) * strength)
    shadow_alpha = 0.1 * strength

    y1 = vert_outdent * 0.5
    y2 = y1 + @settings.PAGE_HEIGHT
    x = (x1 - x2) - shadow_w / 2

    ctx.strokeStyle = "rgba(0,0,0, #{shadow_alpha})"
    ctx.lineWidth = shadow_w
    ctx.beginPath()
    ctx.moveTo(x, -y1)
    ctx.lineTo(x, y2)
    ctx.stroke()
    @


  set_gradient: (ctx, options)->
    ctx.createLinearGradient options.x1, options.y1, options.x2, options.y2


  ###*
   * gradient applied to the folded paper (highlights & shadows)

     @param x1  the X coordinate of the start of the gradient
     @param x2  the X coordinate of the end of the gradient
     @param y1
     @param y2
     @param strength
    ###
  set_fold_gradients: (x1, x2, y1, y2, strength) ->
    alpha = 0.35 * strength
    rv = @context.createLinearGradient x1, y1, x2, y2
    rv.addColorStop(0.35, "rgba(255,255,255, #{alpha})")
    rv.addColorStop(0.73, "rgba(0,0,0, #{alpha})")
    rv.addColorStop(0.9, "rgba(255,255,255, #{alpha})")
    rv.addColorStop(1.0, "rgba(0,0,0, #{alpha})")
    @context.fillStyle = rv
    @context.strokeStyle = "rgba(0,0,0, 0.06)"
    @context.lineWidth = 0.5
    @


  pause: ->
    # cache the state of the things..
    @_paused_progress = @progress
    @_paused_intvl = @_intvl
    # reset the state
    if @turn_direction is 1
      @progress = -1
    else
      @progress = 0
    @clear_animation()
    @


  ###*
   * unbind all events
  ###
  destroy: ->
    @$outer.unbind()
    @$contents.find("*").unbind()
    $(@$canvas).unbind()
    @


module.exports = exports
